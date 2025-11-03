<?php
namespace App\Controllers\GameData;

require_once __DIR__ . '/../../../../vendor/autoload.php';  // Adjust path if necessary

use App\Controllers\GameData\ConfigLoader;

class CsvMergeController
{
    private $config;
    private $version;
    private $directory;
    private $outputDirectory;

    // Constructor to initialize the class with required parameters
    public function __construct($version)
    {
        $this->config = ConfigLoader::load();
        $this->version = $version;

         // Preserve the original value from config
        $storageDir = $this->config['unit_data_storage_dir'];
        $basePath = realpath(dirname(__DIR__, 4));

        // Build full path once
        $fullPath = $basePath . DIRECTORY_SEPARATOR . $storageDir . DIRECTORY_SEPARATOR . $version . DIRECTORY_SEPARATOR;

        // Assign both to the same resolved directory
        $this->directory = $fullPath;
        $this->outputDirectory = $fullPath;

        // Ensure the output directory exists
        if (!is_dir($this->outputDirectory)) {
            mkdir($this->outputDirectory, 0777, true);
        }
    }

    // Extract numeric part of the filename (unit or explanation file)
    private function extractNumericPart($filename)
    {
        if (preg_match('/unit(\d+)\.csv/', $filename, $matches)) {
            return (int)$matches[1]; // For unit files like 'unit001.csv'
        } elseif (preg_match('/Unit_Explanation(\d+)_en\.csv/', $filename, $matches)) {
            return (int)$matches[1]; // For explanation files like 'Unit_Explanation1_en.csv'
        }
        return 0; // Default value for non-matching files
    }

    // Method to combine CSV files
    public function mergeCSVFiles()
    {
        $csvFilesByPattern = [];

        // Iterate over the patterns in the config
        foreach ($this->config['unit_data_to_merge'] as $pattern => $outputFilename) {
            $files = glob($this->directory . $pattern);
            $csvFilesByPattern[$outputFilename] = isset($csvFilesByPattern[$outputFilename])
                ? array_merge($csvFilesByPattern[$outputFilename], $files)
                : $files;
        }

        // Process each group of files and combine them into their respective output files
        foreach ($csvFilesByPattern as $outputFilename => $csvFiles) {
            // Sort files based on their numeric part
            usort($csvFiles, function ($a, $b) {
                $aNum = $this->extractNumericPart(basename($a));
                $bNum = $this->extractNumericPart(basename($b));
                return $aNum <=> $bNum; // Sort numerically
            });

            // Combine the output directory and filename
            $outputPath = $this->outputDirectory . $outputFilename;

            // Open the output file for writing
            $outputHandle = fopen($outputPath, 'w');
            if ($outputHandle === false) {
                throw new \RuntimeException('Could not open output file for writing: ' . $outputPath);
            }

            // Find the maximum number of columns across all files (for padding)
            $maxColumns = $this->getMaxColumns($csvFiles);

            // Iterate through each CSV file in the current group
            foreach ($csvFiles as $file) {
                if (file_exists($file)) {
                    $this->processCSVFile($file, $outputHandle, $maxColumns);
                } else {
                    logMessage("File $file does not exist", 'WARNING', 'CsvMerge');
                }
            }

            // Close the output file
            fclose($outputHandle);
            logMessage("CSV files for $outputFilename have been merged into $outputPath.", 'INFO', 'CsvMerge');            
        }
        return $this->outputDirectory;
    }

    // Method to get the maximum number of columns across the CSV files
    private function getMaxColumns($csvFiles)
    {
        $maxColumns = 0;

        // First, determine the maximum number of columns in the CSV files
        foreach ($csvFiles as $file) {
            if (file_exists($file)) {
                $delimiter = (strpos(file_get_contents($file), '|') !== false) ? '|' : ',';
                $inputHandle = fopen($file, 'r');

                if ($inputHandle === false) {
                    throw new \RuntimeException("Could not open file: $file");
                }

                // Determine the maximum number of columns in this file
                while (($row = fgetcsv($inputHandle, 0, $delimiter)) !== false) {
                    $maxColumns = max($maxColumns, count($row)); // Update max columns
                }

                // Close the input file after checking columns
                fclose($inputHandle);
            }
        }

        return $maxColumns;
    }

    // Method to process each individual CSV file and write to the output
    private function processCSVFile($file, $outputHandle, $maxColumns)
    {
        // Extract the unit ID from the filename (e.g., "unit505.csv" -> 505)
        $filename = basename($file); // E.g., "unit505.csv"
        $unitId = 'Unknown';  // Default value if no matching pattern found
        $delimiter = (strpos(file_get_contents($file), '|') !== false) ? '|' : ',';  // Ensure delimiter is set


        // Check if the file matches the "unit" pattern (with a number)
        if (preg_match('/unit([A-Za-z0-9]+)\.csv/', $filename, $matches)) {
            $unitId = $matches[1];  // Extract the unit ID (e.g., "505" from "unit505.csv")
        }
        // Check if the file matches the "unit explanation" pattern
        elseif (preg_match('/Unit_Explanation(\d+)_en\.csv/', $filename, $matches)) {
            $unitId = $matches[1];  // Extract the unit ID (e.g., "1" from "Unit_Explanation1_en.csv")
        }

        // If the filename does not contain a number (no match for unit or explanation files)
        if ($unitId === 'Unknown') {
            // Open the current CSV file for reading
            $inputHandle = fopen($file, 'r');

            if ($inputHandle === false) {
                throw new \RuntimeException("Could not open file: $file");
            }

            // Initialize a row counter for this unit (used as the unitId)
            $rowCounter = 1;

            // Read each line from the input file and write it to the output file
            while (($row = fgetcsv($inputHandle, 0, $delimiter)) !== false) {
                // Insert row counter as the unitId
                array_unshift($row, $rowCounter); // Use the row index as the unitId

                // If the row has fewer columns than the max, pad it with empty values
                while (count($row) < $maxColumns) {
                    $row[] = '';  // Add empty string to pad shorter rows
                }

                // Write the updated row to the output file
                fputcsv($outputHandle, $row);

                // Increment the row counter for the next row
                $rowCounter++;
            }

            // Close the input file after reading
            fclose($inputHandle);
        } else {
            // If the file has a unitId, we follow the previous logic (unitId + row counter)
            // Open the current CSV file for reading
            $inputHandle = fopen($file, 'r');

            if ($inputHandle === false) {
                throw new \RuntimeException("Could not open file: $file");
            }

            // Initialize a row counter for this unit
            $rowCounter = 1;

            // Read each line from the input file and write it to the output file
            while (($row = fgetcsv($inputHandle, 0, $delimiter)) !== false) {
                // Insert unit ID as the first column and row counter as the second column
                array_unshift($row, $unitId);    // Add the unit ID to the first column
                array_splice($row, 1, 0, $rowCounter); // Add the row counter as the second column

                // If the row has fewer columns than the max, pad it with empty values
                while (count($row) < $maxColumns) {
                    $row[] = '';  // Add empty string to pad shorter rows
                }

                // Write the updated row to the output file
                fputcsv($outputHandle, $row);

                // Increment the row counter for this unit
                $rowCounter++;
            }

            // Close the input file after reading
            fclose($inputHandle);
        }
    }

}

?>
