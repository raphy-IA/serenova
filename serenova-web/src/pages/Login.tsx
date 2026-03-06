import { useState } from 'react';
import { useAuth, api } from '../context/AuthContext';
import { Building2, Loader2, AlertCircle } from 'lucide-react';
import './Login.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { login } = useAuth();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await api.post('/auth/login', { email, password });
            const { user, tokens } = response.data.data;
            login(user, tokens.accessToken);
        } catch (err: any) {
            console.error('Login error:', err);
            setError(err.response?.data?.message || 'Identifiants incorrects ou serveur indisponible.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-root">
            <div className="login-container glass-panel">
                <div className="login-header">
                    <div className="login-logo">
                        <Building2 size={40} color="var(--color-secondary)" />
                    </div>
                    <h1>SÉRÉNOVA</h1>
                    <p>Connectez-vous à votre espace gestionnaire</p>
                </div>

                {error && (
                    <div className="alert-item error" style={{ marginBottom: '1.5rem', borderLeftWidth: '4px' }}>
                        <AlertCircle size={18} />
                        <div>{error}</div>
                    </div>
                )}

                <form className="login-form" onSubmit={handleLogin}>
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="votre@email.com"
                            required
                            disabled={loading}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Mot de passe</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            disabled={loading}
                        />
                    </div>
                    <div className="form-options">
                        <label className="checkbox-label">
                            <input type="checkbox" />
                            <span>Se souvenir de moi</span>
                        </label>
                        <a href="#" className="forgot-password">Mot de passe oublié ?</a>
                    </div>
                    <button
                        type="submit"
                        className="primary-btn login-btn"
                        disabled={loading}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                    >
                        {loading && <Loader2 size={18} className="spinner" />}
                        {loading ? 'Connexion...' : 'Se connecter'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;
