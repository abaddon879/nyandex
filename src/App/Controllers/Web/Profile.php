<?php

declare(strict_types=1);

namespace App\Controllers\Web;

use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Message\ResponseInterface as Response;
use Slim\Views\PhpRenderer;
use Defuse\Crypto\Key;
use Defuse\Crypto\Crypto;

class Profile
{
    // --- Constructor remains the same ---
    public function __construct(private PhpRenderer $view)
    {
    }

    // --- UPDATED: show() method ---
    public function show(Request $request, Response $response): Response
    {
        // --- Data preparation remains the same ---
        $user = $request->getAttribute('user');
        $user_id = $user['user_id'];
        $encryption_key = Key::loadFromAsciiSafeString($_ENV['ENCRYPTION_KEY']);
        $api_key = Crypto::decrypt($user['api_key'], $encryption_key);

        // 1. Fetch the profile content WITH data
        $content = $this->view->fetch('profile.php', [
            'user' => $user,
            'user_id' => $user_id,
            'api_key' => $api_key
        ]);

        // Wrap it in a container
        $wrappedContent = '<div class="main-container">' . $content . '</div>';

        // 2. Render inside the master layout
        return $this->view->render($response, 'layout.php', [
            'title' => 'Profile',
            'content' => $wrappedContent
        ]);
    }
}