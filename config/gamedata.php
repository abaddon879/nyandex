<?php

$packageName = 'jp.co.ponos.battlecatsen';

return [

    //======================================================================
    // 1. CORE URLS
    //======================================================================
    // URLs used for checking versions and downloading game files.
    //----------------------------------------------------------------------
    'google_play_url' => 'https://play.google.com/store/apps/details?id=' . $packageName . '&hl=en',
    'apk_pure_url' => 'https://apkpure.net/the-battle-cats/' . $packageName,
    'apk_pure_download_url' => 'https://d.apkpure.net/b/XAPK/' . $packageName . '?version=latest',


    //======================================================================
    // 2. FILESYSTEM PATHS
    //======================================================================
    // Base paths for storing data at various stages of the process.
    // These are relative to the project's root directory.
    //----------------------------------------------------------------------
    'game_data_download_path' => 'storage/downloads',       // Where downloaded .xapk files are stored.
    'extracted_path_base' => 'storage/extracted',           // Where .xapk contents are extracted.
    'decrypted_path_base' => 'storage/decrypted',           // Where decrypted game files are placed.


    //======================================================================
    // 3. PROCESS CONFIGURATION
    //======================================================================
    // Settings that control each step of the automated pipeline.
    //----------------------------------------------------------------------

    /**
     * Stage 1 & 2: Extraction & Decryption
     * Defines which files to pull from archives and which resulting
     * folders contain data that needs to be decrypted.
     */
    'files_to_extract' => [
        'InstallPack.apk',
    ],
    'files_to_decrypt' => [
        'resLocal',
        'UnitLocal',
        'DataLocal',
        'ImageLocal',
        'ImageDataLocal',
        'DownloadLocal',
    ],

    /**
     * Stage 3: File Organization (Move)
     * Regex patterns to find specific files in the decrypted data
     * and the final directories to store them in, organized by type.
     */
    // Unit Data & Images
    'unit_data_storage_dir' => 'storage/app/units/data', 
    'unit_data_to_move' => [
        'DataLocal/nyankoPictureBookData\.csv',                             // Unit availability (1), # of forms (3), and scaling in cat guide (5-8)
        'DataLocal/SkillAcquisition.csv',                                   // Unit talents
        'DataLocal/SkillLevel.csv',                                         // Unit talents cost
        'DataLocal/unit\d+\.csv',                                           // Unit stats and attributes
        'DataLocal/unitbuy.csv',                                            // Unit upgrades and evolution
        'DataLocal/unitexp.csv',                                            // Unit upgrade cost
        'DataLocal/unitlevel.csv',                                          // Unit attribute growth
        'resLocal/nyankoPictureBook_en.csv',                                // Acquisition/Evolution messages (Can be used to gain banner and/or stage names)
        'resLocal/nyankoPictureBook2_en.csv',                               // Ability descriptions
        'resLocal/SkillDescriptions.csv',                                   // Talent descriptions
        'resLocal/Unit_Explanation\d+_en\.csv',                             // Unit names and description
    ],
    'unit_images_storage_dir' => 'storage/app/units/images',
    'unit_images_to_move' => [
        'UnitLocal/.*\.png',
    ],

    // Item & Game Data/Images
    'game_data_storage_dir' => 'storage/app/items/data', 
    'game_data_to_move' => [
        'DataLocal/BaseRecipe_\d+\.csv',                                    // Cannon upgrade costs
        'DataLocal/CastleRecipe_\d+\.csv',                                  // Foundation upgrade costs
        'DataLocal/DecoRecipe_\d+\.csv',                                    // Style upgrade costs
        'resLocal/CastleRecipeDescriptions.csv',                            // Cannon names and descriptions
        'resLocal/GatyaitemName.csv',                                       // Gacha item names and descriptions
        'resLocal/user_info.tsv',                                           // User rank rewards
    ],
    'game_images_storage_dir' => 'storage/app/items/images',
    'game_images_to_move' => [
        'ImageLocal/gatyaitemD_\d+\_f\.png'
    ],

    // Orb Images
    'orb_images_storage_dir' => 'public/assets/images/cuts',
    'orb_images_to_move' => [
        'ImageDataLocal/eqipment_*.imgcut',
        'ImageLocal/eqipment_*.png'
    ],

    //======================================================================
    // Stage 3.5: Public Asset Publishing
    //======================================================================
    // Defines paths and patterns for copying processed data (from storage)
    // to the public-facing 'assets' directory.
    //----------------------------------------------------------------------
    'public_unit_images_dest' => 'public/assets/images/units',
    'public_unit_images_pattern' => 'uni\d+\_.*\.png$',

    'public_item_images_dest' => 'public/assets/images/items',
    'public_item_images_pattern' => 'gatyaitemD_\d+\_f\.png$',


    /**
     * Stage 4: CSV Merging
     * Defines which groups of files should be merged into a single CSV.
     * 'pattern' => 'output_filename.csv'
     */
    'unit_data_to_merge' => [
        'unit[0-9]*.csv' => 'units.csv',                                    // All unit files go into combined_units.csv
        'Unit_Explanation[0-9]*_en.csv' => 'unit_explanations.csv',         // All explanation files go into combined_explanations.csv
    ],
    'game_data_to_merge' => [
        'BaseRecipe_[0-9]*.csv' => 'BaseRecipes.csv',                       // All unit files go into combined_units.csv
        'CastleRecipe_[0-9]*.csv' => 'CastleRecipes.csv',                   // All explanation files go into combined_explanations.csv
        'DecoRecipe_[0-9]*.csv' => 'DecoRecipes.csv',                       // All explanation files go into combined_explanations.csv
    ],

    /**
     * Stage 5: Database Import (ETL)
     * A map that tells the EtlController which files to load, which
     * database table to use, and where to find the source file.
     * This replaces the old `unit_data_to_import` and `game_data_to_import` lists.
     */
    'database_imports' => [
        'unit_explanations' => [
            'source_file' => 'unit_explanations.csv', // Merged file with unit names/descriptions
            'destination_table' => 'unit_explanations',
            'source_dir_key' => 'unit_data_storage_dir',
            'has_header' => false,
        ],
        'unit_evolutions' => [
            'source_file' => 'unitbuy.csv', // Contains evolution requirements
            'destination_table' => 'unit_evolutions',
            'source_dir_key' => 'unit_data_storage_dir',
            'has_header' => false,
        ],
        'picture_book' => [
            'source_file' => 'nyankoPictureBookData.csv',
            'destination_table' => 'picture_book_data', // You'll need a corresponding final table
            'source_dir_key' => 'unit_data_storage_dir',
            'has_header' => false,
        ],
        'unit_stats' => [
            'source_file' => 'units.csv', // The merged file with all stats
            'destination_table' => 'unit_stats', // This becomes 'temp_unit_stats'
            'source_dir_key' => 'unit_data_storage_dir',
            'has_header' => false, // As per your CsvMergeController logic
        ],        
    ],


    //======================================================================
    // 4. APPLICATION SETTINGS
    //======================================================================

    /**
     * Logging Configuration
     */
    'log_file' => 'logs/gamedata_update.log',
    'min_log_level' => 'INFO', // Options: DEBUG, INFO, WARNING, ERROR

    /**
     * Database & API Connection
     * Credentials are loaded from the .env file for security.
     */
    'api_base_url' => 'http://nyandex.test/api',
    'db' => [
        'host' => $_ENV['DB_HOST'] ?? '127.0.0.1',
        'port' => $_ENV['DB_PORT'] ?? '3306',
        'database' => $_ENV['DB_NAME'] ?? 'nyandb',
        'username' => $_ENV['DB_USER'] ?? 'root',
        'password' => $_ENV['DB_PASS'] ?? '',
    ],
];