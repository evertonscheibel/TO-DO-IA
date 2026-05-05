import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Search, Edit2, Trash2, X } from 'lucide-react';

export default function Prestadores() {
    const { isAdmin } = useAuth();
    const [providers, setProviders] = useState([]);
    const [managers, setManagers] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({
        name: '', cnpj: '', email: '', phone: '', specialty: '', status: 'ativo', notes: '', managerId: ''
    });

    // Pagination state
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const limit = 50;

    const loadProviders = async () => {
        try {
            const res = await api.get('/providers', { params: { q: search, page, limit } });
            setProviders(res.data.data.providers);
            setTotalPages(Math.ceil(res.data.data.total / limit));
        } catch (err) { console.error(err); }
    };

    const loadManagers = async () => {
        if (!isAdmin) return;
        try {
            const res = await api.get('/users', { params: { role: 'gestor', status: 'ativo', limit: 200 } });
            setManagers(res.data.data.users);
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        Promise.all([loadProviders(), loadManagers()]).finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            setPage(1);
            loadProviders();
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        loadProviders();
    }, [page]);

    const openModal = (provider = null) => {
        if (provider) {
            setEditing(provider);
            setForm({
                name: provider.name, cnpj: provider.cnpj, email: provider.email || '',
                phone: provider.phone || '', specialty: provider.specialty || '',
                status: provider.status, notes: provider.notes || '',
                managerId: provider.managerId?._id || ''
            });
        } else {
            setEditing(null);
            setForm({ name: '', cnpj: '', email: '', phone: '', specialty: '', status: 'ativo', notes: '', managerId: '' });
        }
        setModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...form };
            if (!isAdmin) delete payload.managerId;
            if (payload.managerId === '') payload.managerId = null;

            if (editing) {
                await api.patch(`/providers/${editing._id}`, payload);
            } else {
                await api.post('/providers', payload);
            }
            setModalOpen(false);
            loadProviders();
        } catch (err) {
            alert(err.response?.data?.error || 'Erro ao salvar');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Deseja remover este prestador?')) return;
        try {
            await api.delete(`/providers/${id}`);
            loadProviders();
        } catch (err) {
            alert(err.response?.data?.error || 'Erro ao remover');
        }
    };

    if (loading) return <div className="page-loading"><div className="spinner"></div></div>;

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1>Contratantes</h1>
                    <p>Gerenciamento de contratantes PJ</p>
                </div>
                <button className="btn btn-primary" onClick={() => openModal()}>
                    <Plus size={18} /> Novo Contratante
                </button>
            </div>

            <div className="search-bar">
                <Search size={18} />
                <input
                    type="text"
                    placeholder="Buscar por nome ou CNPJ..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>CNPJ</th>
                            <th>Especialidade</th>
                            <th>Status</th>
                            {isAdmin && <th>Gestor</th>}
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {providers.length === 0 && (
                            <tr><td colSpan={isAdmin ? 6 : 5} className="empty-text">Nenhum contratante encontrado</td></tr>
                        )}
                        {providers.map((p) => (
                            <tr key={p._id}>
                                <td className="td-bold">{p.name}</td>
                                <td>{p.cnpj}</td>
                                <td>{p.specialty || '—'}</td>
                                <td>
                                    <span className={`badge badge-${p.status === 'ativo' ? 'green' : 'gray'}`}>
                                        {p.status}
                                    </span>
                                </td>
                                {isAdmin && <td>{p.managerId?.name || '—'}</td>}
                                <td>
                                    <div className="actions">
                                        <button className="btn-icon" onClick={() => openModal(p)} title="Editar"><Edit2 size={16} /></button>
                                        <button className="btn-icon btn-icon-danger" onClick={() => handleDelete(p._id)} title="Remover"><Trash2 size={16} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="pagination">
                    <button
                        className="btn btn-sm btn-secondary"
                        disabled={page === 1}
                        onClick={() => setPage(p => p - 1)}
                    >
                        Anterior
                    </button>
                    <span className="pagination-info">Página {page} de {totalPages}</span>
                    <button
                        className="btn btn-sm btn-secondary"
                        disabled={page === totalPages}
                        onClick={() => setPage(p => p + 1)}
                    >
                        Próxima
                    </button>
                </div>
            )}

            {modalOpen && (
                <div className="modal-overlay" onClick={() => setModalOpen(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editing ? 'Editar Contratante' : 'Novo Contratante'}</h2>
                            <button className="btn-icon" onClick={() => setModalOpen(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="modal-body">
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Nome *</label>
                                    <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>CNPJ</label>
                                    <input value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Email</label>
                                    <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Telefone</label>
                                    <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Especialidade</label>
                                    <input value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Status</label>
                                    <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                                        <option value="ativo">Ativo</option>
                                        <option value="inativo">Inativo</option>
                                    </select>
                                </div>
                            </div>
                            {isAdmin && (
                                <div className="form-group">
                                    <label>Gestor Responsável</label>
                                    <select value={form.managerId} onChange={(e) => setForm({ ...form, managerId: e.target.value })}>
                                        <option value="">Sem gestor</option>
                                        {managers.map((m) => (
                                            <option key={m._id} value={m._id}>{m.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <div className="form-group">
                                <label>Observações</label>
                                <textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
                                <button type="submit" className="btn btn-primary">{editing ? 'Salvar' : 'Criar'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
