<?php
declare(strict_types=1);

namespace App\Controllers\Auth;

use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Message\ResponseInterface as Response;
use App\Repositories\UserRepository;
use Slim\Psr7\Factory\ResponseFactory;

class AnonymousUserController
{
    public function __construct(private UserRepository $repository, 
                                private ResponseFactory $factory)
    {
    }

    /**
     * Implements API Endpoint 1.1: Create Anonymous User
     * POST /api/users/anonymous
     */
    public function create(Request $request, Response $response): Response
    {
        try {
            // 1. Generate a new, unique API key
            $api_key = bin2hex(random_bytes(32)); // 64-char key
            $api_key_hash = hash_hmac('sha256', $api_key, $_ENV['HASH_SECRET_KEY']);

            // 2. Prepare data for the new anonymous user
            $data = [
                'api_key_hash' => $api_key_hash,
                'anonymous' => true,
                'last_accessed_at' => gmdate('Y-m-d H:i:s')
            ];
            
            // 3. Create the user using the refactored repository
            $new_user_id = $this->repository->create($data);

            if ($new_user_id === false) {
                 return $this->createError($response, 500, 'Failed to create user account.');
            }

            // 4. Return the plain-text key and user_id (as per Spec 1.1)
            $responseData = [
                'api_key' => $api_key,
                'user_id' => $new_user_id
            ];
            
            $response->getBody()->write(json_encode($responseData));
            return $response->withStatus(201); // 201 Created

        } catch (\Exception $e) {
            // Handle potential errors (e.g., random_bytes failure)
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