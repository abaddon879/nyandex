<?php
declare(strict_types=1);

namespace App\Repositories;

use App\Database;
use PDO;

class DashboardRepository
{
    private PDO $pdo;

    public function __construct(private Database $database)
    {
        $this->pdo = $this->database->getConnection();
    }

    /**
     * Implements API Spec 2.1: Get Dashboard Data
     * Fetches all calculated data for the user's dashboard.
     */
    public function getDashboardData(int $user_id): array
    {
        $pinnedUnitsData = $this->getPinnedUnits($user_id);

        $dashboard = [
            'my_progress' => $this->getMyProgress($user_id),
            'ready_to_evolve' => $this->getReadyToEvolve($user_id),
            'pinned_units' => $pinnedUnitsData['units'],
            'evolution_materials' => $this->getInventoryGroup($user_id, ['Catseed', 'Catfruit', 'Material', 'Material Z']),
            'catseyes' => $this->getInventoryGroup($user_id, ['Catseye']),
            'xp_tracker' => $this->getXpTracker($user_id, $pinnedUnitsData['total_xp_needed'])
        ];

        return $dashboard;
    }

    /**
     * Widget 1: My Progress (Working)
     */
    private function getMyProgress(int $user_id): array
    {
        $sqlUser = "SELECT 
                        (SELECT COUNT(cat_id) FROM user_cat WHERE user_id = ?) as owned,
                        (SELECT COUNT(uc.cat_id) FROM user_cat uc
                         JOIN cat_form cf ON uc.cat_id = cf.cat_id AND uc.form_id = cf.form_id
                         WHERE uc.user_id = ? AND cf.form_id = 3) as true_forms";
        
        $stmtUser = $this->pdo->prepare($sqlUser);
        $stmtUser->execute([$user_id, $user_id]);
        $userProgress = $stmtUser->fetch(PDO::FETCH_ASSOC);

        $sqlTotals = "SELECT
                        (SELECT COUNT(cat_id) FROM cat) as total_cats,
                        (SELECT COUNT(DISTINCT cat_id) FROM cat_form WHERE form_id = 3) as total_true_forms";

        $stmtTotals = $this->pdo->query($sqlTotals);
        $totals = $stmtTotals->fetch(PDO::FETCH_ASSOC);

        return [
            'cats_owned_count' => (int)$userProgress['owned'],
            'cats_owned_total' => (int)$totals['total_cats'],
            'true_forms_count' => (int)$userProgress['true_forms'],
            'true_forms_total' => (int)$totals['total_true_forms'],
        ];
    }

