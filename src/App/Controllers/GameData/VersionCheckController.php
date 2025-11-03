<?php

namespace App\Controllers\GameData;

use Exception;
use DOMDocument;
use DOMXPath;
use App\Controllers\GameData\ConfigLoader;

class VersionCheckController
{
    private $config;
    private $googlePlayUrl;
    private $apkPureUrl;

    public function __construct()
    {
        // Load the configuration
        $this->config = ConfigLoader::load();
        $this->googlePlayUrl = $this->config['google_play_url'] ?? '';
        $this->apkPureUrl = $this->config['apk_pure_url'] ?? '';

    }

    public function run(): void
    {
        try {
            // Get app info from Google Play
            $appInfo = $this->getPlayStoreInfo();
            logMessage('Latest Version on Google Play: ' . $appInfo['version'], 'INFO', 'VersionCheck');
            logMessage('Last Updated on Google Play: ' . $appInfo['updated_date'], 'INFO', 'VersionCheck');

            // Get APKPure info
            $apkPureInfo = $this->getApkPureInfo();
            logMessage('Latest Version on APKPure: ' . $apkPureInfo['version'], 'INFO', 'VersionCheck');
            logMessage('Release Date on APKPure: ' . $apkPureInfo['release_date'], 'INFO', 'VersionCheck');

            // Compare versions
            if ($appInfo['version'] === $apkPureInfo['version']) {
                logMessage("Versions match.", 'INFO', 'VersionCheck');
            } else {
                logMessage("Versions do not match.", 'WARNING', 'VersionCheck');
            }            

        } catch (Exception $e) {
            logMessage('Error: ' . $e->getMessage(), 'ERROR', 'VersionCheck');
        }
    }

     // --- NEW HELPER FUNCTION ---
    private function fetchHtmlWithCurl(string $url): string
    {
        $headers = [
            "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language: en-US,en;q=0.5",
            "Referer: https://www.google.com/",
            "Upgrade-Insecure-Requests: 1"
        ];
        
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36');
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_ENCODING, ''); // Handles gzip, deflate, etc. automatically
        
        $html = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        
        if (curl_errno($ch) || $httpCode >= 400) {
            $error = curl_error($ch);
            curl_close($ch);
            throw new Exception("cURL failed to fetch {$url}. HTTP Status: {$httpCode}. Error: {$error}");
        }
        
        curl_close($ch);
        return $html;
    }

    public function getPlayStoreInfo(): array
    {
        $html = $this->fetchHtmlWithCurl($this->googlePlayUrl);
        
        if ($html === false) {
            throw new Exception('Unable to fetch Google Play Store app page. Please check the URL: ' . $this->googlePlayUrl);
        }

        preg_match('/\[\[\[\"\d+\.\d+\.\d+/m', $html, $versionMatches);
        preg_match('/Updated on\s*<\/div><div[^>]*>([^<]*)<\/div>/', $html, $dateMatches);

        if (empty($versionMatches) || count($versionMatches) !== 1) {
            throw new Exception('Could not fetch Google Play Store app version info!');
        }

        if (empty($dateMatches)) {
            throw new Exception('Could not fetch Google Play Store app last updated date!');
        }

        // Format the release date to ensure it is in 'YYYY-MM-DD' format
        $formattedDate = $this->formatDate($dateMatches[1]);

        return [
            'version' => substr(current($versionMatches), 4),
            'updated_date' => $formattedDate,
        ];
    }

    public function getApkPureInfo(): array
    {
        $html = $this->fetchHtmlWithCurl($this->apkPureUrl);

        if ($html === false) {
            throw new Exception('Unable to fetch APKPure page. Please check the URL: ' . $this->apkPureUrl);
        }

        // Use DOMDocument for better parsing
        $dom = new DOMDocument();
        @$dom->loadHTML($html); // Suppress warnings due to malformed HTML

        // Initialize a new XPath
        $xpath = new DOMXPath($dom);

        // Fetch the latest version
        $versionNode = $xpath->query('//div[@class="info" and contains(., "Latest Version")]/div[@class="additional-info"]');

        if ($versionNode === false || $versionNode->length === 0) {
            throw new Exception('Could not fetch APKPure version!');
        }

        // Get the full version number
        $version = trim($versionNode->item(0)->nodeValue);

        // Fetch the release date
        $dateNode = $xpath->query('//div[@class="date one-line"]');
        $releaseDate = $dateNode->length > 0 ? trim($dateNode->item(0)->nodeValue) : null;

        if (empty($releaseDate)) {
            throw new Exception('Could not fetch APKPure release date!');
        }

        // Format the release date
        $formattedReleaseDate = $this->formatDate($releaseDate);

        return [
            'version' => $version,
            'release_date' => $formattedReleaseDate,
        ];
    }

    private function formatDate(string $dateString): string
    {
        if (strtotime($dateString)) {
            return date('Y-m-d', strtotime($dateString));
        }
        return '0000-00-00';
    }

}
