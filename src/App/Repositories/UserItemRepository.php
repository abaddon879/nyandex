<?php
declare(strict_types=1);

namespace App\Repositories;

use App\Database;
use PDO;

class UserItemRepository
{
    public function __construct(private Database $database)
    {
    }

    /**
     * Fetch User's Inventory + "Smart" Needed Counts
     * Returns item_quantity (owned) and quantity_needed (for next evolutions AND catseyes).
     */
    public function findByUser(int $user_id): array
    {
        // 1. Standard Query: Gets Inventory + Evo Material Needs (via SQL)
        $sql = "
        SELECT 
            i.item_id, 
            i.item_name, 
            i.image_url, 
            i.item_type,
            COALESCE(ui.item_quantity, 0) as item_quantity,
            (
                SELECT COALESCE(SUM(req.item_qty), 0)
                FROM user_cat uc
                JOIN cat_form cf_next ON uc.cat_id = cf_next.cat_id
                JOIN cat_form_requirement req ON cf_next.cat_id = req.cat_id AND cf_next.form_id = req.form_id
                WHERE uc.user_id = :user_id_sub
                  AND req.item_id = i.item_id
                  AND cf_next.form_id = (
                      SELECT MIN(f.form_id) 
                      FROM cat_form f 
                      WHERE f.cat_id = uc.cat_id AND f.form_id > uc.form_id
                  )
            ) as quantity_needed
        FROM item i
        LEFT JOIN user_item ui ON i.item_id = ui.item_id AND ui.user_id = :user_id
        ORDER BY i.item_id ASC";
        
        $pdo = $this->database->getConnection();
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            'user_id' => $user_id,
            'user_id_sub' => $user_id
        ]);
        
        $items = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // 2. Calculate Catseye Deficits (PHP Logic)
        $catseyeDeficits = $this->calculateCatseyeDeficits($user_id);

        // 3. Merge Catseye calculations into the result set
        foreach ($items as &$item) {
            if ($item['item_type'] === 'Catseye') {
                // Extract rarity from name (e.g., "Uber Rare Catseye" -> "Uber Rare")
                // This assumes item names are like "Special Catseye", "Rare Catseye", etc.
                $rarityName = trim(str_replace('Catseye', '', $item['item_name']));
                
                if (isset($catseyeDeficits[$rarityName])) {
                    $item['quantity_needed'] = $catseyeDeficits[$rarityName];
                }
            }
        }
        
        return $items;
    }

    public function findByUserAndItem(int $user_id, int $item_id): array|false
    {
        $sql = "SELECT item_id, item_quantity
                FROM user_item
                WHERE user_id = :user_id AND item_id = :item_id";
        
        $pdo = $this->database->getConnection();
        $stmt = $pdo->prepare($sql);
        $stmt->execute(['user_id' => $user_id, 'item_id' => $item_id]);
        
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function upsert(array $data): bool
    {
        $sql = "INSERT INTO user_item (user_id, item_id, item_quantity, created_at, modified_at)
                VALUES (:user_id, :item_id, :item_quantity, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                ON DUPLICATE KEY UPDATE
                    item_quantity = VALUES(item_quantity),
                    modified_at = CURRENT_TIMESTAMP";
        
        $pdo = $this->database->getConnection();
        $stmt = $pdo->prepare($sql);

        $stmt->bindValue(':user_id', $data['user_id']);
        $stmt->bindValue(':item_id', $data['item_id']);
        $stmt->bindValue(':item_quantity', $data['item_quantity']);
        
        return $stmt->execute();
    }

    public function delete(int $user_id, int $item_id): bool
    {
        $sql = "DELETE FROM user_item WHERE user_id = :user_id AND item_id = :item_id";
        
        $pdo = $this->database->getConnection();
        $stmt = $pdo->prepare($sql);
        
        return $stmt->execute(['user_id' => $user_id, 'item_id' => $item_id]);
    }

    /**
     * Calculates the number of Catseyes needed to max all owned units to Level 50.
     * Rules:
     * - Level 30->45: 1 Eye per level
     * - Level 45->50: 2 Eyes per level
     * - Excludes Normal Cats (Rarity 0)
     */
    private function calculateCatseyeDeficits(int $user_id): array
    {
        $pdo = $this->database->getConnection();
        
        // Fetch all owned cats with their rarity and current level
        $sql = "SELECT uc.level, c.rarity_id
                FROM user_cat uc
                JOIN cat c ON uc.cat_id = c.cat_id
                WHERE uc.user_id = :user_id
                AND c.rarity_id > 0"; // Exclude Normal Cats

        $stmt = $pdo->prepare($sql);
        $stmt->execute(['user_id' => $user_id]);
        $cats = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Initialize counters matching Item Names
        $needed = [
            'Special' => 0,
            'Rare' => 0,
            'Super Rare' => 0,
            'Uber Rare' => 0,
            'Legend' => 0
        ];

        // Map DB rarity_id to Item Name Key
        $rarityMap = [
            1 => 'Special',
            2 => 'Rare',
            3 => 'Super Rare',
            4 => 'Uber Rare',
            5 => 'Legend'
        ];

        foreach ($cats as $cat) {
            $level = (int)$cat['level'];
            $rarityKey = $rarityMap[$cat['rarity_id']] ?? null;

            // Only calculate if we have a valid rarity and the cat is not yet level 50
            if ($rarityKey && $level < 50) {
                
                // Logic: We assume the user WILL boost them to 30 with XP first.
                // So we only count eyes needed from max(30, current_level).
                $startLevel = max(30, $level);

                // Phase 1: Level 30 to 45 (1 Eye per level)
                if ($startLevel < 45) {
                    $levelsToGain = 45 - $startLevel;
                    $needed[$rarityKey] += $levelsToGain * 1;
                }

                // Phase 2: Level 45 to 50 (2 Eyes per level)
                // If startLevel is below 45, we still need to cover 45->50 fully.
                // If startLevel is 47, we need 47->50.
                $startLevelPhase2 = max(45, $startLevel);
                
                if ($startLevelPhase2 < 50) {
                    $levelsToGain = 50 - $startLevelPhase2;
                    $needed[$rarityKey] += $levelsToGain * 2;
                }
            }
        }

        return $needed;
    }
}