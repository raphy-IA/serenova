import { useEffect, useState } from 'react';
import { api } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, AlertTriangle, CreditCard, BarChart2, ArrowUpRight, ArrowDownRight, Loader2, Search, Filter, X } from 'lucide-react';
import './Tresorerie.css';

interface VentilationMois {
    mois: number;
    label: string;
    total: number;
    loyers: number;
    cautions: number;
    avances: number;
}

interface StatsData {
    annee: number;
    kpis: {
        totalEncaisse: number;
        nombreTransactions: number;
        totalAnnule: number;
        nombreAnnules: number;
        montantImpayes: number;
        nombreImpayes: number;
    };
    ventilationMensuelle: VentilationMois[];
    parMode: Record<string, number>;
}

interface Paiement {
    id: string;
    montant: number;
    datePaiement: string;
    typePaiement: string;
    modePaiement: string;
    statut: string;
    reference?: string;
    bail: {
        id: string;
        locataire: { nom: string; prenom: string };
        espace: { identifiant: string; site: { nom: string } };
    };
}

const TYPE_LABELS: Record<string, string> = {
    LOYER: 'Loyer',
    CAUTION: 'Caution',
    AVANCE: 'Avance',
    FRAIS_ENTREE: "Frais d'entrée",
};

const MODE_ICONS: Record<string, string> = {
    ESPECES: '💵',
    MOBILE_MONEY: '📱',
    VIREMENT: '🏦',
    CHEQUE: '📝',
};

