import React, { useState } from 'react';
import { User, Lock, Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // API Call States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Username dan password wajib diisi.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Gagal login. Periksa kembali jaringan atau kredensial Anda.');
      }

      // Success
      onLoginSuccess(data.user, data.token);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Header */}
        <div className="login-card-header">
          <div className="login-logo">PQ</div>
          <h2>MA PIQ SINGOSARI</h2>
          <p>Sistem Presensi, Jurnal & Penilaian Takhosus</p>
        </div>

        {/* Form Body */}
        <div className="login-card-body">
          {error && (
            <div className="alert-danger">
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Username Field */}
            <div className="form-group">
              <label className="form-label">Username</label>
              <div className="input-icon-wrapper">
                <User className="input-icon-left" size={18} />
                <input 
                  type="text" 
                  className="form-input input-with-icon" 
                  placeholder="Masukkan username..."
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="form-group" style={{ marginBottom: 'var(--spacing-lg)' }}>
              <label className="form-label">Password</label>
              <div className="input-icon-wrapper">
                <Lock className="input-icon-left" size={18} />
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  className="form-input input-with-icon" 
                  placeholder="Masukkan password..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
                <button 
                  type="button"
                  className="input-icon-right"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  title={showPassword ? "Sembunyikan Password" : "Tampilkan Password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '12px', marginTop: 'var(--spacing-sm)' }}
              disabled={loading}
            >
              {loading ? (
                <span>Memverifikasi...</span>
              ) : (
                <>
                  <LogIn size={18} />
                  <span>Masuk</span>
                </>
              )}
            </button>
          </form>

          {/* Helper details for testing */}
          <div style={{ marginTop: 'var(--spacing-lg)', borderTop: '1px solid var(--border-color)', paddingTop: 'var(--spacing-md)', fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>
            <p style={{ fontWeight: 600, marginBottom: '2px' }}>Akun Uji Coba:</p>
            <p>Admin: <strong>admin</strong> / password: <strong>admin123</strong></p>
            <p>Guru: <strong>ustadzfauzi</strong> / password: <strong>guru123</strong></p>
          </div>
        </div>
      </div>
    </div>
  );
}
