import { useEffect, useState } from 'react';
import { api } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { LayoutGrid, Search, X, Loader2, ChevronRight, Home, Building2, Filter } from 'lucide-react';
import './ParcImmobilier.css';

interface Loyer {
    montantBase: number;
    devise: string;
    charges?: number;
    cautionNombreMois?: number;
}

interface Espace {
    id: string;
    identifiant: string;
    label?: string;
    type: string;
    statut: string;
    surface?: number;
    etage?: number;
    site: { id: string; nom: string; ville?: string };
    loyer?: Loyer;
    baux: {
        id: string;
        locataire: { id: string; nom: string; prenom?: string };
    }[];
    _count: { baux: number };
}

interface Site {
    id: string;
    nom: string;
}

const STATUTS = ['LIBRE', 'OCCUPE', 'EN_MAINTENANCE'];
const TYPES = ['APPARTEMENT', 'STUDIO', 'CHAMBRE', 'BUREAU', 'COMMERCE', 'PARKING', 'AUTRE'];

const STATUT_COLORS: Record<string, string> = {
    LIBRE: 'var(--color-success)',
    OCCUPE: 'var(--color-secondary)',
    EN_MAINTENANCE: 'var(--color-warning)',
};

const STATUT_BG: Record<string, string> = {
    LIBRE: 'var(--color-success-bg)',
    OCCUPE: 'rgba(37,99,235,0.1)',
    EN_MAINTENANCE: 'var(--color-warning-bg)',
};

