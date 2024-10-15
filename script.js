const medicamentosArray = [];
const laboratoriosArray = [];
let estoque = {};

// Carregar estoque salvo no localStorage ao iniciar
window.addEventListener('DOMContentLoaded', carregarEstoqueDoLocalStorage);

document.getElementById('form-medicamento').addEventListener('submit', function (event) {
    event.preventDefault();

    if (!validateForm()) {
        document.getElementById('error-message').style.display = 'block';
        document.getElementById('feedback').style.display = 'none';
        return;
    }

    const nome = document.getElementById('nome').value;
    const laboratorio = document.getElementById('laboratorio').value;
    const tipoServico = document.getElementById('tipoServico').value;
    const tipoMedicamento = document.getElementById('tipoMedicamento').value;
    const quantidade = document.getElementById('quantidade').value;
    const validade = document.getElementById('validade').value;
    const valorLote = document.getElementById('valorLote').value;
    const lote = document.getElementById('lote').value;
    const valorTotal = quantidade * valorLote;

    const editIndex = document.getElementById('edit-index').value;

    if (editIndex !== "") {
        // Editando medicamento existente
        estoque[nome][editIndex] = {
            laboratorio,
            tipoServico,
            tipoMedicamento,
            quantidade,
            validade,
            valorLote,
            lote,
            valorTotal
        };

        document.getElementById('nome').disabled = false;  // Reabilita o campo nome
        document.getElementById('edit-index').value = "";  // Reseta o índice de edição
    } else {
        // Adicionando novo medicamento
        if (!estoque[nome]) {
            estoque[nome] = [];
            medicamentosArray.push(nome);
            updateDatalist('medicamentos', medicamentosArray);
        }

        if (!laboratoriosArray.includes(laboratorio)) {
            laboratoriosArray.push(laboratorio);
            updateDatalist('laboratorios', laboratoriosArray);
        }

        estoque[nome].push({
            laboratorio,
            tipoServico,
            tipoMedicamento,
            quantidade,
            validade,
            valorLote,
            lote,
            valorTotal
        });
    }

    // Atualiza a exibição e o localStorage
    document.getElementById('feedback').style.display = 'block';
    document.getElementById('error-message').style.display = 'none';
    setTimeout(() => {
        document.getElementById('feedback').style.display = 'none';
    }, 3000);

    salvarEstoqueNoLocalStorage(); // Salva no localStorage
    updateFilterLaboratorio(); // Atualiza o filtro de laboratórios
    verificarMedicamentosVencidos(); // Verifica vencimento dos medicamentos
    updateEstoqueDisplay(); // Atualiza exibição
    resetForm(); // Reseta o formulário
});

// Função para salvar o estoque no localStorage
function salvarEstoqueNoLocalStorage() {
    localStorage.setItem('estoque', JSON.stringify(estoque));
}

// Função para carregar o estoque do localStorage
function carregarEstoqueDoLocalStorage() {
    const estoqueSalvo = localStorage.getItem('estoque');
    if (estoqueSalvo) {
        estoque = JSON.parse(estoqueSalvo);
        medicamentosArray.push(...Object.keys(estoque));
        laboratoriosArray.push(...new Set(Object.values(estoque).flatMap(lotes => lotes.map(l => l.laboratorio))));
        updateDatalist('medicamentos', medicamentosArray);
        updateDatalist('laboratorios', laboratoriosArray);
        updateFilterLaboratorio(); // Atualiza o filtro após carregar laboratórios
        updateEstoqueDisplay();
        verificarMedicamentosVencidos(); // Verifica vencimento após carregar o estoque
    }
}

// Função para validar o formulário
function validateForm() {
    const nome = document.getElementById('nome').value;
    const laboratorio = document.getElementById('laboratorio').value;
    const tipoServico = document.getElementById('tipoServico').value;
    const tipoMedicamento = document.getElementById('tipoMedicamento').value;
    const quantidade = document.getElementById('quantidade').value;
    const validade = document.getElementById('validade').value;
    const valorLote = document.getElementById('valorLote').value;
    const lote = document.getElementById('lote').value;

    return nome && laboratorio && tipoServico && tipoMedicamento && quantidade && validade && valorLote && lote;
}

// Função para atualizar o datalist
function updateDatalist(datalistId, itemsArray) {
    const datalist = document.getElementById(datalistId);
    datalist.innerHTML = '';
    itemsArray.forEach(item => {
        const option = document.createElement('option');
        option.value = item;
        datalist.appendChild(option);
    });
}

// Função para atualizar o filtro de laboratórios
function updateFilterLaboratorio() {
    const filterLaboratorio = document.getElementById('filter-laboratorio');
    filterLaboratorio.innerHTML = '<option value="">Todos os Laboratórios</option>';

    laboratoriosArray.forEach(laboratorio => {
        const option = document.createElement('option');
        option.value = laboratorio;
        option.innerText = laboratorio;
        filterLaboratorio.appendChild(option);
    });
}

