<?php
declare(strict_types=1);

namespace App\Middleware;

use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;
use Psr\Http\Message\ResponseInterface as Response;
use App\Repositories\UserItemRepository; // Import the new repository
use Slim\Routing\RouteContext;
use Slim\Exception\HttpNotFoundException;

class GetUserItem
{
    // 1. Inject the new UserItemRepository
    public function __construct(private UserItemRepository $repository)
    {
    }

    public function __invoke(Request $request, RequestHandler $handler): Response
    {
        // 2. Get the user_id and item_id from the URL
        $routeContext = RouteContext::fromRequest($request);
        $route = $routeContext->getRoute();
        
        $user_id = $route->getArgument('user_id');
        $item_id = $route->getArgument('item_id');

        if (!$user_id || !$item_id) {
            throw new HttpNotFoundException($request, 'Missing user or item ID.');
        }

        // 3. Call the correct repository method
        $userItem = $this->repository->findByUserAndItem((int)$user_id, (int)$item_id);

        // 4. Attach the found data (or `false`) to the request
        $request = $request->withAttribute('user_item', $userItem);
        
        return $handler->handle($request);
    }
}