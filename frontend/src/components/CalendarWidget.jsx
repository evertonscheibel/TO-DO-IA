import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import api from '../services/api';

export default function CalendarWidget({ onDayClick }) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                // Get month boundaries
                const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
                
                const res = await api.get('/tasks', {
                    params: {
                        from: firstDay.toISOString(),
                        to: lastDay.toISOString(),
                        limit: 100
                    }
                });
                setTasks(res.data.data.tasks);
            } catch (err) {
                console.error('Error fetching tasks for calendar:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchTasks();
    }, [currentDate]);

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

    const renderHeader = () => {
        const months = [
            "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
            "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
        ];
        return (
            <div className="calendar-header">
                <div className="calendar-title">
                    <CalendarIcon size={18} />
                    <span>{months[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
                </div>
                <div className="calendar-nav">
                    <button onClick={prevMonth} className="btn-icon-sm"><ChevronLeft size={16} /></button>
                    <button onClick={nextMonth} className="btn-icon-sm"><ChevronRight size={16} /></button>
                </div>
            </div>
        );
    };

    const renderDays = () => {
        const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
        return (
            <div className="calendar-weekdays">
                {days.map(day => <div key={day} className="weekday">{day}</div>)}
            </div>
        );
    };

    const renderCells = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);
        const cells = [];

        // Padding blocks for previous month days
        for (let i = 0; i < firstDay; i++) {
            cells.push(<div key={`empty-${i}`} className="calendar-cell empty"></div>);
        }

        // Days of current month
        for (let day = 1; day <= daysInMonth; day++) {
            // Compare identifying date by year, month, day to avoid timezone shifts
            const dayDate = new Date(year, month, day);
            const dayTasks = tasks.filter(t => {
                if (!t.dueDate) return false;
                const taskDate = new Date(t.dueDate);
                return taskDate.getUTCFullYear() === year &&
                       taskDate.getUTCMonth() === month &&
                       taskDate.getUTCDate() === day;
            });
            const isToday = new Date().toLocaleDateString('pt-BR') === dayDate.toLocaleDateString('pt-BR');

            cells.push(
                <div 
                    key={day} 
                    className={`calendar-cell ${isToday ? 'today' : ''} ${dayTasks.length > 0 ? 'has-tasks clickable' : ''}`}
                    onClick={() => dayTasks.length > 0 && onDayClick && onDayClick(dayTasks)}
                >
                    <span className="day-number">{day}</span>
                    {dayTasks.length > 0 && (
                        <div className="task-indicators">
                            {dayTasks.slice(0, 3).map((t, idx) => (
                                <div 
                                    key={t._id} 
                                    className={`task-dot priority-${t.priority}`} 
                                    title={t.title}
                                />
                            ))}
                            {dayTasks.length > 3 && <span className="more-tasks">+</span>}
                        </div>
                    )}
                </div>
            );
        }

        return <div className="calendar-grid">{cells}</div>;
    };

    return (
        <div className="calendar-widget">
            {renderHeader()}
            {renderDays()}
            {loading ? <div className="calendar-loading"><div className="spinner"></div></div> : renderCells()}
        </div>
    );
}
