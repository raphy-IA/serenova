import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Link, useNavigate } from 'react-router-dom';
import { api, useAuth } from '../context/AuthContext';
import { Loader2, AlertCircle, Building2, Users, FileText, TrendingUp, BellRing, ArrowRight, CheckCircle, CreditCard, Tag } from 'lucide-react';
import './Dashboard.css';

interface DashboardKpis {
    patrimoine: {
        totalSites: number;
        totalEspaces: number;
        tauxOccupation: number;
        espacesLibres: number;
    };
    baux: {
        bauxActifs: number;
        alertesEnAttente: number;
        impayes: number;
        montantTotalImpayes: number;
        dernieresAlertes: Array<{
            id: string;
            type: string;
            message: string;
            montant: number | null;
            locataire: string;
            espace: string;
            bailId: string;
            createdAt: string;
        }>;
    };
    finances: {
        revenusMois: number;
        loyerTheoriqueMois: number;
        tauxRecouvrement: number;
    };
}

interface PlatformKpis {
    systeme: {
        totalOrganisations: number;
        totalSites: number;
        totalEspaces: number;
        totalUsers: number;
        revenusCumules: number;
        loyerTotalTheorique: number;
        tauxRecouvrement: number;
        tauxOccupation: number;
    };
    saas: {
        mrr: number;
        activeSubscriptions: number;
    };
    repartition: Record<string, number>;
    dernieresOrganisations: Array<{
        id: string;
        nom: string;
        type: 'SOCIETE' | 'INDIVIDU';
        users: number;
        sites: number;
        createdAt: string;
    }>;
}


interface EvolutionData {
    mois: string;
    loyers: number;
    cautions: number;
    impayes: number;
}

