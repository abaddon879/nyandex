<?php

namespace App\Controllers\GameData;

class CleanupController
{
    public function cleanupExtractedFiles($extractTo)
    {
        if (!is_dir($extractTo)) {
            echo "Directory not found: $extractTo\n";
            return;
        }

        $files = scandir($extractTo);
        foreach ($files as $file) {
            if ($file === '.' || $file === '..') {
                continue;
            }

            $filePath = $extractTo . '/' . $file;

            if (is_dir($filePath)) {
                if ($file === 'META-INF') {
                    // Recursively delete META-INF folder and its contents
                    $this->deleteDirectory($filePath);
                    echo "Deleted folder: $file\n";
                } else if ($file === 'assets') {
                    echo "Skipping assets folder for further processing.\n";
                }
            } else {
                unlink($filePath); // Delete files
                echo "Deleted: $file\n";
            }
        }
    }

    private function deleteDirectory($dir)
    {
        $items = scandir($dir);
        foreach ($items as $item) {
            if ($item !== '.' && $item !== '..') {
                $itemPath = $dir . '/' . $item;
                if (is_dir($itemPath)) {
                    $this->deleteDirectory($itemPath); // Recursively delete subdirectories
                } else {
                    unlink($itemPath); // Delete files
                }
            }
        }
        rmdir($dir); // Finally remove the empty directory
    }
}
