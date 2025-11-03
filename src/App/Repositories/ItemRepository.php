<?php
declare(strict_types=1);

namespace App\Repositories;

use App\Database;
use PDO;

class ItemRepository
{
    public function __construct(private Database $database)
    {
    }

    /**
     * Fetches all static item definitions from the database.
     *
     * @return array A list of all items.
     */
    public function getAll(): array
    {
        $sql = "SELECT item_id, item_type, item_name, image_url
                FROM item
                ORDER BY item_id ASC";
        
        $pdo = $this->database->getConnection();
        $stmt = $pdo->query($sql);
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Helper for GetItem middleware.
     * Fetches a single static item definition by its ID.
     *
     * @param int $item_id The item's ID.
     * @return array|false The record, or false if not found.
     */
    public function getById(int $item_id): array|false
    {
        $sql = "SELECT * FROM item WHERE item_id = :item_id";
        
        $pdo = $this->database->getConnection();
        $stmt = $pdo->prepare($sql);
        $stmt->execute(['item_id' => $item_id]);
        
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
}