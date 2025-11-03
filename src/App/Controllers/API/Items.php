<?php
declare(strict_types=1);

namespace App\Controllers\API;

use Psr\Http\Message\ServerRequestInterface as Request;
// [FIX] Corrected the backslash in the line below
use Psr\Http\Message\ResponseInterface as Response;
use App\Repositories\ItemRepository; // Import the new repository

class Items
{
    // 1. Inject the ItemRepository
    public function __construct(private ItemRepository $repository)
    {
    }

    /**
     * Fetches a list of all static item definitions.
     * GET /api/items
     */
    public function index(Request $request, Response $response): Response
    {
        // 2. Call the repository method
        $items = $this->repository->getAll();
        
        // 3. Send the result
        $response->getBody()->write(json_encode($items));
        return $response->withStatus(200);
    }

    /**
     * Fetches a single static item definition.
     * GET /api/items/{item_id}
     */
    public function show(Request $request, Response $response): Response
    {
        // 1. Get the item from the middleware
        // (Your 'GetItem' middleware already attached this)
        $item = $request->getAttribute('item'); 

        // 2. Send the result
        // The middleware already found the item, so we just return it.
        $response->getBody()->write(json_encode($item));
        return $response->withStatus(200);
    }
}