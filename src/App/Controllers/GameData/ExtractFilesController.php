<?php

namespace App\Controllers\GameData;

use ZipArchive;
use Exception;
use App\Controllers\GameData\ConfigLoader;

class ExtractFilesController
{
    private $xapkFilePath;
    private $extractPath;
    private $filesToExtract;

    public function __construct($xapkFilePath = null)
    {
        // Load the configuration
        $config = ConfigLoader::load();

        $this->filesToExtract = $config['files_to_extract'] ?? [];

        // Use the download path from config
        $extractBasePath = dirname(__DIR__, 4) . DIRECTORY_SEPARATOR . $config['extracted_path_base'];
       
        // Use provided path or throw error
        if ($xapkFilePath === null) {
            throw new Exception('No XAPK file path provided.');
        }
        $this->xapkFilePath = $xapkFilePath;

        // Derive the extract path from the xapkFilePath filename
        $fileName = pathinfo($this->xapkFilePath, PATHINFO_FILENAME); // Get the file name without extension

        // Extract path also uses the configurable download path
        $this->extractPath = $extractBasePath . DIRECTORY_SEPARATOR . $fileName;

        // Create the extracted directory if it doesn't exist
        if (!is_dir($this->extractPath)) {
            if (!mkdir($this->extractPath, 0777, true)) {
                throw new Exception('Failed to create directory: ' . $this->extractPath);
            }
            logMessage("Created directory for extracted files: " . $this->extractPath, 'INFO', 'Extract');
        }
    }

    public function run(): void
    {
        $this->extractXAPK();
    }

    public function extractXAPK()
    {
        logMessage("Extracting APK/XAPK...", 'INFO', 'Extract');
        $zip = new ZipArchive;

        if (!file_exists($this->xapkFilePath)) {
            logMessage("File not found: {$this->xapkFilePath}", 'WARNING', 'Extract');
            return;
        }

        if ($zip->open($this->xapkFilePath) === TRUE) {
            // Loop through each file in the ZIP
            for ($i = 0; $i < $zip->numFiles; $i++) {
                $fileName = $zip->getNameIndex($i);

                // Check if the file matches any patterns
                if ($this->shouldExtract($fileName)) {
                    $zip->extractTo($this->extractPath, $fileName);
                    //echo "Extracted: $fileName\n";

                    // If the extracted file is an APK, extract its contents as well
                    if (pathinfo($fileName, PATHINFO_EXTENSION) === 'apk') {
                        $this->extractApkContents($this->extractPath . '/' . $fileName);
                    }
                }
            }
            $zip->close();
            logMessage("Extraction completed.", 'INFO', 'Extract');
            return [
                'filepath' => $this->extractPath,
            ];
        } else {
            logMessage("Failed to extract {$this->xapkFilePath}", 'ERROR', 'Extract');
        }
    }

    private function shouldExtract(string $fileName): bool
    {
        foreach ($this->filesToExtract as $pattern) {
            // Escape special characters
            $escapedPattern = preg_quote($pattern, '/');
            
            // Replace wildcards with regex equivalents
            $regexPattern = str_replace(['\\*', '\\*\\*', '\\*\\*\\*'], ['[0-9]*', '[0-9]*', '[0-9]+'], $escapedPattern);

            // Add start and end anchors for the regex
            $regexPattern = '/^' . $regexPattern . '$/'; 

            if (preg_match($regexPattern, $fileName)) {
                return true; // Match found
            }
        }
        return false; // No match found
    }

    private function extractApkContents($apkFilePath)
    {
        logMessage("Extracting contents of APK: $apkFilePath", 'DEBUG', 'Extract');
        $zip = new ZipArchive;

        if ($zip->open($apkFilePath) === TRUE) {
            $extractApkPath = $this->extractPath . DIRECTORY_SEPARATOR . pathinfo($apkFilePath, PATHINFO_FILENAME);
            // Create a directory for APK contents
            if (!is_dir($extractApkPath)) {
                mkdir($extractApkPath, 0777, true);
            }

            $zip->extractTo($extractApkPath);
            $zip->close();
            logMessage("Extracted APK contents to: $extractApkPath", 'DEBUG', 'Extract');
        } else {
            logMessage("Failed to extract APK: $apkFilePath", 'ERROR', 'Extract');
        }
    }
}
