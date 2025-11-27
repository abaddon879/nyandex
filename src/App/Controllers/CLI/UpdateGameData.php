<?php

// Include the autoload file if you are using Composer
require dirname(__DIR__,4) . '/vendor/autoload.php';

// Load dotenv once here
$dotenv = Dotenv\Dotenv::createImmutable(dirname(__DIR__, 4));
$dotenv->load();

// Define constants once
define('APP_ROOT', dirname(__DIR__, 4));
define('ROOT_DIR', rtrim($_SERVER['DOCUMENT_ROOT'], '/'));

// Enable error reporting once
error_reporting(E_ALL); // Report all errors
ini_set('display_errors', 1); // Display errors on the screen

use App\Controllers\GameData\VersionCheckController;
use App\Controllers\GameData\DownloadApkController;
use App\Controllers\GameData\ExtractFilesController;
use App\Controllers\GameData\DecryptFilesController;
use App\Controllers\GameData\MoveFilesController;
use App\Controllers\GameData\CsvMergeController;
use App\Controllers\GameData\EtlController;

/**
 * Writes a message to a log file if it meets the minimum log level.
 *
 * @param string $message The message to log.
 * @param string $level The log level (DEBUG, INFO, WARNING, ERROR).
 * @param string $context Optional context (e.g., a class or function name).
 */

function logMessage(string $message, string $level = 'INFO', string $context = 'General') {
    $config = \App\Controllers\GameData\ConfigLoader::load();
    $logFile = APP_ROOT . DIRECTORY_SEPARATOR . $config['log_file'];

    $minLogLevel = $config['min_log_level'] ?? 'INFO';

    // Define the priority of each log level.
    $levels = [
        'ERROR'   => 1,
        'WARNING' => 2,
        'INFO'    => 3,
        'DEBUG'   => 4,
    ];
    
    $level = strtoupper($level);

    // Only log the message if its level is important enough.
    if (!isset($levels[$level]) || $levels[$level] > $levels[$minLogLevel]) {
        return; // Don't log this message
    }

    // Create the log entry with timestamp, level, and context.
    $timestamp = date('Y-m-d H:i:s');
    $logEntry = sprintf(
        "[%s] [%s] [%s] %s\n",
        $timestamp,
        str_pad($level, 7), // Pad for alignment
        $context,
        $message
    );
    
    // Write to the file.
    file_put_contents($logFile, $logEntry, FILE_APPEND);
}

