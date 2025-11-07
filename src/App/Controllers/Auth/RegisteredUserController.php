<?php
declare(strict_types=1);

namespace App\Controllers\Auth;

use App\Repositories\UserRepository;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class RegisteredUserController
{
    private UserRepository $userRepo;

    public function __construct(UserRepository $userRepo)
    {
        $this->userRepo = $userRepo;
    }

    /**
     * 1.2 Convert Guest to Registered User
     */
    public function create(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody();
        
        // 1. Get the current user from the middleware
        $user = $request->getAttribute('user');
        
        // 2. Validate that this is an anonymous user
        if ($user === null || !(bool)$user['anonymous']) {
            $response->getBody()->write(json_encode(['error' => 'Only guest accounts can be converted.']));
            return $response->withStatus(409); // 409 Conflict
        }

        // 3. Basic validation
        if (empty($data['username']) || empty($data['email']) || empty($data['password'])) {
            $response->getBody()->write(json_encode(['error' => 'Missing username, email, or password']));
            return $response->withStatus(400);
        }

        // 4. Update the existing user record
        try {
            $this->userRepo->update((int)$user['user_id'], [
                'username' => $data['username'],
                'email' => $data['email'],
                'password_hash' => password_hash($data['password'], PASSWORD_BCRYPT),
                'anonymous' => 0,
                'verified' => 0, // Set verified to false, start verification flow
                'modified_at' => date('Y-m-d H:i:s')
            ]);
            
            // The existing auth_token is still valid! No new token is needed.
            $response->getBody()->write(json_encode(['message' => 'Account converted successfully.']));
            return $response->withStatus(200);

        } catch (\Exception $e) {
            // Handle unique constraint violations (e.g., username/email taken)
            $response->getBody()->write(json_encode(['error' => 'Username or email may already be taken.']));
            return $response->withStatus(409); // 409 Conflict
        }
    }

    /**
     * 1.8 Get Current User Info ( /me )
     */
    public function show(Request $request, Response $response): Response
    {
        // The RequireAPIKey middleware already did all the work
        $user = $request->getAttribute('user');

        $body = [
            'user_id' => (int)$user['user_id'],
            'username' => $user['username'],
            'email' => $user['email'],
            'anonymous' => (bool)$user['anonymous'],
            'verified' => (bool)$user['verified']
        ];
        
        $response->getBody()->write(json_encode($body));
        return $response->withStatus(200);
    }

    /**
     * 1.9 Delete Account
     */
    public function delete(Request $request, Response $response): Response
    {
        $user = $request->getAttribute('user');
        $userId = (int)$user['user_id'];
        
        // Password check for registered users
        if (!(bool)$user['anonymous']) {
            $data = $request->getParsedBody();
            // We use the password_hash from the user data retrieved by the middleware
            if (empty($data['password']) || !password_verify($data['password'], $user['password_hash'])) {
                $response->getBody()->write(json_encode(['error' => 'Invalid password']));
                return $response->withStatus(403); // 403 Forbidden
            }
        }
        
        // Deleting the user will cascade and delete all their auth_tokens
        // This is based on the ON DELETE CASCADE in your db_setup_v1.sql
        $this->userRepo->delete($userId);
        
        $response->getBody()->write(json_encode(['message' => 'Account deleted successfully.']));
        return $response->withStatus(200);
    }
}