// Função para exibir o estoque filtrado
function updateEstoqueDisplay() {
    const estoqueTableBody = document.getElementById('estoque').querySelector('tbody');
    estoqueTableBody.innerHTML = '';

    const searchValue = document.getElementById('search-bar').value.toLowerCase();
    const filterLaboratorio = document.getElementById('filter-laboratorio').value;

    for (let medicamento in estoque) {
        if (medicamento.toLowerCase().includes(searchValue) && (filterLaboratorio === "" || estoque[medicamento].some(lote => lote.laboratorio === filterLaboratorio))) {
            estoque[medicamento].forEach((lote, index) => {
                if (filterLaboratorio === "" || lote.laboratorio === filterLaboratorio) {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${medicamento}</td>
                        <td>${lote.laboratorio}</td>
                        <td>${lote.tipoServico}</td>
                        <td>${lote.tipoMedicamento}</td>
                        <td>${lote.lote}</td>
                        <td>${lote.quantidade}</td>
                        <td>${lote.validade}</td>
                        <td>R$${lote.valorLote}</td>
                        <td>R$${lote.valorTotal}</td>
                        <td>
                            <button onclick="editarMedicamento('${medicamento}', ${index})">Editar</button>
                            <button onclick="excluirMedicamento('${medicamento}', ${index})">Excluir</button>
                        </td>
                    `;
                    estoqueTableBody.appendChild(row);
                }
            });
        }
    }
}

// Função para exportar para CSV
function exportToCSV() {
    const rows = [];
    // Cabeçalhos
    rows.push(['Nome', 'Laboratório', 'Lote', 'Data de Validade', 'Quantidade', 'Valor', 'Tipo de Medicamento'].join(','));

    // Dados
    for (const [nome, lotes] of Object.entries(estoque)) {
        for (const lote of lotes) {
            rows.push([
                nome,
                lote.laboratorio,
                lote.lote,
                lote.validade,
                lote.quantidade,
                lote.valorLote,
                lote.tipoMedicamento
            ].join(','));
        }
    }

    const csvString = rows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'estoque_medicamentos.csv';
    a.click();
    URL.revokeObjectURL(url);
}

// Função para exportar para Excel
function exportToExcel() {
    const rows = [];
    for (const [nome, lotes] of Object.entries(estoque)) {
        for (const lote of lotes) {
            rows.push({
                Nome: nome,
                Laboratório: lote.laboratorio,
                Lote: lote.lote,
                DataDeValidade: lote.validade,
                Quantidade: lote.quantidade,
                Valor: lote.valorLote,
                TipoDeMedicamento: lote.tipoMedicamento
            });
        }
    }

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Medicamentos');
    XLSX.writeFile(workbook, 'estoque_medicamentos.xlsx');
}

async function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const estoque = JSON.parse(localStorage.getItem('estoque')) || {};
    const doc = new jsPDF();

    // Função para formatar valores monetários
    const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);

    // Definir larguras fixas para cada coluna
    const colWidths = {
        lote: 20,
        validade: 30,
        tipoServico: 25,
        tipoMedicamento: 30,
        quantidade: 20,
        valorTotal: 30,
        laboratorio: 40,
    };

    let y = 20; // Posição inicial Y
    const pageWidth = doc.internal.pageSize.getWidth();
    const leftMargin = 10; // Margem esquerda
    const rightMargin = 10; // Margem direita

    // Títulos
    doc.setFontSize(10);
    doc.text('Posição de Estabelecimento', pageWidth / 2, y, { align: 'center' });
    y += 6; // Espaço reduzido após o título
    doc.setFontSize(9);
    doc.text(`Estoque em: ${new Date().toLocaleDateString()}`, pageWidth / 2, y, { align: 'center' });
    y += 6; // Espaço reduzido após o título de data

    Object.keys(estoque).forEach((medicamentoNome) => {
        const lotes = estoque[medicamentoNome];

        // Cabeçalho do medicamento
        doc.setFontSize(10);
        const rectHeight = 8; // Altura do retângulo
        const rectY = y; // Posição Y do retângulo

        // Desenhar o retângulo cinza
        doc.setFillColor(220, 220, 220); // Cor cinza
        doc.rect(0, rectY, pageWidth, rectHeight, 'F'); // Desenha o retângulo

        // Centralizar o texto à esquerda dentro do retângulo
        doc.setTextColor(0); // Cor do texto (preto)
        doc.text(`${medicamentoNome}`, leftMargin, rectY + 5); // Adiciona 5 para posicionar o texto no meio do retângulo

        y += rectHeight + 3; // Ajustar Y para a próxima seção (menos espaço abaixo do retângulo)

        // Resetar cor do texto e fonte para os lotes
        doc.setFontSize(7);
        let totalQuantidade = 0; // Para somar a quantidade
        let totalValor = 0; // Para somar o valor total

        lotes.forEach((lote) => {
            // Informações do lote
            let x = leftMargin; // Reinicia a posição X para as informações do lote

            // Desenhar informações centralizadas
            doc.text(lote.lote, x + (colWidths.lote / 2), y, { align: 'center' });
            x += colWidths.lote; // Atualiza x para a próxima coluna

            doc.text(lote.validade, x + (colWidths.validade / 2), y, { align: 'center' });
            x += colWidths.validade; // Atualiza x para a próxima coluna

            let tipoServicoLines = doc.splitTextToSize(lote.tipoServico, colWidths.tipoServico);
            tipoServicoLines.forEach((line, index) => {
                doc.text(line, x + (colWidths.tipoServico / 2), y + (index * 3), { align: 'center' });
            });
            x += colWidths.tipoServico; // Atualiza x para a próxima coluna

            doc.text(lote.tipoMedicamento, x + (colWidths.tipoMedicamento / 2), y, { align: 'center' });
            x += colWidths.tipoMedicamento; // Atualiza x para a próxima coluna

            // A quantidade agora é tratada como um número
            const quantidade = Number(lote.quantidade);
            doc.text(quantidade.toString(), x + (colWidths.quantidade / 2), y, { align: 'center' });
            totalQuantidade += quantidade; // Acumula a quantidade total
            x += colWidths.quantidade; // Atualiza x para a próxima coluna

            // O valor do lote agora é tratado corretamente como número
            const valorLote = Number(lote.valorLote);
            doc.text(formatCurrency(valorLote), x + (colWidths.valorTotal / 2), y, { align: 'center' });
            totalValor += valorLote; // Acumula o valor total
            x += colWidths.valorTotal; // Atualiza x para a próxima coluna

            // Quebrar texto em várias linhas
            let laboratorioLines = doc.splitTextToSize(lote.laboratorio, colWidths.laboratorio);
            laboratorioLines.forEach((line, index) => {
                doc.text(line, x + (colWidths.laboratorio / 2), y + (index * 3), { align: 'center' });
            });

            y += 3 * Math.max(tipoServicoLines.length, laboratorioLines.length); // Ajustar posição y conforme o número de linhas mais longo
            y += 3; // Espaçamento extra após cada lote
        });

        // Total de Quantidade e Valor após cada medicamento, alinhado à direita na tabela
        y += 3; // Espaçamento extra antes dos totais
        const totalX = leftMargin + colWidths.lote + colWidths.validade + colWidths.tipoServico + 5; // X para o total

        doc.setFontSize(7);
        doc.text(`Total:`, totalX + 7, y); // Texto "Total"
        doc.text(`${totalQuantidade}`, totalX + 33, y); // Quantidade
        doc.text(`${formatCurrency(totalValor)}`, totalX + 55, y); // Valor total

        y += 5; // Espaçamento extra após cada medicamento
    });

    // Finalizar o PDF e salvar
    doc.save('estoque_medicamentos.pdf');
}

// Função para editar medicamento
function editarMedicamento(medicamento, index) {
    const lote = estoque[medicamento][index];
    document.getElementById('nome').value = medicamento;
    document.getElementById('laboratorio').value = lote.laboratorio;
    document.getElementById('tipoServico').value = lote.tipoServico;
    document.getElementById('tipoMedicamento').value = lote.tipoMedicamento;
    document.getElementById('quantidade').value = lote.quantidade;
    document.getElementById('validade').value = lote.validade;
    document.getElementById('valorLote').value = lote.valorLote;
    document.getElementById('lote').value = lote.lote;
    document.getElementById('edit-index').value = index; // Salva o índice para edição
    document.getElementById('nome').disabled = true; // Desabilita o campo nome durante edição
}

// Função para excluir medicamento
function excluirMedicamento(medicamento, index) {
    estoque[medicamento].splice(index, 1);
    if (estoque[medicamento].length === 0) {
        delete estoque[medicamento];
        medicamentosArray.splice(medicamentosArray.indexOf(medicamento), 1);
        updateDatalist('medicamentos', medicamentosArray);
    }
    salvarEstoqueNoLocalStorage(); // Salva após a exclusão
    updateEstoqueDisplay(); // Atualiza a exibição
}

// Função para verificar medicamentos vencidos
function verificarMedicamentosVencidos() {
    const hoje = new Date();
    for (const [nome, lotes] of Object.entries(estoque)) {
        lotes.forEach(lote => {
            const dataValidade = new Date(lote.validade);
            if (dataValidade < hoje) {
                alert(`O medicamento "${nome}" do lote "${lote.lote}" está vencido!`);
            }
        });
    }
}

// Função para resetar o formulário
function resetForm() {
    document.getElementById('form-medicamento').reset();
    document.getElementById('edit-index').value = "";
    document.getElementById('nome').disabled = false; // Reabilita o campo nome
}

// Filtro de pesquisa
document.getElementById('search-bar').addEventListener('input', updateEstoqueDisplay);
document.getElementById('filter-laboratorio').addEventListener('change', updateEstoqueDisplay);

// Eventos para exportação
document.getElementById('export-csv').addEventListener('click', exportToCSV);
document.getElementById('export-excel').addEventListener('click', exportToExcel);
document.getElementById('export-pdf').addEventListener('click', exportToPDF);