    /**
     * Widget 2: Ready to Evolve (Working)
     */
    private function getReadyToEvolve(int $user_id): array
    {
        $sql = "SELECT 
                    uc.cat_id, 
                    c.rarity_id,
                    cf_next.form_name as next_form_name
                FROM user_cat uc
                JOIN cat_form cf_next ON uc.cat_id = cf_next.cat_id
                JOIN cat c ON uc.cat_id = c.cat_id
                WHERE uc.user_id = ?
                AND cf_next.form_id = (
                    SELECT MIN(cf_min.form_id) 
                    FROM cat_form cf_min 
                    WHERE cf_min.cat_id = uc.cat_id AND cf_min.form_id > uc.form_id
                )
                AND (uc.`level` + uc.plus_level) >= cf_next.required_level
                AND NOT EXISTS (
                    SELECT 1
                    FROM cat_form_requirement req
                    LEFT JOIN user_item ui ON req.item_id = ui.item_id AND ui.user_id = ?
                    WHERE req.cat_id = uc.cat_id 
                      AND req.form_id = cf_next.form_id
                      AND (ui.item_quantity IS NULL OR ui.item_quantity < req.item_qty)
                )
                AND (
                    cf_next.required_xp IS NULL OR cf_next.required_xp = 0 OR
                    (SELECT ui.item_quantity FROM user_item ui
                     JOIN item i ON ui.item_id = i.item_id
                     WHERE ui.user_id = ? AND i.item_type = 'XP') >= cf_next.required_xp
                )
                GROUP BY uc.cat_id
                ORDER BY c.rarity_id DESC, uc.`level` DESC
                LIMIT 5";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$user_id, $user_id, $user_id]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Widget 3: Pinned Units
     */
    private function getPinnedUnits(int $user_id): array
    {
        $nextEvoSubquery = "
            SELECT 
                p.cat_id, 
                COALESCE(uc.form_id, 1) as current_form_id,
                cf_current.form_name as current_form_name,
                next_form.form_id as next_form_id,
                next_form.required_level,
                next_form.required_xp,
                (COALESCE(uc.level, 1) + COALESCE(uc.plus_level, 0)) as user_total_level,
                COALESCE(xp.item_quantity, 0) as user_xp
            FROM user_pinned_cat p
            LEFT JOIN user_cat uc ON p.cat_id = uc.cat_id AND p.user_id = ?
            JOIN cat_form cf_current ON p.cat_id = cf_current.cat_id AND cf_current.form_id = COALESCE(uc.form_id, 1)
            LEFT JOIN user_item xp ON xp.item_id = (SELECT item_id FROM item WHERE item_type = 'XP' LIMIT 1) AND xp.user_id = ?
            JOIN cat_form next_form ON next_form.cat_id = p.cat_id
            WHERE p.user_id = ?
            AND next_form.form_id = (
                SELECT MIN(cf_min.form_id) 
                FROM cat_form cf_min 
                WHERE cf_min.cat_id = p.cat_id AND cf_min.form_id > COALESCE(uc.form_id, 1)
            )
        ";

        $sql = "
            -- Query 1: Find missing items
            SELECT 
                evo.cat_id, 
                evo.current_form_name as form_name,
                'item' as missing_type,
                req.item_id,
                i.item_name,
                i.image_url,
                req.item_qty AS needed,
                COALESCE(ui.item_quantity, 0) AS owned,
                (req.item_qty - COALESCE(ui.item_quantity, 0)) AS deficit
            FROM ($nextEvoSubquery) AS evo
            JOIN cat_form_requirement req ON evo.cat_id = req.cat_id AND evo.next_form_id = req.form_id
            JOIN item i ON req.item_id = i.item_id
            LEFT JOIN user_item ui ON req.item_id = ui.item_id AND ui.user_id = ?
            WHERE (ui.item_quantity IS NULL OR ui.item_quantity < req.item_qty)

            UNION ALL

            -- Query 2: Find missing XP
            SELECT 
                evo.cat_id, 
                evo.current_form_name as form_name,
                'xp' as missing_type,
                NULL as item_id,
                'XP' as item_name,
                NULL as image_url,
                evo.required_xp as needed,
                evo.user_xp as owned,
                (evo.required_xp - evo.user_xp) as deficit
            FROM ($nextEvoSubquery) AS evo
            WHERE evo.user_xp < evo.required_xp

            UNION ALL

            -- Query 3: Find missing Levels
            SELECT 
                evo.cat_id, 
                evo.current_form_name as form_name,
                'level' as missing_type,
                NULL as item_id,
                'Level' as item_name,
                NULL as image_url,
                evo.required_level as needed,
                evo.user_total_level as owned,
                (evo.required_level - evo.user_total_level) as deficit
            FROM ($nextEvoSubquery) AS evo
            WHERE evo.user_total_level < evo.required_level
        ";
        
        $stmt = $this->pdo->prepare($sql);
        // [FIX] We now have 10 parameters to bind
        $params = [$user_id, $user_id, $user_id, $user_id, $user_id, $user_id, $user_id, $user_id, $user_id, $user_id];
        $stmt->execute($params);
        $missingRequirements = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Query for Total XP needed
        $sqlXp = "SELECT COALESCE(SUM(cf.required_xp), 0) as total_xp
                  FROM user_pinned_cat p
                  LEFT JOIN user_cat uc ON p.cat_id = uc.cat_id AND p.user_id = ?
                  JOIN cat_form cf ON p.cat_id = cf.cat_id
                  WHERE p.user_id = ?
                  AND cf.form_id = (
                        SELECT MIN(cf_min.form_id) 
                        FROM cat_form cf_min 
                        WHERE cf_min.cat_id = p.cat_id AND cf_min.form_id > COALESCE(uc.form_id, 1)
                  )";
        
        $stmtXp = $this->pdo->prepare($sqlXp);
        $stmtXp->execute([$user_id, $user_id]);
        $totalXpNeeded = (int)$stmtXp->fetchColumn();

        // (The rest of the method is for formatting and is correct)
        $units = [];
        foreach ($missingRequirements as $item) {
            $catId = $item['cat_id'];
            if (!isset($units[$catId])) {
                $units[$catId] = [
                    'cat_id' => $catId,
                    'form_name' => $item['form_name'],
                    'missing_requirements' => []
                ];
            }
            $units[$catId]['missing_requirements'][] = [
                'type' => $item['missing_type'],
                'item_name' => $item['item_name'],
                'image_url' => $item['image_url'],
                'needed' => (int)$item['needed'],
                'owned' => (int)$item['owned'],
                'deficit' => $item['deficit'] ? (int)$item['deficit'] : 0,
                // [FIX] Redundant 'xp_needed' field removed
            ];
        }

        return [
            'units' => array_values($units),
            'total_xp_needed' => $totalXpNeeded
        ];
    }

    /**
     * Widgets 4 & 5: Evolution Materials & Catseyes (Working)
     */
    private function getInventoryGroup(int $user_id, array $item_types): array
    {
        $placeholders = implode(',', array_fill(0, count($item_types), '?'));
        
        $sql = "SELECT i.item_name, i.image_url, i.item_type, ui.item_quantity
                FROM user_item ui
                JOIN item i ON ui.item_id = i.item_id
                WHERE ui.user_id = ? AND i.item_type IN ($placeholders)
                ORDER BY i.item_id ASC";
        
        $params = array_merge([$user_id], $item_types);
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Widget 6: XP Tracker (Working)
     */
    private function getXpTracker(int $user_id, int $totalXpNeeded): array
    {
        $sql = "SELECT ui.item_quantity 
                FROM user_item ui
                JOIN item i ON ui.item_id = i.item_id
                WHERE ui.user_id = :id AND i.item_type = 'XP'";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute(['id' => $user_id]);
        $currentXp = (int)$stmt->fetchColumn();

        return [
            'current_xp' => $currentXp,
            'needed_xp' => $totalXpNeeded, // [FIX] Corrected variable name from $totalXtNeeded
            'deficit_xp' => ($currentXp - $totalXpNeeded)
        ];
    }
}