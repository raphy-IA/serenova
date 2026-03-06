import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../context/AuthContext';
import { Building2, MapPin, Layers, LayoutGrid, ChevronLeft, Plus, Loader2, AlertCircle } from 'lucide-react';
import './SiteDetail.css';

interface Espace {
    id: string;
    identifiant?: string;
    type?: string;
    surface?: number;
    loyer?: {
        montantBase: number;
        devise: string;
    };
    statut?: string;
}

interface SiteDetailData {
    id: string;
    nom: string;
    type: string;
    adresse: string;
    ville: string;
    description?: string;
    espaces: Espace[];
}

const SiteDetail = () => {
    const { id } = useParams<{ id: string }>();
    const [site, setSite] = useState<SiteDetailData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSiteDetail = async () => {
            try {
                const response = await api.get(`/sites/${id}`);
                setSite(response.data.data);
            } catch (err: any) {
                console.error('Error fetching site detail:', err);
                setError('Impossible de charger les détails du site.');
            } finally {
                setLoading(false);
            }
        };

        fetchSiteDetail();
    }, [id]);

    if (loading) {
        return (
            <div className="loading-state" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '1rem' }}>
                <Loader2 className="spinner" size={48} />
                <p>Chargement du site...</p>
            </div>
        );
    }

    if (error || !site) {
        return (
            <div className="error-state glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-error)' }}>
                <AlertCircle size={48} style={{ marginBottom: '1rem' }} />
                <h3>Erreur</h3>
                <p>{error || 'Site introuvable.'}</p>
                <Link to="/sites" className="primary-btn" style={{ marginTop: '1rem', display: 'inline-block' }}>Retour aux sites</Link>
            </div>
        );
    }

    const espaces = site.espaces || [];

    return (
        <div className="site-detail-page">
            <Link to="/sites" className="back-link">
                <ChevronLeft size={18} /> Retour aux sites
            </Link>

            <div className="detail-header glass-panel">
                <div className="header-info">
                    <div className="site-icon-large">
                        <Building2 size={32} />
                    </div>
                    <div>
                        <h1>{site.nom}</h1>
                        <div className="info-meta">
                            <span className="type-tag">{site.type}</span>
                            <div className="location">
                                <MapPin size={16} />
                                <span>{site.ville}, {site.adresse}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="header-actions">
                    <button className="secondary-btn">Modifier</button>
                    <Link to={`/sites/${site.id}/espaces/new`} className="primary-btn" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Plus size={18} /> Nouvel Espace
                    </Link>
                </div>
            </div>

            <div className="detail-content">
                <div className="stats-mini-grid">
                    <div className="glass-panel stat-card">
                        <Layers size={20} />
                        <div>
                            <span className="label">Total Espaces</span>
                            <span className="value">{espaces.length}</span>
                        </div>
                    </div>
                    <div className="glass-panel stat-card">
                        <LayoutGrid size={20} />
                        <div>
                            <span className="label">Espaces Libres</span>
                            <span className="value">
                                {espaces.filter(e => (e.statut || '').toUpperCase() === 'LIBRE').length}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="section-title">
                    <h2>Espaces de ce site</h2>
                </div>

                <div className="glass-panel table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Identifiant</th>
                                <th>Type</th>
                                <th>Surface</th>
                                <th>Loyer Base</th>
                                <th>Statut</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {espaces.map((espace) => (
                                <tr key={espace.id}>
                                    <td className="font-600">{espace.identifiant || 'N/A'}</td>
                                    <td>{(espace.type || 'Inconnu').toLowerCase()}</td>
                                    <td>{espace.surface || 0} m²</td>
                                    <td className="font-600 text-secondary">
                                        {(espace.loyer?.montantBase || 0).toLocaleString()} {espace.loyer?.devise || 'FCFA'}
                                    </td>
                                    <td>
                                        <span className={`status-badge ${(espace.statut || 'LIBRE').toLowerCase()}`}>
                                            {espace.statut || 'LIBRE'}
                                        </span>
                                    </td>
                                    <td>
                                        <Link to={`/sites/${site.id}/espaces/${espace.id}`} className="table-action" style={{ textDecoration: 'none' }}>Gérer</Link>
                                    </td>
                                </tr>
                            ))}
                            {espaces.length === 0 && (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                        Aucun espace enregistré pour ce site.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SiteDetail;
