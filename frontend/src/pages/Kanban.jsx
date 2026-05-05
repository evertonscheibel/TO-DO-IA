import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import api from '../services/api';
import { Calendar, Flag, User, Filter, Archive, AlertTriangle } from 'lucide-react';
import TaskModal from '../components/TaskModal';

const COLUMNS = [
    { id: 'backlog', title: 'Backlog', color: '#6366f1' },
    { id: 'todo', title: 'To Do', color: '#3b82f6' },
    { id: 'em-andamento', title: 'Em Andamento', color: '#f59e0b' },
    { id: 'revisao', title: 'Revisão', color: '#8b5cf6' },
    { id: 'concluido', title: 'Concluído', color: '#10b981' },
];

const PRIORITY_LABELS = { baixa: 'Baixa', media: 'Média', alta: 'Alta', urgente: 'Urgente' };
const PRIORITY_COLORS = { baixa: '#9ca3af', media: '#3b82f6', alta: '#f97316', urgente: '#ef4444' };

export default function Kanban() {
    const [tasks, setTasks] = useState([]);
    const [providers, setProviders] = useState([]);
    const [filterProvider, setFilterProvider] = useState('');
    const [loading, setLoading] = useState(true);
    const [selectedTask, setSelectedTask] = useState(null);

    const loadData = async () => {
        try {
            const params = { limit: 500 };
            const [taskRes, provRes] = await Promise.all([
                api.get('/tasks', { params }),
                api.get('/providers', { params: { status: 'ativo', limit: 200 } })
            ]);
            setTasks(taskRes.data.data.tasks);
            setProviders(provRes.data.data.providers);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { loadData(); }, []);

    const getColumnTasks = (columnId) => {
        return tasks
            .filter(t => t.status === columnId)
            .filter(t => !filterProvider || t.providerId?._id === filterProvider);
    };

    const handleDragEnd = async (result) => {
        if (!result.destination) return;
        const { draggableId, destination } = result;
        const newStatus = destination.droppableId;

        // Optimistic update
        setTasks(prev => prev.map(t => t._id === draggableId ? { ...t, status: newStatus } : t));

        try {
            await api.post(`/tasks/${draggableId}/move`, { status: newStatus });
        } catch (err) {
            alert(err.response?.data?.error || 'Erro ao mover tarefa');
            loadData(); // Revert
        }
    };

    const formatDate = (d) => {
        if (!d) return '';
        const date = new Date(d);
        const day = String(date.getUTCDate()).padStart(2, '0');
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        return `${day}/${month}/${date.getUTCFullYear()}`;
    };
    const formatDateTime = (d) => d ? new Date(d).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '';
    const isOverdue = (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'concluido';

    const handleArchive = async () => {
        if (!window.confirm('Deseja arquivar todas as tarefas concluídas? Elas sairão do Kanban mas ficarão salvas na Auditoria.')) return;
        try {
            await api.post('/tasks/archive');
            loadData();
        } catch (err) {
            alert('Erro ao arquivar tarefas');
        }
    };

    if (loading) return <div className="page-loading"><div className="spinner"></div></div>;

    return (
        <div className="page page-kanban">
            <div className="page-header">
                <div>
                    <h1>Kanban</h1>
                    <p>Arraste e solte para mover tarefas</p>
                </div>
                <div className="page-header-actions" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <button className="btn btn-sm btn-outline" onClick={handleArchive}>
                        <Archive size={16} /> Arquivar Concluídas
                    </button>
                    <div className="kanban-filter">
                        <Filter size={16} />
                        <select value={filterProvider} onChange={(e) => setFilterProvider(e.target.value)}>
                            <option value="">Todos os Contratantes</option>
                            {providers.map((p) => (
                                <option key={p._id} value={p._id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <DragDropContext onDragEnd={handleDragEnd}>
                <div className="kanban-board">
                    {COLUMNS.map((col) => {
                        const columnTasks = getColumnTasks(col.id);
                        return (
                            <div key={col.id} className="kanban-column">
                                <div className="kanban-column-header" style={{ borderTopColor: col.color }}>
                                    <h3>{col.title}</h3>
                                    <span className="kanban-count">{columnTasks.length}</span>
                                </div>
                                <Droppable droppableId={col.id}>
                                    {(provided, snapshot) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            className={`kanban-column-body ${snapshot.isDraggingOver ? 'drag-over' : ''}`}
                                        >
                                            {columnTasks.map((task, index) => (
                                                <Draggable key={task._id} draggableId={task._id} index={index}>
                                                    {(provided, snapshot) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            className={`kanban-card ${snapshot.isDragging ? 'dragging' : ''} ${isOverdue(task) ? 'overdue' : ''} priority-${task.priority}`}
                                                            style={{ 
                                                                ...provided.draggableProps.style,
                                                                borderLeft: `5px solid ${PRIORITY_COLORS[task.priority]}`,
                                                                background: task.priority === 'urgente' ? 'rgba(239, 68, 68, 0.04)' : task.priority === 'alta' ? 'rgba(249, 115, 22, 0.02)' : 'var(--bg-card)'
                                                            }}
                                                            onClick={() => setSelectedTask(task)}
                                                        >
                                                            <div className="kanban-card-header">
                                                                <div className="kanban-card-title">{task.title}</div>
                                                                {task.priority === 'urgente' && <AlertTriangle size={14} style={{ color: '#ef4444' }} />}
                                                            </div>
                                                            <div className="kanban-card-created">Entrada: {formatDateTime(task.createdAt)}</div>
                                                            {task.description && (
                                                                <p className="kanban-card-desc">{task.description.substring(0, 80)}{task.description.length > 80 ? '...' : ''}</p>
                                                            )}
                                                            <div className="kanban-card-meta">
                                                                {task.checklists && task.checklists.length > 0 && (
                                                                    <span className="badge badge-gray" style={{ background: '#f4f5f7', color: '#172b4d', fontSize: '10px', padding: '2px 6px' }}>
                                                                        {task.checklists.length}
                                                                    </span>
                                                                )}
                                                                <span
                                                                    className="priority-label"
                                                                    style={{ color: PRIORITY_COLORS[task.priority], fontSize: '10px', fontWeight: '700', textTransform: 'uppercase' }}
                                                                >
                                                                    {PRIORITY_LABELS[task.priority]}
                                                                </span>
                                                                {task.providerId && (
                                                                    <span className="kanban-card-provider">
                                                                        <User size={12} /> {task.providerId.name}
                                                                    </span>
                                                                )}
                                                                {task.dueDate && (
                                                                    <span className={`kanban-card-date ${isOverdue(task) ? 'overdue-text' : ''}`}>
                                                                        <Calendar size={12} /> {formatDate(task.dueDate)}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            </div>
                        );
                    })}
                </div>
            </DragDropContext>

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
        </div>
    );
}
