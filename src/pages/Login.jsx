import React, { useState } from 'react';

function Login({ onLogin }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();

        // Call the centralized authentication handler
        const result = await window.electronAPI.authLogin(email, password);

        if (result.success) {
            onLogin(result.user);
        } else {
            setError(result.error || 'Invalid credentials');
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <div className="glass-card" style={{ width: '400px' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>School Portal</h2>
                <form onSubmit={handleLogin}>
                    <input
                        type="email"
                        placeholder="Email Address"
                        className="input-field"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoFocus
                        tabIndex="1"
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        className="input-field"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        tabIndex="2"
                    />
                    {error && <p style={{ color: '#ef4444', marginBottom: '1rem' }}>{error}</p>}
                    <button type="submit" className="btn-primary" style={{ width: '100%' }} tabIndex="3">Login</button>
                </form>
            </div>
        </div>
    );
}

export default Login;
