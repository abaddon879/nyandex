<?php

declare(strict_types=1);

namespace App\Controllers\Auth;

use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Message\ResponseInterface as Response;
use Slim\Views\PhpRenderer;
use App\Repositories\UserRepository;

class Login
{
    // --- Constructor remains the same ---
    public function __construct(private PhpRenderer $view,
                                private UserRepository $repository)
    {
    }

    // --- UPDATED: new() method ---
    public function new(Request $request, Response $response): Response
    {
        // Render inside the master layout
        return $this->view->render($response, 'login.php', [
            'title' => 'Login'
        ]);
    }

    // --- UPDATED: create() method ---
    public function create(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody();
        $user = $this->repository->find('email', $data['email']);

        if ($user && password_verify($data['password'], $user['password_hash'])) {
            // --- Login success logic remains the same ---
            $_SESSION['user_id'] = $user['user_id'];
            return $response
                ->withHeader('Location', '/')
                ->withStatus(302);
        }

        // --- Login failed ---
        // Fetch the login form content WITH errors/data
        $content = $this->view->fetch('login.php', [
            'data' => $data,
            'error' => 'Invalid login'
        ]);
        
        // Wrap it
        $wrappedContent = '<div class="auth-form">' . $content . '</div>';

        // Re-render inside the master layout
        return $this->view->render($response, 'layout.php', [
            'title' => 'Login',
            'content' => $wrappedContent
        ]);
    }

    // --- destroy() method remains the same ---
    public function destroy(Request $request, Response $response): Response
    {
        session_destroy();
        return $response
            ->withHeader('Location', '/')
            ->withStatus(302);
    }
}