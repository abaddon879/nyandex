<?php
declare(strict_types=1);

namespace App\Controllers\API;

use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Message\ResponseInterface as Response;
use App\Repositories\DashboardRepository; // Import the new repository
use Slim\Routing\RouteContext;
use Slim\Psr7\Factory\ResponseFactory;

class DashboardController
{
    public function __construct(
        private DashboardRepository $repository,
        private ResponseFactory $factory
    ) {
    }

    /**
     * Implements API Spec 2.1: Get Dashboard Data
     * GET /api/users/{user_id}/dashboard
     */
    public function show(Request $request, Response $response): Response
    {
        // 1. Get user_id from the URL
        $routeContext = RouteContext::fromRequest($request);
        $user_id = (int)$routeContext->getRoute()->getArgument('user_id');

        try {
            // 2. Call the repository method
            $dashboardData = $this->repository->getDashboardData($user_id);

            // 3. Send the result
            $response->getBody()->write(json_encode($dashboardData));
            return $response->withStatus(200);

        } catch (\Exception $e) {
            // 4. [DEBUG] Handle any unexpected SQL errors
            // We are now returning the specific exception message
            return $this->createError($response, 500, 'An internal error occurred: ' . $e->getMessage());
        }
    }

    /**
     * Helper function to create a standardized JSON error response.
     */
    private function createError(Response $response, int $statusCode, string $message): Response
    {
        $response->getBody()->write(json_encode(['error' => $message]));
        return $response->withStatus($statusCode)
                       ->withHeader('Content-Type', 'application/json');
    }
}