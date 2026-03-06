import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../context/AuthContext';
import { Loader2, ArrowLeft, CreditCard, Save, Calendar, Tag, ShieldAlert } from 'lucide-react';

const SubscriptionDetail = () => {
    const { id } = useParams<{ id: string }>(); // This is the organisation ID
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [organisation, setOrganisation] = useState<any>(null);
    const [plans, setPlans] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        planId: '',
        statut: 'ACTIF',
        autoRenouvellement: true
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [orgRes, plansRes] = await Promise.all([
                    api.get(`/organisations/${id}`),
                    api.get('/plans')
                ]);

                const orgData = orgRes.data.data;
                setOrganisation(orgData);
                setPlans(plansRes.data.data || []);

                if (orgData.subscription) {
                    setFormData({
                        planId: orgData.subscription.planId,
                        statut: orgData.subscription.statut,
                        autoRenouvellement: orgData.subscription.autoRenouvellement
                    });
                }
            } catch (err) {
                console.error('Erreur:', err);
                alert('Impossible de charger les données.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.put(`/organisations/${id}/subscription`, formData);
            alert('Abonnement mis à jour avec succès');
            navigate('/abonnements');
        } catch (err: any) {
            alert(err.response?.data?.message || 'Erreur lors de la mise à jour');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
                <Loader2 className="spinner" size={48} color="var(--color-primary)" />
                <p style={{ color: 'var(--text-muted)' }}>Chargement de l'abonnement...</p>
            </div>
        );
    }

    if (!organisation) {
        return <div>Client introuvable</div>;
    }

    return (
        <div className="page-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div className="page-header" style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button className="btn btn-secondary" onClick={() => navigate('/abonnements')} style={{ padding: '0.5rem' }}>
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="page-title">Gestion de l'Abonnement</h1>
                        <p className="page-subtitle">Client : <span style={{ fontWeight: 600 }}>{organisation.nom}</span></p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="card" style={{ padding: '2rem' }}>
                <div className="form-section">
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <CreditCard size={18} color="var(--color-primary)" />
                        Paramètres du Forfait
                    </h3>

                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Tag size={16} /> Plan Sélectionné
                        </label>
                        <select
                            className="form-input"
                            required
                            value={formData.planId}
                            onChange={(e) => setFormData({ ...formData, planId: e.target.value })}
                        >
                            <option value="">-- Choisir un Plan --</option>
                            {plans.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.nom} - {(p.prix || 0).toLocaleString()} FCFA / {p.periodicite?.toLowerCase() || 'mois'}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                        <div className="form-group">
                            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <ShieldAlert size={16} /> Statut de l'Abonnement
                            </label>
                            <select
                                className="form-input"
                                value={formData.statut}
                                onChange={(e) => setFormData({ ...formData, statut: e.target.value })}
                                style={{
                                    borderColor: formData.statut === 'ACTIF' ? 'var(--color-success)' :
                                        formData.statut === 'SUSPENDU' ? 'var(--color-warning)' :
                                            formData.statut === 'RESILIE' ? 'var(--color-danger)' : 'var(--border-light)'
                                }}
                            >
                                <option value="ACTIF">ACTIF</option>
                                <option value="SUSPENDU">SUSPENDU</option>
                                <option value="EXPIRE">EXPIRE</option>
                                <option value="RESILIE">RÉSILIÉ</option>
                            </select>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                                Suspendre un abonnement bloque l'accès à la plateforme pour ce client.
                            </p>
                        </div>

                        <div className="form-group">
                            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Calendar size={16} /> Renouvellement
                            </label>
                            <div style={{ marginTop: '0.5rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={formData.autoRenouvellement}
                                        onChange={(e) => setFormData({ ...formData, autoRenouvellement: e.target.checked })}
                                        style={{ width: '18px', height: '18px' }}
                                    />
                                    Renouvellement Automatique
                                </label>
                            </div>
                        </div>
                    </div>

                    {organisation.subscription && (
                        <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.03)', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            <p style={{ margin: '0 0 0.5rem 0' }}><strong>ID Abonnement :</strong> {organisation.subscription.id}</p>
                            <p style={{ margin: '0 0 0.5rem 0' }}><strong>Date de début :</strong> {new Date(organisation.subscription.dateDebut).toLocaleDateString()}</p>
                            {organisation.subscription.dateFin && (
                                <p style={{ margin: 0 }}><strong>Date de fin :</strong> {new Date(organisation.subscription.dateFin).toLocaleDateString()}</p>
                            )}
                        </div>
                    )}
                </div>

                <div style={{ marginTop: '2.5rem', display: 'flex', gap: '1rem', borderTop: '1px solid var(--border-light)', paddingTop: '1.5rem' }}>
                    <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => navigate('/abonnements')}>
                        Annuler
                    </button>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={saving || !formData.planId}>
                        <Save size={18} />
                        {saving ? 'Enregistrement...' : 'Mettre à jour l\'abonnement'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default SubscriptionDetail;
