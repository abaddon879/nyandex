<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Display Item Data in a Grid</title>
    <link rel="stylesheet" href="../assets/css/styles.css">
</head>

<body>

<div class="container">
    <header>
        <h1>Items</h1>
        <div class="search-container">
            <input type="text" id="search" placeholder="Search for an item" oninput="filterItems()">
        </div>
    </header>
    <div id="item-sections"></div>
</div>

<!-- Modal for item details -->
<div id="item-modal" class="modal">
    <div class="modal-content">
        <span class="close">&times;</span>
        <h2><span id="modal-id"></span></h2>
        <h3 id="modal-name"></h3>
        <img id="modal-image" src="" alt="">
        <p id="modal-description"></p>
        <p id="modal-quantity"></p>
    </div>
</div>

<script>
    const API_BASE_URL = "<?= $_ENV['API_BASE_URL'] ?>";
    const userId = <?php echo json_encode($_SESSION['user_id']); ?>;
    const apiKey = '<?php echo $_ENV['API_KEY']; ?>';
</script>
<script src="../assets/scripts/items.js" defer></script>

</body>
</html>