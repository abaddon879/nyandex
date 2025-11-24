<?php

namespace App\Controllers\GameData;

use PDO;

class CalculateBackswingController
{
    private $pdo;
    private $maanimBasePath;

    public function __construct(PDO $pdo, string $maanimBasePath)
    {
        $this->pdo = $pdo;
        $this->maanimBasePath = rtrim($maanimBasePath, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR;
    }

    public function runOnTempTable(): void
    {
        logMessage("Starting Backswing calculation on 'temp_unit_stats'...", 'INFO', 'CalcBackswing');

        try {
            $this->pdo->exec("ALTER TABLE temp_unit_stats ADD COLUMN calculated_backswing INT DEFAULT 0");
        } catch (\Exception $e) {
            // Column likely exists
        }

        // [DOM CAT FIX] Pre-patch known broken data for Unit 13 (Dom Cat)
        // Form 1 & 2 often miss Multi-Hit data in CSV imports. Force correct frames.
        $this->pdo->exec("
            UPDATE temp_unit_stats 
            SET col_16 = '6', col_64 = '17', col_65 = '28' 
            WHERE col_1 = '14' AND col_2 IN ('1', '2') AND (col_64 IS NULL OR col_64 = '' OR col_64 = '0')
        ");

        $sql = "SELECT id, col_1, col_2, col_16, col_64, col_65 FROM temp_unit_stats";
        $stmt = $this->pdo->query($sql);
        
        $updateStmt = $this->pdo->prepare("UPDATE temp_unit_stats SET calculated_backswing = :bs WHERE id = :id");

        $updated = 0;

        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $unitId = (int)$row['col_1'] - 1;
            $formId = (int)$row['col_2'];
            
            $prefixMap = [1 => 'f', 2 => 'c', 3 => 's', 4 => 'u'];
            $prefix = $prefixMap[$formId] ?? 'f';
            
            $filename = sprintf('%03d_%s02.maanim', $unitId, $prefix);
            $fullPath = $this->maanimBasePath . $filename;

            $animLength = $this->getMaanimLength($fullPath);
            
            if ($animLength === 0) continue;

            // Get Last Hit Frame
            $hits = [
                (int)$row['col_16'],
                (int)($row['col_64'] ?? 0),
                (int)($row['col_65'] ?? 0)
            ];
            $validHits = array_filter($hits, fn($f) => $f > 0);
            
            if (empty($validHits)) {
                continue; 
            }
            
            $lastHitFrame = max($validHits);

            // [LOOP LOGIC]
            if ($lastHitFrame >= $animLength) {
                $loops = (int)ceil(($lastHitFrame + 1) / $animLength);
                $effectiveLength = $loops * $animLength;
            } else {
                $effectiveLength = $animLength;
            }

            $backswing = max(0, $effectiveLength - $lastHitFrame);

            $updateStmt->execute(['bs' => $backswing, 'id' => $row['id']]);
            $updated++;
        }

        logMessage("Calculated backswing for {$updated} rows in temp table.", 'INFO', 'CalcBackswing');
    }

    private function getMaanimLength(string $filePath): int
    {
        if (!file_exists($filePath)) return 0;
        
        $handle = fopen($filePath, 'r');
        if (!$handle) return 0;
        
        $maxFrame = -1;
        try {
            while (($line = fgets($handle)) !== false) {
                $line = trim($line);
                
                // skip empty lines
                if (strlen($line) === 0) continue;
                
                // HEURISTIC: Identify Keyframe Lines
                // 1. Must start with a digit (Frame Number)
                if (!ctype_digit($line[0])) continue;

                // 2. Must contain a comma (Eliminates Headers like "234")
                if (strpos($line, ',') === false) continue;

                $parts = explode(',', $line);
                $count = count($parts);

                // 3. Must have 3 or 4 segments (Frame, Val, Ease, Param)
                // Part Definitions usually have 6+ segments (ID, Parent, ..., Name)
                if ($count > 5) continue; 

                if (is_numeric($parts[0])) {
                    $frame = (int)$parts[0];
                    if ($frame > $maxFrame) $maxFrame = $frame;
                }
            }
        } finally {
            fclose($handle);
        }
        
        return ($maxFrame > -1) ? $maxFrame + 1 : 0;
    }
}