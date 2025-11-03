<?php
declare(strict_types=1);

namespace App\Controllers\Auth;

use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Message\ResponseInterface as Response;
use App\Repositories\UserRepository;
use Slim\Psr7\Factory\ResponseFactory;

class SessionController
{
    // We need to add an 'update' method to our UserRepository
    public function __construct(private UserRepository $repository, 
                                private ResponseFactory $factory)
    {
    }

    /**
     * Implements API Endpoint 1.3: Login Registered User
     * POST /api/users/login
     */
    public function create(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody();

        // 1. Validate input
        if (empty($data['username_or_email']) || empty($data['password'])) {
            return $this->createError($response, 400, 'Username/email and password are required.');
        }

        // 2. Find the user by username or email
        $user = $this->repository->find('email', $data['username_or_email']);
        if (!$user) {
            $user = $this->repository->find('username', $data['username_or_email']);
        }

        // 3. Verify user and password
        if (!$user || !password_verify($data['password'], $user['password_hash'])) {
            return $this->createError($response, 401, 'Invalid credentials.');
        }

        // 4. On successful login, generate a NEW API key (our "Regenerateable" model)
        try {
            $api_key = bin2hex(random_bytes(32)); 
            $api_key_hash = hash_hmac('sha256', $api_key, $_ENV['HASH_SECRET_KEY']);

            // 5. Update the user's record with the new key and access time
            $this->repository->update($user['user_id'], [
                'api_key_hash' => $api_key_hash,
                'last_accessed_at' => gmdate('Y-m-d H:i:s')
            ]);

            // 6. Return the new key and user info (as per Spec 1.3)
            $responseData = [
                'api_key' => $api_key,
                'user_id' => $user['user_id']
            ];
            
            $response->getBody()->write(json_encode($responseData));
            return $response->withStatus(200);

        } catch (\Exception $e) {
            return $this->createError($response, 500, 'An internal error occurred.');
        }
    }

    /**
     * Implements API Endpoint 1.4: Logout Registered User
     * POST /api/users/logout
     */
    public function destroy(Request $request, Response $response): Response
    {
        // 1. Get the authenticated user (attached by RequireAPIKey middleware)
        $user = $request->getAttribute('user');
        if (!$user) {
            // This should technically never happen if RequireAPIKey is working
            return $this->createError($response, 401, 'Invalid API key.');
        }

        // 2. Invalidate the API key by setting it to NULL
        $this->repository->update($user['user_id'], [
            'api_key_hash' => null
        ]);

        // 3. Return success message (as per Spec 1.4)
        $response->getBody()->write(json_encode(['message' => 'Logout successful.']));
        return $response->withStatus(200);
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