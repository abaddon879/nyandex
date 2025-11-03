<?php
declare(strict_types=1);

// --- Make sure to import all your controllers and middleware ---
use App\Controllers\API\Cats;
use App\Controllers\API\Items;
use App\Controllers\API\UserCats;
use App\Controllers\API\UserItems;
use App\Controllers\API\Versions;
use App\Controllers\Auth\AnonymousUserController;
use App\Controllers\Auth\RegisteredUserController;
use App\Controllers\Auth\SessionController;
use App\Controllers\API\PinnedCatController;
use App\Controllers\API\UserCatBulkController;
use App\Controllers\API\DashboardController; // [NEW] Import DashboardController

use App\Middleware\RequireAPIKey;
use App\Middleware\AddJsonResponseHeader;
use App\Middleware\GetCat;
use App\Middleware\GetItem;
use App\Middleware\GetUserCat;
use App\Middleware\GetUserItem;
use App\Middleware\GetVersion;
use App\Middleware\AuthorizeUserAccess;
use App\Middleware\RequireAdmin;
use Slim\Routing\RouteCollectorProxy;

// --- Public Authentication Routes (Spec 1.1 - 1.7) ---
$app->group('/api/users', function (RouteCollectorProxy $group) {
    
    // 1.1 Create Anonymous User
    $group->post('/anonymous', [AnonymousUserController::class, 'create']);

    // 1.2 Convert Guest to Registered User
    $group->post('/convert', [RegisteredUserController::class, 'create'])
          ->add(RequireAPIKey::class); // Requires the GUEST API key to work

    // 1.3 Login Registered User
    $group->post('/login', [SessionController::class, 'create']);

    // 1.4 Logout Registered User
    $group->post('/logout', [SessionController::class, 'destroy'])
          ->add(RequireAPIKey::class); // Requires a key to invalidate it

})->add(AddJsonResponseHeader::class); // All auth routes return JSON


// --- Main Protected API Routes (All require a valid API key) ---
$app->group('/api', function(RouteCollectorProxy $group) {

    // 1.8 Get Current User Info (/me)
    $group->get('/users/me', [RegisteredUserController::class, 'show']);

    // 1.9 Delete Account
    $group->delete('/users/me', [RegisteredUserController::class, 'delete']);

    // --- STATIC DATA ---
    $group->get('/cats', [Cats::class, 'index']); // 3.1
    $group->get('/items', [Items::class, 'index']);
    
    // 3.3 & 5.1 Fetch Detailed Static Cat Data
    $group->group('/cats/{cat_id:[0-9]+}', function(RouteCollectorProxy $group) {
        $group->get('/details', [Cats::class, 'show']);
    })->add(GetCat::class);
    
    $group->get('/items/{item_id:[0-9]+}', [Items::class, 'show'])->add(GetItem::class);

    
    // --- USER-SPECIFIC DATA (PRIVATE) ---
    // All routes in this group are protected by AuthorizeUserAccess
    $group->group('/users/{user_id:[0-9]+}', function (RouteCollectorProxy $group) {
        
        // 2.1 Get Dashboard Data [NEW ROUTE]
        $group->get('/dashboard', [DashboardController::class, 'show']);

        // 3.2 Fetch User's Cat Collection
        $group->get('/cats', [UserCats::class, 'index']);

        // 3.4 & 4.1 Fetch User's Full Inventory
        $group->get('/inventory', [UserItems::class, 'index']);
        
        // 3.5 Bulk Update User Cats
        $group->post('/cats/bulk-update', [UserCatBulkController::class, 'create']);

        // 5.2 & 5.3 Save/Get User Data for a Single Cat
        $group->group('/cats/{cat_id:[0-9]+}', function (RouteCollectorProxy $group) {
            $group->get('', [UserCats::class, 'show']);    // 5.2
            $group->put('', [UserCats::class, 'update']);    // 5.3 (PUT for full update)
            $group->delete('', [UserCats::class, 'delete']);
        })->add(GetUserCat::class);

        // 4.2 Update Item Quantity (Auto-Save)
        $group->group('/items/{item_id:[0-9]+}', function (RouteCollectorProxy $group) {
            $group->get('', [UserItems::class, 'show']);
            $group->put('', [UserItems::class, 'update']);    // 4.2 (PUT for single update)
            $group->delete('', [UserItems::class, 'delete']);
        })->add(GetUserItem::class);
        
        // 5.4 & 5.5 Pin/Unpin a Cat
        $group->post('/pinned-cats/{cat_id:[0-9]+}', [PinnedCatController::class, 'create']);
        $group->delete('/pinned-cats/{cat_id:[0-9]+}', [PinnedCatController::class, 'delete']);

    })->add(AuthorizeUserAccess::class);

    // --- ADMIN-ONLY ROUTES ---
    $group->group('/admin', function(RouteCollectorProxy $group) {
        $group->post('/cats', [Cats::class, 'create']);
        $group->patch('/cats/{cat_id:[0-9]+}', [Cats::class, 'update'])->add(GetCat::class);
        $group->delete('/cats/{cat_id:[0-9]+}', [Cats::class, 'delete'])->add(GetCat::class);

        $group->get('/versions', [Versions::class, 'index']);
        // ... (all other version routes) ...
    })->add(RequireAdmin::class);


})->add(RequireAPIKey::class)
  ->add(AddJsonResponseHeader::class);