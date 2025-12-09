import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAdmin } from '../contexts/AdminContext';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import './LoginPage.css';

type LoginMode = 'login' | 'signup' | 'admin';

export const LoginPage = () => {
  const [mode, setMode] = useState<LoginMode>('login');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    mission: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const { login, signup } = useAuth();
  const { login: adminLogin } = useAdmin();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === 'signup') {
        await signup(formData.name, formData.email, formData.password, formData.mission || undefined);
        toast.success('Organization created successfully!');
        navigate('/dashboard');
      } else if (mode === 'admin') {
        await adminLogin(formData.email, formData.password);
        toast.success('Welcome back, Admin!');
        navigate('/admin/dashboard');
      } else {
        await login(formData.email, formData.password);
        toast.success('Welcome back!');
        navigate('/dashboard');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const getTitle = () => {
    switch (mode) {
      case 'signup': return 'Create Organization';
      case 'admin': return 'Admin Portal';
      default: return 'Welcome Back';
    }
  };

  const getButtonText = () => {
    if (isLoading) return 'Processing...';
    switch (mode) {
      case 'signup': return 'Create Organization';
      case 'admin': return 'Login as Admin';
      default: return 'Login';
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>PersonaGrid</h1>
          <p>{mode === 'admin' ? 'Super Admin Access' : 'AI-Powered Digital Marketing Platform'}</p>
        </div>

        <div className="login-tabs">
          <button
            className={mode === 'login' ? 'active' : ''}
            onClick={() => setMode('login')}
          >
            Login
          </button>
          <button
            className={mode === 'signup' ? 'active' : ''}
            onClick={() => setMode('signup')}
          >
            Sign Up
          </button>
          <button
            className={mode === 'admin' ? 'active' : ''}
            onClick={() => setMode('admin')}
          >
            Admin
          </button>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <h2 className="form-title">{getTitle()}</h2>

          {mode === 'signup' && (
            <div className="form-group">
              <label>Organization Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="Enter organization name"
              />
            </div>
          )}

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              placeholder={mode === 'admin' ? "admin@personagrid.com" : "Enter your email"}
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              minLength={6}
              placeholder="Enter your password"
            />
          </div>

          <div style={{ textAlign: 'right', marginTop: '-0.5rem', marginBottom: '1rem' }}>
            <Link to="/forgot-password" style={{ color: '#646cff', textDecoration: 'none', fontSize: '0.85rem' }}>
              Forgot Password?
            </Link>
          </div>

          {mode === 'signup' && (
            <div className="form-group">
              <label>Mission (Optional)</label>
              <textarea
                value={formData.mission}
                onChange={(e) => setFormData({ ...formData, mission: e.target.value })}
                placeholder="Describe your organization's mission"
                rows={3}
              />
            </div>
          )}

          <button type="submit" disabled={isLoading} className="submit-button">
            {getButtonText()}
          </button>
        </form>
      </div>
    </div>
  );
};

