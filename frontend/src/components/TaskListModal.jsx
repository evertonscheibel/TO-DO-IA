import { X, Clock } from 'lucide-react';
import './TaskListModal.css';

export default function TaskListModal({ tasks, onTaskClick, onClose }) {
    if (!tasks || tasks.length === 0) return null;

    return (
        <div className="task-list-modal-overlay" onClick={onClose}>
            <div className="task-list-modal-content" onClick={e => e.stopPropagation()}>
                <div className="task-list-modal-header">
                    <h2>Tarefas para o dia</h2>
                    <button className="btn-icon" onClick={onClose}><X size={24} /></button>
                </div>
                <div className="task-list-modal-body">
                    {tasks.map(task => (
                        <div key={task._id} className="task-list-item" onClick={() => onTaskClick(task)}>
                            <div className={`task-priority-indicator priority-${task.priority}`}></div>
                            <div className="task-list-item-info">
                                <span className="task-list-item-title">{task.title}</span>
                                <span className="task-list-item-status">{task.status}</span>
                            </div>
                            <div className="task-list-item-action">
                                <Clock size={16} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
