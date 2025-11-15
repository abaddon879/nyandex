<?php

use App\Database;
use Psr\Container\ContainerInterface; // <-- Import the container interface
use Psr\Http\Message\ResponseFactoryInterface; // <-- Add this import
use Slim\Psr7\Factory\ResponseFactory;        // <-- Add this import
use Slim\Views\PhpRenderer;

return [

    Database::class => function() {

        return new Database(host: $_ENV['DB_HOST'],
                            name: $_ENV['DB_NAME'],
                            user: $_ENV['DB_USER'],
                            password: $_ENV['DB_PASS']);
    },

    PDO::class => function (ContainerInterface $c) {
        // First, get the Database object from the container
        $database = $c->get(Database::class); 
        
        // Then, return the PDO connection from it
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