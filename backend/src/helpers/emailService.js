const nodemailer = require('nodemailer');

// Configuração básica (usando variáveis de ambiente preferencialmente)
// Se não houver, usaremos um log para simulação.
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || ''
    }
});

/**
 * Envia alerta de e-mail para tarefas vencendo ou vencidas.
 */
const sendDeadlineAlert = async (managerEmail, managerName, tasks) => {
    if (!managerEmail || tasks.length === 0) return;

    const taskListHtml = tasks.map(t => `
        <li>
            <strong>${t.title}</strong> - Prazo: ${t.dueDate ? new Date(t.dueDate).toLocaleDateString('pt-BR') : 'N/A'}
        </li>
    `).join('');

    const mailOptions = {
        from: '"TO DO IA Alertas" <alertas@todoia.com.br>',
        to: managerEmail,
        subject: '⚠️ Alerta de Prazos - TO DO IA',
        html: `
            <div style="font-family: sans-serif; line-height: 1.6;">
                <h2>Olá, ${managerName}</h2>
                <p>As seguintes tarefas estão com o prazo vencido ou próximo do vencimento:</p>
                <ul>${taskListHtml}</ul>
                <p>Por favor, verifique o painel do sistema para mais detalhes.</p>
                <hr>
                <p><small>Este é um e-mail automático do sistema TO DO IA.</small></p>
            </div>
        `
    };

    try {
        if (!process.env.SMTP_USER) {
            console.log(`[EMAIL SIMULADO] Para: ${managerEmail} | Assunto: ${mailOptions.subject}`);
            console.log(`Conteúdo: ${tasks.length} tarefas pendentes.`);
            return true;
        }
        await transporter.sendMail(mailOptions);
        console.log(`[EMAIL ENVIADO] Alerta enviado para ${managerEmail}`);
        return true;
    } catch (err) {
        console.error('[EMAIL ERRO]', err);
        return false;
    }
};

module.exports = { sendDeadlineAlert };
