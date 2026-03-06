import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../context/AuthContext';
import {
    FileText, Plus, Search, Calendar, User, Building2, Loader2,
    AlertTriangle, Clock, CheckCircle, X, ChevronRight
} from 'lucide-react';
import './Baux.css';

interface Alerte {
    type: string;
    message: string;
    dateEcheance?: string;
}

interface Bail {
    id: string;
    numBail?: string;
    dateEntree?: string;
    dateFin?: string;
    statut?: string;
    loyerMensuel?: number;
    locataire?: { nom?: string; prenom?: string };
    espace?: {
        identifiant?: string;
        site?: { nom?: string };
        loyer?: { montantBase: number; devise: string };
    };
    alertes?: Alerte[];
    _count?: { alertes: number };
}

const STATUT_PILLS = [
    { value: '', label: 'Tous', color: '' },
    { value: 'ACTIF', label: 'Actifs', color: 'var(--color-success)' },
    { value: 'RESILIÉ', label: 'Résiliés', color: 'var(--color-error)' },
    { value: 'EXPIRE', label: 'Expirés', color: 'var(--color-warning)' },
];

const hasImpayes = (b: Bail) => (b.alertes || []).some(a => a.type === 'IMPAYE');
const hasExpirant = (b: Bail) => (b.alertes || []).some(a => a.type === 'BAIL_EXPIRANT');

const formatDate = (d?: string) => {
    if (!d) return 'Indéterminée';
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
};

// Returns 'danger' | 'warning' | '' class for a row
const rowAlertClass = (b: Bail) => {
    if (hasImpayes(b)) return 'row-danger';
    if (hasExpirant(b)) return 'row-warning';
    return '';
};

