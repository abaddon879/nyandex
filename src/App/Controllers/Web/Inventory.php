<?php

declare(strict_types=1);

namespace App\Controllers\Web;

use Psr\Http\Message\ServerRequestInterface AS Request;
use Psr\Http\Message\ResponseInterface AS Response;
use Slim\Views\PhpRenderer;

class Inventory
{
    public function __construct(private PhpRenderer $view) {}

    public function __invoke(Request $request, Response $response): Response
    {
        // --- CORRECTED: Removed apiKey ---
        $js_data = [
            'API_BASE_URL' => json_encode($_ENV['API_BASE_URL'] ?? ''),
            'userId' => json_encode($_SESSION['user_id'] ?? null)
            // 'apiKey' => json_encode($_ENV['API_KEY'] ?? '') // REMOVED
        ];

        // Render 'inventory.php' directly within the master layout
        return $this->view->render($response, 'inventory.php', [
            'title' => 'Inventory',
            'page_css' => '/assets/css/inventory.css', // Correct CSS
            'page_js' => '/assets/scripts/inventory.js', // Correct JS
            'page_js_data' => $js_data // Pass only needed data
        ]);
    }
}