import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';
import { Settings, Save, Lock, Wallet, Loader2, Link2, CreditCard } from 'lucide-react';

const PaymentSettings = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [config, setConfig] = useState({
        stripePublicKey: '',
        stripeSecretKey: '',
        stripeWebhookSecret: '',
        momoApiKey: '',
        momoApiSecret: '',
        momoMerchantId: '',
        paypalClientId: '',
        paypalSecret: ''
    });

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const res = await api.get('/admin/config/payments');
            const data = res.data.data;
            if (data) {
                setConfig({
                    stripePublicKey: data.stripePublicKey || '',
                    stripeSecretKey: data.stripeSecretKey || '',
                    stripeWebhookSecret: data.stripeWebhookSecret || '',
                    momoApiKey: data.momoApiKey || '',
                    momoApiSecret: data.momoApiSecret || '',
                    momoMerchantId: data.momoMerchantId || '',
                    paypalClientId: data.paypalClientId || '',
                    paypalSecret: data.paypalSecret || ''
                });
            }
        } catch (err) {
            console.error('Erreur lors du chargement de la configuration', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.put('/admin/config/payments', config);
            alert('Configuration enregistrée avec succès.');
        } catch (err: any) {
            alert(err.response?.data?.message || 'Erreur lors de l\'enregistrement');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
                <Loader2 className="spinner" size={48} color="var(--color-primary)" />
            </div>
        );
    }

    return (
        <div className="page-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div className="page-header" style={{ marginBottom: '2rem' }}>
                <div>
                    <h1 className="page-title">Paramètres de Paiement (SaaS)</h1>
                    <p className="page-subtitle">Configurez ici les clés API de vos différentes passerelles pour l'encaissement automatique des abonnements.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                {/* STRIPE */}
                <div className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <CreditCard size={20} color="#635bff" />
                        Configuration Stripe (Cartes Bancaires)
                    </h3>
                    <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
                        <div className="form-group">
                            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Link2 size={16} /> Clé Publique (Publishable Key)
                            </label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="pk_test_..."
                                value={config.stripePublicKey}
                                onChange={(e) => setConfig({ ...config, stripePublicKey: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Lock size={16} /> Clé Secrète (Secret Key)
                            </label>
                            <input
                                type="password"
                                className="form-input"
                                placeholder="sk_test_..."
                                value={config.stripeSecretKey}
                                onChange={(e) => setConfig({ ...config, stripeSecretKey: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Lock size={16} /> Signature Webhook (Webhook Secret)
                            </label>
                            <input
                                type="password"
                                className="form-input"
                                placeholder="whsec_..."
                                value={config.stripeWebhookSecret}
                                onChange={(e) => setConfig({ ...config, stripeWebhookSecret: e.target.value })}
                            />
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                                Utilisé pour valider automatiquement les paiements et activer les abonnements.
                            </p>
                        </div>
                    </div>
                </div>

                {/* MOBILE MONEY */}
                <div className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Wallet size={20} color="#ff6600" />
                        Configuration Mobile Money (OM / MoMo)
                    </h3>
                    <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
                        <div className="form-group">
                            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Settings size={16} /> API Key (Agrégateur)
                            </label>
                            <input
                                type="text"
                                className="form-input"
                                value={config.momoApiKey}
                                onChange={(e) => setConfig({ ...config, momoApiKey: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Lock size={16} /> API Secret
                            </label>
                            <input
                                type="password"
                                className="form-input"
                                value={config.momoApiSecret}
                                onChange={(e) => setConfig({ ...config, momoApiSecret: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Link2 size={16} /> Identifiant Marchand (Merchant ID)
                            </label>
                            <input
                                type="text"
                                className="form-input"
                                value={config.momoMerchantId}
                                onChange={(e) => setConfig({ ...config, momoMerchantId: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                {/* PAYPAL */}
                <div className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Wallet size={20} color="#003087" />
                        Configuration PayPal
                    </h3>
                    <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
                        <div className="form-group">
                            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Link2 size={16} /> Client ID
                            </label>
                            <input
                                type="text"
                                className="form-input"
                                value={config.paypalClientId}
                                onChange={(e) => setConfig({ ...config, paypalClientId: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Lock size={16} /> Client Secret
                            </label>
                            <input
                                type="password"
                                className="form-input"
                                value={config.paypalSecret}
                                onChange={(e) => setConfig({ ...config, paypalSecret: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                <div style={{ position: 'sticky', bottom: '20px', display: 'flex', justifyContent: 'flex-end', zIndex: 10 }}>
                    <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 2rem', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }} disabled={saving}>
                        <Save size={20} style={{ marginRight: '0.5rem' }} />
                        {saving ? 'Enregistrement...' : 'Enregistrer la Configuration'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default PaymentSettings;
