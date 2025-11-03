<?php

function getAndroidAppInfo(string $storeUrl): array
{
    // Fetch the HTML content from the provided store URL
    $html = @file_get_contents($storeUrl);
    
    // Check if the content was retrieved successfully
    if ($html === false) {
        throw new Exception('Unable to fetch the app page. Please check the URL.');
    }

    // Use regex to find the version number and updated date in the HTML
    preg_match('/\[\[\[\"\d+\.\d+\.\d+/m', $html, $versionMatches);
    preg_match('/Updated on\s*<\/div><div[^>]*>([^<]*)<\/div>/', $html, $dateMatches);

    // Check if any matches were found for version
    if (empty($versionMatches) || count($versionMatches) > 1) {
        throw new Exception('Could not fetch Android app version info!');
    }

    // Check if any matches were found for the updated date
    if (empty($dateMatches)) {
        throw new Exception('Could not fetch the updated date!');
    }

    // Extract the updated date string
    $updatedDateString = trim($dateMatches[1]); // Original format

    // Return the cleaned version string and updated date
    return [
        'version' => substr(current($versionMatches), 4),
        'updated_date' => $updatedDateString, // Keep the original format
    ];
}

// Example usage
try {
    $packageName = 'jp.co.ponos.battlecatsen'; // Replace with the actual package name
    $storeUrl = 'https://play.google.com/store/apps/details?id=' . $packageName . '&hl=en';
    $appInfo = getAndroidAppInfo($storeUrl);
    echo 'Latest Version: ' . $appInfo['version'] . "\n";
    echo 'Last Updated: ' . $appInfo['updated_date'] . "\n"; // Output original date format
} catch (Exception $e) {
    echo 'Error: ' . $e->getMessage();
}