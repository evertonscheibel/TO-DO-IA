import { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Search, Edit2, Trash2, X, KeyRound } from 'lucide-react';

export default function Gestores() {
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [resetModal, setResetModal] = useState(null);
    const [form, setForm] = useState({ name: '', email: '', phone: '', role: 'gestor', status: 'ativo', password: '' });
    const [newPassword, setNewPassword] = useState('');

    const loadUsers = async () => {
        try {
            const res = await api.get('/users', { params: { q: search, limit: 200 } });
            setUsers(res.data.data.users);
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        loadUsers().finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        const timer = setTimeout(loadUsers, 300);
        return () => clearTimeout(timer);
    }, [search]);

    const openModal = (user = null) => {
        if (user) {
            setEditing(user);
            setForm({ name: user.name, email: user.email, phone: user.phone || '', role: user.role, status: user.status, password: '' });
        } else {
            setEditing(null);
            setForm({ name: '', email: '', phone: '', role: 'gestor', status: 'ativo', password: '' });
        }
        setModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editing) {
                const payload = { name: form.name, email: form.email, phone: form.phone, role: form.role, status: form.status };
                await api.patch(`/users/${editing._id}`, payload);
            } else {
                await api.post('/users', form);
            }
            setModalOpen(false);
            loadUsers();
        } catch (err) {
            alert(err.response?.data?.error || 'Erro ao salvar');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Deseja remover este usuário?')) return;
        try {
            await api.delete(`/users/${id}`);
            loadUsers();
        } catch (err) {
            alert(err.response?.data?.error || 'Erro ao remover');
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        try {
            await api.patch(`/users/${resetModal._id}/reset-password`, { newPassword });
            setResetModal(null);
            setNewPassword('');
            alert('Senha redefinida com sucesso');
        } catch (err) {
            alert(err.response?.data?.error || 'Erro ao redefinir senha');
        }
    };

    if (loading) return <div className="page-loading"><div className="spinner"></div></div>;

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1>Gestores</h1>
                    <p>Gerenciamento de usuários do sistema</p>
                </div>
                <button className="btn btn-primary" onClick={() => openModal()}>
                    <Plus size={18} /> Novo Gestor
                </button>
            </div>

            <div className="search-bar">
                <Search size={18} />
                <input placeholder="Buscar por nome ou email..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>

            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>Email</th>
                            <th>Telefone</th>
                            <th>Perfil</th>
                            <th>Status</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.length === 0 && (
                            <tr><td colSpan="6" className="empty-text">Nenhum usuário encontrado</td></tr>
                        )}
                        {users.map((u) => (
                            <tr key={u._id}>
                                <td className="td-bold">{u.name}</td>
                                <td>{u.email}</td>
                                <td>{u.phone || '—'}</td>
                                <td>
                                    <span className={`badge badge-${u.role === 'admin' ? 'purple' : 'blue'}`}>
                                        {u.role === 'admin' ? 'Admin' : 'Gestor'}
                                    </span>
                                </td>
                                <td>
                                    <span className={`badge badge-${u.status === 'ativo' ? 'green' : 'gray'}`}>
                                        {u.status}
                                    </span>
                                </td>
                                <td>
                                    <div className="actions">
                                        <button className="btn-icon" onClick={() => openModal(u)} title="Editar"><Edit2 size={16} /></button>
                                        <button className="btn-icon" onClick={() => { setResetModal(u); setNewPassword(''); }} title="Redefinir Senha"><KeyRound size={16} /></button>
                                        <button className="btn-icon btn-icon-danger" onClick={() => handleDelete(u._id)} title="Remover"><Trash2 size={16} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Create/Edit Modal */}
            {modalOpen && (
                <div className="modal-overlay" onClick={() => setModalOpen(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editing ? 'Editar Usuário' : 'Novo Gestor'}</h2>
                            <button className="btn-icon" onClick={() => setModalOpen(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="modal-body">
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Nome *</label>
                                    <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Email *</label>
                                    <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Telefone</label>
                                    <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Perfil</label>
                                    <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                                        <option value="gestor">Gestor</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Status</label>
                                    <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                                        <option value="ativo">Ativo</option>
                                        <option value="inativo">Inativo</option>
                                    </select>
                                </div>
                                {!editing && (
                                    <div className="form-group">
                                        <label>Senha *</label>
                                        <input type="password" required={!editing} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
                                <button type="submit" className="btn btn-primary">{editing ? 'Salvar' : 'Criar'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Reset Password Modal */}
            {resetModal && (
                <div className="modal-overlay" onClick={() => setResetModal(null)}>
                    <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Redefinir Senha</h2>
                            <button className="btn-icon" onClick={() => setResetModal(null)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleResetPassword} className="modal-body">
                            <p className="modal-subtitle">Usuário: <strong>{resetModal.name}</strong></p>
                            <div className="form-group">
                                <label>Nova Senha *</label>
                                <input type="password" required minLength={6} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setResetModal(null)}>Cancelar</button>
                                <button type="submit" className="btn btn-primary">Redefinir</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
