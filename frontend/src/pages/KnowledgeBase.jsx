import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Search, Plus, Book, Tag, ChevronRight, Filter, FileText } from 'lucide-react';


export default function KnowledgeBase() {
    const [articles, setArticles] = useState([]);

    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const navigate = useNavigate();

    const fetchArticles = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/knowledge', {
                params: {
                    q: searchTerm,
                    category: categoryFilter
                }
            });
            setArticles(res.data.data.articles);
        } catch (err) {
            console.error('Erro ao buscar artigos:', err);
        } finally {
            setLoading(false);
        }
    }, [searchTerm, categoryFilter]);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchArticles();
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [fetchArticles]);

    const categories = ['Geral', 'Procedimentos', 'Tutoriais', 'Políticas', 'Documentação'];

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1>Base de Conhecimento</h1>
                    <p>Centralize e compartilhe informações importantes</p>
                </div>
                <button className="btn btn-primary" onClick={() => navigate('/knowledge/new')}>
                    <Plus size={20} /> Novo Artigo
                </button>
            </div>

            <div className="toolbar">
                <div className="search-bar">
                    <Search size={20} />
                    <input 
                        type="text" 
                        placeholder="Pesquisar por título, conteúdo ou tags..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="filter-group" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <Filter size={18} style={{ color: 'var(--text-muted)' }} />
                    <select 
                        className="form-group select" 
                        style={{ padding: '8px 12px', borderRadius: 'var(--radius)', border: '1.5px solid var(--border)' }}
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                        <option value="">Todas as Categorias</option>
                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="page-loading"><div className="spinner"></div></div>
            ) : (
                <div className="knowledge-grid" style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
                    gap: '20px', 
                    marginTop: '20px' 
                }}>
                    {articles.length === 0 && (
                        <div className="empty-text" style={{ gridColumn: '1 / -1' }}>
                            Nenhum artigo encontrado
                        </div>
                    )}
                    {articles.map(article => (
                        <div key={article._id} className="stat-card" style={{ 
                            flexDirection: 'column', 
                            alignItems: 'flex-start', 
                            cursor: 'pointer',
                            padding: '24px'
                        }} onClick={() => navigate(`/knowledge/${article._id}`)}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '12px' }}>
                                <div className="badge badge-blue">{article.category}</div>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                    {new Date(article.updatedAt).toLocaleDateString('pt-BR')}
                                </div>
                            </div>
                            <h3 style={{ margin: '0 0 10px 0', fontSize: '1.1rem', fontWeight: '700' }}>{article.title}</h3>
                            <p style={{ 
                                color: 'var(--text-secondary)', 
                                fontSize: '0.9rem', 
                                marginBottom: '16px',
                                display: '-webkit-box',
                                WebkitLineClamp: '3',
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden'
                            }}>
                                {article.content.replace(/[#*`]/g, '')}
                            </p>
                            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginTop: 'auto' }}>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                    {article.tags.slice(0, 3).map(tag => (
                                        <span key={tag} style={{ fontSize: '0.75rem', color: 'var(--blue)', background: 'var(--blue-light)', padding: '2px 8px', borderRadius: '12px' }}>
                                            #{tag}
                                        </span>
                                    ))}
                                    {article.tags.length > 3 && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>+{article.tags.length - 3}</span>}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--blue)', fontSize: '0.9rem', fontWeight: '600' }}>
                                    Ler mais <ChevronRight size={16} />
                                </div>
                            </div>
                            {article.attachments && article.attachments.length > 0 && (
                                <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                    <FileText size={14} /> {article.attachments.length} anexo(s)
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
