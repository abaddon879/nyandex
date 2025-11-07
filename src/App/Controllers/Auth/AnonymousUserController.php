<?php
declare(strict_types=1);

namespace App\Controllers\Auth;

use App\Repositories\UserRepository;
use App\Repositories\AuthTokenRepository;
use App\Utils\TokenGenerator;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use DateTime;
use PDO;

class AnonymousUserController
{
    use TokenGenerator;

    private UserRepository $userRepo;
    private AuthTokenRepository $tokenRepo;
    private PDO $db; // For transaction

    public function __construct(UserRepository $userRepo, AuthTokenRepository $tokenRepo, PDO $db)
    {
        $this->userRepo = $userRepo;
        $this->tokenRepo = $tokenRepo;
        $this->db = $db;
    }

    /**
     * 1.1 Create Anonymous User
     */
    public function create(Request $request, Response $response): Response
    {
        try {
            $this->db->beginTransaction();

            // 1. Create the anonymous user
            $userId = $this->userRepo->createAnonymous();
            if ($userId === null) {
                throw new \Exception("Failed to create user");
            }

            // 2. Generate a new token
            $tokens = $this->generateToken();
            
            // Set expiration based on spec for guest cleanup
            $expiresAt = (new DateTime('+180 days'))->format('Y-m-d H:i:s');

            // 3. Create the auth token
            $this->tokenRepo->create($userId, $tokens['hashed'], $expiresAt);

            $this->db->commit();
            
            // 4. Return the raw token and user ID
            $body = ['api_key' => $tokens['raw'], 'user_id' => $userId];
            $response->getBody()->write(json_encode($body));
            return $response->withStatus(201);

        } catch (\Exception $e) {
            $this->db->rollBack();
            $response->getBody()->write(json_encode(['error' => 'Could not create anonymous user']));
            return $response->withStatus(500);
        }
    }
}