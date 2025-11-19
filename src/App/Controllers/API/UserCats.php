<?php
declare(strict_types=1);

namespace App\Controllers\API;

use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Message\ResponseInterface as Response;
use App\Repositories\UserCatRepository;
use Slim\Routing\RouteContext;

class UserCats
{
    public function __construct(private UserCatRepository $repository)
    {
    }

    public function index(Request $request, Response $response): Response
    {
        $routeContext = RouteContext::fromRequest($request);
        $user_id = $routeContext->getRoute()->getArgument('user_id');

        $userCats = $this->repository->findByUser((int)$user_id);
        
        $response->getBody()->write(json_encode($userCats));
        return $response->withStatus(200);
    }

    /**
     * GET /api/users/{user_id}/cats/{cat_id}
     */
    public function show(Request $request, Response $response): Response
    {
        $routeContext = RouteContext::fromRequest($request);
        $route = $routeContext->getRoute();
        $user_id = $route->getArgument('user_id');
        $cat_id = $route->getArgument('cat_id');

        // The repository now always returns an array with is_owned and is_pinned
        $result = $this->repository->findByUserAndCat((int)$user_id, (int)$cat_id);

        $response->getBody()->write(json_encode($result));
        return $response->withStatus(200);
    }

    public function update(Request $request, Response $response): Response
    {
        $routeContext = RouteContext::fromRequest($request);
        $route = $routeContext->getRoute();
        $user_id = $route->getArgument('user_id');
        $cat_id = $route->getArgument('cat_id');

        $data = $request->getParsedBody();
        
        if (!isset($data['level'], $data['plus_level'], $data['form_id'])) {
             $response->getBody()->write(json_encode(['error' => 'Missing required fields.']));
             return $response->withStatus(400);
        }

        $payload = [
            'user_id' => (int)$user_id,
            'cat_id' => (int)$cat_id,
            'level' => (int)$data['level'],
            'plus_level' => (int)$data['plus_level'],
            'form_id' => (int)$data['form_id'],
            'notes' => $data['notes'] ?? null
        ];

        $success = $this->repository->upsert($payload);

        if (!$success) {
            $response->getBody()->write(json_encode(['error' => 'Failed to save cat data.']));
            return $response->withStatus(500);
        }

        $response->getBody()->write(json_encode($payload));
        return $response->withStatus(200);
    }

    public function delete(Request $request, Response $response): Response
    {
        $routeContext = RouteContext::fromRequest($request);
        $route = $routeContext->getRoute();
        $user_id = $route->getArgument('user_id');
        $cat_id = $route->getArgument('cat_id');

        $this->repository->delete((int)$user_id, (int)$cat_id);
        
        return $response->withStatus(204);
    }
}