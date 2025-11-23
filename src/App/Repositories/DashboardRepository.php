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

    public function getDashboardData(int $user_id): array
    {
        $pinnedUnitsData = $this->getPinnedUnits($user_id);
        
        return [
            'my_progress' => $this->getMyProgress($user_id),
            'ready_to_evolve' => $this->getReadyToEvolve($user_id),
            'pinned_units' => $pinnedUnitsData['units'],
            'evolution_materials' => $this->getInventoryGroup($user_id, [
                'Catseed', 'Catfruit', 'Material', 'Material Z', 'Behemoth Stone', 'Behemoth Gem'
            ]),
            'catseyes' => $this->getInventoryGroup($user_id, ['Catseye']),
            'xp_tracker' => $this->getXpTracker($user_id, $pinnedUnitsData['total_xp_needed'])
        ];
    }

    // ... (getMyProgress and getReadyToEvolve remain unchanged) ...
    private function getMyProgress(int $user_id): array
    {
        $sqlUser = "SELECT 
                        (SELECT COUNT(cat_id) FROM user_cat WHERE user_id = ?) as owned,
                        (SELECT COUNT(uc.cat_id) FROM user_cat uc
                         JOIN cat_form cf ON uc.cat_id = cf.cat_id AND uc.form_id = cf.form_id
                         WHERE uc.user_id = ? AND cf.form_id = 3) as true_forms,
                        (SELECT COALESCE(SUM(`level` + plus_level), 0) FROM user_cat WHERE user_id = ?) as user_rank";
        
        $stmtUser = $this->pdo->prepare($sqlUser);
        $stmtUser->execute([$user_id, $user_id, $user_id]);
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
            'user_rank'        => (int)$userProgress['user_rank']
        ];
    }
    
    private function getReadyToEvolve(int $user_id): array
    {
        $sql = "SELECT 
                    uc.cat_id, 
                    c.rarity_id,
                    cf_next.form_name as next_form_name,
                    cf_next.image_url
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
                ORDER BY c.rarity_id DESC, uc.`level` DESC";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$user_id, $user_id, $user_id]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    private function getPinnedUnits(int $user_id): array
    {
        // 1. Fetch Catseye Item Definitions from DB for mapping
        // We need these to inject correct item_id/image_url for the generated requirements
        $eyeSql = "SELECT item_id, item_name, image_url FROM item WHERE item_type = 'Catseye'";
        $eyeStmt = $this->pdo->query($eyeSql);
        $catseyes = $eyeStmt->fetchAll(PDO::FETCH_ASSOC);
        
        $eyeMap = [];
        foreach ($catseyes as $eye) {
            // Map 'Uber Rare Catseye' -> 'Uber Rare'
            $key = trim(str_replace('Catseye', '', $eye['item_name']));
            $eyeMap[$key] = $eye;
        }
        // Map Rarity ID to string key to match our $eyeMap
        $rarityMap = [
            1 => 'Special', 2 => 'Rare', 3 => 'Super Rare', 4 => 'Uber Rare', 5 => 'Legend'
        ];

        // 2. Main Query to fetch pinned units and their requirements
         $nextEvoSubquery = "
            SELECT 
                p.cat_id, 
                c.rarity_id, 
                c.max_level as unit_max_cap,
                COALESCE(uc.form_id, 1) as current_form_id,
                cf_current.form_name as current_form_name,
                cf_current.image_url as current_image_url,
                next_form.form_id as next_form_id,
                next_form.required_level,
                next_form.required_xp,
                (COALESCE(uc.level, 1) + COALESCE(uc.plus_level, 0)) as user_total_level,
                COALESCE(uc.level, 1) as user_base_level,
                COALESCE(xp.item_quantity, 0) as user_xp
            FROM user_pinned_cat p
            JOIN cat c ON p.cat_id = c.cat_id
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
            SELECT 
                evo.cat_id, 
                evo.rarity_id,
                evo.unit_max_cap,
                evo.user_base_level,
                evo.current_form_name as form_name,
                evo.current_image_url as unit_image,
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

            SELECT 
                evo.cat_id, 
                evo.rarity_id,
                evo.unit_max_cap,
                evo.user_base_level,
                evo.current_form_name as form_name,
                evo.current_image_url as unit_image,
                'xp' as missing_type,
                (SELECT item_id FROM item WHERE item_type = 'XP' LIMIT 1) as item_id,
                'XP' as item_name,
                (SELECT image_url FROM item WHERE item_type = 'XP' LIMIT 1) as image_url,
                evo.required_xp as needed,
                evo.user_xp as owned,
                (evo.required_xp - evo.user_xp) as deficit
            FROM ($nextEvoSubquery) AS evo
            WHERE evo.user_xp < evo.required_xp

            UNION ALL

            SELECT 
                evo.cat_id, 
                evo.rarity_id,
                evo.unit_max_cap,
                evo.user_base_level,
                evo.current_form_name as form_name,
                evo.current_image_url as unit_image,
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
        // Bind params for subqueries (3) and main query (1 for item join) = 4
        // The array needs to match the ? placeholders in order.
        // 1. user_id (uc join), 2. user_id (xp join), 3. user_id (p.user_id where), 
        // 4. user_id (item join), 
        // 5. user_id (uc join), 6. user_id (xp join), 7. user_id (p.user_id where),
        // 8. user_id (uc join), 9. user_id (xp join), 10. user_id (p.user_id where)
        $params = array_fill(0, 10, $user_id);
        $stmt->execute($params);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // 3. Post-Process Results (Convert 'level' to Catseyes)
        $units = [];
        $processedRows = [];

        foreach ($rows as $row) {
            // Logic: If missing_type is 'level' and it's a standard unit (rarity > 0),
            // check if we are in "Catseye Territory" (> Level 30).
            if ($row['missing_type'] === 'level' && $row['rarity_id'] > 0) {
                $currentBase = (int)$row['user_base_level'];
                $targetTotal = (int)$row['needed'];
                $currentTotal = (int)$row['owned'];
                $rarityKey = $rarityMap[$row['rarity_id']] ?? null;
                
                // Calculate target base level needed
                $levelsToGain = $targetTotal - $currentTotal;
                $targetBase = $currentBase + $levelsToGain;

                // If target is above 30, we need eyes.
                if ($targetBase > 30 && $rarityKey) {
                    // --- Phase 1: Standard Eyes (30 -> 50) ---
                    $stdEyes = 0;
                    $stdStart = max(30, $currentBase);
                    $stdEnd = min(50, $targetBase);
                    
                    if ($stdStart < 50 && $targetBase > 30) {
                        if ($stdStart < 45) $stdEyes += (min(45, $stdEnd) - $stdStart) * 1;
                        if ($stdEnd > 45)   $stdEyes += ($stdEnd - max(45, $stdStart)) * 2;
                    }

                    // --- Phase 2: Dark Eyes (50 -> 60) ---
                    $darkEyes = 0;
                    if ($targetBase > 50) {
                        $darkStart = max(50, $currentBase);
                        $darkEnd = min(60, $targetBase);
                        
                        if ($darkStart < 55) $darkEyes += (min(55, $darkEnd) - $darkStart) * 1;
                        if ($darkEnd > 55)   $darkEyes += ($darkEnd - max(55, $darkStart)) * 2;
                    }

                    // Add generated requirement rows
                    if ($stdEyes > 0 && isset($eyeMap[$rarityKey])) {
                        $processedRows[] = $this->createItemRow($row, $eyeMap[$rarityKey], $stdEyes);
                    }
                    if ($darkEyes > 0 && isset($eyeMap['Dark'])) {
                        $processedRows[] = $this->createItemRow($row, $eyeMap['Dark'], $darkEyes);
                    }
                    
                    // If we still have levels < 30 to gain, keep a partial level row
                    if ($currentBase < 30) {
                        $xpLevels = 30 - $currentBase;
                        // If target is less than 30, we just need levels. 
                        // If target is > 30, we need 30-currentBase levels.
                        $neededXpLevels = min($levelsToGain, $xpLevels);
                        
                        if ($neededXpLevels > 0) {
                            $row['deficit'] = $neededXpLevels;
                            $processedRows[] = $row;
                        }
                    }
                    continue; // Don't add the original 'level' row if we converted it
                }
            }
            
            // If no conversion occurred, add original row
            $processedRows[] = $row;
        }

        // 4. Calculate Total XP Needed (unchanged logic)
        $stmtXp = $this->pdo->prepare("
            SELECT COALESCE(SUM(cf.required_xp), 0) 
            FROM user_pinned_cat p 
            JOIN cat_form cf ON p.cat_id = cf.cat_id 
            LEFT JOIN user_cat uc ON p.cat_id = uc.cat_id AND p.user_id = ?
            WHERE p.user_id = ? 
            AND cf.form_id = (SELECT MIN(f.form_id) FROM cat_form f WHERE f.cat_id = p.cat_id AND f.form_id > COALESCE(uc.form_id, 1))
        ");
        $stmtXp->execute([$user_id, $user_id]);
        $totalXpNeeded = (int)$stmtXp->fetchColumn();

        // 5. Group into Unit objects
        foreach ($processedRows as $item) {
            $catId = $item['cat_id'];
            if (!isset($units[$catId])) {
                $units[$catId] = [
                    'cat_id' => $catId,
                    'rarity_id' => (int)$item['rarity_id'],
                    'form_name' => $item['form_name'],
                    'unit_image' => $item['unit_image'],
                    'missing_requirements' => []
                ];
            }
            
            // Prevent duplicate item rows if multiple sources require same item (rare but safe)
            $exists = false;
            foreach ($units[$catId]['missing_requirements'] as $existing) {
                if ($existing['type'] === 'item' && $existing['item_name'] === $item['item_name']) {
                    // Just add to deficit if it exists (e.g. double requirements)
                    $existing['deficit'] += $item['deficit']; 
                    $exists = true; 
                    break;
                }
            }

            if (!$exists) {
                $units[$catId]['missing_requirements'][] = [
                    'type' => $item['missing_type'],
                    'item_name' => $item['item_name'],
                    'image_url' => $item['image_url'],
                    'needed' => (int)$item['needed'],
                    'owned' => (int)$item['owned'],
                    'deficit' => (int)$item['deficit'],
                ];
            }
        }

        return [
            'units' => array_values($units),
            'total_xp_needed' => $totalXpNeeded
        ];
    }
    
    // Helper to transform a level row into an item row
    private function createItemRow($baseRow, $itemInfo, $deficit) {
        $newRow = $baseRow;
        $newRow['missing_type'] = 'item';
        $newRow['item_id'] = $itemInfo['item_id'];
        $newRow['item_name'] = $itemInfo['item_name'];
        $newRow['image_url'] = $itemInfo['image_url'];
        $newRow['deficit'] = $deficit;
        $newRow['needed'] = $deficit; 
        // We set owned to 0 here because this widget focuses on what's *missing*.
        // The frontend just shows the deficit number next to the icon.
        $newRow['owned'] = 0; 
        return $newRow;
    }

    // ... (getInventoryGroup and getXpTracker unchanged) ...
    private function getInventoryGroup(int $user_id, array $item_types): array
    {
        $placeholders = implode(',', array_fill(0, count($item_types), '?'));
        
        $sql = "SELECT i.item_id, i.item_name, i.image_url, i.item_type, ui.item_quantity
                FROM user_item ui
                JOIN item i ON ui.item_id = i.item_id
                WHERE ui.user_id = ? AND i.item_type IN ($placeholders)
                ORDER BY i.item_id ASC";
        
        $params = array_merge([$user_id], $item_types);
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

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
            'needed_xp' => $totalXpNeeded,
            'deficit_xp' => ($currentXp - $totalXpNeeded)
        ];
    }
}