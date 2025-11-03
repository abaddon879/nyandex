<?php
declare(strict_types=1);

namespace App\Repositories;

use PDO;

class CsvImportRepository
{
    public function __construct(private PDO $pdo)
    {
    }

    public function tableExists(string $tableName): bool
    {
        $stmt = $this->pdo->prepare("SHOW TABLES LIKE :table");
        $stmt->execute(['table' => $tableName]);
        return $stmt->fetchColumn() !== false;
    }

    public function truncateTable(string $tableName): void
    {
        $this->pdo->exec("TRUNCATE TABLE `$tableName`");
    }

    public function createTable(string $tableName, array $columns): void
    {
        $colsSql = [];
        foreach ($columns as $col) {
            if ($col === 'id') {
                $colsSql[] = "`$col` INT PRIMARY KEY";
            } else {
                $colsSql[] = "`$col` TEXT";
            }
        }
        $sql = "CREATE TABLE `$tableName` (" . implode(", ", $colsSql) . ")";
        $this->pdo->exec($sql);
    }

    public function insertRow(string $tableName, array $columns, array $values): bool
    {
        $placeholders = implode(',', array_fill(0, count($columns), '?'));
        $colsSql = '`' . implode('`,`', $columns) . '`';
        $sql = "INSERT INTO `$tableName` ($colsSql) VALUES ($placeholders)";
        $stmt = $this->pdo->prepare($sql);
        return $stmt->execute($values);
    }
}
