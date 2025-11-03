<?php

$packageName = 'jp.co.ponos.battlecatsen';

return [
    'google_play_url' => 'https://play.google.com/store/apps/details?id=' . $packageName . '&hl=en',
    'apk_pure_url' => 'https://apkpure.net/the-battle-cats/' . $packageName,
    'apk_pure_download_url' => 'https://d.apkpure.net/b/XAPK/' . $packageName . '?version=latest',
    'game_data_download_path' => '/../../../../game_data_download',
    'files_to_extract' => [
        'InstallPack.apk',
        // Add more files/folders as needed
    ],
    'files_to_decrypt' => [
        'resLocal',
        'UnitLocal',
        'DataLocal',
        // Add more files/folders as needed
    ],
    
    'data_files_to_move' => [

        'DataLocal/BaseRecipe_\d+\.csv',            // Cannon upgrade costs
        'DataLocal/CastleRecipe_\d+\.csv',          // Foundation upgrade costs
        'DataLocal/DecoRecipe_\d+\.csv',            // Style upgrade costs
        'DataLocal/nyankoPictureBookData\.csv',     // Unit availability (1), # of forms (3), and scaling in cat guide (5-8)
        'DataLocal/SkillAcquisition.csv',           // Unit talents
        'DataLocal/SkillLevel.csv',                 // Unit talents cost
        'DataLocal/unit\d+\.csv',                   // Unit stats and attributes
        'DataLocal/unitbuy.csv',                    // Unit upgrades and evolution
        'DataLocal/unitexp.csv',                    // Unit upgrade cost
        'DataLocal/unitlevel.csv',                  // Unit attribute growth

        'resLocal/CastleRecipeDescriptions.csv',    // Cannon names and descriptions
        'resLocal/GatyaitemName.csv',               // Gacha item names and descriptions
        'resLocal/nyankoPictureBook_en.csv',        // Acquisition/Evolution messages (Can be used to gain banner and/or stage names)
        'resLocal/nyankoPictureBook2_en.csv',       // Ability descriptions
        'resLocal/SkillDescriptions.csv',           // Talent descriptions
        'resLocal/Unit_Explanation\d+_en\.csv',     // Unit names and description
        'resLocal/user_info.tsv',                   // User rank rewards
        // Add more files/folders as needed
    ],
    'data_files_to_move_destination_dir' => '/../../../../csv_import', 
    
    'unit_images_to_move' => [
        'UnitLocal/.*\.png',
        // Add more files/folders as needed
    ],
    'unit_images_destination_dir' => '/../../../../public/images/units',
    
    'game_images_to_move' => [
        'gatyaitemD_\d+\_f\.png'
        // Add more files/folders as needed
    ],
    'game_images_destination_dir' => '/../../../../public/images/items',
];
