import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Search, ArrowRight, X, Calendar, Flag, SendHorizonal, Archive } from 'lucide-react';
import TaskModal from '../components/TaskModal';

const PRIORITY_LABELS = { baixa: 'Baixa', media: 'Média', alta: 'Alta', urgente: 'Urgente' };
const PRIORITY_COLORS = { baixa: 'gray', media: 'blue', alta: 'orange', urgente: 'red' };

export default function TodoGeral() {
    const { user, isAdmin } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [providers, setProviders] = useState([]);
    const [filter, setFilter] = useState('todas');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [allocModal, setAllocModal] = useState(null);
    const [createForm, setCreateForm] = useState({ title: '', description: '', priority: 'media', dueDate: '' });
    const [allocForm, setAllocForm] = useState({ providerId: '', status: 'backlog' });
    const [quickAdd, setQuickAdd] = useState('');
    const [quickAdding, setQuickAdding] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);

    // Pagination state
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const limit = 50;

    const [showSearch, setShowSearch] = useState(false);

    const loadTasks = async () => {
        if (!user) return;
        try {
            const params = { page, limit, q: search };
            if (filter === 'pendentes') params.status = 'backlog';

            const res = await api.get('/tasks', { params });
            const { tasks: list, total } = res.data.data;

            // Front-end filters for "alocadas" (legacy or edge cases)
            let filteredList = list;
            if (filter === 'alocadas') filteredList = filteredList.filter(t => t.providerId);

            setTasks(filteredList);
            setTotalPages(Math.ceil(total / limit));
        } catch (err) { console.error(err); }
    };

    const loadProviders = async () => {
        if (!user) return;
        try {
            const res = await api.get('/providers', { params: { status: 'ativo', limit: 200 } });
            setProviders(res.data.data.providers);
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        if (user) {
            Promise.all([loadTasks(), loadProviders()]).finally(() => setLoading(false));
        }
    }, [user]);

    useEffect(() => {
        if (!user) return;
        const timer = setTimeout(() => {
            setPage(1); // Reset to page 1 on search/filter change
            loadTasks();
        }, 300);
        return () => clearTimeout(timer);
    }, [search, filter, user]);

    useEffect(() => {
        if (user) loadTasks();
    }, [page, user]);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await api.post('/tasks', createForm);
            setCreateForm({ title: '', description: '', priority: 'media', dueDate: '' });
            setShowCreate(false);
            loadTasks();
        } catch (err) {
            alert(err.response?.data?.error || 'Erro ao criar tarefa');
        }
    };

    const handleQuickAdd = async (e) => {
        if (e.key !== 'Enter' || !quickAdd.trim()) return;
        setQuickAdding(true);
        try {
            await api.post('/tasks', { title: quickAdd.trim() });
            setQuickAdd('');
            loadTasks();
        } catch (err) {
            alert(err.response?.data?.error || 'Erro ao criar tarefa');
        } finally {
            setQuickAdding(false);
        }
    };

    const handleAllocate = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/tasks/${allocModal._id}/allocate`, allocForm);
            setAllocModal(null);
            setAllocForm({ providerId: '', status: 'backlog' });
            loadTasks();
        } catch (err) {
            alert(err.response?.data?.error || 'Erro ao alocar');
        }
    };

    const formatDate = (d) => d ? new Date(d).toLocaleDateString('pt-BR') : '—';
    const formatDateTime = (d) => d ? new Date(d).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—';
    const isOverdue = (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'concluido';

    const handleArchive = async () => {
        if (!window.confirm('Deseja arquivar todas as tarefas concluídas? Elas sairão da lista mas ficarão salvas na Auditoria.')) return;
        try {
            await api.post('/tasks/archive');
            loadTasks();
        } catch (err) {
            alert('Erro ao arquivar tarefas');
        }
    };

    if (loading) return <div className="page-loading"><div className="spinner"></div></div>;

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1>To-Do Geral</h1>
                    <p>Gestão de tarefas e demandas</p>
                </div>
                <div className="page-header-actions" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <button className="btn btn-sm btn-outline" onClick={handleArchive}>
                        <Archive size={16} /> Arquivar Concluídas
                    </button>
                    <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
                        <Plus size={18} /> Nova Tarefa
                    </button>
                </div>
            </div>

            <div className="toolbar">
                <div className={`search-container ${showSearch ? 'active' : ''}`}>
                    {showSearch ? (
                        <div className="search-bar animate-slide-in">
                            <Search size={18} />
                            <input
                                autoFocus
                                placeholder="Buscar tarefas..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onBlur={() => !search && setShowSearch(false)}
                            />
                            <button className="btn-icon btn-sm" onClick={() => { setSearch(''); setShowSearch(false); }}>
                                <X size={16} />
                            </button>
                        </div>
                    ) : (
                        <button className="btn-icon btn-search-trigger" onClick={() => setShowSearch(true)} title="Pesquisar">
                            <Search size={22} />
                        </button>
                    )}
                </div>
                <div className="filter-tabs">
                    {['todas', 'pendentes', 'alocadas'].map((f) => (
                        <button
                            key={f}
                            className={`tab ${filter === f ? 'active' : ''}`}
                            onClick={() => setFilter(f)}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            <div className="quick-add-bar">
                <Plus size={18} className="quick-add-icon" />
                <input
                    type="text"
                    placeholder="Digite o título da demanda e pressione Enter..."
                    value={quickAdd}
                    onChange={(e) => setQuickAdd(e.target.value)}
                    onKeyDown={handleQuickAdd}
                    disabled={quickAdding}
                    autoComplete="off"
                />
                {quickAdd.trim() && (
                    <button
                        className="quick-add-btn"
                        onClick={() => handleQuickAdd({ key: 'Enter' })}
                        disabled={quickAdding}
                    >
                        <SendHorizonal size={18} />
                    </button>
                )}
            </div>

            <div className="task-list">
                {tasks.length === 0 && <p className="empty-text">Nenhuma tarefa encontrada</p>}
                {tasks.map((t) => (
                    <div key={t._id} className={`task-card ${isOverdue(t) ? 'overdue' : ''}`} onClick={() => setSelectedTask(t)}>
                        <div className="task-card-header">
                            <div>
                                <h3>{t.title}</h3>
                                <div className="task-created-at">Entrada: {formatDateTime(t.createdAt)}</div>
                            </div>
                            <span className={`badge badge-${PRIORITY_COLORS[t.priority]}`}>
                                <Flag size={12} /> {PRIORITY_LABELS[t.priority]}
                            </span>
                        </div>
                        {t.description && <p className="task-desc">{t.description}</p>}
                        <div className="task-card-meta">
                            {t.checklists && t.checklists.length > 0 && (
                                <span className="badge badge-gray" style={{ background: '#f4f5f7', color: '#172b4d' }}>
                                    {t.checklists.length} {t.checklists.length === 1 ? 'checklist' : 'checklists'}
                                </span>
                            )}
                            <span className={`badge badge-${(t.status === 'pendente' || t.status === 'backlog') ? 'yellow' : 'blue'}`}>
                                {t.status}
                            </span>
                            {t.providerId && (
                                <span className="badge badge-purple">{t.providerId.name}</span>
                            )}
                            {t.dueDate && (
                                <span className={`task-due ${isOverdue(t) ? 'overdue-text' : ''}`}>
                                    <Calendar size={12} /> {formatDate(t.dueDate)}
                                </span>
                            )}
                        </div>
                        <div className="task-card-actions">
                            {(t.status === 'pendente' || t.status === 'backlog') && !t.providerId && (
                                <button
                                    className="btn btn-sm btn-accent"
                                    onClick={(e) => { e.stopPropagation(); setAllocModal(t); setAllocForm({ providerId: '', status: 'backlog' }); }}
                                >
                                    <ArrowRight size={14} /> Alocar
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {selectedTask && (
                <TaskModal
                    task={selectedTask}
                    onClose={() => setSelectedTask(null)}
                    onUpdate={(updatedTask) => {
                        setSelectedTask(updatedTask);
                        setTasks(prev => prev.map(t => t._id === updatedTask._id ? updatedTask : t));
                    }}
                    onDelete={(deletedId) => {
                        setTasks(prev => prev.filter(t => t._id !== deletedId));
                        setSelectedTask(null);
                    }}
                />
            )}

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

            {/* Create Modal */}
            {showCreate && (
                <div className="modal-overlay" onClick={() => setShowCreate(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Nova Tarefa</h2>
                            <button className="btn-icon" onClick={() => setShowCreate(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleCreate} className="modal-body">
                            <div className="form-group">
                                <label>Título *</label>
                                <input required value={createForm.title} onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Descrição</label>
                                <textarea rows={3} value={createForm.description} onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })} />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Prioridade</label>
                                    <select value={createForm.priority} onChange={(e) => setCreateForm({ ...createForm, priority: e.target.value })}>
                                        <option value="baixa">Baixa</option>
                                        <option value="media">Média</option>
                                        <option value="alta">Alta</option>
                                        <option value="urgente">Urgente</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Prazo</label>
                                    <input type="date" value={createForm.dueDate} onChange={(e) => setCreateForm({ ...createForm, dueDate: e.target.value })} />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancelar</button>
                                <button type="submit" className="btn btn-primary">Criar Tarefa</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Allocate Modal */}
            {allocModal && (
                <div className="modal-overlay" onClick={() => setAllocModal(null)}>
                    <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Alocar Contratante</h2>
                            <button className="btn-icon" onClick={() => setAllocModal(null)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleAllocate} className="modal-body">
                            <p className="modal-subtitle">Tarefa: <strong>{allocModal.title}</strong></p>
                            <div className="form-group">
                                <label>Contratante *</label>
                                <select required value={allocForm.providerId} onChange={(e) => setAllocForm({ ...allocForm, providerId: e.target.value })}>
                                    <option value="">Selecione...</option>
                                    {providers.map((p) => (
                                        <option key={p._id} value={p._id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Status Inicial</label>
                                <select value={allocForm.status} onChange={(e) => setAllocForm({ ...allocForm, status: e.target.value })}>
                                    <option value="backlog">Backlog</option>
                                    <option value="todo">To Do</option>
                                </select>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setAllocModal(null)}>Cancelar</button>
                                <button type="submit" className="btn btn-primary">Alocar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
