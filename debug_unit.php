<?php
require 'vendor/autoload.php';

// 1. SETUP
$catId = 13; // Change this to test other units (e.g. 656)
$version = '14.7.0'; // Your current version
$storageDir = 'storage/app/units/data/' . $version . '/';

echo "--- Debugging Unit ID: $catId ---\n";

// 2. CHECK FILES
$forms = [
    1 => ['prefix' => 'f', 'name' => 'Normal'],
    2 => ['prefix' => 'c', 'name' => 'Evolved'],
    3 => ['prefix' => 's', 'name' => 'True']
];

foreach ($forms as $formId => $info) {
    $prefix = $info['prefix'];
    $fileName = sprintf('%03d_%s02.maanim', $catId, $prefix);
    $fullPath = __DIR__ . '/' . $storageDir . $fileName;

    echo "\nForm $formId ({$info['name']}):\n";
    echo "  Looking for: $fileName\n";
    echo "  Path: $fullPath\n";

    if (file_exists($fullPath)) {
        echo "  [OK] File FOUND.\n";
        
        // 3. PARSE LENGTH
        $maxFrame = -1;
        $lines = file($fullPath);
        foreach ($lines as $line) {
            $line = trim($line);
            if (strlen($line) > 0 && ctype_digit($line[0])) {
                $parts = explode(',', $line);
                if (isset($parts[0]) && is_numeric($parts[0])) {
                    $f = (int)$parts[0];
                    if ($f > $maxFrame) $maxFrame = $f;
                }
            }
        }
        $len = $maxFrame + 1;
        echo "  Animation Length: $len frames\n";
        
    } else {
        echo "  [ERROR] File NOT FOUND.\n";
        if ($catId == 13) {
            echo "  -> This file MUST exist for Dom Cat. Check your copy script!\n";
        } else {
            echo "  -> If this is an Egg unit, this is normal (it doesn't attack).\n";
        }
    }
}
echo "\n";