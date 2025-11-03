<form method="post" action="/register" class="auth-form"> 
    <h1>Register</h1> 

    <?php if (isset($errors)): ?>
        <ul class="error-list">
            <?php // ... error loop ... ?>
        </ul>
    <?php endif; ?>
    
    <div class="input-group">
        <i class="fas fa-user"></i> 
        <input type="text" name="username" id="username" value="<?= htmlspecialchars($data['username'] ?? '') ?>" placeholder="Username" required> 
    </div>

    <div class="input-group">
        <i class="fas fa-envelope"></i> 
        <input type="email" name="email" id="email" value="<?= htmlspecialchars($data['email'] ?? '') ?>" placeholder="Email" required> 
    </div>

    <div class="input-group">
        <i class="fas fa-lock"></i> 
        <input type="password" name="password" id="password" placeholder="Password" required> 
    </div>

    <div class="input-group">
        <i class="fas fa-lock"></i> 
        <input type="password" name="password_confirmation" id="password_confirmation" placeholder="Repeat password" required> 
    </div>

    <button type="submit" class="btn btn-primary btn-lg btn-block">Register</button>

    <div class="auth-links"> 
        Already have an account? <a href="/login">Log in here</a>
    </div>
</form>