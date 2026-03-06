import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';
import { UserPlus, Trash2, Shield, Mail, Phone, Calendar } from 'lucide-react';
import './styles/NewItem.css'; // On réutilise le style des formulaires existants

interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    phone?: string;
    createdAt: string;
}

const Utilisateurs = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        role: 'GESTIONNAIRE',
        phone: '',
    });
    const [error, setError] = useState('');

    const fetchUsers = async () => {
        try {
            const response = await api.get('/users');
            setUsers(response.data.data);
        } catch (err) {
            console.error('Erreur chargement utilisateurs:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            await api.post('/users', formData);
            setShowForm(false);
            setFormData({ email: '', password: '', firstName: '', lastName: '', role: 'GESTIONNAIRE', phone: '' });
            fetchUsers();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Erreur lors de la création');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Voulez-vous vraiment supprimer cet utilisateur ?')) return;
        try {
            await api.delete(`/users/${id}`);
            fetchUsers();
        } catch (err) {
            alert('Erreur lors de la suppression');
        }
    };

    if (loading) return <div className="page-content">Chargement des utilisateurs...</div>;

    return (
        <div className="page-content">
            <div className="page-header">
                <div>
                    <h1 className="text-gradient">Gestion des Utilisateurs</h1>
                    <p className="text-muted">Créez et gérez les comptes d'accès à Serenova</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
                    <UserPlus size={20} />
                    <span>Nouvel Utilisateur</span>
                </button>
            </div>

            {showForm && (
                <div className="card" style={{ marginBottom: '2rem' }}>
                    <form onSubmit={handleSubmit} className="new-item-form">
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Prénom</label>
                                <input type="text" value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>Nom</label>
                                <input type="text" value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>Mot de passe</label>
                                <input type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>Téléphone</label>
                                <input type="text" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Rôle</label>
                                <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} required>
                                    <option value="ADMIN">ADMIN (Accès total)</option>
                                    <option value="GESTIONNAIRE">GESTIONNAIRE (Opérationnel)</option>
                                    <option value="CONCIERGE">CONCIERGE (Terrain)</option>
                                    <option value="LECTEUR">LECTEUR (Consultation)</option>
                                </select>
                            </div>
                        </div>
                        {error && <p style={{ color: 'var(--color-error)', marginTop: '1rem' }}>{error}</p>}
                        <div className="form-actions">
                            <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Annuler</button>
                            <button type="submit" className="btn btn-primary">Enregistrer</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="card">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Utilisateur</th>
                            <th>Rôle</th>
                            <th>Contact</th>
                            <th>Créé le</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u.id}>
                                <td>
                                    <div style={{ fontWeight: 600 }}>{u.firstName} {u.lastName}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{u.email}</div>
                                </td>
                                <td>
                                    <span className={`badge badge-${u.role.toLowerCase()}`}>
                                        <Shield size={12} style={{ marginRight: '4px' }} />
                                        {u.role}
                                    </span>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontSize: '0.85rem' }}><Mail size={12} /> {u.email}</span>
                                        {u.phone && <span style={{ fontSize: '0.85rem' }}><Phone size={12} /> {u.phone}</span>}
                                    </div>
                                </td>
                                <td>{new Date(u.createdAt).toLocaleDateString('fr-FR')}</td>
                                <td>
                                    <button className="btn-icon text-error" onClick={() => handleDelete(u.id)} title="Supprimer">
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Utilisateurs;
