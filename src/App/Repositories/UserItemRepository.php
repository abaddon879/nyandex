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
     * Calculates the number of Catseyes needed to reach max_level.
     * * Rules:
     * Phase 1 (Standard Eyes - Special/Rare/Super/Uber/Legend):
     * - Level 30 -> 45: 1 Eye per level (15 total)
     * - Level 45 -> 50: 2 Eyes per level (10 total)
     * * Phase 2 (Dark Eyes - Only if max_level > 50):
     * - Level 50 -> 55: 1 Dark Eye per level (5 total)
     * - Level 55 -> 60: 2 Dark Eyes per level (10 total)
     */
    private function calculateCatseyeDeficits(int $user_id): array
    {
        $pdo = $this->database->getConnection();
        
        // [UPDATED] Fetch max_level from the cat table definition
        $sql = "SELECT uc.level, c.rarity_id, c.max_level
                FROM user_cat uc
                JOIN cat c ON uc.cat_id = c.cat_id
                WHERE uc.user_id = :user_id
                AND c.rarity_id > 0"; // Exclude Normal Cats

        $stmt = $pdo->prepare($sql);
        $stmt->execute(['user_id' => $user_id]);
        $cats = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $needed = [
            'Special' => 0,
            'Rare' => 0,
            'Super Rare' => 0,
            'Uber Rare' => 0,
            'Legend' => 0,
            'Dark' => 0 // [NEW] Track Dark Catseyes
        ];

        $rarityMap = [
            1 => 'Special',
            2 => 'Rare',
            3 => 'Super Rare',
            4 => 'Uber Rare',
            5 => 'Legend'
        ];

        foreach ($cats as $cat) {
            $currentLevel = (int)$cat['level'];
            $maxLevel = (int)$cat['max_level']; // e.g. 50 or 60
            $rarityKey = $rarityMap[$cat['rarity_id']] ?? null;

            if (!$rarityKey) continue;

            // --- Phase 1: Standard Eyes (Up to Level 50) ---
            // We only care if the cat CAN go above 30, and hasn't reached 50 yet.
            // We cap this calculation at 50 or the unit's max_level, whichever is lower.
            $phase1Cap = min(50, $maxLevel);
            
            if ($currentLevel < $phase1Cap) {
                $start = max(30, $currentLevel);
                
                // 30 -> 45 (1 per level)
                if ($start < 45 && $phase1Cap > 30) {
                    $end = min(45, $phase1Cap);
                    $needed[$rarityKey] += ($end - $start) * 1;
                }

                // 45 -> 50 (2 per level)
                if ($phase1Cap > 45) {
                    $startPhase1B = max(45, $start);
                    $end = $phase1Cap;
                    if ($startPhase1B < $end) {
                        $needed[$rarityKey] += ($end - $startPhase1B) * 2;
                    }
                }
            }

            // --- Phase 2: Dark Eyes (Level 50 to 60) ---
            // Only applies if the unit's max_level is actually > 50
            if ($maxLevel > 50 && $currentLevel < $maxLevel) {
                $start = max(50, $currentLevel);
                
                // 50 -> 55 (1 Dark Eye per level)
                if ($start < 55) {
                    $end = min(55, $maxLevel);
                    $needed['Dark'] += ($end - $start) * 1;
                }

                // 55 -> 60 (2 Dark Eyes per level)
                if ($maxLevel > 55) {
                    $startPhase2B = max(55, $start);
                    $end = $maxLevel;
                    if ($startPhase2B < $end) {
                        $needed['Dark'] += ($end - $startPhase2B) * 2;
                    }
                }
            }
        }

        return $needed;
    }
}