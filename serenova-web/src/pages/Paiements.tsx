import { useEffect, useState } from 'react';
import { api } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Loader2, X, ChevronRight } from 'lucide-react';
import './Paiements.css';

interface Paiement {
    id: string;
    montant: number;
    datePaiement: string;
    typePaiement: string;
    moisConcerne?: string;
    modePaiement: string;
    reference?: string;
    statut: string;
    bail: {
        id: string;
        numBail: string;
        locataire: { nom: string; prenom: string; civilite?: string; id: string };
        espace: { identifiant: string; site: { nom: string } };
    };
}

const TYPE_LABELS: Record<string, string> = {
    LOYER: 'Loyer', CAUTION: 'Caution', AVANCE: 'Avance', FRAIS_ENTREE: "Frais d'entrée",
};
const MODE_ICONS: Record<string, string> = {
    ESPECES: '💵', MOBILE_MONEY: '📱', VIREMENT: '🏦', CHEQUE: '📝',
};

const TYPE_PILLS = ['', 'LOYER', 'CAUTION', 'AVANCE'];
const TYPE_LABELS_SHORT: Record<string, string> = { '': 'Tous', LOYER: 'Loyers', CAUTION: 'Cautions', AVANCE: 'Avances' };

const Paiements = () => {
    const navigate = useNavigate();
    const [paiements, setPaiements] = useState<Paiement[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterMode, setFilterMode] = useState('');
    const [filterMois, setFilterMois] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    const fetchPaiements = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filterMois) params.set('mois', filterMois);
            params.set('page', String(page));
            params.set('limit', '20');
            const response = await api.get(`/paiements?${params}`);
            setPaiements(response.data.data.paiements || []);
            setTotalPages(response.data.data.meta?.totalPages || 1);
            setTotal(response.data.data.meta?.total || 0);
        } catch (err) {
            console.error('Error fetching paiements:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { setPage(1); }, [filterMois, filterType, filterMode, search]);
    useEffect(() => { fetchPaiements(); }, [filterMois, page]);

    const formatDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

    // Filtres locaux (search, type, mode) — instantanés sans roundtrip
    const filtered = paiements.filter(p => {
        const matchSearch = !search ||
            `${p.bail.locataire.prenom} ${p.bail.locataire.nom}`.toLowerCase().includes(search.toLowerCase()) ||
            (p.bail.numBail || '').toLowerCase().includes(search.toLowerCase()) ||
            p.bail.espace.identifiant.toLowerCase().includes(search.toLowerCase()) ||
            (p.reference || '').toLowerCase().includes(search.toLowerCase());
        const matchType = !filterType || p.typePaiement === filterType;
        const matchMode = !filterMode || p.modePaiement === filterMode;
        return matchSearch && matchType && matchMode;
    });

    const hasFilters = search || filterType || filterMode || filterMois;

    return (
        <div className="paiements-page">
            {/* ── Header ── */}
            <div className="page-header">
                <div>
                    <h1>Paiements</h1>
                    <p className="subtitle">
                        Journal des encaissements et suivi des loyers.
                        {!loading && <span style={{ color: 'var(--text-muted)', marginLeft: '0.5rem' }}>({total} paiement{total !== 1 ? 's' : ''})</span>}
                    </p>
                </div>
            </div>

            {/* ── Filtres ── */}
            <div className="filters-bar glass-panel" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
                {/* Recherche */}
                <div className="search-box" style={{ flex: '2 1 200px' }}>
                    <Search size={18} color="var(--text-muted)" />
                    <input
                        type="text"
                        placeholder="Locataire, espace, réf..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                    {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={16} /></button>}
                </div>

                {/* Mois (filtre backend) */}
                <input
                    type="month"
                    className="filter-select"
                    value={filterMois}
                    onChange={e => setFilterMois(e.target.value)}
                    title="Filtrer par mois"
                />

                {/* Mode de paiement */}
                <select className="filter-select" value={filterMode} onChange={e => setFilterMode(e.target.value)}>
                    <option value="">Tous les modes</option>
                    <option value="ESPECES">💵 Espèces</option>
                    <option value="MOBILE_MONEY">📱 Mobile Money</option>
                    <option value="VIREMENT">🏦 Virement</option>
                    <option value="CHEQUE">📝 Chèque</option>
                </select>

                {hasFilters && (
                    <button className="secondary-btn" onClick={() => { setSearch(''); setFilterType(''); setFilterMode(''); setFilterMois(''); }}>
                        <X size={16} /> Effacer
                    </button>
                )}
            </div>

            {/* Pills type */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {TYPE_PILLS.map(t => (
                    <button
                        key={t}
                        className={`statut-pill ${filterType === t ? 'active' : ''}`}
                        onClick={() => setFilterType(t)}
                    >
                        {TYPE_LABELS_SHORT[t] || t}
                    </button>
                ))}
            </div>

            {/* ── Table ── */}
            {loading ? (
                <div className="loading-container"><Loader2 className="spinner" size={40} /></div>
            ) : (
                <div className="paiements-list glass-panel" style={{ padding: 0 }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Locataire / Bien</th>
                                <th>Type</th>
                                <th>Mode</th>
                                <th>Montant</th>
                                <th>Statut</th>
                                <th>Détails</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((p) => (
                                <tr key={p.id} onClick={() => navigate(`/paiements/${p.id}`)} style={{ cursor: 'pointer' }}>
                                    <td style={{ whiteSpace: 'nowrap' }}>{formatDate(p.datePaiement)}</td>
                                    <td>
                                        <div className="font-600">{p.bail.locataire.prenom} {p.bail.locataire.nom}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                            {p.bail.espace.identifiant} · {p.bail.espace.site.nom}
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`type-badge type-${p.typePaiement.toLowerCase()}`}>
                                            {TYPE_LABELS[p.typePaiement] || p.typePaiement}
                                        </span>
                                        {p.moisConcerne && (
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                                                {new Date(p.moisConcerne).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                                            </div>
                                        )}
                                    </td>
                                    <td>{MODE_ICONS[p.modePaiement] || '💳'} {p.modePaiement.replace('_', ' ')}</td>
                                    <td className="font-600" style={{ color: p.statut === 'ANNULE' ? 'var(--color-error)' : 'var(--color-success)', whiteSpace: 'nowrap' }}>
                                        {p.statut === 'ANNULE' ? '-' : '+'}{Number(p.montant).toLocaleString()} FCFA
                                    </td>
                                    <td>
                                        <span className={`status-badge ${p.statut === 'VALIDE' ? 'actif' : 'resilie'}`}>
                                            {p.statut}
                                        </span>
                                    </td>
                                    <td onClick={e => e.stopPropagation()}>
                                        <Link
                                            to={`/paiements/${p.id}`}
                                            className="table-action"
                                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', textDecoration: 'none' }}
                                        >
                                            Voir <ChevronRight size={14} />
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                        Aucun paiement trouvé.
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

export default Paiements;
