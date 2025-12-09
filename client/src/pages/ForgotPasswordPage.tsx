import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { http } from '../api/http';
import './LoginPage.css'; // Reuse login styling

export const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await http.post('/auth/forgot-password', { email });

            setIsSubmitted(true);
            toast.success('Password reset email sent!');
        } catch (error: any) {
            toast.error(error.response?.data?.message || error.message || 'Failed to send reset email');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-container">
                <div className="login-header">
                    <h1>PersonaGrid</h1>
                    <p>Reset Your Password</p>
                </div>

                {!isSubmitted ? (
                    <form onSubmit={handleSubmit} className="login-form">
                        <p style={{ color: '#a0a0b0', marginBottom: '1.5rem', textAlign: 'center' }}>
                            Enter your email address and we'll send you a link to reset your password.
                        </p>

                        <div className="form-group">
                            <label>Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="Enter your registered email"
                            />
                        </div>

                        <button type="submit" disabled={isLoading} className="submit-button">
                            {isLoading ? 'Sending...' : 'Send Reset Link'}
                        </button>

                        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                            <Link to="/login" style={{ color: '#646cff', textDecoration: 'none', fontSize: '0.9rem' }}>
                                ← Back to Login
                            </Link>
                        </div>
                    </form>
                ) : (
                    <div className="login-form" style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📧</div>
                        <h2 style={{ color: '#fff', marginBottom: '0.5rem' }}>Check your email</h2>
                        <p style={{ color: '#a0a0b0', marginBottom: '2rem' }}>
                            We've sent a password reset link to <strong>{email}</strong>.
                        </p>
                        <button
                            onClick={() => setIsSubmitted(false)}
                            className="submit-button"
                            style={{ background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)' }}
                        >
                            Try another email
                        </button>
                        <div style={{ marginTop: '1.5rem' }}>
                            <Link to="/login" style={{ color: '#646cff', textDecoration: 'none', fontSize: '0.9rem' }}>
                                ← Back to Login
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
