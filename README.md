# RecipeLab 🍳

**Buscador de receitas do mundo todo com favoritos, modal de detalhes e interface responsiva.**

---

## 🖥️ Demo

> Acesse: [seu-link-aqui.github.io/recipe-finder](https://seu-link-aqui.github.io/recipe-finder)

---

## 📋 Sobre o Projeto

O RecipeLab é uma aplicação web que consome a [TheMealDB API](https://www.themealdb.com/) para buscar receitas por nome ou ingrediente. O usuário pode explorar pratos do mundo todo, ver ingredientes e modo de preparo, e salvar favoritos que persistem mesmo após fechar o navegador.

Projeto desenvolvido como portfólio frontend, com foco em código limpo, boas práticas e interface moderna.

---

## ✨ Funcionalidades

- 🔍 Busca por nome de prato ou ingrediente
- 🗂️ Atalhos de categoria (Frango, Massas, Sobremesas...)
- 📄 Modal com ingredientes, modo de preparo e link para YouTube
- ❤️ Sistema de favoritos com persistência via LocalStorage
- 💀 Skeleton loading durante as requisições
- 📱 Layout totalmente responsivo (mobile, tablet e desktop)
- ♿ Acessibilidade com atributos ARIA

---

## 🛠️ Tecnologias

- HTML5 semântico
- CSS3 (variáveis, Grid, Flexbox, animações)
- JavaScript puro (ES6+)
- [TheMealDB API](https://www.themealdb.com/) — gratuita, sem chave

---

## 📁 Estrutura

```
recipe-finder/
├── index.html
├── css/
│   ├── reset.css
│   ├── variables.css
│   ├── main.css
│   ├── components.css
│   └── responsive.css
└── js/
    ├── api.js
    ├── favorites.js
    ├── ui.js
    └── app.js
```

---

## 🚀 Como rodar localmente

```bash
git clone https://github.com/SEU_USUARIO/recipe-finder.git
cd recipe-finder
# Abra o index.html no browser — sem dependências, sem build
```

---

## 📚 Aprendizados aplicados

- Consumo de API REST com `fetch` e `async/await`
- Separação de responsabilidades em módulos JS
- Persistência de dados com `localStorage`
- Event Delegation para performance
- Design system com CSS custom properties
- Acessibilidade com roles e aria-labels

---

## 🔮 Próximos passos

- [ ] Filtro por categoria e origem
- [ ] Dark/Light mode toggle
- [ ] PWA com Service Worker (modo offline)
- [ ] Migração para React

---

Feito com ❤️ por **[Bianca do couto santos](https://github.com/biasantss902-pt)**
