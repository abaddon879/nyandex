<?php

declare(strict_types=1);

namespace App\Controllers\Web;

use Psr\Http\Message\ServerRequestInterface AS Request;
use Psr\Http\Message\ResponseInterface AS Response;
use Slim\Views\PhpRenderer;

class Catalog // Renaming this class might be a good idea later
{
    // --- Constructor remains the same ---
    public function __construct(private PhpRenderer $view)
    {        
    }

    // --- UPDATED: __invoke() method ---
    public function __invoke(Request $request, Response $response): Response
    {
        return $this->view->render($response, 'catalog.php', [
            'title' => 'Cat Catalog',
            'page_css' => '/assets/css/catalog.css', // Load the app's CSS
            'page_js_module' => '/assets/scripts/app.js' // Load the app's JS module
        ]);
    }
}