const chaveApi = '8175fA5f6098c5301022f475da32a2aa';
let token = '';
let numeroAtual = 1;
let totalCarregado = 0; // Contador para os discos carregados
const totalDiscos = 104;
const quantidadeRolagem = 4;
const quantidadeInicial = 12; // Quantidade inicial de discos para carregar
let carregando = false; // Variável para evitar requisições simultâneas

// Função para autenticar e obter o token
function autenticar() {
    return fetch('https://ucsdiscosapi.azurewebsites.net/Discos/autenticar', {
        method: 'POST',
        headers: { 'ChaveApi': chaveApi }
    })
        .then(response => response.text())
        .then(data => {
            token = data;
            carregarDiscos(quantidadeInicial); // Carregar 12 discos iniciais
        })
        .catch(error => mostrarErro('Erro ao autenticar: ' + error.message));
}

// Função para carregar discos
function carregarDiscos(quantidade) {
    // Se todos os discos foram carregados, reinicia o contador
    if (totalCarregado >= totalDiscos) {
        totalCarregado = 0; // Reinicia o contador de discos carregados
        numeroAtual = 1; // Reinicia a contagem de discos
    }

    // Verifica se já está carregando para evitar múltiplas requisições simultâneas
    if (carregando) return;
    carregando = true;

    $('#loading').show();
    fetch(`https://ucsdiscosapi.azurewebsites.net/Discos/records?numeroInicio=${numeroAtual}&quantidade=${quantidade}`, {
        method: 'GET',
        headers: { 'TokenApiUCS': token }
    })
        .then(response => response.json())
        .then(data => {
            $('#loading').hide();
            if (data.length > 0) {
                numeroAtual = (numeroAtual + quantidade - 1) % totalDiscos + 1; // Cálculo cíclico para discos
                totalCarregado += data.length; // Atualiza o contador de discos carregados
                exibirDiscos(data);
            } else {
                mostrarErro('Sem discos disponíveis.');
            }
        })
        .catch(error => {
            $('#loading').hide();
            mostrarErro('Erro ao carregar discos: ' + error.message);
        })
        .finally(() => {
            carregando = false;
        });
}

// Função para exibir discos na tela
function exibirDiscos(discos) {
    const albumRow = $('<div class="album-row"></div>'); // Cria uma linha para os discos

    discos.forEach(disco => {
        const albumHtml = `
            <div class="col-md-6 col-sm-12">
                <img src="data:image/jpeg;base64, ${disco.imagemEmBase64}" alt="${disco.descricaoPrimaria}" class="album-cover" data-id="${disco.id}" />
            </div>
        `;
        albumRow.append(albumHtml); // Adiciona cada disco à linha
    });

    $('#albums').append(albumRow); // Adiciona a linha de discos ao container de albums
}

// Função para mostrar erro
function mostrarErro(mensagem) {
    $('#errorBox').val(mensagem);
}

function carregarDetalhesDisco(numero) {
    fetch(`https://ucsdiscosapi.azurewebsites.net/Discos/record?numero=${numero}`, {
        method: 'GET',
        headers: { 'TokenApiUCS': token }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erro na requisição: ${response.status}`);
            }
            return response.json();
        })
        .then(disco => {
            // Atualiza o modal com os dados do disco
            $('#modalImage').attr('src', `data:image/jpeg;base64, ${disco.imagemEmBase64 || ''}`);
            $('#modalName').text(disco.descricaoPrimaria || 'Nome não disponível');
            $('#modalArtist').text(disco.descricaoSecundaria || 'Artista não disponível');
            $('#modalYear').text(disco.Ano || 'Ano não disponível');
            $('#modalDescription').text(disco.Descricao || 'Descrição não disponível');

            // Exibe o modal
            const modal = new bootstrap.Modal(document.getElementById('albumModal'));
            modal.show();
        })
        .catch(error => mostrarErro('Erro ao carregar detalhes: ' + error.message));
}

$(document).ready(function () {
    $('#errorBox').val(''); // Limpa a caixa de erros

    // Autentica e carrega discos
    autenticar();

    // Evento de clique na capa do álbum
    $(document).on('click', '.album-cover', function () {
        const numero = $(this).data('id');
        carregarDetalhesDisco(numero);
    });

    // Implementa rolagem infinita
    $(window).on('scroll', function () {
        // Verifica se o usuário chegou perto do final da página
        if ($(window).scrollTop() + $(window).height() >= $(document).height() - 100) {
            carregarDiscos(quantidadeRolagem); // Carrega mais discos
        }
    });
});
