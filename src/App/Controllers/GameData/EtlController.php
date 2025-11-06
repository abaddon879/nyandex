<?php

namespace App\Controllers\GameData;

use App\Database;
use PDO;
use Exception;

/**
 * Manages the ETL (Extract, Transform, Load) process for game data.
 * This version uses a compatible row-by-row import method suitable for any hosting environment.
 */
class EtlController
{
    private $config;
    private $version;
    private $pdo;

    /**
     * EtlController constructor.
     * @param string $version The game version to process.
     */
    public function __construct(string $version)
    {
        $this->config = ConfigLoader::load();
        $this->version = $version;

        // Get the database connection. The LOCAL_INFILE option is no longer needed.
        $dbConfig = $this->config['db'];
        $database = new Database(
            $dbConfig['host'],
            $dbConfig['database'],
            $dbConfig['username'],
            $dbConfig['password']
        );
        $this->pdo = $database->getConnection();
    }

    /**
     * Runs the full ETL process in sequence.
     * This is the main method to call for full automation.
     */
    public function run(): void
    {
        $this->loadAllCsvsToTempTables();
        $this->applySqlTransformations();
    }

    /**
     * STEP 1: Loads all configured CSV files into temporary database tables.
     * This method can be called individually for testing the load process.
     */
    public function loadAllCsvsToTempTables(): void
    {
        $imports = $this->config['database_imports'] ?? [];
        $basePath = realpath(dirname(__DIR__, 4));

        foreach ($imports as $importName => $details) {
            logMessage("Loading CSV for '{$importName}'...", 'INFO', 'ETL');
            
            $sourceDir = $basePath . DIRECTORY_SEPARATOR . $this->config[$details['source_dir_key']] . DIRECTORY_SEPARATOR . $this->version;
            $csvFilePath = $sourceDir . DIRECTORY_SEPARATOR . $details['source_file'];
            $tempTableName = 'temp_' . $details['destination_table'];

            if (!file_exists($csvFilePath)) {
                logMessage("Source file not found, skipping: {$csvFilePath}", 'WARNING', 'ETL');
                continue;
            }

            $fileHandle = null;
            try {
                // Check for the 'has_header' flag, defaulting to true if not set.
                $hasHeader = $details['has_header'] ?? true;
                $header = [];

                $fileHandle = fopen($csvFilePath, 'r');
                if (!$fileHandle) throw new Exception("Could not open CSV file.");
                
                $firstLine = fgetcsv($fileHandle);
                rewind($fileHandle);

                if ($firstLine === false) throw new Exception("CSV file is empty.");

                // --- CORRECTED LOGIC WITH DEBUGGING ---
                if ($hasHeader) {
                    // This path runs if 'has_header' is true or not set.
                    logMessage("File has a header. Using first line for column names.", 'DEBUG', 'ETL');
                    $header = $firstLine;
                } else {
                    // This path runs if 'has_header' is explicitly set to false.
                    logMessage("File is header-less. Generating generic 'col_x' column names.", 'DEBUG', 'ETL');
                    $columnCount = count($firstLine);
                    $header = [];
                    for ($i = 1; $i <= $columnCount; $i++) {
                        $header[] = 'col_' . $i;
                    }
                }
                
                // Sanitize the determined header to make it safe for SQL.
                $sanitizedHeader = [];
                $counts = [];
                foreach ($header as $col) {
                    $col = trim($col);
                    if (empty($col)) $col = 'unnamed_col';
                    
                    if (isset($counts[$col])) {
                        $counts[$col]++;
                        $sanitizedHeader[] = $col . '_' . $counts[$col];
                    } else {
                        $counts[$col] = 1;
                        $sanitizedHeader[] = $col;
                    }
                }
                
                // Create the temporary table.
                $columnsSql = '`id` INT AUTO_INCREMENT PRIMARY KEY, ' . '`' . implode('` TEXT, `', $sanitizedHeader) . '` TEXT';
                $this->pdo->exec("DROP TEMPORARY TABLE IF EXISTS `{$tempTableName}`;");
                $this->pdo->exec("CREATE TEMPORARY TABLE `{$tempTableName}` ({$columnsSql});");

                // Start the row-by-row import.
                $this->pdo->beginTransaction();

                $placeholders = implode(',', array_fill(0, count($sanitizedHeader), '?'));
                $columnSql = '`' . implode('`,`', $sanitizedHeader) . '`';
                $sql = "INSERT INTO `{$tempTableName}` ({$columnSql}) VALUES ({$placeholders})";
                $stmt = $this->pdo->prepare($sql);

                if ($hasHeader) {
                    fgetcsv($fileHandle); // Skip the header row.
                }

                $rowCount = 0;
                while (($row = fgetcsv($fileHandle)) !== false) {
                    $row = array_pad($row, count($sanitizedHeader), null);
                    $stmt->execute(array_slice($row, 0, count($sanitizedHeader)));
                    $rowCount++;
                }
                
                $this->pdo->commit();

                logMessage("Successfully loaded {$rowCount} rows into temp table '{$tempTableName}'.", 'INFO', 'ETL');

            } catch (Exception $e) {
                if ($this->pdo->inTransaction()) $this->pdo->rollBack();
                logMessage("Failed to load CSV '{$csvFilePath}' into '{$tempTableName}': " . $e->getMessage(), 'ERROR', 'ETL');
            } finally {
                if ($fileHandle) {
                    fclose($fileHandle);
                }
            }
        }
    }

    /**
     * STEP 2: Applies the main SQL transformation script.
     * This method can be called individually after loading temp tables.
     */
    public function applySqlTransformations(): void
    {
        // This method is unchanged and ready for when you want to use it.
        logMessage("Applying SQL transformations for version {$this->version}...", 'INFO', 'ETL');
        try {
            $sqlScriptPath = realpath(dirname(__DIR__, 4)) . '/sql/transform_gamedata.sql';
            if (!file_exists($sqlScriptPath)) {
                throw new Exception("Transformation SQL script not found at: {$sqlScriptPath}");
            }

            $sqlTemplate = file_get_contents($sqlScriptPath);
            $sql = str_replace('{{VERSION}}', $this->version, $sqlTemplate);
            $this->pdo->exec($sql);

            logMessage("Successfully applied SQL transformations.", 'INFO', 'ETL');

        } catch (Exception $e) {
            logMessage("Error during SQL transformation: " . $e->getMessage(), 'ERROR', 'ETL');
        }
    }
}