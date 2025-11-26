<?php
declare(strict_types=1);

namespace App\Repositories;

use App\Database;
use PDO;

class CatRepository
{
    public function __construct(private Database $database)
    {
    }

    /**
     * Implements API Spec 3.1: Fetch Base Cat List Data
     */
    public function getBaseCatList(): array
    {
        $pdo = $this->database->getConnection();

        $sqlCats = "SELECT cat_id, cat_order_id, rarity_id
                    FROM cat
                    ORDER BY cat_order_id ASC";
        
        $stmtCats = $pdo->query($sqlCats);
        $cats = $stmtCats->fetchAll(PDO::FETCH_ASSOC);

        $sqlForms = "SELECT cat_id, form_id, form_name, image_url
                     FROM cat_form";
        
        $stmtForms = $pdo->query($sqlForms);
        $forms = $stmtForms->fetchAll(PDO::FETCH_ASSOC);

        $formsByCatId = [];
        foreach ($forms as $form) {
            $formsByCatId[$form['cat_id']][] = [
                'form_id' => (int)$form['form_id'],
                'form_name' => $form['form_name'],
                'icon_url' => $form['image_url']
            ];
        }

        $result = [];
        foreach ($cats as $cat) {
            $catId = $cat['cat_id'];
            $result[] = [
                'cat_id' => (int)$cat['cat_id'],
                'cat_order_id' => (int)$cat['cat_order_id'],
                'rarity_id' => (int)$cat['rarity_id'],
                'forms' => $formsByCatId[$catId] ?? []
            ];
        }

        return $result;
    }

    public function getById(int $cat_id): array|false
    {
        $pdo = $this->database->getConnection();
        $stmt = $pdo->prepare("SELECT * FROM cat WHERE cat_id = :id");
        $stmt->execute(['id' => $cat_id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Implements API Spec 3.3: Fetch Detailed Static Cat Data
     */
    public function getCatDetails(int $cat_id): array|false
    {
        $pdo = $this->database->getConnection();
        
        // 1. Get Base Cat Data
        $sql = "SELECT c.*, r.rarity_name 
                FROM cat c
                JOIN rarity r ON c.rarity_id = r.rarity_id
                WHERE c.cat_id = :id";
                
        $stmt = $pdo->prepare($sql);
        $stmt->execute(['id' => $cat_id]);
        $cat = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$cat) {
            return false;
        }

        // [NEW] Decode Level Curve
        $levelCurve = !empty($cat['level_curve']) ? json_decode($cat['level_curve']) : [];

        // 2. Get all Forms and their Stats
        // [UPDATED] to match new schema (hit_1_f, powers, etc)
        $sqlForms = "SELECT 
                        f.form_id, f.form_name, f.description, f.required_level, f.required_xp, f.image_url,
                        t.form_name as generic_form_name,
                        s.health, s.knockbacks, s.move_speed, s.attack_power, s.attack_range,
                        s.attack_frequency_f, s.attack_backswing_f,
                        s.recharge_time_f, s.cost, s.attack_type,
                        -- New Multi-Hit Columns
                        s.attack_hit_1_f, s.attack_hit_2_f, s.attack_hit_3_f,
                        s.attack_hit_1_power, s.attack_hit_2_power, s.attack_hit_3_power
                     FROM cat_form f
                     JOIN cat_form_stat s ON f.cat_id = s.cat_id AND f.form_id = s.form_id
                     JOIN form t ON f.form_id = t.form_id
                     WHERE f.cat_id = :id
                     ORDER BY f.form_id ASC";
        
        $stmt = $pdo->prepare($sqlForms);
        $stmt->execute(['id' => $cat_id]);
        $formsData = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // 3. Get all Traits
        $sqlTraits = "SELECT form_id, trait_id FROM cat_form_trait WHERE cat_id = :id";
        $stmt = $pdo->prepare($sqlTraits);
        $stmt->execute(['id' => $cat_id]);
        $traitsData = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $traitsByFormId = [];
        foreach ($traitsData as $trait) {
            $traitsByFormId[$trait['form_id']][] = (int)$trait['trait_id'];
        }

        // 4. Get all Evolution Requirements
        $sqlReqs = "SELECT 
                        r.form_id, r.item_id, r.item_qty,
                        i.item_name, i.image_url
                    FROM cat_form_requirement r
                    JOIN item i ON r.item_id = i.item_id
                    WHERE r.cat_id = :id";
        
        $stmt = $pdo->prepare($sqlReqs);
        $stmt->execute(['id' => $cat_id]);
        $reqsData = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $reqsByFormId = [];
        foreach ($reqsData as $req) {
            $reqsByFormId[$req['form_id']][] = [
                'item_id' => (int)$req['item_id'],
                'item_qty' => (int)$req['item_qty'],
                'item_name' => $req['item_name'],
                'image_url' => $req['image_url']
            ];
        }

        // 5. Assemble the final structured response
        $formsResult = [];
        foreach ($formsData as $form) {
            $formId = $form['form_id'];

            // [NEW] Build the Hits Array dynamically
            $hits = [];
            
            // Always add Hit 1
            $hits[] = [
                'damage' => (int)$form['attack_hit_1_power'],
                'frame' => (int)$form['attack_hit_1_f']
            ];

            // Add Hit 2 if it exists (frame > 0)
            if ((int)$form['attack_hit_2_f'] > 0) {
                $hits[] = [
                    'damage' => (int)$form['attack_hit_2_power'],
                    'frame' => (int)$form['attack_hit_2_f']
                ];
            }

            // Add Hit 3 if it exists
            if ((int)$form['attack_hit_3_f'] > 0) {
                $hits[] = [
                    'damage' => (int)$form['attack_hit_3_power'],
                    'frame' => (int)$form['attack_hit_3_f']
                ];
            }

            $formsResult[] = [
                'form_id' => (int)$formId,
                'form_name' => $form['form_name'],
                'generic_form_name' => $form['generic_form_name'],
                'description' => $form['description'],
                'image_url' => $form['image_url'],
                'evolution' => [
                    'required_level' => (int)$form['required_level'],
                    'required_xp' => (int)$form['required_xp'],
                    'requirements' => $reqsByFormId[$formId] ?? []
                ],
                'stats' => [
                    'health' => (int)$form['health'],
                    'knockbacks' => (int)$form['knockbacks'],
                    'move_speed' => (int)$form['move_speed'],
                    'attack_power' => (int)$form['attack_power'], // This is the SUM
                    'attack_range' => (int)$form['attack_range'],
                    'attack_frequency_f' => (int)$form['attack_frequency_f'],
                    'attack_backswing_f' => (int)$form['attack_backswing_f'],
                    'recharge_time_f' => (int)$form['recharge_time_f'],
                    'cost' => (int)$form['cost'],
                    'attack_type' => (int)$form['attack_type'],
                    'hit_count' => count($hits), // [NEW] Calculated dynamically
                    'hits' => $hits // [NEW] Array for the frontend
                ],
                'traits' => $traitsByFormId[$formId] ?? []
            ];
        }

        return [
            'cat_id' => (int)$cat['cat_id'],
            'rarity_id' => (int)$cat['rarity_id'],
            'rarity_name' => $cat['rarity_name'], // [NEW] Return the name directly
            'boostable' => (int)$cat['boostable'],
            'max_level' => (int)$cat['max_level'],
            'max_plus_level' => (int)$cat['max_plus_level'],
            'level_curve' => $levelCurve, // <--- Add this line
            'forms' => $formsResult
        ];
    }
}