import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Building2, Users, FileText, CreditCard, Wallet, LayoutGrid, Settings, LogOut, Shield, ShieldCheck, Tag, Megaphone, Activity } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import QuotaWidget from './QuotaWidget';

const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Tableau de bord' },
    { path: '/sites', icon: Building2, label: 'Sites & Espaces', roles: ['ADMIN', 'GESTIONNAIRE', 'CONCIERGE', 'LECTEUR'] },
    { path: '/parc', icon: LayoutGrid, label: 'Parc Immobilier', roles: ['ADMIN', 'GESTIONNAIRE', 'CONCIERGE', 'LECTEUR'] },
    { path: '/locataires', icon: Users, label: 'Locataires', roles: ['ADMIN', 'GESTIONNAIRE', 'CONCIERGE'] },
    { path: '/baux', icon: FileText, label: 'Baux', roles: ['ADMIN', 'GESTIONNAIRE'] },
    { path: '/paiements', icon: CreditCard, label: 'Paiements', roles: ['ADMIN', 'GESTIONNAIRE'] },
    { path: '/tresorerie', icon: Wallet, label: 'Trésorerie', roles: ['ADMIN', 'GESTIONNAIRE'] },
    { path: '/utilisateurs', icon: Users, label: 'Utilisateurs', roles: ['ADMIN'] },
    { path: '/mon-abonnement', icon: ShieldCheck, label: 'Mon Abonnement', roles: ['ADMIN'] },
    { path: '/organisations', icon: LayoutGrid, label: 'Clients', roles: ['SUPER_ADMIN'] },
    { path: '/plans', icon: Tag, label: 'Plans & Tarifs', roles: ['SUPER_ADMIN'] },
    { path: '/abonnements', icon: CreditCard, label: 'Abonnements', roles: ['SUPER_ADMIN'] },
    { path: '/passerelles-paiement', icon: Settings, label: 'Passerelles de Paiement', roles: ['SUPER_ADMIN'] },
    { path: '/annonces', icon: Megaphone, label: 'Annonces Globales', roles: ['SUPER_ADMIN'] },
    { path: '/audit', icon: Activity, label: "Logs d'Audit", roles: ['SUPER_ADMIN'] },
    { path: '/staff', icon: Shield, label: 'Équipe Plateforme', roles: ['SUPER_ADMIN'] },
];

const Sidebar = () => {
    const { logout, user, impersonatedOrg } = useAuth();
    const navigate = useNavigate();
    const isSupervising = !!impersonatedOrg;

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="brand">
                    <div className="brand-icon">
                        <Building2 size={28} />
                    </div>
                    <span className="text-gradient">SÉRÉNOVA</span>
                </div>
            </div>

            <nav className="sidebar-nav">
                {navItems
                    .filter(item => {
                        // Toujours ok si pas de rôles requis
                        if (!item.roles) return true;

                        // En mode supervision, on cache l'accès aux organisations (on y revient via le bandeau)
                        if (isSupervising) {
                            if (item.path === '/organisations') return false;
                            return true; // On autorise tous les menus clients pour le super admin
                        }

                        // Sinon on check les rôles classiques
                        return user && item.roles.includes(user.role);
                    })
                    .map((item) => {
                        const Icon = item.icon;
                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                                end={item.path === '/'}
                            >
                                <Icon size={20} />
                                <span>{item.label}</span>
                            </NavLink>
                        );
                    })}
            </nav>

            {!isSupervising && user?.role !== 'SUPER_ADMIN' && <QuotaWidget />}

            <div className="sidebar-footer">
                {user && (
                    <div style={{ padding: '0 0.5rem 0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-light)', marginBottom: '0.5rem' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{user.firstName} {user.lastName}</div>
                        <div>{user.email}</div>
                    </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <button className="nav-item" style={{ width: '100%', textAlign: 'left' }} onClick={() => navigate('/parametres')}>
                        <Settings size={20} />
                        <span>Paramètres</span>
                    </button>
                    <button
                        className="nav-item"
                        style={{ width: '100%', textAlign: 'left', color: 'var(--color-error)' }}
                        onClick={logout}
                    >
                        <LogOut size={20} />
                        <span>Déconnexion</span>
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
