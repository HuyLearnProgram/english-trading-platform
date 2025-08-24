// src/components/Register.js
import React, { useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/Auth.css';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const [error, setError] = useState('');
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateEmail(email)) {
      setError('Invalid email format. Please enter a valid email.');
      console.log('Invalid email format');
      return;
    }
    if (!role) {
      setError('Please select a role before registering.');
      alert('Please select a role before registering.');
      return;
    }
    try {
      await register(email, password, role);
      if (role === 'admin') navigate('/admin');
      else if (role === 'businessowner') navigate('/businessowner/home');
      else navigate('/customer/home');
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Account already exists';
      setError(errorMessage);
      alert(errorMessage);
    }
  };

  return (
    <div className="auth-container">
      <form onSubmit={handleSubmit} className="auth-form">
        <h2>Register</h2>
        {error && <p className="auth-error">{error}</p>}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="auth-input"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="auth-input"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          required
          className="auth-input"
        >
          <option value="">Select Role</option>
          <option value="admin">Admin</option>
          <option value="businessowner">Business Owner</option>
          <option value="customer">Customer</option>
        </select>
        <button type="submit" className="auth-button">Register</button>
        <p className="auth-switch">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </form>
    </div>
  );
};

export default Register;
