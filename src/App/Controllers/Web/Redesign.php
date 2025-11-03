<?php

declare(strict_types=1);

namespace App\Controllers\Web;

use Psr\Http\Message\ServerRequestInterface AS Request;
use Psr\Http\Message\ResponseInterface AS Response;
use Slim\Views\PhpRenderer;

class Redesign
{

    public function __construct(private PhpRenderer $view)
    {        
    }

    public function __invoke(Request $request, Response $response): Response
    {
   
        return $this->view->render($response, 'redesign.php');
    }
}