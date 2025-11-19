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

    /**
     * [FIXED] Fetches user data and pinned status separately to ensure accuracy.
     */
    public function findByUserAndCat(int $user_id, int $cat_id): array
    {
        $pdo = $this->database->getConnection();

        // 1. Try to fetch the user's progress for this cat
        $sqlCat = "SELECT cat_id, `level`, plus_level, form_id, notes 
                   FROM user_cat 
                   WHERE user_id = :user_id AND cat_id = :cat_id";
        $stmtCat = $pdo->prepare($sqlCat);
        $stmtCat->execute(['user_id' => $user_id, 'cat_id' => $cat_id]);
        $catData = $stmtCat->fetch(PDO::FETCH_ASSOC);

        // 2. Check if the cat is pinned (Separate query is safer/faster here)
        $sqlPin = "SELECT COUNT(*) FROM user_pinned_cat WHERE user_id = :user_id AND cat_id = :cat_id";
        $stmtPin = $pdo->prepare($sqlPin);
        $stmtPin->execute(['user_id' => $user_id, 'cat_id' => $cat_id]);
        $isPinned = (bool)$stmtPin->fetchColumn();

        // 3. Build the result
        if ($catData) {
            // User owns the cat
            $catData['is_owned'] = true;
            $catData['is_pinned'] = $isPinned;
            return $catData;
        } else {
            // User does NOT own the cat, but we return the pinned status
            return [
                'cat_id' => $cat_id,
                'level' => 0,
                'plus_level' => 0,
                'form_id' => 0,
                'notes' => null,
                'is_owned' => false,
                'is_pinned' => $isPinned
            ];
        }
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
    
    public function bulkUpdate(int $user_id, array $actions): int|false
    {
        $pdo = $this->database->getConnection();
        $totalAffectedRows = 0;

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
                        $totalAffectedRows += $stmt->rowCount();
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
                            $totalAffectedRows += $stmt->rowCount();
                            break;

                        case 'set_form':
                            $sql = "UPDATE user_cat 
                                    SET form_id = ?, modified_at = CURRENT_TIMESTAMP
                                    WHERE user_id = ? AND cat_id IN ($placeholders)";
                            
                            $params = array_merge([$action['form_id'], $user_id], $action['cat_ids']);
                            $stmt = $pdo->prepare($sql);
                            $stmt->execute($params);
                            $totalAffectedRows += $stmt->rowCount();
                            break;
                    }
                }
            }

            $pdo->commit();
            return $totalAffectedRows;

        } catch (\Exception $e) {
            $pdo->rollBack();
            error_log($e->getMessage());
            return false;
        }
    }
}