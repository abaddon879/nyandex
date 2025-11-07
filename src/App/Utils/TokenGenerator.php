<?php
declare(strict_types=1);

namespace App\Utils;

/**
 * Trait for generating secure API tokens.
 */
trait TokenGenerator
{
    /**
     * Generates a new, cryptographically secure API key.
     *
     * @return array [
     * 'raw' => 'the 64-char key to send to the user',
     * 'hashed' => 'the sha256 hash to store in the database'
     * ]
     */
    protected function generateToken(): array
    {
        // 32 bytes of random data, hex-encoded to 64 characters
        $rawToken = bin2hex(random_bytes(32));
        
        // Hash the raw token for database storage
        $hashedToken = hash('sha256', $rawToken);
        
        return [
            'raw' => $rawToken,
            'hashed' => $hashedToken,
        ];
    }
}