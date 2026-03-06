import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api } from '../context/AuthContext';
import { FileText, ChevronLeft, Loader2, Save, Building2, User } from 'lucide-react';
import './styles/NewItem.css';

interface Site {
    id: string;
    nom: string;
}

interface Espace {
    id: string;
    identifiant: string;
    statut: string;
    loyer?: {
        montantBase: number;
        cautionNombreMois?: number;
    };
}

interface Locataire {
    id: string;
    nom: string;
    prenom: string;
}

const NewBail = () => {
    const { id } = useParams<{ id: string }>();
    const isEdit = Boolean(id);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [sites, setSites] = useState<Site[]>([]);
    const [espaces, setEspaces] = useState<Espace[]>([]);
    const [locataires, setLocataires] = useState<Locataire[]>([]);

    const [formData, setFormData] = useState({
        siteId: '',
        espaceId: '',
        locataireId: '',
        dateEntree: new Date().toISOString().split('T')[0],
        dateFin: '',
        dureesMois: 12,
        renouvellementAuto: true,
        preivisMois: 1,
        loyerMensuel: 0,
        montantCaution: 0,
        cautionNombreMois: 1,
        nbMoisAvance: 1,
    });

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [sitesRes, locRes] = await Promise.all([
                    api.get('/sites'),
                    api.get('/locataires')
                ]);
                setSites(sitesRes.data.data.sites || []);
                setLocataires(locRes.data.data.locataires || []);

                if (isEdit) {
                    const bailRes = await api.get(`/baux/${id}`);
                    const b = bailRes.data.data;

                    // Charger aussi les espaces du site du bail
                    const spacesRes = await api.get(`/sites/${b.espace.siteId}`);
                    setEspaces(spacesRes.data.data.espaces);

                    setFormData({
                        siteId: b.espace.siteId,
                        espaceId: b.espaceId,
                        locataireId: b.locataireId,
                        dateEntree: new Date(b.dateEntree).toISOString().split('T')[0],
                        dateFin: b.dateFin ? new Date(b.dateFin).toISOString().split('T')[0] : '',
                        dureesMois: b.dureesMois || 12,
                        renouvellementAuto: b.renouvellementAuto,
                        preivisMois: b.preivisMois || 1,
                        loyerMensuel: b.loyerMensuel,
                        montantCaution: b.montantCaution,
                        cautionNombreMois: b.cautionNombreMois,
                        nbMoisAvance: b.nbMoisAvance || 1,
                    });
                }
            } catch (err) {
                console.error('Error fetching data for bail:', err);
                setError('Impossible de charger les données nécessaires.');
            } finally {
                setFetching(false);
            }
        };
        fetchInitialData();
    }, [id, isEdit]);

    const handleSiteChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const siteId = e.target.value;
        setFormData(prev => ({ ...prev, siteId, espaceId: '' }));
        if (!siteId) {
            setEspaces([]);
            return;
        }

        try {
            const res = await api.get(`/sites/${siteId}`);
            const availableSpaces = res.data.data.espaces.filter((esp: any) => esp.statut === 'LIBRE');
            setEspaces(availableSpaces);
        } catch (err) {
            console.error('Error fetching spaces for site:', err);
        }
    };

    const handleEspaceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const espaceId = e.target.value;
        const selectedEspace = espaces.find(esp => esp.id === espaceId);

        if (selectedEspace && selectedEspace.loyer) {
            const nbMoisCaution = selectedEspace.loyer.cautionNombreMois || 1;
            const loyer = selectedEspace.loyer.montantBase || 0;
            setFormData(prev => ({
                ...prev,
                espaceId,
                loyerMensuel: loyer,
                cautionNombreMois: nbMoisCaution,
                montantCaution: loyer * nbMoisCaution,
                nbMoisAvance: 1
            }));
        } else {
            setFormData(prev => ({ ...prev, espaceId }));
        }
    };

    const computeDateFin = (dateEntree: string, dureesMois: number): string => {
        if (!dateEntree || !dureesMois) return '';
        const d = new Date(dateEntree);
        d.setMonth(d.getMonth() + dureesMois);
        return d.toISOString().split('T')[0];
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

        setFormData(prev => {
            const newState = {
                ...prev,
                [name]: ['dureesMois', 'preivisMois', 'loyerMensuel', 'montantCaution', 'cautionNombreMois', 'nbMoisAvance'].includes(name)
                    ? parseFloat(value) || 0
                    : val
            };

            // Recalculer la caution si le loyer ou le nombre de mois change
            if (name === 'loyerMensuel' || name === 'cautionNombreMois') {
                newState.montantCaution = newState.loyerMensuel * newState.cautionNombreMois;
            }

            // Auto-calculer dateFin quand dateEntree ou dureesMois change
            if (name === 'dateEntree' || name === 'dureesMois') {
                const entree = name === 'dateEntree' ? value : prev.dateEntree;
                const duree = name === 'dureesMois' ? (parseFloat(value) || 0) : prev.dureesMois;
                if (entree && duree > 0) {
                    newState.dateFin = computeDateFin(entree, duree);
                }
            }

            // Si l'utilisateur modifie manuellement dateFin → mettre à jour dureesMois
            if (name === 'dateFin' && value && prev.dateEntree) {
                const start = new Date(prev.dateEntree);
                const end = new Date(value);
                const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
                if (months > 0) newState.dureesMois = months;
            }

            return newState;
        });
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.espaceId || !formData.locataireId) {
            setError('Veuillez sélectionner un espace et un locataire.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            if (isEdit) {
                await api.put(`/baux/${id}`, formData);
                navigate(`/baux/${id}`);
            } else {
                await api.post('/baux', formData);
                navigate('/baux');
            }
        } catch (err: any) {
            console.error('Error creating bail:', err);
            setError(err.response?.data?.message || 'Erreur lors de la création du bail.');
        } finally {
            setLoading(false);
        }
    };

    if (fetching) return <div className="loading-container"><Loader2 className="spinner" size={40} /></div>;

    return (
        <div className="new-item-page">
            <Link to={isEdit ? `/baux/${id}` : "/baux"} className="back-link">
                <ChevronLeft size={18} /> {isEdit ? 'Retour aux détails' : 'Retour aux baux'}
            </Link>

            <div className="page-header">
                <h1>{isEdit ? 'Modifier le Bail' : 'Nouveau Bail'}</h1>
                <p className="subtitle">{isEdit ? 'Mettez à jour les conditions contractuelles.' : 'Liez un locataire à un espace et définissez les conditions du contrat.'}</p>
            </div>

            <div className="form-container glass-panel">
                <form onSubmit={handleSubmit}>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Site Immobilier *</label>
                            <select name="siteId" value={formData.siteId} onChange={handleSiteChange} required>
                                <option value="">Choisir un site...</option>
                                {sites.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Espace / Bien (Disponible) *</label>
                            <select
                                name="espaceId"
                                value={formData.espaceId}
                                onChange={handleEspaceChange}
                                required
                                disabled={!formData.siteId}
                            >
                                <option value="">Choisir un bien...</option>
                                {espaces.map(e => <option key={e.id} value={e.id}>{e.identifiant}</option>)}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Mensualité du loyer (FCFA) *</label>
                            <input
                                type="number" name="loyerMensuel" required
                                value={formData.loyerMensuel} onChange={handleChange}
                            />
                        </div>

                        <div className="form-group">
                            <label>Nombre de mois de caution</label>
                            <input
                                type="number" name="cautionNombreMois" min="0" max="12"
                                value={formData.cautionNombreMois} onChange={handleChange}
                            />
                        </div>

                        <div className="form-group">
                            <label>Montant de la caution (FCFA)</label>
                            <input
                                type="number" name="montantCaution"
                                value={formData.montantCaution} onChange={handleChange}
                            />
                        </div>

                        <div className="form-group">
                            <label>Nombre de mois d'avance (Exigé à l'entrée)</label>
                            <input
                                type="number" name="nbMoisAvance" min="1"
                                value={formData.nbMoisAvance} onChange={handleChange}
                            />
                        </div>

                        <div className="form-group full-width" style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(var(--primary-rgb), 0.1)', borderRadius: '8px', border: '1px solid var(--primary-color)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h4 style={{ margin: 0, color: 'var(--primary-color)' }}>Total à payer à l'entrée</h4>
                                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                        Caution ({formData.montantCaution.toLocaleString()} FCFA) + Avances ({(formData.loyerMensuel * formData.nbMoisAvance).toLocaleString()} FCFA)
                                    </p>
                                </div>
                                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--primary-color)' }}>
                                    {(formData.montantCaution + (formData.loyerMensuel * formData.nbMoisAvance)).toLocaleString()} FCFA
                                </div>
                            </div>
                        </div>

                        <div className="form-group full-width">
                            <label>Locataire *</label>
                            <select name="locataireId" value={formData.locataireId} onChange={handleChange} required>
                                <option value="">Sélectionner un locataire...</option>
                                {locataires.map(l => <option key={l.id} value={l.id}>{l.prenom} {l.nom}</option>)}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Date d'entrée *</label>
                            <input
                                type="date" name="dateEntree" required
                                value={formData.dateEntree} onChange={handleChange}
                            />
                        </div>

                        <div className="form-group">
                            <label>Date de fin <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optionnelle — laisser vide si indéterminée)</span></label>
                            <input
                                type="date" name="dateFin"
                                value={formData.dateFin} onChange={handleChange}
                                min={formData.dateEntree}
                            />
                        </div>

                        <div className="form-group">
                            <label>Durée (Mois)</label>
                            <input
                                type="number" name="dureesMois"
                                value={formData.dureesMois} onChange={handleChange}
                            />
                        </div>

                        <div className="form-group">
                            <label>Préavis (Mois)</label>
                            <input
                                type="number" name="preivisMois"
                                value={formData.preivisMois} onChange={handleChange}
                            />
                        </div>

                        <div className="form-group" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
                            <input
                                type="checkbox" name="renouvellementAuto"
                                checked={formData.renouvellementAuto} onChange={handleChange}
                                style={{ width: 'auto' }}
                            />
                            <label style={{ margin: 0 }}>Renouvellement automatique</label>
                        </div>
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <div className="form-actions">
                        <button type="button" onClick={() => navigate(isEdit ? `/baux/${id}` : '/baux')} className="secondary-btn">Annuler</button>
                        <button type="submit" className="primary-btn" disabled={loading}>
                            {loading ? <Loader2 className="spinner" size={18} /> : <Save size={18} />}
                            {loading ? (isEdit ? 'Enregistrement...' : 'Création...') : (isEdit ? 'Sauvegarder' : 'Créer le Bail')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NewBail;
