<?php
declare(strict_types=1);

namespace App\Controllers\API;

use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Message\ResponseInterface as Response;
use App\Repositories\UserPinnedCatRepository; // Import the new repository
use Slim\Routing\RouteContext;
use Slim\Psr7\Factory\ResponseFactory;

class PinnedCatController
{
    public function __construct(
        private UserPinnedCatRepository $repository,
        private ResponseFactory $factory
    ) {
    }

    /**
     * Implements API Spec 5.4: Pin a Cat
     * POST /api/users/{user_id}/pinned-cats/{cat_id}
     */
    public function create(Request $request, Response $response): Response
    {
        // 1. Get user_id and cat_id from the URL
        $routeContext = RouteContext::fromRequest($request);
        $route = $routeContext->getRoute();
        $user_id = (int)$route->getArgument('user_id');
        $cat_id = (int)$route->getArgument('cat_id');

        // 2. Call the repository method
        $success = $this->repository->create($user_id, $cat_id);

        if (!$success) {
            $response->getBody()->write(json_encode(['error' => 'Failed to pin cat.']));
            return $response->withStatus(500);
        }

        // 3. Return success message (as per Spec 5.4)
        $responseData = [
            'message' => 'Cat pinned successfully.',
            'cat_id' => $cat_id,
            'is_pinned' => true
        ];
        
        $response->getBody()->write(json_encode($responseData));
        // 201 Created is appropriate for creating a new resource link
        return $response->withStatus(201); 
    }

    /**
     * Implements API Spec 5.5: Unpin a Cat
     * DELETE /api/users/{user_id}/pinned-cats/{cat_id}
     */
    public function delete(Request $request, Response $response): Response
    {
        // 1. Get user_id and cat_id from the URL
        $routeContext = RouteContext::fromRequest($request);
        $route = $routeContext->getRoute();
        $user_id = (int)$route->getArgument('user_id');
        $cat_id = (int)$route->getArgument('cat_id');

        // 2. Call the repository method
        $this->repository->delete($user_id, $cat_id);
        
        // 3. Return success message (as per Spec 5.5)
        $responseData = [
            'message' => 'Cat unpinned successfully.',
            'cat_id' => $cat_id,
            'is_pinned' => false
        ];

        $response->getBody()->write(json_encode($responseData));
        return $response->withStatus(200);
    }
}