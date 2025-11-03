<?php
declare(strict_types=1);

namespace App\Controllers\API;

use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Message\ResponseInterface as Response;
use App\Repositories\UserCatRepository;
use Slim\Routing\RouteContext;
use Slim\Psr7\Factory\ResponseFactory;

class UserCatBulkController
{
    public function __construct(
        private UserCatRepository $repository,
        private ResponseFactory $factory
    ) {
    }

    /**
     * Implements API Spec 3.5: Bulk Update User Cats
     * POST /api/users/{user_id}/cats/bulk-update
     */
    public function create(Request $request, Response $response): Response
    {
        $routeContext = RouteContext::fromRequest($request);
        $user_id = (int)$routeContext->getRoute()->getArgument('user_id');

        $data = $request->getParsedBody();
        if (empty($data['actions']) || !is_array($data['actions'])) {
            return $this->createError($response, 400, "Invalid request body. 'actions' array is required.");
        }

        $actions = $data['actions'];

        try {
            // [NEW] Get the affected rows count (or false on failure)
            $affectedRows = $this->repository->bulkUpdate($user_id, $actions);

            // [NEW] Check for false (failure)
            if ($affectedRows === false) {
                return $this->createError($response, 500, 'An error occurred during the bulk update. The transaction was rolled back.');
            }

            // [NEW] Update response to use the new count
            $responseData = [
                'message' => 'Bulk update successful.',
                'updated_rows' => $affectedRows // Renamed from 'updated_count'
            ];

            $response->getBody()->write(json_encode($responseData));
            return $response->withStatus(200);

        } catch (\Exception $e) {
            return $this->createError($response, 500, 'An internal server error occurred.');
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