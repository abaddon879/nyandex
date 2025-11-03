<?php
declare(strict_types=1);

namespace App\Repositories;

use App\Database;

class UserRepository
{
    public function __construct(private Database $database)
    {
    }

    /**
     * Creates a new user (anonymous or registered)
     *
     * @param array $data Associative array of data to insert
     * @return string|false The new user's ID, or false on failure.
     */
    public function create(array $data): string|false
    {
        $allowedColumns = [
            'username', 
            'email', 
            'password_hash', 
            'api_key_hash', 
            'anonymous', 
            'last_accessed_at'
        ];

        $columns = [];
        $placeholders = [];
        $values = [];

        foreach ($allowedColumns as $column) {
            if (array_key_exists($column, $data)) {
                $columns[] = $column;
                $placeholders[] = ":$column";
                $values[$column] = $data[$column];
            }
        }

        if (empty($columns)) {
            throw new \InvalidArgumentException("No valid data provided for user creation");
        }

        $sql = sprintf(
            'INSERT INTO user (%s) VALUES (%s)',
            implode(', ', $columns),
            implode(', ', $placeholders)
        );

        $pdo = $this->database->getConnection();
        $stmt = $pdo->prepare($sql);

        foreach ($values as $param => $value) {
            $stmt->bindValue(":$param", $value);
        }
        
        $success = $stmt->execute();

        if ($success) {
            return $pdo->lastInsertId();
        }

        return false;
    }

    /**
     * Finds a user by a specific column.
     * (Your v0.5 code is already perfect here)
     */
    // [FIX] Removed the accidental 'publicf' from this spot
    public function find(string $column, $value): array|bool
    {
        $allowedColumns = ['user_id', 'username', 'email', 'api_key_hash'];

        if (!in_array($column, $allowedColumns)) {
            throw new \InvalidArgumentException("Invalid column name specified");
        }
        
        $sql = "SELECT * FROM user WHERE $column = :value";

        $pdo = $this->database->getConnection();
        $stmt = $pdo->prepare($sql);
        $stmt->bindValue(':value', $value);
        $stmt->execute();

        return $stmt->fetch();
    }

    /**
     * Dynamically updates a user's record.
     * Used by SessionController (login/logout) and RegisteredUserController (convert).
     */
    public function update(string|int $user_id, array $data): bool
    {
        $allowedColumns = [
            'username',
            'email',
            'password_hash',
            'api_key_hash',
            'anonymous',
            'verified',
            'last_accessed_at',
            'modified_at'
        ];

        $setClauses = [];
        $values = [];

        foreach ($allowedColumns as $column) {
            if (array_key_exists($column, $data)) {
                $setClauses[] = "$column = :$column";
                $values[$column] = $data[$column];
            }
        }

        if (empty($setClauses)) {
            throw new \InvalidArgumentException("No valid data provided for user update");
        }
        
        $values['user_id'] = $user_id;

        $sql = sprintf(
            'UPDATE user SET %s WHERE user_id = :user_id',
            implode(', ', $setClauses)
        );

        $pdo = $this->database->getConnection();
        $stmt = $pdo->prepare($sql);

        foreach ($values as $param => $value) {
            $stmt->bindValue(":$param", $value);
        }
        
        return $stmt->execute();
    }

    /**
     * Updates the last_accessed_at timestamp for a user.
     * This is called by the RequireAPIKey middleware.
     */
    public function updateLastAccessed(string|int $user_id): bool
    {
        $sql = "UPDATE user
                SET last_accessed_at = CURRENT_TIMESTAMP
                WHERE user_id = :user_id";

        $pdo = $this->database->getConnection();
        $stmt = $pdo->prepare($sql);
        $stmt->bindValue(':user_id', $user_id);

        return $stmt->execute();
    }

    /**
     * Deletes a user from the database.
     * This is called by RegisteredUserController's delete method.
     */
    public function delete(string|int $user_id): bool
    {
        $sql = "DELETE FROM user WHERE user_id = :user_id";

        $pdo = $this->database->getConnection();
        $stmt = $pdo->prepare($sql);
        $stmt->bindValue(':user_id', $user_id);

        return $stmt->execute();
    }
}