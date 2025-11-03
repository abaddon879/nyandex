<?php
declare(strict_types=1);

namespace App\Controllers\API;

use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Message\ResponseInterface as Response;
use App\Repositories\UserItemRepository; // Import the new repository
use Slim\Routing\RouteContext; // Needed to get route arguments

class UserItems
{
    // 1. Inject the UserItemRepository
    public function __construct(private UserItemRepository $repository)
    {
    }

    /**
     * Implements API Spec 3.4 & 4.1: Fetch User's Full Inventory
     * GET /api/users/{user_id}/inventory
     */
    public function index(Request $request, Response $response): Response
    {
        // 1. Get user_id from the URL
        $routeContext = RouteContext::fromRequest($request);
        $user_id = $routeContext->getRoute()->getArgument('user_id');

        // 2. Call the repository method
        // This method (findByUser) is designed to return the full, joined list
        $userItems = $this->repository->findByUser((int)$user_id);
        
        // 3. Send the result
        $response->getBody()->write(json_encode($userItems));
        return $response->withStatus(200);
    }

    /**
     * Fetches a single item's quantity for a user
     * GET /api/users/{user_id}/items/{item_id}
     */
    public function show(Request $request, Response $response): Response
    {
        // 1. Get user_id and item_id from the URL
        $routeContext = RouteContext::fromRequest($request);
        $route = $routeContext->getRoute();
        $user_id = $route->getArgument('user_id');
        $item_id = $route->getArgument('item_id');

        // 2. Call the repository method
        $userItem = $this->repository->findByUserAndItem((int)$user_id, (int)$item_id);

        if ($userItem === false) {
            // Return 404, as the user doesn't have this item (or it's 0)
            $response->getBody()->write(json_encode(['error' => 'User item data not found.']));
            return $response->withStatus(404);
        }
        
        // 3. Send the result
        $response->getBody()->write(json_encode($userItem));
        return $response->withStatus(200);
    }

    /**
     * Implements API Spec 4.2: Update Item Quantity (Auto-Save)
     * PUT /api/users/{user_id}/items/{item_id}
     */
    public function update(Request $request, Response $response): Response
    {
        // 1. Get user_id and item_id from the URL
        $routeContext = RouteContext::fromRequest($request);
        $route = $routeContext->getRoute();
        $user_id = $route->getArgument('user_id');
        $item_id = $route->getArgument('item_id');

        // 2. Get the data from the request body
        $data = $request->getParsedBody();
        
        // 3. Validate the required 'item_quantity' field
        if (!isset($data['item_quantity']) || !is_numeric($data['item_quantity'])) {
             $response->getBody()->write(json_encode(['error' => 'Missing or invalid item_quantity.']));
             return $response->withStatus(400);
        }

        // 4. Build the data payload for the repository
        $payload = [
            'user_id' => (int)$user_id,
            'item_id' => (int)$item_id,
            'item_quantity' => (int)$data['item_quantity'],
        ];

        // 5. Call the 'upsert' method
        $success = $this->repository->upsert($payload);

        if (!$success) {
            $response->getBody()->write(json_encode(['error' => 'Failed to save item data.']));
            return $response->withStatus(500);
        }

        // 6. Return the saved data as confirmation (as per Spec 4.2)
        // We'll return the payload, but a full API would re-fetch the joined data
        $response->getBody()->write(json_encode($payload)); 
        return $response->withStatus(200);
    }

    /**
     * Deletes an item from a user's inventory
     * DELETE /api/users/{user_id}/items/{item_id}
     */
    public function delete(Request $request, Response $response): Response
    {
        // 1. Get user_id and item_id from the URL
        $routeContext = RouteContext::fromRequest($request);
        $route = $routeContext->getRoute();
        $user_id = $route->getArgument('user_id');
        $item_id = $route->getArgument('item_id');

        // 2. Call the repository method
        $this->repository->delete((int)$user_id, (int)$item_id);
        
        // 3. Send a 204 No Content response
        return $response->withStatus(204);
    }
}