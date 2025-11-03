<?php

declare(strict_types=1);

namespace App\Middleware;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;
use Slim\Psr7\Factory\ResponseFactory;;

class AddApiKeyToRequests
{
    public function __construct(private ResponseFactory $responseFactory)
    {
    }
    
    public function __invoke(Request $request, RequestHandler $handler): Response
    {
        // Check if the request is coming from the cats page
        if ($request->getUri()->getPath() === '/cats') {

            // Get the API key from environment variables
            $apiKey = $_ENV['API_KEY'];
            
            // Store the API key in the request headers
            $request = $request->withHeader('X-API-Key', $apiKey);

        }

        // Proceed to the next middleware or request handler
        return $handler->handle($request);
    }

}
