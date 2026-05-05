import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { X, CheckSquare, Plus, Trash2, AlignLeft, Calendar, Flag, User } from 'lucide-react';
import './TaskModal.css';

export default function TaskModal({ task, onClose, onUpdate, onDelete }) {
    const [localTask, setLocalTask] = useState({ ...task });
    const [isEditingDesc, setIsEditingDesc] = useState(false);
    const [descInput, setDescInput] = useState(task.description || '');
    const [saving, setSaving] = useState(false);
    const dateInputRef = useRef(null);

    // Initial load
    useEffect(() => {
        if (!localTask.checklists) {
            setLocalTask(prev => ({ ...prev, checklists: [] }));
        }
    }, [localTask.checklists]);

    const formatDate = (d) => {
        if (!d) return '';
        const date = new Date(d);
        if (isNaN(date.getTime())) return '';
        const day = String(date.getUTCDate()).padStart(2, '0');
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        return `${day}/${month}/${date.getUTCFullYear()}`;
    };

    const getSafeDateValue = (d) => {
        if (!d) return '';
        const date = new Date(d);
        if (isNaN(date.getTime())) return '';
        return date.toISOString().split('T')[0];
    };

    const saveChanges = async (updates) => {
        setSaving(true);
        try {
            const res = await api.patch(`/tasks/${localTask._id}`, updates);
            setLocalTask(res.data.data.task);
            if (onUpdate) onUpdate(res.data.data.task);
        } catch (err) {
            console.error('Failed to update task:', err);
            alert('Erro ao salvar alterações');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteTask = async () => {
        if (!window.confirm('Tem certeza que deseja excluir esta tarefa? Esta ação não pode ser desfeita.')) return;

        setSaving(true);
        try {
            await api.delete(`/tasks/${localTask._id}`);
            if (onDelete) onDelete(localTask._id);
            onClose();
        } catch (err) {
            console.error('Failed to delete task:', err);
            alert('Erro ao excluir tarefa');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveDescription = () => {
        setIsEditingDesc(false);
        if (descInput !== localTask.description) {
            saveChanges({ description: descInput });
        }
    };

    const handleAddChecklist = () => {
        const title = prompt('Nome do novo checklist:');
        if (!title) return;

        const newChecklists = [...(localTask.checklists || []), { title, items: [] }];
        saveChanges({ checklists: newChecklists });
    };

    const handleDeleteChecklist = (checklistIndex) => {
        if (!window.confirm('Excluir este checklist?')) return;
        const newChecklists = [...localTask.checklists];
        newChecklists.splice(checklistIndex, 1);
        saveChanges({ checklists: newChecklists });
    };

    const handleAddItem = (checklistIndex) => {
        const text = prompt('Nome do item:');
        if (!text) return;

        const newChecklists = [...localTask.checklists];
        newChecklists[checklistIndex].items.push({ text, isCompleted: false });
        saveChanges({ checklists: newChecklists });
    };

    const handleToggleItem = (checklistIndex, itemIndex) => {
        const newChecklists = [...localTask.checklists];
        const item = newChecklists[checklistIndex].items[itemIndex];
        item.isCompleted = !item.isCompleted;
        saveChanges({ checklists: newChecklists });
    };

    const handleDeleteItem = (checklistIndex, itemIndex) => {
        const newChecklists = [...localTask.checklists];
        newChecklists[checklistIndex].items.splice(itemIndex, 1);
        saveChanges({ checklists: newChecklists });
    };

    const calculateProgress = (items) => {
        if (!items || items.length === 0) return 0;
        const completed = items.filter(i => i.isCompleted).length;
        return Math.round((completed / items.length) * 100);
    };

    return (
        <div className="task-modal-overlay" onClick={onClose}>
            <div className="task-modal-content" onClick={e => e.stopPropagation()}>
                <div className="task-modal-header">
                    <div className="task-modal-title-row">
                        <CheckSquare size={24} className="task-modal-icon" />
                        <h2>{localTask.title}</h2>
                    </div>
                    <button className="btn-icon" onClick={onClose}><X size={24} /></button>
                </div>

                <div className="task-modal-meta">
                    Na lista <strong>{localTask.status}</strong>
                </div>

                <div className="task-modal-body">
                    <div className="task-modal-main">

                        {/* Description Section */}
                        <div className="task-section">
                            <div className="task-section-header">
                                <AlignLeft size={20} />
                                <h3>Descrição</h3>
                            </div>
                            {isEditingDesc ? (
                                <div className="desc-edit-container">
                                    <textarea
                                        autoFocus
                                        value={descInput}
                                        onChange={e => setDescInput(e.target.value)}
                                        placeholder="Adicione uma descrição mais detalhada..."
                                    />
                                    <div className="desc-actions">
                                        <button className="btn btn-primary btn-sm" onClick={handleSaveDescription} disabled={saving}>Salvar</button>
                                        <button className="btn btn-secondary btn-sm" onClick={() => { setIsEditingDesc(false); setDescInput(localTask.description || ''); }}>Cancelar</button>
                                    </div>
                                </div>
                            ) : (
                                <div
                                    className={`desc-display ${!localTask.description ? 'empty' : ''}`}
                                    onClick={() => setIsEditingDesc(true)}
                                >
                                    {localTask.description || 'Adicione uma descrição mais detalhada...'}
                                </div>
                            )}
                        </div>

                        {/* Checklists Section */}
                        {localTask.checklists && localTask.checklists.map((checklist, cIdx) => {
                            const progress = calculateProgress(checklist.items);
                            return (
                                <div key={cIdx} className="task-section checklist-section">
                                    <div className="task-section-header checklist-header">
                                        <div className="checklist-title-wrapper">
                                            <CheckSquare size={20} />
                                            <h3>{checklist.title}</h3>
                                        </div>
                                        <button className="btn btn-secondary btn-sm" onClick={() => handleDeleteChecklist(cIdx)}>Excluir</button>
                                    </div>

                                    <div className="checklist-progress-container">
                                        <span className="progress-text">{progress}%</span>
                                        <div className="progress-bar-bg">
                                            <div
                                                className={`progress-bar-fill ${progress === 100 ? 'complete' : ''}`}
                                                style={{ width: `${progress}%` }}
                                            ></div>
                                        </div>
                                    </div>

                                    <div className="checklist-items">
                                        {checklist.items && checklist.items.map((item, iIdx) => (
                                            <div key={iIdx} className="checklist-item">
                                                <input
                                                    type="checkbox"
                                                    checked={item.isCompleted}
                                                    onChange={() => handleToggleItem(cIdx, iIdx)}
                                                />
                                                <span className={`item-text ${item.isCompleted ? 'completed' : ''}`}>
                                                    {item.text}
                                                </span>
                                                <button className="btn-icon-sm item-delete" onClick={() => handleDeleteItem(cIdx, iIdx)}>
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="checklist-actions">
                                        <button className="btn btn-secondary btn-sm" onClick={() => handleAddItem(cIdx)}>
                                            Adicionar um item
                                        </button>
                                    </div>
                                </div>
                            )
                        })}

                    </div>

                    {/* Sidebar actions */}
                    <div className="task-modal-sidebar">
                        <div className="sidebar-module">
                            <h4>Ações</h4>
                            <button className="btn-sidebar btn-danger" onClick={handleDeleteTask} disabled={saving}>
                                <Trash2 size={16} /> Excluir Tarefa
                            </button>
                        </div>

                        <div className="sidebar-module">
                            <h4>Adicionar ao cartão</h4>
                            <button className="btn-sidebar" onClick={handleAddChecklist}>
                                <CheckSquare size={16} /> Checklist
                            </button>
                            <button className="btn-sidebar">
                                <Flag size={16} /> Etiquetas
                                <select 
                                    className="invisible-select" 
                                    value={localTask.priority} 
                                    onChange={(e) => saveChanges({ priority: e.target.value })}
                                >
                                    <option value="baixa">Baixa</option>
                                    <option value="media">Média</option>
                                    <option value="alta">Alta</option>
                                    <option value="urgente">Urgente</option>
                                </select>
                            </button>
                            <div 
                                className="btn-sidebar data-button" 
                                style={{ position: 'relative', cursor: 'pointer' }}
                                onClick={() => dateInputRef.current?.showPicker()}
                            >
                                <Calendar size={16} /> 
                                <span>{localTask.dueDate ? formatDate(localTask.dueDate) : 'Prazo'}</span>
                                <input 
                                    ref={dateInputRef}
                                    type="date" 
                                    className="invisible-date" 
                                    style={{ 
                                        position: 'absolute', 
                                        top: 0, 
                                        left: 0, 
                                        width: '100%', 
                                        height: '100%', 
                                        opacity: 0, 
                                        pointerEvents: 'none', // Allow click to pass to div
                                        zIndex: -1
                                    }}
                                    value={getSafeDateValue(localTask.dueDate)}
                                    onChange={(e) => {
                                        e.stopPropagation();
                                        saveChanges({ dueDate: e.target.value });
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
