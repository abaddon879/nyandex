<?php
declare(strict_types=1);

namespace App\Repositories;

use PDO;

class AuthTokenRepository
{
    private PDO $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    /**
     * Creates a new auth token for a user.
     */
    public function create(int $userId, string $tokenHash, string $expiresAt): bool
    {
        $sql = "INSERT INTO auth_token (user_id, token_hash, expires_at, created_at)
                VALUES (:user_id, :token_hash, :expires_at, NOW())";
        
        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
        $stmt->bindValue(':token_hash', $tokenHash, PDO::PARAM_STR);
        $stmt->bindValue(':expires_at', $expiresAt, PDO::PARAM_STR);
        
        return $stmt->execute();
    }

    /**
     * Finds a valid user session by a token's hash.
     * This efficiently joins the user table to get all data at once.
     *
     * @return array|null The combined token and user data, or null if not found/expired.
     */
    public function findUserByTokenHash(string $tokenHash): ?array
    {
        $sql = "SELECT 
                    t.token_id, 
                    t.token_hash,
                    t.last_used_at,
                    u.user_id, 
                    u.username, 
                    u.email,
                    u.password_hash,
                    u.anonymous, 
                    u.verified, 
                    u.admin
                FROM auth_token t
                JOIN user u ON t.user_id = u.user_id
                WHERE t.token_hash = :token_hash 
                  AND t.expires_at > NOW()";
        
        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':token_hash', $tokenHash, PDO::PARAM_STR);
        $stmt->execute();
        
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return $result ?: null;
    }

    /**
     * Deletes a token from the database by its hash. (Used for logout)
     */
    public function deleteByHash(string $tokenHash): bool
    {
        $sql = "DELETE FROM auth_token WHERE token_hash = :token_hash";
        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':token_hash', $tokenHash, PDO::PARAM_STR);
        return $stmt->execute();
    }

    /**
     * Updates the last_used_at timestamp for a token.
     */
    public function updateLastUsed(int $tokenId): bool
    {
        $sql = "UPDATE auth_token SET last_used_at = NOW() WHERE token_id = :token_id";
        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':token_id', $tokenId, PDO::PARAM_INT);
        return $stmt->execute();
    }
}