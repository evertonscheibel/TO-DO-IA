import { useState, useRef, useEffect } from 'react';
import DOMPurify from 'dompurify';
import api from '../services/api';
import { Send, Bot, User, Sparkles, Plus, CheckSquare, Loader2 } from 'lucide-react';
import './Assistente.css';

export default function Assistente() {
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: 'Olá! Sou o **Cérebro Operacional** do Gestão PJ. Posso te ajudar a:\n\n• Criar tarefas por linguagem natural\n• Gerar checklists inteligentes\n• Analisar riscos e gargalos\n\nDigite algo como: *"Cobrar a Frizelo sobre o orçamento do telhado urgente para sexta-feira"*',
            type: 'text'
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const formatMarkdown = (text) => {
        // Simple markdown to HTML
        let html = text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br/>');
        return html;
    };

    const handleSend = async () => {
        const msg = input.trim();
        if (!msg || loading) return;

        const userMessage = { role: 'user', content: msg, type: 'text' };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const res = await api.post('/ai/chat', { message: msg });
            const { response, parsedJson, responseType } = res.data.data;

            const assistantMessage = {
                role: 'assistant',
                content: response,
                type: responseType,
                parsedJson
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (err) {
            const errorMsg = {
                role: 'assistant',
                content: err.response?.data?.error || 'Erro ao se comunicar com a IA. Verifique a chave da API.',
                type: 'error'
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setLoading(false);
            inputRef.current?.focus();
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleCreateTask = async (taskData) => {
        try {
            await api.post('/ai/create-task', taskData);
            setMessages(prev => [...prev, {
                role: 'system',
                content: `✅ Tarefa "${taskData.title}" criada com sucesso! Veja no To-Do Geral.`,
                type: 'success'
            }]);
        } catch (err) {
            setMessages(prev => [...prev, {
                role: 'system',
                content: `❌ Erro ao criar tarefa: ${err.response?.data?.error || 'Erro desconhecido'}`,
                type: 'error'
            }]);
        }
    };

    const handleApplyChecklist = async (checklistData) => {
        // For now, create a task with the checklist attached
        try {
            await api.post('/ai/create-task', {
                title: checklistData.title,
                description: `Checklist gerado pela IA com ${checklistData.items.length} itens.`,
                priority: 'media',
                checklists: [{
                    title: checklistData.title,
                    items: checklistData.items.map(item => ({ text: item, isCompleted: false }))
                }]
            });
            setMessages(prev => [...prev, {
                role: 'system',
                content: `✅ Tarefa "${checklistData.title}" criada com checklist de ${checklistData.items.length} itens!`,
                type: 'success'
            }]);
        } catch (err) {
            setMessages(prev => [...prev, {
                role: 'system',
                content: `❌ Erro ao criar checklist: ${err.response?.data?.error || 'Erro desconhecido'}`,
                type: 'error'
            }]);
        }
    };

    const renderParsedJson = (msg) => {
        const { parsedJson } = msg;
        if (!parsedJson) return null;

        if (parsedJson.type === 'task') {
            return (
                <div className="ai-action-card">
                    <div className="ai-action-header">
                        <Sparkles size={16} />
                        <span>Tarefa Detectada</span>
                    </div>
                    <div className="ai-action-body">
                        <div className="ai-action-field">
                            <label>Título:</label>
                            <span>{parsedJson.title}</span>
                        </div>
                        {parsedJson.description && (
                            <div className="ai-action-field">
                                <label>Descrição:</label>
                                <span>{parsedJson.description}</span>
                            </div>
                        )}
                        <div className="ai-action-field">
                            <label>Prioridade:</label>
                            <span className={`badge badge-${parsedJson.priority === 'urgente' ? 'red' : parsedJson.priority === 'alta' ? 'orange' : parsedJson.priority === 'media' ? 'yellow' : 'blue'}`}>
                                {parsedJson.priority}
                            </span>
                        </div>
                        {parsedJson.dueDate && (
                            <div className="ai-action-field">
                                <label>Prazo:</label>
                                <span>{new Date(parsedJson.dueDate).toLocaleDateString('pt-BR')}</span>
                            </div>
                        )}
                    </div>
                    <button className="btn btn-primary btn-sm ai-action-btn" onClick={() => handleCreateTask(parsedJson)}>
                        <Plus size={14} /> Criar Tarefa
                    </button>
                </div>
            );
        }

        if (parsedJson.type === 'checklist') {
            return (
                <div className="ai-action-card">
                    <div className="ai-action-header">
                        <CheckSquare size={16} />
                        <span>Checklist Gerado</span>
                    </div>
                    <div className="ai-action-body">
                        <div className="ai-action-field">
                            <label>{parsedJson.title}</label>
                        </div>
                        <ul className="ai-checklist-preview">
                            {parsedJson.items.map((item, i) => (
                                <li key={i}>
                                    <input type="checkbox" disabled />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <button className="btn btn-primary btn-sm ai-action-btn" onClick={() => handleApplyChecklist(parsedJson)}>
                        <Plus size={14} /> Criar Tarefa com Checklist
                    </button>
                </div>
            );
        }

        return null;
    };

    return (
        <div className="page page-assistente">
            <div className="page-header">
                <div>
                    <h1><Bot size={28} style={{ marginRight: 8, verticalAlign: 'middle' }} />Assistente IA</h1>
                    <p>Cérebro Operacional — Gestão PJ Inteligente</p>
                </div>
            </div>

            <div className="chat-container">
                <div className="chat-messages">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`chat-message ${msg.role}`}>
                            <div className="chat-avatar">
                                {msg.role === 'user' ? (
                                    <User size={18} />
                                ) : msg.role === 'system' ? (
                                    <Sparkles size={18} />
                                ) : (
                                    <Bot size={18} />
                                )}
                            </div>
                            <div className={`chat-bubble ${msg.type === 'error' ? 'error' : ''} ${msg.type === 'success' ? 'success' : ''}`}>
                                <div
                                    className="chat-text"
                                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(formatMarkdown(msg.content)) }}
                                />
                                {msg.parsedJson && renderParsedJson(msg)}
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className="chat-message assistant">
                            <div className="chat-avatar"><Bot size={18} /></div>
                            <div className="chat-bubble">
                                <div className="chat-typing">
                                    <Loader2 size={16} className="spin" />
                                    <span>Pensando...</span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="chat-input-area">
                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Digite sua mensagem... (Enter para enviar)"
                        rows={1}
                        disabled={loading}
                    />
                    <button
                        className="btn btn-primary chat-send-btn"
                        onClick={handleSend}
                        disabled={!input.trim() || loading}
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}
