/**
 * ui.js — Módulo de Interface
 *
 * Responsabilidade ÚNICA: criar e manipular elementos do DOM.
 * Este módulo não faz chamadas de API nem lógica de negócio.
 * Recebe dados e sabe como exibi-los.
 */

const UI = (() => {

  // ─── Referências ao DOM ────────────────────────────────────────
  // Guardamos em variáveis para não precisar chamar getElementById
  // toda hora (boa prática de performance).

  const elements = {
    recipesGrid:      document.getElementById('recipes-grid'),
    resultsHeader:    document.getElementById('results-header'),
    resultsCount:     document.getElementById('results-count'),
    stateLoading:     document.getElementById('state-loading'),
    stateError:       document.getElementById('state-error'),
    stateEmpty:       document.getElementById('state-empty'),
    stateWelcome:     document.getElementById('state-welcome'),
    stateNoFavorites: document.getElementById('state-no-favorites'),
    errorMessage:     document.getElementById('error-message'),
    modalOverlay:     document.getElementById('modal-overlay'),
    modal:            document.getElementById('modal'),
    modalImage:       document.getElementById('modal-image'),
    modalTitle:       document.getElementById('modal-title'),
    modalCategory:    document.getElementById('modal-category'),
    modalArea:        document.getElementById('modal-area'),
    modalIngredients: document.getElementById('modal-ingredients'),
    modalInstructions:document.getElementById('modal-instructions'),
    modalFavoriteBtn: document.getElementById('modal-favorite-btn'),
    modalYoutube:     document.getElementById('modal-youtube'),
    modalClose:       document.getElementById('modal-close'),
    favoriteBadge:    document.getElementById('favorites-badge'),
    toast:            document.getElementById('toast'),
  };

  // ─── Controle de Estados ──────────────────────────────────────

  /**
   * Oculta todos os estados e mostra apenas o desejado.
   * Centralizar isso evita bugs de "dois estados visíveis ao mesmo tempo".
   *
   * @param {'loading'|'error'|'empty'|'welcome'|'results'|'noFavorites'} state
   */
  function showState(state) {
    // Primeiro, oculta tudo
    elements.stateLoading.classList.add('hidden');
    elements.stateError.classList.add('hidden');
    elements.stateEmpty.classList.add('hidden');
    elements.stateWelcome.classList.add('hidden');
    elements.stateNoFavorites.classList.add('hidden');
    elements.resultsHeader.classList.add('hidden');
    elements.recipesGrid.classList.add('hidden');

    // Depois, exibe apenas o estado pedido
    switch (state) {
      case 'loading':
        elements.stateLoading.classList.remove('hidden');
        break;
      case 'error':
        elements.stateError.classList.remove('hidden');
        break;
      case 'empty':
        elements.stateEmpty.classList.remove('hidden');
        break;
      case 'welcome':
        elements.stateWelcome.classList.remove('hidden');
        break;
      case 'noFavorites':
        elements.stateNoFavorites.classList.remove('hidden');
        break;
      case 'results':
        elements.resultsHeader.classList.remove('hidden');
        elements.recipesGrid.classList.remove('hidden');
        break;
    }
  }

  // ─── Renderização dos Cards ───────────────────────────────────

  /**
   * Cria o HTML de um card de receita.
   * Usamos template literal para montar o HTML como string — prática
   * comum em projetos sem framework.
   *
   * @param {Object} meal - Dados da receita
   * @returns {string} - HTML do card
   */
  function createCardHTML(meal) {
    const isFav    = Favorites.isFavorite(meal.idMeal);
    const favEmoji = isFav ? '❤️' : '🤍';
    const favClass = isFav ? 'is-favorite' : '';

    return `
      <article
        class="recipe-card"
        role="listitem"
        data-id="${meal.idMeal}"
        aria-label="Receita: ${meal.strMeal}"
      >
        <div class="card-image-wrapper">
          <img
            class="card-image"
            src="${meal.strMealThumb}"
            alt="${meal.strMeal}"
            loading="lazy"
          />
          <div class="card-image-overlay" aria-hidden="true"></div>

          ${meal.strCategory ? `
            <span class="card-category-badge">${meal.strCategory}</span>
          ` : ''}

          <button
            class="card-favorite-btn ${favClass}"
            data-id="${meal.idMeal}"
            aria-label="${isFav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}"
            aria-pressed="${isFav}"
          >
            ${favEmoji}
          </button>
        </div>

        <div class="card-body">
          <h3 class="card-title">${meal.strMeal}</h3>
          <div class="card-meta">
            ${meal.strArea ? `
              <span class="card-area">🌍 ${meal.strArea}</span>
            ` : ''}
          </div>
        </div>

        <div class="card-footer">
          <span class="card-cta">
            Ver receita
            <span class="card-cta-arrow" aria-hidden="true">→</span>
          </span>
        </div>
      </article>
    `;
  }

  /**
   * Renderiza uma lista de receitas no grid.
   * Constrói todo o HTML de uma vez e insere em um único reflow —
   * muito mais performático do que inserir card por card.
   *
   * @param {Array} meals - Lista de receitas
   * @param {string} label - Texto do contador (ex: "Frango")
   */
  function renderMeals(meals, label = '') {
    elements.recipesGrid.innerHTML = meals.map(createCardHTML).join('');

    // Atualiza o contador de resultados
    const count = meals.length;
    elements.resultsCount.innerHTML = `
      <strong>${count} receita${count !== 1 ? 's' : ''}</strong>
      ${label ? `para "<em>${label}</em>"` : 'nos favoritos'}
    `;

    showState('results');
  }

  // ─── Badge de Favoritos ───────────────────────────────────────

  /**
   * Atualiza o número no badge do botão "Favoritos" no header.
   */
  function updateFavoritesBadge() {
    const count = Favorites.count();
    elements.favoriteBadge.textContent = count;

    // Animação de "pop" para chamar atenção
    elements.favoriteBadge.classList.remove('pop');
    // O requestAnimationFrame garante que o browser processe a remoção antes de adicionar
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        elements.favoriteBadge.classList.add('pop');
      });
    });

    // Remove a classe de pop após a animação
    setTimeout(() => elements.favoriteBadge.classList.remove('pop'), 300);
  }

  /**
   * Atualiza o estado visual de um botão de favorito específico.
   *
   * @param {string} mealId
   * @param {boolean} isFavorite
   */
  function updateFavoriteButton(mealId, isFavorite) {
    // Atualiza todos os botões com esse ID (card + modal podem estar abertos juntos)
    const buttons = document.querySelectorAll(`[data-id="${mealId}"]`);

    buttons.forEach((btn) => {
      if (btn.classList.contains('card-favorite-btn') || btn.id === 'modal-favorite-btn') {
        btn.textContent  = isFavorite ? '❤️' : '🤍';
        btn.classList.toggle('is-favorite', isFavorite);
        btn.setAttribute('aria-pressed', isFavorite);
        btn.setAttribute(
          'aria-label',
          isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'
        );
      }
    });
  }

  // ─── Modal ────────────────────────────────────────────────────

  /**
   * Abre o modal e preenche com os detalhes de uma receita.
   *
   * @param {Object} meal - Dados completos da receita
   */
  function openModal(meal) {
    const ingredients = API.extractIngredients(meal);
    const isFav       = Favorites.isFavorite(meal.idMeal);

    // Preenche os campos do modal
    elements.modalImage.src              = meal.strMealThumb;
    elements.modalImage.alt              = meal.strMeal;
    elements.modalTitle.textContent      = meal.strMeal;
    elements.modalCategory.textContent   = meal.strCategory || '';
    elements.modalArea.textContent       = meal.strArea ? `🌍 ${meal.strArea}` : '';

    // Botão de favorito
    elements.modalFavoriteBtn.textContent = isFav ? '❤️' : '🤍';
    elements.modalFavoriteBtn.classList.toggle('is-favorite', isFav);
    elements.modalFavoriteBtn.setAttribute('aria-pressed', isFav);
    elements.modalFavoriteBtn.dataset.id  = meal.idMeal;

    // Renderiza a lista de ingredientes
    elements.modalIngredients.innerHTML = ingredients.map((ing) => `
      <li class="ingredient-item">
        <img
          class="ingredient-thumb"
          src="https://www.themealdb.com/images/ingredients/${encodeURIComponent(ing.name)}-Small.png"
          alt="${ing.name}"
          loading="lazy"
          onerror="this.style.display='none'"
        />
        <div class="ingredient-info">
          <span class="ingredient-name">${ing.name}</span>
          <span class="ingredient-measure">${ing.measure}</span>
        </div>
      </li>
    `).join('');

    // Formata as instruções: quebra por número de passo se tiver
    elements.modalInstructions.textContent = meal.strInstructions || 'Instruções não disponíveis.';

    // Link do YouTube (opcional)
    if (meal.strYoutube) {
      elements.modalYoutube.href = meal.strYoutube;
      elements.modalYoutube.classList.remove('hidden');
    } else {
      elements.modalYoutube.classList.add('hidden');
    }

    // Reseta para a aba de ingredientes sempre que abre
    switchTab('ingredients');

    // Exibe o modal
    elements.modalOverlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; // Impede scroll do fundo

    // Foco no botão de fechar para acessibilidade (navegação por teclado)
    setTimeout(() => elements.modalClose.focus(), 50);
  }

  /**
   * Fecha o modal.
   */
  function closeModal() {
    elements.modalOverlay.classList.add('hidden');
    document.body.style.overflow = ''; // Libera o scroll
  }

  // ─── Tabs do Modal ────────────────────────────────────────────

  /**
   * Alterna entre as abas "Ingredientes" e "Modo de Preparo".
   *
   * @param {'ingredients'|'instructions'} tabId
   */
  function switchTab(tabId) {
    const tabs     = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.tab-content');

    // Desativa todas as abas e painéis
    tabs.forEach((tab) => {
      tab.classList.remove('tab-btn--active');
      tab.setAttribute('aria-selected', 'false');
    });

    contents.forEach((content) => content.classList.add('hidden'));

    // Ativa apenas a selecionada
    const activeTab     = document.querySelector(`[data-tab="${tabId}"]`);
    const activeContent = document.getElementById(`tab-${tabId}`);

    if (activeTab)     {
      activeTab.classList.add('tab-btn--active');
      activeTab.setAttribute('aria-selected', 'true');
    }
    if (activeContent) activeContent.classList.remove('hidden');
  }

  // ─── Toast Notification ───────────────────────────────────────

  let toastTimer = null;

  /**
   * Exibe uma notificação temporária (toast) na parte inferior da tela.
   *
   * @param {string} message - Mensagem a exibir
   * @param {number} duration - Duração em ms (padrão: 2500)
   */
  function showToast(message, duration = 2500) {
    elements.toast.textContent = message;
    elements.toast.classList.add('toast--visible');

    // Se já existe um timer, cancela para não sobrepor
    if (toastTimer) clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
      elements.toast.classList.remove('toast--visible');
    }, duration);
  }

  // ─── Expõe a API Pública do Módulo ───────────────────────────

  return {
    elements,
    showState,
    renderMeals,
    updateFavoritesBadge,
    updateFavoriteButton,
    openModal,
    closeModal,
    switchTab,
    showToast,
  };
})();
