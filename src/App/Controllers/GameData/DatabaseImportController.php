<?php
declare(strict_types=1);

namespace App\Controllers\GameData;

use App\Database;
use PDO;
use PDOException;

/**
 * Handles the generic task of importing any CSV/TSV file into a temporary database table.
 */
class DatabaseImportController
{
    private PDO $pdo;

    public function __construct(private Database $database)
    {
        $this->pdo = $this->database->getConnection();
    }

    /**
     * Imports the contents of a given data file into a uniquely named temporary table.
     * The temporary table will persist for the duration of the database session.
     *
     * @param string $filePath The full path to the data file.
     * @param array $fileMetadata An array containing 'delimiter' and 'max_columns'.
     * @param bool $hasHeader Set to true if the CSV has a header row to ignore.
     * @return bool True on success, false on failure.
     */
    public function stageFileInTempTable(string $filePath, array $fileMetadata, bool $hasHeader = true): bool
    {
        if (!file_exists($filePath)) {
            logMessage("Error: File not found at {$filePath}");
            return false;
        }

        $tableName = pathinfo($filePath, PATHINFO_FILENAME);
        // Use a predictable temporary table name for easy access later
        $tempTableName = 'temp_' . $tableName;

        try {
            $columnDefinitions = implode(', ', array_map(fn($i) => "`col{$i}` VARCHAR(255)", range(1, $fileMetadata['max_columns'])));

            // Drop the temporary table if it already exists from a previous run in this session
            $this->pdo->exec("DROP TEMPORARY TABLE IF EXISTS `{$tempTableName}`");

            $createTableSql = "CREATE TEMPORARY TABLE `{$tempTableName}` (
                `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
                {$columnDefinitions}
            )";
            $this->pdo->exec($createTableSql);

            $escapedFilePath = str_replace(DIRECTORY_SEPARATOR, '/', $filePath);
            $ignoreLineSql = $hasHeader ? "IGNORE 1 LINES" : "";

            $bulkImportSql = "LOAD DATA INFILE '{$escapedFilePath}'
                                INTO TABLE `{$tempTableName}`
                                FIELDS TERMINATED BY '{$fileMetadata['delimiter']}' ENCLOSED BY '\"'
                                LINES TERMINATED BY '\\n'
                                {$ignoreLineSql}";
            
            $this->pdo->exec($bulkImportSql);
            logMessage("Successfully staged file '{$tableName}' in temporary table '{$tempTableName}'.");

            return true;
        } catch (PDOException $e) {
            logMessage("Failed to stage file {$tableName}: " . $e->getMessage());
            return false;
        }
    }
}