import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import api from '../services/api';
import {
    FileText,
    Plus,
    Search,
    Filter,
    ArrowRight,
    CheckCircle,
    Clock,
    XCircle,
    FileCheck,
    Download,
    Pencil,
    X
} from 'lucide-react';
import QuoteModal from '../components/QuoteModal';
import ContractModal from '../components/ContractModal';

export default function QuotesContracts() {
    const [quotes, setQuotes] = useState([]);
    const [contracts, setContracts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('quotes'); // 'quotes' or 'contracts'
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isContractModalOpen, setIsContractModalOpen] = useState(false);
    const [editingQuote, setEditingQuote] = useState(null);
    const [editingContract, setEditingContract] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [previewContent, setPreviewContent] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const [qRes, cRes] = await Promise.all([
                api.get('/quotes'),
                api.get('/contracts')
            ]);
            setQuotes(qRes.data.data.quotes);
            setContracts(cRes.data.data.contracts);
        } catch (err) {
            console.error('Erro ao buscar dados:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSaveQuote = async (quoteData) => {
        try {
            if (editingQuote) {
                await api.put(`/quotes/${editingQuote._id}`, quoteData);
            } else {
                await api.post('/quotes', quoteData);
            }
            setIsModalOpen(false);
            setEditingQuote(null);
            fetchData();
        } catch (err) {
            alert('Erro ao salvar orçamento: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleSaveContract = async (contractData) => {
        try {
            if (editingContract) {
                await api.put(`/contracts/${editingContract._id}`, contractData);
            } else {
                await api.post('/contracts', contractData);
            }
            setIsContractModalOpen(false);
            setEditingContract(null);
            fetchData();
        } catch (err) {
            alert('Erro ao salvar contrato: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleGenerateContract = async (quoteId) => {
        if (!window.confirm('Deseja transformar este orçamento em um contrato oficial?')) return;

        try {
            await api.post(`/contracts/generate-from-quote/${quoteId}`);
            fetchData();
            setTab('contracts');
        } catch (err) {
            alert('Erro ao gerar contrato: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleDownloadPDF = (type, id) => {
        const token = localStorage.getItem('token');
        const url = `${api.defaults.baseURL}/${type}/${id}/pdf?token=${token}`;
        window.open(url, '_blank');
    };

    const filteredQuotes = quotes.filter(q =>
        q.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredContracts = contracts.filter(c =>
        c.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="page page-quotes">
            <div className="page-header">
                <div>
                    <h1>Orçamentos & Contratos</h1>
                    <p>Gestão de propostas comerciais e contratos de serviço</p>
                </div>
                <div className="flex-row gap-2">
                    <button className="btn btn-secondary" onClick={() => { setEditingContract(null); setIsContractModalOpen(true); }}>
                        <Plus size={18} /> Novo Contrato
                    </button>
                    <button className="btn btn-primary" onClick={() => { setEditingQuote(null); setIsModalOpen(true); }}>
                        <Plus size={18} /> Novo Orçamento
                    </button>
                </div>
            </div>

            <div className="dashboard-tabs">
                <button
                    className={`tab-item ${tab === 'quotes' ? 'active' : ''}`}
                    onClick={() => setTab('quotes')}
                >
                    <FileText size={18} /> Orçamentos
                </button>
                <button
                    className={`tab-item ${tab === 'contracts' ? 'active' : ''}`}
                    onClick={() => setTab('contracts')}
                >
                    <FileCheck size={18} /> Contratos
                </button>
            </div>

            <div className="filter-bar">
                <div className="search-input">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder={`Buscar ${tab === 'quotes' ? 'orçamentos' : 'contratos'}...`}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="data-table-container">
                {loading ? (
                    <div className="loading-state">Carregando...</div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>{tab === 'quotes' ? 'Cliente / Projeto' : 'Nº Contrato / Cliente'}</th>
                                <th>Status</th>
                                <th>Valor</th>
                                <th>Data</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tab === 'quotes' ? (
                                filteredQuotes.map(quote => (
                                    <tr key={quote._id}>
                                        <td>
                                            <div className="td-main">{quote.clientName}</div>
                                            <div className="td-sub">{quote.title}</div>
                                        </td>
                                        <td>
                                            <span className={`badge badge-${quote.status === 'aprovado' ? 'green' : quote.status === 'rejeitado' ? 'red' : 'yellow'}`}>
                                                {quote.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td>R$ {quote.totalAmount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                        <td>{new Date(quote.createdAt).toLocaleDateString('pt-BR')}</td>
                                        <td className="actions">
                                            <button
                                                className="btn-icon"
                                                title="Baixar PDF"
                                                onClick={() => handleDownloadPDF('quotes', quote._id)}
                                            >
                                                <Download size={16} />
                                            </button>
                                            <button
                                                className="btn-icon text-blue"
                                                title="Editar Orçamento"
                                                onClick={() => { setEditingQuote(quote); setIsModalOpen(true); }}
                                            >
                                                <Pencil size={16} />
                                            </button>
                                            {quote.status !== 'aprovado' && (
                                                <button
                                                    className="btn btn-secondary btn-sm"
                                                    title="Gerar Contrato"
                                                    onClick={() => handleGenerateContract(quote._id)}
                                                >
                                                    <ArrowRight size={14} /> Contrato
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                filteredContracts.map(contract => (
                                    <tr key={contract._id}>
                                        <td>
                                            <div className="td-main">{contract.contractNumber}</div>
                                            <div className="td-sub">{contract.clientName} - {contract.title}</div>
                                        </td>
                                        <td>
                                            <span className={`badge badge-${contract.status === 'ativo' ? 'green' : 'blue'}`}>
                                                {contract.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td>-</td>
                                        <td>{new Date(contract.startDate).toLocaleDateString('pt-BR')}</td>
                                        <td className="actions">
                                            <button
                                                className="btn-icon"
                                                title="Baixar PDF"
                                                onClick={() => handleDownloadPDF('contracts', contract._id)}
                                            >
                                                <Download size={16} />
                                            </button>
                                            <button
                                                className="btn-icon text-blue"
                                                title="Editar Contrato"
                                                onClick={() => { setEditingContract(contract); setIsContractModalOpen(true); }}
                                            >
                                                <Pencil size={16} />
                                            </button>
                                            <button 
                                                className="btn btn-secondary btn-sm" 
                                                onClick={() => {
                                                    setPreviewContent(contract.content || '# Sem conteúdo\nNão há conteúdo disponível para este contrato.');
                                                    setIsPreviewOpen(true);
                                                }}
                                            >
                                                Visualizar
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                            {(tab === 'quotes' ? filteredQuotes : filteredContracts).length === 0 && (
                                <tr>
                                    <td colSpan="5" className="empty-row">Nenhum registro encontrado.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            <QuoteModal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setEditingQuote(null); }}
                onSave={handleSaveQuote}
                quote={editingQuote}
            />

            <ContractModal
                isOpen={isContractModalOpen}
                onClose={() => { setIsContractModalOpen(false); setEditingContract(null); }}
                onSave={handleSaveContract}
                contract={editingContract}
            />

            {isPreviewOpen && (
                <div className="modal-overlay" onClick={() => setIsPreviewOpen(false)}>
                    <div className="modal-content" style={{ maxWidth: '800px', width: '90%', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 style={{ margin: 0 }}>Visualização do Contrato</h2>
                            <button className="btn-icon" onClick={() => setIsPreviewOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body" style={{ overflowY: 'auto', flex: 1, padding: '20px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                            <div className="prose markdown-rendering">
                                <ReactMarkdown>{previewContent}</ReactMarkdown>
                            </div>
                        </div>
                        <div className="modal-footer" style={{ marginTop: '20px', textAlign: 'right' }}>
                            <button className="btn btn-secondary" onClick={() => setIsPreviewOpen(false)}>Fechar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
