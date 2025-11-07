<?php
declare(strict_types=1);

namespace App\Controllers\Auth;

use App\Repositories\UserRepository;
use App\Repositories\AuthTokenRepository;
use App\Utils\TokenGenerator;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use DateTime;

class SessionController
{
    use TokenGenerator;

    private UserRepository $userRepo;
    private AuthTokenRepository $tokenRepo;

    public function __construct(UserRepository $userRepo, AuthTokenRepository $tokenRepo)
    {
        $this->userRepo = $userRepo;
        $this->tokenRepo = $tokenRepo;
    }

    /**
     * 1.3 Login Registered User
     */
    public function create(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody();
        
        if (empty($data['username_or_email']) || empty($data['password'])) {
            $response->getBody()->write(json_encode(['error' => 'Missing credentials']));
            return $response->withStatus(400);
        }

        // 1. Find user by email or username
        $user = $this->userRepo->findByUsernameOrEmail($data['username_or_email']);

        // 2. Verify password
        if ($user === null || !password_verify($data['password'], $user['password_hash'])) {
            $response->getBody()->write(json_encode(['error' => 'Invalid credentials']));
            return $response->withStatus(401);
        }

        // 3. Generate a new token
        $tokens = $this->generateToken();
        $expiresAt = (new DateTime('+30 days'))->format('Y-m-d H:i:s'); // Standard 30-day login

        // 4. Store the new token
        // **FIXED**: Changed $this.tokenRepo to $this->tokenRepo
        $this->tokenRepo->create((int)$user['user_id'], $tokens['hashed'], $expiresAt);

        // 5. Return the raw token and user ID
        $body = ['api_key' => $tokens['raw'], 'user_id' => (int)$user['user_id']];
        $response->getBody()->write(json_encode($body));
        return $response->withStatus(200);
    }

    /**
     * 1.4 Logout Registered User
     */
    public function destroy(Request $request, Response $response): Response
    {
        // 1. Get the token hash from the middleware
        $hashedToken = $request->getAttribute('token_hash');

        if ($hashedToken) {
            // 2. Delete this specific token, logging out this one session
            // **FIXED**: Changed $this.tokenRepo to $this->tokenRepo
            $this->tokenRepo->deleteByHash($hashedToken);
        }

        // 3. Return success
        $response->getBody()->write(json_encode(['message' => 'Logout successful.']));
        return $response->withStatus(200);
    }
}