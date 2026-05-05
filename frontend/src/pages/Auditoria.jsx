import { useState, useEffect } from 'react';
import api from '../services/api';
import { Search, Calendar, User, FileSearch, Archive } from 'lucide-react';

export default function Auditoria() {
    const [tasks, setTasks] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const limit = 50;

    const loadArchivedTasks = async () => {
        try {
            const params = { page, limit, q: search, archived: 'true' };
            const res = await api.get('/tasks', { params });
            const { tasks: list, total } = res.data.data;
            setTasks(list);
            setTotalPages(Math.ceil(total / limit));
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        loadArchivedTasks().finally(() => setLoading(false));
    }, [page]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setPage(1);
            loadArchivedTasks();
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    const formatDateTime = (d) => d ? new Date(d).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—';

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1>Auditoria de Tarefas</h1>
                    <p>Consulta de histórico e tarefas arquivadas</p>
                </div>
                <div className="header-stats">
                    <div className="badge badge-blue">Histórico Consolidado</div>
                </div>
            </div>

            <div className="search-bar">
                <Search size={18} />
                <input
                    type="text"
                    placeholder="Pesquisar no arquivo (título ou descrição)..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {loading ? (
                <div className="page-loading"><div className="spinner"></div></div>
            ) : (
                <div className="archive-list">
                    {tasks.length === 0 && <p className="empty-text">Nenhuma tarefa encontrada no arquivo.</p>}

                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Tarefa</th>
                                    <th>Status Final</th>
                                    <th>Contratante</th>
                                    <th>Concluída em</th>
                                    <th>Arquivada em</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tasks.map((t) => (
                                    <tr key={t._id}>
                                        <td>
                                            <div className="task-info">
                                                <strong>{t.title}</strong>
                                                <small>{t.description?.substring(0, 50)}...</small>
                                            </div>
                                        </td>
                                        <td><span className="badge badge-green">Concluída</span></td>
                                        <td>{t.providerId?.name || '—'}</td>
                                        <td>{formatDateTime(t.updatedAt)}</td>
                                        <td>{formatDateTime(t.updatedAt)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {totalPages > 1 && (
                        <div className="pagination">
                            <button className="btn btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Anterior</button>
                            <span className="pagination-info">Página {page} de {totalPages}</span>
                            <button className="btn btn-sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Próxima</button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
