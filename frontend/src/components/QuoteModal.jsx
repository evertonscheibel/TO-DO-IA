import { useState, useEffect } from 'react';
import { X, Plus, Trash2, User, Mail, FileText, Tag, AlignLeft, DollarSign, Briefcase, Save, Sparkles, Loader2 } from 'lucide-react';
import api from '../services/api';
import templateService from '../services/templateService';
import { Copy } from 'lucide-react';

const HARDCODED_TEMPLATES = {
    'cabeamento': {
        name: '🔌 Cabeamento Estruturado',
        title: 'Cabeamento Estruturado e Infraestrutura',
        projectType: 'cabeamento',
        description: 'Lançamento de cabo UTP, instalação de infraestrutura, tomadas e certificação de rede.',
        items: [
            { description: 'Cabo UTP Cat6 Furukawa (Caixa 305m)', quantity: 2, unitPrice: 1250.00, total: 2500 },
            { description: 'Patch Panel 24 Portas Cat6 (Unid)', quantity: 1, unitPrice: 480.00, total: 480 },
            { description: 'Keystone Jack Cat6 (Pacote 10 unid)', quantity: 5, unitPrice: 180.00, total: 900 },
            { description: 'Eletrocalha Perfurada 50x50mm (Barra 3m)', quantity: 15, unitPrice: 95.00, total: 1425 },
            { description: 'Mão de obra: Lançamento e Identificação (por ponto)', quantity: 48, unitPrice: 45.00, total: 2160 },
            { description: 'Serviço: Certificação de Pontos com Scanner Fluke', quantity: 48, unitPrice: 20.00, total: 960 }
        ]
    },
    'fibra': {
        name: '🌐 Fibra Óptica',
        title: 'Lançamento e Fusão de Fibra Óptica',
        projectType: 'fibra-optica',
        description: 'Projeto de interligação óptica, fusões, fornecimento de DIO e certificação OTDR.',
        items: [
            { description: 'Cabo de Fibra Óptica SM 12 fibras (Metros)', quantity: 500, unitPrice: 5.80, total: 2900 },
            { description: 'DIO 12 Portas Montado (SC/APC)', quantity: 2, unitPrice: 380.00, total: 760 },
            { description: 'Pigtail Óptico Simplex SC/APC (Unid)', quantity: 24, unitPrice: 22.00, total: 528 },
            { description: 'Serviço: Fusão de Fibra Óptica (por emenda)', quantity: 24, unitPrice: 55.00, total: 1320 },
            { description: 'Mão de obra: Lançamento Aéreo/Subterrâneo (Metros)', quantity: 500, unitPrice: 3.50, total: 1750 }
        ]
    },
    'mudanca_rack': {
        name: '📦 Mudança de Rack',
        title: 'Remanejamento de Rack e Infraestrutura',
        projectType: 'infraestrutura',
        description: 'Desmontagem, transporte, remontagem e organização de rack em novo local.',
        items: [
            { description: 'Mapeamento e Identificação de Cabeamento Existente', quantity: 1, unitPrice: 850.00, total: 850 },
            { description: 'Mão de obra: Desmontagem e Montagem de Equipamentos', quantity: 1, unitPrice: 1200.00, total: 1200 },
            { description: 'Organização de Rack (Cable Management + Guia Cabos)', quantity: 1, unitPrice: 650.00, total: 650 },
            { description: 'Materiais: Guia de Cabos 1U / Patch Cords Novos', quantity: 10, unitPrice: 35.00, total: 350 }
        ]
    },
    'desenvolvimento': {
        name: '💻 Desenvolvimento de Sistemas',
        title: 'Desenvolvimento de Sistema Web Customizado',
        projectType: 'outros',
        description: 'Criação de sistema sob medida: Levantamento, Backend, Frontend e Deploy.',
        items: [
            { description: 'Levantamento de Requisitos e Prototipagem UX/UI', quantity: 1, unitPrice: 2500.00, total: 2500 },
            { description: 'Desenvolvimento Backend (API + Banco de Dados)', quantity: 1, unitPrice: 8000.00, total: 8000 },
            { description: 'Desenvolvimento Frontend Web Responsivo', quantity: 1, unitPrice: 6500.00, total: 6500 },
            { description: 'Treinamento de Usuários e Deploy em Produção', quantity: 1, unitPrice: 1500.00, total: 1500 }
        ]
    },
    'suporte': {
        name: '🛠️ Suporte TI Mensal',
        title: 'Contrato de Suporte de TI Mensal (SLA)',
        projectType: 'ti',
        description: 'Manutenção Mensal: Gestão de usuários, backup, segurança e infraestrutura com SLA de atendimento.',
        items: [
            { description: 'Suporte Técnico Remoto Ilimitado (Até 20 estações)', quantity: 1, unitPrice: 2200.00, total: 2200 },
            { description: 'Gestão de Backup Cloud Monitorado (1TB)', quantity: 1, unitPrice: 550.00, total: 550 },
            { description: 'Licenciamento Antivírus e Firewall (Pacote 20 lic.)', quantity: 1, unitPrice: 480.00, total: 480 },
            { description: 'Visita Preventivas e Manutenção Preventiva Hardware', quantity: 1, unitPrice: 650.00, total: 650 }
        ],
        technicalJustification: 'Garantir a continuidade operacional da empresa através de monitoramento preventivo, redução de downtime e suporte técnico especializado com SLA definido.',
        technicalSpecs: 'Atendimento via portal de chamados; Atendimento remoto imediato; SLA de 4h para incidentes críticos; Gestão de inventário e patch management.'
    }
};

