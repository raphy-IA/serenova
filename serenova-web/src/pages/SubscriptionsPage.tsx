import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../context/AuthContext';
import { Loader2, Tag, Search, CreditCard, Building2, Calendar, MoreVertical, Settings } from 'lucide-react';
import './SubscriptionsPage.css';

interface SubscriptionData {
    id: string;
    statut: 'ACTIF' | 'SUSPENDU' | 'EXPIRE' | 'RESILIE';
    autoRenouvellement: boolean;
    dateDebut: string;
    dateFin: string | null;
    organisation: {
        id: string;
        nom: string;
        type: string;
        email: string;
        statut: string;
    };
    plan: {
        id: string;
        nom: string;
        prix: number;
        intervalle: string;
    };
}

const SubscriptionsPage = () => {
    const navigate = useNavigate();
    const [subscriptions, setSubscriptions] = useState<SubscriptionData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchSubscriptions();
    }, []);

    const fetchSubscriptions = async () => {
        try {
            const res = await api.get('/organisations/abonnements/all');
            setSubscriptions(res.data.data || []);
        } catch (err) {
            console.error('Erreur lors de la récupération des abonnements', err);
            setSubscriptions([]);
        } finally {
            setLoading(false);
        }
    };

    const filteredSubs = (subscriptions || []).filter(sub =>
        (sub.organisation?.nom || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sub.plan?.nom || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const metrics = {
        total: (subscriptions || []).length,
        actifs: (subscriptions || []).filter(s => s.statut === 'ACTIF').length,
        suspendus: (subscriptions || []).filter(s => s.statut === 'SUSPENDU').length,
        mrr: (subscriptions || []).filter(s => s.statut === 'ACTIF').reduce((acc, sub) => {
            return acc + Number(sub.plan?.prix || 0);
        }, 0)
    };

    if (loading) {
        return (
            <div className="loading-state">
                <Loader2 className="spinner" size={48} />
                <p>Chargement du centre d'abonnements...</p>
            </div>
        );
    }

    return (
        <div className="subscriptions-page">
            <div className="page-header" style={{ marginBottom: '2.5rem' }}>
                <div>
                    <h1 className="page-title"><CreditCard size={28} style={{ marginRight: '10px', verticalAlign: 'bottom' }} /> Pilotage des Abonnements</h1>
                    <p className="subtitle">Vue centralisée sur la souscription et la facturation de tous les clients.</p>
                </div>
            </div>

            <div className="metrics-grid">
                <div className="metric-card">
                    <div className="metric-label">Total Abonnements</div>
                    <div className="metric-value">{metrics.total}</div>
                </div>
                <div className="metric-card">
                    <div className="metric-label">Abonnements Actifs</div>
                    <div className="metric-value" style={{ color: 'var(--color-success)' }}>{metrics.actifs}</div>
                </div>
                <div className="metric-card">
                    <div className="metric-label">Abonnements Suspendus</div>
                    <div className="metric-value" style={{ color: 'var(--color-warning)' }}>{metrics.suspendus}</div>
                </div>
                <div className="metric-card mrr-card">
                    <div className="metric-label">MRR Estimé</div>
                    <div className="metric-value">{metrics.mrr.toLocaleString()} FCFA</div>
                </div>
            </div>

            <div className="subs-table-wrapper">
                <div className="subs-table-header">
                    <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Tous les Abonnements</h2>
                    <div className="subs-search-container">
                        <Search size={18} className="subs-search-icon" />
                        <input
                            type="text"
                            placeholder="Rechercher par client ou plan..."
                            className="subs-search-input"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table className="premium-table">
                        <thead>
                            <tr>
                                <th>Client</th>
                                <th>Plan Souscrit</th>
                                <th>Cycle & Période</th>
                                <th>Montant</th>
                                <th>Statut</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSubs.map((sub) => (
                                <tr key={sub.id}>
                                    <td>
                                        <div className="entity-cell">
                                            <div className="entity-icon-wrap societe">
                                                <Building2 size={20} />
                                            </div>
                                            <div>
                                                <div className="entity-name">{sub.organisation?.nom || 'Inconnu'}</div>
                                                <div className="entity-subtitle">{sub.organisation?.email || 'Sans email'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Tag size={16} color="var(--color-primary)" />
                                            <span style={{ fontWeight: 600 }}>{sub.plan?.nom || 'Inconnu'}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="date-block">
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                                                Depuis le {sub.dateDebut ? new Date(sub.dateDebut).toLocaleDateString() : 'N/A'}
                                            </div>
                                            {sub.autoRenouvellement && (
                                                <div style={{ fontSize: '0.75rem', color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                                                    <Calendar size={12} /> Renouvellement Auto
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                                            {(sub.plan?.prix || 0).toLocaleString()} FCFA
                                        </span>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                            /{sub.plan?.intervalle?.toLowerCase() || 'mois'}
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`status-pill ${sub.statut?.toLowerCase() || 'inconnu'}`}>
                                            {sub.statut || 'INCONNU'}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <button
                                            className="btn btn-secondary btn-sm"
                                            style={{ borderRadius: '8px', padding: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', border: '1px solid var(--border-light)' }}
                                            onClick={() => navigate(`/abonnements/${sub.organisation?.id}`)}
                                            title="Gérer l'abonnement du client"
                                            disabled={!sub.organisation?.id}
                                        >
                                            <Settings size={16} /> Gérer
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredSubs.length === 0 && (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: '5rem' }}>
                                        <div style={{ color: 'var(--text-muted)' }}>
                                            <CreditCard size={48} style={{ opacity: 0.1, marginBottom: '1rem' }} />
                                            <p>Aucun abonnement trouvé pour cette recherche</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SubscriptionsPage;
