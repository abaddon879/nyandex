<?php
declare(strict_types=1);

namespace App\Repositories;

use App\Database;
use PDO;

class UserPinnedCatRepository
{
    public function __construct(private Database $database)
    {
    }

    /**
     * Fetches all pinned cat IDs for a specific user.
     * This will be used by the Dashboard.
     *
     * @param int $user_id The user's ID.
     * @return array A list of all pinned cat records.
     */
    public function findByUser(int $user_id): array
    {
        $sql = "SELECT cat_id, pinned_at
                FROM user_pinned_cat
                WHERE user_id = :user_id";
        
        $pdo = $this->database->getConnection();
        $stmt = $pdo->prepare($sql);
        $stmt->execute(['user_id' => $user_id]);
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Implements API Spec 5.4: Pin a Cat
     * Adds a cat to a user's pinned list.
     *
     * @param int $user_id The user's ID.
     * @param int $cat_id The cat's ID.
     * @return bool True on success, false on failure.
     */
    public function create(int $user_id, int $cat_id): bool
    {
        // We use 'INSERT IGNORE' to prevent a crash if the user
        // tries to pin a cat that is already pinned.
        $sql = "INSERT IGNORE INTO user_pinned_cat (user_id, cat_id, pinned_at)
                VALUES (:user_id, :cat_id, CURRENT_TIMESTAMP)";
        
        $pdo = $this->database->getConnection();
        $stmt = $pdo->prepare($sql);

        return $stmt->execute([
            'user_id' => $user_id,
            'cat_id' => $cat_id
        ]);
    }

    /**
     * Implements API Spec 5.5: Unpin a Cat
     * Removes a cat from a user's pinned list.
     *
     * @param int $user_id The user's ID.
     * @param int $cat_id The cat's ID.
     * @return bool True on success, false on failure.
     */
    public function delete(int $user_id, int $cat_id): bool
    {
        $sql = "DELETE FROM user_pinned_cat 
                WHERE user_id = :user_id AND cat_id = :cat_id";
        
        $pdo = $this->database->getConnection();
        $stmt = $pdo->prepare($sql);
        
        return $stmt->execute([
            'user_id' => $user_id,
            'cat_id' => $cat_id
        ]);
    }
}