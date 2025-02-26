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
        
        // Alterado para pegar os valores da coluna C ao invés da B
        const dominios = dados
            .map(row => ({
                original: row.C, // Mantém o valor original
                limpo: limparDominio(row.C) // Valor limpo
            }))
            .filter(item => item.original && typeof item.original === 'string')
            .map(item => ({
                original: item.original,
                limpo: item.limpo.toLowerCase()
            }))
            .filter((item, index, self) => 
                self.findIndex(t => t.limpo === item.limpo) === index
            );

        // Cria novo workbook com os domínios originais e limpos
        const newWorkbook = XLSX.utils.book_new();
        
        const dados_formatados = [
            ['URL Original', 'Domínios Limpos'], // Cabeçalho
            ...dominios.map(d => [d.original, d.limpo]) // Dados com URL original na A e domínio limpo na B
        ];
        
        const newSheet = XLSX.utils.aoa_to_sheet(dados_formatados);
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