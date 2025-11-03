<?php

namespace App\Controllers\GameData;

use App\Controllers\GameData\ConfigLoader;

class MoveFilesController
{
    private $sourcePath;
    private $config;
    private $version;

    public function __construct($sourcePath = null, $version = null)
    {
        $this->config = ConfigLoader::load();
        if ($sourcePath) {
            $this->sourcePath = $sourcePath;
        } else {
            // Use the config value to construct the default path
            $basePath = realpath(dirname(__DIR__, 4));
            $this->sourcePath = $basePath . DIRECTORY_SEPARATOR . $this->config['decrypted_path_base'];
        }
        $this->version = $version;
    }

    public function run()
    {
        logMessage("Move process started. Source folder: " . $this->sourcePath, 'INFO', 'Move');
        if (!is_dir($this->sourcePath)) {
            logMessage("Source path does not exist: {$this->sourcePath}", 'WARNING', 'Move');
            return;
        }
        $iterator = new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($this->sourcePath));
        $fileCount = iterator_count($iterator);
        logMessage("Number of files in source path: $fileCount", 'DEBUG', 'Move');
        
        $basePath = realpath(dirname(__DIR__, 4));

        // Copy unit data files
        $unitDataDest = $basePath . DIRECTORY_SEPARATOR . $this->config['unit_data_storage_dir'] . DIRECTORY_SEPARATOR . $this->version;
        $this->copyFiles($this->config['unit_data_to_move'], $unitDataDest);

        // Copy game data files
        $gameDataDest = $basePath . DIRECTORY_SEPARATOR . $this->config['game_data_storage_dir'] . DIRECTORY_SEPARATOR . $this->version;
        $this->copyFiles($this->config['game_data_to_move'], $gameDataDest);

        // Copy unit images
        $unitImagesDest = $basePath . DIRECTORY_SEPARATOR . $this->config['unit_images_storage_dir'] . DIRECTORY_SEPARATOR . $this->version;
        $this->copyFiles($this->config['unit_images_to_move'], $unitImagesDest);

        // Copy orb data and images
        $orbImagesDest = $basePath . DIRECTORY_SEPARATOR . $this->config['orb_images_storage_dir'];
        $this->copyFiles($this->config['orb_images_to_move'], $orbImagesDest);

        // Copy game images
        //$gameImagesDest = $basePath . DIRECTORY_SEPARATOR . $this->config['game_images_storage_dir'] . DIRECTORY_SEPARATOR . $this->version;
        //$this->copyFiles($this->config['game_images_to_move'], $gameImagesDest);
        
        $this->config['game_images_storage_dir'] = realpath(dirname(__DIR__, 4)) . DIRECTORY_SEPARATOR . $this->config['game_images_storage_dir'] . DIRECTORY_SEPARATOR . $this->version;

        $sources = [
            $this->sourcePath, // decrypted source from constructor
            realpath($basePath . DIRECTORY_SEPARATOR . $this->config['extracted_path_base']),
        ];

        foreach ($sources as $source) {
            if ($source && is_dir($source)) {
                logMessage("Scanning for game files in source: {$source}", 'DEBUG', 'Move');
                
                $iterator = new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($source));
                $fileCount = iterator_count($iterator);
                logMessage("Number of files in source path: $fileCount", 'DEBUG', 'Move');

                // Temporarily set sourcePath for scanDirectoryForFiles()
                $oldSourcePath = $this->sourcePath;
                $this->sourcePath = $source;
                $this->copyFiles($this->config['game_images_to_move'], $this->config['game_images_storage_dir']);
                $this->sourcePath = $oldSourcePath;
            } else {
                logMessage("Source path does not exist: {$source}", 'WARNING', 'Move');
            }
        }
    }

    public function copyFiles(array $patterns, string $destinationBase)
    {
        foreach ($patterns as $pattern) {
            $this->copyFilesMatchingPattern($pattern, $destinationBase);
        }
    }

    private function copyFilesMatchingPattern(string $pattern, string $destinationBase)
    {
        logMessage("Looking for pattern: {$pattern}", 'DEBUG', 'Move');
        $files = $this->scanDirectoryForFiles($this->sourcePath, $pattern);
        logMessage("Found " . count($files) . " files matching {$pattern}", 'DEBUG', 'Move');

        foreach ($files as $file) {
            $this->copyFile($file, $destinationBase);
        }
    }

    private function scanDirectoryForFiles(string $directory, string $pattern): array
    {
        $files = [];
        $iterator = new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($directory));

        foreach ($iterator as $file) {
            $filePath = str_replace('\\', '/', $file->getPathname());
            if ($file->isFile() && preg_match("#{$pattern}#", $filePath)) {
                //logMessage("Matched file for pattern '{$pattern}': " . $file->getPathname());
                $files[] = $file->getPathname();
            }
        }

        return $files;
    }

    private function copyFile(string $file, string $destinationBase)
    {
        $file = str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $file);
        $destinationBase = rtrim(str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $destinationBase), DIRECTORY_SEPARATOR);


        $relativePath = substr($file, strlen($this->sourcePath) + 1);
        $parts = explode(DIRECTORY_SEPARATOR, $relativePath);
        $filename = array_pop($parts); // get only the file name
        $relativePath = $filename; // ignore all folders

        $destinationFile = $destinationBase . DIRECTORY_SEPARATOR . $relativePath;
        $destinationDir = dirname($destinationFile);

        if (!is_dir($destinationDir)) {
            logMessage("Creating directory: $destinationDir", 'DEBUG', 'Move');
            mkdir($destinationDir, 0755, true);
        }

        
        if (!file_exists($destinationFile) || sha1_file($file) !== sha1_file($destinationFile)) {
            if (!copy($file, $destinationFile)) {
                logMessage("Failed to copy: $file", 'ERROR', 'Move');
            }
        } else {
            // File already exists and is identical
            //logMessage("File already exists and is identical, skipping: $destinationFile");
        }

    }


}
