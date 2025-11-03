<?php

declare(strict_types=1);

namespace App\Utils;

class CatProcessor
{
    public static function process(array $results, string $context = ''): array
    {
        $cats = [];
        $currentCatId = null;
        $currentCat = null;

        // Log to a file
        //file_put_contents(APP_ROOT . '/logs/logfile.log', print_r($results, true), FILE_APPEND);


        foreach ($results as $row) {
            $catId = $row['cat_id'];

            if ($catId !== $currentCatId) {
                if ($currentCat) {
                    $cats[] = $currentCat; // Save the current cat if it exists
                }

                // Initialize a new current cat
                $currentCatId = $catId;
                $currentCat = [
                    'cat_id' => $row['cat_id'],
                    'cat_name' => $row['form_name'], // Primary form name can be used
                    'cat_order_id' => $row['cat_order_id'],
                    'boostable' => $row['boostable'],
                    'max_level' => $row['max_level'],
                    'max_plus_level' => $row['max_plus_level'],
                    'rarity' => [
                        'rarity_id' => $row['rarity_id'],
                        'rarity_name' => $row['rarity_name'],
                    ],
                    'forms' => [],
                ];
                
                // Conditionally add user_info if context is for user cats
                if ($context === 'user_cats') {
                    $currentCat['user_info'] = [
                        'user_id' => $row['user_id'] ?? null,
                        'user_cat_level' => $row['user_cat_level'] ?? null,
                        'user_cat_plus_level' => $row['user_cat_plus_level'] ?? null,
                        'user_cat_form_id' => $row['user_cat_form_id'] ?? null,
                    ];
                }
            }

            // Handle forms
            $formId = $row['form_id'];
            if ($formId !== null && !isset($currentCat['forms'][$formId])) {
                $currentCat['forms'][$formId] = [
                    'form_id' => $row['form_id'],
                    'form_name' => $row['form_name'],
                    'required_level' => $row['required_level'],
                    'required_xp' => $row['required_xp'],
                    'image_url' => $row['image_url'],
                    'evolution_requirements' => []
                ];
            }

            // Collect evolution requirements if applicable
            if ($row['item_id']) {
                $currentCat['forms'][$formId]['evolution_requirements'][] = [
                    'item_id' => $row['item_id'],
                    'item_name' => $row['item_name'],
                    'item_qty' => $row['item_qty']
                ];
            }
        }

        // Add the last processed cat to the list
        if ($currentCat) {
            $cats[] = $currentCat;
        }

        // Convert associative forms to indexed arrays
        foreach ($cats as &$cat) {
            $cat['forms'] = array_values($cat['forms']);
        }

        return $cats; // Return the processed cats
    }
}