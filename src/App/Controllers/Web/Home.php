<?php

declare(strict_types=1);

namespace App\Controllers\Web;

use Psr\Http\Message\ServerRequestInterface AS Request;
use Psr\Http\Message\ResponseInterface AS Response;
use Slim\Views\PhpRenderer;

class Home
{
    // --- Constructor remains the same ---
    public function __construct(private PhpRenderer $view) {}

    public function __invoke(Request $request, Response $response): Response
    {
        if (empty($_SESSION['user_id'])) {
            // --- USER IS LOGGED OUT ---
            // Render the new landing page directly
            return $this->view->render($response, 'landing.php', [
                'title' => 'Welcome to pAwesome Tracker' // Title for layout.php
            ]);
        } else {
            // --- USER IS LOGGED IN ---
            // Render the simple dashboard page (home.php) directly
            return $this->view->render($response, 'home.php', [ // Keep rendering home.php
                'title' => 'Dashboard' // Title for layout.php
            ]);
        }
    }
}