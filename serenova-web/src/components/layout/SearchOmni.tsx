import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, Building2, User, FileText, X } from 'lucide-react';
import { api } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const SearchOmni = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (query.length >= 2) {
                setLoading(true);
                try {
                    const res = await api.get(`/search?q=${query}`);
                    setResults(res.data.data);
                    setOpen(true);
                } catch (err) {
                    console.error('Search error:', err);
                } finally {
                    setLoading(false);
                }
            } else {
                setResults([]);
                setOpen(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const getIcon = (type: string) => {
        switch (type) {
            case 'SITE': return <Building2 size={16} />;
            case 'LOCATAIRE': return <User size={16} />;
            case 'BAIL': return <FileText size={16} />;
            default: return <Search size={16} />;
        }
    };

    return (
        <div className="search-omni-container" ref={containerRef} style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
            <div className="header-search" style={{ position: 'relative' }}>
                <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                    type="text"
                    placeholder="Omnisearch (Sites, Locataires...)"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => query.length >= 2 && setOpen(true)}
                    style={{ paddingLeft: '40px', width: '100%' }}
                />
                {query && (
                    <button
                        onClick={() => setQuery('')}
                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                    >
                        <X size={16} />
                    </button>
                )}
            </div>

            {open && (
                <div className="search-results glass-panel" style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    left: 0,
                    right: 0,
                    zIndex: 2000,
                    maxHeight: '400px',
                    overflowY: 'auto',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                    padding: '0.5rem'
                }}>
                    {loading ? (
                        <div style={{ padding: '1rem', textAlign: 'center' }}>
                            <Loader2 className="spinner" size={20} color="var(--color-primary)" />
                        </div>
                    ) : results.length === 0 ? (
                        <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            Aucun résultat pour "{query}"
                        </div>
                    ) : (
                        <div>
                            {results.map((item, idx) => (
                                <div
                                    key={`${item.type}-${item.id}-${idx}`}
                                    onClick={() => {
                                        navigate(item.link);
                                        setOpen(false);
                                        setQuery('');
                                    }}
                                    className="search-result-item"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem',
                                        padding: '0.75rem',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        transition: 'background 0.2s'
                                    }}
                                >
                                    <div style={{
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '6px',
                                        background: 'rgba(var(--color-primary-rgb), 0.1)',
                                        color: 'var(--color-primary)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        {getIcon(item.type)}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{item.title}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.subtitle}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SearchOmni;
