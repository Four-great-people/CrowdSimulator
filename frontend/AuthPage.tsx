import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './styles/App.css';
import { loginUser, registerUser, isAuthenticated } from './src/services/api';

const AuthPage: React.FC = () => {
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (isAuthenticated()) {
            navigate('/maps', { replace: true });
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!username.trim() || !password.trim()) {
            setError('Введите логин и пароль');
            return;
        }

        setIsSubmitting(true);
        try {
            if (mode === 'login') {
                await loginUser(username.trim(), password);
            } else {
                await registerUser(username.trim(), password);
            }

            const state = location.state as { from?: string } | null;
            const target = state?.from || '/maps';
            navigate(target, { replace: true });
        } catch (err: any) {
            console.error(err);
            setError(err?.message || 'Ошибка авторизации');
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleMode = () => {
        setMode(prev => (prev === 'login' ? 'register' : 'login'));
        setError(null);
    };

    return (
        <div className="App auth-page">
            <div className="auth-container">
                <h1>{mode === 'login' ? 'Вход' : 'Регистрация'}</h1>
                <form onSubmit={handleSubmit} className="auth-form">
                    <label className="auth-label">
                        Логин
                        <input
                            type="text"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            autoComplete="username"
                            maxLength={50}
                        />
                    </label>
                    <label className="auth-label">
                        Пароль
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                            maxLength={128}
                        />
                    </label>
                    {error && <div className="auth-error">{error}</div>}
                    <button type="submit" disabled={isSubmitting} className="blue-button">
                        {isSubmitting
                            ? 'Отправка...'
                            : mode === 'login'
                            ? 'Войти'
                            : 'Зарегистрироваться'}
                    </button>
                </form>
                <button type="button" className="text-button" onClick={toggleMode}>
                    {mode === 'login'
                        ? 'Нет аккаунта? Зарегистрироваться'
                        : 'Уже есть аккаунт? Войти'}
                </button>
            </div>
        </div>
    );
};

export default AuthPage;


