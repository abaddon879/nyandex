<?php

function getApkDetails($apkUrl) {
    // Initialize cURL
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $apkUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    
    // Set user agent to mimic a browser
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
    ]);
    
    // Execute the request and get the response
    $response = curl_exec($ch);
    curl_close($ch);
    
    // Load the HTML into DOMDocument
    $dom = new DOMDocument();
    @$dom->loadHTML($response);
    
    // Create a new DOMXPath object
    $xpath = new DOMXPath($dom);
    
    // Extract app title
    $titleNode = $xpath->query('//h1[@class="info-title"]');
    $title = $titleNode->length > 0 ? trim($titleNode->item(0)->textContent) : 'Not Found';

    // Extract version
    $versionNode = $xpath->query('//span[contains(@class,"info-sdk")]/span');
    $version = $versionNode->length > 0 ? trim($versionNode->item(0)->textContent) : 'Not Found';

    return [
        'title' => $title,
        'version' => $version,
    ];
}

function downloadFile($url, $savePath) {
    echo "Downloading APK/XAPK...\n";
    $ch = curl_init($url);
    $fp = fopen($savePath, 'wb');
    curl_setopt($ch, CURLOPT_FILE, $fp);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_exec($ch);
    curl_close($ch);
    fclose($fp);
    echo "Downloaded to: $savePath\n";
}

function extractXAPK($zipPath, $extractTo) {
    echo "Extracting APK/XAPK...\n";
    $zip = new ZipArchive;
    if ($zip->open($zipPath) === TRUE) {
        $zip->extractTo($extractTo);
        $zip->close();
        echo "Extracted to: $extractTo\n";
    } else {
        echo "Failed to extract $zipPath\n";
    }
}

function processExtractedApks($extractTo) {
    echo "Contents of the extracted APK/XAPK:\n";
    $apkFiles = scandir($extractTo);
    $apkFiles = array_diff($apkFiles, ['.', '..']);
    foreach ($apkFiles as $file) {
        echo " - $file\n";
    }
    return $apkFiles;
}

function extractApksFromXAPK($extractTo) {
    global $apkFiles;
    foreach ($apkFiles as $apkFile) {
        $apkPath = "$extractTo/$apkFile";
        // Only process if it is an APK file
        if (pathinfo($apkPath, PATHINFO_EXTENSION) === 'apk') {
            $apkExtractTo = "$extractTo/$apkFile-extracted";
            echo "Extracting $apkFile...\n";
            $zip = new ZipArchive;
            if ($zip->open($apkPath) === TRUE) {
                $zip->extractTo($apkExtractTo);
                $zip->close();
                echo "Extracted to: $apkExtractTo\n";
            } else {
                echo "Failed to extract $apkFile\n";
            }
        }
    }
}

// Example usage
$apkUrl = 'https://apkpure.net/the-battle-cats/jp.co.ponos.battlecatsen/download';
$apkDetails = getApkDetails($apkUrl);
print_r($apkDetails);

$downloadPath = "$apkDetails[title] $apkDetails[version].zip";
downloadFile('https://d.apkpure.net/b/XAPK/jp.co.ponos.battlecatsen?version=latest', $downloadPath);

$extractPath = 'extracted_apks/';
if (!is_dir($extractPath)) {
    mkdir($extractPath, 0777, true);
}
extractXAPK($downloadPath, $extractPath);

// Process and log contents of extracted APK/XAPK
$apkFiles = processExtractedApks($extractPath);

// Extract APKs from the extracted XAPK
extractApksFromXAPK($extractPath);

?>
