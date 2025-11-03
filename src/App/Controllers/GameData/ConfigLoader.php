<?php
declare(strict_types=1);

namespace App\Controllers\GameData;

use RuntimeException;

class ConfigLoader
{
    private static ?array $config = null;

    /**
     * Loads the configuration file and returns its content.
     */
    public static function load(): array
    {
        if (self::$config === null) {
            $configPath = dirname(__DIR__, 4) . DIRECTORY_SEPARATOR . 'config' . DIRECTORY_SEPARATOR . 'gamedata.php';

            if (!file_exists($configPath)) {
                throw new RuntimeException("Configuration file not found at: {$configPath}");
            }
            
            self::$config = require $configPath;
        }
        return self::$config;
    }

    /**
     * Retrieves a value from the configuration.
     */
    public static function get(string $key, $default = null)
    {
        $config = self::load();
        return $config[$key] ?? $default;
    }
}