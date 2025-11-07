<?php
declare(strict_types=1);

namespace App\Middleware;

use App\Repositories\AuthTokenRepository;
use Psr\Http\Message\ResponseFactoryInterface;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;
use Psr\Http\Message\ResponseInterface as Response;

class RequireAPIKey implements MiddlewareInterface
{
    private AuthTokenRepository $authTokenRepo;
    private ResponseFactoryInterface $responseFactory;

    public function __construct(AuthTokenRepository $authTokenRepo, ResponseFactoryInterface $responseFactory)
    {
        $this->authTokenRepo = $authTokenRepo;
        $this->responseFactory = $responseFactory;
    }

    public function process(Request $request, RequestHandler $handler): Response
    {
        $authHeader = $request->getHeaderLine('Authorization');
        
        if (empty($authHeader) || !preg_match('/^Bearer\s+(.{64})$/', $authHeader, $matches)) {
            return $this->unauthorizedResponse();
        }
        
        $rawToken = $matches[1];
        $hashedToken = hash('sha256', $rawToken);

        // Find the user and token data from the hash
        $sessionData = $this->authTokenRepo->findUserByTokenHash($hashedToken);
        
        if ($sessionData === null) {
            return $this->unauthorizedResponse();
        }

        // Token is valid. Update its last_used_at timestamp.
        $this->authTokenRepo->updateLastUsed((int)$sessionData['token_id']);
        
        // Add the user data and the token hash to the request for controllers to use
        $request = $request->withAttribute('user', $sessionData);
        $request = $request->withAttribute('token_hash', $hashedToken); // For logout

        return $handler->handle($request);
    }

    private function unauthorizedResponse(): Response
    {
        $response = $this->responseFactory->createResponse(401);
        $response->getBody()->write(json_encode(['error' => 'Unauthorized']));
        return $response->withHeader('Content-Type', 'application/json');
    }
}