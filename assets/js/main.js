const pokemonList = document.getElementById('pokemonList')
const loadMoreButton = document.getElementById('loadMoreButton')

const maxRecords = 151
const limit = 10
let offset = 0;

// Renderiza um item da lista inicial (sem stats, mas com a foto)
function convertPokemonToLi(pokemon) {
    return `
        <li class="pokemon ${pokemon.type}" data-pokemon-id="${pokemon.number}">
            <span class="number">#${pokemon.number}</span>
            <span class="name">${pokemon.name}</span>
            <div class="detail">
                <ol class="types">
                    ${pokemon.types.map((type) => `<li class="type ${type}">${type}</li>`).join('')}
                </ol>
                <img src="${pokemon.photo}" alt="${pokemon.name}" onerror="this.onerror=null;this.src='https://via.placeholder.com/150'">
            </div>
        </li>
    `;
}

// Renderiza a visualização detalhada de um único Pokémon, incluindo o botão de voltar
function pokemonDetails(pokemon) {
    return `
        <div class="pokemon-details-container">
            <button id="backButton">Voltar</button>
            <li class="pokemon" id="all-details">
                <span class="number">#${pokemon.number}</span>
                <span class="name">${pokemon.name}</span>

                <div class="detail" id="plus-details">
                    <ol class="types">
                        ${pokemon.types.map((type) => `<li class="type ${type}">${type}</li>`).join('')}
                    </ol>
                    
                    <div class="stats">
                        <p>HP: ${pokemon.hp}</p>
                        <p>Attack: ${pokemon.attack}</p>
                        <p>Defense: ${pokemon.defense}</p>
                        <p>Speed: ${pokemon.speed}</p>
                    </div>
                    
                    <img src="${pokemon.photo}" alt="${pokemon.name}">
                </div>
            </li>
        </div>
    `;
}

// A função que busca os detalhes de um Pokémon específico
function fetchPokemonDetails(pokemonUrl) {
    return fetch(pokemonUrl)
        .then(response => response.json())
        .then(pokeData => {
            const stats = pokeData.stats.reduce((acc, current) => {
                acc[current.stat.name] = current.base_stat;
                return acc;
            }, {});
            
            return {
                name: pokeData.name,
                number: pokeData.id,
                types: pokeData.types.map(typeInfo => typeInfo.type.name),
                type: pokeData.types[0].type.name,
                photo: pokeData.sprites.other.dream_world.front_default || pokeData.sprites.front_default,
                hp: stats.hp,
                attack: stats.attack,
                defense: stats.defense,
                speed: stats.speed,
            };
        });
}

// Função para buscar e renderizar a lista de Pokémons
function loadPokemonItens(offset, limit, replace = false) {
    fetch(`https://pokeapi.co/api/v2/pokemon?offset=${offset}&limit=${limit}`)
        .then(response => response.json())
        .then(data => {
            const promises = data.results.map(p => fetchPokemonDetails(p.url));
            return Promise.all(promises);
        })
        .then(pokemons => {
            const newHtml = pokemons.map(convertPokemonToLi).join('');
            if (replace) {
                pokemonList.innerHTML = newHtml;
            } else {
                pokemonList.innerHTML += newHtml;
            }
        })
        .catch(error => console.error('Erro ao buscar Pokémons:', error));
}


// Carrega a lista inicial de Pokémons
loadPokemonItens(offset, limit);

// Evento do botão "Carregar mais"
loadMoreButton.addEventListener('click', () => {
    offset += limit;
    const qtdRecordsWithNexPage = offset + limit;

    if (qtdRecordsWithNexPage >= maxRecords) {
        const newLimit = maxRecords - offset;
        loadPokemonItens(offset, newLimit);
        loadMoreButton.parentElement.removeChild(loadMoreButton);
    } else {
        loadPokemonItens(offset, limit);
    }
});

// Evento de clique para os Pokémons da lista
pokemonList.addEventListener('click', (event) => {
    const li = event.target.closest('li.pokemon');
    if (li) {
        const pokemonId = li.dataset.pokemonId;
        
        // Oculta o botão "Carregar mais"
        loadMoreButton.style.display = 'none';

        fetchPokemonDetails(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`)
            .then(pokemon => {
                const detailsHtml = pokemonDetails(pokemon);
                pokemonList.innerHTML = detailsHtml;

                // Adiciona o evento para o novo botão de voltar
                const backButton = document.getElementById('backButton');
                backButton.addEventListener('click', () => {
                    pokemonList.innerHTML = ''; // Limpa a tela
                    offset = 0; // Volta para o início da lista
                    loadPokemonItens(offset, limit, true); // Recarrega a lista
                    
                    // Exibe o botão "Carregar mais" novamente
                    loadMoreButton.style.display = 'block';
                });
            })
            .catch(error => {
                console.error('Erro ao buscar detalhes do Pokémon:', error);
            });
    }
});