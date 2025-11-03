<?php

declare(strict_types=1);

namespace App\Middleware;

use App\Repositories\CatRepository;
use Psr\Http\Message\ServerRequestInterface AS Request;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;
use Slim\Routing\RouteContext;
use Slim\Exception\HttpNotFoundException;

class GetCat
{
    public function __construct(private CatRepository $repository)
    {        
    }

    public function __invoke(Request $request, RequestHandler $handler): Response
    {
        $context = RouteContext::fromRequest($request);

        $route = $context->getRoute();

        $cat_id = $route->getArgument('cat_id');

        $cat = $this->repository->getById((int) $cat_id);

        if ($cat === false) {

            throw new HttpNotFoundException($request, message: 'Cat not found');

        }

        $request = $request->withAttribute('cat', $cat);
        
        return $handler->handle($request);
    }
}