import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../context/AuthContext';
import { User, Mail, Phone, MapPin, Briefcase, Calendar, ChevronLeft, Edit, Trash2, Loader2, AlertCircle, FileText } from 'lucide-react';
import './SiteDetail.css'; // Reusing some site detail styles

interface Bail {
    id: string;
    numBail?: string;
    dateEntree: string;
    dateFin?: string;
    statut: string;
    espace: {
        identifiant: string;
        site: { nom: string };
    };
}

interface LocataireData {
    id: string;
    civilite: string;
    nom: string;
    prenom?: string;
    email?: string;
    telephone: string;
    telephoneSecondaire?: string;
    raisonSociale?: string;
    employeur?: string;
    revenus?: number;
    baux: Bail[];
    _count?: {
        baux: number;
    };
}

const LocataireDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [locataire, setLocataire] = useState<LocataireData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchLocataire = async () => {
            try {
                const response = await api.get(`/locataires/${id}`);
                setLocataire(response.data.data);
            } catch (err: any) {
                console.error('Error fetching locataire detail:', err);
                setError('Impossible de charger les détails du locataire.');
            } finally {
                setLoading(false);
            }
        };

        fetchLocataire();
    }, [id]);

    const handleDelete = async () => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce locataire ? Cette action est irréversible.')) return;

        try {
            await api.delete(`/locataires/${id}`);
            navigate('/locataires');
        } catch (err: any) {
            alert(err.response?.data?.message || 'Erreur lors de la suppression.');
        }
    };

    if (loading) return <div className="loading-container"><Loader2 className="spinner" size={48} /></div>;
    if (error || !locataire) return (
        <div className="error-state glass-panel" style={{ textAlign: 'center', padding: '3rem' }}>
            <AlertCircle size={48} color="var(--color-error)" />
            <p>{error || 'Locataire introuvable.'}</p>
            <Link to="/locataires" className="primary-btn" style={{ marginTop: '1rem', display: 'inline-block' }}>Retour</Link>
        </div>
    );

    return (
        <div className="site-detail-page">
            <Link to="/locataires" className="back-link">
                <ChevronLeft size={18} /> Retour aux locataires
            </Link>

            <div className="detail-header glass-panel">
                <div className="header-info">
                    <div className="site-icon-large">
                        <User size={32} />
                    </div>
                    <div>
                        <h1>{locataire.prenom} {locataire.nom}</h1>
                        <div className="info-meta">
                            <span className="type-tag">{locataire.civilite}</span>
                            {locataire.raisonSociale && <span className="type-tag">{locataire.raisonSociale}</span>}
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
                            opacity: (locataire._count?.baux || 0) > 0 ? 0.5 : 1,
                            cursor: (locataire._count?.baux || 0) > 0 ? 'not-allowed' : 'pointer'
                        }}
                        disabled={(locataire._count?.baux || 0) > 0}
                        title={(locataire._count?.baux || 0) > 0 ? "Impossible de supprimer un locataire avec historique de baux" : ""}
                    >
                        <Trash2 size={18} /> Supprimer
                    </button>
                    <Link to={`/locataires/edit/${locataire.id}`} className="primary-btn" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Edit size={18} /> Modifier
                    </Link>
                </div>
            </div>

            <div className="detail-content" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
                <div className="side-info">
                    <div className="glass-panel" style={{ padding: '1.5rem' }}>
                        <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Informations de Contact</h3>
                        <div className="contact-info" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div className="info-item" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <Mail size={18} color="var(--primary-color)" />
                                <span>{locataire.email || 'Non renseigné'}</span>
                            </div>
                            <div className="info-item" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <Phone size={18} color="var(--primary-color)" />
                                <span>{locataire.telephone}</span>
                            </div>
                            {locataire.telephoneSecondaire && (
                                <div className="info-item" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <Phone size={18} color="var(--text-muted)" />
                                    <span>{locataire.telephoneSecondaire}</span>
                                </div>
                            )}
                        </div>

                        <h3 style={{ marginTop: '2rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Profil Professionnel</h3>
                        <div className="profile-info" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div className="info-item" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <Briefcase size={18} color="var(--primary-color)" />
                                <span>{locataire.employeur || 'Employeur non précisé'}</span>
                            </div>
                            {locataire.revenus && (
                                <div className="info-item" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <span style={{ fontWeight: '600', color: 'var(--primary-color)' }}>XOF</span>
                                    <span>Revenus: {locataire.revenus.toLocaleString()} / mois</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="main-info">
                    <div className="section-title">
                        <h2>Historique des Baux</h2>
                    </div>
                    <div className="glass-panel" style={{ padding: '0' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Bien</th>
                                    <th>Site</th>
                                    <th>Début</th>
                                    <th>Fin</th>
                                    <th>Statut</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {locataire.baux && locataire.baux.length > 0 ? (
                                    locataire.baux.map(bail => (
                                        <tr key={bail.id}>
                                            <td className="font-600">{bail.espace.identifiant}</td>
                                            <td>{bail.espace.site.nom}</td>
                                            <td>{new Date(bail.dateEntree).toLocaleDateString()}</td>
                                            <td>{bail.dateFin ? new Date(bail.dateFin).toLocaleDateString() : 'Indéterminée'}</td>
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
                                        <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                            Aucun bail trouvé pour ce locataire.
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

export default LocataireDetail;
