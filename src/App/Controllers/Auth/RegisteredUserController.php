<?php
declare(strict_types=1);

namespace App\Controllers\Auth;

use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Message\ResponseInterface as Response;
use App\Repositories\UserRepository;
use Slim\Psr7\Factory\ResponseFactory;
use Valitron\Validator; // Assuming you are using Valitron

class RegisteredUserController
{
    public function __construct(
        private UserRepository $repository,
        private ResponseFactory $factory,
        private Validator $validator
    ) {
    }

    /**
     * Implements API Endpoint 1.2: Convert Guest to Registered User
     * POST /api/users/convert
     */
    public function create(Request $request, Response $response): Response
    {
        // 1. Get the currently authenticated GUEST user
        $user = $request->getAttribute('user');
        if (!$user || !$user['anonymous']) {
            return $this->createError($response, 403, 'Only guest accounts can be converted.');
        }

        // 2. Validate the incoming data
        $data = $request->getParsedBody();
        $this->validator = $this->validator->withData($data);
        $this->validator->rule('required', ['username', 'email', 'password']);
        $this->validator->rule('email', 'email');
        $this->validator->rule('lengthMin', 'password', 8);
        $this->validator->rule('lengthMin', 'username', 3);
        // (Add your 'unique' rules for email/username, which will need to query the repository)

        if (!$this->validator->validate()) {
            return $this->createError($response, 400, 'Validation failed.', $this->validator->errors());
        }

        // 3. Hash the new password
        $password_hash = password_hash($data['password'], PASSWORD_DEFAULT);

        // 4. Update the existing guest user's record
        $success = $this->repository->update($user['user_id'], [
            'username' => $data['username'],
            'email' => $data['email'],
            'password_hash' => $password_hash,
            'anonymous' => false, // This is the "conversion"
            'modified_at' => gmdate('Y-m-d H:i:s')
        ]);

        if (!$success) {
            return $this->createError($response, 500, 'Failed to update account.');
        }

        // 5. Return success message (as per Spec 1.2)
        $response->getBody()->write(json_encode(['message' => 'Account converted successfully.']));
        return $response->withStatus(200);
    }

    /**
     * Implements API Endpoint 1.8: Get Current User Info
     * GET /api/users/me
     */
    public function show(Request $request, Response $response): Response
    {
        // 1. Get the authenticated user (attached by RequireAPIKey)
        $user = $request->getAttribute('user');
        
        // 2. Return a "safe" subset of the user data (as per Spec 1.8)
        $responseData = [
            'user_id' => $user['user_id'],
            'username' => $user['username'],
            'email' => $user['email'],
            'anonymous' => (bool)$user['anonymous'],
            'verified' => (bool)$user['verified'],
        ];

        $response->getBody()->write(json_encode($responseData));
        return $response->withStatus(200);
    }

    /**
     * Implements API Endpoint 1.9: Delete Account
     * DELETE /api/users/me
     */
    public function delete(Request $request, Response $response): Response
    {
        // 1. Get the authenticated user
        $user = $request->getAttribute('user');
        
        // 2. If it's a registered user, they must provide their password
        if (!$user['anonymous']) {
            $data = $request->getParsedBody();
            if (empty($data['password']) || !password_verify($data['password'], $user['password_hash'])) {
                return $this->createError($response, 403, 'Invalid password. Account deletion denied.');
            }
        }

        // 3. Delete the user
        // (We need to add this 'delete' method to UserRepository)
        $this->repository->delete($user['user_id']);

        // 4. Return success message (as per Spec 1.9)
        $response->getBody()->write(json_encode(['message' => 'Account deleted successfully.']));
        return $response->withStatus(200);
    }

    /**
     * Helper function to create a standardized JSON error response.
     */
    private function createError(Response $response, int $statusCode, string $message, ?array $errors = null): Response
    {
        $payload = ['error' => $message];
        if ($errors) {
            $payload['details'] = $errors;
        }
        $response->getBody()->write(json_encode($payload));
        return $response->withStatus($statusCode)
                       ->withHeader('Content-Type', 'application/json');
    }
}