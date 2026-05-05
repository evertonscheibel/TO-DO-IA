const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');
const outputFile = path.join(projectRoot, 'sistema_todo_ia.txt');

const ignoredDirs = ['node_modules', 'dist', '.git', '.vscode', '.gemini'];
const allowedExtensions = ['.js', '.jsx', '.css', '.html', '.bat', '.vbs', '.json', '.env'];
const ignoredFiles = ['package-lock.json', 'json trello.json', 'backend.log', 'frontend.log'];

function isAllowedFile(filePath) {
    const ext = path.extname(filePath);
    const basename = path.basename(filePath);
    return allowedExtensions.includes(ext) && !ignoredFiles.includes(basename);
}

function scanDirectory(dir, fileList = []) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            if (!ignoredDirs.includes(file)) {
                scanDirectory(fullPath, fileList);
            }
        } else if (isAllowedFile(fullPath)) {
            fileList.push(fullPath);
        }
    }

    return fileList;
}

function generateSnapshot() {
    console.log('Criando snapshot do projeto...');
    if (fs.existsSync(outputFile)) {
        fs.unlinkSync(outputFile);
    }

    const allFiles = scanDirectory(projectRoot);
    let outputContent = `# TO DO IA - SISTEMA COMPLETO\n\nEste arquivo contém todo o código atualizado do sistema para análise de IA.\n\n`;

    let processedCount = 0;
    for (const filePath of allFiles) {
        // Ignora arquivos do próprio script ou saídas
        if (filePath.includes('generate_snapshot') || filePath === outputFile) continue;

        const relativePath = path.relative(projectRoot, filePath);
        const fileContent = fs.readFileSync(filePath, 'utf8');

        outputContent += `================================================================================\n`;
        outputContent += `Arquivo: ${relativePath}\n`;
        outputContent += `================================================================================\n`;
        outputContent += `\n${fileContent}\n\n`;
        processedCount++;
    }

    fs.writeFileSync(outputFile, outputContent);
    console.log(`Snapshot gerado com sucesso! ${processedCount} arquivos incluídos.`);
    console.log(`Arquivo salvo em: ${outputFile}`);
}

generateSnapshot();
