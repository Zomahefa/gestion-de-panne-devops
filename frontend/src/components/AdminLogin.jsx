import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminLogin.css';
import logoJirama from './logo-jirama.png';
import axios from 'axios';
import { Link } from 'react-router-dom';

const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}admin-login/`, {
        username,
        password,
      });
      localStorage.setItem('admin_token', res.data.token);
      navigate('/admin-dashboard');
    } catch (err) {
      setError('Identifiants incorrects');
      console.log(err.response?.data);
    }
  };

  return (
    <div className="login-container">
      <Link to="/ClientForm" className="btn btn-outline-primary mb-3">🔙</Link>
      <img src={logoJirama} alt="Logo JIRAMA" className="logo-jirama" />
      <h2>🛠️ Connexion administrateur</h2>
      
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
            className="form-control mt-2"
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
        <button className="btn btn-primary mt-3" onClick={handleLogin}>
          Se connecter
        </button>
        {error && <p className="text-danger mt-2">{error}</p>}
        
    </div>
  );
};

export default AdminLogin;
