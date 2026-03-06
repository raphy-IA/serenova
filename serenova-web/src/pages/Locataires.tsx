import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../context/AuthContext';
import { Users, Plus, Search, Mail, Phone, Loader2, X, ChevronRight } from 'lucide-react';
import './Locataires.css';

interface Locataire {
    id: string;
    civilite?: string;
    nom?: string;
    prenom?: string;
    email?: string;
    telephone?: string;
    baux?: { statut: string }[];
    _count?: { baux: number };
}

const STATUT_PILLS = [
    { value: '', label: 'Tous', color: '' },
    { value: 'actif', label: 'Avec bail actif', color: 'var(--color-success)' },
    { value: 'termine', label: 'Sans bail actif', color: 'var(--color-warning)' },
];

const Locataires = () => {
    const [locataires, setLocataires] = useState<Locataire[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterStatut, setFilterStatut] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    const fetchLocataires = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.set('search', search);
            params.set('page', String(page));
            params.set('limit', '20');
            const response = await api.get(`/locataires?${params}`);
            setLocataires(response.data.data.locataires || []);
            setTotalPages(response.data.data.meta?.totalPages || 1);
            setTotal(response.data.data.meta?.total || 0);
        } catch (err) {
            console.error('Error fetching locataires:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { setPage(1); }, [search, filterStatut]);
    useEffect(() => { fetchLocataires(); }, [search, page]);

    // Filtre local par statut de bail (actif vs pas)
    const filtered = filterStatut === 'actif'
        ? locataires.filter(l => (l.baux || []).some(b => b.statut === 'ACTIF') || (l._count?.baux || 0) > 0)
        : filterStatut === 'termine'
            ? locataires.filter(l => (l._count?.baux || 0) === 0)
            : locataires;

    const hasFilters = search || filterStatut;

    return (
        <div className="locataires-page">
            {/* ── Header ── */}
            <div className="page-header">
                <div>
                    <h1>Locataires</h1>
                    <p className="subtitle">
                        Gérez les informations de vos locataires et leurs contacts.
                        {!loading && <span style={{ color: 'var(--text-muted)', marginLeft: '0.5rem' }}>({total} locataire{total !== 1 ? 's' : ''})</span>}
                    </p>
                </div>
                <Link to="/locataires/new" className="primary-btn" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
                    <Plus size={20} /> Nouveau Locataire
                </Link>
            </div>

            {/* ── Filtres ── */}
            <div className="filters-bar glass-panel">
                <div className="search-box" style={{ flex: 2 }}>
                    <Search size={18} color="var(--text-muted)" />
                    <input
                        type="text"
                        placeholder="Rechercher par nom, prénom, email, téléphone..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                    {search && (
                        <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                            <X size={16} color="var(--text-muted)" />
                        </button>
                    )}
                </div>

                {/* Pills statut bail */}
                <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                    {STATUT_PILLS.map(p => (
                        <button
                            key={p.value}
                            className={`statut-pill ${filterStatut === p.value ? 'active' : ''}`}
                            style={{ '--pill-color': p.color || 'var(--color-secondary)' } as any}
                            onClick={() => setFilterStatut(p.value)}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>

                {hasFilters && (
                    <button className="secondary-btn" onClick={() => { setSearch(''); setFilterStatut(''); }}>
                        <X size={16} /> Effacer
                    </button>
                )}
            </div>

            {/* ── Table ── */}
            {loading ? (
                <div className="loading-container"><Loader2 className="spinner" size={40} /></div>
            ) : (
                <div className="locataires-list glass-panel" style={{ padding: 0 }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Locataire</th>
                                <th>Contact</th>
                                <th>Téléphone</th>
                                <th>Nb. Baux</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((loc) => (
                                <tr key={loc.id}>
                                    <td>
                                        <div className="user-info-cell">
                                            <div className="avatar-small">
                                                {(loc.prenom?.charAt(0) || '') + (loc.nom?.charAt(0) || '') || '?'}
                                            </div>
                                            <div>
                                                <div className="font-600">
                                                    {loc.civilite ? loc.civilite + ' ' : ''}{loc.prenom || ''} {loc.nom || 'Sans Nom'}
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>#{loc.id?.slice(-6)}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="info-item"><Mail size={14} /> {loc.email || '—'}</div>
                                    </td>
                                    <td>
                                        <div className="info-item"><Phone size={14} /> {loc.telephone || '—'}</div>
                                    </td>
                                    <td>
                                        <span className="font-600" style={{
                                            color: (loc._count?.baux || 0) > 0 ? 'var(--color-success)' : 'var(--text-muted)'
                                        }}>
                                            {loc._count?.baux || 0}
                                        </span>
                                    </td>
                                    <td>
                                        <Link
                                            to={`/locataires/${loc.id}`}
                                            className="table-action"
                                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', textDecoration: 'none' }}
                                        >
                                            Détails <ChevronRight size={14} />
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                        Aucun locataire trouvé.
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

export default Locataires;
