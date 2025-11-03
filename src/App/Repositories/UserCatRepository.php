<?php
declare(strict_types=1);

namespace App\Repositories;

use App\Database;
use PDO;

class UserCatRepository
{
    public function __construct(private Database $database)
    {
    }

    // ... (findByUser, findByUserAndCat, upsert, delete methods are all correct) ...
    public function findByUser(int $user_id): array
    {
        $sql = "SELECT cat_id, `level`, plus_level, form_id, notes
                FROM user_cat
                WHERE user_id = :user_id";
        
        $pdo = $this->database->getConnection();
        $stmt = $pdo->prepare($sql);
        $stmt->execute(['user_id' => $user_id]);
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function findByUserAndCat(int $user_id, int $cat_id): array|false
    {
        $sql = "SELECT cat_id, `level`, plus_level, form_id, notes
                FROM user_cat
                WHERE user_id = :user_id AND cat_id = :cat_id";
        
        $pdo = $this->database->getConnection();
        $stmt = $pdo->prepare($sql);
        $stmt->execute(['user_id' => $user_id, 'cat_id' => $cat_id]);
        
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function upsert(array $data): bool
    {
        $sql = "INSERT INTO user_cat (user_id, cat_id, `level`, plus_level, form_id, notes, created_at, modified_at)
                VALUES (:user_id, :cat_id, :level, :plus_level, :form_id, :notes, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                ON DUPLICATE KEY UPDATE
                    `level` = VALUES(`level`),
                    plus_level = VALUES(plus_level),
                    form_id = VALUES(form_id),
                    notes = VALUES(notes),
                    modified_at = CURRENT_TIMESTAMP";
        
        $pdo = $this->database->getConnection();
        $stmt = $pdo->prepare($sql);

        $stmt->bindValue(':user_id', $data['user_id']);
        $stmt->bindValue(':cat_id', $data['cat_id']);
        $stmt->bindValue(':level', $data['level']);
        $stmt->bindValue(':plus_level', $data['plus_level']);
        $stmt->bindValue(':form_id', $data['form_id']);
        $stmt->bindValue(':notes', $data['notes']);
        
        return $stmt->execute();
    }

    public function delete(int $user_id, int $cat_id): bool
    {
        $sql = "DELETE FROM user_cat WHERE user_id = :user_id AND cat_id = :cat_id";
        
        $pdo = $this->database->getConnection();
        $stmt = $pdo->prepare($sql);
        
        return $stmt->execute(['user_id' => $user_id, 'cat_id' => $cat_id]);
    }
    
    /**
     * [IMPROVED METHOD]
     * Processes an array of actions and returns the total number of affected rows.
     *
     * @param int $user_id The user's ID.
     * @param array $actions A list of action objects.
     * @return int|false The total number of affected rows, or false on failure.
     */
    public function bulkUpdate(int $user_id, array $actions): int|false
    {
        $pdo = $this->database->getConnection();
        $totalAffectedRows = 0; // [NEW] Initialize counter

        try {
            $pdo->beginTransaction();

            $firstFormStmt = $pdo->prepare("SELECT MIN(form_id) as first_form_id FROM cat_form WHERE cat_id = :cat_id");

            foreach ($actions as $action) {
                
                if ($action['action'] === 'set_owned') {
                    $sql = "INSERT INTO user_cat (user_id, cat_id, `level`, plus_level, form_id, created_at, modified_at)
                            VALUES (:user_id, :cat_id, 1, 0, :form_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                            ON DUPLICATE KEY UPDATE modified_at = CURRENT_TIMESTAMP";
                    
                    $stmt = $pdo->prepare($sql);
                        
                    foreach ($action['cat_ids'] as $cat_id) {
                        $firstFormStmt->execute(['cat_id' => $cat_id]);
                        $formResult = $firstFormStmt->fetch();
                        $first_form_id = $formResult['first_form_id'] ?? 1;

                        $stmt->execute([
                            'user_id' => $user_id,
                            'cat_id' => $cat_id,
                            'form_id' => $first_form_id
                        ]);
                        $totalAffectedRows += $stmt->rowCount(); // [NEW] Add affected rows
                    }
                
                } else {
                    $placeholders = implode(',', array_fill(0, count($action['cat_ids']), '?'));

                    switch ($action['action']) {
                        case 'set_level':
                            $sql = "UPDATE user_cat 
                                    SET `level` = ?, plus_level = ?, modified_at = CURRENT_TIMESTAMP
                                    WHERE user_id = ? AND cat_id IN ($placeholders)";
                            
                            $params = array_merge([$action['level'], $action['plus_level'], $user_id], $action['cat_ids']);
                            $stmt = $pdo->prepare($sql);
                            $stmt->execute($params);
                            $totalAffectedRows += $stmt->rowCount(); // [NEW] Add affected rows
                            break;

                        case 'set_form':
                            $sql = "UPDATE user_cat 
                                    SET form_id = ?, modified_at = CURRENT_TIMESTAMP
                                    WHERE user_id = ? AND cat_id IN ($placeholders)";
                            
                            $params = array_merge([$action['form_id'], $user_id], $action['cat_ids']);
                            $stmt = $pdo->prepare($sql);
                            $stmt->execute($params);
                            $totalAffectedRows += $stmt->rowCount(); // [NEW] Add affected rows
                            break;
                    }
                }
            }

            $pdo->commit();
            return $totalAffectedRows; // [NEW] Return the total count

        } catch (\Exception $e) {
            $pdo->rollBack();
            error_log($e->getMessage()); // Good to log the actual error
            return false;
        }
    }
}