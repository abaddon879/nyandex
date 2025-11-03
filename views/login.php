<form method="post" action="/login" class="auth-form">
    <h1>Login</h1>

    <?php if (isset($error)): ?>
        <p class="error-message"><?= htmlspecialchars($error) ?></p>
    <?php endif; ?>

    <div class="input-group">
        <i class="fas fa-envelope"></i> 
        <input type="email" name="email" id="email" value="<?= htmlspecialchars($data['email'] ?? '') ?>" placeholder="Email" required> 
    </div>

    <div class="input-group">
        <i class="fas fa-lock"></i> 
        <input type="password" name="password" id="password" placeholder="Password" required> 
    </div>

    <button type="submit" class="btn btn-primary btn-lg btn-block">Login</button>

    <div class="auth-links"> 
        Need an account? <a href="/register">Register here</a>
    </div>
</form>