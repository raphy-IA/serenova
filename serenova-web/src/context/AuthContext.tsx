import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    organisationId?: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    impersonatedOrg: { id: string, nom: string } | null;
    login: (userData: User, token: string) => void;
    logout: () => void;
    impersonate: (orgId: string, orgNom: string) => void;
    stopImpersonating: () => void;
    isAuthenticated: boolean;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Configure generic axios instance
export const api = axios.create({
    baseURL: `http://${window.location.hostname}:3000/api`,
});

// Axios interceptor for setting the token and impersonation headers
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('serenova_token');
    const impOrg = localStorage.getItem('serenova_impersonated_org');

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    if (impOrg) {
        const { id } = JSON.parse(impOrg);
        config.headers['X-Organisation-Id'] = id;
    }

    return config;
});

// Axios interceptor for handling errors (session expiration)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            console.error('Session expirée ou non autorisée');
            localStorage.removeItem('serenova_token');
            localStorage.removeItem('serenova_user');
            localStorage.removeItem('serenova_impersonated_org');
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [impersonatedOrg, setImpersonatedOrg] = useState<{ id: string, nom: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        // Check local storage on mount
        const storedToken = localStorage.getItem('serenova_token');
        const storedUser = localStorage.getItem('serenova_user');
        const storedImpOrg = localStorage.getItem('serenova_impersonated_org');

        if (storedToken && storedUser) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
        }

        if (storedImpOrg) {
            setImpersonatedOrg(JSON.parse(storedImpOrg));
        }

        setLoading(false);
    }, []);

    const login = (userData: User, jwtToken: string) => {
        setUser(userData);
        setToken(jwtToken);
        localStorage.setItem('serenova_token', jwtToken);
        localStorage.setItem('serenova_user', JSON.stringify(userData));
        navigate('/');
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        setImpersonatedOrg(null);
        localStorage.removeItem('serenova_token');
        localStorage.removeItem('serenova_user');
        localStorage.removeItem('serenova_impersonated_org');
        navigate('/login');
    };

    const impersonate = (orgId: string, orgNom: string) => {
        const impData = { id: orgId, nom: orgNom };
        setImpersonatedOrg(impData);
        localStorage.setItem('serenova_impersonated_org', JSON.stringify(impData));
        navigate('/'); // Rediriger vers le dashboard pour voir les données de l'organisation
    };

    const stopImpersonating = () => {
        setImpersonatedOrg(null);
        localStorage.removeItem('serenova_impersonated_org');
        navigate('/organisations'); // Retourner à la liste des clients
    };

    return (
        <AuthContext.Provider value={{
            user, token, impersonatedOrg, login, logout,
            impersonate, stopImpersonating,
            isAuthenticated: !!token, loading
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
