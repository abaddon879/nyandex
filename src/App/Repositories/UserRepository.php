<?php
declare(strict_types=1);

namespace App\Repositories;

use PDO;

class UserRepository
{
    private PDO $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    /**
     * Finds a user by their username OR email.
     * (Fixes "Undefined method 'findByUsernameOrEmail'")
     *
     * @return array|null The user record as an associative array, or null if not found.
     */
    public function findByUsernameOrEmail(string $identifier): ?array
    {
        $sql = "SELECT * FROM user WHERE username = ? OR email = ?";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$identifier, $identifier]);        
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return $result ?: null;
    }

    /**
     * Creates a new anonymous user record.
     * (Fixes "Undefined method 'createAnonymous'")
     *
     * @return int|null The new user's ID, or null on failure.
     */
    public function createAnonymous(): ?int
    {
        // We set anonymous to true (1) and update the timestamps
        $sql = "INSERT INTO user (anonymous, created_at, last_accessed_at) 
                VALUES (1, NOW(), NOW())";
        
        $stmt = $this->db->prepare($sql);
        
        if ($stmt->execute()) {
            return (int)$this->db->lastInsertId();
        }
        
        return null;
    }

    /**
     * Updates a user's details.
     * (Required by RegisteredUserController::create)
     */
    public function update(int $userId, array $data): bool
    {
        // Dynamically build the SET part of the query
        $setClauses = [];
        foreach (array_keys($data) as $key) {
            // Basic sanitization to prevent SQL injection in keys
            if (preg_match('/^[a-zA-Z0-9_]+$/', $key)) {
                 $setClauses[] = "$key = :$key";
            }
        }
        
        if (empty($setClauses)) {
            return false; // No valid fields to update
        }

        $setString = implode(', ', $setClauses);

        $sql = "UPDATE user SET $setString WHERE user_id = :user_id";
        
        $stmt = $this->db->prepare($sql);
        
        // Add the user_id to the parameters and execute
        $data['user_id'] = $userId;
        return $stmt->execute($data);
    }

    /**
     * Deletes a user.
     * (Required by RegisteredUserController::delete)
     *
     * Note: The ON DELETE CASCADE in your db_setup_v1.sql
     *
     * ensures all their auth_tokens, user_cats, etc., are also deleted.
     */
    public function delete(int $userId): bool
    {
        $sql = "DELETE FROM user WHERE user_id = :user_id";
        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
        return $stmt->execute();
    }
}