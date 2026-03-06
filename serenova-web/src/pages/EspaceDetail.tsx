import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../context/AuthContext';
import { LayoutGrid, Maximize, Home, Layers, DollarSign, Calendar, ChevronLeft, Edit, Trash2, Loader2, AlertCircle, CheckCircle, Info } from 'lucide-react';
import './SiteDetail.css';

interface Bail {
    id: string;
    locataire: { nom: string; prenom?: string };
    dateEntree: string;
    dateFin?: string;
    statut: string;
    loyerMensuel?: number;
}

interface EspaceData {
    id: string;
    identifiant: string;
    type: string;
    surface: number;
    etage?: number;
    statut: string;
    siteId: string;
    site: { nom: string };
    loyer?: {
        montantBase: number;
        charges: number;
        cautionNombreMois: number;
        devise: string;
    };
    baux: Bail[];
    _count?: {
        baux: number;
    };
}

const EspaceDetail = () => {
    const { siteId, id } = useParams<{ siteId: string; id: string }>();
    const navigate = useNavigate();
    const [espace, setEspace] = useState<EspaceData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchEspace = async () => {
            try {
                const response = await api.get(`/espaces/${id}`);
                setEspace(response.data.data);
            } catch (err: any) {
                console.error('Error fetching espace detail:', err);
                setError('Impossible de charger les détails de l\'espace.');
            } finally {
                setLoading(false);
            }
        };

        fetchEspace();
    }, [id]);

    const handleDelete = async () => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet espace ?')) return;
        try {
            await api.delete(`/espaces/${id}`);
            navigate(`/sites/${siteId}`);
        } catch (err: any) {
            alert(err.response?.data?.message || 'Erreur lors de la suppression.');
        }
    };

    if (loading) return <div className="loading-container"><Loader2 className="spinner" size={48} /></div>;
    if (error || !espace) return (
        <div className="error-state glass-panel" style={{ textAlign: 'center', padding: '3rem' }}>
            <AlertCircle size={48} color="var(--color-error)" />
            <p>{error || 'Espace introuvable.'}</p>
            <Link to={`/sites/${siteId}`} className="primary-btn" style={{ marginTop: '1rem', display: 'inline-block' }}>Retour</Link>
        </div>
    );

    const activeBail = espace.baux?.find(b => b.statut === 'ACTIF');

    return (
        <div className="site-detail-page">
            <Link to={`/sites/${siteId}`} className="back-link">
                <ChevronLeft size={18} /> Retour au site
            </Link>

            <div className="detail-header glass-panel">
                <div className="header-info">
                    <div className="site-icon-large">
                        <LayoutGrid size={32} />
                    </div>
                    <div>
                        <h1>{espace.identifiant}</h1>
                        <div className="info-meta">
                            <span className="type-tag">{espace.type}</span>
                            <span className={`status-badge ${espace.statut.toLowerCase()}`}>{espace.statut}</span>
                        </div>
                    </div>
                </div>
                <div className="header-actions">
                    <button
                        onClick={handleDelete}
                        className="secondary-btn"
                        style={{
                            color: 'var(--color-error)',
                            borderColor: 'var(--color-error)',
                            opacity: (espace._count?.baux || 0) > 0 ? 0.5 : 1,
                            cursor: (espace._count?.baux || 0) > 0 ? 'not-allowed' : 'pointer'
                        }}
                        disabled={(espace._count?.baux || 0) > 0}
                        title={(espace._count?.baux || 0) > 0 ? "Impossible de supprimer un espace avec historique de baux" : ""}
                    >
                        <Trash2 size={18} /> Supprimer
                    </button>
                    <Link to={`/sites/${siteId}/espaces/edit/${espace.id}`} className="primary-btn" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Edit size={18} /> Modifier
                    </Link>
                </div>
            </div>

            <div className="detail-content" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
                <div className="main-section">
                    <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Info size={20} color="var(--primary-color)" /> Caractéristiques du Bien
                        </h3>
                        <div className="specs-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                            <div className="spec-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ background: 'rgba(var(--primary-rgb), 0.1)', padding: '0.75rem', borderRadius: '8px' }}>
                                    <Maximize size={20} color="var(--primary-color)" />
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Surface</div>
                                    <div style={{ fontWeight: '700' }}>{espace.surface} m²</div>
                                </div>
                            </div>
                            <div className="spec-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ background: 'rgba(var(--primary-rgb), 0.1)', padding: '0.75rem', borderRadius: '8px' }}>
                                    <Layers size={20} color="var(--primary-color)" />
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Étage</div>
                                    <div style={{ fontWeight: '700' }}>{espace.etage || 'RDC'}</div>
                                </div>
                            </div>
                            <div className="spec-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ background: 'rgba(var(--primary-rgb), 0.1)', padding: '0.75rem', borderRadius: '8px' }}>
                                    <Home size={20} color="var(--primary-color)" />
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Type</div>
                                    <div style={{ fontWeight: '700' }}>{espace.type}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="glass-panel" style={{ padding: '1.5rem' }}>
                        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <DollarSign size={20} color="var(--primary-color)" /> Configuration Financière (Défaut)
                        </h3>
                        <div className="finance-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                            <div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Loyer de Base</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--primary-color)' }}>
                                    {espace.loyer?.montantBase.toLocaleString()} {espace.loyer?.devise}
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Charges</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: '700' }}>
                                    {espace.loyer?.charges.toLocaleString()} {espace.loyer?.devise}
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Mois de Caution</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: '700' }}>
                                    {espace.loyer?.cautionNombreMois} mois
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="side-section">
                    <div className="glass-panel" style={{ padding: '1.5rem' }}>
                        <h3 style={{ marginBottom: '1.5rem' }}>État d'Occupation</h3>
                        {activeBail ? (
                            <div className="occupant-card">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: '#10b981' }}>
                                    <CheckCircle size={20} />
                                    <span style={{ fontWeight: '600' }}>Occupé par :</span>
                                </div>
                                <div style={{ padding: '1rem', background: 'rgba(var(--primary-rgb), 0.05)', borderRadius: '8px', marginBottom: '1rem' }}>
                                    <div style={{ fontWeight: '700', fontSize: '1.1rem' }}>{activeBail.locataire.prenom} {activeBail.locataire.nom}</div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                        Entré le {new Date(activeBail.dateEntree).toLocaleDateString()}
                                    </div>
                                </div>
                                <Link to={`/baux/${activeBail.id}`} className="table-action" style={{ display: 'block', textAlign: 'center' }}>Gérer le bail en cours</Link>
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                                <div style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>Cet espace est actuellement libre.</div>
                                <Link to="/baux/new" className="primary-btn" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Calendar size={18} /> Louer cet espace
                                </Link>
                            </div>
                        )}

                    </div>
                </div>

                <div className="full-width" style={{ gridColumn: '1 / span 2', marginTop: '1rem' }}>
                    <div className="section-title">
                        <h2>Historique des Baux</h2>
                    </div>
                    <div className="glass-panel" style={{ padding: '0' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Locataire</th>
                                    <th>Période</th>
                                    <th>Loyer</th>
                                    <th>Statut</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {espace.baux && espace.baux.length > 0 ? (
                                    espace.baux.map(bail => (
                                        <tr key={bail.id}>
                                            <td className="font-600">
                                                {bail.locataire.prenom} {bail.locataire.nom}
                                            </td>
                                            <td>
                                                <div>Du {new Date(bail.dateEntree).toLocaleDateString()}</div>
                                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                    au {bail.dateFin ? new Date(bail.dateFin).toLocaleDateString() : 'Indéterminée'}
                                                </div>
                                            </td>
                                            <td className="font-600">
                                                {(bail.loyerMensuel || espace.loyer?.montantBase || 0).toLocaleString()} {espace.loyer?.devise}
                                            </td>
                                            <td>
                                                <span className={`status-badge ${bail.statut.toLowerCase()}`}>{bail.statut}</span>
                                            </td>
                                            <td>
                                                <Link to={`/baux/${bail.id}`} className="table-action">Détails</Link>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                            Aucun historique de bail pour cet espace.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EspaceDetail;