const Tresorerie = () => {
    const currentYear = new Date().getFullYear();
    const [annee, setAnnee] = useState(currentYear);
    const [stats, setStats] = useState<StatsData | null>(null);
    const [paiements, setPaiements] = useState<Paiement[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterMode, setFilterMode] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchStats = async () => {
        try {
            const res = await api.get(`/paiements/stats?annee=${annee}`);
            setStats(res.data.data);
        } catch (err) {
            console.error('Error fetching tresorerie stats:', err);
        }
    };

    const fetchPaiements = async () => {
        try {
            const res = await api.get(`/paiements?page=${page}&limit=20`);
            setPaiements(res.data.data.paiements || []);
            setTotalPages(res.data.data.meta?.totalPages || 1);
        } catch (err) {
            console.error('Error fetching paiements:', err);
        }
    };

    useEffect(() => {
        setLoading(true);
        Promise.all([fetchStats(), fetchPaiements()]).finally(() => setLoading(false));
    }, [annee, page]);

    // Max valeur pour normaliser les barres
    const maxMois = stats ? Math.max(...stats.ventilationMensuelle.map(m => m.total), 1) : 1;

    // Filtre local sur la liste
    const filteredPaiements = paiements.filter(p => {
        const matchSearch = !search ||
            `${p.bail.locataire.prenom} ${p.bail.locataire.nom}`.toLowerCase().includes(search.toLowerCase()) ||
            p.bail.espace.identifiant.toLowerCase().includes(search.toLowerCase()) ||
            (p.reference || '').toLowerCase().includes(search.toLowerCase());
        const matchType = !filterType || p.typePaiement === filterType;
        const matchMode = !filterMode || p.modePaiement === filterMode;
        return matchSearch && matchType && matchMode;
    });

    const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

    return (
        <div className="tresorerie-page">
            {/* ── En-tête ── */}
            <div className="page-header">
                <div>
                    <h1>Trésorerie</h1>
                    <p className="subtitle">Vue globale des encaissements, transactions et soldes financiers.</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <select
                        className="year-selector"
                        value={annee}
                        onChange={e => { setAnnee(parseInt(e.target.value)); setPage(1); }}
                    >
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
            </div>

            {loading && !stats ? (
                <div className="loading-container"><Loader2 className="spinner" size={48} /></div>
            ) : stats && (
                <>
                    {/* ── KPI Cards ── */}
                    <div className="kpi-grid">
                        <div className="kpi-card kpi-success glass-panel">
                            <div className="kpi-icon"><TrendingUp size={28} /></div>
                            <div className="kpi-content">
                                <div className="kpi-label">Total Encaissé</div>
                                <div className="kpi-value">{stats.kpis.totalEncaisse.toLocaleString()} <span>FCFA</span></div>
                                <div className="kpi-sub">{stats.kpis.nombreTransactions} transaction{stats.kpis.nombreTransactions !== 1 ? 's' : ''}</div>
                            </div>
                            <ArrowUpRight size={20} className="kpi-trend-icon trend-up" />
                        </div>

                        <div className="kpi-card kpi-danger glass-panel">
                            <div className="kpi-icon"><AlertTriangle size={28} /></div>
                            <div className="kpi-content">
                                <div className="kpi-label">Loyers Impayés</div>
                                <div className="kpi-value">{stats.kpis.montantImpayes.toLocaleString()} <span>FCFA</span></div>
                                <div className="kpi-sub">{stats.kpis.nombreImpayes} bail{stats.kpis.nombreImpayes !== 1 ? 's' : ''} en retard</div>
                            </div>
                            <ArrowDownRight size={20} className="kpi-trend-icon trend-down" />
                        </div>

                        <div className="kpi-card kpi-warning glass-panel">
                            <div className="kpi-icon"><TrendingDown size={28} /></div>
                            <div className="kpi-content">
                                <div className="kpi-label">Paiements Annulés</div>
                                <div className="kpi-value">{stats.kpis.totalAnnule.toLocaleString()} <span>FCFA</span></div>
                                <div className="kpi-sub">{stats.kpis.nombreAnnules} annulation{stats.kpis.nombreAnnules !== 1 ? 's' : ''}</div>
                            </div>
                        </div>

                        <div className="kpi-card kpi-neutral glass-panel">
                            <div className="kpi-icon"><CreditCard size={28} /></div>
                            <div className="kpi-content">
                                <div className="kpi-label">Taux de recouvrement</div>
                                <div className="kpi-value">
                                    {stats.kpis.totalEncaisse + stats.kpis.montantImpayes > 0
                                        ? Math.round((stats.kpis.totalEncaisse / (stats.kpis.totalEncaisse + stats.kpis.montantImpayes)) * 100)
                                        : 100}
                                    <span>%</span>
                                </div>
                                <div className="kpi-sub">encaissé vs dû total</div>
                            </div>
                        </div>
                    </div>

                    {/* ── Charts Row ── */}
                    <div className="charts-row">
                        {/* Graphique mensuel */}
                        <div className="chart-card glass-panel">
                            <div className="chart-header">
                                <BarChart2 size={20} />
                                <h3>Encaissements Mensuels — {annee}</h3>
                            </div>
                            <div className="bar-chart">
                                {stats.ventilationMensuelle.map(m => (
                                    <div key={m.mois} className="bar-col">
                                        <div className="bar-wrapper">
                                            <div
                                                className="bar-fill"
                                                style={{ height: `${Math.max(4, (m.total / maxMois) * 100)}%` }}
                                                title={`${m.label}: ${m.total.toLocaleString()} FCFA`}
                                            >
                                                <div className="bar-tooltip">
                                                    <strong>{m.total.toLocaleString()} FCFA</strong>
                                                    {m.loyers > 0 && <div>Loyers: {m.loyers.toLocaleString()}</div>}
                                                    {m.cautions > 0 && <div>Cautions: {m.cautions.toLocaleString()}</div>}
                                                    {m.avances > 0 && <div>Avances: {m.avances.toLocaleString()}</div>}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bar-label">{m.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Ventilation par mode */}
                        <div className="chart-card glass-panel" style={{ flex: '0 0 280px' }}>
                            <div className="chart-header">
                                <h3>Par Mode de Paiement</h3>
                            </div>
                            <div className="mode-list">
                                {Object.entries(stats.parMode).length === 0 ? (
                                    <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0', fontSize: '0.9rem' }}>
                                        Aucune donnée
                                    </div>
                                ) : (
                                    Object.entries(stats.parMode)
                                        .sort(([, a], [, b]) => b - a)
                                        .map(([mode, montant]) => {
                                            const total = Object.values(stats.parMode).reduce((s, v) => s + v, 0);
                                            const pct = total > 0 ? Math.round((montant / total) * 100) : 0;
                                            return (
                                                <div key={mode} className="mode-item">
                                                    <div className="mode-label">
                                                        <span>{MODE_ICONS[mode] || '💳'} {mode.replace('_', ' ')}</span>
                                                        <span className="mode-pct">{pct}%</span>
                                                    </div>
                                                    <div className="mode-bar-bg">
                                                        <div className="mode-bar-fill" style={{ width: `${pct}%` }} />
                                                    </div>
                                                    <div className="mode-amount">{montant.toLocaleString()} FCFA</div>
                                                </div>
                                            );
                                        })
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* ── Table des transactions ── */}
            <div className="transactions-section">
                <div className="section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2>Toutes les Transactions</h2>
                </div>

                <div className="filters-bar glass-panel">
                    <div className="search-box">
                        <Search size={18} color="var(--text-muted)" />
                        <input
                            type="text"
                            placeholder="Locataire, espace, référence..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                        {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={16} /></button>}
                    </div>
                    <select className="filter-select" value={filterType} onChange={e => setFilterType(e.target.value)}>
                        <option value="">Tous les types</option>
                        <option value="LOYER">Loyer</option>
                        <option value="CAUTION">Caution</option>
                        <option value="AVANCE">Avance</option>
                        <option value="FRAIS_ENTREE">Frais d'entrée</option>
                    </select>
                    <select className="filter-select" value={filterMode} onChange={e => setFilterMode(e.target.value)}>
                        <option value="">Tous les modes</option>
                        <option value="ESPECES">Espèces</option>
                        <option value="MOBILE_MONEY">Mobile Money</option>
                        <option value="VIREMENT">Virement</option>
                        <option value="CHEQUE">Chèque</option>
                    </select>
                    {(filterType || filterMode) && (
                        <button className="secondary-btn" onClick={() => { setFilterType(''); setFilterMode(''); }}>
                            <Filter size={16} /> Effacer filtres
                        </button>
                    )}
                </div>

                <div className="glass-panel" style={{ padding: 0 }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Locataire</th>
                                <th>Bien / Site</th>
                                <th>Type</th>
                                <th>Mode</th>
                                <th>Montant</th>
                                <th>Statut</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '3rem' }}><Loader2 className="spinner" size={32} /></td></tr>
                            ) : filteredPaiements.length === 0 ? (
                                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Aucune transaction trouvée.</td></tr>
                            ) : filteredPaiements.map(p => (
                                <tr key={p.id}>
                                    <td style={{ whiteSpace: 'nowrap' }}>
                                        {new Date(p.datePaiement).toLocaleDateString('fr-FR')}
                                    </td>
                                    <td className="font-600">
                                        {p.bail.locataire.prenom} {p.bail.locataire.nom}
                                    </td>
                                    <td>
                                        <div>{p.bail.espace.identifiant}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.bail.espace.site.nom}</div>
                                    </td>
                                    <td>
                                        <span className={`type-badge type-${p.typePaiement.toLowerCase()}`}>
                                            {TYPE_LABELS[p.typePaiement] || p.typePaiement}
                                        </span>
                                    </td>
                                    <td>{MODE_ICONS[p.modePaiement] || '💳'} {p.modePaiement.replace('_', ' ')}</td>
                                    <td className="font-600" style={{ color: p.statut === 'ANNULE' ? 'var(--color-error)' : 'var(--color-success)' }}>
                                        {p.statut === 'ANNULE' ? '-' : '+'}{Number(p.montant).toLocaleString()} FCFA
                                    </td>
                                    <td>
                                        <span className={`status-badge ${p.statut === 'VALIDE' ? 'actif' : p.statut === 'ANNULE' ? 'resilie' : 'pending'}`}>
                                            {p.statut}
                                        </span>
                                    </td>
                                    <td>
                                        <Link to={`/paiements/${p.id}`} className="table-action">Détails</Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="pagination">
                        <button className="secondary-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                            ← Précédent
                        </button>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                            Page {page} / {totalPages}
                        </span>
                        <button className="secondary-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                            Suivant →
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Tresorerie;
