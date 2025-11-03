<?php
declare(strict_types=1);

namespace App\Controllers\API;

use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Message\ResponseInterface as Response;
use App\Repositories\CatRepository; // Import the new repository

class Cats
{
    // 1. Inject the CatRepository
    public function __construct(private CatRepository $repository)
    {
    }

    /**
     * Implements API Spec 3.1: Fetch Base Cat List Data
     * GET /api/cats
     */
    public function index(Request $request, Response $response): Response
    {
        // 2. Call the repository method
        $cats = $this->repository->getBaseCatList();
        
        // 3. Send the result
        $response->getBody()->write(json_encode($cats));
        return $response->withStatus(200);
    }

    /**
     * Implements API Spec 3.3: Fetch Detailed Static Cat Data
     * GET /api/cats/{cat_id}/details
     */
    public function show(Request $request, Response $response): Response
    {
        // 1. Get the cat from the middleware
        // (Your 'GetCat' middleware already attached this)
        $cat = $request->getAttribute('cat'); 

        // 2. We'll need a new repository method to get all details
        // We'll add this method in the next step.
        $detailedCat = $this->repository->getCatDetails((int)$cat['cat_id']);

        if ($detailedCat === false) {
             $response->getBody()->write(json_encode(['error' => 'Cat details not found.']));
             return $response->withStatus(404);
        }

        // 3. Send the result
        $response->getBody()->write(json_encode($detailedCat));
        return $response->withStatus(200);
    }

    // --- ADMIN METHODS (To be refactored later) ---

    public function create(Request $request, Response $response): Response
    {
        // This will need to be updated to use the repository
        $response->getBody()->write(json_encode(['message' => 'Admin create: Not implemented yet.']));
        return $response->withStatus(501);
    }

    public function update(Request $request, Response $response): Response
    {
        // This will need to be updated to use the repository
        $response->getBody()->write(json_encode(['message' => 'Admin update: Not implemented yet.']));
        return $response->withStatus(501);
    }

    public function delete(Request $request, Response $response): Response
    {
        // This will need to be updated to use the repository
        $response->getBody()->write(json_encode(['message' => 'Admin delete: Not implemented yet.']));
        return $response->withStatus(501);
    }
}