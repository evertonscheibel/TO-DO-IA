import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, ChevronLeft, ChevronRight, Filter, Clock } from 'lucide-react';

export default function Timeline() {
    const { user } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    
    useEffect(() => {
        if (!user) return;
        const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).toISOString();
        const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).toISOString();
        
        api.get(`/tasks?from=${startOfMonth}&to=${endOfMonth}&limit=100`)
            .then(res => {
                setTasks(res.data.data.tasks);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [currentMonth, user]);

    const getDaysInMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const daysCount = getDaysInMonth(currentMonth);
    const days = Array.from({ length: daysCount }, (_, i) => i + 1);

    const changeMonth = (offset) => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1));
    };

    const getTaskStyle = (task) => {
        const start = new Date(task.createdAt);
        const end = task.dueDate ? new Date(task.dueDate) : new Date();
        
        // Filter tasks that overlap with current month
        const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
        
        if (end < monthStart || start > monthEnd) return null;
        
        const effectiveStart = Math.max(1, start.getMonth() === currentMonth.getMonth() ? start.getDate() : 1);
        const effectiveEnd = Math.min(daysCount, end.getMonth() === currentMonth.getMonth() ? end.getDate() : daysCount);
        
        const duration = effectiveEnd - effectiveStart + 1;
        
        return {
            gridColumnStart: effectiveStart + 1,
            gridColumnEnd: `span ${duration}`,
            backgroundColor: task.priority === 'urgente' ? 'var(--red)' : 
                             task.priority === 'alta' ? 'var(--orange)' : 
                             task.priority === 'media' ? 'var(--blue)' : 'var(--gray)'
        };
    };

    if (loading) return <div className="page-loading"><div className="spinner"></div></div>;

    return (
        <div className="page page-timeline">
            <div className="page-header">
                <div>
                    <h1>Cronograma Visual</h1>
                    <p>Timeline de prazos e entregas</p>
                </div>
                <div className="flex-row gap-4">
                    <div className="timeline-nav">
                        <button className="btn-icon" onClick={() => changeMonth(-1)}><ChevronLeft size={20} /></button>
                        <span className="current-month-label">
                            {currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase()}
                        </span>
                        <button className="btn-icon" onClick={() => changeMonth(1)}><ChevronRight size={20} /></button>
                    </div>
                </div>
            </div>

            <div className="timeline-container">
                <div className="timeline-grid" style={{ gridTemplateColumns: `250px repeat(${daysCount}, 1fr)` }}>
                    {/* Header Row */}
                    <div className="timeline-header-cell">Tarefa</div>
                    {days.map(day => (
                        <div key={day} className="timeline-header-cell day-cell">{day}</div>
                    ))}

                    {/* Task Rows */}
                    {tasks.filter(t => t.dueDate).map(task => {
                        const style = getTaskStyle(task);
                        if (!style) return null;

                        return (
                            <div key={task._id} className="timeline-row-wrapper" style={{ gridColumn: `1 / span ${daysCount + 1}` }}>
                                <div className="timeline-task-name" title={task.title}>
                                    <div className={`priority-dot ${task.priority}`}></div>
                                    {task.title}
                                </div>
                                <div className="timeline-bar-container" style={{ gridTemplateColumns: `repeat(${daysCount}, 1fr)` }}>
                                    <div className="timeline-bar" style={style}>
                                        <span className="timeline-bar-text">
                                            {task.status.toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    
                    {tasks.filter(t => t.dueDate).length === 0 && (
                        <div className="empty-state" style={{ gridColumn: `1 / span ${daysCount + 1}`, padding: '40px' }}>
                            Nenhuma tarefa com prazo para este mês.
                        </div>
                    )}
                </div>
            </div>
            
            <style dangerouslySetInnerHTML={{ __html: `
                .page-timeline {
                    display: flex;
                    flex-direction: column;
                    height: calc(100vh - 60px);
                }
                .timeline-container {
                    background: var(--bg-card);
                    border-radius: var(--radius-lg);
                    border: 1px solid var(--border);
                    overflow: auto;
                    flex: 1;
                    box-shadow: var(--shadow);
                }
                .timeline-grid {
                    display: grid;
                    min-width: 1200px;
                }
                .timeline-header-cell {
                    padding: 12px;
                    background: var(--bg-primary);
                    border-bottom: 1px solid var(--border);
                    border-right: 1px solid var(--border);
                    font-size: 0.75rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    color: var(--text-secondary);
                    position: sticky;
                    top: 0;
                    z-index: 10;
                }
                .day-cell {
                    text-align: center;
                }
                .timeline-row-wrapper {
                    display: grid;
                    grid-template-columns: 250px 1fr;
                    border-bottom: 1px solid var(--border-light);
                    min-height: 40px;
                }
                .timeline-task-name {
                    padding: 8px 12px;
                    border-right: 1px solid var(--border);
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 0.85rem;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    background: white;
                    position: sticky;
                    left: 0;
                    z-index: 5;
                }
                .priority-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    flex-shrink: 0;
                }
                .priority-dot.urgente { background: var(--red); }
                .priority-dot.alta { background: var(--orange); }
                .priority-dot.media { background: var(--blue); }
                .priority-dot.baixa { background: var(--gray); }

                .timeline-bar-container {
                    display: grid;
                    position: relative;
                    background: repeating-linear-gradient(90deg, transparent, transparent calc(100% / var(--days-count) - 1px), var(--border-light) calc(100% / var(--days-count)));
                }
                .timeline-bar {
                    height: 24px;
                    margin: 8px 0;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    padding: 0 10px;
                    color: white;
                    font-size: 0.7rem;
                    font-weight: 700;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    overflow: hidden;
                    white-space: nowrap;
                }
                .timeline-nav {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    background: var(--bg-card);
                    padding: 4px 12px;
                    border-radius: 30px;
                    border: 1px solid var(--border);
                }
                .current-month-label {
                    font-weight: 700;
                    font-size: 0.85rem;
                    color: var(--text-primary);
                    min-width: 150px;
                    text-align: center;
                }
            ` }} />
        </div>
    );
}
