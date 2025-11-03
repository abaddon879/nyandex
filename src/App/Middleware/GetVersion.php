<?php

declare(strict_types=1);

namespace App\Middleware;

use App\Repositories\VersionRepository;
use Psr\Http\Message\ServerRequestInterface AS Request;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;
use Slim\Routing\RouteContext;
use Slim\Exception\HttpNotFoundException;

class GetVersion
{
    public function __construct(private VersionRepository $repository)
    {        
    }

    public function __invoke(Request $request, RequestHandler $handler): Response
    {
        $context = RouteContext::fromRequest($request);

        $route = $context->getRoute();

        $id = $route->getArgument('version_id');

        $version = $this->repository->getById((string)$id);

        if ($version === null) {

            throw new HttpNotFoundException($request, message: 'Version not found');

        }

        $request = $request->withAttribute('version', $version);
        
        return $handler->handle($request);
    }
}