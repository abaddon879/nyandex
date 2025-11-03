<?php

declare(strict_types=1);

namespace App;

use PDO;

class Database
{
    // Add this static property to hold the connection
    private static ?PDO $pdo_connection = null;

    public function __construct(private string $host,
                                private string $name,
                                private string $user,
                                private string $password)
    {
    }

    public function getConnection(): PDO
    {
        if (self::$pdo_connection === null) {
            $dsn = "mysql:host=$this->host;dbname=$this->name;charset=utf8";

            self::$pdo_connection = new PDO($dsn, $this->user, $this->password, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC, // Good default
                PDO::ATTR_EMULATE_PREPARES   => false,         // Good for security
            ]);
        }

        return self::$pdo_connection;
    }
}