<?php
declare(strict_types=1);

namespace App\Middleware;

use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;
use Psr\Http\Message\ResponseInterface as Response;
use Slim\Routing\RouteContext;

class AuthorizeUserAccess
{
    public function __invoke(Request $request, RequestHandler $handler): Response
    {
        // 1. Get the user authenticated by the API key
        $authenticatedUser = $request->getAttribute('user');
        if ($authenticatedUser === null) {
            throw new \Slim\Exception\HttpUnauthorizedException($request, 'No authenticated user found');
        }

        // 2. If the authenticated user is an admin...
        // --- FIXED: Use array syntax ---
        if (isset($authenticatedUser['is_admin']) && $authenticatedUser['is_admin'] == true) {
            return $handler->handle($request);
        }

        // 3. Get the user_id from the URL
        $routeContext = RouteContext::fromRequest($request);
        $route = $routeContext->getRoute();
        $user_id_from_url = $route->getArgument('user_id');

        // 4. This check now only runs for non-admins
        // --- FIXED: Use array syntax ---
        if ($authenticatedUser['user_id'] != $user_id_from_url) {
            throw new \Slim\Exception\HttpForbiddenException($request, 'You are not authorized to access this user\'s data.');
        }

        // 5. User is authorized, continue
        return $handler->handle($request);
    }
}