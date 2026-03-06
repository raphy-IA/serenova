import { useEffect, useState } from 'react';
import { api } from '../context/AuthContext';
import { Loader2, Plus, Edit3, Trash2, Megaphone, AlertTriangle, Info, CheckCircle, Activity, X } from 'lucide-react';
import './AnnouncementsPage.css';

interface Announcement {
    id: string;
    titre: string;
    message: string;
    type: 'INFO' | 'WARNING' | 'MAINTENANCE' | 'SUCCESS';
    actif: boolean;
    createdAt: string;
}

const AnnouncementsPage = () => {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        id: '',
        titre: '',
        message: '',
        type: 'INFO',
        actif: true
    });

    const fetchAnnouncements = async () => {
        try {
            setLoading(true);
            const res = await api.get('/announcements');
            setAnnouncements(res.data.data);
            setError(null);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Erreur lors de la récupération des annonces');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await api.put(`/announcements/${formData.id}`, formData);
            } else {
                await api.post('/announcements', formData);
            }
            setShowModal(false);
            fetchAnnouncements();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Erreur lors de la sauvegarde');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette annonce ?')) return;
        try {
            await api.delete(`/announcements/${id}`);
            fetchAnnouncements();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Erreur lors de la suppression');
        }
    };

    const openCreateModal = () => {
        setIsEditing(false);
        setFormData({ id: '', titre: '', message: '', type: 'INFO', actif: true });
        setShowModal(true);
    };

    const openEditModal = (a: Announcement) => {
        setIsEditing(true);
        setFormData({ id: a.id, titre: a.titre, message: a.message, type: a.type, actif: a.actif });
        setShowModal(true);
    };

    const toggleStatus = async (a: Announcement) => {
        try {
            await api.put(`/announcements/${a.id}`, { actif: !a.actif });
            fetchAnnouncements();
        } catch (err: any) {
            alert('Erreur lors de la modification du statut');
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'WARNING': return <AlertTriangle size={20} color="var(--color-warning)" />;
            case 'MAINTENANCE': return <Activity size={20} color="var(--color-error)" />;
            case 'SUCCESS': return <CheckCircle size={20} color="var(--color-success)" />;
            default: return <Info size={20} color="var(--color-primary)" />;
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'WARNING': return 'var(--color-warning)';
            case 'MAINTENANCE': return 'var(--color-error)';
            case 'SUCCESS': return 'var(--color-success)';
            default: return 'var(--color-primary)';
        }
    };

    if (loading && announcements.length === 0) {
        return (
            <div className="loading-state">
                <Loader2 className="spinner" size={48} />
                <p>Chargement des annonces...</p>
            </div>
        );
    }

    return (
        <div className="announcements-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title"><Megaphone size={28} /> Annonces Globales</h1>
                    <p className="subtitle">Communiquez des informations importantes à tous les utilisateurs de la plateforme SÉRÉNOVA.</p>
                </div>
                <button className="primary-btn" onClick={openCreateModal}>
                    <Plus size={20} /> Nouvelle Annonce
                </button>
            </div>

            {error && <div className="error-banner">{error}</div>}

            <div className="announcements-grid">
                {announcements.map((a) => (
                    <div key={a.id} className={`announcement-card ${!a.actif ? 'inactive' : ''}`} style={{ borderLeft: `4px solid ${getTypeColor(a.type)}` }}>
                        <div className="card-header">
                            <div className="type-badge" style={{ color: getTypeColor(a.type), backgroundColor: `${getTypeColor(a.type)}20` }}>
                                {getTypeIcon(a.type)}
                                {a.type}
                            </div>
                            <div className="actions">
                                <button className={`status-toggle ${a.actif ? 'active' : ''}`} onClick={() => toggleStatus(a)}>
                                    {a.actif ? 'En ligne' : 'Brouillon'}
                                </button>
                                <button className="icon-btn" onClick={() => openEditModal(a)}><Edit3 size={16} /></button>
                                <button className="icon-btn delete" onClick={() => handleDelete(a.id)}><Trash2 size={16} /></button>
                            </div>
                        </div>
                        <h3 className="announcement-title">{a.titre}</h3>
                        <p className="announcement-message">{a.message}</p>
                        <div className="card-footer">
                            <span className="date">Créé le {new Date(a.createdAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-container">
                        <div className="modal-header">
                            <h2>{isEditing ? 'Modifier l\'annonce' : 'Nouvelle Annonce'}</h2>
                            <button className="close-btn" onClick={() => setShowModal(false)}><X size={24} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="announcement-form">
                            <div className="form-group">
                                <label>Titre de l'annonce</label>
                                <input
                                    type="text"
                                    value={formData.titre}
                                    onChange={e => setFormData({ ...formData, titre: e.target.value })}
                                    required
                                    placeholder="Ex: Mise à jour système majeure"
                                />
                            </div>

                            <div className="form-group">
                                <label>Message complet</label>
                                <textarea
                                    value={formData.message}
                                    onChange={e => setFormData({ ...formData, message: e.target.value })}
                                    required
                                    rows={4}
                                    placeholder="Détaillez votre information ici..."
                                ></textarea>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Type d'annonce</label>
                                    <select
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                                    >
                                        <option value="INFO">Information (Bleu)</option>
                                        <option value="SUCCESS">Succès (Vert)</option>
                                        <option value="WARNING">Avertissement (Orange)</option>
                                        <option value="MAINTENANCE">Maintenance / Urgent (Rouge)</option>
                                    </select>
                                </div>

                                <div className="form-group checkbox-group">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={formData.actif}
                                            onChange={e => setFormData({ ...formData, actif: e.target.checked })}
                                        />
                                        Activer immédiatement (Visible à tous)
                                    </label>
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="secondary-btn" onClick={() => setShowModal(false)}>Annuler</button>
                                <button type="submit" className="primary-btn">
                                    {isEditing ? 'Enregistrer les modifications' : 'Publier l\'annonce'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AnnouncementsPage;
