<?php

// Translation arrays
$enemyTranslations = [
    '赤' => 'Red',
    '浮き' => 'Floating',
    '黒' => 'Black',
    'メタル' => 'Metal',
    '天使' => 'Angel',
    'エイリアン' => 'Alien',
    'ゾンビ' => 'Zombie',
    '古代' => 'Relic',
    '白' => 'Traitless',
    '悪魔' => 'Aku',
    '魔女（欠番）' => 'Witch (unused)',
    '使徒（欠番）' => 'Apostle (unused)',
    '属性なし' => 'No Trait'
];

$effectTranslations = [
    'ダメージアップ' => 'Attack',
    'ダメージ軽減' => 'Defense',
    'めっぽう強い' => 'Strong',
    '超ダメージ' => 'Massive Damage',
    '打たれ強い' => 'Tough',
    'デス小烈波' => 'Small Death Shockwave',
    '波動耐性' => 'Wave Resist',
    '死亡時コスト返却' => 'Refund on Death',
    'ふっとばし耐性' => 'Knockback Resist',
    'レジェンドストーリー強化' => 'Legend Story Boost',
    '超生命体特効' => 'Anti-Relic Effect',
    'にゃんこ砲チャージ' => 'Cannon Charge',
    '毒撃ダメージ耐性' => 'Toxic Resist',
    '全攻撃無効' => 'Immune to All Attacks',
    '動きを遅くする耐性' => 'Slow Resist',
    '古代の呪い耐性' => 'Curse Resist',
    '真レジェンドストーリー強化' => 'True Legend Story Boost',
    '即席烈波カウンター' => 'Instant Shockwave Counter',
    '撃破時攻撃力アップ' => 'Attack Up on Kill',
    '生産スピードアップ' => 'Faster Production',
    '動きを止める耐性' => 'Freeze Resist',
    '攻撃力ダウン耐性' => 'Attack Down Resist'
];

$gradeTranslations = [
    'D' => 'D',
    'C' => 'C',
    'B' => 'B',
    'A' => 'A',
    'S' => 'S'
];

// Function to parse .imgcut files
function parseImgcutFile($filePath) {
    $file = fopen($filePath, 'r');
    $lines = [];
    while (($line = fgets($file)) !== false) {
        $lines[] = trim($line);
    }
    fclose($file);

    $imgcut = [];
    $imgcut['image_file'] = $lines[1];
    $imgcut['regions'] = [];

    for ($i = 3; $i < count($lines); $i++) {
        $parts = explode(',', $lines[$i]);
        if (count($parts) < 5) {
            continue; // Skip lines that do not have enough data
        }
        list($x, $y, $width, $height, $label) = $parts;

        // Ensure that dimensions are valid
        if ($width > 0 && $height > 0) {
            $imgcut['regions'][] = [
                'x' => (int)$x,
                'y' => (int)$y,
                'width' => (int)$width,
                'height' => (int)$height,
                'label' => $label
            ];
        }
    }

    return $imgcut;
}

