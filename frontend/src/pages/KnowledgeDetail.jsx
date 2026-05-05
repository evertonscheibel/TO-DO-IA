import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { ChevronLeft, Edit, Trash2, Download, Paperclip, X, Save, Plus, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function KnowledgeDetail() {
    const { id } = useParams();
    const isNew = id === 'new';
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(!isNew);
    const [editing, setEditing] = useState(isNew);
    const [saving, setSaving] = useState(false);
    
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        category: 'Geral',
        tags: ''
    });

    const fetchArticle = useCallback(async () => {
        try {
            const res = await api.get(`/knowledge/${id}`);
            const data = res.data.data.article;
            setArticle(data);
            setFormData({
                title: data.title,
                content: data.content,
                category: data.category,
                tags: data.tags.join(', ')
            });
        } catch (err) {
            console.error('Erro ao buscar artigo:', err);
            alert('Artigo não encontrado');
            navigate('/knowledge');
        } finally {
            setLoading(false);
        }
    }, [id, navigate]);

    useEffect(() => {
        if (!isNew) {
            fetchArticle();
        }
    }, [isNew, fetchArticle]);

    const handleSave = async () => {
        if (!formData.title || !formData.content) return alert('Título e conteúdo são obrigatórios');
        
        setSaving(true);
        try {
            const payload = {
                ...formData,
                tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean)
            };

            if (isNew) {
                const res = await api.post('/knowledge', payload);
                navigate(`/knowledge/${res.data.data.article._id}`);
            } else {
                const res = await api.patch(`/knowledge/${id}`, payload);
                setArticle(res.data.data.article);
                setEditing(false);
            }
        } catch (err) {
            console.error('Erro ao salvar artigo:', err);
            alert('Erro ao salvar artigo');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Tem certeza que deseja excluir este artigo?')) return;
        try {
            await api.delete(`/knowledge/${id}`);
            navigate('/knowledge');
        } catch (err) {
            console.error('Erro ao excluir artigo:', err);
        }
    };

    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        const formDataUpload = new FormData();
        files.forEach(file => formDataUpload.append('files', file));

        try {
            const res = await api.post(`/knowledge/${id}/attachments`, formDataUpload, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setArticle(prev => ({ ...prev, attachments: res.data.data.attachments }));
        } catch (err) {
            alert(err.response?.data?.error || 'Erro no upload');
        }
    };

    const handleDownload = (filename, originalName) => {
        const url = `${api.defaults.baseURL}/knowledge/download/${filename}`;
        // Create a hidden link to trigger download
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', originalName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) return <div className="page-loading"><div className="spinner"></div></div>;

    return (
        <div className="page">
            <div className="page-header" style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button className="btn-icon" onClick={() => navigate('/knowledge')}>
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <h1>{editing ? (isNew ? 'Novo Artigo' : 'Editar Artigo') : article?.title}</h1>
                        {!editing && <p>Base de Conhecimento / {article?.category}</p>}
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    {editing ? (
                        <>
                            <button className="btn btn-secondary" onClick={() => isNew ? navigate('/knowledge') : setEditing(false)} disabled={saving}>
                                Cancelar
                            </button>
                            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                                <Save size={20} /> Salvar
                            </button>
                        </>
                    ) : (
                        <>
                            <button className="btn btn-secondary" onClick={() => setEditing(true)}>
                                <Edit size={20} /> Editar
                            </button>
                            <button className="btn btn-danger" style={{ background: 'var(--red-light)', color: 'var(--red)', border: 'none', padding: '10px' }} onClick={handleDelete}>
                                <Trash2 size={20} />
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr 300px', gap: '24px' }}>
                <div className="dashboard-main-col">
                    <div className="dashboard-section" style={{ padding: '32px' }}>
                        {editing ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div className="form-group">
                                    <label>Título</label>
                                    <input 
                                        type="text" 
                                        value={formData.title} 
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="Ex: Como configurar o acesso VPN"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Categoria</label>
                                    <select 
                                        value={formData.category} 
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    >
                                        <option value="Geral">Geral</option>
                                        <option value="Procedimentos">Procedimentos</option>
                                        <option value="Tutoriais">Tutoriais</option>
                                        <option value="Políticas">Políticas</option>
                                        <option value="Documentação">Documentação</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Tags (separadas por vírgula)</label>
                                    <input 
                                        type="text" 
                                        value={formData.tags} 
                                        onChange={e => setFormData({ ...formData, tags: e.target.value })}
                                        placeholder="vpn, rede, suporte"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Conteúdo (Markdown suportado)</label>
                                    <textarea 
                                        style={{ minHeight: '400px' }}
                                        value={formData.content} 
                                        onChange={e => setFormData({ ...formData, content: e.target.value })}
                                        placeholder="Descreva o procedimento ou informação detalhadamente..."
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="markdown-content">
                                <ReactMarkdown>{article?.content}</ReactMarkdown>
                            </div>
                        )}
                    </div>
                </div>

                <div className="dashboard-sidebar-col">
                    <div className="dashboard-section">
                        <div className="section-header">
                            <Paperclip size={20} />
                            <h2>Anexos</h2>
                        </div>
                        
                        {!isNew && (
                            <div style={{ marginBottom: '16px' }}>
                                <input 
                                    type="file" 
                                    multiple 
                                    style={{ display: 'none' }} 
                                    ref={fileInputRef}
                                    onChange={handleFileUpload}
                                />
                                <button className="btn btn-secondary btn-block" onClick={() => fileInputRef.current.click()}>
                                    <Plus size={18} /> Adicionar Arquivos
                                </button>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px', textAlign: 'center' }}>
                                    Vídeos não permitidos. Máx 50MB.
                                </p>
                            </div>
                        )}

                        <div className="attachments-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {article?.attachments?.length === 0 && (
                                <p className="empty-text" style={{ padding: '20px 0' }}>Nenhum anexo</p>
                            )}
                            {article?.attachments?.map((att, idx) => (
                                <div key={idx} className="stat-card" style={{ padding: '12px', gap: '10px' }}>
                                    <FileText size={20} style={{ color: 'var(--blue)' }} />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ 
                                            margin: 0, 
                                            fontSize: '0.85rem', 
                                            fontWeight: '600',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis'
                                        }} title={att.originalName}>
                                            {att.originalName}
                                        </p>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                            {(att.size / 1024 / 1024).toFixed(2)} MB
                                        </span>
                                    </div>
                                    <button className="btn-icon" onClick={() => handleDownload(att.filename, att.originalName)}>
                                        <Download size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {!isNew && (
                        <div className="dashboard-section" style={{ marginTop: '20px' }}>
                            <div className="section-header">
                                <Tag size={20} />
                                <h2>Marcadores</h2>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {article?.tags?.map(tag => (
                                    <span key={tag} className="badge badge-blue">#{tag}</span>
                                ))}
                            </div>
                            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-light)' }}>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                                    Criado por <strong>{article?.createdBy?.name}</strong>
                                </p>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                                    Em {new Date(article?.createdAt).toLocaleDateString('pt-BR')}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
