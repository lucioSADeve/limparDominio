document.getElementById('uploadForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const statusDiv = document.getElementById('status');
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];
    
    if (!file) {
        statusDiv.textContent = 'Por favor, selecione um arquivo.';
        return;
    }

    statusDiv.textContent = 'Processando arquivo...';
    
    try {
        const workbook = await readExcelFile(file);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const dados = XLSX.utils.sheet_to_json(sheet, { header: 'A' });
        
        // Pega apenas os valores da coluna B (índice 1)
        const dominios = dados
            .map(row => row.B)
            .filter(dominio => dominio && typeof dominio === 'string')
            .map(dominio => limparDominio(dominio))
            .filter((dominio, index, self) => self.indexOf(dominio) === index) // Remove duplicatas
            .map(dominio => dominio.toLowerCase());

        // Cria novo workbook com os domínios limpos
        const newWorkbook = XLSX.utils.book_new();
        const newSheet = XLSX.utils.aoa_to_sheet([['Domínios Limpos'], ...dominios.map(d => [d])]);
        XLSX.utils.book_append_sheet(newWorkbook, newSheet, 'Dominios');

        // Gera o arquivo
        XLSX.writeFile(newWorkbook, 'dominios_limpos.xlsx');
        
        statusDiv.textContent = 'Arquivo processado com sucesso! Baixando resultado...';
    } catch (error) {
        console.error('Erro:', error);
        statusDiv.textContent = 'Erro ao processar arquivo: ' + error.message;
    }
});

function limparDominio(url) {
    // Remove https:// ou http://
    let dominio = url.replace(/^https?:\/\//, '');
    
    // Remove tudo após a primeira barra
    dominio = dominio.split('/')[0];
    
    return dominio;
}

function readExcelFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                resolve(workbook);
            } catch (error) {
                reject(error);
            }
        };
        
        reader.onerror = function(error) {
            reject(error);
        };
        
        reader.readAsArrayBuffer(file);
    });
} 