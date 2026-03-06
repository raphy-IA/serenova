import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';
import { Plus, Trash2, Edit2, Loader2, AlertCircle, CheckCircle, Server, Users, FileText } from 'lucide-react';
import './PlansPage.css';

interface Plan {
    id: string;
    nom: string;
    prix: string;
    periodicite: 'MENSUEL' | 'ANNUEL';
    limites: {
        sites: number;
        baux: number;
        users: number;
        [key: string]: any;
    };
    _count: {
        subscriptions: number;
    };
    createdAt: string;
}

const PlansPage = () => {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

    const [formData, setFormData] = useState({
        nom: '',
        prix: 0,
        periodicite: 'MENSUEL' as 'MENSUEL' | 'ANNUEL',
        limites: { sites: 1, baux: 1, users: 1 }
    });

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            setLoading(true);
            const res = await api.get('/plans');
            setPlans(res.data.data);
            setError(null);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Erreur lors du chargement des plans');
        } finally {
            setLoading(false);
        }
    };

    const openModal = (plan?: Plan) => {
        if (plan) {
            setEditingPlan(plan);
            setFormData({
                nom: plan.nom,
                prix: parseFloat(plan.prix),
                periodicite: plan.periodicite,
                limites: {
                    sites: plan.limites.sites || 1,
                    baux: plan.limites.baux || 1,
                    users: plan.limites.users || 1
                }
            });
        } else {
            setEditingPlan(null);
            setFormData({
                nom: '',
                prix: 0,
                periodicite: 'MENSUEL',
                limites: { sites: 1, baux: 1, users: 1 }
            });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // S'assurer que les prix et limites sont bien des nombres
            const payload = {
                ...formData,
                prix: Number(formData.prix),
                limites: {
                    sites: Number(formData.limites.sites),
                    baux: Number(formData.limites.baux),
                    users: Number(formData.limites.users),
                }
            };

            if (editingPlan) {
                await api.patch(`/plans/${editingPlan.id}`, payload);
            } else {
                await api.post('/plans', payload);
            }
            setShowModal(false);
            fetchPlans();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Erreur lors de la sauvegarde');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Voulez-vous vraiment supprimer ce plan ? Cette action est irréversible.')) return;
        try {
            await api.delete(`/plans/${id}`);
            fetchPlans();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Erreur lors de la suppression');
        }
    };

    const formatPrice = (price: string | number) => {
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(Number(price));
    };

    const formatLimit = (limit: number) => {
        return limit >= 9999 ? 'Illimité' : limit;
    };

    if (loading) return (
        <div className="loading-state">
            <Loader2 className="spinner" size={48} />
            <p>Chargement du catalogue des offres...</p>
        </div>
    );

    return (
        <div className="plans-page">
            <div className="plans-header">
                <div>
                    <h1 className="text-gradient">Plans & Tarifs</h1>
                    <p className="text-muted">Gérez les packages d'abonnement et leurs limites d'utilisation</p>
                </div>
                <button className="primary-btn" onClick={() => openModal()}>
                    <Plus size={20} /> Nouveau Plan
                </button>
            </div>

            {error && (
                <div className="alert alert-danger">
                    <AlertCircle size={20} /> {error}
                </div>
            )}

            <div className="plans-grid">
                {plans.map((plan) => (
                    <div key={plan.id} className="plan-card">
                        <div className="plan-card-header">
                            <h3>{plan.nom}</h3>
                            <div className="plan-price">
                                <span className="amount">{formatPrice(plan.prix)}</span>
                                <span className="period">/{plan.periodicite === 'MENSUEL' ? 'mois' : 'an'}</span>
                            </div>
                        </div>

                        <div className="plan-limits">
                            <h4 className="limits-title">Limites Incluses</h4>
                            <div className="limit-item">
                                <Server size={18} className="limit-icon" />
                                <div className="limit-details">
                                    <span className="limit-label">Sites autorisés</span>
                                    <span className="limit-value">{formatLimit(plan.limites.sites)}</span>
                                </div>
                            </div>
                            <div className="limit-item">
                                <FileText size={18} className="limit-icon" />
                                <div className="limit-details">
                                    <span className="limit-label">Baux actifs</span>
                                    <span className="limit-value">{formatLimit(plan.limites.baux)}</span>
                                </div>
                            </div>
                            <div className="limit-item">
                                <Users size={18} className="limit-icon" />
                                <div className="limit-details">
                                    <span className="limit-label">Utilisateurs</span>
                                    <span className="limit-value">{formatLimit(plan.limites.users)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="plan-card-footer">
                            <div className="subscribers-count">
                                <Users size={16} />
                                <span>{plan._count.subscriptions} abonné(s)</span>
                            </div>
                            <div className="plan-actions">
                                <button className="icon-btn edit" onClick={() => openModal(plan)}>
                                    <Edit2 size={18} />
                                </button>
                                <button
                                    className="icon-btn delete"
                                    onClick={() => handleDelete(plan.id)}
                                    title={plan._count.subscriptions > 0 ? "Impossible de supprimer un plan en cours d'utilisation" : "Supprimer"}
                                    disabled={plan._count.subscriptions > 0}
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-container">
                        <h2>{editingPlan ? 'Modifier le Plan' : 'Créer un Nouveau Plan'}</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="form-grid">
                                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                    <label>Nom du Plan</label>
                                    <input type="text" value={formData.nom} onChange={e => setFormData({ ...formData, nom: e.target.value })} required placeholder="Ex: Starter, Pro, Premium..." />
                                </div>
                                <div className="form-group">
                                    <label>Prix (XAF)</label>
                                    <input type="number" min="0" value={formData.prix} onChange={e => setFormData({ ...formData, prix: Number(e.target.value) })} required />
                                </div>
                                <div className="form-group">
                                    <label>Périodicité</label>
                                    <select value={formData.periodicite} onChange={e => setFormData({ ...formData, periodicite: e.target.value as any })}>
                                        <option value="MENSUEL">Mensuel</option>
                                        <option value="ANNUEL">Annuel</option>
                                    </select>
                                </div>

                                <div className="limits-section" style={{ gridColumn: 'span 2' }}>
                                    <h4 className="limits-section-title">Définir les limites du système</h4>
                                    <p className="limits-section-desc">Mettez une valeur élevée (ex: 9999) pour simuler un accès illimité.</p>

                                    <div className="form-grid limits-grid">
                                        <div className="form-group">
                                            <label><Server size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} /> Max Sites</label>
                                            <input type="number" min="1" value={formData.limites.sites} onChange={e => setFormData({ ...formData, limites: { ...formData.limites, sites: Number(e.target.value) } })} required />
                                        </div>
                                        <div className="form-group">
                                            <label><FileText size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} /> Max Baux</label>
                                            <input type="number" min="1" value={formData.limites.baux} onChange={e => setFormData({ ...formData, limites: { ...formData.limites, baux: Number(e.target.value) } })} required />
                                        </div>
                                        <div className="form-group">
                                            <label><Users size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} /> Max Utilisateurs</label>
                                            <input type="number" min="1" value={formData.limites.users} onChange={e => setFormData({ ...formData, limites: { ...formData.limites, users: Number(e.target.value) } })} required />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="secondary-btn" onClick={() => setShowModal(false)}>Annuler</button>
                                <button type="submit" className="primary-btn">{editingPlan ? 'Mettre à jour' : 'Créer le plan'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PlansPage;
