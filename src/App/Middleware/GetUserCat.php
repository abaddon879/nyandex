<?php
declare(strict_types=1);

namespace App\Middleware;

use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;
use Psr\Http\Message\ResponseInterface as Response;
use App\Repositories\UserCatRepository; // Import the new repository
use Slim\Routing\RouteContext;
use Slim\Exception\HttpNotFoundException;

class GetUserCat
{
    public function __construct(private UserCatRepository $repository)
    {
    }

    public function __invoke(Request $request, RequestHandler $handler): Response
    {
        $routeContext = RouteContext::fromRequest($request);
        $route = $routeContext->getRoute();
        
        $user_id = $route->getArgument('user_id');
        $cat_id = $route->getArgument('cat_id');

        // [FIX] Changed check from '!$cat_id' to '$cat_id === null'
        // This correctly handles cat_id = 0
        if ($user_id === null || $cat_id === null) {
            throw new HttpNotFoundException($request, 'Missing user or cat ID.');
        }

        // We can now safely find the record
        $userCat = $this->repository->findByUserAndCat((int)$user_id, (int)$cat_id);

        // Attach the found data (or `false`) to the request
        $request = $request->withAttribute('user_cat', $userCat);
        
        return $handler->handle($request);
    }
}