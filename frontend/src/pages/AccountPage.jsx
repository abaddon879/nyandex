import React, { useState, useEffect } from 'react';
import { authStore } from '../stores/authStore';
import BaseButton from '../components/base/BaseButton.jsx';

/**
 * The main Account page.
 * Conditionally renders Guest form or Registered profile.
 */
function AccountPage() {
  const [authState, setAuthState] = useState(authStore.getState());
  useEffect(() => {
    const unsubscribe = authStore.subscribe(setAuthState);
    return unsubscribe;
  }, []);

  const { isAnonymous } = authState;

  return (
    <div>
      {isAnonymous ? <GuestConvertForm /> : <RegisteredProfile />}
    </div>
  );
}

/**
 * Sub-component for Guest-to-Registered conversion (Spec 5.B)
 */
function GuestConvertForm() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    const result = await authStore.convert(username, email, password);
    
    if (result.success) {
      setSuccess("Your account has been successfully created! You are now a registered user.");
    } else {
      setError(result.error);
    }
  };

  return (
    <div>
      <h1>Create Your Account</h1>
      <p>Your data is currently only saved on this device. Create a free account to back it up and sync across devices.</p>
      
      {success && <p style={{ color: 'green' }}>{success}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label>Username</label>
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <BaseButton type="submit" variant="primary">Save & Secure My Account</BaseButton>
      </form>
    </div>
  );
}

/**
 * Sub-component for managing a registered profile (Spec 5.B)
 */
function RegisteredProfile() {
  const { username, email } = authStore.getState();

  return (
    <div>
      <h1>My Account</h1>
      <p><strong>Username:</strong> {username}</p>
      {/* [THE FIX] Corrected the closing tag on this line */}
      <p><strong>Email:</strong> {email}</p>
      
      <div style={{ marginTop: '2rem', padding: '1rem', border: '1px solid red' }}>
        <h4>Danger Zone</h4>
        <p>Password reset and account deletion features will go here.</p>
        <BaseButton variant="destructive">Delete My Account</BaseButton>
      </div>
    </div>
  );
}

export default AccountPage;