import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../context/AuthContext';
import { FileText, User, Building2, CreditCard, Clock, ChevronLeft, Edit, Trash2, Loader2, AlertCircle, CheckCircle, XCircle, ArrowUpCircle, Ban, Pause, Play } from 'lucide-react';
import './SiteDetail.css';

interface Paiement {
    id: string;
    montant: number;
    datePaiement: string;
    moisConcerne: string;
    modePaiement: string;
    statut: string;
    typePaiement: string;
    reference?: string;
}

interface BailData {
    id: string;
    numBail?: string;
    dateEntree: string;
    dateFin?: string;
    loyerMensuel: number;
    montantCaution: number;
    cautionNombreMois: number;
    nbMoisAvance: number;
    statut: string;
    renouvellementAuto: boolean;
    preivisMois: number;
    locataire: {
        id: string;
        nom: string;
        prenom?: string;
        telephone: string;
    };
    espace: {
        id: string;
        identifiant: string;
        site: { id: string; nom: string };
    };
    paiements: Paiement[];
    evolutions?: {
        id: string;
        nouveauLoyerMensuel: number;
        dateEffet: string;
        applique: boolean;
    }[];
    _count?: {
        paiements: number;
    };
}

const BailDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [bail, setBail] = useState<BailData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchBail();
    }, [id]);

    const fetchBail = async () => {
        try {
            const response = await api.get(`/baux/${id}`);
            setBail(response.data.data);
        } catch (err: any) {
            console.error('Error fetching bail detail:', err);
            setError('Impossible de charger les détails du bail.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce bail ? Cette action est irréversible.')) return;
        try {
            await api.delete(`/baux/${id}`);
            navigate('/baux');
        } catch (err: any) {
            alert(err.response?.data?.message || 'Erreur lors de la suppression.');
        }
    };

    const handleAction = async (action: string) => {
        if (!window.confirm(`Confirmer l'action : ${action} ?`)) return;
        try {
            await api.post(`/baux/${id}/${action.toLowerCase()}`);
            fetchBail(); // Recharger les données
        } catch (err: any) {
            alert(err.response?.data?.message || `Erreur lors de l'action ${action}.`);
        }
    };

    const [generatingDoc, setGeneratingDoc] = useState(false);

    const handleGenerateLease = async () => {
        try {
            setGeneratingDoc(true);
            const res = await api.post(`/documents/generate-lease/${id}`, {}, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Contrat_Bail.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err: any) {
            alert('Erreur lors de la génération du contrat.');
        } finally {
            setGeneratingDoc(false);
        }
    };

    const handleGenerateReceipt = async (paiementId: string) => {
        try {
            const res = await api.post(`/documents/generate-receipt/${paiementId}`, {}, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Quittance.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err: any) {
            alert('Erreur lors de la génération de la quittance.');
        }
    };

    const [showEvolutionModal, setShowEvolutionModal] = useState(false);
    const [evolutionData, setEvolutionData] = useState({ nouveauLoyerMensuel: '', dateEffet: '' });

    const [showQuickPayModal, setShowQuickPayModal] = useState(false);
    const [quickPayData, setQuickPayData] = useState({ montant: '', modePaiement: 'ESPECES', reference: '', notes: '' });
    const [balanceData, setBalanceData] = useState<any>(null);
    const [loadingBalance, setLoadingBalance] = useState(false);

    const handleOpenQuickPay = async () => {
        setLoadingBalance(true);
        setShowQuickPayModal(true);
        try {
            const res = await api.get(`/paiements/bail/${id}/balance`);
            setBalanceData(res.data.data);
            setQuickPayData(prev => ({ ...prev, montant: res.data.data.totalPending.toString() }));
        } catch (err) {
            console.error('Error fetching balance:', err);
        } finally {
            setLoadingBalance(false);
        }
    };

    const handleQuickPaySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/paiements/smart-payment', {
                ...quickPayData,
                bailId: id,
                montant: Number(quickPayData.montant),
                datePaiement: new Date().toISOString()
            });
            setShowQuickPayModal(false);
            fetchBail();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Erreur lors du paiement.');
        }
    };

    const handlePlanifyEvolution = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post(`/baux/${id}/evolution`, evolutionData);
            setShowEvolutionModal(false);
            setEvolutionData({ nouveauLoyerMensuel: '', dateEffet: '' });
            fetchBail();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Erreur lors de la planification.');
        }
    };

    if (loading) return <div className="loading-container"><Loader2 className="spinner" size={48} /></div>;
    if (error || !bail) return (
        <div className="error-state glass-panel" style={{ textAlign: 'center', padding: '3rem' }}>
            <AlertCircle size={48} color="var(--color-error)" />
            <p>{error || 'Bail introuvable.'}</p>
            <Link to="/baux" className="primary-btn" style={{ marginTop: '1rem', display: 'inline-block' }}>Retour</Link>
        </div>
    );

    const loyerMensuel = Number(bail.loyerMensuel || 0);
    const montantCaution = Number(bail.montantCaution || 0);
    const nbMoisAvance = Number(bail.nbMoisAvance || 1);
    const totalEntree = montantCaution + (loyerMensuel * nbMoisAvance);

    return (
        <div className="site-detail-page">
            <Link to="/baux" className="back-link">
                <ChevronLeft size={18} /> Retour aux baux
            </Link>

            <div className="detail-header glass-panel">
                <div className="header-info">
                    <div className="site-icon-large">
                        <FileText size={32} />
                    </div>
                    <div>
                        <h1>{bail.numBail || `BAIL-${bail.id.slice(-6).toUpperCase()}`}</h1>
                        <div className="info-meta">
                            <span className={`status-badge ${bail.statut.toLowerCase()}`}>{bail.statut}</span>
                            <div className="location">
                                <Building2 size={16} />
                                <span>{bail.espace.site.nom} - {bail.espace.identifiant}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="header-actions" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <button onClick={handleGenerateLease} disabled={generatingDoc} className="secondary-btn" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-color)', borderColor: 'var(--primary-color)' }}>
                        <FileText size={18} /> {generatingDoc ? 'Génération...' : 'Contrat PDF'}
                    </button>
                    <button onClick={handleOpenQuickPay} className="primary-btn" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--color-success)' }}>
                        <CreditCard size={18} /> Enregistrer Règlement
                    </button>
                    {bail.statut === 'ACTIF' && (
                        <>
                            <button onClick={() => handleAction('Annuler')} className="secondary-btn" style={{ color: 'var(--color-warning)', borderColor: 'var(--color-warning)' }}>
                                <Ban size={18} /> Annuler
                            </button>
                            <button onClick={() => handleAction('Suspendre')} className="secondary-btn">
                                <Pause size={18} /> Suspendre
                            </button>
                        </>
                    )}
                    {bail.statut === 'SUSPENDU' && (
                        <button onClick={() => handleAction('Suspendre')} className="secondary-btn" style={{ color: 'var(--color-success)', borderColor: 'var(--color-success)' }}>
                            <Play size={18} /> Reprendre
                        </button>
                    )}
                    {(bail._count?.paiements === 0 || !bail._count) && (
                        <button onClick={handleDelete} className="secondary-btn" style={{ color: 'var(--color-error)', borderColor: 'var(--color-error)' }}>
                            <Trash2 size={18} /> Supprimer
                        </button>
                    )}
                    <button onClick={() => setShowEvolutionModal(true)} className="secondary-btn">
                        <ArrowUpCircle size={18} /> Évolution
                    </button>
                    <Link to={`/baux/edit/${bail.id}`} className="primary-btn" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Edit size={18} /> Modifier
                    </Link>
                </div>
            </div>

            <div className="detail-content" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                <div className="financial-summary">
                    <div className="glass-panel" style={{ padding: '1.5rem' }}>
                        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <CreditCard size={20} color="var(--primary-color)" /> Conditions Financières
                        </h3>

                        <div className="finance-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <div className="finance-item">
                                <span className="label" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loyer Mensuel</span>
                                <div className="value" style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--primary-color)' }}>
                                    {loyerMensuel.toLocaleString()} <span style={{ fontSize: '0.85rem' }}>FCFA</span>
                                </div>
                            </div>
                            <div className="finance-item">
                                <span className="label" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Caution ({bail.cautionNombreMois} mois)</span>
                                <div className="value" style={{ fontSize: '1.25rem', fontWeight: '700' }}>
                                    {montantCaution.toLocaleString()} <span style={{ fontSize: '0.85rem' }}>FCFA</span>
                                </div>
                            </div>
                            <div className="finance-item">
                                <span className="label" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Mois d'avance</span>
                                <div className="value" style={{ fontSize: '1.25rem', fontWeight: '700' }}>
                                    {nbMoisAvance} <span style={{ fontSize: '0.85rem' }}>mois</span>
                                </div>
                            </div>
                            <div className="finance-item">
                                <span className="label" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Total à l'entrée</span>
                                <div className="value" style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--secondary-color)' }}>
                                    {totalEntree.toLocaleString()} <span style={{ fontSize: '0.85rem' }}>FCFA</span>
                                </div>
                            </div>
                        </div>

                        <div className="contract-details" style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
                            <h4 style={{ marginBottom: '1rem' }}>Clauses du Contrat</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Date d'entrée</span>
                                    <span className="font-600">{new Date(bail.dateEntree).toLocaleDateString()}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Date de fin</span>
                                    <span className="font-600">{bail.dateFin ? new Date(bail.dateFin).toLocaleDateString() : 'Indéterminée'}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Préavis</span>
                                    <span className="font-600">{bail.preivisMois} mois</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Renouvellement auto</span>
                                    <span className="font-600">{bail.renouvellementAuto ? 'Oui' : 'Non'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="parties-info">
                    <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                        <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <User size={20} color="var(--primary-color)" /> Locataire
                        </h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div className="avatar" style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--primary-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: '600' }}>
                                {bail.locataire.nom.charAt(0)}
                            </div>
                            <div>
                                <div className="font-600" style={{ fontSize: '1.1rem' }}>{bail.locataire.prenom} {bail.locataire.nom}</div>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{bail.locataire.telephone}</div>
                                <Link to={`/locataires/${bail.locataire.id}`} style={{ fontSize: '0.85rem', color: 'var(--primary-color)', textDecoration: 'none', fontWeight: '500' }}>Voir le profil</Link>
                            </div>
                        </div>
                    </div>

                    <div className="glass-panel" style={{ padding: '1.5rem' }}>
                        <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Building2 size={20} color="var(--primary-color)" /> Espace Loué
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div className="font-600" style={{ fontSize: '1.1rem' }}>{bail.espace.identifiant}</div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{bail.espace.site.nom}</div>
                            <Link to={`/sites/${bail.espace.site.id}/espaces/${bail.espace.id}`} style={{ fontSize: '0.85rem', color: 'var(--primary-color)', textDecoration: 'none', fontWeight: '500' }}>Accéder à l'espace</Link>
                        </div>
                    </div>
                </div>

                <div className="full-width" style={{ gridColumn: '1 / span 2' }}>
                    <div className="section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2>Historique des Paiements</h2>
                        <button onClick={handleOpenQuickPay} className="primary-btn" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                            <CreditCard size={16} /> Enregistrer un règlement (Quick Pay)
                        </button>
                    </div>
                    <div className="glass-panel" style={{ padding: '0' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Mois concerné</th>
                                    <th>Date paiement</th>
                                    <th>Montant</th>
                                    <th>Mode</th>
                                    <th>Statut</th>
                                    <th>Quittance</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bail.paiements && bail.paiements.length > 0 ? (
                                    bail.paiements.map(p => (
                                        <tr key={p.id}>
                                            <td className="font-600">
                                                {p.typePaiement === 'CAUTION' ? 'Caution' :
                                                    p.typePaiement === 'AVANCE' ? 'Avance' :
                                                        p.typePaiement === 'FRAIS_ENTREE' ? "Frais d'entrée" :
                                                            p.moisConcerne ? new Date(p.moisConcerne).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) : 'N/A'}
                                                {p.reference && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>{p.reference}</div>}
                                            </td>
                                            <td>{new Date(p.datePaiement).toLocaleDateString()}</td>
                                            <td className="font-600">{Number(p.montant).toLocaleString()} FCFA</td>
                                            <td>{p.modePaiement}</td>
                                            <td>
                                                <span className={`status-badge ${p.statut.toLowerCase()}`}>
                                                    {p.statut === 'VALIDE' ? <CheckCircle size={12} /> : <Clock size={12} />} {p.statut}
                                                </span>
                                            </td>
                                            <td>
                                                <button className="table-action" onClick={() => handleGenerateReceipt(p.id)} title="Générer la quittance PDF">
                                                    <FileText size={16} /> PDF
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}> Aucun paiement enregistré. </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal Évolution */}
            {showEvolutionModal && (
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="glass-panel" style={{ width: '400px', padding: '2rem' }}>
                        <h3>🚀 Planifier une Évolution</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                            Définissez le nouveau loyer qui s'appliquera à la date choisie (ex: fin de période).
                        </p>
                        <form onSubmit={handlePlanifyEvolution}>
                            <div className="form-group" style={{ marginBottom: '1rem' }}>
                                <label>Nouveau Loyer Mensuel (FCFA)</label>
                                <input
                                    type="number"
                                    required
                                    className="glass-input"
                                    value={evolutionData.nouveauLoyerMensuel}
                                    onChange={e => setEvolutionData({ ...evolutionData, nouveauLoyerMensuel: e.target.value })}
                                />
                            </div>
                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label>Date d'effet</label>
                                <input
                                    type="date"
                                    required
                                    className="glass-input"
                                    value={evolutionData.dateEffet}
                                    onChange={e => setEvolutionData({ ...evolutionData, dateEffet: e.target.value })}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => setShowEvolutionModal(false)} className="secondary-btn">Annuler</button>
                                <button type="submit" className="primary-btn">Planifier</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Affichage des évolutions planifiées */}
            {bail.evolutions && bail.evolutions.length > 0 && (
                <div className="full-width" style={{ marginTop: '2rem' }}>
                    <h3>📅 Évolutions Planifiées</h3>
                    <div className="glass-panel" style={{ padding: '1rem' }}>
                        {bail.evolutions.map(evo => (
                            <div key={evo.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
                                <div>
                                    <span className="font-600" style={{ color: 'var(--secondary-color)' }}>{Number(evo.nouveauLoyerMensuel).toLocaleString()} FCFA</span>
                                    <span style={{ color: 'var(--text-muted)', marginLeft: '1rem' }}>à partir du {new Date(evo.dateEffet).toLocaleDateString()}</span>
                                </div>
                                <span className={`status-badge ${evo.applique ? 'success' : 'pending'}`}>
                                    {evo.applique ? 'Appliqué' : 'En attente'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {/* Modal Quick Pay */}
            {showQuickPayModal && (
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="glass-panel" style={{ width: '500px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0 }}>💳 Règlement Rapide</h3>
                            <button onClick={() => setShowQuickPayModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                <XCircle size={24} />
                            </button>
                        </div>

                        {loadingBalance ? (
                            <div style={{ textAlign: 'center', padding: '2rem' }}>
                                <Loader2 className="spinner" size={32} />
                                <p>Calcul du solde...</p>
                            </div>
                        ) : (
                            <form onSubmit={handleQuickPaySubmit}>
                                {balanceData && (
                                    <div style={{ background: 'rgba(var(--primary-rgb), 0.05)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                            <span>Reste Caution :</span>
                                            <span className="font-600">{balanceData.cautionPending.toLocaleString()} {balanceData.devise}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                            <span>Arriérés de loyers :</span>
                                            <span className="font-600">{(balanceData.totalPending - balanceData.cautionPending).toLocaleString()} {balanceData.devise}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                                            <span className="font-700">Total dû :</span>
                                            <span className="font-700" style={{ color: 'var(--color-error)' }}>{balanceData.totalPending.toLocaleString()} {balanceData.devise}</span>
                                        </div>
                                    </div>
                                )}

                                <div className="form-group" style={{ marginBottom: '1rem' }}>
                                    <label>Montant Versé ({balanceData?.devise})</label>
                                    <input
                                        type="number"
                                        required
                                        className="glass-input"
                                        value={quickPayData.montant}
                                        onChange={e => setQuickPayData({ ...quickPayData, montant: e.target.value })}
                                        style={{ fontSize: '1.25rem', fontWeight: '700' }}
                                    />
                                </div>

                                <div className="form-group" style={{ marginBottom: '1rem' }}>
                                    <label>Mode de Paiement</label>
                                    <select
                                        className="glass-input"
                                        value={quickPayData.modePaiement}
                                        onChange={e => setQuickPayData({ ...quickPayData, modePaiement: e.target.value })}
                                    >
                                        <option value="ESPECES">Espèces</option>
                                        <option value="MOBILE_MONEY">Mobile Money</option>
                                        <option value="VIREMENT">Virement</option>
                                        <option value="CHEQUE">Chèque</option>
                                    </select>
                                </div>

                                <div className="form-group" style={{ marginBottom: '1rem' }}>
                                    <label>Référence (ex: Numéro mobile money, N° Chèque)</label>
                                    <input
                                        type="text"
                                        className="glass-input"
                                        placeholder="Optionnel"
                                        value={quickPayData.reference}
                                        onChange={e => setQuickPayData({ ...quickPayData, reference: e.target.value })}
                                    />
                                </div>

                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.5rem', fontStyle: 'italic' }}>
                                    Note : Le montant sera réparti automatiquement (Caution &gt; Loyers anciens &gt; Courants).
                                </p>

                                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                    <button type="button" onClick={() => setShowQuickPayModal(false)} className="secondary-btn">Annuler</button>
                                    <button type="submit" className="primary-btn" disabled={!quickPayData.montant || Number(quickPayData.montant) <= 0}>
                                        Valider le règlement
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default BailDetail;
