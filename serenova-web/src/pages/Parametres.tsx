import React, { useEffect, useState } from 'react';
import { api } from '../context/AuthContext';
import { useAuth } from '../context/AuthContext';
import {
    User, Lock, Bell, Palette, Save, Loader2, CheckCircle,
    AlertTriangle, Eye, EyeOff, Phone, Mail, Shield, Moon, Sun
} from 'lucide-react';
import './Parametres.css';

type Section = 'profil' | 'securite' | 'notifications' | 'apparence';

interface UserProfile { firstName: string; lastName: string; email: string; phone?: string; role?: string; }

const NOTIF_TYPES = [
    { key: 'IMPAYE', label: 'Loyer impayé', desc: "Alerte quand un locataire ne paie pas à l'échéance" },
    { key: 'BAIL_EXPIRANT', label: 'Bail expirant bientôt', desc: 'Alerte avant la fin de contrat (60j, 30j, 7j)' },
    { key: 'ESPACE_VACANT', label: 'Espace vacant prolongé', desc: 'Alerte quand un espace reste libre trop longtemps' },
    { key: 'RENOUVELLEMENT', label: 'Renouvellement automatique', desc: 'Confirmation des renouvellements de bail' },
];

const Parametres = () => {
    const { user: authUser, login, token } = useAuth();
    const [activeSection, setActiveSection] = useState<Section>('profil');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Profil
    const [profil, setProfil] = useState<UserProfile>({ firstName: '', lastName: '', email: '', phone: '' });

    // Sécurité
    const [currentPwd, setCurrentPwd] = useState('');
    const [newPwd, setNewPwd] = useState('');
    const [confirmPwd, setConfirmPwd] = useState('');
    const [showPwd, setShowPwd] = useState(false);

    // Notifications — stockées en localStorage (pas de table dédiée)
    const [notifPrefs, setNotifPrefs] = useState<Record<string, boolean>>(() => {
        try { return JSON.parse(localStorage.getItem('notif_prefs') || '{}'); } catch { return {}; }
    });
    const [gracePeriod, setGracePeriod] = useState(() => parseInt(localStorage.getItem('grace_period') || '5'));

    // Apparence
    const [isDark, setIsDark] = useState(() => document.documentElement.getAttribute('data-theme') === 'dark');
    const [accentColor, setAccentColor] = useState(() => localStorage.getItem('accent_color') || '#2563eb');

    const showToast = (type: 'success' | 'error', message: string) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 3500);
    };

    useEffect(() => {
        const fetchProfil = async () => {
            setLoading(true);
            try {
                const res = await api.get('/users/me');
                const u = res.data.data;
                setProfil({ firstName: u.firstName, lastName: u.lastName, email: u.email, phone: u.phone || '', role: u.role });
            } catch { /* fallback to authUser */ }
            finally { setLoading(false); }
        };
        fetchProfil();
    }, []);

    const saveProfil = async () => {
        setSaving(true);
        try {
            const res = await api.patch('/users/me', { firstName: profil.firstName, lastName: profil.lastName, phone: profil.phone });
            // Update auth context
            if (authUser && token) {
                login({ ...authUser, firstName: res.data.data.firstName, lastName: res.data.data.lastName }, token);
            }
            showToast('success', 'Profil mis à jour avec succès.');
        } catch (err: any) {
            showToast('error', err.response?.data?.message || 'Erreur lors de la mise à jour.');
        } finally { setSaving(false); }
    };

    const savePassword = async () => {
        if (newPwd !== confirmPwd) { showToast('error', 'Les mots de passe ne correspondent pas.'); return; }
        if (newPwd.length < 8) { showToast('error', 'Le mot de passe doit contenir au moins 8 caractères.'); return; }
        setSaving(true);
        try {
            await api.patch('/users/me/password', { currentPassword: currentPwd, newPassword: newPwd });
            setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
            showToast('success', 'Mot de passe modifié avec succès.');
        } catch (err: any) {
            showToast('error', err.response?.data?.message || 'Erreur lors du changement de mot de passe.');
        } finally { setSaving(false); }
    };

    const saveNotifications = () => {
        localStorage.setItem('notif_prefs', JSON.stringify(notifPrefs));
        localStorage.setItem('grace_period', String(gracePeriod));
        showToast('success', 'Préférences de notification enregistrées.');
    };

    const saveApparence = () => {
        localStorage.setItem('accent_color', accentColor);
        document.documentElement.style.setProperty('--color-secondary', accentColor);
        showToast('success', 'Apparence sauvegardée.');
    };

    const toggleTheme = () => {
        const next = !isDark;
        setIsDark(next);
        document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
    };

    const SECTIONS: { key: Section; label: string; icon: React.ReactNode }[] = [
        { key: 'profil', label: 'Profil', icon: <User size={18} /> },
        { key: 'securite', label: 'Sécurité', icon: <Lock size={18} /> },
        { key: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
        { key: 'apparence', label: 'Apparence', icon: <Palette size={18} /> },
    ];

    return (
        <div className="parametres-page">
            {/* Toast */}
            {toast && (
                <div className={`settings-toast ${toast.type}`}>
                    {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
                    {toast.message}
                </div>
            )}

            <div className="page-header">
                <div>
                    <h1>Paramètres</h1>
                    <p className="subtitle">Gérez votre profil, sécurité, et préférences de l'application.</p>
                </div>
            </div>

            <div className="settings-layout">
                {/* ── Sidebar nav ── */}
                <nav className="settings-nav glass-panel">
                    {SECTIONS.map(s => (
                        <button
                            key={s.key}
                            className={`settings-nav-item ${activeSection === s.key ? 'active' : ''}`}
                            onClick={() => setActiveSection(s.key)}
                        >
                            {s.icon} {s.label}
                        </button>
                    ))}
                </nav>

                {/* ── Content ── */}
                <div className="settings-content glass-panel">
                    {loading ? (
                        <div className="loading-container"><Loader2 className="spinner" size={40} /></div>
                    ) : (
                        <>
                            {/* ── Profil ── */}
                            {activeSection === 'profil' && (
                                <div className="settings-section">
                                    <div className="settings-section-header">
                                        <div className="settings-icon-wrap"><User size={22} /></div>
                                        <div>
                                            <h2>Informations personnelles</h2>
                                            <p>Vos coordonnées et informations de contact.</p>
                                        </div>
                                    </div>

                                    {/* Avatar */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '2rem' }}>
                                        <div className="settings-avatar">
                                            {(profil.firstName?.charAt(0) || '') + (profil.lastName?.charAt(0) || '')}
                                        </div>
                                        <div>
                                            <div className="font-600">{profil.firstName} {profil.lastName}</div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{profil.role}</div>
                                        </div>
                                    </div>

                                    <div className="form-grid-2">
                                        <div className="form-field">
                                            <label>Prénom</label>
                                            <div className="input-with-icon">
                                                <User size={16} />
                                                <input value={profil.firstName} onChange={e => setProfil(p => ({ ...p, firstName: e.target.value }))} placeholder="Prénom" />
                                            </div>
                                        </div>
                                        <div className="form-field">
                                            <label>Nom de famille</label>
                                            <div className="input-with-icon">
                                                <User size={16} />
                                                <input value={profil.lastName} onChange={e => setProfil(p => ({ ...p, lastName: e.target.value }))} placeholder="Nom" />
                                            </div>
                                        </div>
                                        <div className="form-field">
                                            <label>Email</label>
                                            <div className="input-with-icon" style={{ opacity: 0.7 }}>
                                                <Mail size={16} />
                                                <input value={profil.email} disabled style={{ cursor: 'not-allowed' }} />
                                            </div>
                                            <span className="field-hint">L'email ne peut pas être modifié.</span>
                                        </div>
                                        <div className="form-field">
                                            <label>Téléphone</label>
                                            <div className="input-with-icon">
                                                <Phone size={16} />
                                                <input value={profil.phone || ''} onChange={e => setProfil(p => ({ ...p, phone: e.target.value }))} placeholder="+229 XX XX XX XX" />
                                            </div>
                                        </div>
                                    </div>

                                    <button className="primary-btn" onClick={saveProfil} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: 'fit-content' }}>
                                        {saving ? <Loader2 size={16} className="spinner" /> : <Save size={16} />} Sauvegarder
                                    </button>
                                </div>
                            )}

                            {/* ── Sécurité ── */}
                            {activeSection === 'securite' && (
                                <div className="settings-section">
                                    <div className="settings-section-header">
                                        <div className="settings-icon-wrap" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--color-error)' }}><Shield size={22} /></div>
                                        <div>
                                            <h2>Sécurité du compte</h2>
                                            <p>Modifiez votre mot de passe pour sécuriser votre accès.</p>
                                        </div>
                                    </div>

                                    <div className="settings-password-form">
                                        <div className="form-field">
                                            <label>Mot de passe actuel</label>
                                            <div className="input-with-icon">
                                                <Lock size={16} />
                                                <input
                                                    type={showPwd ? 'text' : 'password'}
                                                    value={currentPwd}
                                                    onChange={e => setCurrentPwd(e.target.value)}
                                                    placeholder="••••••••"
                                                />
                                                <button type="button" onClick={() => setShowPwd(!showPwd)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="form-field">
                                            <label>Nouveau mot de passe</label>
                                            <div className="input-with-icon">
                                                <Lock size={16} />
                                                <input type={showPwd ? 'text' : 'password'} value={newPwd} onChange={e => setNewPwd(e.target.value)} placeholder="Minimum 8 caractères" />
                                            </div>
                                        </div>
                                        <div className="form-field">
                                            <label>Confirmer le mot de passe</label>
                                            <div className="input-with-icon" style={{ borderColor: confirmPwd && confirmPwd !== newPwd ? 'var(--color-error)' : '' }}>
                                                <Lock size={16} />
                                                <input type={showPwd ? 'text' : 'password'} value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} placeholder="Confirmer le nouveau mot de passe" />
                                            </div>
                                            {confirmPwd && confirmPwd !== newPwd && <span className="field-error">Les mots de passe ne correspondent pas.</span>}
                                        </div>
                                    </div>

                                    {/* Force bar */}
                                    {newPwd && (
                                        <div style={{ marginBottom: '1.5rem' }}>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                                                Force : {newPwd.length < 8 ? '⚠️ Trop court' : newPwd.length < 12 ? '🟡 Moyen' : '🟢 Fort'}
                                            </div>
                                            <div style={{ height: '5px', borderRadius: '3px', background: 'var(--border-light)', overflow: 'hidden' }}>
                                                <div style={{
                                                    height: '100%', borderRadius: '3px', transition: 'all 0.3s',
                                                    width: `${Math.min(100, (newPwd.length / 16) * 100)}%`,
                                                    background: newPwd.length < 8 ? 'var(--color-error)' : newPwd.length < 12 ? 'var(--color-warning)' : 'var(--color-success)',
                                                }} />
                                            </div>
                                        </div>
                                    )}

                                    <button className="primary-btn" onClick={savePassword} disabled={saving || !currentPwd || !newPwd} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: 'fit-content' }}>
                                        {saving ? <Loader2 size={16} className="spinner" /> : <Lock size={16} />} Changer le mot de passe
                                    </button>
                                </div>
                            )}

                            {/* ── Notifications ── */}
                            {activeSection === 'notifications' && (
                                <div className="settings-section">
                                    <div className="settings-section-header">
                                        <div className="settings-icon-wrap" style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--color-warning)' }}><Bell size={22} /></div>
                                        <div>
                                            <h2>Préférences de notification</h2>
                                            <p>Choisissez quand et comment vous êtes alerté.</p>
                                        </div>
                                    </div>

                                    {/* Délai de grâce */}
                                    <div className="settings-card">
                                        <label className="font-600" style={{ display: 'block', marginBottom: '0.5rem' }}>
                                            Délai de grâce avant alerte impayé
                                        </label>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                                            Nombre de jours après l'échéance avant de créer une alerte d'impayé.
                                        </p>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <input
                                                type="range" min={0} max={15} step={1} value={gracePeriod}
                                                onChange={e => setGracePeriod(parseInt(e.target.value))}
                                                style={{ flex: 1 }}
                                            />
                                            <span className="font-600" style={{ minWidth: '60px', textAlign: 'center' }}>
                                                {gracePeriod} jour{gracePeriod !== 1 ? 's' : ''}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Types d'alertes */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                                        {NOTIF_TYPES.map(n => (
                                            <div key={n.key} className="settings-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <div className="font-600" style={{ fontSize: '0.9rem' }}>{n.label}</div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{n.desc}</div>
                                                </div>
                                                <label className="toggle-switch">
                                                    <input
                                                        type="checkbox"
                                                        checked={notifPrefs[n.key] !== false}
                                                        onChange={e => setNotifPrefs(p => ({ ...p, [n.key]: e.target.checked }))}
                                                    />
                                                    <span className="toggle-track" />
                                                </label>
                                            </div>
                                        ))}
                                    </div>

                                    <button className="primary-btn" onClick={saveNotifications} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: 'fit-content' }}>
                                        <Save size={16} /> Enregistrer
                                    </button>
                                </div>
                            )}

                            {/* ── Apparence ── */}
                            {activeSection === 'apparence' && (
                                <div className="settings-section">
                                    <div className="settings-section-header">
                                        <div className="settings-icon-wrap" style={{ background: 'rgba(139,92,246,0.1)', color: 'var(--color-accent)' }}><Palette size={22} /></div>
                                        <div>
                                            <h2>Apparence</h2>
                                            <p>Personnalisez l'interface selon vos préférences.</p>
                                        </div>
                                    </div>

                                    {/* Mode sombre */}
                                    <div className="settings-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            {isDark ? <Moon size={20} /> : <Sun size={20} />}
                                            <div>
                                                <div className="font-600">Mode sombre</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                    Actuellement : {isDark ? 'Activé' : 'Désactivé'}
                                                </div>
                                            </div>
                                        </div>
                                        <label className="toggle-switch">
                                            <input type="checkbox" checked={isDark} onChange={toggleTheme} />
                                            <span className="toggle-track" />
                                        </label>
                                    </div>

                                    {/* Couleur d'accent */}
                                    <div className="settings-card" style={{ marginBottom: '1.5rem' }}>
                                        <label className="font-600" style={{ display: 'block', marginBottom: '0.75rem' }}>Couleur principale</label>
                                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                            {['#2563eb', '#7c3aed', '#059669', '#dc2626', '#d97706', '#0891b2'].map(c => (
                                                <button
                                                    key={c}
                                                    onClick={() => setAccentColor(c)}
                                                    style={{
                                                        width: '36px', height: '36px', borderRadius: '50%', background: c,
                                                        border: accentColor === c ? '3px solid var(--text-primary)' : '3px solid transparent',
                                                        cursor: 'pointer', boxShadow: accentColor === c ? '0 0 0 2px var(--bg-base)' : 'none',
                                                        transition: 'all 0.15s'
                                                    }}
                                                />
                                            ))}
                                            <input type="color" value={accentColor} onChange={e => setAccentColor(e.target.value)} style={{ width: '36px', height: '36px', borderRadius: '50%', border: 'none', cursor: 'pointer' }} title="Couleur personnalisée" />
                                        </div>
                                    </div>

                                    <button className="primary-btn" onClick={saveApparence} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: 'fit-content' }}>
                                        <Save size={16} /> Appliquer
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Parametres;