// Function to handle the downloading and processing of files
function processGameUpdate($googlePlayVersion, $releaseDate, $apiMethod) {
    logMessage("Checking APKPure for version {$googlePlayVersion}...", 'INFO', 'Main');

    try {
        $versionCheck = new VersionCheckController();
        $apkPureInfo = $versionCheck->getApkPureInfo();

        if (!$apkPureInfo || version_compare($googlePlayVersion, $apkPureInfo['version'], '!=')) {
            logMessage("The version is not available on APKPure or does not match Google Play version.", 'WARNING', 'Main');
            return;
        }

        logMessage("The version is available for download on APKPure.", 'INFO', 'Main');

        $downloadController = new DownloadApkController();
        // Use simulateDownload() for testing or downloadFile() for real downloads
        $downloadResult = $downloadController->downloadFile();

        if (!$downloadResult) {
            logMessage("Failed to download the APK.", 'ERROR', 'Main');
            return;
        }

        logMessage("APK downloaded successfully: " . $downloadResult['filename'] . " (Saved to: " . $downloadResult['filepath'] . ")", 'INFO', 'Main');

        // If the download was successful, update the database with the download date
        $downloadDate = date('Y-m-d H:i:s');
        $dataToPost = [
            'version_id' => $googlePlayVersion,
            'release_date' => $releaseDate,
            'download_date' => $downloadDate
        ];

        $dbUpdateSuccess = false;
        if ($apiMethod === 'POST') {
            $dbUpdateSuccess = postNewVersionToAPI($dataToPost);
        } elseif ($apiMethod === 'PATCH') {
            $dbUpdateSuccess = patchNewVersionToAPI($dataToPost);
        }

        if ($dbUpdateSuccess) {
            logMessage("Download and database update successful.", 'INFO', 'Main');
        } else {
            logMessage("Failed to update database after download.", 'ERROR', 'Main');
            return;
        }

        // Extract the contents
        $extractController = new ExtractFilesController($downloadResult['filepath']);
        logMessage("File path passed to extractXAPK: " . $downloadResult['filepath'], 'DEBUG', 'Main');
        $extractedResult = $extractController->extractXAPK();
        logMessage("File path returned from extractXAPK: " . $extractedResult['filepath'], 'DEBUG', 'Main');

        // Decrypt the files
        $extractedPath = $extractedResult['filepath'] . DIRECTORY_SEPARATOR . "InstallPack" . DIRECTORY_SEPARATOR . "assets";
        $decryptController = new DecryptFilesController($extractedPath);
        logMessage("File path passed to decryptFiles: $extractedPath", 'DEBUG', 'Main');
        $decryptController->processFiles();
        $extractedBasePath = $extractedResult['filepath'];

        // Move files/images after decryption
        $decryptedBasePath = str_replace('extracted', 'decrypted', $extractedBasePath);
        $moveController = new MoveFilesController($decryptedBasePath, $googlePlayVersion);
        if (!is_dir($decryptedBasePath)) {
            logMessage("Decrypted folder does not exist: $decryptedBasePath", 'WARNING', 'Main');
        } else {
            $moveController->run();
        }

        // Merge files after move
        $mergeController = new CsvMergeController($googlePlayVersion);
        $mergeController->mergeCSVFiles();

        try {
            logMessage("Starting full database ETL process...", 'INFO', 'Main');
            $etlController = new EtlController($googlePlayVersion);
            
            // This single method now runs the entire process:
            // 1. Loads CSVs into temporary tables.
            // 2. Executes your transform_gamedata.sql script.
            $etlController->run();

        } catch (Exception $e) {
            logMessage($e, 'ERROR', 'Main');
        }

        // --------------------------------------------------
        // START: Copy public assets
        // --------------------------------------------------
        logMessage("Copying public assets (items and units)...", 'INFO', 'Main');

        try {
            // Load the configuration
            $config = \App\Controllers\GameData\ConfigLoader::load();

            // 1. Copy Item Images
            // Source is the config's 'game_images_storage_dir' + version
            $itemSource = APP_ROOT . DIRECTORY_SEPARATOR . $config['game_images_storage_dir'] . DIRECTORY_SEPARATOR . $googlePlayVersion;
            // Destination and pattern are from our new config keys
            $itemDest = APP_ROOT . DIRECTORY_SEPARATOR . $config['public_item_images_dest'];
            $itemPattern = $config['public_item_images_pattern']; 
            
            if (is_dir($itemSource)) {
                $itemMover = new MoveFilesController($itemSource);
                $itemMover->copyFiles([$itemPattern], $itemDest);
                logMessage("Item images copied to public assets.", 'DEBUG', 'Main');
            } else {
                logMessage("Item source directory not found, skipping: $itemSource", 'WARNING', 'Main');
            }

            // 2. Copy Unit Images
            // Source is the config's 'unit_images_storage_dir' + version
            $unitSource = APP_ROOT . DIRECTORY_SEPARATOR . $config['unit_images_storage_dir'] . DIRECTORY_SEPARATOR . $googlePlayVersion;
            // Destination and pattern are from our new config keys
            $unitDest = APP_ROOT . DIRECTORY_SEPARATOR . $config['public_unit_images_dest'];
            $unitPattern = $config['public_unit_images_pattern'];

            if (is_dir($unitSource)) {
                $unitMover = new MoveFilesController($unitSource);
                $unitMover->copyFiles([$unitPattern], $unitDest);
                logMessage("Unit images copied to public assets.", 'DEBUG', 'Main');
            } else {
                logMessage("Unit source directory not found, skipping: $unitSource", 'WARNING', 'Main');
            }

        } catch (Exception $e) {
            logMessage('Error during public asset copy: ' . $e->getMessage(), 'ERROR', 'Main');
        }
        
        // --------------------------------------------------
        // END: Copy public assets
        // --------------------------------------------------
        
        logMessage("All processing steps completed successfully.", 'INFO', 'Main');

    } catch (Exception $e) {
        logMessage('Error during processing: ' . $e->getMessage(), 'ERROR', 'Main');
    }
}

// Function to check for the latest version and update the game data
function updateGameData() {
    logMessage("Root Directory is: " . APP_ROOT, 'DEBUG', 'Main');

    try {
        $versionCheck = new VersionCheckController();

        // 1. Fetch the latest app info from Google Play Store
        $appInfo = $versionCheck->getPlayStoreInfo();
        $googlePlayVersion = $appInfo['version'];
        $releaseDate = $appInfo['updated_date'];
        logMessage('Latest Version on Google Play: ' . $googlePlayVersion . " (" . $releaseDate . ")", 'INFO', 'Main');

        // 2. Fetch the latest version from the database
        $latestVersionInfo = getLatestVersionFromAPI();
        if (!$latestVersionInfo) {
            logMessage("Failed to fetch latest version from API. Cannot continue.", 'ERROR', 'Main');
            return;
        }

        $dbVersion = $latestVersionInfo['version'];
        $downloadDateSet = !empty($latestVersionInfo['download_date']);
        logMessage('Latest Version in DB: ' . $dbVersion . " (" . $latestVersionInfo['release_date'] . ")", 'INFO', 'Main');

        // 3. Compare versions and decide on the action
        if (version_compare($googlePlayVersion, $dbVersion, '>')) {
            logMessage("A new version is available on Google Play. Triggering POST and download...", 'INFO', 'Main');
            processGameUpdate($googlePlayVersion, $releaseDate, 'POST');
        } elseif (!$downloadDateSet) {
            logMessage("No new version available, but the APK has not been downloaded yet. Triggering PATCH and download...", 'INFO', 'Main');
            processGameUpdate($googlePlayVersion, $releaseDate, 'PATCH');
        } else {
            logMessage("No new version available, and the APK has already been downloaded. Exiting.", 'INFO', 'Main');
        }
    } catch (Exception $e) {
        logMessage('Error: ' . $e->getMessage(), 'ERROR', 'Main');
    }
}

