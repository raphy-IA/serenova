import React, { useState, useEffect } from 'react';
import { api } from '../../context/AuthContext';
import { Loader2, TrendingUp } from 'lucide-react';

const QuotaWidget = () => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<{
        usage: { sites: number; baux: number; users: number };
        subscription: any;
    } | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [usageRes, subRes] = await Promise.all([
                    api.get('/billing/usage'),
                    api.get('/billing/subscription')
                ]);
                setData({
                    usage: usageRes.data.data,
                    subscription: subRes.data.data
                });
            } catch (err) {
                console.error('Erreur quota:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return null;
    if (!data?.subscription?.plan) return null;

    const plan = data.subscription.plan;
    const limits = plan.limites as { sites?: number; baux?: number; users?: number };

    // On se concentre sur les sites pour le widget compact
    const current = data.usage.sites;
    const max = limits.sites || 0;
    const percentage = max > 0 ? Math.min(Math.round((current / max) * 100), 100) : 0;
    const isFull = percentage >= 90;

    return (
        <div className="quota-widget" style={{
            padding: '1rem',
            margin: '0.5rem 1rem 1rem',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.75rem' }}>
                <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <TrendingUp size={12} /> Usage Sites
                </span>
                <span style={{ fontWeight: 600, color: isFull ? 'var(--color-warning)' : 'inherit' }}>
                    {current} / {max >= 9999 ? '∞' : max}
                </span>
            </div>

            <div style={{ height: '6px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{
                    height: '100%',
                    width: `${percentage}%`,
                    background: isFull ? 'var(--color-warning)' : 'var(--color-primary)',
                    transition: 'width 0.5s ease-out'
                }} />
            </div>

            {isFull && (
                <div style={{ fontSize: '0.65rem', color: 'var(--color-warning)', marginTop: '0.5rem', textAlign: 'center' }}>
                    Limite presque atteinte !
                </div>
            )}
        </div>
    );
};

export default QuotaWidget;
