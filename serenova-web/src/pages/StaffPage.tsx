import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';
import { Shield, Plus, Trash2, Mail, Phone, User, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import './StaffPage.css';

interface StaffMember {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: 'SUPER_ADMIN' | 'SUPPORT';
    phone?: string;
    createdAt: string;
}

const StaffPage = () => {
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        role: 'SUPPORT' as 'SUPER_ADMIN' | 'SUPPORT',
        phone: ''
    });

    useEffect(() => {
        fetchStaff();
    }, []);

    const fetchStaff = async () => {
        try {
            setLoading(true);
            const res = await api.get('/staff');
            setStaff(res.data.data);
            setError(null);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Erreur lors du chargement de l\'équipe');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/staff', formData);
            setShowModal(false);
            setFormData({ email: '', password: '', firstName: '', lastName: '', role: 'SUPPORT', phone: '' });
            fetchStaff();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Erreur lors de la création');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Supprimer ce membre du staff ?')) return;
        try {
            await api.delete(`/staff/${id}`);
            fetchStaff();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Erreur lors de la suppression');
        }
    };

    if (loading) return (
        <div className="loading-state">
            <Loader2 className="spinner" size={48} />
            <p>Chargement de l'équipe plateforme...</p>
        </div>
    );

    return (
        <div className="staff-page">
            <div className="staff-header">
                <div>
                    <h1 className="text-gradient">Équipe Plateforme</h1>
                    <p className="text-muted">Gérez les administrateurs et le support global du système</p>
                </div>
                <button className="primary-btn" onClick={() => setShowModal(true)}>
                    <Plus size={20} /> Nouveau Membre
                </button>
            </div>

            {error && (
                <div className="alert alert-danger">
                    <AlertCircle size={20} /> {error}
                </div>
            )}

            <div className="staff-grid">
                {staff.map((member) => (
                    <div key={member.id} className="staff-card">
                        <div className="staff-card-header">
                            <div className="staff-avatar">
                                {member.firstName.charAt(0)}{member.lastName.charAt(0)}
                            </div>
                            <div className={`role-badge ${member.role.toLowerCase()}`}>
                                {member.role}
                            </div>
                        </div>
                        <div className="staff-card-body">
                            <h3>{member.firstName} {member.lastName}</h3>
                            <div className="staff-info-item">
                                <Mail size={16} /> {member.email}
                            </div>
                            {member.phone && (
                                <div className="staff-info-item">
                                    <Phone size={16} /> {member.phone}
                                </div>
                            )}
                        </div>
                        <div className="staff-card-footer">
                            <span className="date">Inscrit le {new Date(member.createdAt).toLocaleDateString()}</span>
                            <button className="delete-btn" onClick={() => handleDelete(member.id)}>
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-container">
                        <h2>Ajouter un membre au staff</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Prénom</label>
                                    <input type="text" value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>Nom</label>
                                    <input type="text" value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} required />
                                </div>
                                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                    <label>Email</label>
                                    <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
                                </div>
                                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                    <label>Mot de passe</label>
                                    <input type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>Rôle</label>
                                    <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value as any })}>
                                        <option value="SUPPORT">SUPPORT</option>
                                        <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Téléphone (Optionnel)</label>
                                    <input type="text" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="secondary-btn" onClick={() => setShowModal(false)}>Annuler</button>
                                <button type="submit" className="primary-btn">Créer le compte</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StaffPage;