// Function to call the /api/versions/latest endpoint and retrieve the latest version
function getLatestVersionFromAPI() {
    $config = \App\Controllers\GameData\ConfigLoader::load();
    $apiUrl = $config['api_base_url'] . '/versions/latest';
    $apiKey = $_SERVER['ADMIN_API_KEY'] ?? getenv('ADMIN_API_KEY') ?? $_ENV['ADMIN_API_KEY'];

    $ch = curl_init($apiUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPGET, true);
    $headers = ['Authorization: Bearer ' . $apiKey];
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    $response = curl_exec($ch);

    if ($response === false) {
        logMessage('cURL Error: ' . curl_error($ch), 'ERROR', 'API');
        curl_close($ch);
        return null;
    }

    $httpStatusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    if ($httpStatusCode !== 200) {
        logMessage("Error: Received HTTP status code $httpStatusCode. Response body: $response", 'ERROR', 'API');
        curl_close($ch);
        return null;
    }

    curl_close($ch);
    $data = json_decode($response, true);

    if (isset($data['version_id']) && isset($data['release_date'])) {
        return [
            'version' => $data['version_id'],
            'release_date' => $data['release_date'],
            'download_date' => $data['download_date'] ?? null
        ];
    }

    logMessage("API response structure is unexpected: " . print_r($data, true), 'WARNING', 'API');
    return null;
}

// Function to POST the new version to the API
function postNewVersionToAPI($data) {
    $config = \App\Controllers\GameData\ConfigLoader::load();
    $apiUrl = $config['api_base_url'] . '/admin/versions';
    $apiKey = $_SERVER['ADMIN_API_KEY'] ?? getenv('ADMIN_API_KEY') ?? $_ENV['ADMIN_API_KEY'];

    $ch = curl_init($apiUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    $headers = [
        'Authorization: Bearer ' . $apiKey,
        'Content-Type: application/json'
    ];
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    $jsonData = json_encode($data);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $jsonData);

    $response = curl_exec($ch);
    if ($response === false) {
        logMessage('cURL Error: ' . curl_error($ch), 'ERROR', 'API');
        curl_close($ch);
        return false;
    }

    $httpStatusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    if ($httpStatusCode !== 201) {
        logMessage("Error: Failed to create new version, received HTTP status code $httpStatusCode. Response body: $response", 'ERROR', 'API');
        curl_close($ch);
        return false;
    }

    curl_close($ch);
    return true;
}

// Function to PATCH the new version to the API
function patchNewVersionToAPI($data) {
    $config = \App\Controllers\GameData\ConfigLoader::load();
    $apiUrl = $config['api_base_url'] . '/admin/versions/' . urlencode($data['version_id']);
    $apiKey = $_SERVER['ADMIN_API_KEY'] ?? getenv('ADMIN_API_KEY') ?? $_ENV['ADMIN_API_KEY'];

    if (!isset($data['download_date'])) {
        logMessage("Error: download_date is missing.", 'ERROR', 'API');
        return false;
    }

    $downloadDate = date('Y-m-d H:i:s', strtotime($data['download_date']));

    $ch = curl_init($apiUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PATCH');
    $headers = [
        'Authorization: Bearer ' . $apiKey,
        'Content-Type: application/json'
    ];
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    $jsonData = json_encode(['download_date' => $downloadDate]);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $jsonData);

    $response = curl_exec($ch);
    if ($response === false) {
        logMessage('cURL Error: ' . curl_error($ch), 'ERROR', 'API');
        curl_close($ch);
        return false;
    }

    $httpStatusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    if ($httpStatusCode !== 200) {
        logMessage("Error: Failed to update version, received HTTP status code $httpStatusCode. Response body: $response", 'ERROR', 'API');
        curl_close($ch);
        return false;
    }

    curl_close($ch);
    return true;
}

// Call the function to update game data
updateGameData();
?>