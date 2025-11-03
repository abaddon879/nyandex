<?php

declare(strict_types=1);

namespace App\Controllers\API;

use Psr\Http\Message\ServerRequestInterface AS Request;
use Psr\Http\Message\ResponseInterface AS Response;
use App\Repositories\VersionRepository;
use Valitron\Validator;

class Versions
{
    public function __construct(private VersionRepository $repository,
                                private Validator $validator)
    {             
        $this->validator->mapFieldsRules([
            'version_id' => ['required'],
        ]);       
    }

    public function index(Request $request, Response $response): Response
    {
        $versions = $this->repository->getAll();

        $body = json_encode($versions);
    
        $response->getBody()->write($body);
    
        return $response->withHeader('Content-Type', 'application/json');;
    }

    public function show(Request $request, Response $response, string $id): Response
    {
        $version = $request->getAttribute('version');

        $body = json_encode($version);
    
        $response->getBody()->write($body);
    
        return $response->withHeader('Content-Type', 'application/json');;
    }

    public function latest(Request $request, Response $response): Response
    {
        $latestVersion = $this->repository->getLatest();

        $body = json_encode($latestVersion);

        $response->getBody()->write($body);

        return $response->withHeader('Content-Type', 'application/json');;
    }

    public function create(Request $request, Response $response): Response
    {
        $body = $request->getParsedBody();

        $this->validator = $this->validator->withData($body);
        $this->validator->rule('required', 'release_date'); // Ensures release_date is required
        $this->validator->rule('date', 'release_date'); // Valid date-time format for release_date


        if ( ! $this->validator->validate()) {

            $response->getBody()
                     ->write(json_encode($this->validator->errors()));

            return $response->withStatus(422);
        }

        $newVersion = $this->repository->create($body);

        $body = json_encode([
            'message' => 'Version created',
            'version' => $newVersion
        ]);

        $response->getBody()->write($body);

        return $response->withStatus(201)->withHeader('Content-Type', 'application/json');
    }

    public function update(Request $request, Response $response, string $id): Response
    {
        $body = $request->getParsedBody();
        $body['version_id'] = $id; // Add the version_id to the body if needed

        $this->validator = $this->validator->withData($body);
        $this->validator->rule('required', 'download_date'); // Ensures the field is required
        $this->validator->rule('dateFormat', 'download_date', 'Y-m-d H:i:s'); // Ensures valid date-time format

        if ( ! $this->validator->validate()) {

            $response->getBody()
                     ->write(json_encode($this->validator->errors()));

            return $response->withStatus(422);
        }

        $updatedVersion = $this->repository->update($id, $body);
        if ($updatedVersion === null) {
            $response->getBody()->write(json_encode(['error' => 'Version not found']));
            return $response->withStatus(404);
        }

        $response->getBody()->write(json_encode([
            'message' => 'Version updated',
            'version' => $updatedVersion
        ]));

        return $response->withHeader('Content-Type', 'application/json');
    }
}