const ParcImmobilier = () => {
    const [espaces, setEspaces] = useState<Espace[]>([]);
    const [sites, setSites] = useState<Site[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    // Filtres
    const [search, setSearch] = useState('');
    const [statut, setStatut] = useState('');
    const [siteId, setSiteId] = useState('');
    const [type, setType] = useState('');
    const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

    const fetchEspaces = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.set('search', search);
            if (statut) params.set('statut', statut);
            if (siteId) params.set('siteId', siteId);
            if (type) params.set('type', type);
            params.set('page', String(page));
            params.set('limit', '30');

            const res = await api.get(`/espaces?${params}`);
            setEspaces(res.data.data.espaces || []);
            setTotalPages(res.data.data.meta?.totalPages || 1);
            setTotal(res.data.data.meta?.total || 0);
        } catch (err) {
            console.error('Error fetching espaces:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchSites = async () => {
        try {
            const res = await api.get('/sites?limit=100');
            setSites(res.data.data.sites || []);
        } catch (err) {
            console.error('Error fetching sites:', err);
        }
    };

    useEffect(() => { fetchSites(); }, []);
    useEffect(() => { setPage(1); }, [search, statut, siteId, type]);
    useEffect(() => { fetchEspaces(); }, [search, statut, siteId, type, page]);

    const resetFilters = () => { setSearch(''); setStatut(''); setSiteId(''); setType(''); };
    const hasFilters = search || statut || siteId || type;

    // Stats calculées localement sur les données courantes
    const statsLoaded = !loading && espaces.length >= 0;

    return (
        <div className="parc-page">
            {/* ── Header ── */}
            <div className="page-header">
                <div>
                    <h1>Parc Immobilier</h1>
                    <p className="subtitle">
                        Vue globale de tous vos espaces — statut, loyer, locataire, et informations clés.
                        {!loading && <span style={{ color: 'var(--text-muted)', marginLeft: '0.5rem' }}>({total} espace{total !== 1 ? 's' : ''})</span>}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                        className={`secondary-btn ${viewMode === 'table' ? 'active-view' : ''}`}
                        onClick={() => setViewMode('table')}
                        title="Vue tableau"
                    >
                        ☰ Tableau
                    </button>
                    <button
                        className={`secondary-btn ${viewMode === 'grid' ? 'active-view' : ''}`}
                        onClick={() => setViewMode('grid')}
                        title="Vue grille"
                    >
                        ⊞ Grille
                    </button>
                </div>
            </div>

            {/* ── Filtres ── */}
            <div className="filters-bar glass-panel">
                <div className="search-box" style={{ flex: 2 }}>
                    <Search size={18} color="var(--text-muted)" />
                    <input
                        type="text"
                        placeholder="Rechercher un espace, résidence, ville..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                    {search && (
                        <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                            <X size={16} color="var(--text-muted)" />
                        </button>
                    )}
                </div>

                <select className="filter-select" value={siteId} onChange={e => setSiteId(e.target.value)}>
                    <option value="">Toutes les résidences</option>
                    {sites.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}
                </select>

                <select className="filter-select" value={statut} onChange={e => setStatut(e.target.value)}>
                    <option value="">Tous les statuts</option>
                    {STATUTS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                </select>

                <select className="filter-select" value={type} onChange={e => setType(e.target.value)}>
                    <option value="">Tous les types</option>
                    {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>

                {hasFilters && (
                    <button className="secondary-btn" onClick={resetFilters}>
                        <Filter size={16} /> Effacer
                    </button>
                )}
            </div>

            {/* ── Stat pills ── */}
            {!loading && (
                <div className="stat-pills">
                    {STATUTS.map(s => {
                        const count = espaces.filter(e => e.statut === s).length;
                        return (
                            <button
                                key={s}
                                className={`stat-pill ${statut === s ? 'active' : ''}`}
                                style={{
                                    '--pill-color': STATUT_COLORS[s],
                                    '--pill-bg': STATUT_BG[s],
                                } as any}
                                onClick={() => setStatut(statut === s ? '' : s)}
                            >
                                <span className="pill-dot" />
                                {s.replace('_', ' ')} — {count}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* ── Content ── */}
            {loading ? (
                <div className="loading-container"><Loader2 className="spinner" size={48} /></div>
            ) : espaces.length === 0 ? (
                <div className="empty-state glass-panel">
                    <LayoutGrid size={48} color="var(--text-muted)" />
                    <p>Aucun espace ne correspond à vos filtres.</p>
                    {hasFilters && <button className="primary-btn" onClick={resetFilters}>Réinitialiser les filtres</button>}
                </div>
            ) : viewMode === 'table' ? (
                /* ── TABLE VIEW ── */
                <div className="glass-panel" style={{ padding: 0 }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Espace</th>
                                <th>Résidence</th>
                                <th>Type</th>
                                <th>Statut</th>
                                <th>Loyer</th>
                                <th>Locataire actuel</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {espaces.map(e => {
                                const bail = e.baux[0];
                                const loyer = e.loyer;
                                return (
                                    <tr key={e.id}>
                                        <td>
                                            <div className="font-600">{e.identifiant}</div>
                                            {e.label && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{e.label}</div>}
                                            {e.surface && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{e.surface} m²{e.etage !== undefined ? ` · Étage ${e.etage}` : ''}</div>}
                                        </td>
                                        <td>
                                            <div className="font-600">{e.site.nom}</div>
                                            {e.site.ville && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{e.site.ville}</div>}
                                        </td>
                                        <td>
                                            <span className="type-tag">{e.type}</span>
                                        </td>
                                        <td>
                                            <span
                                                className="status-badge"
                                                style={{
                                                    background: STATUT_BG[e.statut] || 'var(--bg-subtle)',
                                                    color: STATUT_COLORS[e.statut] || 'var(--text-muted)',
                                                }}
                                            >
                                                {e.statut.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td>
                                            {loyer ? (
                                                <div>
                                                    <div className="font-600">{Number(loyer.montantBase).toLocaleString()} {loyer.devise}</div>
                                                    {loyer.charges ? <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>+{Number(loyer.charges).toLocaleString()} charges</div> : null}
                                                </div>
                                            ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                                        </td>
                                        <td>
                                            {bail ? (
                                                <Link to={`/locataires/${bail.locataire.id}`} style={{ color: 'var(--color-secondary)', fontWeight: 500 }}>
                                                    {bail.locataire.prenom} {bail.locataire.nom}
                                                </Link>
                                            ) : (
                                                <span style={{ color: 'var(--color-success)', fontSize: '0.85rem', fontWeight: 500 }}>Libre</span>
                                            )}
                                        </td>
                                        <td>
                                            <Link
                                                to={`/sites/${e.site.id}/espaces/${e.id}`}
                                                className="table-action"
                                                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                                            >
                                                Voir <ChevronRight size={14} />
                                            </Link>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                /* ── GRID VIEW ── */
                <div className="parc-grid">
                    {espaces.map(e => {
                        const bail = e.baux[0];
                        const loyer = e.loyer;
                        return (
                            <Link to={`/sites/${e.site.id}/espaces/${e.id}`} key={e.id} className="parc-card glass-panel">
                                <div className="parc-card-header">
                                    <div className="parc-card-icon">
                                        {e.statut === 'OCCUPE' ? <Home size={20} /> : <Building2 size={20} />}
                                    </div>
                                    <span
                                        className="status-badge"
                                        style={{
                                            background: STATUT_BG[e.statut] || 'var(--bg-subtle)',
                                            color: STATUT_COLORS[e.statut] || 'var(--text-muted)',
                                            fontSize: '0.75rem',
                                        }}
                                    >
                                        {e.statut.replace('_', ' ')}
                                    </span>
                                </div>
                                <div className="font-600" style={{ fontSize: '1.1rem', margin: '0.75rem 0 0.25rem' }}>{e.identifiant}</div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                                    {e.site.nom}{e.site.ville ? ` · ${e.site.ville}` : ''}
                                </div>
                                {loyer && (
                                    <div style={{ fontWeight: 700, color: 'var(--color-secondary)', marginBottom: '0.5rem' }}>
                                        {Number(loyer.montantBase).toLocaleString()} {loyer.devise}<span style={{ fontWeight: 400, fontSize: '0.8rem', color: 'var(--text-muted)' }}>/mois</span>
                                    </div>
                                )}
                                {bail && (
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                                        👤 {bail.locataire.prenom} {bail.locataire.nom}
                                    </div>
                                )}
                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                                    <span className="type-tag" style={{ fontSize: '0.75rem' }}>{e.type}</span>
                                    {e.surface && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{e.surface} m²</span>}
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}

            {/* ── Pagination ── */}
            {totalPages > 1 && (
                <div className="pagination">
                    <button className="secondary-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Précédent</button>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Page {page} / {totalPages}</span>
                    <button className="secondary-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Suivant →</button>
                </div>
            )}
        </div>
    );
};

export default ParcImmobilier;
