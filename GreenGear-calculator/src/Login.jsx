import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import { useAuth } from "./auth/AuthProvider";

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const auth = useAuth();

    const handleSubmit = (e) => {
        e.preventDefault();
        if (username === 'Markus' && password === 'Klein') {
            alert('Login successful');
            navigate('/admin');

        } else {
            setError('Invalid username or password');
        }
    };

    const handleAuthLogin = async (e) => {
        e.preventDefault();

        const success = await auth.login(username, password);
        if (success) {
            // Redirect to main page after login
            navigate("/", { replace: true });
        } else {
            setError(auth.error || "Login failed");
        }
    };

    return (
        <div className="Login">
            <h1>Login</h1>
            <form onSubmit={handleAuthLogin}>
                <label>
                    <p>Username</p>
                    <input
                        type="text"
                        name="username"
                        value={username}
                        placeholder='Enter username' style={{ textAlign: 'center' }}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                </label>
                <label>
                    <p>Password</p>
                    <input
                        type="password"
                        name="password"
                        value={password}
                        placeholder='Enter password' style={{ textAlign: 'center' }}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </label>
                {error && <p style={{ color: 'red' }}>{error}</p>}
                <div>
                    <button type="submit">Submit</button>
                </div>
            </form>
        </div>
    );
}