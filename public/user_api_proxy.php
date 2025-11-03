<?php
session_start();
// --- AUTOLOADER ---
require_once __DIR__ . '/../vendor/autoload.php';

// --- NEW: LOAD .ENV FILE ---
// This finds the .env file in your project's root folder
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/../');
$dotenv->load();
// --- END .ENV LOAD ---

// --- USE STATEMENTS ---
use Defuse\Crypto\Key;
use Defuse\Crypto\Crypto;
use Defuse\Crypto\Exception\WrongKeyOrModifiedDataException;

// --- CONFIGURATION ---
$API_BASE_URL = 'http://pat.localhost/api';
$ADMIN_API_KEY = $_ENV['API_KEY'] ?? 'your_admin_key_fallback';
$ENCRYPTION_KEY = $_ENV['ENCRYPTION_KEY'] ?? 'your_encryption_key_fallback';
// --- END CONFIGURATION ---

// Set header to JSON immediately. If we crash, this is our best chance.
header('Content-Type: application/json');

try {
    // 1. Get the logged-in user from the SESSION
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['error' => 'User not authenticated.']);
        exit;
    }
    $session_user_id = (int) $_SESSION['user_id'];

    // 2. Get the path from the URL
    $pathInfo = $_SERVER['PATH_INFO'] ?? '';
    if (empty($pathInfo)) {
        http_response_code(400);
        echo json_encode(['error' => 'No API endpoint specified.']);
        exit;
    }

    // 3. Extract the target user_id from the path
    $target_user_id = 0;
    if (preg_match('/^\/users\/(\d+)/', $pathInfo, $matches)) {
        $target_user_id = (int) $matches[1];
    } else {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid request path.']);
        exit;
    }

    // 4. AUTHORIZATION LOGIC
    $apiKeyToUse = '';

    // We need a database connection to check admin status and get keys
    $db = new \App\Database($_ENV['DB_HOST'], $_ENV['DB_NAME'], $_ENV['DB_USER'], $_ENV['DB_PASS']);
    $userRepo = new \App\Repositories\UserRepository($db);
    $loggedInUser = $userRepo->find('user_id', $session_user_id);

    if ($loggedInUser === false) {
        http_response_code(401);
        echo json_encode(['error' => 'Authenticated user session is invalid.']);
        exit;
    }

    if ($loggedInUser && $loggedInUser['is_admin'] == true) {
        $apiKeyToUse = $ADMIN_API_KEY;

    } elseif ($session_user_id === $target_user_id) {
        $encrypted_key = $loggedInUser['api_key'];
        $encryptionKey = Key::loadFromAsciiSafeString($ENCRYPTION_KEY);
        $apiKeyToUse = Crypto::decrypt($encrypted_key, $encryptionKey);
        
    } else {
        http_response_code(403);
        echo json_encode(['error' => 'You are not authorized to access this data.']);
        exit;
    }

    // 5. If we get here, the user is authorized. We can now make the API call.
    $targetUrl = $API_BASE_URL . $pathInfo;
    $method = $_SERVER['REQUEST_METHOD'];
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $targetUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);

    // 6. Set headers
    $headers = [
        'X-API-Key: ' . $apiKeyToUse,
        'Content-Type: application/json',
        'Accept: application/json',
    ];
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

    // 7. Pass along POST/PATCH data
    if ($method == 'POST' || $method == 'PATCH') {
        $data = file_get_contents('php://input');
        curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
    }

    // 8. Execute and proxy the response
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);

    if (curl_errno($ch)) {
        http_response_code(500);
        echo json_encode(['error' => 'API proxy cURL error: ' . curl_error($ch)]);
    } else {
        http_response_code($httpCode);
        // We must manually set the Content-Type header *before* echoing the response
        header('Content-Type: ' . $contentType);
        echo $response;
    }
    curl_close($ch);

} catch (WrongKeyOrModifiedDataException $ex) {
    // Specific catch for decryption
    http_response_code(500);
    echo json_encode(['error' => 'Server error: Could not decrypt API key.']);
    exit;

} catch (\Throwable $th) {
    // --- THIS IS THE NEW PART ---
    // Catch ANY other error (PDOException, Error, etc.)
    http_response_code(500);
    // Send the actual PHP error message back as JSON
    echo json_encode([
        'error' => 'A fatal error occurred in the proxy.',
        'message' => $th->getMessage(),
        'file' => $th->getFile(),
        'line' => $th->getLine()
    ]);
    exit;
}