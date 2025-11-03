<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Display Cat Data in a Grid</title>
    <link rel="stylesheet" href="../assets/css/styles.css">
</head>

<body>

<div class="container">
    <header>
        <h1>The Battle Cats</h1>
        <div class="search-container">
        <input type="text" id="search" placeholder="Search for a cat">
        <div class="filter-icon" id="filter-button">
            <img src="assets/images/settings-sliders.png" alt="Filter">
        </div>

        <div id="filter-options" style="display: none;">
            <div>
                <label>
                    <input type="checkbox" value="upgrade"> Upgrade
                </label>
            </div>
            <div>
                <label>
                    <input type="checkbox" value="missing"> Missing
                </label>
            </div>
            <div>
                <label for="min-level">Min Level:</label>
                <input type="number" id="min-level" min="1">
            </div>
            <div>
                <label for="max-level">Max Level:</label>
                <input type="number" id="max-level">
            </div>
            <button id="clear-filters-btn">Clear Filters</button>
        </div>
    </div>
    </header>
    <div id="cat-sections"></div>
</div>

<!-- Modal for unit details -->
<div id="unit-modal" class="modal">
    <div class="modal-content">
        <span class="close" title="Close">&times;</span>
        <h2><span id="modal-id"></span></h2><button class="remove">Remove</button>
        <h3 id="modal-name"></h3>
        <img id="modal-image" src="" alt="">
        <div>
            <p id="modal-boostable"></p>
            <p id="modal-max-level"></p>
            <p id="modal-max-plus-level"></p>
        </div>

        <h3 id="modal-evolved-form-name"></h3>
        <img id="modal-evolved-form-image" src="" alt="">
        <div id="modal-evolved-form-evolution-requirements">
            <p id="modal-evolved-form-required-level"></p>
        </div>

        <h3 id="modal-true-form-name"></h3>
        <img id="modal-true-form-image" src="" alt="">
        <div id="modal-true-form-evolution-requirements">
            <p id="modal-true-form-required-level"></p>
            <p id="modal-true-form-required-xp"></p>
            <img id="modal-true-form-evolution-requirements-1-img" src="" alt="">
            <span id="modal-true-form-evolution-requirements-1-qty"></span>
            <img id="modal-true-form-evolution-requirements-2-img" src="" alt="">
            <span id="modal-true-form-evolution-requirements-2-qty"></span>
            <img id="modal-true-form-evolution-requirements-3-img" src="" alt="">
            <span id="modal-true-form-evolution-requirements-3-qty"></span>
            <img id="modal-true-form-evolution-requirements-4-img" src="" alt="">
            <span id="modal-true-form-evolution-requirements-4-qty"></span>
            <img id="modal-true-form-evolution-requirements-5-img" src="" alt="">
            <span id="modal-true-form-evolution-requirements-5-qty"></span>
        </div>

        <h3 id="modal-ultra-form-name"></h3>
        <img id="modal-ultra-form-image" src="" alt="">
        <div id="modal-ultra-form-evolution-requirements">
            <p id="modal-ultra-form-required-level"></p>
            <p id="modal-ultra-form-required-xp"></p> 
            <img id="modal-ultra-form-evolution-requirements-1-img" src="" alt="">
            <span id="modal-ultra-form-evolution-requirements-1-qty"></span>
            <img id="modal-ultra-form-evolution-requirements-2-img" src="" alt="">
            <span id="modal-ultra-form-evolution-requirements-2-qty"></span>
            <img id="modal-ultra-form-evolution-requirements-3-img" src="" alt="">
            <span id="modal-ultra-form-evolution-requirements-3-qty"></span>
            <img id="modal-ultra-form-evolution-requirements-4-img" src="" alt="">
            <span id="modal-ultra-form-evolution-requirements-4-qty"></span>
            <img id="modal-ultra-form-evolution-requirements-5-img" src="" alt="" >
            <span id="modal-ultra-form-evolution-requirements-5-qty"></span>
        </div>
    </div>
</div>

<script>
    const userId = <?php echo json_encode($_SESSION['user_id']); ?>;
    const apiKey = '<?php echo $_ENV['API_KEY']; ?>';
</script>
<script src="../assets/scripts/cats.js" defer></script>


</body>
</html>
