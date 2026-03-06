import { useEffect, useState } from 'react';
import { api } from '../context/AuthContext';
import { Loader2, Activity, Filter, Search, ChevronLeft, ChevronRight, FileText, UserCircle, Building2 } from 'lucide-react';
import './AuditLogsPage.css';

interface AuditLog {
    id: string;
    action: string;
    entityType: string | null;
    entityId: string | null;
    oldValue: any;
    newValue: any;
    metadata: any;
    createdAt: string;
    user: {
        firstName: string;
        lastName: string;
        email: string;
        role: string;
    } | null;
}

const AuditLogsPage = () => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Pagination & Filtres
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [actionFilter, setActionFilter] = useState('');
    const [entityFilter, setEntityFilter] = useState('');

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '50'
            });
            if (actionFilter) params.append('action', actionFilter);
            if (entityFilter) params.append('entityType', entityFilter);

            const res = await api.get(`/audit-logs?${params.toString()}`);
            setLogs(res.data.data);
            setTotalPages(res.data.pagination.pages);
            setError(null);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Erreur lors du chargement des logs');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [page, actionFilter, entityFilter]);

    const getActionBadge = (action: string) => {
        if (action.includes('CREATE')) return <span className="log-badge create">{action}</span>;
        if (action.includes('UPDATE')) return <span className="log-badge update">{action}</span>;
        if (action.includes('DELETE')) return <span className="log-badge delete">{action}</span>;
        if (action.includes('ASSIGN')) return <span className="log-badge assign">{action}</span>;
        return <span className="log-badge info">{action}</span>;
    };

    const renderDetails = (log: AuditLog) => {
        try {
            return (
                <div className="log-details-block">
                    {log.oldValue && (
                        <div className="log-old">
                            <strong>Ancien:</strong>
                            <pre>{JSON.stringify(log.oldValue, null, 2)}</pre>
                        </div>
                    )}
                    {log.newValue && (
                        <div className="log-new">
                            <strong>Nouveau:</strong>
                            <pre>{JSON.stringify(log.newValue, null, 2)}</pre>
                        </div>
                    )}
                    {log.metadata && (
                        <div className="log-meta">
                            <strong>Meta:</strong>
                            <pre>{JSON.stringify(log.metadata, null, 2)}</pre>
                        </div>
                    )}
                </div>
            );
        } catch (e) {
            return <span>Données complexes</span>;
        }
    };

    return (
        <div className="audit-logs-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title"><Activity size={28} /> Centre d'Audit (Logs)</h1>
                    <p className="subtitle">Traçabilité complète des actions sensibles effectuées sur la plateforme.</p>
                </div>
            </div>

            <div className="filters-bar glass-panel">
                <div className="filter-group">
                    <Filter size={18} color="var(--text-muted)" />
                    <select value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}>
                        <option value="">Toutes les actions</option>
                        <option value="USER_DELETED">USER_DELETED</option>
                        <option value="PLAN_CREATED">PLAN_CREATED</option>
                        <option value="PLAN_UPDATED">PLAN_UPDATED</option>
                        <option value="SUBSCRIPTION_ASSIGNED">SUBSCRIPTION_ASSIGNED</option>
                        <option value="SUBSCRIPTION_UPDATED">SUBSCRIPTION_UPDATED</option>
                    </select>
                </div>

                <div className="filter-group">
                    <Search size={18} color="var(--text-muted)" />
                    <input
                        type="text"
                        placeholder="Filtrer par Entité (ex: User, Plan)..."
                        value={entityFilter}
                        onChange={(e) => { setEntityFilter(e.target.value); setPage(1); }}
                    />
                </div>
            </div>

            {error ? (
                <div className="error-banner">{error}</div>
            ) : loading ? (
                <div className="loading-state">
                    <Loader2 className="spinner" size={48} />
                    <p>Chargement des logs d'audit...</p>
                </div>
            ) : (
                <div className="table-container glass-panel">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Date & Heure</th>
                                <th>Auteur</th>
                                <th>Action</th>
                                <th>Entité Modifiée</th>
                                <th>Détails JSON</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map((log) => (
                                <tr key={log.id}>
                                    <td className="log-date">
                                        {new Date(log.createdAt).toLocaleString('fr-FR', {
                                            day: '2-digit', month: 'short', year: 'numeric',
                                            hour: '2-digit', minute: '2-digit', second: '2-digit'
                                        })}
                                    </td>
                                    <td>
                                        {log.user ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <UserCircle size={16} color="var(--text-muted)" />
                                                <div>
                                                    <div style={{ fontWeight: 500 }}>{log.user.firstName} {log.user.lastName}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{log.user.role}</div>
                                                </div>
                                            </div>
                                        ) : (
                                            <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Système</span>
                                        )}
                                    </td>
                                    <td>{getActionBadge(log.action)}</td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500 }}>
                                            {log.entityType === 'Organisation' ? <Building2 size={14} /> : <FileText size={14} />}
                                            {log.entityType}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                                            ID: {log.entityId}
                                        </div>
                                    </td>
                                    <td className="details-cell">
                                        <details>
                                            <summary>Voir Pelo</summary>
                                            {renderDetails(log)}
                                        </details>
                                    </td>
                                </tr>
                            ))}
                            {logs.length === 0 && (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                        Aucun log trouvé pour ces filtres.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="pagination">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                            >
                                <ChevronLeft size={16} /> Précédent
                            </button>
                            <span>Page {page} sur {totalPages}</span>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                            >
                                Suivant <ChevronRight size={16} />
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AuditLogsPage;
