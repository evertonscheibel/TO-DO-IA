const PDFDocument = require('pdfkit');

/**
 * Generates a PDF for a Quote
 */
exports.generateQuotePDF = (quote, res) => {
    const doc = new PDFDocument({ margin: 50 });

    // Stream PDF to response
    doc.pipe(res);

    // Header
    doc.fillColor('#444444')
        .fontSize(20)
        .text('ORÇAMENTO DE SERVIÇOS', { align: 'center' })
        .moveDown();

    // Company Info (Placeholder - can be customized later)
    doc.fontSize(10)
        .text('Gestão PJ - TI & Infraestrutura', { align: 'right' })
        .text('Contato: contato@gestaopj.com.br', { align: 'right' })
        .moveDown();

    doc.hr = () => {
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();
    };

    doc.hr();

    // Client Info
    doc.fontSize(12).fillColor('#000000');
    doc.text(`CLIENTE: ${quote.clientName}`, { bold: true });
    doc.text(`CONTATO: ${quote.clientContact || 'Não informado'}`);
    doc.text(`PROJETO: ${quote.title}`);
    doc.text(`DATA: ${new Date(quote.createdAt).toLocaleDateString('pt-BR')}`);
    doc.moveDown();

    doc.hr();

    // Description
    doc.fontSize(11).text('DESCRIÇÃO DO ESCOPO:', { underline: true });
    doc.fontSize(10).text(quote.description);
    doc.moveDown();

    // Items Table
    doc.fontSize(11).text('ITENS E VALORES:', { underline: true }).moveDown(0.5);

    // Table Header
    const tableTop = doc.y;
    doc.fontSize(10).fillColor('#444444');
    doc.text('Descrição', 50, tableTop);
    doc.text('Qtd', 350, tableTop, { width: 50, align: 'right' });
    doc.text('V. Unit', 400, tableTop, { width: 70, align: 'right' });
    doc.text('Total', 480, tableTop, { width: 70, align: 'right' });

    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor('#eeeeee').stroke();
    doc.moveDown(0.5);

    // Table Content
    quote.items.forEach(item => {
        const currentY = doc.y;
        doc.fillColor('#000000');
        doc.text(item.description, 50, currentY, { width: 280 });
        doc.text(item.quantity.toString(), 350, currentY, { width: 50, align: 'right' });
        doc.text(`R$ ${item.unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 400, currentY, { width: 70, align: 'right' });
        doc.text(`R$ ${item.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 480, currentY, { width: 70, align: 'right' });
        doc.moveDown(0.8);
    });

    doc.moveDown();
    doc.hr();

    // Totals
    doc.fontSize(14).fillColor('#1d4ed8');
    doc.text(`VALOR TOTAL: R$ ${quote.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, { align: 'right' });
    doc.moveDown(2);

    // Technical Details
    if (quote.technicalJustification) {
        doc.fontSize(11).fillColor('#000000').text('JUSTIFICATIVA TÉCNICA:', { underline: true });
        doc.fontSize(9).text(quote.technicalJustification);
        doc.moveDown();
    }

    if (quote.technicalSpecs) {
        doc.fontSize(11).text('ESPECIFICAÇÕES TÉCNICAS E PRAZOS:', { underline: true });
        doc.fontSize(9).text(quote.technicalSpecs);
        doc.moveDown();
    }

    // Footer
    doc.fontSize(8).fillColor('#999999').text('Este orçamento tem validade de 10 dias a partir da data de emissão.', 50, 700, { align: 'center' });

    doc.end();
};

/**
 * Generates a PDF for a Contract
 */
exports.generateContractPDF = (contract, res) => {
    const doc = new PDFDocument({ margin: 50 });

    doc.pipe(res);

    // Header
    doc.fontSize(18).text('CONTRATO DE PRESTAÇÃO DE SERVIÇOS', { align: 'center' });
    doc.fontSize(12).text(`Nº ${contract.contractNumber}`, { align: 'center' });
    doc.moveDown();

    // Content Handling
    doc.fillColor('#333333');

    const lines = contract.content.split('\n');
    lines.forEach(line => {
        let currentLine = line.trim();

        if (currentLine.startsWith('# ')) {
            // Main Header
            doc.moveDown()
                .fontSize(16)
                .fillColor('#1d4ed8')
                .text(currentLine.replace('# ', '').toUpperCase(), { align: 'center' })
                .moveDown(0.5);
            doc.fillColor('#333333').fontSize(11);
        } else if (currentLine.startsWith('## ')) {
            // Section Header
            doc.moveDown(0.5)
                .fontSize(13)
                .text(currentLine.replace('## ', ''), { bold: true })
                .moveDown(0.2);
            doc.fontSize(11);
        } else if (currentLine.startsWith('**') && currentLine.endsWith('**')) {
            // Bold Line (Simplified)
            doc.text(currentLine.replace(/\*\*/g, ''), { bold: true });
        } else if (currentLine === '---') {
            // Separator
            doc.moveDown(0.5)
                .moveTo(50, doc.y).lineTo(550, doc.y).strokeColor('#cccccc').stroke()
                .moveDown(0.5);
        } else if (currentLine) {
            // Normal text (handle simple inline bolding like **text**)
            // For now, just strip markers but keep it cleaner
            const cleanText = currentLine.replace(/\*\*/g, '');
            doc.text(cleanText, { align: 'justify', lineGap: 3 });
            doc.moveDown(0.4);
        } else {
            // Empty line
            doc.moveDown(0.5);
        }
    });

    doc.moveDown(3);

    // Signatures
    const bottomY = doc.y > 650 ? (doc.addPage(), 100) : doc.y;

    doc.moveTo(50, bottomY).lineTo(250, bottomY).strokeColor('#000000').stroke();
    doc.moveTo(350, bottomY).lineTo(550, bottomY).stroke();

    doc.fontSize(10).text('CONTRATADA', 50, bottomY + 10, { width: 200, align: 'center' });
    doc.text('CONTRATANTE', 350, bottomY + 10, { width: 200, align: 'center' });

    doc.fontSize(8).fillColor('#999999').text(`Gerado via Gestão PJ em ${new Date().toLocaleDateString('pt-BR')}`, 50, 750, { align: 'center' });

    doc.end();
};
