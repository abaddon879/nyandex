<?php

use App\Database;
use Psr\Container\ContainerInterface;
use Psr\Http\Message\ResponseFactoryInterface;
use Slim\Psr7\Factory\ResponseFactory;
use Slim\Views\PhpRenderer;

return [

    Database::class => function() {
        // HELPER: Try $_SERVER (Docker), then getenv() (System), then $_ENV (Dotenv)
        $getEnv = fn($key, $default) => $_SERVER[$key] ?? getenv($key) ?? $_ENV[$key] ?? $default;

        $host = $getEnv('DB_HOST', '127.0.0.1');
        $name = $getEnv('DB_NAME', 'nyandb');
        $user = $getEnv('DB_USER', 'root');
        $pass = $getEnv('DB_PASS', '');

        return new Database(
            host: $host,
            name: $name,
            user: $user,
            password: (string)$pass
        );
    },

    PDO::class => function (ContainerInterface $c) {
        $database = $c->get(Database::class);
        return $database->getConnection();
    },
    
    ResponseFactoryInterface::class => function() {
        return new ResponseFactory();
    },

    PhpRenderer::class => function() {
        $render = new PhpRenderer(__DIR__ . '/../views');
        $render->setLayout('layout.php');
        return $render;
    }
];