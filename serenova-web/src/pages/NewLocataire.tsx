import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api } from '../context/AuthContext';
import { User, Mail, Phone, ChevronLeft, Loader2, Save } from 'lucide-react';
import './styles/NewItem.css';

const NewLocataire = () => {
    const { id } = useParams<{ id: string }>();
    const isEdit = Boolean(id);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(isEdit);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        civilite: 'M',
        nom: '',
        prenom: '',
        email: '',
        telephone: '',
        raisonSociale: '',
    });

    useEffect(() => {
        if (isEdit) {
            const fetchLocataire = async () => {
                try {
                    const res = await api.get(`/locataires/${id}`);
                    const data = res.data.data;
                    setFormData({
                        civilite: data.civilite || 'M',
                        nom: data.nom || '',
                        prenom: data.prenom || '',
                        email: data.email || '',
                        telephone: data.telephone || '',
                        raisonSociale: data.raisonSociale || '',
                    });
                } catch (err) {
                    console.error('Error fetching locataire for edit:', err);
                    setError('Impossible de charger les données du locataire.');
                } finally {
                    setFetching(false);
                }
            };
            fetchLocataire();
        }
    }, [id, isEdit]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isEdit) {
                await api.put(`/locataires/${id}`, formData);
                navigate(`/locataires/${id}`);
            } else {
                await api.post('/locataires', formData);
                navigate('/locataires');
            }
        } catch (err: any) {
            console.error('Error creating locataire:', err);
            setError(err.response?.data?.message || 'Erreur lors de la création du locataire.');
        } finally {
            setLoading(false);
        }
    };

    if (fetching) return <div className="loading-container"><Loader2 className="spinner" size={40} /></div>;

    return (
        <div className="new-item-page">
            <Link to={isEdit ? `/locataires/${id}` : "/locataires"} className="back-link">
                <ChevronLeft size={18} /> {isEdit ? 'Retour aux détails' : 'Retour aux locataires'}
            </Link>

            <div className="page-header">
                <h1>{isEdit ? 'Modifier le Locataire' : 'Nouveau Locataire'}</h1>
                <p className="subtitle">{isEdit ? 'Mettez à jour les informations du locataire.' : 'Enregistrez un nouveau locataire (particulier ou entreprise).'}</p>
            </div>

            <div className="form-container glass-panel">
                <form onSubmit={handleSubmit}>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Civilité *</label>
                            <select name="civilite" value={formData.civilite} onChange={handleChange}>
                                <option value="M">Monsieur (M.)</option>
                                <option value="MME">Madame (MME)</option>
                                <option value="SOCIETE">Société / Entreprise</option>
                            </select>
                        </div>

                        {formData.civilite === 'SOCIETE' ? (
                            <div className="form-group">
                                <label>Raison Sociale *</label>
                                <input
                                    type="text" name="raisonSociale" required
                                    value={formData.raisonSociale} onChange={handleChange}
                                    placeholder="Nom de l'entreprise"
                                />
                            </div>
                        ) : (
                            <div className="form-group" style={{ visibility: 'hidden' }}></div>
                        )}

                        <div className="form-group">
                            <label>Prénom</label>
                            <input
                                type="text" name="prenom"
                                value={formData.prenom} onChange={handleChange}
                            />
                        </div>

                        <div className="form-group">
                            <label>Nom *</label>
                            <input
                                type="text" name="nom" required
                                value={formData.nom} onChange={handleChange}
                            />
                        </div>

                        <div className="form-group">
                            <label>Email</label>
                            <input
                                type="email" name="email"
                                value={formData.email} onChange={handleChange}
                                placeholder="louis.dupont@email.com"
                            />
                        </div>

                        <div className="form-group">
                            <label>Téléphone *</label>
                            <input
                                type="text" name="telephone" required
                                value={formData.telephone} onChange={handleChange}
                                placeholder="+221 ..."
                            />
                        </div>
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <div className="form-actions">
                        <button type="button" onClick={() => navigate(isEdit ? `/locataires/${id}` : '/locataires')} className="secondary-btn">Annuler</button>
                        <button type="submit" className="primary-btn" disabled={loading}>
                            {loading ? <Loader2 className="spinner" size={18} /> : <Save size={18} />}
                            {loading ? (isEdit ? 'Enregistrement...' : 'Création...') : (isEdit ? 'Enregistrer le Locataire' : 'Enregistrer le Locataire')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NewLocataire;
