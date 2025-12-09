import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { http } from '../api/http';
import './LoginPage.css'; // Reuse login styling

export const ResetPasswordPage = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        setIsLoading(true);

        try {
            await http.post('/auth/reset-password', { token, password });

            toast.success('Password reset successfully!');
            navigate('/login');
        } catch (error: any) {
            toast.error(error.response?.data?.message || error.message || 'Failed to reset password');
        } finally {
            setIsLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="login-page">
                <div className="login-container">
                    <div className="login-form" style={{ textAlign: 'center' }}>
                        <h2 style={{ color: '#ff5757', marginBottom: '1rem' }}>Invalid Link</h2>
                        <p style={{ color: '#a0a0b0', marginBottom: '2rem' }}>
                            This password reset link is invalid or missing.
                        </p>
                        <button onClick={() => navigate('/login')} className="submit-button">
                            Return to Login
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="login-page">
            <div className="login-container">
                <div className="login-header">
                    <h1>PersonaGrid</h1>
                    <p>Set New Password</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label>New Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                            placeholder="Enter new password"
                        />
                    </div>

                    <div className="form-group">
                        <label>Confirm Password</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            minLength={6}
                            placeholder="Confirm new password"
                        />
                    </div>

                    <button type="submit" disabled={isLoading} className="submit-button">
                        {isLoading ? 'Resetting...' : 'Reset Password'}
                    </button>
                </form>
            </div>
        </div>
    );
};
