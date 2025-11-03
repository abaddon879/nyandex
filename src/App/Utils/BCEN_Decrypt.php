<?php

function md5Key($key) {
    return substr(md5($key), 0, 16); // Take the first 16 bytes of the MD5 hash
}

function decrypt($key, $data) {
    $aesKey = md5Key($key);
    return openssl_decrypt($data, 'AES-128-ECB', $aesKey, OPENSSL_RAW_DATA);
}

function decryptCBC($data, $key, $iv) {
    return openssl_decrypt($data, 'AES-128-CBC', $key, OPENSSL_RAW_DATA, $iv);
}

function listFiles() {
    $files = scandir('./');
    $listFiles = [];
    $packFiles = [];

    foreach ($files as $file) {
        if (pathinfo($file, PATHINFO_EXTENSION) === 'list') {
            $listFiles[] = pathinfo($file, PATHINFO_FILENAME);
        } elseif (pathinfo($file, PATHINFO_EXTENSION) === 'pack') {
            $packFiles[] = pathinfo($file, PATHINFO_FILENAME);
        }
    }

    return array_intersect($listFiles, $packFiles);
}

$subnames = listFiles();

foreach ($subnames as $subname) {
    $subdir = __DIR__ . DIRECTORY_SEPARATOR . $subname;
    if (!mkdir($subdir, 0777, true) && !is_dir($subdir)) {
        throw new \RuntimeException(sprintf('Directory "%s" was not created', $subdir));
    }

    // Read the list file
    $listFilePath = "$subname.list";
    $listFileData = file_get_contents($listFilePath);
    $listData = decrypt('pack', $listFileData);
    $fileList = explode("\n", trim($listData));
    $numFiles = (int)array_shift($fileList);

    // Read the pack file
    $packFilePath = "$subname.pack";
    $packFileData = file_get_contents($packFilePath);

    foreach ($fileList as $fileInfo) {
        if (empty($fileInfo)) continue; // Skip empty lines
        list($fileName, $fileOffset, $fileSize) = explode(",", $fileInfo);
        $fileOffset = (int)$fileOffset;
        $fileSize = (int)$fileSize;

        echo "Writing $fileName...\n";
        $fileData = substr($packFileData, $fileOffset, $fileSize);
        $finalPath = "$subdir/$fileName";

        if ($subname === "ImageDataLocal") {
            file_put_contents($finalPath, $fileData);
        } else {
            $decryptedData = decryptCBC($fileData, hex2bin("0ad39e4aeaf55aa717feb1825edef521"), hex2bin("d1d7e708091941d90cdf8aa5f30bb0c2"));
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

?>
