/**
 * app.js — Controlador Principal da Aplicação
 *
 * Este é o "maestro" do app. Ele:
 * 1. Escuta eventos do usuário (cliques, digitação)
 * 2. Chama o módulo de API para buscar dados
 * 3. Chama o módulo UI para exibir resultados
 * 4. Chama o módulo Favorites para gerenciar favoritos
 *
 * Nenhuma lógica de busca ou de DOM complexa fica aqui —
 * tudo está delegado aos módulos especializados.
 */

const App = (() => {

  // ─── Estado da Aplicação ──────────────────────────────────────
  // Variáveis que guardam o "estado atual" do app

  let currentMeals   = [];   // Receitas exibidas atualmente
  let currentQuery   = '';   // Última busca realizada
  let currentView    = 'explore'; // 'explore' ou 'favorites'
  let lastRetryFn    = null; // Guarda a função para o botão "Tentar novamente"

  // ─── Referências aos Elementos de Controle ───────────────────

  const searchInput  = document.getElementById('search-input');
  const searchBtn    = document.getElementById('search-btn');
  const searchHint   = document.getElementById('search-hint');
  const btnExplore   = document.getElementById('btn-explore');
  const btnFavorites = document.getElementById('btn-favorites');
  const retryBtn     = document.getElementById('retry-btn');
  const goExploreBtn = document.getElementById('go-explore-btn');
  const sortDefault  = document.getElementById('sort-default');
  const sortAlpha    = document.getElementById('sort-alpha');

  // ─── Busca de Receitas ────────────────────────────────────────

  /**
   * Realiza a busca chamando a API e atualiza a UI.
   * Função assíncrona: usa async/await para lidar com a Promise do fetch.
   *
   * @param {string} query - Texto de busca
   */
  async function performSearch(query) {
    const trimmedQuery = query.trim();

    // Validação: não busca se tiver menos de 2 caracteres
    if (trimmedQuery.length < 2) {
      searchHint.textContent = 'Digite pelo menos 2 caracteres para buscar.';
      return;
    }

    searchHint.textContent = '';
    currentQuery = trimmedQuery;
    currentView  = 'explore';

    // Atualiza nav visual
    setActiveNav('explore');

    // Mostra o skeleton de loading enquanto aguarda a API
    UI.showState('loading');

    try {
      const meals = await API.searchMeals(trimmedQuery);

      currentMeals = meals;

      if (meals.length === 0) {
        UI.showState('empty');
        return;
      }

      UI.renderMeals(meals, trimmedQuery);

    } catch (error) {
      // Em caso de falha (sem internet, API fora do ar etc.)
      console.error('[RecipeLab] Erro ao buscar receitas:', error);

      // Guarda a função para o botão "Tentar novamente" poder repetir
      lastRetryFn = () => performSearch(trimmedQuery);

      document.getElementById('error-message').textContent =
        'Verifique sua conexão com a internet e tente novamente.';

      UI.showState('error');
    }
  }

  // ─── Visualização de Favoritos ────────────────────────────────

  /**
   * Muda para a tela de favoritos e exibe as receitas salvas.
   */
  function showFavorites() {
    currentView = 'favorites';
    setActiveNav('favorites');

    const favorites = Favorites.getList();

    if (favorites.length === 0) {
      UI.showState('noFavorites');
      return;
    }

    currentMeals = favorites;
    UI.renderMeals(favorites);
  }

  // ─── Toggle de Favorito ───────────────────────────────────────

  /**
   * Adiciona ou remove uma receita dos favoritos.
   * Pode ser chamada a partir do card ou do modal.
   *
   * @param {string} mealId - ID da receita
   */
  function handleFavoriteToggle(mealId) {
    // Procura a receita no estado atual (currentMeals)
    // Se não achar (ex: favoritando pelo modal sem card visível),
    // usa os dados do modal.
    let meal = currentMeals.find((m) => String(m.idMeal) === String(mealId));

    // Fallback: procura nos favoritos salvos
    if (!meal) {
      meal = Favorites.getList().find((m) => String(m.idMeal) === String(mealId));
    }

    if (!meal) return;

    const added = Favorites.toggle(meal);

    // Atualiza os botões visuais
    UI.updateFavoriteButton(mealId, added);
    UI.updateFavoritesBadge();

    // Feedback ao usuário
    UI.showToast(added ? '❤️ Adicionado aos favoritos!' : '🤍 Removido dos favoritos');

    // Se estamos na view de favoritos e removemos, re-renderiza a lista
    if (currentView === 'favorites' && !added) {
      const updatedFavorites = Favorites.getList();

      if (updatedFavorites.length === 0) {
        currentMeals = [];
        UI.showState('noFavorites');
      } else {
        currentMeals = updatedFavorites;
        UI.renderMeals(updatedFavorites);
      }
    }
  }

  // ─── Ordenação ────────────────────────────────────────────────

  /**
   * Ordena as receitas exibidas atualmente.
   *
   * @param {'default'|'alpha'} sortType
   */
  function handleSort(sortType) {
    if (currentMeals.length === 0) return;

    // Atualiza visual dos botões de sort
    sortDefault.classList.toggle('active', sortType === 'default');
    sortAlpha.classList.toggle('active',   sortType === 'alpha');

    let sorted = [...currentMeals]; // Copia para não mutar o array original

    if (sortType === 'alpha') {
      sorted.sort((a, b) => a.strMeal.localeCompare(b.strMeal, 'pt-BR'));
    }
    // 'default' = sem ordenação (ordem da API)

    const label = currentView === 'favorites' ? '' : currentQuery;
    UI.renderMeals(sorted, label);
  }

  // ─── Abertura do Modal ────────────────────────────────────────

  /**
   * Busca os detalhes completos de uma receita e abre o modal.
   *
   * @param {string} mealId
   */
  async function openRecipeModal(mealId) {
    try {
      // Poderia usar os dados do card, mas buscar novamente garante
      // que temos TODOS os campos (ingredientes, instruções, YouTube...)
      const meal = await API.getMealById(mealId);

      if (!meal) {
        UI.showToast('❌ Não foi possível carregar a receita.');
        return;
      }

      UI.openModal(meal);

    } catch (error) {
      console.error('[RecipeLab] Erro ao abrir receita:', error);
      UI.showToast('❌ Erro ao carregar a receita. Tente novamente.');
    }
  }

  // ─── Navegação ────────────────────────────────────────────────

  /**
   * Atualiza visualmente qual botão do nav está ativo.
   *
   * @param {'explore'|'favorites'} view
   */
  function setActiveNav(view) {
    btnExplore.classList.toggle('nav-btn--active',   view === 'explore');
    btnFavorites.classList.toggle('nav-btn--active', view === 'favorites');
    btnExplore.setAttribute('aria-pressed',   view === 'explore');
    btnFavorites.setAttribute('aria-pressed', view === 'favorites');
  }

  // ─── Registro de Eventos ──────────────────────────────────────

  /**
   * Configura todos os event listeners da aplicação.
   * Centralizar aqui facilita manutenção e evita duplicação.
   */
  function bindEvents() {

    // --- Busca ---

    // Botão de buscar
    searchBtn.addEventListener('click', () => {
      performSearch(searchInput.value);
    });

    // Enter no campo de busca
    searchInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        performSearch(searchInput.value);
      }
    });

    // Limpa hint ao digitar
    searchInput.addEventListener('input', () => {
      if (searchHint.textContent) searchHint.textContent = '';
    });

    // --- Pills de Categoria ---

    document.querySelectorAll('.pill').forEach((pill) => {
      pill.addEventListener('click', () => {
        const query = pill.dataset.search;
        searchInput.value = query;
        performSearch(query);
        // Rola suavemente para os resultados
        document.querySelector('.main-content').scrollIntoView({ behavior: 'smooth' });
      });
    });

    // --- Navegação ---

    btnExplore.addEventListener('click', () => {
      currentView = 'explore';
      setActiveNav('explore');

      if (currentMeals.length > 0 && currentView !== 'favorites') {
        UI.renderMeals(currentMeals, currentQuery);
      } else {
        UI.showState('welcome');
        currentMeals = [];
      }
    });

    btnFavorites.addEventListener('click', showFavorites);
    goExploreBtn.addEventListener('click', () => {
      setActiveNav('explore');
      currentView = 'explore';
      UI.showState('welcome');
    });

    // --- Grid de Receitas (Event Delegation) ---
    // Em vez de adicionar listener em cada card individualmente,
    // ouvimos no container pai. Isso é muito mais eficiente.

    document.getElementById('recipes-grid').addEventListener('click', (event) => {
      const card    = event.target.closest('.recipe-card');
      const favBtn  = event.target.closest('.card-favorite-btn');

      // Clique no botão de favorito
      if (favBtn) {
        event.stopPropagation(); // Não propaga para abrir o modal
        handleFavoriteToggle(favBtn.dataset.id);
        return;
      }

      // Clique no card (abre o modal)
      if (card) {
        openRecipeModal(card.dataset.id);
      }
    });

    // --- Modal ---

    // Fechar pelo botão X
    document.getElementById('modal-close').addEventListener('click', UI.closeModal);

    // Fechar clicando no fundo escuro (overlay)
    document.getElementById('modal-overlay').addEventListener('click', (event) => {
      if (event.target === event.currentTarget) {
        UI.closeModal();
      }
    });

    // Fechar com a tecla Escape (padrão de acessibilidade)
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') UI.closeModal();
    });

    // Tabs do modal
    document.querySelectorAll('.tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        UI.switchTab(btn.dataset.tab);
      });
    });

    // Botão de favorito dentro do modal
    document.getElementById('modal-favorite-btn').addEventListener('click', (event) => {
      handleFavoriteToggle(event.currentTarget.dataset.id);
    });

    // --- Ordenação ---

    sortDefault.addEventListener('click', () => handleSort('default'));
    sortAlpha.addEventListener('click',   () => handleSort('alpha'));

    // --- Tentar novamente ---

    retryBtn.addEventListener('click', () => {
      if (lastRetryFn) lastRetryFn();
    });
  }

  // ─── Inicialização ────────────────────────────────────────────

  /**
   * Ponto de entrada do app.
   * Chamado quando o DOM está pronto (graças ao `defer` no script).
   */
  function init() {
    // Mostra a tela de boas-vindas
    UI.showState('welcome');

    // Atualiza o badge com favoritos salvos anteriormente
    UI.updateFavoritesBadge();

    // Registra todos os eventos
    bindEvents();

    console.log('🍳 RecipeLab iniciado com sucesso!');
  }

  // Inicia o app
  init();

  // Expõe apenas o necessário para debug no console
  return { performSearch, showFavorites };

})();
