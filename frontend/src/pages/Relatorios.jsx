import { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { BarChart3, TrendingUp, Activity, PieChart, Bot, Loader2 } from 'lucide-react';

export default function Relatorios() {
    const { isAdmin } = useAuth();
    const [provPerf, setProvPerf] = useState([]);
    const [managerPerf, setManagerPerf] = useState([]);
    const [distribution, setDistribution] = useState([]);
    const [timeline, setTimeline] = useState([]);
    const [finishedTasks, setFinishedTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [aiAnalysis, setAiAnalysis] = useState('');
    const [aiLoading, setAiLoading] = useState(false);

    useEffect(() => {
        const promises = [
            api.get('/reports/provider-performance'),
            api.get('/reports/task-distribution'),
            api.get('/reports/timeline?limit=15'),
        ];
        if (isAdmin) promises.push(api.get('/reports/manager-performance'));

        Promise.all(promises).then((results) => {
            setProvPerf(results[0].data.data.performance);
            setDistribution(results[1].data.data.distribution);
            setTimeline(results[2].data.data.activities);
            if (isAdmin && results[3]) setManagerPerf(results[3].data.data.performance);
            
            // Carrega tarefas finalizadas
            api.get('/reports/finished-tasks').then(res => {
                setFinishedTasks(res.data.data.tasks);
            }).catch(console.error);
        }).catch(console.error).finally(() => setLoading(false));
    }, [isAdmin]);

    const formatDate = (d) => {
        if (!d) return '';
        return new Date(d).toLocaleDateString('pt-BR', {
            day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
        });
    };

    const formatDueDate = (d) => {
        if (!d) return '';
        const date = new Date(d);
        const day = String(date.getUTCDate()).padStart(2, '0');
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        return `${day}/${month}/${date.getUTCFullYear()}`;
    };

    const STATUS_LABELS = {
        'pendente': 'Pendente', 'backlog': 'Backlog', 'todo': 'To Do',
        'em-andamento': 'Em Andamento', 'revisao': 'Revisão', 'concluido': 'Concluído'
    };
    const STATUS_COLORS = {
        'pendente': '#f59e0b', 'backlog': '#6366f1', 'todo': '#3b82f6',
        'em-andamento': '#f97316', 'revisao': '#8b5cf6', 'concluido': '#10b981'
    };

    if (loading) return <div className="page-loading"><div className="spinner"></div></div>;

    const totalTasks = distribution.reduce((acc, d) => acc + d.count, 0);

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1>Relatórios</h1>
                    <p>Análise de desempenho e métricas</p>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={async () => {
                        setAiLoading(true);
                        setAiAnalysis('');
                        try {
                            const res = await api.post('/ai/analyze-reports');
                            setAiAnalysis(res.data.data.analysis);
                        } catch (err) {
                            setAiAnalysis('Erro ao gerar análise: ' + (err.response?.data?.error || err.message));
                        } finally {
                            setAiLoading(false);
                        }
                    }}
                    disabled={aiLoading}
                    style={{ background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)' }}
                >
                    {aiLoading ? <Loader2 size={18} className="spin" /> : <Bot size={18} />} Análise IA
                </button>
            </div>

            {(aiAnalysis || aiLoading) && (
                <div className="report-section" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.05), rgba(59,130,246,0.05))', border: '1.5px solid rgba(139,92,246,0.2)' }}>
                    <div className="section-header">
                        <Bot size={20} style={{ color: '#8b5cf6' }} />
                        <h2 style={{ color: '#8b5cf6' }}>Análise Inteligente (IA)</h2>
                    </div>
                    {aiLoading ? (
                        <div style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)' }}>
                            <Loader2 size={18} className="spin" /> Analisando dados...
                        </div>
                    ) : (
                        <div
                            style={{ padding: '20px', lineHeight: '1.7', fontSize: '0.92rem' }}
                            dangerouslySetInnerHTML={{
                                __html: DOMPurify.sanitize(aiAnalysis
                                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                    .replace(/\*(.*?)\*/g, '<em>$1</em>')
                                    .replace(/\n/g, '<br/>'))
                            }}
                        />
                    )}
                </div>
            )}

            {/* Task Distribution */}
            <div className="report-section">
                <div className="section-header">
                    <PieChart size={20} />
                    <h2>Distribuição de Tarefas</h2>
                </div>
                <div className="distribution-grid">
                    {distribution.map((d) => (
                        <div key={d.status} className="distribution-item">
                            <div className="distribution-bar-container">
                                <div
                                    className="distribution-bar"
                                    style={{
                                        width: `${totalTasks > 0 ? (d.count / totalTasks) * 100 : 0}%`,
                                        background: STATUS_COLORS[d.status]
                                    }}
                                ></div>
                            </div>
                            <div className="distribution-info">
                                <span className="distribution-label">{STATUS_LABELS[d.status]}</span>
                                <span className="distribution-count">{d.count}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Provider Performance */}
            <div className="report-section">
                <div className="section-header">
                    <TrendingUp size={20} />
                    <h2>Desempenho por Contratante</h2>
                </div>
                {provPerf.length === 0 && <p className="empty-text">Nenhum contratante ativo</p>}
                <div className="performance-list">
                    {provPerf.map((p) => (
                        <div key={p.provider._id} className="performance-item">
                            <div className="performance-header">
                                <span className="performance-name">{p.provider.name}</span>
                                <span className="performance-stats">
                                    {p.concluidas}/{p.total} concluídas
                                    {p.atrasadas > 0 && <span className="overdue-text"> · {p.atrasadas} atrasadas</span>}
                                </span>
                            </div>
                            <div className="progress-bar">
                                <div className="progress-fill" style={{ width: `${p.percentual}%` }}></div>
                            </div>
                            <span className="performance-pct">{p.percentual}%</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Manager Performance (Admin only) */}
            {isAdmin && managerPerf.length > 0 && (
                <div className="report-section">
                    <div className="section-header">
                        <BarChart3 size={20} />
                        <h2>Desempenho por Gestor</h2>
                    </div>
                    <div className="performance-list">
                        {managerPerf.map((m) => (
                            <div key={m.manager._id} className="performance-item">
                                <div className="performance-header">
                                    <span className="performance-name">{m.manager.name} <small>({m.manager.role})</small></span>
                                    <span className="performance-stats">
                                        {m.concluidas}/{m.total} concluídas
                                        {m.atrasadas > 0 && <span className="overdue-text"> · {m.atrasadas} atrasadas</span>}
                                    </span>
                                </div>
                                <div className="progress-bar">
                                    <div className="progress-fill" style={{ width: `${m.percentual}%` }}></div>
                                </div>
                                <span className="performance-pct">{m.percentual}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Tarefas Finalizadas */}
            <div className="report-section">
                <div className="section-header">
                    <Activity size={20} />
                    <h2>Tarefas Finalizadas (Riqueza de Informações)</h2>
                </div>
                <div className="performance-list">
                    {finishedTasks.length === 0 && <p className="empty-text">Nenhuma tarefa finalizada recentemente</p>}
                    <div style={{ overflowX: 'auto', marginTop: '15px' }}>
                        <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                                    <th style={{ padding: '12px' }}>Título</th>
                                    <th style={{ padding: '12px' }}>Contratante</th>
                                    <th style={{ padding: '12px' }}>Gestor</th>
                                    <th style={{ padding: '12px' }}>Checklist</th>
                                    <th style={{ padding: '12px' }}>Prazo</th>
                                    <th style={{ padding: '12px' }}>Conclusão</th>
                                    <th style={{ padding: '12px' }}>Criticidade</th>
                                </tr>
                            </thead>
                            <tbody>
                                {finishedTasks.map(t => (
                                    <tr key={t._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <td style={{ padding: '12px', fontWeight: '500' }}>{t.title}</td>
                                        <td style={{ padding: '12px' }}>{t.providerId?.name || '—'}</td>
                                        <td style={{ padding: '12px' }}>{t.managerId?.name || '—'}</td>
                                        <td style={{ padding: '12px' }}>
                                            {t.checklists?.length > 0 ? (
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                    {t.checklists.reduce((acc, c) => acc + c.items.filter(i => i.isCompleted).length, 0)}/
                                                    {t.checklists.reduce((acc, c) => acc + c.items.length, 0)} items
                                                </span>
                                            ) : '—'}
                                        </td>
                                        <td style={{ padding: '12px' }}>{formatDueDate(t.dueDate)}</td>
                                        <td style={{ padding: '12px' }}>{formatDate(t.updatedAt)}</td>
                                        <td style={{ padding: '12px' }}>
                                            <span className={`badge badge-${t.priority === 'baixa' ? 'gray' : t.priority === 'media' ? 'blue' : t.priority === 'alta' ? 'orange' : 'red'}`}
                                                  style={t.priority === 'urgente' ? { boxShadow: '0 0 8px rgba(239, 68, 68, 0.4)' } : {}}>
                                                {t.priority.charAt(0).toUpperCase() + t.priority.slice(1)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Timeline */}
            <div className="report-section">
                <div className="section-header">
                    <Activity size={20} />
                    <h2>Timeline de Atividades</h2>
                </div>
                <div className="activities-list">
                    {timeline.length === 0 && <p className="empty-text">Nenhuma atividade</p>}
                    {timeline.map((a) => (
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
    );
}
