<?php
declare(strict_types=1);

namespace App\Middleware;

use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;
use Psr\Http\Message\ResponseInterface as Response;
use App\Repositories\ItemRepository; // Import the repository
use Slim\Routing\RouteContext;
use Slim\Psr7\Factory\ResponseFactory; // Import the factory

class GetItem
{
    // 1. Inject ItemRepository AND ResponseFactory
    public function __construct(private ItemRepository $repository,
                                private ResponseFactory $factory)
    {
    }

    public function __invoke(Request $request, RequestHandler $handler): Response
    {
        // 2. Get the item_id from the URL
        $routeContext = RouteContext::fromRequest($request);
        $route = $routeContext->getRoute();
        
        $item_id = $route->getArgument('item_id');

        if (!$item_id) {
            return $this->createError(404, 'Missing item ID.');
        }

        // 3. Call the correct repository method
        $item = $this->repository->getById((int)$item_id);

        if ($item === false) {
            // 4. [FIX] Instead of throwing, return our JSON error
            return $this->createError(404, 'Item not found');
        }

        // 5. Attach the found item to the request
        $request = $request->withAttribute('item', $item);
        
        return $handler->handle($request);
    }

    /**
     * [NEW] Helper function to create a standardized JSON error response.
     */
    private function createError(int $statusCode, string $message): Response
    {
        $response = $this->factory->createResponse();
        $response->getBody()
                 ->write(json_encode(['error' => $message]));

        return $response->withStatus($statusCode)
                       ->withHeader('Content-Type', 'application/json');
    }
}