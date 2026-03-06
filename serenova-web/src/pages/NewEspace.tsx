import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api } from '../context/AuthContext';
import { LayoutGrid, ChevronLeft, Loader2, Save, Building2, Euro } from 'lucide-react';
import './styles/NewItem.css';

const NewEspace = () => {
    const { siteId, id } = useParams<{ siteId: string; id: string }>();
    const isEdit = Boolean(id);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(isEdit);
    const [siteName, setSiteName] = useState('');
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        identifiant: '',
        label: '',
        type: 'STUDIO',
        etage: 0,
        surface: 20,
        etatGeneral: 'BON',
        statut: 'LIBRE',
        loyer: {
            montantBase: 0,
            charges: 0,
            cautionNombreMois: 1,
            devise: 'FCFA',
            jourEcheance: 5,
        }
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const sRes = await api.get(`/sites/${siteId}`);
                setSiteName(sRes.data.data.nom);

                if (isEdit) {
                    const eRes = await api.get(`/espaces/${id}`);
                    const e = eRes.data.data;
                    setFormData({
                        identifiant: e.identifiant || '',
                        label: e.label || '',
                        type: e.type || 'STUDIO',
                        etage: e.etage || 0,
                        surface: e.surface || 20,
                        etatGeneral: e.etatGeneral || 'BON',
                        statut: e.statut || 'LIBRE',
                        loyer: {
                            montantBase: e.loyer?.montantBase || 0,
                            charges: e.loyer?.charges || 0,
                            cautionNombreMois: e.loyer?.cautionNombreMois || 1,
                            devise: e.loyer?.devise || 'FCFA',
                            jourEcheance: e.loyer?.jourEcheance || 5,
                        }
                    });
                }
            } catch (err) {
                console.error('Error fetching data for espace:', err);
                setError('Impossible de charger les données nécessaires.');
            } finally {
                setFetching(false);
            }
        };
        fetchData();
    }, [siteId, id, isEdit]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;

        if (name.startsWith('loyer.')) {
            const field = name.split('.')[1];
            setFormData(prev => ({
                ...prev,
                loyer: {
                    ...prev.loyer,
                    [field]: type === 'number' ? parseFloat(value) : value
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: type === 'number' ? parseFloat(value) : value
            }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isEdit) {
                await api.put(`/espaces/${id}`, formData);
                navigate(`/sites/${siteId}/espaces/${id}`);
            } else {
                await api.post(`/sites/${siteId}/espaces`, formData);
                navigate(`/sites/${siteId}`);
            }
        } catch (err: any) {
            console.error('Error creating espace:', err);
            setError(err.response?.data?.message || 'Erreur lors de la création de l\'espace.');
        } finally {
            setLoading(false);
        }
    };

    if (fetching) return <div className="loading-container"><Loader2 className="spinner" size={40} /></div>;

    return (
        <div className="new-item-page">
            <Link to={isEdit ? `/sites/${siteId}/espaces/${id}` : `/sites/${siteId}`} className="back-link">
                <ChevronLeft size={18} /> {isEdit ? 'Retour aux détails' : 'Retour au site'}
            </Link>

            <div className="page-header">
                <h1>{isEdit ? 'Modifier l\'Espace' : 'Nouvel Espace'}</h1>
                <p className="subtitle">{isEdit ? `Modifiez le bien ${formData.identifiant} de ` : 'Ajoutez un appartement, bureau ou local à '} <strong>{siteName || 'ce site'}</strong>.</p>
            </div>

            <div className="form-container glass-panel">
                <form onSubmit={handleSubmit}>
                    <div className="form-grid">
                        <div className="section-title full-width">
                            <h3>Informations Générales</h3>
                        </div>

                        <div className="form-group">
                            <label>Identifiant / N° *</label>
                            <input
                                type="text" name="identifiant" required
                                value={formData.identifiant} onChange={handleChange}
                                placeholder="ex: A-101, Bureau 2, Appt 5"
                            />
                        </div>

                        <div className="form-group">
                            <label>Type d'Espace *</label>
                            <select name="type" value={formData.type} onChange={handleChange}>
                                <option value="STUDIO">Studio</option>
                                <option value="T1">T1</option>
                                <option value="T2">T2</option>
                                <option value="T3">T3</option>
                                <option value="T4">T4</option>
                                <option value="LOCAL_COMMERCIAL">Local Commercial</option>
                                <option value="BUREAU">Bureau</option>
                                <option value="VILLA">Villa</option>
                                <option value="CHAMBRE">Chambre</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Surface (m²)</label>
                            <input
                                type="number" name="surface"
                                value={formData.surface} onChange={handleChange}
                            />
                        </div>

                        <div className="form-group">
                            <label>Étage</label>
                            <input
                                type="number" name="etage"
                                value={formData.etage} onChange={handleChange}
                            />
                        </div>

                        <div className="section-title full-width" style={{ marginTop: '1.5rem' }}>
                            <h3>Configuration du Loyer</h3>
                        </div>

                        <div className="form-group">
                            <label>Loyer de Base *</label>
                            <div className="input-with-icon">
                                <input
                                    type="number" name="loyer.montantBase" required
                                    value={formData.loyer.montantBase} onChange={handleChange}
                                />
                                <span className="icon-right">FCFA</span>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Charges</label>
                            <input
                                type="number" name="loyer.charges"
                                value={formData.loyer.charges} onChange={handleChange}
                            />
                        </div>

                        <div className="form-group">
                            <label>Nombre de mois de caution</label>
                            <input
                                type="number" name="loyer.cautionNombreMois" min="0" max="12"
                                value={formData.loyer.cautionNombreMois} onChange={handleChange}
                            />
                            <p className="field-hint" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                Montant estimé : <strong>{(formData.loyer.montantBase * formData.loyer.cautionNombreMois).toLocaleString()} {formData.loyer.devise}</strong>
                            </p>
                        </div>

                        <div className="form-group">
                            <label>Jour d'échéance</label>
                            <input
                                type="number" name="loyer.jourEcheance" min="1" max="28"
                                value={formData.loyer.jourEcheance} onChange={handleChange}
                            />
                        </div>
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <div className="form-actions">
                        <button type="button" onClick={() => navigate(isEdit ? `/sites/${siteId}/espaces/${id}` : `/sites/${siteId}`)} className="secondary-btn">Annuler</button>
                        <button type="submit" className="primary-btn" disabled={loading}>
                            {loading ? <Loader2 className="spinner" size={18} /> : <Save size={18} />}
                            {loading ? (isEdit ? 'Enregistrement...' : 'Création...') : (isEdit ? 'Sauvegarder' : 'Créer l\'Espace')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NewEspace;