const Baux = () => {
    const [baux, setBaux] = useState<Bail[]>([]);
    const [loading, setLoading] = useState(true);
    const [statut, setStatut] = useState('');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    const fetchBaux = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (statut) params.set('statut', statut);
            if (search) params.set('search', search);
            params.set('page', String(page));
            params.set('limit', '20');

            const response = await api.get(`/baux?${params}`);
            setBaux(response.data.data.baux || []);
            setTotalPages(response.data.data.meta?.totalPages || 1);
            setTotal(response.data.data.meta?.total || 0);
        } catch (err) {
            console.error('Error fetching baux:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { setPage(1); }, [statut, search]);
    useEffect(() => { fetchBaux(); }, [statut, search, page]);

    // Comptes d'alertes (visible dans la barre d'alerte)
    const nbImpayes = baux.filter(hasImpayes).length;
    const nbExpirants = baux.filter(hasExpirant).length;
    const nbEnAlerte = baux.filter(b => hasImpayes(b) || hasExpirant(b)).length;

    return (
        <div className="baux-page">
            {/* ── Header ── */}
            <div className="page-header">
                <div>
                    <h1>Baux & Contrats</h1>
                    <p className="subtitle">
                        Suivi des baux actifs, expirés et résiliés.
                        {!loading && <span style={{ color: 'var(--text-muted)', marginLeft: '0.5rem' }}>({total} bail{total !== 1 ? 's' : ''})</span>}
                    </p>
                </div>
                <Link to="/baux/new" className="primary-btn" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
                    <Plus size={20} /> Nouveau Bail
                </Link>
            </div>

            {/* ── Bannière d'alertes ── */}
            {!loading && nbEnAlerte > 0 && (
                <div className="alert-banner">
                    {nbImpayes > 0 && (
                        <div
                            className={`alert-pill alert-danger ${statut === '' && search === '' ? 'clickable' : ''}`}
                            onClick={() => { setSearch(''); setStatut('ACTIF'); }}
                        >
                            <AlertTriangle size={16} />
                            <strong>{nbImpayes}</strong> bail{nbImpayes > 1 ? 's' : ''} avec loyer impayé
                        </div>
                    )}
                    {nbExpirants > 0 && (
                        <div className="alert-pill alert-warning">
                            <Clock size={16} />
                            <strong>{nbExpirants}</strong> bail{nbExpirants > 1 ? 's' : ''} expirant bientôt
                        </div>
                    )}
                </div>
            )}

            {/* ── Filtres ── */}
            <div className="filters-bar glass-panel">
                <div className="search-box" style={{ flex: 2 }}>
                    <Search size={18} color="var(--text-muted)" />
                    <input
                        type="text"
                        placeholder="Rechercher par locataire, n° bail, espace, résidence..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                    {search && (
                        <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                            <X size={16} color="var(--text-muted)" />
                        </button>
                    )}
                </div>

                {/* Pills statut */}
                <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                    {STATUT_PILLS.map(p => (
                        <button
                            key={p.value}
                            className={`statut-pill ${statut === p.value ? 'active' : ''}`}
                            style={{ '--pill-color': p.color || 'var(--color-secondary)' } as any}
                            onClick={() => setStatut(p.value)}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Table ── */}
            {loading ? (
                <div className="loading-container"><Loader2 className="spinner" size={40} /></div>
            ) : (
                <div className="baux-list glass-panel" style={{ padding: 0 }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Référence / Locataire</th>
                                <th>Bien / Résidence</th>
                                <th>Dates</th>
                                <th>Loyer mensuel</th>
                                <th>Statut</th>
                                <th>Alertes</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {baux.map((bail) => (
                                <tr key={bail.id} className={rowAlertClass(bail)}>
                                    <td>
                                        <div className="font-600">{bail.numBail || '—'}</div>
                                        <div className="info-item" style={{ marginTop: '0.25rem', fontSize: '0.85rem' }}>
                                            <User size={13} /> {bail.locataire?.prenom || ''} {bail.locataire?.nom || '—'}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="font-600">{bail.espace?.identifiant || '—'}</div>
                                        <div className="info-item" style={{ marginTop: '0.25rem', fontSize: '0.85rem' }}>
                                            <Building2 size={13} /> {bail.espace?.site?.nom || '—'}
                                        </div>
                                    </td>
                                    <td style={{ whiteSpace: 'nowrap' }}>
                                        <div className="info-item"><Calendar size={13} /> {formatDate(bail.dateEntree)}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                                            → {formatDate(bail.dateFin)}
                                        </div>
                                    </td>
                                    <td className="font-600" style={{ color: 'var(--color-secondary)', whiteSpace: 'nowrap' }}>
                                        {bail.loyerMensuel
                                            ? Number(bail.loyerMensuel).toLocaleString() + ' FCFA'
                                            : (bail.espace?.loyer?.montantBase || 0) > 0
                                                ? Number(bail.espace?.loyer?.montantBase).toLocaleString() + ' ' + (bail.espace?.loyer?.devise || 'FCFA')
                                                : '—'
                                        }
                                    </td>
                                    <td>
                                        <span className={`status-badge ${(bail.statut || 'actif').toLowerCase().replace('é', 'e').replace('é', 'e')}`}>
                                            {bail.statut || 'ACTIF'}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                            {hasImpayes(bail) && (
                                                <span className="alert-tag alert-tag-danger">
                                                    <AlertTriangle size={12} /> Impayé
                                                </span>
                                            )}
                                            {hasExpirant(bail) && (
                                                <span className="alert-tag alert-tag-warning">
                                                    <Clock size={12} /> Expire bientôt
                                                </span>
                                            )}
                                            {!hasImpayes(bail) && !hasExpirant(bail) && (
                                                <span style={{ color: 'var(--color-success)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                    <CheckCircle size={13} /> OK
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <Link
                                            to={`/baux/${bail.id}`}
                                            className="table-action"
                                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', textDecoration: 'none' }}
                                        >
                                            Gérer <ChevronRight size={14} />
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            {baux.length === 0 && (
                                <tr>
                                    <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                        Aucun bail trouvé.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ── Pagination ── */}
            {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', paddingTop: '0.5rem' }}>
                    <button className="secondary-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Précédent</button>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Page {page} / {totalPages}</span>
                    <button className="secondary-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Suivant →</button>
                </div>
            )}
        </div>
    );
};

export default Baux;
