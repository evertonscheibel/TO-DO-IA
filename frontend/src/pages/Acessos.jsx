import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Search, Edit2, Trash2, X, Globe, User, Lock, Eye, EyeOff, Copy, Check, ShieldCheck, ExternalLink } from 'lucide-react';

export default function Acessos() {
    const { isAdmin } = useAuth();
    const [accesses, setAccesses] = useState([]);
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [showPassword, setShowPassword] = useState({});
    const [copiedId, setCopiedId] = useState(null);

    const [form, setForm] = useState({
        name: '', url: '', username: '', password: '', category: 'Servidor', notes: ''
    });

    const categories = ['Servidor', 'Site', 'Banco de Dados', 'API', 'Outro'];

    const loadAccesses = async () => {
        try {
            const res = await api.get('/accesses', { params: { q: search, category: categoryFilter } });
            setAccesses(res.data.data.accesses);
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        loadAccesses().finally(() => setLoading(false));
    }, [categoryFilter]);

    useEffect(() => {
        const timer = setTimeout(() => {
            loadAccesses();
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    const openModal = (access = null) => {
        if (access) {
            setEditing(access);
            setForm({
                name: access.name,
                url: access.url || '',
                username: access.username || '',
                password: access.password || '',
                category: access.category || 'Servidor',
                notes: access.notes || ''
            });
        } else {
            setEditing(null);
            setForm({ name: '', url: '', username: '', password: '', category: 'Servidor', notes: '' });
        }
        setModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editing) {
                await api.patch(`/accesses/${editing._id}`, form);
            } else {
                await api.post('/accesses', form);
            }
            setModalOpen(false);
            loadAccesses();
        } catch (err) {
            alert(err.response?.data?.error || 'Erro ao salvar');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Deseja remover este acesso?')) return;
        try {
            await api.delete(`/accesses/${id}`);
            loadAccesses();
        } catch (err) {
            alert(err.response?.data?.error || 'Erro ao remover');
        }
    };

    const togglePassword = (id) => {
        setShowPassword(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const copyToClipboard = (text, id, field) => {
        navigator.clipboard.writeText(text);
        setCopiedId(`${id}-${field}`);
        setTimeout(() => setCopiedId(null), 2000);
    };

    if (loading) return <div className="page-loading"><div className="spinner"></div></div>;

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1>Gestão de Acessos</h1>
                    <p>Servidores, sites e credenciais administrativas</p>
                </div>
                <button className="btn btn-primary" onClick={() => openModal()}>
                    <Plus size={18} /> Novo Acesso
                </button>
            </div>

            <div className="toolbar">
                <div className="search-bar">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por nome, URL, usuário..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <select
                    className="btn btn-secondary"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    style={{ height: '42px', padding: '0 12px' }}
                >
                    <option value="">Todas Categorias</option>
                    {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
            </div>

            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Nome / Categoria</th>
                            <th>URL / Endereço</th>
                            <th>Usuário</th>
                            <th>Senha</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {accesses.length === 0 && (
                            <tr><td colSpan="5" className="empty-text">Nenhum registro de acesso encontrado</td></tr>
                        )}
                        {accesses.map((a) => (
                            <tr key={a._id}>
                                <td>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span className="td-bold">{a.name}</span>
                                        <span className="badge badge-gray" style={{ width: 'fit-content', marginTop: '4px' }}>{a.category}</span>
                                    </div>
                                </td>
                                <td>
                                    {a.url ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontSize: '0.85rem' }}>{a.url}</span>
                                            <a href={a.url.startsWith('http') ? a.url : `http://${a.url}`} target="_blank" rel="noopener noreferrer" className="btn-icon">
                                                <ExternalLink size={14} />
                                            </a>
                                        </div>
                                    ) : '—'}
                                </td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span>{a.username || '—'}</span>
                                        {a.username && (
                                            <button className="btn-icon" onClick={() => copyToClipboard(a.username, a._id, 'user')}>
                                                {copiedId === `${a._id}-user` ? <Check size={14} color="var(--green)" /> : <Copy size={14} />}
                                            </button>
                                        )}
                                    </div>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontFamily: showPassword[a._id] ? 'inherit' : 'monospace' }}>
                                            {showPassword[a._id] ? a.password : '••••••••'}
                                        </span>
                                        <div style={{ display: 'flex', gap: '2px' }}>
                                            <button className="btn-icon" onClick={() => togglePassword(a._id)}>
                                                {showPassword[a._id] ? <EyeOff size={14} /> : <Eye size={14} />}
                                            </button>
                                            {a.password && (
                                                <button className="btn-icon" onClick={() => copyToClipboard(a.password, a._id, 'pass')}>
                                                    {copiedId === `${a._id}-pass` ? <Check size={14} color="var(--green)" /> : <Copy size={14} />}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <div className="actions">
                                        <button className="btn-icon" onClick={() => openModal(a)} title="Editar"><Edit2 size={16} /></button>
                                        <button className="btn-icon btn-icon-danger" onClick={() => handleDelete(a._id)} title="Remover"><Trash2 size={16} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {modalOpen && (
                <div className="modal-overlay" onClick={() => setModalOpen(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editing ? 'Editar Acesso' : 'Novo Registro de Acesso'}</h2>
                            <button className="btn-icon" onClick={() => setModalOpen(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="modal-body">
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Nome do Local/Servidor *</label>
                                    <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Servidor Produção" />
                                </div>
                                <div className="form-group">
                                    <label>Categoria</label>
                                    <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                                        {categories.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="form-group" style={{ marginTop: '16px' }}>
                                <label>URL ou Endereço IP</label>
                                <div style={{ position: 'relative' }}>
                                    <Globe size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                    <input style={{ paddingLeft: '40px' }} value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://exemplo.com ou 192.168.1.1" />
                                </div>
                            </div>
                            <div className="form-row" style={{ marginTop: '16px' }}>
                                <div className="form-group">
                                    <label>Usuário / Login</label>
                                    <div style={{ position: 'relative' }}>
                                        <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                        <input style={{ paddingLeft: '40px' }} value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Senha</label>
                                    <div style={{ position: 'relative' }}>
                                        <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                        <input type="text" style={{ paddingLeft: '40px' }} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                                    </div>
                                </div>
                            </div>
                            <div className="form-group" style={{ marginTop: '16px' }}>
                                <label>Observações / Detalhes de Acesso</label>
                                <textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Portas SSH, chaves PEM, IP de backup, etc." />
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
                                <button type="submit" className="btn btn-primary">{editing ? 'Salvar Alterações' : 'Criar Registro'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
