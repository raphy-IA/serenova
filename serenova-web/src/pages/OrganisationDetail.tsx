import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, useAuth } from '../context/AuthContext';
import {
    Building2, User, ChevronLeft, Mail, Phone, MapPin,
    Calendar, Shield, Users, LayoutDashboard, Settings,
    Loader2, AlertCircle, CheckCircle, MoreVertical, Edit3, Trash2, Plus, Server, FileText, Tag
} from 'lucide-react';
import './OrganisationDetail.css';

interface OrgUser {
    id: string;
    nom: string;
    email: string;
    role: string;
}

interface OrganisationDetails {
    id: string;
    nom: string;
    type: 'SOCIETE' | 'INDIVIDU';
    email: string | null;
    telephone: string | null;
    adresse: string | null;
    ville: string | null;
    statut: string;
    createdAt: string;
    users: OrgUser[];
    _count: {
        sites: number;
        locataires: number;
    };
    subscription?: {
        plan: {
            id: string;
            nom: string;
            limites: any;
        };
        statut: string;
        dateDebut: string;
    } | null;
}

const OrganisationDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { impersonate } = useAuth();
    const [org, setOrg] = useState<OrganisationDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [availablePlans, setAvailablePlans] = useState<any[]>([]);
    const [showPlanModal, setShowPlanModal] = useState(false);
    const [selectedPlanId, setSelectedPlanId] = useState('');

    useEffect(() => {
        fetchDetails();
    }, [id]);

    const fetchDetails = async () => {
        try {
            setLoading(true);
            const [orgRes, plansRes] = await Promise.all([
                api.get(`/organisations/${id}`),
                api.get('/plans')
            ]);
            setOrg(orgRes.data.data);
            setAvailablePlans(plansRes.data.data);
            if (orgRes.data.data.subscription) {
                setSelectedPlanId(orgRes.data.data.subscription.plan.id);
            }
            setError(null);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Erreur lors de la récupération des détails');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateSubscription = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.put(`/organisations/${id}/subscription`, {
                planId: selectedPlanId,
                statut: 'ACTIF'
            });
            setShowPlanModal(false);
            fetchDetails();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Erreur lors de la mise à jour de l\'abonnement');
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '1rem' }}>
                <Loader2 className="spinner" size={48} color="var(--color-primary)" />
                <p style={{ color: 'var(--text-muted)' }}>Chargement de l'organisation...</p>
            </div>
        );
    }

    if (error || !org) {
        return (
            <div className="organisation-detail-page">
                <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <AlertCircle size={24} />
                    <div>{error || 'Organisation introuvable'}</div>
                </div>
                <button className="btn btn-secondary" style={{ marginTop: '1rem' }} onClick={() => navigate('/organisations')}>
                    Retour à la liste
                </button>
            </div>
        );
    }

    return (
        <div className="organisation-detail-page">
            <div className="detail-header">
                <div className="header-left">
                    <button className="back-btn" onClick={() => navigate('/organisations')}>
                        <ChevronLeft size={24} />
                    </button>
                    <div className={`org-avatar-large ${org.type.toLowerCase()}`}>
                        {org.type === 'SOCIETE' ? <Building2 size={40} /> : <User size={40} />}
                    </div>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '2.25rem', fontWeight: 900, letterSpacing: '-0.02em' }}>{org.nom}</h1>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginTop: '0.5rem' }}>
                            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500 }}>
                                <Calendar size={16} /> Membre depuis le {new Date(org.createdAt).toLocaleDateString()}
                            </span>
                            <span className={`status-pill ${org.statut.toLowerCase()}`}>
                                <CheckCircle size={14} /> {org.statut}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="header-actions" style={{ display: 'flex', gap: '1rem' }}>
                    <button className="secondary-btn" onClick={() => navigate(`/organisations/edit/${org.id}`)}>
                        <Edit3 size={18} /> Modifier
                    </button>
                    <button className="primary-btn" onClick={() => impersonate(org.id, org.nom)}>
                        <Shield size={18} /> Entrer dans l'entité
                    </button>
                </div>
            </div>

            <div className="detail-grid">
                <div className="main-col">
                    <div className="info-card">
                        <div className="card-header">
                            <h3><Shield size={20} color="var(--color-secondary)" /> Informations Générales</h3>
                        </div>
                        <div className="card-body">
                            <div className="info-grid">
                                <div className="info-item">
                                    <label><User size={14} /> Nom / Raison Sociale</label>
                                    <div className="value">{org.nom}</div>
                                </div>
                                <div className="info-item">
                                    <label><Building2 size={14} /> Type de client</label>
                                    <div className="value">
                                        {org.type === 'SOCIETE' ? 'Personne Morale (Société)' : 'Personne Physique (Individu)'}
                                    </div>
                                </div>
                                <div className="info-item">
                                    <label><Mail size={14} /> Email principal</label>
                                    <div className="value">{org.email || 'Non renseigné'}</div>
                                </div>
                                <div className="info-item">
                                    <label><Phone size={14} /> Téléphone</label>
                                    <div className="value">{org.telephone || 'Non renseigné'}</div>
                                </div>
                                <div className="info-item" style={{ gridColumn: 'span 2' }}>
                                    <label><MapPin size={14} /> Adresse physique</label>
                                    <div className="value">
                                        {org.adresse || 'N/A'} {org.ville && `, ${org.ville}`}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Nouvelle Carte Abonnement */}
                    <div className="info-card">
                        <div className="card-header">
                            <h3><Tag size={20} color="var(--color-secondary)" /> Abonnement & Limites</h3>
                            <button className="primary-btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => setShowPlanModal(true)}>
                                <Edit3 size={16} /> Changer
                            </button>
                        </div>
                        <div className="card-body">
                            {org.subscription ? (
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-light)' }}>
                                        <div>
                                            <h4 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)' }}>Plan {org.subscription.plan.nom}</h4>
                                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Actif depuis le {new Date(org.subscription.dateDebut).toLocaleDateString()}</span>
                                        </div>
                                        <span className={`status-pill ${org.subscription.statut.toLowerCase()}`}>{org.subscription.statut}</span>
                                    </div>

                                    <h5 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem', textTransform: 'uppercase' }}>Consommation des ressources</h5>

                                    <div className="info-grid">
                                        <div className="info-item">
                                            <label><Server size={14} /> Sites</label>
                                            <div className="value" style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                                                <span style={{ fontSize: '1.5rem', fontWeight: 800 }}>{org._count.sites}</span>
                                                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>/ {org.subscription.plan.limites.sites >= 9999 ? 'Illimité' : org.subscription.plan.limites.sites}</span>
                                            </div>
                                        </div>

                                        <div className="info-item">
                                            <label><Users size={14} /> Utilisateurs</label>
                                            <div className="value" style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                                                <span style={{ fontSize: '1.5rem', fontWeight: 800 }}>{org.users.length}</span>
                                                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>/ {org.subscription.plan.limites.users >= 9999 ? 'Illimité' : org.subscription.plan.limites.users}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                    <AlertCircle size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                                    <p>Aucun abonnement actif. Cette organisation ne peut pas opérer.</p>
                                    <button className="primary-btn" style={{ marginTop: '1rem' }} onClick={() => setShowPlanModal(true)}>Assigner un plan</button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="info-card">
                        <div className="card-header">
                            <h3><Users size={20} color="var(--color-secondary)" /> Utilisateurs rattachés</h3>
                            <button className="secondary-btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}><Plus size={16} /> Ajouter</button>
                        </div>
                        <div className="card-body">
                            {org.users.length > 0 ? (
                                <div className="user-list">
                                    {org.users.map(user => (
                                        <div key={user.id} className="user-item">
                                            <div className="user-info">
                                                <div className="user-avatar">
                                                    {user.nom.charAt(0)}
                                                </div>
                                                <div className="user-details">
                                                    <div className="name">{user.nom}</div>
                                                    <div className="email">{user.email}</div>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                                                <span className="user-role">{user.role}</span>
                                                <button className="action-btn" style={{ background: 'var(--bg-subtle)' }}>
                                                    <MoreVertical size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                    <Users size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                                    <p>Aucun utilisateur rattaché à cette organisation.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="side-col">
                    <div className="info-card">
                        <div className="card-header">
                            <h3><LayoutDashboard size={20} color="var(--color-secondary)" /> Aperçu Système</h3>
                        </div>
                        <div className="card-body">
                            <div className="quick-stats">
                                <div className="q-stat">
                                    <span className="val">{org._count.sites}</span>
                                    <span className="lbl">Sites</span>
                                </div>
                                <div className="q-stat">
                                    <span className="val">{org._count.locataires}</span>
                                    <span className="lbl">Locataires</span>
                                </div>
                            </div>

                            <div style={{ marginTop: '2.5rem' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions Rapides</label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.25rem' }}>
                                    <button className="secondary-btn" style={{ justifyContent: 'flex-start', borderStyle: 'dashed', width: '100%', paddingLeft: '1.25rem' }}>
                                        <Plus size={18} /> Créer un site
                                    </button>
                                    <button className="danger-btn" style={{ justifyContent: 'flex-start', width: '100%', paddingLeft: '1.25rem', background: 'transparent' }}>
                                        <Shield size={18} /> Suspendre l'accès
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="status-card-verified">
                        <h4>
                            <CheckCircle size={24} /> Statut Vérifié
                        </h4>
                        <p style={{ marginTop: '1rem' }}>
                            Cette organisation est active et peut accéder à toutes ses données immobilières en temps réel.
                        </p>
                    </div>
                </div>
            </div>

            {/* Modal d'assignation de plan */}
            {showPlanModal && (
                <div className="modal-overlay">
                    <div className="modal-container" style={{ width: '500px' }}>
                        <h2>Gérer l'abonnement</h2>
                        <form onSubmit={handleUpdateSubscription}>
                            <div className="form-group" style={{ margin: '2rem 0' }}>
                                <label>Sélectionner un Plan</label>
                                <select value={selectedPlanId} onChange={e => setSelectedPlanId(e.target.value)} required style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                                    <option value="" disabled>-- Choisir un plan --</option>
                                    {availablePlans.map(plan => (
                                        <option key={plan.id} value={plan.id}>
                                            {plan.nom} ({new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(plan.prix)}/{plan.periodicite === 'MENSUEL' ? 'mois' : 'an'})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                <button type="button" className="secondary-btn" onClick={() => setShowPlanModal(false)}>Annuler</button>
                                <button type="submit" className="primary-btn" disabled={!selectedPlanId}>Mettre à jour</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrganisationDetail;
