import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, useAuth } from '../context/AuthContext';
import { Building2, Plus, Mail, Phone, MapPin, Search, User, Users, Briefcase, Globe, Loader2, ArrowRight, Shield } from 'lucide-react';
import './Organisations.css';

interface Organisation {
    id: string;
    nom: string;
    type: 'SOCIETE' | 'INDIVIDU';
    email: string | null;
    telephone: string | null;
    adresse: string | null;
    statut: string;
    createdAt: string;
    _count: {
        users: number;
        sites: number;
    };
    subscription?: {
        plan?: {
            nom: string;
            prix: number;
        };
        statut: string;
    };
}

const Organisations = () => {
    const navigate = useNavigate();
    const { impersonate } = useAuth();
    const [organisations, setOrganisations] = useState<Organisation[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchOrganisations();
    }, []);

    const fetchOrganisations = async () => {
        try {
            const res = await api.get('/organisations');
            setOrganisations(res.data.data.organisations);
        } catch (err) {
            console.error('Erreur lors de la récupération des organisations', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredOrgs = organisations.filter(o =>
        o.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '1rem', color: 'var(--text-muted)' }}>
                <Loader2 className="spinner" size={48} />
                <p>Chargement des clients...</p>
            </div>
        );
    }

    return (
        <div className="organisations-page">
            <div className="page-header" style={{ marginBottom: '2.5rem' }}>
                <div>
                    <h1 className="page-title">Gestion des Clients</h1>
                    <p className="subtitle">Pilotez les entités immobilières de la plateforme Serenova</p>
                </div>
                <button className="btn btn-primary" onClick={() => navigate('/organisations/new')}>
                    <Plus size={20} />
                    <span>Nouveau Client</span>
                </button>
            </div>

            <div className="org-stats-grid">
                <div className="org-stat-card">
                    <div className="org-stat-label">Total Portefeuille</div>
                    <div className="org-stat-value">{organisations.length}</div>
                    <div className="org-stat-desc">
                        {organisations.filter(o => o.type === 'SOCIETE').length} Sociétés · {organisations.filter(o => o.type === 'INDIVIDU').length} Individus
                    </div>
                </div>
                <div className="org-stat-card">
                    <div className="org-stat-label">Clients Actifs</div>
                    <div className="org-stat-value" style={{ color: 'var(--color-success)' }}>
                        {organisations.filter(o => o.statut === 'ACTIF').length}
                    </div>
                    <div className="org-stat-desc">Opérationnels sur le système</div>
                </div>
                <div className="org-stat-card">
                    <div className="org-stat-label">Mise à jour</div>
                    <div className="org-stat-value" style={{ fontSize: '1.5rem', marginTop: '0.4rem' }}>{new Date().toLocaleDateString()}</div>
                    <div className="org-stat-desc">Dernier relevé système</div>
                </div>
            </div>

            <div className="org-table-wrapper">
                <div className="org-table-header">
                    <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Liste des Clients</h2>
                    <div className="org-search-container">
                        <Search size={18} className="org-search-icon" />
                        <input
                            type="text"
                            placeholder="Rechercher par nom ou email..."
                            className="org-search-input"
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
                                <th>Type</th>
                                <th>Contact & Localisation</th>
                                <th>Impact</th>
                                <th>Abonnement Actif</th>
                                <th>Statut</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrgs.map((org) => (
                                <tr key={org.id}>
                                    <td>
                                        <div className="entity-cell">
                                            <div className={`entity-icon-wrap ${org.type.toLowerCase()}`}>
                                                {org.type === 'SOCIETE' ? <Briefcase size={24} /> : <User size={24} />}
                                            </div>
                                            <div>
                                                <div className="entity-name">{org.nom}</div>
                                                <div className="entity-subtitle">Inscrit le {new Date(org.createdAt).toLocaleDateString()}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                            {org.type === 'SOCIETE' ? '🏢 SOCIÉTÉ' : '👤 INDIVIDU'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="contact-cell">
                                            {org.email && (
                                                <div className="contact-item">
                                                    <Mail size={14} /> <span>{org.email}</span>
                                                </div>
                                            )}
                                            {org.adresse && (
                                                <div className="contact-item">
                                                    <MapPin size={14} /> <span>{org.adresse}</span>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="impact-cell">
                                            <div className="impact-badge" title="Nombre de sites">
                                                <Building2 size={14} /> {org._count.sites}
                                            </div>
                                            <div className="impact-badge" title="Utilisateurs">
                                                <Users size={14} /> {org._count.users}
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        {org.subscription ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                                <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
                                                    {org.subscription.plan?.nom}
                                                </span>
                                                <span className={`status-pill ${org.subscription.statut.toLowerCase()}`} style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', alignSelf: 'flex-start' }}>
                                                    {org.subscription.statut}
                                                </span>
                                            </div>
                                        ) : (
                                            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>Aucun</span>
                                        )}
                                    </td>
                                    <td>
                                        <span className={`status-pill ${org.statut.toLowerCase()}`}>
                                            {org.statut}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                            <button
                                                className="btn btn-secondary btn-sm"
                                                style={{ borderRadius: '8px', padding: '0.4rem 0.6rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', border: '1px solid var(--border-light)' }}
                                                onClick={() => navigate(`/organisations/${org.id}`)}
                                                title="Détails et configuration"
                                            >
                                                Gérer
                                            </button>
                                            <button
                                                className="btn btn-primary btn-sm"
                                                style={{ borderRadius: '8px', padding: '0.4rem 0.6rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                                                onClick={() => impersonate(org.id, org.nom)}
                                                title="Entrer dans l'organisation"
                                            >
                                                <Shield size={14} /> Entrer
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredOrgs.length === 0 && (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: '5rem' }}>
                                        <div style={{ color: 'var(--text-muted)' }}>
                                            <Search size={48} style={{ opacity: 0.1, marginBottom: '1rem' }} />
                                            <p>Aucune entité ne correspond à votre recherche</p>
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

export default Organisations;
