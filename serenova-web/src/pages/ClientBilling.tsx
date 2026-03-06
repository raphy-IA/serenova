import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';
import { Loader2, CreditCard, Calendar, ArrowRight, ShieldCheck, FileText, AlertCircle } from 'lucide-react';

const ClientBilling = () => {
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'STRIPE' | 'MOBILE_MONEY'>('MOBILE_MONEY');
    const [subscription, setSubscription] = useState<any>(null);
    const [invoices, setInvoices] = useState<any[]>([]);

    useEffect(() => {
        fetchBillingData();
    }, []);

    const fetchBillingData = async () => {
        try {
            const [subRes, invRes] = await Promise.all([
                api.get('/billing/subscription'),
                api.get('/billing/invoices')
            ]);

            // Handle superadmin bypass
            if (subRes.data.data?.isSuperAdmin) {
                setSubscription({ isSuperAdmin: true });
            } else {
                setSubscription(subRes.data.data);
                setInvoices(invRes.data.data || []);
            }
        } catch (err) {
            console.error('Erreur lors du chargement des données de facturation', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCheckout = async () => {
        try {
            setProcessing(true);
            const res = await api.post('/billing/checkout', { paymentMethod });
            if (res.data?.data?.url) {
                window.location.href = res.data.data.url;
            }
        } catch (err: any) {
            alert(err.response?.data?.message || 'Erreur lors de l\'initialisation du paiement');
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
                <Loader2 className="spinner" size={48} color="var(--color-primary)" />
            </div>
        );
    }

    if (subscription?.isSuperAdmin) {
        return (
            <div className="page-container">
                <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
                    <ShieldCheck size={48} color="var(--color-primary)" style={{ margin: '0 auto 1rem' }} />
                    <h2>Espace Super Administrateur</h2>
                    <p style={{ color: 'var(--text-muted)' }}>La gestion des abonnements se fait via l'onglet "Clients" et "Abonnements".</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container" style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div className="page-header" style={{ marginBottom: '2rem' }}>
                <div>
                    <h1 className="page-title">Mon Abonnement & Factures</h1>
                    <p className="page-subtitle">Gérez votre formule SÉRÉNOVA et consultez votre historique de paiement.</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    {/* CURRENT PLAN CARD */}
                    <div className="card" style={{ padding: '2rem', borderTop: '4px solid var(--color-primary)', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: '-15px', right: '-15px', opacity: 0.05 }}>
                            <CreditCard size={150} />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', position: 'relative', zIndex: 1 }}>
                            <div>
                                <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                                    {subscription?.plan?.nom || 'Aucun forfait actif'}
                                </h2>
                                {subscription && (
                                    <span className={`status-pill ${subscription.statut.toLowerCase()}`}>
                                        {subscription.statut}
                                    </span>
                                )}
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                                    {(subscription?.plan?.prix || 0).toLocaleString()} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>FCFA</span>
                                </div>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                    / {subscription?.plan?.periodicite?.toLowerCase() || 'mois'}
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem', position: 'relative', zIndex: 1 }}>
                            <div>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Renouvellement automatique</p>
                                <p style={{ fontWeight: 600 }}>{subscription?.autoRenouvellement ? 'Activé' : 'Désactivé'}</p>
                            </div>
                            {subscription?.currentPeriodEnd && (
                                <div>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Prochaine échéance</p>
                                    <p style={{ fontWeight: 600 }}>{new Date(subscription.currentPeriodEnd).toLocaleDateString()}</p>
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', position: 'relative', zIndex: 1, flexDirection: 'column' }}>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <select
                                    className="form-input"
                                    style={{ flex: 1 }}
                                    value={paymentMethod}
                                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                                >
                                    <option value="MOBILE_MONEY">Mobile Money (OM / MoMo)</option>
                                    <option value="STRIPE">Carte Bancaire (Stripe)</option>
                                </select>
                                <button
                                    className="btn btn-primary"
                                    style={{ padding: '0.75rem 1.5rem', flex: 1, justifyContent: 'center' }}
                                    onClick={handleCheckout}
                                    disabled={processing}
                                >
                                    {processing ? 'Redirection...' : 'Payer l\'abonnement'}
                                </button>
                            </div>
                            <button className="btn btn-secondary" style={{ padding: '0.75rem 1.5rem', justifyContent: 'center' }}>
                                Changer de forfait
                            </button>
                        </div>
                    </div>

                    {/* INVOICES SECTION */}
                    <div className="card" style={{ padding: '2rem' }}>
                        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FileText size={18} color="var(--color-primary)" />
                            Historique des Factures
                        </h3>

                        {invoices.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '2rem', background: 'var(--bg-light)', borderRadius: '8px' }}>
                                <FileText size={32} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
                                <p style={{ color: 'var(--text-muted)', margin: 0 }}>Aucune facture disponible pour le moment.</p>
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Période</th>
                                            <th>Montant</th>
                                            <th>Méthode</th>
                                            <th>Statut</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {invoices.map((inv) => (
                                            <tr key={inv.id}>
                                                <td>{new Date(inv.createdAt).toLocaleDateString()}</td>
                                                <td>{new Date(inv.billingPeriodStart).toLocaleDateString()} - {new Date(inv.billingPeriodEnd).toLocaleDateString()}</td>
                                                <td><span style={{ fontWeight: 600 }}>{Number(inv.amount).toLocaleString()} FCFA</span></td>
                                                <td>{inv.paymentMethod || '-'}</td>
                                                <td>
                                                    <span className={`status-pill ${inv.status.toLowerCase()}`}>
                                                        {inv.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                </div>

                {/* SIDEBAR WIDGETS */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="card" style={{ padding: '1.5rem', background: 'rgba(59, 130, 246, 0.05)', border: '1px solid var(--border-light)' }}>
                        <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--color-primary)' }}>
                            <ShieldCheck size={18} />
                            Paiement Sécurisé
                        </h4>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                            Vos transactions sont protégées par les standards de sécurité les plus stricts de l'industrie (PCI-DSS). Nous acceptons les cartes bancaires et les paiements Mobile Money locaux.
                        </p>
                    </div>

                    {!subscription && !loading && (
                        <div className="card" style={{ padding: '1.5rem', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                            <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--color-danger)' }}>
                                <AlertCircle size={18} />
                                Abonnement requis
                            </h4>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                Votre accès pourrait être restreint. Veuillez souscrire à un forfait pour garantir la continuité de vos services.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ClientBilling;
