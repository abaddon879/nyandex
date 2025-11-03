<?php

/**
 * Parses a text-based .maanim representation to find the animation length.
 * Assumes keyframe lines start with a number and are comma-separated.
 *
 * @param string $filePath Path to the text .maanim file.
 * @return int|false The total animation length (max_frame + 1), or false on error.
 */
function getMaanimLengthFromText(string $filePath): int|false
{
    if (!file_exists($filePath) || !is_readable($filePath)) {
        error_log("Error: File not found or not readable: " . $filePath);
        return false;
    }

    $handle = @fopen($filePath, 'r');
    if ($handle === false) {
        error_log("Error: Could not open file: " . $filePath);
        return false;
    }

    $maxFrame = -1;
    $foundKeyframes = false;

    try {
        while (($line = fgets($handle)) !== false) {
            $line = trim($line);
            // Basic check: Does the line start with a digit? Adjust if needed.
            if (strlen($line) > 0 && ctype_digit(substr($line, 0, 1))) {
                $foundKeyframes = true;
                $parts = explode(',', $line);
                if (count($parts) > 0 && is_numeric(trim($parts[0]))) {
                    $frameNum = intval(trim($parts[0]));
                    if ($frameNum > $maxFrame) {
                        $maxFrame = $frameNum;
                    }
                } else {
                     // Log unexpected format for a potential keyframe line
                     error_log("Warning: Line starting with digit has unexpected format in $filePath: $line");
                }
            }
            // Add other conditions here if needed to skip specific header lines
        }
    } catch (Exception $e) {
        error_log("Error reading text MaAnim file ($filePath): " . $e->getMessage());
        fclose($handle);
        return false;
    } finally {
        if (is_resource($handle)) {
            fclose($handle);
        }
    }

    // If file was read but no lines looked like keyframes
    if (!$foundKeyframes && $maxFrame == -1) {
         error_log("Warning: No lines recognized as keyframes in " . $filePath);
         return 1; // Default to 1 frame if file has content but no keyframes found?
    }
     // If keyframes were found but maxFrame remained -1 (e.g., all frames were 0 or negative?)
     if ($foundKeyframes && $maxFrame == -1) {
         error_log("Warning: Keyframes found, but max frame number is invalid (-1) in " . $filePath);
         return 1; // Default to 1 frame
     }


    return $maxFrame + 1;
}

// ===================================
// === TEST HARNESS SECTION ==========
// ===================================

// Use the file containing the Bahamut text data you pasted earlier
$testMaanimFile = '025_f02.maanim'; // Make sure this file exists with the text content

// --- Create a dummy test file if needed ---
// $bahamutData = <<<EOD
// [modelanim:animation]
// 1
// 79
// 29,12,1,0,0,左翼2
// 7
// 0,255,1,0
// 23,0,1,0
// 50,255,1,0
// 73,0,1,0
// 100,255,1,0
// 123,0,1,0
// 150,255,1,0
// ... (rest of the Bahamut data) ...
// EOD;
// file_put_contents($testMaanimFile, $bahamutData);
// --- End Dummy File ---


echo "Attempting to parse text file: " . $testMaanimFile . "\n";

if (file_exists($testMaanimFile)) {
    $length = getMaanimLengthFromText($testMaanimFile);

    if ($length !== false) {
        echo "-----------------------------------\n";
        echo "RESULT:\n";
        echo "Total Animation Length: $length frames\n"; // Expected for Bahamut: 151
        echo "-----------------------------------\n";
    } else {
        echo "-----------------------------------\n";
        echo "RESULT: Failed to parse the text file. Check PHP error logs.\n";
        echo "-----------------------------------\n";
    }
} else {
     echo "-----------------------------------\n";
     echo "ERROR: Test file '$testMaanimFile' not found.\n";
     echo "-----------------------------------\n";
}

?>