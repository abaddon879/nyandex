<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Database;
use PDO;

class VersionRepository
{
    public function __construct(private Database $database)
    {    
    }

    public function getLatest(): ?array
    {
        $sql = 'SELECT * 
                FROM version v 
                ORDER BY   
                    CAST(SUBSTRING_INDEX(version_id, \'.\', 1) AS UNSIGNED) DESC,
                    CAST(SUBSTRING_INDEX(SUBSTRING_INDEX(version_id, \'.\', 2), \'.\', -1) AS UNSIGNED) DESC,
                    CAST(SUBSTRING_INDEX(version_id, \'.\', -1) AS UNSIGNED) DESC 
                LIMIT 1';
        
        $pdo = $this->database->getConnection();
        $stmt = $pdo->query($sql);

        // Fetch single result
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return $result ?: null; // Return null if no result found
    }

    public function getAll(): array
    {
        $sql = 'SELECT * FROM version v ORDER BY v.version_id DESC';
        
        $pdo = $this->database->getConnection();
        $stmt = $pdo->query($sql);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getById(string $version_id): ?array
    {
        $sql = 'SELECT * FROM version v WHERE v.version_id = :version_id';
        
        $pdo = $this->database->getConnection();        
        $stmt = $pdo->prepare($sql);
        $stmt->bindValue(':version_id', $version_id, PDO::PARAM_STR);
        $stmt->execute();

        // Fetch single result
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return $result ?: null; // Return null if no result found
    }

    public function create(array $data): array
    {
        $sql = 'INSERT INTO version (version_id, release_date' . 
           (isset($data['download_date']) ? ', download_date' : '') . 
           ') VALUES (:version_id, :release_date' . 
           (isset($data['download_date']) ? ', :download_date' : '') . 
           ')';
        $pdo = $this->database->getConnection();
        $stmt = $pdo->prepare($sql);

        $stmt->bindValue(':version_id', $data['version_id'], PDO::PARAM_STR);
        $stmt->bindValue(':release_date', $data['release_date'], PDO::PARAM_STR);
        // Bind download_date if it's provided
        if (isset($data['download_date'])) {
            $stmt->bindValue(':download_date', $data['download_date'], PDO::PARAM_STR);
        }

        $stmt->execute();

        return [
            'version_id' => $data['version_id'],
            'release_date' => $data['release_date'],
            'download_date' => $data['download_date'] ?? null,
            // Include other fields as needed
        ];
    }

    public function update(string $version_id, array $data): ?array
    {
        $sql = 'UPDATE version SET download_date = :download_date WHERE version_id = :version_id';
        $pdo = $this->database->getConnection();
        $stmt = $pdo->prepare($sql);
    
        $stmt->bindValue(':version_id', $version_id, PDO::PARAM_STR);
        if(isset($data['download_date'])) {
            $stmt->bindValue(':download_date', $data['download_date'], PDO::PARAM_STR);
        }
        $stmt->execute();

        if ($stmt->rowCount() === 0) {
            return null; // Version not found
        }

        return $this->getById($version_id); // Optionally return updated version
    }
}
