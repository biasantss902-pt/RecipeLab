/**
 * favorites.js — Módulo de Favoritos
 *
 * Responsabilidade ÚNICA: gerenciar quais receitas estão salvas.
 * Usa o LocalStorage do browser para persistir os dados,
 * ou seja, os favoritos continuam mesmo após fechar a aba.
 *
 * Nenhuma chamada de API aqui. Nenhuma manipulação de DOM pesada.
 */

const Favorites = (() => {
  // Chave usada para salvar no LocalStorage (como um "nome de gaveta")
  const STORAGE_KEY = 'recipelab_favorites';

  /**
   * Lê os favoritos do LocalStorage.
   * Retorna um Map para ter buscas em O(1) por ID.
   *
   * @returns {Map<string, Object>} - Map de id → objeto da receita
   */
  function getAll() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      // Se não há nada salvo, retorna um Map vazio
      if (!raw) return new Map();

      // Converte o JSON salvo de volta para um Map
      const entries = JSON.parse(raw);
      return new Map(entries);
    } catch {
      // Se o JSON estiver corrompido, limpa e recomeça do zero
      localStorage.removeItem(STORAGE_KEY);
      return new Map();
    }
  }

  /**
   * Salva o Map de favoritos no LocalStorage.
   * LocalStorage só armazena strings, por isso convertemos com JSON.
   *
   * @param {Map} favoritesMap
   */
  function save(favoritesMap) {
    // Spread do Map para array de [key, value] antes de serializar
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...favoritesMap]));
  }

  /**
   * Verifica se uma receita está favoritada.
   *
   * @param {string} mealId
   * @returns {boolean}
   */
  function isFavorite(mealId) {
    return getAll().has(String(mealId));
  }

  /**
   * Adiciona ou remove uma receita dos favoritos (toggle).
   * Retorna true se adicionou, false se removeu.
   *
   * @param {Object} meal - Objeto da receita (precisa ter idMeal e strMeal)
   * @returns {boolean} - true = adicionado, false = removido
   */
  function toggle(meal) {
    const map = getAll();
    const id  = String(meal.idMeal);

    if (map.has(id)) {
      map.delete(id);
      save(map);
      return false; // Removido
    } else {
      // Salvamos apenas os campos essenciais para economizar espaço
      map.set(id, {
        idMeal:       meal.idMeal,
        strMeal:      meal.strMeal,
        strCategory:  meal.strCategory,
        strArea:      meal.strArea,
        strMealThumb: meal.strMealThumb,
      });
      save(map);
      return true; // Adicionado
    }
  }

  /**
   * Retorna a lista de favoritos como array (para renderizar na tela).
   *
   * @returns {Array<Object>}
   */
  function getList() {
    return [...getAll().values()];
  }

  /**
   * Retorna a quantidade de favoritos.
   *
   * @returns {number}
   */
  function count() {
    return getAll().size;
  }

  return {
    isFavorite,
    toggle,
    getList,
    count,
  };
})();
