<?php

declare(strict_types=1);

namespace App\Middleware;

use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;
use Psr\Http\Message\ResponseInterface as Response;
use Slim\Psr7\Factory\ResponseFactory;
use App\Repositories\UserRepository;

class RequireLogin
{
    public function __construct(private ResponseFactory $factory,
                                private UserRepository $repository)
    {
    }

    public function __invoke(Request $request, RequestHandler $handler): Response
    {
        if (isset($_SESSION['user_id'])) {

            $user = $this->repository->find('user_id', $_SESSION['user_id']);

            if ($user) {

                $request = $request->withAttribute('user', $user);

                return $handler->handle($request);

            }

        }

        // User is not logged in, redirect to the login page
        return $this->factory->createResponse()
            ->withHeader('Location', '/login')
            ->withStatus(302); // 302 is the status code for a temporary redirect
    }
}