import { Search, Bell, Moon, Sun, AlertTriangle, Clock, CheckCircle, X, LogOut, Info, Activity } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../context/AuthContext';
import { useState, useEffect, useRef } from 'react';
import SearchOmni from './SearchOmni';

interface Alerte {
    id: string;
    type: string;
    message: string;
    statut: string;
    dateEcheance?: string;
    createdAt?: string;
    bail?: {
        id: string;
        locataire?: { nom: string; prenom?: string };
        espace?: { identifiant: string; site?: { nom: string } };
    };
}

const TYPE_ICON: Record<string, JSX.Element> = {
    IMPAYE: <AlertTriangle size={16} color="var(--color-error)" />,
    BAIL_EXPIRANT: <Clock size={16} color="var(--color-warning)" />,
    INFO: <CheckCircle size={16} color="var(--color-secondary)" />,
};

const TYPE_COLOR: Record<string, string> = {
    IMPAYE: 'var(--color-error)',
    BAIL_EXPIRANT: 'var(--color-warning)',
    INFO: 'var(--color-secondary)',
};

interface Announcement {
    id: string;
    titre: string;
    message: string;
    type: string;
}

const Header = () => {
    const { user, logout, impersonatedOrg, stopImpersonating } = useAuth();
    const [isDark, setIsDark] = useState(false);

    // Notifications state
    const [open, setOpen] = useState(false);
    const [alertes, setAlertes] = useState<Alerte[]>([]);
    const [loading, setLoading] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    // Announcements state
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);

    const toggleTheme = () => {
        const newTheme = !isDark;
        setIsDark(newTheme);
        document.documentElement.setAttribute('data-theme', newTheme ? 'dark' : 'light');
    };

    const fetchAlertes = async () => {
        setLoading(true);
        try {
            const res = await api.get('/alertes?statut=EN_ATTENTE&limit=10');
            setAlertes(res.data.data.alertes || []);
        } catch (err) {
            console.error('Error fetching alertes:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchAnnouncements = async () => {
        try {
            const res = await api.get('/announcements/active');
            setAnnouncements(res.data.data);
        } catch (err) {
            console.error('Error fetching announcements:', err);
        }
    };

    const resoudre = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await api.put(`/alertes/${id}/resoudre`);
            setAlertes(prev => prev.filter(a => a.id !== id));
        } catch (err) {
            console.error('Error resolving alerte:', err);
        }
    };

    const ignorer = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await api.put(`/alertes/${id}/ignorer`);
            setAlertes(prev => prev.filter(a => a.id !== id));
        } catch (err) {
            console.error('Error ignoring alerte:', err);
        }
    };

    // Fetch on open
    useEffect(() => {
        if (open) fetchAlertes();
    }, [open]);

    // Fetch on mount
    useEffect(() => {
        fetchAlertes();
        fetchAnnouncements();
    }, []);

    // Close on outside click
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        if (open) document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [open]);

    const getInitials = (firstName?: string, lastName?: string) => {
        return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
    };

    const getAnnouncementIcon = (type: string) => {
        switch (type) {
            case 'WARNING': return <AlertTriangle size={18} />;
            case 'MAINTENANCE': return <Activity size={18} />;
            case 'SUCCESS': return <CheckCircle size={18} />;
            default: return <Info size={18} />;
        }
    };

    const getAnnouncementColor = (type: string) => {
        switch (type) {
            case 'WARNING': return 'var(--color-warning)';
            case 'MAINTENANCE': return 'var(--color-error)';
            case 'SUCCESS': return 'var(--color-success)';
            default: return 'var(--color-primary)';
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
            {/* Bandeau d'Annonces Globales */}
            {announcements.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                    {announcements.map((a) => (
                        <div key={a.id} style={{
                            backgroundColor: `${getAnnouncementColor(a.type)}15`,
                            color: getAnnouncementColor(a.type),
                            padding: '0.75rem 1.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.75rem',
                            borderBottom: `1px solid ${getAnnouncementColor(a.type)}40`,
                            fontSize: '0.9rem',
                            fontWeight: 500,
                            zIndex: 100
                        }}>
                            {getAnnouncementIcon(a.type)}
                            <span><strong>{a.titre}</strong> - {a.message}</span>
                        </div>
                    ))}
                </div>
            )}

            <header className="app-header">
                {impersonatedOrg && (
                    <div className="supervision-banner">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <AlertTriangle size={18} />
                            <span>MODE SUPERVISION ACTIF :</span>
                            <span className="org-name">{impersonatedOrg.nom}</span>
                        </div>
                        <button className="exit-supervision-btn" onClick={stopImpersonating}>
                            <LogOut size={14} />
                            QUITTER LA VUE CLIENT
                        </button>
                    </div>
                )}
                <SearchOmni />

                <div className="header-actions">
                    <button className="action-btn" title="Changer de thème" onClick={toggleTheme}>
                        {isDark ? <Sun size={20} /> : <Moon size={20} />}
                    </button>

                    {/* ── Notification Bell ── */}
                    <div style={{ position: 'relative' }} ref={panelRef}>
                        <button
                            className="action-btn"
                            title="Notifications"
                            onClick={() => setOpen(!open)}
                            style={{ position: 'relative' }}
                        >
                            <Bell size={20} />
                            {alertes.length > 0 && (
                                <span className="notification-badge" style={{
                                    position: 'absolute',
                                    top: '4px',
                                    right: '4px',
                                    background: 'var(--color-error)',
                                    color: 'white',
                                    borderRadius: '999px',
                                    fontSize: '0.65rem',
                                    fontWeight: 700,
                                    minWidth: '16px',
                                    height: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '0 3px',
                                    lineHeight: 1,
                                }}>
                                    {alertes.length > 9 ? '9+' : alertes.length}
                                </span>
                            )}
                        </button>

                        {/* ── Dropdown Panel ── */}
                        {open && (
                            <div className="notif-panel glass-panel" style={{
                                position: 'absolute',
                                top: 'calc(100% + 10px)',
                                right: 0,
                                width: '360px',
                                maxHeight: '480px',
                                overflowY: 'auto',
                                zIndex: 1000,
                                padding: 0,
                                boxShadow: '0 16px 40px rgba(0,0,0,0.2)',
                            }}>
                                <div style={{ padding: '1rem 1.25rem 0.75rem', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
                                        Notifications
                                        {alertes.length > 0 && (
                                            <span style={{ marginLeft: '0.5rem', background: 'var(--color-error)', color: 'white', borderRadius: '999px', fontSize: '0.7rem', padding: '0.1rem 0.45rem', fontWeight: 700 }}>
                                                {alertes.length}
                                            </span>
                                        )}
                                    </h3>
                                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setOpen(false)}>
                                        <X size={18} />
                                    </button>
                                </div>

                                {loading ? (
                                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                        Chargement...
                                    </div>
                                ) : alertes.length === 0 ? (
                                    <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                        <CheckCircle size={36} style={{ marginBottom: '0.75rem', opacity: 0.5 }} />
                                        <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>Tout est en ordre ✓</div>
                                        <div style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>Aucune alerte en attente.</div>
                                    </div>
                                ) : (
                                    <div>
                                        {alertes.map(a => (
                                            <div key={a.id} className="notif-item" style={{
                                                padding: '0.9rem 1.25rem',
                                                borderBottom: '1px solid var(--border-light)',
                                                borderLeft: `3px solid ${TYPE_COLOR[a.type] || 'var(--border-light)'}`,
                                                display: 'flex',
                                                gap: '0.75rem',
                                            }}>
                                                <div style={{ flexShrink: 0, marginTop: '2px' }}>
                                                    {TYPE_ICON[a.type] || <AlertTriangle size={16} />}
                                                </div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                                                        {a.type.replace('_', ' ')}
                                                    </div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4, wordBreak: 'break-word' }}>
                                                        {a.message}
                                                    </div>
                                                    {a.dateEcheance && (
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                                                            📅 {new Date(a.dateEcheance).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                        </div>
                                                    )}
                                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                                        <button
                                                            onClick={e => resoudre(a.id, e)}
                                                            style={{ fontSize: '0.72rem', padding: '0.2rem 0.6rem', borderRadius: '4px', border: '1px solid var(--color-success)', background: 'var(--color-success-bg)', color: 'var(--color-success)', cursor: 'pointer', fontWeight: 600 }}
                                                        >
                                                            ✓ Résoudre
                                                        </button>
                                                        <button
                                                            onClick={e => ignorer(a.id, e)}
                                                            style={{ fontSize: '0.72rem', padding: '0.2rem 0.6rem', borderRadius: '4px', border: '1px solid var(--border-light)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}
                                                        >
                                                            Ignorer
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="user-profile">
                        <div className="avatar">{getInitials(user?.firstName, user?.lastName)}</div>
                        <div className="user-info">
                            <span className="user-name">{user?.firstName} {user?.lastName}</span>
                            <span className="user-role">{user?.role}</span>
                        </div>
                        <button onClick={logout} className="action-btn" style={{ marginLeft: '1rem' }} title="Déconnexion">
                            <LogOut size={18} color="var(--color-error)" />
                        </button>
                    </div>
                </div>
            </header>
        </div>
    );
};


export default Header;
