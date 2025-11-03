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
     * Fetches minimal static info for all cats for the Catalog display.
     */
    public function getBaseCatList(): array
    {
        $pdo = $this->database->getConnection();

        // 1. Fetch all base cats
        $sqlCats = "SELECT cat_id, cat_order_id, rarity_id
                    FROM cat
                    ORDER BY cat_order_id ASC";
        
        $stmtCats = $pdo->query($sqlCats);
        $cats = $stmtCats->fetchAll(PDO::FETCH_ASSOC);

        // 2. Fetch all forms
        $sqlForms = "SELECT cat_id, form_id, form_name, image_url
                     FROM cat_form";
        
        $stmtForms = $pdo->query($sqlForms);
        $forms = $stmtForms->fetchAll(PDO::FETCH_ASSOC);

        // 3. Create a lookup map for forms
        $formsByCatId = [];
        foreach ($forms as $form) {
            $formsByCatId[$form['cat_id']][] = [
                'form_id' => (int)$form['form_id'],
                'form_name' => $form['form_name'],
                'icon_url' => $form['image_url']
            ];
        }

        // 4. Combine the data
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

    /**
     * [NEW METHOD]
     * A simple helper for middleware to find a base cat by its ID.
     */
    public function getById(int $cat_id): array|false
    {
        $pdo = $this->database->getConnection();
        $stmt = $pdo->prepare("SELECT * FROM cat WHERE cat_id = :id");
        $stmt->execute(['id' => $cat_id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Implements API Spec 3.3: Fetch Detailed Static Cat Data
     * Fetches all static details for a single cat.
     */
    public function getCatDetails(int $cat_id): array|false
    {
        $pdo = $this->database->getConnection();
        
        // 1. Get Base Cat Data
        $stmt = $pdo->prepare("SELECT * FROM cat WHERE cat_id = :id");
        $stmt->execute(['id' => $cat_id]);
        $cat = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$cat) {
            return false;
        }

        // 2. Get all Forms and their Stats
        $sqlForms = "SELECT 
                        f.form_id, f.form_name, f.description, f.required_level, f.required_xp, f.image_url,
                        s.health, s.knockbacks, s.move_speed, s.attack_power, s.attack_range,
                        s.attack_frequency_f, s.attack_foreswing_f, s.attack_backswing_f,
                        s.recharge_time_f, s.cost, s.attack_type, s.hit_count
                     FROM cat_form f
                     JOIN cat_form_stat s ON f.cat_id = s.cat_id AND f.form_id = s.form_id
                     WHERE f.cat_id = :id
                     ORDER BY f.form_id ASC";
        
        $stmt = $pdo->prepare($sqlForms);
        $stmt->execute(['id' => $cat_id]);
        $formsData = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // 3. Get all Traits (Many-to-Many)
        $sqlTraits = "SELECT form_id, trait_id FROM cat_form_trait WHERE cat_id = :id";
        $stmt = $pdo->prepare($sqlTraits);
        $stmt->execute(['id' => $cat_id]);
        $traitsData = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $traitsByFormId = [];
        foreach ($traitsData as $trait) {
            $traitsByFormId[$trait['form_id']][] = (int)$trait['trait_id'];
        }

        // 4. Get all Evolution Requirements (Many-to-Many)
        $sqlReqs = "SELECT form_id, item_id, item_qty FROM cat_form_requirement WHERE cat_id = :id";
        $stmt = $pdo->prepare($sqlReqs);
        $stmt->execute(['id' => $cat_id]);
        $reqsData = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $reqsByFormId = [];
        foreach ($reqsData as $req) {
            $reqsByFormId[$req['form_id']][] = [
                'item_id' => (int)$req['item_id'],
                'item_qty' => (int)$req['item_qty']
            ];
        }

        // 5. Assemble the final structured response
        $formsResult = [];
        foreach ($formsData as $form) {
            $formId = $form['form_id'];
            $formsResult[] = [
                'form_id' => (int)$formId,
                'form_name' => $form['form_name'],
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
                    'attack_power' => (int)$form['attack_power'],
                    'attack_range' => (int)$form['attack_range'],
                    'attack_frequency_f' => (int)$form['attack_frequency_f'],
                    'attack_foreswing_f' => (int)$form['attack_foreswing_f'],
                    'attack_backswing_f' => (int)$form['attack_backswing_f'],
                    'recharge_time_f' => (int)$form['recharge_time_f'],
                    'cost' => (int)$form['cost'],
                    'attack_type' => (int)$form['attack_type'],
                    'hit_count' => (int)$form['hit_count']
                ],
                'traits' => $traitsByFormId[$formId] ?? []
            ];
        }

        // Return the final combined object
        return [
            'cat_id' => (int)$cat['cat_id'],
            'rarity_id' => (int)$cat['rarity_id'],
            'boostable' => (int)$cat['boostable'],
            'max_level' => (int)$cat['max_level'],
            'max_plus_level' => (int)$cat['max_plus_level'],
            'forms' => $formsResult
        ];
    }
}