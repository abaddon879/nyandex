<?php

declare(strict_types=1);

namespace App\Controllers\Auth;

use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Message\ResponseInterface as Response;
use Slim\Views\PhpRenderer;
use Valitron\Validator;
use App\Repositories\UserRepository;
use Defuse\Crypto\Key;
use Defuse\Crypto\Crypto;

class Register
{
    // --- Constructor remains the same ---
    public function __construct(private PhpRenderer $view,
                                private Validator $validator,
                                private UserRepository $repository)
    {
        // ... (validation rules remain the same) ...
    }

    // --- UPDATED: new() method ---
    public function new(Request $request, Response $response): Response
    {
        // Render 'register.php' DIRECTLY.
        // PhpRenderer will wrap it in layout.php automatically.
        return $this->view->render($response, 'register.php', [
            'title' => 'Register' // Pass title for layout.php
        ]);
    }

    // --- UPDATED: create() method ---
    public function create(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody();
        $this->validator = $this->validator->withData($data);

        if ( ! $this->validator->validate()) {
            // --- Validation failed ---
            // Render 'register.php' DIRECTLY, passing errors and data.
            // PhpRenderer wraps it in layout.php automatically.
            return $this->view->render($response, 'register.php', [
                'title' => 'Register', // For layout.php
                'errors' => $this->validator->errors(), // For register.php
                'data' => $data // For register.php
            ]);
        }

        // --- User creation logic remains the same ---
        $data['password_hash'] = password_hash($data['password'], PASSWORD_DEFAULT);
        $api_key = bin2hex(random_bytes(16));
        $encryption_key = Key::loadFromAsciiSafeString($_ENV['ENCRYPTION_KEY']);
        $data['api_key'] = Crypto::encrypt($api_key, $encryption_key);
        $data['api_key_hash'] = hash_hmac('sha256', $api_key, $_ENV['HASH_SECRET_KEY']);
        $this->repository->create($data);

        // --- Redirect remains the same ---
        return $response
            ->withHeader('Location', '/register/success')
            ->withStatus(302);
    }

    // --- CORRECTED success() method ---
    public function success(Request $request, Response $response): Response
    {
        // Render 'register-success.php' DIRECTLY.
        // PhpRenderer wraps it in layout.php automatically.
        return $this->view->render($response, 'register-success.php', [
            'title' => 'Registration Successful' // For layout.php
        ]);
    }
}