// Function to create orb images
function createOrbImages($effectsFile, $effectsImage, $gradesFile, $gradesImage, $attributesFile, $attributesImage) {
    global $enemyTranslations, $effectTranslations, $gradeTranslations; // Access global translation arrays

    $enemyTypes = parseImgcutFile($attributesFile);
    $effects = parseImgcutFile($effectsFile);
    $grades = parseImgcutFile($gradesFile);

    // Load images
    $enemyImage = imagecreatefrompng($attributesImage);
    $effectImage = imagecreatefrompng($effectsImage);
    $gradeImage = imagecreatefrompng($gradesImage);

    foreach ($enemyTypes['regions'] as $enemyRegion) {
        foreach ($effects['regions'] as $effectRegion) {
            foreach ($grades['regions'] as $gradeRegion) {
                $finalImage = imagecreatetruecolor(85, 85);
                imagesavealpha($finalImage, true);
                $transparency = imagecolorallocatealpha($finalImage, 0, 0, 0, 127);
                imagefill($finalImage, 0, 0, $transparency);

                // Validate and crop the images
                $enemyCut = null;
                if ($enemyRegion['width'] > 0 && $enemyRegion['height'] > 0) {
                    $enemyCut = imagecrop($enemyImage, [
                        'x' => $enemyRegion['x'],
                        'y' => $enemyRegion['y'],
                        'width' => $enemyRegion['width'],
                        'height' => $enemyRegion['height']
                    ]);
                }

                $effectCut = null;
                if ($effectRegion['width'] > 0 && $effectRegion['height'] > 0) {
                    $effectCut = imagecrop($effectImage, [
                        'x' => $effectRegion['x'],
                        'y' => $effectRegion['y'],
                        'width' => $effectRegion['width'],
                        'height' => $effectRegion['height']
                    ]);
                }

                $gradeCut = null;
                if ($gradeRegion['width'] > 0 && $gradeRegion['height'] > 0) {
                    $gradeCut = imagecrop($gradeImage, [
                        'x' => $gradeRegion['x'],
                        'y' => $gradeRegion['y'],
                        'width' => $gradeRegion['width'],
                        'height' => $gradeRegion['height']
                    ]);
                }

                // Only proceed if all cuts were successful
                if ($enemyCut && $effectCut && $gradeCut) {
                    // Composite the cuts
                    imagecopy($finalImage, $enemyCut, 0, 0, 0, 0, 85, 85);
                    imagecopy($finalImage, $effectCut, 0, 0, 0, 0, 85, 85);
                    imagecopy($finalImage, $gradeCut, 0, 0, 0, 0, 85, 85);
                    
                    // Translate labels to English
                    $enemyLabelEnglish = $enemyTranslations[$enemyRegion['label']] ?? $enemyRegion['label'];
                    $effectLabelEnglish = $effectTranslations[$effectRegion['label']] ?? $effectRegion['label'];
                    $gradeLabelEnglish = $gradeTranslations[$gradeRegion['label']] ?? $gradeRegion['label'];

                    // Create a filename based on the English labels
                    $filename = "{$enemyLabelEnglish}_{$effectLabelEnglish}_{$gradeLabelEnglish}.png";
                    //imagepng($finalImage, $filename);
                    imagepng($finalImage, "C:\\xampp\\htdocs\\pawesome-tracker\\public\\assets\\images\\cuts\\$filename");

                } else {
                    // Log or handle the failure
                    echo "Failed to crop images for: {$enemyRegion['label']} - {$effectRegion['label']} - {$gradeRegion['label']}\n";
                }

                // Free memory for cuts
                if ($enemyCut) imagedestroy($enemyCut);
                if ($effectCut) imagedestroy($effectCut);
                if ($gradeCut) imagedestroy($gradeCut);
                imagedestroy($finalImage);
            }
        }
    }

    // Free memory for loaded images
    imagedestroy($enemyImage);
    imagedestroy($effectImage);
    imagedestroy($gradeImage);
}

// Call the function with the correct paths
createOrbImages(
    "C:\\xampp\\htdocs\\pawesome-tracker\\public\\assets\\images\\cuts\\equipment_effect.imgcut",
    "C:\\xampp\\htdocs\\pawesome-tracker\\public\\assets\\images\\cuts\\equipment_effect.png",
    "C:\\xampp\\htdocs\\pawesome-tracker\\public\\assets\\images\\cuts\\equipment_grade.imgcut",
    "C:\\xampp\\htdocs\\pawesome-tracker\\public\\assets\\images\\cuts\\equipment_grade.png",
    "C:\\xampp\\htdocs\\pawesome-tracker\\public\\assets\\images\\cuts\\equipment_attribute.imgcut",
    "C:\\xampp\\htdocs\\pawesome-tracker\\public\\assets\\images\\cuts\\equipment_attribute.png"
);

