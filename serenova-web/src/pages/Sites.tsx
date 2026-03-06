import { useEffect, useState } from 'react';
import { api } from '../context/AuthContext';
import { Building2, Plus, Search, ChevronRight, Loader2, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import './Sites.css';

interface Site {
    id: string;
    nom: string;
    type: string;
    adresse: string;
    ville: string;
    nbEspaces: number;
    statut: string;
    _count: { espaces: number };
}

const Sites = () => {
    const [sites, setSites] = useState<Site[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchSites = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/sites?page=${page}&limit=9&search=${searchTerm}`);
            setSites(response.data.data.sites);
            setTotalPages(response.data.data.meta.totalPages);
        } catch (err) {
            console.error('Error fetching sites:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSites();
    }, [page, searchTerm]);

    return (
        <div className="sites-page">
            <div className="page-header">
                <div>
                    <h1>Mes Sites</h1>
                    <p className="subtitle">Gérez vos propriétés immobilières et leurs espaces.</p>
                </div>
                <Link to="/sites/new" className="primary-btn" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
                    <Plus size={20} /> Nouveau Site
                </Link>
            </div>

            <div className="filters-bar glass-panel">
                <div className="search-box">
                    <Search size={18} color="var(--text-muted)" />
                    <input
                        type="text"
                        placeholder="Rechercher un site..."
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                    />
                </div>
                <div className="filter-options">
                    <select className="filter-select">
                        <option value="">Tous les types</option>
                        <option value="RESIDENTIEL">Résidentiel</option>
                        <option value="COMMERCIAL">Commercial</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="loading-container">
                    <Loader2 className="spinner" size={40} />
                </div>
            ) : (
                <div className="sites-grid">
                    {sites.map((site) => (
                        <Link to={`/sites/${site.id}`} key={site.id} className="site-card glass-panel">
                            <div className="site-card-header">
                                <div className="site-icon">
                                    <Building2 size={24} />
                                </div>
                                <span className={`status-badge ${site.statut.toLowerCase()}`}>
                                    {site.statut}
                                </span>
                            </div>
                            <div className="site-card-body">
                                <h3>{site.nom}</h3>
                                <div className="site-info-row">
                                    <MapPin size={16} />
                                    <span>{site.ville}, {site.adresse}</span>
                                </div>
                                <div className="site-stats-row">
                                    <div>
                                        <span className="stat-label">Espaces</span>
                                        <span className="stat-value">{site._count.espaces} / {site.nbEspaces}</span>
                                    </div>
                                    <div className="type-label">{site.type}</div>
                                </div>
                            </div>
                            <div className="site-card-footer">
                                <span>Voir les détails</span>
                                <ChevronRight size={18} />
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {!loading && sites.length === 0 && (
                <div className="empty-state glass-panel">
                    <Building2 size={48} />
                    <p>Aucun site trouvé. Commencez par en créer un !</p>
                </div>
            )}

            {totalPages > 1 && (
                <div className="pagination">
                    <button
                        disabled={page === 1}
                        onClick={() => setPage(p => p - 1)}
                        className="page-btn"
                    > Précédent </button>
                    <span className="page-info">Page {page} sur {totalPages}</span>
                    <button
                        disabled={page === totalPages}
                        onClick={() => setPage(p => p + 1)}
                        className="page-btn"
                    > Suivant </button>
                </div>
            )}
        </div>
    );
};

export default Sites;
