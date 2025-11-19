<?php
declare(strict_types=1);

namespace App\Middleware;

use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;
use Psr\Http\Message\ResponseInterface as Response;

class RequireAdmin
{
    public function __invoke(Request $request, RequestHandler $handler): Response
    {
        $authenticatedUser = $request->getAttribute('user');

        // --- FIXED: Use array syntax ---
        if ($authenticatedUser === null || !isset($authenticatedUser['admin']) || $authenticatedUser['admin'] != true) {
            // User is not an admin or not logged in
            throw new \Slim\Exception\HttpForbiddenException($request, 'Administrator access required.');
        }

        // User is an admin, proceed
        return $handler->handle($request);
    }
}