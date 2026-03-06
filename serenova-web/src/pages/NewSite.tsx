import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../context/AuthContext';
import { Building2, MapPin, ChevronLeft, Loader2, Save } from 'lucide-react';
import './styles/NewItem.css';

const NewSite = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        nom: '',
        type: 'RESIDENTIEL',
        adresse: '',
        ville: '',
        codePostal: '',
        pays: 'Sénégal',
        nbEspaces: 1,
        description: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'nbEspaces' ? parseInt(value) : value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await api.post('/sites', formData);
            navigate('/sites');
        } catch (err: any) {
            console.error('Error creating site:', err);
            setError(err.response?.data?.message || 'Erreur lors de la création du site.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="new-item-page">
            <Link to="/sites" className="back-link">
                <ChevronLeft size={18} /> Retour aux sites
            </Link>

            <div className="page-header">
                <h1>Nouveau Site</h1>
                <p className="subtitle">Ajoutez une nouvelle propriété à votre parc immobilier.</p>
            </div>

            <div className="form-container glass-panel">
                <form onSubmit={handleSubmit}>
                    <div className="form-grid">
                        <div className="form-group full-width">
                            <label>Nom du Site *</label>
                            <input
                                type="text" name="nom" required
                                value={formData.nom} onChange={handleChange}
                                placeholder="ex: Résidence les Palmiers"
                            />
                        </div>

                        <div className="form-group">
                            <label>Type de Site</label>
                            <select name="type" value={formData.type} onChange={handleChange}>
                                <option value="RESIDENTIEL">Résidentiel</option>
                                <option value="COMMERCIAL">Commercial</option>
                                <option value="MIXTE">Mixte</option>
                                <option value="VILLA">Villa</option>
                                <option value="ETUDIANT">Étudiant</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Nombre d'Espaces</label>
                            <input
                                type="number" name="nbEspaces" min="1"
                                value={formData.nbEspaces} onChange={handleChange}
                            />
                        </div>

                        <div className="form-group full-width">
                            <label>Adresse *</label>
                            <input
                                type="text" name="adresse" required
                                value={formData.adresse} onChange={handleChange}
                                placeholder="Rue, quartier, etc."
                            />
                        </div>

                        <div className="form-group">
                            <label>Ville *</label>
                            <input
                                type="text" name="ville" required
                                value={formData.ville} onChange={handleChange}
                            />
                        </div>

                        <div className="form-group">
                            <label>Code Postal</label>
                            <input
                                type="text" name="codePostal"
                                value={formData.codePostal} onChange={handleChange}
                            />
                        </div>

                        <div className="form-group full-width">
                            <label>Description (optionnel)</label>
                            <textarea
                                name="description" rows={3}
                                value={formData.description} onChange={handleChange}
                            ></textarea>
                        </div>
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <div className="form-actions">
                        <button type="button" onClick={() => navigate('/sites')} className="secondary-btn">Annuler</button>
                        <button type="submit" className="primary-btn" disabled={loading}>
                            {loading ? <Loader2 className="spinner" size={18} /> : <Save size={18} />}
                            {loading ? 'Création...' : 'Enregistrer le Site'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NewSite;
