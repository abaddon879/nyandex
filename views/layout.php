<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= htmlspecialchars($title ?? 'pAwesome Tracker') ?></title>
    
    <link rel="stylesheet" href="/assets/css/global.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" integrity="sha512-9usAa10IRO0HhonpyAIVpjrylPvoDwiPUiKdWk5t3PyolY1cOd4DSE0Ga+ri4AuTroPR5aQvXU9xC6qOPnzFeg==" crossorigin="anonymous" referrerpolicy="no-referrer" />


    <?php if (isset($page_css) && is_array($page_css)): ?>
        <?php foreach ($page_css as $css_file): ?>
            <link rel="stylesheet" href="<?= htmlspecialchars($css_file) ?>">
        <?php endforeach; ?>
    <?php elseif (isset($page_css)): ?>
        <link rel="stylesheet" href="<?= htmlspecialchars($page_css) ?>">
    <?php endif; ?>
</head>
<body>

    <header class="global-header">
        <a href="/" class="brand">pAwesome Tracker</a>
        <div class="user-nav">
            <?php if (empty($_SESSION['user_id'])): ?>
                <a href="/login">Login</a>
                <a href="/register">Register</a>
            <?php else: ?>
                <a href="/profile">Profile</a>
                <a href="/logout">Logout</a>
            <?php endif; ?>
        </div>
    </header>

    <?php if (empty($_SESSION['user_id'])): ?>
    
        <div class="auth-layout">
            <?= $content ?? '' ?>
        </div>

    <?php else: ?>

        <div class="app-shell">
            
            <aside class="app-sidebar">
                <nav>
                    <ul>
                        <?php $currentPath = $_SERVER['REQUEST_URI'] ?? '/'; ?>
                        <li>
                            <a href="/catalog" class="<?= ($currentPath === '/catalog') ? 'active' : '' ?>"> 
                                Catalog 
                            </a>
                        </li>
                        <li>
                            <a href="/redesign" class="<?= ($currentPath === '/redesign') ? 'active' : '' ?>"> 
                                Redesign 
                            </a>
                        </li>
                        <li>
                            <a href="/inventory" class="<?= ($currentPath === '/inventory') ? 'active' : '' ?>">
                                Inventory
                            </a>
                        </li>
                        <li>
                            <a href="/items" class="<?= ($currentPath === '/items') ? 'active' : '' ?>">
                                Items
                            </a>
                        </li>
                    </ul>
                </nav>
            </aside>

            <main class="app-content">
                <?= $content ?? '' ?>
            </main>

        </div>

    <?php endif; ?>


    <?php if (isset($page_js_module)): ?>
        <script>
            window.userId = <?php echo json_encode($_SESSION['user_id'] ?? null); ?>;
        </script>
        <?php
        // This variable is already defined near the top of layout.php
        $currentPath = $_SERVER['REQUEST_URI'] ?? '/'; 
        
        // Start with the default module (e.g., app.js)
        $jsModuleToLoad = $page_js_module; 

        // If we are on the /catalog page, load catalog_app.js instead
        if ($currentPath === '/catalog') {
            $jsModuleToLoad = '/assets/scripts/catalog_app.js';
        }
        ?>
        <script src="<?= htmlspecialchars($jsModuleToLoad) ?>" type="module" defer></script>
    <?php elseif (isset($page_js_data) && isset($page_js)): ?>
        <script>
            <?php foreach ($page_js_data as $key => $value): ?>
                const <?= $key ?> = <?= $value ?>;
            <?php endforeach; ?>
        </script>
        <script src="<?= htmlspecialchars($page_js) ?>" defer></script>
    <?php endif; ?>

</body>
</html>