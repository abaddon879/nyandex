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
     * Implements API Spec 3.4 & 4.1: Fetch User's Full Inventory
     * Fetches all item progress records for a specific user.
     *
     * @param int $user_id The user's ID.
     * @return array A list of all user_item records.
     */
    public function findByUser(int $user_id): array
    {
        // We JOIN with the 'item' table to get the name, image_url, and type
        // This is crucial for the Inventory Page API
        $sql = "SELECT 
                    i.item_id, 
                    i.item_name, 
                    i.image_url, 
                    i.item_type,
                    ui.item_quantity
                FROM user_item ui
                JOIN item i ON ui.item_id = i.item_id
                WHERE ui.user_id = :user_id
                ORDER BY i.item_id ASC";
        
        $pdo = $this->database->getConnection();
        $stmt = $pdo->prepare($sql);
        $stmt->execute(['user_id' => $user_id]);
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Helper for GetUserItem middleware.
     * Fetches a single item progress record for a user.
     *
     * @param int $user_id The user's ID.
     * @param int $item_id The item's ID.
     * @return array|false The record, or false if not found.
     */
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

    /**
     * Implements API Spec 4.2: Update Item Quantity (Auto-Save)
     * Creates or updates a user's quantity for a single item.
     * This uses ON DUPLICATE KEY UPDATE for an efficient "upsert".
     *
     * @param array $data Data array containing user_id, item_id, and item_quantity.
     * @return bool True on success, false on failure.
     */
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

    /**
     * Deletes an item from a user's inventory.
     *
     * @param int $user_id The user's ID.
     * @param int $item_id The item's ID.
     * @return bool True on success, false on failure.
     */
    public function delete(int $user_id, int $item_id): bool
    {
        $sql = "DELETE FROM user_item WHERE user_id = :user_id AND item_id = :item_id";
        
        $pdo = $this->database->getConnection();
        $stmt = $pdo->prepare($sql);
        
        return $stmt->execute(['user_id' => $user_id, 'item_id' => $item_id]);
    }
}