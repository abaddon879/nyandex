<?php
declare(strict_types=1);

namespace App\Controllers\API;

use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Message\ResponseInterface as Response;
use App\Repositories\UserCatRepository; // Import the new repository
use Slim\Routing\RouteContext; // Needed to get route arguments

class UserCats
{
    // 1. Inject the UserCatRepository
    public function __construct(private UserCatRepository $repository)
    {
    }

    /**
     * Implements API Spec 3.2: Fetch User's Cat Collection Data
     * GET /api/users/{user_id}/cats
     */
    public function index(Request $request, Response $response): Response
    {
        // 1. Get user_id from the URL (provided by AuthorizeUserAccess)
        $routeContext = RouteContext::fromRequest($request);
        $user_id = $routeContext->getRoute()->getArgument('user_id');

        // 2. Call the repository method
        $userCats = $this->repository->findByUser((int)$user_id);
        
        // 3. Send the result
        $response->getBody()->write(json_encode($userCats));
        return $response->withStatus(200);
    }

    /**
     * Implements API Spec 5.2: Fetch User Data for a Single Cat
     * GET /api/users/{user_id}/cats/{cat_id}
     */
    public function show(Request $request, Response $response): Response
    {
        // 1. Get user_id and cat_id from the URL
        $routeContext = RouteContext::fromRequest($request);
        $route = $routeContext->getRoute();
        $user_id = $route->getArgument('user_id');
        $cat_id = $route->getArgument('cat_id');

        // 2. Call the repository method
        $userCat = $this->repository->findByUserAndCat((int)$user_id, (int)$cat_id);

        if ($userCat === false) {
            // This isn't an error, it just means the user doesn't own this cat.
            // Return a 404 as per Spec 5.2 ("Returns 404 or default state")
            $response->getBody()->write(json_encode(['error' => 'User cat data not found.']));
            return $response->withStatus(404);
        }
        
        // 3. Send the result
        $response->getBody()->write(json_encode($userCat));
        return $response->withStatus(200);
    }

    /**
     * Implements API Spec 5.3: Save User Data for a Single Cat (Upsert)
     * PUT /api/users/{user_id}/cats/{cat_id}
     */
    public function update(Request $request, Response $response): Response
    {
        // 1. Get user_id and cat_id from the URL
        $routeContext = RouteContext::fromRequest($request);
        $route = $routeContext->getRoute();
        $user_id = $route->getArgument('user_id');
        $cat_id = $route->getArgument('cat_id');

        // 2. Get the data from the request body
        $data = $request->getParsedBody();
        
        // 3. (Validation: You should add validation here to check that
        // 'level', 'plus_level', 'form_id', etc. are valid numbers)
        if (!isset($data['level'], $data['plus_level'], $data['form_id'])) {
             $response->getBody()->write(json_encode(['error' => 'Missing required fields.']));
             return $response->withStatus(400);
        }

        // 4. Build the data payload for the repository
        $payload = [
            'user_id' => (int)$user_id,
            'cat_id' => (int)$cat_id,
            'level' => (int)$data['level'],
            'plus_level' => (int)$data['plus_level'],
            'form_id' => (int)$data['form_id'],
            'notes' => $data['notes'] ?? null // Handle optional notes field
        ];

        // 5. Call the 'upsert' method
        $success = $this->repository->upsert($payload);

        if (!$success) {
            $response->getBody()->write(json_encode(['error' => 'Failed to save cat data.']));
            return $response->withStatus(500);
        }

        // 6. Return the saved data as confirmation
        $response->getBody()->write(json_encode($payload));
        return $response->withStatus(200);
    }

    /**
     * Deletes a cat from a user's collection
     * DELETE /api/users/{user_id}/cats/{cat_id}
     */
    public function delete(Request $request, Response $response): Response
    {
        // 1. Get user_id and cat_id from the URL
        $routeContext = RouteContext::fromRequest($request);
        $route = $routeContext->getRoute();
        $user_id = $route->getArgument('user_id');
        $cat_id = $route->getArgument('cat_id');

        // 2. Call the repository method
        $this->repository->delete((int)$user_id, (int)$cat_id);
        
        // 3. Send a 204 No Content response (standard for successful DELETE)
        return $response->withStatus(204);
    }
}