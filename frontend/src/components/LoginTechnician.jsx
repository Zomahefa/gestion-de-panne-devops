import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';
import './LoginTechnician.css';
import logoJirama from './logo-jirama.png';
import { Link } from 'react-router-dom';

const LoginTechnician = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}token/`, {
        username,
        password,
      });
      localStorage.setItem('token', res.data.access);
      localStorage.setItem('username', username);
      setAuthenticated(true);
    } catch (err) {
      setError('Nom ou mot de passe incorrect');
      console.log(err.response?.data);
    }
  };

  if (authenticated) {
    return <Navigate to="/technicien" />;
  }

  return (
    <div className="login-container">
      <Link to="/ClientForm" className="btn btn-outline-primary mb-3">🔙</Link>
      <img src={logoJirama} alt="Logo JIRAMA" className="logo-jirama" />
      <h2>🔐 Connexion Technicien</h2>
      <input
        type="text"
        name="username"
        autoComplete="off"
        className="form-control"
        placeholder="Nom d'utilisateur"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
      />
      <div className="password-wrapper">
        <input
          type={showPassword ? 'text' : 'password'}
          name="password"
          autoComplete="new-password"
          className="form-control"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button
          type="button"
          className="password-toggle"
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? '🙈' : '👁️'}
        </button>
      </div>

      <button className="btn btn-warning mt-3" onClick={handleLogin}>
        Se connecter
      </button>
      {error && <p className="text-danger mt-2">{error}</p>}
    </div>
  );
};

export default LoginTechnician;
