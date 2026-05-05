import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Users, Clock, PlayCircle, CheckCircle2, AlertTriangle, Activity, Shield, Bot, Loader2 } from 'lucide-react';
import CalendarWidget from '../components/CalendarWidget';
import TaskModal from '../components/TaskModal';
import TaskListModal from '../components/TaskListModal';

export default function Dashboard() {
    const { user } = useAuth();
    const [summary, setSummary] = useState(null);
    const [financial, setFinancial] = useState(null);
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTask, setSelectedTask] = useState(null);
    const [selectedDateTasks, setSelectedDateTasks] = useState(null);

    const fetchData = async () => {
        if (!user) return;
        try {
            const [sumRes, finRes, actRes] = await Promise.all([
                api.get('/reports/summary'),
                api.get('/reports/financial'),
                api.get('/activities?limit=10')
            ]);
            setSummary(sumRes.data.data);
            setFinancial(finRes.data.data);
            setActivities(actRes.data.data.activities);
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchData();
    }, [user]);

    if (loading) return <div className="page-loading"><div className="spinner"></div></div>;

    const cards = [
        { label: 'Contratantes Ativos', value: summary?.totalProvidersAtivos || 0, icon: Users, color: 'blue' },
        { label: 'Acessos Registrados', value: summary?.totalAccesses || 0, icon: Shield, color: 'cyan' },
        { label: 'Tarefas Pendentes', value: summary?.totalTasksPendentes || 0, icon: Clock, color: 'yellow' },
        { label: 'Em Andamento', value: summary?.totalTasksEmAndamento || 0, icon: PlayCircle, color: 'purple' },
        { label: 'Concluídas', value: summary?.totalTasksConcluidas || 0, icon: CheckCircle2, color: 'green' },
        { label: 'Atrasadas', value: summary?.totalOverdue || 0, icon: AlertTriangle, color: 'red' },
    ];

    const approvedQuotes = financial?.quotes?.find(q => q._id === 'aprovado')?.total || 0;
    const pendingQuotes = financial?.quotes?.find(q => q._id === 'enviado' || q._id === 'rascunho')?.total || 0;

    const financialCards = [
        { label: 'Contratos Ativos', value: financial?.activeContracts || 0, icon: Activity, color: 'green' },
        { label: 'Orçamentos Aprovados', value: `R$ ${approvedQuotes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: CheckCircle2, color: 'blue' },
        { label: 'Em Negociação', value: `R$ ${pendingQuotes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: Clock, color: 'orange' },
    ];


    const formatDate = (d) => {
        if (!d) return '';
        return new Date(d).toLocaleDateString('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div className="page">
            <div className="page-header">
                <h1>Dashboard</h1>
                <p>Visão geral do sistema</p>
            </div>

            <div className="dashboard-section-title">Operacional</div>
            <div className="dashboard-cards">
                {cards.map((card) => (
                    <div key={card.label} className={`stat-card stat-card-${card.color}`}>
                        <div className="stat-card-icon">
                            <card.icon size={24} />
                        </div>
                        <div className="stat-card-info">
                            <span className="stat-card-value">{card.value}</span>
                            <span className="stat-card-label">{card.label}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="dashboard-section-title" style={{ marginTop: '30px' }}>Financeiro</div>
            <div className="dashboard-cards">
                {financialCards.map((card) => (
                    <div key={card.label} className={`stat-card stat-card-${card.color}`}>
                        <div className="stat-card-icon">
                            <card.icon size={24} />
                        </div>
                        <div className="stat-card-info">
                            <span className="stat-card-value" style={{ fontSize: card.value.toString().length > 10 ? '1.2rem' : '1.5rem' }}>{card.value}</span>
                            <span className="stat-card-label">{card.label}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="dashboard-grid">
                <div className="dashboard-main-col">

                    <div className="dashboard-section">
                        <div className="section-header">
                            <Activity size={20} />
                            <h2>Atividades Recentes</h2>
                        </div>
                        <div className="activities-list">
                            {activities.length === 0 && <p className="empty-text">Nenhuma atividade registrada</p>}
                            {activities.map((a) => (
                                <div key={a._id} className="activity-item">
                                    <div className="activity-dot"></div>
                                    <div className="activity-content">
                                        <p className="activity-message">{a.message}</p>
                                        <span className="activity-meta">
                                            {a.actorId?.name || 'Sistema'} · {formatDate(a.createdAt)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="dashboard-sidebar-col">
                    <CalendarWidget 
                        onDayClick={(tasks) => {
                            if (tasks.length === 1) {
                                setSelectedTask(tasks[0]);
                            } else if (tasks.length > 1) {
                                setSelectedDateTasks(tasks);
                            }
                        }} 
                    />
                </div>
            </div>

            {selectedDateTasks && (
                <TaskListModal 
                    tasks={selectedDateTasks}
                    onTaskClick={(task) => {
                        setSelectedDateTasks(null);
                        setSelectedTask(task);
                    }}
                    onClose={() => setSelectedDateTasks(null)}
                />
            )}

            {selectedTask && (
                <TaskModal 
                    task={selectedTask}
                    onClose={() => setSelectedTask(null)}
                    onUpdate={() => {
                        setSelectedTask(null);
                        fetchData();
                    }}
                    onDelete={() => {
                        setSelectedTask(null);
                        fetchData();
                    }}
                />
            )}
        </div>
    );
}
