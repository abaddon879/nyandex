<!DOCTYPE html>
<html>
<head>
    <title>pAwesome Tracker</title>
    
    <!-- <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/water.css@2/out/water.css"> -->

    <!-- <link rel="stylesheet" href="https://unpkg.com/mvp.css"> -->
</head>

<?php if (empty($_SESSION['user_id'])): ?>

    <a href="/register">Register account</a>

    or 

    <a href="/login">log in</a>

<?php else: ?>

    <a href="/profile">View profile</a>

    or
    
    <a href="/cats">View cats</a>

    or

    <a href="/redesign">View redesign</a>

    or

    <a href="/items">View items</a>

    or

    <a href="/logout">log out</a>

<?php endif; ?>

<?= $content ?>

</body>
</html>