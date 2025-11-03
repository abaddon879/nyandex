<?php

namespace App\Controllers\CLI;

require __DIR__ .  '/../../../../vendor/autoload.php';

class RunController
{
    public function runController(string $controllerName): void
    {
        // Full namespace for controllers
        $namespace = 'App\Controllers\\';

        // Build the full class name
        $fullClassName = $namespace . 'GameData\\' . $controllerName;

        // Check if the controller class exists
        if (!class_exists($fullClassName)) {
            echo "Error: Controller '$fullClassName' does not exist.\n";
            return;
        }

        // Instantiate the controller
        $controller = new $fullClassName();

        // Call the run method
        $controller->run();
    }
}

// Get the controller name from command-line arguments
if (isset($argv[1])) {
    $controllerName = $argv[1];

    // Instantiate and run the RunController
    $runController = new RunController();
    $runController->runController($controllerName);
} else {
    echo "Please provide a controller name as an argument.\n";
}
