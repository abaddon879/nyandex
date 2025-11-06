<?php
declare(strict_types=1);

namespace App\Middleware;

use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;
use Psr\Http\Message\ResponseInterface as Response;
use Slim\Psr7\Factory\ResponseFactory;
use App\Repositories\UserRepository;

class RequireAPIKey
{
    public function __construct(private ResponseFactory $factory,
                                private UserRepository $repository)
    {
    }

    public function __invoke(Request $request, RequestHandler $handler): Response
    {
        // 1. Check for 'Authorization' header (as per API Spec 2)
        if ( ! $request->hasHeader('Authorization')) {
            return $this->createError(401, 'API key missing from request.');
        }

        $authHeader = $request->getHeaderLine('Authorization');
        
        // 2. Parse the 'Bearer <token>' format
        if (sscanf($authHeader, 'Bearer %s', $api_key) !== 1) {
            return $this->createError(401, 'Invalid Authorization header format. Expected: Bearer <api_key>');
        }

        // 3. Check if this is the static ADMIN_API_KEY from .env
        $adminKeyFromEnv = $_ENV['ADMIN_API_KEY'] ?? null;

        if ($adminKeyFromEnv && $api_key === $adminKeyFromEnv) {
            
            // It's the admin script. Create a "mock" admin user.
            $adminUser = [
                'user_id' => 0, // 0 for system/script
                'username' => 'admin_script',
                'is_admin' => true,
                'is_anonymous' => false
            ];
            
            // Attach the admin user and pass the request to the next handler
            $request = $request->withAttribute('user', $adminUser);
            return $handler->handle($request);
        }
        
        // 4. If NOT the admin key, proceed with normal user validation
        // (This is your original code, unchanged)
        $api_key_hash = hash_hmac('sha256', $api_key, $_ENV['HASH_SECRET_KEY']);
        $user = $this->repository->find('api_key_hash', $api_key_hash);

        // 5. Validate user
        if ($user === false) {
            return $this->createError(401, 'Invalid API key.');
        }
        
        // 6. Update the last_accessed_at timestamp for this user
        $this->repository->updateLastAccessed($user['user_id']);

        // 7. Attach the authenticated user (as an array) to the request
        $request = $request->withAttribute('user', $user);
        
        return $handler->handle($request);
    }

    /**
     * Helper function to create a standardized JSON error response.
     */
    private function createError(int $statusCode, string $message): Response
    {
        $response = $this->factory->createResponse();
        $response->getBody()
                 ->write(json_encode(['error' => $message]));

        return $response->withStatus($statusCode)
                       ->withHeader('Content-Type', 'application/json');
    }
}