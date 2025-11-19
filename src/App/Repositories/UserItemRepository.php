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
     * Returns item_quantity (owned) and quantity_needed (for next evolutions).
     */
    public function findByUser(int $user_id): array
    {
        // This query joins the user's cats to their NEXT form requirements
        // and sums them up per item.
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
                -- Join to find the NEXT form for each owned cat
                JOIN cat_form cf_next ON uc.cat_id = cf_next.cat_id
                JOIN cat_form_requirement req ON cf_next.cat_id = req.cat_id AND cf_next.form_id = req.form_id
                WHERE uc.user_id = :user_id_sub
                  AND req.item_id = i.item_id
                  -- Logic to find the immediate next form
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
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
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
}