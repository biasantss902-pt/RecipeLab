/**
 * api.js — Módulo de comunicação com a API
 *
 * Responsabilidade ÚNICA: buscar dados da TheMealDB.
 * Este módulo não sabe nada de UI, DOM ou favoritos.
 * Princípio: Separation of Concerns (separação de responsabilidades).
 */

const API = (() => {
  // URL base da API pública (gratuita, sem chave necessária)
  const BASE_URL = 'https://www.themealdb.com/api/json/v1/1';

  /**
   * Função interna de fetch com tratamento de erro padronizado.
   * Centraliza o try/catch para que as funções públicas fiquem limpas.
   *
   * @param {string} url - URL completa para buscar
   * @returns {Promise<Object>} - Dados JSON da resposta
   */
  async function fetchData(url) {
    const response = await fetch(url);

    // Se o servidor retornou erro (ex: 404, 500), lança um erro legível
    if (!response.ok) {
      throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  }

  /**
   * Busca receitas pelo nome ou ingrediente.
   * A API usa o parâmetro "s" para busca por nome.
   *
   * @param {string} query - Texto digitado pelo usuário
   * @returns {Promise<Array>} - Lista de receitas ou array vazio
   */
  async function searchMeals(query) {
    const url = `${BASE_URL}/search.php?s=${encodeURIComponent(query)}`;
    const data = await fetchData(url);

    // A API retorna { meals: [...] } ou { meals: null } quando não há resultado
    return data.meals || [];
  }

  /**
   * Busca os detalhes completos de uma receita pelo ID.
   * Usamos quando o usuário clica em um card.
   *
   * @param {string} id - ID da receita (ex: "52772")
   * @returns {Promise<Object|null>} - Objeto da receita ou null
   */
  async function getMealById(id) {
    const url = `${BASE_URL}/lookup.php?i=${id}`;
    const data = await fetchData(url);

    // A API retorna um array com 1 item, então pegamos o primeiro
    return data.meals ? data.meals[0] : null;
  }

  /**
   * Extrai a lista de ingredientes de uma receita.
   *
   * A API TheMealDB não retorna um array de ingredientes.
   * Em vez disso, ela usa campos nomeados como:
   *   strIngredient1, strIngredient2 ... strIngredient20
   *   strMeasure1,    strMeasure2    ... strMeasure20
   *
   * Esta função percorre esses campos e monta um array limpo.
   *
   * @param {Object} meal - Objeto completo de uma receita
   * @returns {Array<{name: string, measure: string}>}
   */
  function extractIngredients(meal) {
    const ingredients = [];

    for (let i = 1; i <= 20; i++) {
      const name    = meal[`strIngredient${i}`];
      const measure = meal[`strMeasure${i}`];

      // Para quando o ingrediente está vazio (fim da lista)
      if (!name || name.trim() === '') break;

      ingredients.push({
        name:    name.trim(),
        measure: measure ? measure.trim() : '',
      });
    }

    return ingredients;
  }

  // Exporta apenas o que outras partes do app precisam acessar
  return {
    searchMeals,
    getMealById,
    extractIngredients,
  };
})();
