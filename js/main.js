document.getElementById('fileInput').addEventListener('change', async function(e) {
    const statusDiv = document.getElementById('status');
    const file = e.target.files[0];
    
    if (!file) {
        statusDiv.textContent = 'Por favor, selecione um arquivo.';
        return;
    }

    statusDiv.textContent = 'Processando arquivo...';
    
    try {
        const workbook = await readExcelFile(file);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const dados = XLSX.utils.sheet_to_json(sheet, { header: 'A' });
        
        // Alterado para pegar os valores das colunas A e C e filtrar apenas .com.br
        const dominios = dados
            .map(row => ({
                colunaA: row.A, // Mantém o valor original da coluna A
                original: row.C, // URL original da coluna C
                limpo: limparDominio(row.C) // Valor limpo da coluna C
            }))
            .filter(item => item.original && typeof item.original === 'string')
            .map(item => ({
                colunaA: item.colunaA,
                limpo: item.limpo.toLowerCase()
            }))
            // Adiciona filtro para .com.br
            .filter(item => item.limpo.endsWith('.com.br'))
            .filter((item, index, self) => 
                self.findIndex(t => t.limpo === item.limpo) === index
            );

        // Cria novo workbook mantendo coluna A original e domínios limpos na B
        const newWorkbook = XLSX.utils.book_new();
        
        // Remove o cabeçalho adicional e usa direto os dados
        const dados_formatados = dominios.map(d => [d.colunaA, d.limpo]);
        
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