const Dashboard = () => {
    const navigate = useNavigate();
    const { user, impersonatedOrg } = useAuth();
    const [stats, setStats] = useState<DashboardKpis | null>(null);
    const [platformStats, setPlatformStats] = useState<PlatformKpis | null>(null);
    const [evolution, setEvolution] = useState<EvolutionData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const isSuperAdmin = user?.role === 'SUPER_ADMIN';
    const isSupervising = isSuperAdmin && !!impersonatedOrg;


    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // En mode supervision ou rôle standard, on charge les KPIs d'organisation
                if (isSupervising || !isSuperAdmin) {
                    const [kpiRes, evoRes] = await Promise.all([
                        api.get('/dashboard/global'),
                        api.get('/dashboard/evolution?mois=6')
                    ]);
                    setStats(kpiRes.data.data);
                    setEvolution(evoRes.data.data);
                    setPlatformStats(null); // Reset pour éviter les conflits
                }
                // Mode Super Admin pur (Vision Plateforme)
                else if (isSuperAdmin) {
                    const [platRes, evoRes] = await Promise.all([
                        api.get('/dashboard/plateforme'),
                        api.get('/dashboard/evolution?mois=6')
                    ]);
                    setPlatformStats(platRes.data.data);
                    setEvolution(evoRes.data.data);
                    setStats(null);
                }
            } catch (err: any) {
                console.error('Error fetching dashboard data:', err);
                const message = err.response?.status === 401
                    ? 'Votre session a expiré. Veuillez vous reconnecter.'
                    : 'Impossible de charger les statistiques.';
                setError(message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [isSuperAdmin, isSupervising]);

    if (loading) {
        return (
            <div className="loading-state" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '1rem', color: 'var(--text-muted)' }}>
                <Loader2 className="spinner" size={48} />
                <p>Chargement du tableau de bord...</p>
            </div>
        );
    }

    const hasData = isSupervising ? !!stats : (isSuperAdmin ? !!platformStats : !!stats);

    if (error || !hasData) {
        return (
            <div className="error-state glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-error)' }}>
                <AlertCircle size={48} style={{ marginBottom: '1rem' }} />
                <h3>Erreur</h3>
                <p>{error || 'Données du tableau de bord indisponibles.'}</p>
                <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => window.location.reload()}>Réessayer</button>
            </div>
        );
    }

    return (
        <div className="dashboard-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">
                        {isSupervising ? `Supervision : ${impersonatedOrg.nom}` : (isSuperAdmin ? 'Console Plateforme' : 'Tableau de bord')}
                    </h1>
                    <p className="subtitle">
                        {isSupervising
                            ? `Vue administrateur de l'organisation ${impersonatedOrg.nom}`
                            : (isSuperAdmin
                                ? 'Vision globale et stratégique de l\'écosystème Serenova'
                                : 'Résumé de votre patrimoine immobilier et de vos finances')}
                    </p>
                </div>
            </div>

            {/* Grille de KPIs (Commune aux deux, données différentes) */}
            <div className="kpi-grid">
                {(!isSupervising && isSuperAdmin) ? (
                    <>
                        <div className="kpi-card glass-panel highlight-success">
                            <div className="kpi-icon-header">
                                <TrendingUp size={24} color="var(--color-success)" />
                                <span className="kpi-badge success">SaaS</span>
                            </div>
                            <div className="kpi-main">
                                <div className="kpi-label">MRR (Revenus Récurrents)</div>
                                <div className="kpi-value">
                                    {platformStats?.saas.mrr.toLocaleString()} <span className="currency">FCFA</span>
                                </div>
                            </div>
                            <div className="kpi-footer">
                                <div className="kpi-subtext" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <Tag size={16} /> {platformStats?.saas.activeSubscriptions} abonnements actifs
                                </div>
                            </div>
                        </div>

                        <div className="kpi-card glass-panel highlight-primary">
                            <div className="kpi-icon-header">
                                <Building2 size={24} color="var(--color-primary)" />
                            </div>
                            <div className="kpi-main">
                                <div className="kpi-label">Organisations Actives</div>
                                <div className="kpi-value">{platformStats?.systeme.totalOrganisations}</div>
                            </div>
                            <div className="kpi-footer">
                                <div className="kpi-subtext">Sur {platformStats?.systeme.totalUsers} utilisateurs</div>
                            </div>
                        </div>

                        <div className="kpi-card glass-panel highlight-warning">
                            <div className="kpi-icon-header">
                                <CreditCard size={24} color="var(--color-warning)" />
                            </div>
                            <div className="kpi-main">
                                <div className="kpi-label">Volume Financier (Plateforme)</div>
                                <div className="kpi-value">{platformStats?.systeme.revenusCumules.toLocaleString()} <span className="currency">FCFA</span></div>
                            </div>
                            <div className="kpi-footer">
                                <div className="kpi-progress-bar">
                                    <div className="kpi-progress-fill warning" style={{ width: `${platformStats?.systeme.tauxRecouvrement}%` }}></div>
                                </div>
                                <div className="kpi-subtext">Taux de recouvrement: {platformStats?.systeme.tauxRecouvrement}%</div>
                            </div>
                        </div>

                        <div className="kpi-card glass-panel highlight-info">
                            <div className="kpi-icon-header">
                                <CheckCircle size={24} color="var(--color-info)" />
                            </div>
                            <div className="kpi-main">
                                <div className="kpi-label">Occupation Globale</div>
                                <div className="kpi-value">{platformStats?.systeme.tauxOccupation}%</div>
                            </div>
                            <div className="kpi-footer">
                                <div className="kpi-progress-bar">
                                    <div className="kpi-progress-fill info" style={{ width: `${platformStats?.systeme.tauxOccupation}%` }}></div>
                                </div>
                                <div className="kpi-subtext">{platformStats?.systeme.totalEspaces} espaces au total</div>
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="kpi-card glass-panel highlight-success">
                            <div className="kpi-icon-header">
                                <TrendingUp size={24} color="var(--color-success)" />
                                <span className="kpi-badge success">{stats?.finances.tauxRecouvrement}%</span>
                            </div>
                            <div className="kpi-main">
                                <div className="kpi-label">Revenus encaissés (Mois)</div>
                                <div className="kpi-value">
                                    {stats?.finances.revenusMois.toLocaleString()} <span className="currency">FCFA</span>
                                </div>
                            </div>
                            <div className="kpi-footer">
                                <div className="kpi-progress-bar">
                                    <div className="kpi-progress-fill" style={{ width: `${Math.min(stats?.finances.tauxRecouvrement || 0, 100)}%` }}></div>
                                </div>
                                <div className="kpi-subtext">Sur {stats?.finances.loyerTheoriqueMois.toLocaleString()} FCFA attendus</div>
                            </div>
                        </div>

                        <div className="kpi-card glass-panel highlight-danger">
                            <div className="kpi-icon-header">
                                <AlertCircle size={24} color="var(--color-error)" />
                            </div>
                            <div className="kpi-main">
                                <div className="kpi-label">Montant des impayés</div>
                                <div className="kpi-value" style={{ color: 'var(--color-error)' }}>
                                    {stats?.baux.montantTotalImpayes.toLocaleString()} <span className="currency">FCFA</span>
                                </div>
                            </div>
                            <div className="kpi-footer">
                                <div className="kpi-subtext">{stats?.baux.impayes} dossiers en retard</div>
                            </div>
                        </div>

                        <div className="kpi-card glass-panel highlight-info">
                            <div className="kpi-icon-header">
                                <CheckCircle size={24} color="var(--color-info)" />
                            </div>
                            <div className="kpi-main">
                                <div className="kpi-label">Occupation</div>
                                <div className="kpi-value">{stats?.patrimoine.tauxOccupation}%</div>
                            </div>
                            <div className="kpi-footer">
                                <div className="kpi-progress-bar">
                                    <div className="kpi-progress-fill info" style={{ width: `${stats?.patrimoine.tauxOccupation}%` }}></div>
                                </div>
                                <div className="kpi-subtext">{(stats?.patrimoine?.totalEspaces || 0) - (stats?.patrimoine?.espacesLibres || 0)} occupés • {stats?.patrimoine?.espacesLibres || 0} libres</div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            <div className="dashboard-content">
                {/* Graphique d'évolution */}
                <div className="glass-panel chart-container">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Flux de Trésorerie</h2>
                        <div className="chart-legend">
                            <span className="legend-item"><span className="dot success"></span> Encaissé</span>
                            {(isSupervising || !isSuperAdmin) && <span className="legend-item"><span className="dot error"></span> Impayés</span>}
                        </div>
                    </div>
                    <div style={{ width: '100%', height: 350, minHeight: 150 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={evolution}>
                                <defs>
                                    <linearGradient id="colorLoyers" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--color-success)" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="var(--color-success)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-light)" />
                                <XAxis
                                    dataKey="mois"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                                    tickFormatter={(val) => {
                                        const [y, m] = val.split('-');
                                        const date = new Date(parseInt(y), parseInt(m) - 1);
                                        return date.toLocaleDateString('fr-FR', { month: 'short' });
                                    }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                                    tickFormatter={(value) => `${value / 1000} k`}
                                    dx={-10}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                        borderRadius: '12px',
                                        border: '1px solid var(--border-light)',
                                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                                    }}
                                    formatter={(value: any) => [`${Number(value).toLocaleString()} FCFA`]}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="loyers"
                                    stroke="var(--color-success)"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorLoyers)"
                                />
                                {(isSupervising || !isSuperAdmin) && (
                                    <Area
                                        type="monotone"
                                        dataKey="impayes"
                                        stroke="var(--color-error)"
                                        strokeWidth={2}
                                        strokeDasharray="4 4"
                                        fill="none"
                                    />
                                )}
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Section latérale différenciée */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {(!isSupervising && isSuperAdmin) ? (
                        <div className="glass-panel" style={{ padding: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Derniers Clients</h2>
                                <Link to="/organisations" className="view-all-link">Voir tout</Link>
                            </div>
                            <div className="org-list">
                                {platformStats?.dernieresOrganisations.map(org => (
                                    <div key={org.id} className="org-item" onClick={() => navigate('/organisations')}>
                                        <div className={`org-type-icon ${org.type.toLowerCase()}`}>
                                            {org.type === 'SOCIETE' ? <Building2 size={18} /> : <Users size={18} />}
                                        </div>
                                        <div className="org-info">
                                            <div className="org-name">{org.nom}</div>
                                            <div className="org-meta">{org.sites} sites • {org.users} users</div>
                                        </div>
                                        <ArrowRight size={16} className="alert-arrow" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="glass-panel alerts-container" style={{ minHeight: 'auto' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, fontSize: '1.1rem' }}>
                                    <BellRing size={20} color="var(--color-warning)" /> Alertes ({stats?.baux.alertesEnAttente})
                                </h2>
                                <Link to="/baux" className="view-all-link">Voir tout</Link>
                            </div>
                            {stats?.baux.dernieresAlertes.length ? (
                                <div className="org-list">
                                    {stats.baux.dernieresAlertes.map(alerte => (
                                        <div key={alerte.id} className="org-item" onClick={() => navigate(`/baux/${alerte.bailId}`)}>
                                            <div className="org-type-icon" style={{ backgroundColor: alerte.type === 'IMPAYE' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)', color: alerte.type === 'IMPAYE' ? 'var(--color-error)' : 'var(--color-warning)' }}>
                                                <AlertCircle size={18} />
                                            </div>
                                            <div className="org-info">
                                                <div className="org-name">{alerte.locataire}</div>
                                                <div className="org-meta">{alerte.type === 'IMPAYE' ? 'Retard de loyer' : alerte.message}</div>
                                            </div>
                                            <ArrowRight size={16} className="alert-arrow" />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="empty-state" style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)' }}>
                                    <CheckCircle size={32} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                                    <p style={{ fontSize: '0.85rem' }}>Tout est à jour</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
