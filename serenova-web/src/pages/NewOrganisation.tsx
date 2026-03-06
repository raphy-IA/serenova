import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../context/AuthContext';
import { Building2, User, ChevronLeft, Save, Globe, Phone, Mail, MapPin, Loader2 } from 'lucide-react';

const NewOrganisation = () => {
    const { id } = useParams<{ id: string }>();
    const isEdit = !!id;
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [plans, setPlans] = useState<any[]>([]);
    const [fetching, setFetching] = useState(true);
    const [formData, setFormData] = useState({
        nom: '',
        type: 'SOCIETE' as 'SOCIETE' | 'INDIVIDU',
        email: '',
        telephone: '',
        adresse: '',
        ville: '',
        planId: ''
    });

    useEffect(() => {
        const initData = async () => {
            try {
                if (isEdit) {
                    const res = await api.get(`/organisations/${id}`);
                    const data = res.data.data;
                    setFormData({
                        nom: data.nom,
                        type: data.type,
                        email: data.email || '',
                        telephone: data.telephone || '',
                        adresse: data.adresse || '',
                        ville: data.ville || '',
                        planId: ''
                    });
                } else {
                    const plansRes = await api.get('/plans');
                    setPlans(plansRes.data.data || []);
                }
            } catch (err) {
                console.error('Erreur lors du chargement:', err);
                alert('Impossible de charger les données requises.');
            } finally {
                setFetching(false);
            }
        };
        initData();
    }, [id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isEdit) {
                await api.put(`/organisations/${id}`, formData);
            } else {
                await api.post('/organisations', formData);
            }
            navigate(isEdit ? `/organisations/${id}` : '/organisations');
        } catch (err: any) {
            alert(err.response?.data?.message || 'Erreur lors de l\'enregistrement');
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '1rem' }}>
                <Loader2 className="spinner" size={48} color="var(--color-primary)" />
                <p style={{ color: 'var(--text-muted)' }}>Chargement des informations...</p>
            </div>
        );
    }

    return (
        <div className="page-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button className="btn btn-secondary" onClick={() => navigate(-1)} style={{ padding: '0.5rem' }}>
                        <ChevronLeft size={20} />
                    </button>
                    <div>
                        <h1 className="page-title">{isEdit ? 'Modifier l\'Entité' : 'Nouvelle Entité'}</h1>
                        <p className="page-subtitle">
                            {isEdit ? `Mise à jour des informations de ${formData.nom}` : 'Enregistrement d\'un nouveau client sur la plateforme'}
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="card" style={{ padding: '2rem' }}>
                <div className="form-section">
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Globe size={18} color="var(--color-primary)" />
                        Type d'entité immobilière
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                        <div
                            className={`selection-card ${formData.type === 'SOCIETE' ? 'active' : ''}`}
                            onClick={() => setFormData({ ...formData, type: 'SOCIETE' })}
                        >
                            <Building2 size={24} />
                            <div>
                                <div className="title">Société / Personne Morale</div>
                                <p>Pour les SCI, agences ou entreprises</p>
                            </div>
                        </div>
                        <div
                            className={`selection-card ${formData.type === 'INDIVIDU' ? 'active' : ''}`}
                            onClick={() => setFormData({ ...formData, type: 'INDIVIDU' })}
                        >
                            <User size={24} />
                            <div>
                                <div className="title">Particulier / Individu</div>
                                <p>Pour les propriétaires bailleurs directs</p>
                            </div>
                        </div>
                    </div>

                    <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div className="form-group" style={{ gridColumn: 'span 2' }}>
                            <label className="form-label">Nom complet ou Raison sociale</label>
                            <input
                                type="text"
                                className="form-input"
                                required
                                placeholder={formData.type === 'SOCIETE' ? 'Ex: Immobilière Sahel SARL' : 'Ex: Jean Dupont'}
                                value={formData.nom}
                                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Email de contact</label>
                            <div style={{ position: 'relative' }}>
                                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input
                                    type="email"
                                    className="form-input"
                                    style={{ paddingLeft: '2.5rem' }}
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Téléphone</label>
                            <div style={{ position: 'relative' }}>
                                <Phone size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input
                                    type="text"
                                    className="form-input"
                                    style={{ paddingLeft: '2.5rem' }}
                                    value={formData.telephone}
                                    onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="form-group" style={{ gridColumn: 'span 2' }}>
                            <label className="form-label">Adresse physique</label>
                            <div style={{ position: 'relative' }}>
                                <MapPin size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input
                                    type="text"
                                    className="form-input"
                                    style={{ paddingLeft: '2.5rem' }}
                                    value={formData.adresse}
                                    onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Ville</label>
                            <input
                                type="text"
                                className="form-input"
                                value={formData.ville}
                                onChange={(e) => setFormData({ ...formData, ville: e.target.value })}
                            />
                        </div>

                        {!isEdit && (
                            <div className="form-group" style={{ gridColumn: 'span 2', marginTop: '1rem', padding: '1.5rem', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                                <label className="form-label" style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
                                    Abonnement Initial (Optionnel)
                                </label>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.8rem' }}>
                                    Assignez immédiatement un Pack au client. La facture correspondante sera générée lors de la prochaine phase.
                                </p>
                                <select
                                    className="form-input"
                                    style={{ background: 'var(--bg-surface)' }}
                                    value={formData.planId}
                                    onChange={(e) => setFormData({ ...formData, planId: e.target.value })}
                                >
                                    <option value="">-- Sans abonnement immédiat --</option>
                                    {plans.map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.nom} - {(p.prix || 0).toLocaleString()} FCFA / {p.periodicite?.toLowerCase() || 'mois'}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                </div>

                <div style={{ marginTop: '2.5rem', display: 'flex', gap: '1rem', borderTop: '1px solid var(--border-light)', paddingTop: '1.5rem' }}>
                    <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => navigate(-1)}>Annuler</button>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                        <Save size={18} />
                        {loading ? 'Création...' : 'Créer l\'entité'}
                    </button>
                </div>
            </form>

            <style>{`
                .selection-card {
                    border: 2px solid var(--border-light);
                    border-radius: 12px;
                    padding: 1.25rem;
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .selection-card:hover {
                    border-color: var(--color-primary);
                    background: var(--bg-light);
                }
                .selection-card.active {
                    border-color: var(--color-primary);
                    background: rgba(var(--color-primary-rgb), 0.05);
                }
                .selection-card .title {
                    fontWeight: 600;
                    margin-bottom: 0.25rem;
                }
                .selection-card p {
                    font-size: 0.8rem;
                    color: var(--text-muted);
                    margin: 0;
                }
            `}</style>
        </div>
    );
};

export default NewOrganisation;
