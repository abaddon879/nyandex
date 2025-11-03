<?php

namespace App\Controllers\GameData;

use Exception;
use App\Controllers\GameData\ConfigLoader;


class DownloadApkController
{
    private $apkPureDownloadUrl;
    private $downloadPath;
    private $simulateDownload;

    public function __construct()
    {
        // Load the configuration
        $config = ConfigLoader::load();
        $this->apkPureDownloadUrl = $config['apk_pure_download_url'];
        $this->downloadPath = dirname(__DIR__, 4) . DIRECTORY_SEPARATOR . $config['game_data_download_path'];


        // Check if the directory exists, if not create it
        if (!is_dir($this->downloadPath)) {
            if (!mkdir($this->downloadPath, 0777, true)) {
                throw new Exception('Failed to create directory: ' . $this->downloadPath);
            }
            logMessage("Created directory: " . $this->downloadPath, 'INFO', 'Download');
        } elseif (!is_writable($this->downloadPath)) {
            if (!chmod($this->downloadPath, 0777)) {
                throw new Exception('Failed to update directory permissions: ' . $this->downloadPath);
            }
            logMessage("Updated directory permissions: " . $this->downloadPath, 'INFO', 'Download');
        }
    }

    public function run()
    {
        return $this->downloadFile();
    }

    public function downloadFile()
    {
        logMessage("Downloading APK/XAPK...", 'INFO', 'Download');

        // --- Step 1: Send a HEAD request to get the filename ---
        $ch = curl_init($this->apkPureDownloadUrl);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_NOBODY, true); // We only want the headers
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HEADER, true);
        curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.66 Safari/537.36');
        $headers = curl_exec($ch);
        curl_close($ch);

        // Extract the filename from the Content-Disposition header
        preg_match('/filename="([^"]+)"/', $headers, $matches);
        $fileName = isset($matches[1]) ? trim($matches[1]) : 'downloaded_file.xapk';
        logMessage("Resolved filename from server: " . $fileName, 'DEBUG', 'Download');

        // Use regex to filter out only the app name and version for a clean name
        if (preg_match('/^([A-Za-z0-9\s-]+)_?([0-9\.]+)/', $fileName, $nameMatches)) {
            $fileName = trim($nameMatches[1]) . '_' . trim($nameMatches[2]) . '.xapk';
            logMessage("Cleaned filename to: " . $fileName, 'DEBUG', 'Download');
        }        

        // --- Step 2: Open a local file and stream the download into it ---
        $filePath = $this->downloadPath . DIRECTORY_SEPARATOR . $fileName;
        $fp = fopen($filePath, 'wb');
        if (!$fp) {
            throw new Exception("Failed to open file for writing: $filePath");
        }

        $ch = curl_init($this->apkPureDownloadUrl);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_FILE, $fp); // THIS IS THE KEY: Stream directly to the file handle
        curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.66 Safari/537.36');
        
        curl_exec($ch);

        if (curl_errno($ch)) {
            fclose($fp); // Close the handle on error
            throw new Exception('Download failed: ' . curl_error($ch));
        }

        curl_close($ch);
        fclose($fp);

        logMessage("Downloaded to: " . $fileName, 'INFO', 'Download');
        return [
            'filepath' => $filePath,
            'filename' => $fileName,
        ];
    }

    // New function for simulating the download process
    public function simulateDownload()
    {
        logMessage("Simulating APK/XAPK download...", 'INFO', 'Download');

        // Simulate a file name and file path for testing
        $fileName = "The Battle Cats_14.6.0.xapk";  // Simulated file name
        $filePath = $this->downloadPath . DIRECTORY_SEPARATOR . $fileName;  // Simulated file path

        // Log the "downloaded" file details (bypassing actual download logic)
        logMessage("Simulated download to: " . $fileName, 'INFO', 'Download');

        // Return the simulated values as if the file was downloaded
        return [
            'filepath' => $filePath,  // Simulated file path
            'filename' => $fileName,  // Simulated file name
        ];
    }
}