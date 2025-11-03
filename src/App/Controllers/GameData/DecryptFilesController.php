<?php

namespace App\Controllers\GameData;

use App\Controllers\GameData\ConfigLoader;

class DecryptFilesController
{
    private $assetsFolder;
    private $filesToDecrypt;
    private $decryptedBasePath;

    public function __construct($assetsFolder = null)
    {
        if ($assetsFolder === null) {
            throw new \Exception('No assets folder path provided.');
        }
        $this->assetsFolder = $assetsFolder;

        // Load the configuration file and set files to decrypt
        $config = ConfigLoader::load();
        $this->filesToDecrypt = $config['files_to_decrypt'] ?? [];
        $this->decryptedBasePath = dirname(__DIR__, 4) . DIRECTORY_SEPARATOR . $config['decrypted_path_base'];

        $versionFolder = basename(dirname(dirname($assetsFolder))); // e.g., "The Battle Cats_14.3.0"
        $this->decryptedBasePath = dirname(__DIR__, 4) . DIRECTORY_SEPARATOR . $config['decrypted_path_base'] . DIRECTORY_SEPARATOR . $versionFolder;

    }

    public function run()
    {
        logMessage("Assets folder: {$this->assetsFolder}", 'DEBUG', 'Decrypt');
        logMessage("Files to decrypt:", 'DEBUG', 'Decrypt');
        foreach ($this->filesToDecrypt as $file) {
            log("- $file");
        }
        $this->processFiles();
    }

    public function processFiles()
    {
        foreach ($this->filesToDecrypt as $subname) {
            $subdir = $this->decryptedBasePath . DIRECTORY_SEPARATOR . $subname;

            logMessage("Processing directory: $subdir", 'DEBUG', 'Decrypt');

            // Create directory for each file
            if (!is_dir($subdir) && !mkdir($subdir, 0777, true)) {
                throw new \RuntimeException(sprintf('Directory "%s" was not created', $subdir));
            }

            // Read the list file
            $listFilePath = $this->assetsFolder . DIRECTORY_SEPARATOR . "$subname.list";
            if (!file_exists($listFilePath)) {
                logMessage("List file for $subname does not exist.", 'WARNING', 'Decrypt');
                continue;
            }
            $listFileData = file_get_contents($listFilePath);
            $listData = $this->decrypt('pack', $listFileData);
            $fileList = explode("\n", trim($listData));
            $numFiles = (int)array_shift($fileList);

            // Read the pack file
            $packFilePath = $this->assetsFolder . DIRECTORY_SEPARATOR . "$subname.pack";
            if (!file_exists($packFilePath)) {
                logMessage("Pack file for $subname does not exist.", 'WARNING', 'Decrypt');
                continue;
            }
            $packFileData = file_get_contents($packFilePath);

            foreach ($fileList as $fileInfo) {
                if (empty($fileInfo)) continue; // Skip empty lines
                list($fileName, $fileOffset, $fileSize) = explode(",", $fileInfo);
                $fileOffset = (int)$fileOffset;
                $fileSize = (int)$fileSize;

                //echo "Writing $fileName...\n";
                $fileData = substr($packFileData, $fileOffset, $fileSize);
                $finalPath = $subdir . DIRECTORY_SEPARATOR . $fileName;

                if ($subname === "ImageDataLocal") {
                    file_put_contents($finalPath, $fileData);
                } else {
                    $decryptedData = $this->decryptCBC($fileData, hex2bin("0ad39e4aeaf55aa717feb1825edef521"), hex2bin("d1d7e708091941d90cdf8aa5f30bb0c2"));
                    $byteTest = substr($decryptedData, -1);

                    // Handle padding as in the original Python script
                    $readFile = match ($byteTest) {
                        "\x00" => substr($decryptedData, 0, -1),
                        "\x01" => substr($decryptedData, 0, -1),
                        "\x02" => substr($decryptedData, 0, -2),
                        "\x03" => substr($decryptedData, 0, -3),
                        "\x04" => substr($decryptedData, 0, -4),
                        "\x05" => substr($decryptedData, 0, -5),
                        "\x06" => substr($decryptedData, 0, -6),
                        "\x07" => substr($decryptedData, 0, -7),
                        "\x08" => substr($decryptedData, 0, -8),
                        "\t" => substr($decryptedData, 0, -9),
                        "\n" => (substr($decryptedData, -2) === "\n\n") ? substr($decryptedData, 0, -10) : $decryptedData,
                        "\x0b" => substr($decryptedData, 0, -11),
                        "\x0c" => substr($decryptedData, 0, -12),
                        "\r" => substr($decryptedData, 0, -13),
                        "\x0e" => substr($decryptedData, 0, -14),
                        "\x0f" => substr($decryptedData, 0, -15),
                        "\x10" => substr($decryptedData, 0, -16),
                        default => $decryptedData,
                    };

                    file_put_contents($finalPath, $readFile);
                }
            }
        }
    }

    private function md5Key($key)
    {
        return substr(md5($key), 0, 16); // Take the first 16 bytes of the MD5 hash
    }

    private function decrypt($key, $data)
    {
        $aesKey = $this->md5Key($key);
        return openssl_decrypt($data, 'AES-128-ECB', $aesKey, OPENSSL_RAW_DATA);
    }

    private function decryptCBC($data, $key, $iv)
    {
        return openssl_decrypt($data, 'AES-128-CBC', $key, OPENSSL_RAW_DATA, $iv);
    }
}