export default function QuoteModal({ isOpen, onClose, onSave, quote = null }) {
    const [dbTemplates, setDbTemplates] = useState([]);
    const [aiLoading, setAiLoading] = useState(false);
    const [formData, setFormData] = useState({
        clientName: '',
        clientContact: '',
        title: '',
        projectType: 'ti',
        description: '',
        items: [{ description: '', quantity: 1, unitPrice: 0, total: 0 }],
        technicalJustification: '',
        technicalSpecs: ''
    });

    useEffect(() => {
        if (isOpen) {
            fetchTemplates();
        }
    }, [isOpen]);

    const fetchTemplates = async () => {
        try {
            const response = await templateService.getTemplates('quote');
            if (response.ok) {
                setDbTemplates(response.data.templates);
            }
        } catch (error) {
            console.error('Erro ao buscar templates:', error);
        }
    };

    useEffect(() => {
        if (quote) {
            setFormData(quote);
        } else {
            setFormData({
                clientName: '',
                clientContact: '',
                title: '',
                projectType: 'ti',
                description: '',
                items: [{ description: '', quantity: 1, unitPrice: 0, total: 0 }],
                technicalJustification: '',
                technicalSpecs: ''
            });
        }
    }, [quote, isOpen]);

    if (!isOpen) return null;

    const handleAddItem = () => {
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, { description: '', quantity: 1, unitPrice: 0, total: 0 }]
        }));
    };

    const handleRemoveItem = (index) => {
        const newItems = formData.items.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, items: newItems }));
    };

    const handleApplyTemplate = (value) => {
        let template;
        if (value.startsWith('db_')) {
            const templateId = value.replace('db_', '');
            const dbTemplate = dbTemplates.find(t => t._id === templateId);
            if (dbTemplate) template = dbTemplate.data;
        } else {
            template = HARDCODED_TEMPLATES[value];
        }

        if (template) {
            setFormData(prev => ({
                ...prev,
                title: template.title,
                projectType: template.projectType,
                description: template.description || '',
                items: JSON.parse(JSON.stringify(template.items)),
                technicalSpecs: template.technicalSpecs || '',
                technicalJustification: template.technicalJustification || ''
            }));
        }
    };

    const handleSaveAsTemplate = async () => {
        const templateName = prompt('Nome para o modelo:');
        if (!templateName) return;

        try {
            const templateData = {
                name: templateName,
                type: 'quote',
                data: {
                    title: formData.title,
                    projectType: formData.projectType,
                    description: formData.description,
                    items: formData.items,
                    technicalJustification: formData.technicalJustification,
                    technicalSpecs: formData.technicalSpecs
                }
            };
            const response = await templateService.createTemplate(templateData);
            if (response.ok) {
                alert('Modelo salvo com sucesso!');
                fetchTemplates();
            }
        } catch (error) {
            console.error('Erro ao salvar modelo:', error);
            alert('Erro ao salvar modelo');
        }
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index][field] = value;

        if (field === 'quantity' || field === 'unitPrice') {
            newItems[index].total = newItems[index].quantity * (newItems[index].unitPrice || 0);
        }

        setFormData(prev => ({ ...prev, items: newItems }));
    };

    const handleGenerateWithAI = async () => {
        const desc = prompt('Descreva o serviço para o orçamento (ex: "Cabeamento estruturado para 30 pontos em escritório"):');
        if (!desc) return;

        setAiLoading(true);
        try {
            const res = await api.post('/ai/generate-quote', {
                clientName: formData.clientName || '',
                serviceDescription: desc,
                projectType: formData.projectType || 'ti'
            });
            const data = res.data.data;
            setFormData(prev => ({
                ...prev,
                title: data.title || prev.title,
                projectType: data.projectType || prev.projectType,
                description: data.description || prev.description,
                items: data.items || prev.items,
                technicalJustification: data.technicalJustification || prev.technicalJustification,
                technicalSpecs: data.technicalSpecs || prev.technicalSpecs
            }));
        } catch (err) {
            alert('Erro ao gerar orçamento com IA: ' + (err.response?.data?.error || err.message));
        } finally {
            setAiLoading(false);
        }
    };

    const totalAmount = formData.items.reduce((sum, item) => sum + (item.total || 0), 0);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({ ...formData, totalAmount });
    };

    return (
        <div className="modal-overlay">
            <div className="modal-container modal-lg">
                <div className="modal-header">
                    <div className="flex-row" style={{ gap: '16px', alignItems: 'center' }}>
                        <h2>{quote ? 'Editar Orçamento' : 'Novo Orçamento'}</h2>
                        {!quote && (
                            <div className="template-selector">
                                <Copy size={16} />
                                <select onChange={(e) => handleApplyTemplate(e.target.value)} defaultValue="">
                                    <option value="" disabled>Carregar Modelo...</option>
                                    <optgroup label="Modelos do Sistema">
                                        {Object.entries(HARDCODED_TEMPLATES).map(([key, t]) => (
                                            <option key={key} value={key}>{t.name}</option>
                                        ))}
                                    </optgroup>
                                    {dbTemplates.length > 0 && (
                                        <optgroup label="Meus Modelos">
                                            {dbTemplates.map(t => (
                                                <option key={t._id} value={`db_${t._id}`}>📁 {t.name}</option>
                                            ))}
                                        </optgroup>
                                    )}
                                </select>
                            </div>
                        )}
                        <button type="button" className="btn btn-secondary-pill btn-sm" onClick={handleSaveAsTemplate} title="Salvar como Modelo">
                            <Save size={14} /> Salvar como Modelo
                        </button>
                        <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={handleGenerateWithAI}
                            disabled={aiLoading}
                            style={{ whiteSpace: 'nowrap', background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)' }}
                        >
                            {aiLoading ? <Loader2 size={14} className="spin" /> : <Sparkles size={14} />} Gerar com IA
                        </button>
                    </div>
                    <button className="close-btn" onClick={onClose}><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit} className="modal-body quote-form-v2">
                    <div className="form-section">
                        <div className="section-title">
                            <User size={18} /> <span>Informações do Cliente</span>
                        </div>
                        <div className="grid grid-2">
                            <div className="form-group icon-input">
                                <label>Cliente / Empresa *</label>
                                <div className="input-with-icon">
                                    <User size={16} className="field-icon" />
                                    <input
                                        type="text"
                                        value={formData.clientName}
                                        onChange={e => setFormData({ ...formData, clientName: e.target.value })}
                                        placeholder="Ex: ACME Corp"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-group icon-input">
                                <label>Contato (Email/Tel)</label>
                                <div className="input-with-icon">
                                    <Mail size={16} className="field-icon" />
                                    <input
                                        type="text"
                                        value={formData.clientContact}
                                        onChange={e => setFormData({ ...formData, clientContact: e.target.value })}
                                        placeholder="email@exemplo.com"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="form-section">
                        <div className="section-title">
                            <Tag size={18} /> <span>Dados do Projeto</span>
                        </div>
                        <div className="grid grid-2">
                            <div className="form-group icon-input">
                                <label>Título do Projeto *</label>
                                <div className="input-with-icon">
                                    <FileText size={16} className="field-icon" />
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="Ex: Instalação de Fibra - Bloco A"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-group icon-input">
                                <label>Tipo de Serviço</label>
                                <div className="input-with-icon">
                                    <Briefcase size={16} className="field-icon" />
                                    <select
                                        value={formData.projectType}
                                        onChange={e => setFormData({ ...formData, projectType: e.target.value })}
                                    >
                                        <option value="ti">TI / Suporte</option>
                                        <option value="infraestrutura">Infraestrutura em Obras</option>
                                        <option value="cabeamento">Cabeamento Estruturado</option>
                                        <option value="fibra-optica">Fibra Óptica</option>
                                        <option value="outros">Outros</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="form-group icon-input">
                            <label>Descrição Resumida</label>
                            <div className="input-with-icon align-start">
                                <AlignLeft size={16} className="field-icon" />
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    rows={2}
                                    placeholder="Descreva brevemente o escopo..."
                                />
                            </div>
                        </div>
                    </div>

                    <div className="form-section items-card">
                        <div className="section-header-modern">
                            <div className="section-title">
                                <DollarSign size={18} /> <span>Itens do Orçamento</span>
                            </div>
                            <button type="button" className="btn btn-secondary-pill btn-sm" onClick={handleAddItem}>
                                <Plus size={14} /> Adicionar Item
                            </button>
                        </div>

                        <div className="quote-items-list">
                            {formData.items.map((item, idx) => (
                                <div key={idx} className="quote-item-row-v2">
                                    <div className="field-group flex-3">
                                        <input
                                            placeholder="Descrição do item"
                                            value={item.description}
                                            onChange={e => handleItemChange(idx, 'description', e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="field-group flex-1">
                                        <input
                                            type="number"
                                            placeholder="Qtd"
                                            value={item.quantity}
                                            onChange={e => handleItemChange(idx, 'quantity', Number(e.target.value))}
                                            required
                                        />
                                    </div>
                                    <div className="field-group flex-1">
                                        <input
                                            type="number"
                                            placeholder="R$ Unit"
                                            value={item.unitPrice}
                                            onChange={e => handleItemChange(idx, 'unitPrice', Number(e.target.value))}
                                            required
                                        />
                                    </div>
                                    <div className="item-total-display flex-1">
                                        <span>R$ {item.total.toFixed(2)}</span>
                                    </div>
                                    <button type="button" className="btn-remove" onClick={() => handleRemoveItem(idx)}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="quote-summary-row">
                            <div className="total-label">VALOR TOTAL:</div>
                            <div className="total-value">R$ {totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                        </div>
                    </div>

                    <div className="form-section">
                        <div className="section-title">
                            <FileText size={18} /> <span>Conteúdo Técnico</span>
                        </div>

                        <div className="grid grid-2">
                            <div className="form-group">
                                <label>Justificativa Técnica</label>
                                <textarea
                                    value={formData.technicalJustification}
                                    onChange={e => setFormData({ ...formData, technicalJustification: e.target.value })}
                                    rows={4}
                                    placeholder="Descreva a justificativa estratégica do projeto..."
                                />
                            </div>

                            <div className="form-group">
                                <label>Especificações Técnicas</label>
                                <textarea
                                    value={formData.technicalSpecs}
                                    onChange={e => setFormData({ ...formData, technicalSpecs: e.target.value })}
                                    rows={4}
                                    placeholder="Liste as especificações técnicas e prazos..."
                                />
                            </div>
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn btn-primary">Salvar Orçamento</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
