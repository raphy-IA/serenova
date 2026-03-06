import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../context/AuthContext';
import { FileText, ArrowLeft, Loader2, Calendar, FileType, CheckCircle, Home } from 'lucide-react';
import './SiteDetail.css';

interface Paiement {
    id: string;
    montant: number;
    datePaiement: string;
    typePaiement: string;
    moisConcerne?: string;
    modePaiement: string;
    reference?: string;
    notes?: string;
    statut: string;
    bail: {
        id: string;
        numBail: string;
        locataire: { nom: string; prenom: string; id: string };
        espace: { id: string; identifiant: string; site: { id: string; nom: string } }
    };
}

const PaiementDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [paiement, setPaiement] = useState<Paiement | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchPaiement = async () => {
            if (!id) return;
            try {
                const response = await api.get(`/paiements/${id}`);
                setPaiement(response.data.data);
            } catch (err: any) {
                console.error('Error fetching paiement detail:', err);
                setError('Impossible de charger les détails du paiement.');
            } finally {
                setLoading(false);
            }
        };

        fetchPaiement();
    }, [id]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
    };

    if (loading) return (
        <div className="loading-container">
            <Loader2 className="spinner" size={40} />
            <p>Chargement du reçu...</p>
        </div>
    );

    if (error || !paiement) return (
        <div className="error-container">
            <h2>Erreur</h2>
            <p>{error || 'Paiement introuvable'}</p>
            <button onClick={() => navigate('/paiements')} className="primary-btn">Retour aux paiements</button>
        </div>
    );

    return (
        <div className="site-detail-page" style={{ maxWidth: '800px', margin: '0 auto' }}>
            {/* Bouton retour discret */}
            <div style={{ paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-light)', marginBottom: '2rem' }}>
                <button onClick={() => navigate('/paiements')} className="back-btn" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: 0, fontSize: '0.95rem' }}>
                    <ArrowLeft size={18} /> Retour à l'historique
                </button>
            </div>

            {/* Reçu Principal */}
            <div className="glass-panel" style={{ padding: '0', overflow: 'hidden', border: '1px solid var(--border-light)' }}>

                {/* 1. En-tête : Montant, Statut, Réf */}
                <div style={{ backgroundColor: 'whitesmoke', padding: '3rem 2rem', textAlign: 'center', borderBottom: '1px dashed #ccc' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', color: 'var(--color-success)', marginBottom: '0.5rem' }}>
                        <CheckCircle size={28} />
                        <span style={{ fontWeight: '600', fontSize: '1.1rem' }}>Paiement {paiement.statut.toLowerCase()}</span>
                    </div>

                    <h1 style={{ fontSize: '3.5rem', fontWeight: '800', margin: '0.5rem 0', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                        +{paiement.montant.toLocaleString()} <span style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--text-muted)' }}>FCFA</span>
                    </h1>

                    {paiement.reference ? (
                        <div style={{ fontSize: '1.1rem', color: 'var(--text-muted)', fontWeight: '500', marginTop: '1rem' }}>
                            Réf : <span style={{ color: 'var(--text-main)', background: '#fff', padding: '0.2rem 0.6rem', borderRadius: '4px', border: '1px solid #ddd' }}>{paiement.reference}</span>
                        </div>
                    ) : (
                        <div style={{ fontSize: '1rem', color: 'var(--text-muted)', marginTop: '1rem' }}>Aucune référence saisie</div>
                    )}
                </div>

                <div style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>

                    {/* 2. Ce qui a été payé */}
                    <section>
                        <h3 className="flex items-center gap-2" style={{ color: 'var(--primary-color)', marginBottom: '1rem', fontSize: '1.1rem', fontWeight: '600', display: 'flex' }}>
                            <FileType size={20} /> Détail de l'opération
                        </h3>
                        <div style={{ backgroundColor: '#f9f9fa', padding: '1.5rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Date règlement : </span>
                                <span style={{ fontWeight: '500' }}>{formatDate(paiement.datePaiement)} via {paiement.modePaiement}</span>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Nature : </span>
                                <span style={{ fontWeight: '600' }}>
                                    {paiement.typePaiement === 'CAUTION' ? 'Dépôt de garantie (Caution)' :
                                        paiement.typePaiement === 'AVANCE' ? 'Avance de paiement' :
                                            paiement.typePaiement === 'FRAIS_ENTREE' ? "Frais d'entrée/Dossier" :
                                                `Règlement de loyer`}
                                </span>
                            </div>

                            {paiement.typePaiement === 'LOYER' && paiement.moisConcerne && (
                                <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Mois acquitté : </span>
                                    <span style={{ fontWeight: '600', color: 'var(--color-accent)' }}>
                                        {new Date(paiement.moisConcerne).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                                    </span>
                                </div>
                            )}

                            {paiement.notes && (
                                <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid #eaeaea' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Notes : </span>
                                    <span style={{ fontStyle: 'italic' }}>"{paiement.notes}"</span>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* 3. À quel bail/locataire cela correspond */}
                    <section>
                        <h3 className="flex items-center gap-2" style={{ color: 'var(--primary-color)', marginBottom: '1rem', fontSize: '1.1rem', fontWeight: '600', display: 'flex' }}>
                            <Home size={20} /> Rattachement du paiement
                        </h3>
                        <div style={{ border: '1px solid var(--border-light)', borderRadius: '8px', padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: '2rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <div style={{ fontSize: '1.2rem', fontWeight: '600' }}>
                                    {paiement.bail.locataire.prenom} {paiement.bail.locataire.nom}
                                </div>
                                <div style={{ color: 'var(--text-muted)' }}>
                                    Bail N° {paiement.bail.numBail} — Espace {paiement.bail.espace.identifiant} ({paiement.bail.espace.site.nom})
                                </div>
                            </div>
                            <Link to={`/baux/${paiement.bail.id}`} className="secondary-btn" style={{ whiteSpace: 'nowrap', textDecoration: 'none' }}>
                                Ouvrir le dossier du bail
                            </Link>
                        </div>
                    </section>
                </div>

                {/* Footer Action */}
                <div style={{ backgroundColor: '#f8fafc', padding: '1.5rem 2.5rem', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                    <button className="primary-btn" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem' }}>
                        <FileText size={18} /> Éditer un reçu (PDF)
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaiementDetail;
