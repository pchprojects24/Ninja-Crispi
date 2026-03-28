(function () {
  const data = window.NINJA_CRISPI_DATA;

  const elements = {
    productSummary: document.getElementById("productSummary"),
    heroStats: document.getElementById("heroStats"),
    quickFacts: document.getElementById("quickFacts"),
    filterChips: document.getElementById("filterChips"),
    searchInput: document.getElementById("searchInput"),
    resultsSummary: document.getElementById("resultsSummary"),
    searchResults: document.getElementById("searchResults"),
    highlightCards: document.getElementById("highlightCards"),
    mealIdeas: document.getElementById("mealIdeas"),
    recipeCards: document.getElementById("recipeCards"),
    sourceCards: document.getElementById("sourceCards"),
    researchCards: document.getElementById("researchCards"),
    favoritesOnly: document.getElementById("favoritesOnly"),
    randomRecipeButton: document.getElementById("randomRecipeButton"),
    recipeDialog: document.getElementById("recipeDialog"),
    dialogContent: document.getElementById("dialogContent"),
    closeDialogButton: document.getElementById("closeDialogButton"),
  };

  const FAVORITES_KEY = "ninja-crispi-companion.favorites.v1";
  const MAX_RESULTS = 24;
  const state = {
    activeFilter: "all",
    query: "",
    queryRegex: null,
    queryRegexSource: "",
    favoritesOnly: false,
    favorites: new Set(loadFavorites()),
  };

  const searchIndex = [
    ...data.recipes.map((recipe) => ({
      id: `recipe:${recipe.title}`,
      kind: "recipe",
      category: "recipes",
      title: recipe.title,
      subtitle: `${recipe.container} • ${recipe.function}`,
      text: [recipe.summary, recipe.time, recipe.serves, recipe.tags.join(" "), recipe.pageRef].join(" "),
      source: recipe.pageRef,
      href: "#recipes",
      favoriteId: `recipe:${recipe.title}`,
    })),
    ...data.highlights.map((highlight) => {
      const lowerSource = highlight.source.toLowerCase();
      return {
        id: `highlight:${highlight.id}`,
        kind: "highlight",
        category: highlight.category,
        title: highlight.title,
        subtitle: "Guide summary",
        text: highlight.bullets.join(" "),
        source: highlight.source,
        href:
          lowerSource.includes("owner") || lowerSource.includes("care")
            ? "download.pdf"
            : "18733282951964.pdf",
        favoriteId: `highlight:${highlight.id}`,
      };
    }),
    ...data.pages.map((page) => ({
      id: page.id,
      kind: "page",
      category: page.category,
      title: page.title,
      subtitle: `${page.sourceTitle} • page ${page.page}`,
      text: page.text,
      source: `${page.file} • page ${page.page}`,
      href: page.file,
      favoriteId: page.id,
    })),
  ];

  const categories = [
    { id: "all", label: "All" },
    { id: "recipes", label: "Recipes" },
    { id: "charts", label: "Charts" },
    { id: "how-to", label: "How-to" },
    { id: "care", label: "Care" },
    { id: "safety", label: "Safety" },
    { id: "meal-plan", label: "Meal plan" },
    { id: "troubleshooting", label: "Troubleshooting" },
  ];

  function loadFavorites() {
    try {
      return JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]");
    } catch (error) {
      return [];
    }
  }

  function saveFavorites() {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify([...state.favorites]));
  }

  function escapeHtml(value) {
    return value.replace(/[&<>"']/g, (character) => {
      const replacements = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      };

      return replacements[character];
    });
  }

  function highlightText(text) {
    const safe = escapeHtml(text);
    if (!state.query.trim()) {
      return safe;
    }

    const expression = getQueryRegex();
    return safe.replace(expression, "<mark>$1</mark>");
  }

  function getQueryRegex() {
    const query = state.query.trim();
    if (!query) {
      return null;
    }

    if (state.queryRegex && state.queryRegexSource === query) {
      return state.queryRegex;
    }

    state.queryRegexSource = query;
    state.queryRegex = new RegExp(`(${escapeRegExp(query)})`, "ig");
    return state.queryRegex;
  }

  function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function toggleFavorite(favoriteId) {
    if (state.favorites.has(favoriteId)) {
      state.favorites.delete(favoriteId);
    } else {
      state.favorites.add(favoriteId);
    }

    saveFavorites();
    renderSearchResults();
    renderRecipeCards();
  }

  function favoriteButtonMarkup(favoriteId) {
    const isFavorite = state.favorites.has(favoriteId);
    return `
      <button
        class="favorite-button ${isFavorite ? "is-favorite" : ""}"
        type="button"
        data-favorite-id="${favoriteId}"
        aria-label="${isFavorite ? "Remove favorite" : "Add favorite"}"
        title="${isFavorite ? "Remove favorite" : "Add favorite"}"
      >${isFavorite ? "★" : "☆"}</button>
    `;
  }

  function renderHero() {
    elements.productSummary.textContent = `${data.product.summary} ${data.product.appBlurb}`;

    elements.heroStats.innerHTML = [
      `${data.sources.length} source PDFs`,
      `${data.pages.length} extracted pages`,
      `${data.recipes.length} recipe spotlights`,
      `${data.onlineResearch.length} extra links`,
    ]
      .map((label) => `<span class="stat-pill">${label}</span>`)
      .join("");

    elements.quickFacts.innerHTML = data.product.keyFacts
      .map(
        (fact) => `
          <div>
            <dt>${fact.label}</dt>
            <dd>${fact.value}</dd>
          </div>
        `,
      )
      .join("");
  }

  function renderFilters() {
    elements.filterChips.innerHTML = categories
      .map(
        (category) => `
          <button
            class="chip ${state.activeFilter === category.id ? "is-active" : ""}"
            type="button"
            data-filter="${category.id}"
          >
            ${category.label}
          </button>
        `,
      )
      .join("");
  }

  function renderHighlights() {
    elements.highlightCards.innerHTML = data.highlights
      .map(
        (highlight) => `
          <article class="highlight-card">
            <div class="result__actions">
              <span class="source-badge">${highlight.source}</span>
              ${favoriteButtonMarkup(`highlight:${highlight.id}`)}
            </div>
            <h3>${highlight.title}</h3>
            <ul>
              ${highlight.bullets.map((bullet) => `<li>${bullet}</li>`).join("")}
            </ul>
          </article>
        `,
      )
      .join("");
  }

  function renderMealIdeas() {
    elements.mealIdeas.innerHTML = data.mealIdeas.map((idea) => `<li>${idea}</li>`).join("");
  }

  function renderRecipeCards() {
    elements.recipeCards.innerHTML = data.recipes
      .map((recipe) => {
        const favoriteId = `recipe:${recipe.title}`;
        return `
          <article class="recipe-card">
            <div class="result__actions">
              <span class="source-badge">${recipe.pageRef}</span>
              ${favoriteButtonMarkup(favoriteId)}
            </div>
            <h3>${recipe.title}</h3>
            <p>${recipe.summary}</p>
            <div class="recipe-card__meta">
              <span class="tag tag--source">${recipe.container}</span>
              <span class="tag tag--source">${recipe.function}</span>
            </div>
            <div class="tag-row">
              ${recipe.tags.map((tag) => `<span class="tag">${tag}</span>`).join("")}
            </div>
            <div class="result__actions">
              <span class="result__meta">${recipe.time} • ${recipe.serves}</span>
              <button class="button button--ghost" type="button" data-open-recipe="${recipe.title}">
                Open recipe
              </button>
            </div>
          </article>
        `;
      })
      .join("");
  }

  function renderSources() {
    elements.sourceCards.innerHTML = data.sources
      .map(
        (source) => `
          <article class="source-card">
            <h3>${source.title}</h3>
            <p>${source.summary}</p>
            <div class="tag-row">
              <span class="tag tag--source">${source.pages} pages</span>
              <span class="tag tag--source">${source.type}</span>
            </div>
            <div class="result__actions">
              <a class="button button--ghost" href="./${source.file}" target="_blank" rel="noreferrer">
                Open PDF
              </a>
              <a class="button button--ghost" href="./${source.file}" download>
                Download
              </a>
            </div>
          </article>
        `,
      )
      .join("");
  }

  function renderResearch() {
    elements.researchCards.innerHTML = data.onlineResearch
      .map(
        (item) => `
          <article class="research-card">
            <h3>${item.title}</h3>
            <p>${item.note}</p>
            <a class="button button--ghost" href="${item.url}" target="_blank" rel="noreferrer">
              Visit source
            </a>
          </article>
        `,
      )
      .join("");
  }

  function buildSnippet(item) {
    const sourceText = item.kind === "page" ? item.text : `${item.subtitle}. ${item.text}`;
    const query = state.query.trim().toLowerCase();
    if (!query) {
      return highlightText(sourceText.slice(0, 220)) + (sourceText.length > 220 ? "…" : "");
    }

    const matchIndex = sourceText.toLowerCase().indexOf(query);
    if (matchIndex === -1) {
      return highlightText(sourceText.slice(0, 220)) + (sourceText.length > 220 ? "…" : "");
    }

    const start = Math.max(0, matchIndex - 70);
    const end = Math.min(sourceText.length, matchIndex + query.length + 150);
    const prefix = start > 0 ? "…" : "";
    const suffix = end < sourceText.length ? "…" : "";
    return `${prefix}${highlightText(sourceText.slice(start, end))}${suffix}`;
  }

  function renderSearchResults() {
    const query = state.query.trim().toLowerCase();
    const results = searchIndex.filter((item) => {
      const matchesFilter = state.activeFilter === "all" || item.category === state.activeFilter;
      const matchesText =
        !query ||
        item.title.toLowerCase().includes(query) ||
        item.subtitle.toLowerCase().includes(query) ||
        item.text.toLowerCase().includes(query);
      const matchesFavorite = !state.favoritesOnly || state.favorites.has(item.favoriteId);
      return matchesFilter && matchesText && matchesFavorite;
    });

    const displayedCount = Math.min(results.length, MAX_RESULTS);
    elements.resultsSummary.textContent =
      results.length > displayedCount
        ? `Showing ${displayedCount} of ${results.length} results`
        : `${results.length} result${results.length === 1 ? "" : "s"} shown`;

    if (!results.length) {
      elements.searchResults.innerHTML = `
        <div class="empty-state">
          Try a broader search like <strong>cleaning</strong>, <strong>air fry</strong>, or <strong>chicken</strong>.
        </div>
      `;
      return;
    }

    elements.searchResults.innerHTML = results
      .slice(0, MAX_RESULTS)
      .map(
        (item) => `
          <article class="result">
            <div class="result__actions">
              <span class="source-badge">${item.subtitle}</span>
              ${favoriteButtonMarkup(item.favoriteId)}
            </div>
            <h3>${highlightText(item.title)}</h3>
            <p>${buildSnippet(item)}</p>
            <div class="result__actions">
              <span class="result__meta">${item.source}</span>
              ${
                item.kind === "recipe"
                  ? `<button class="button button--ghost" type="button" data-open-recipe="${item.title}">Open recipe</button>`
                  : `<a class="button button--ghost" href="./${item.href}" target="_blank" rel="noreferrer">Open source</a>`
              }
            </div>
          </article>
        `,
      )
      .join("");
  }

  function openRecipe(title) {
    const recipe = data.recipes.find((item) => item.title === title);
    if (!recipe) {
      return;
    }

    elements.dialogContent.innerHTML = `
      <p class="eyebrow">Recipe spotlight</p>
      <h3>${recipe.title}</h3>
      <div class="dialog__meta">
        <span class="tag tag--source">${recipe.container}</span>
        <span class="tag tag--source">${recipe.function}</span>
        <span class="tag tag--source">${recipe.pageRef}</span>
      </div>
      <p>${recipe.summary}</p>
      <p><strong>Timing:</strong> ${recipe.time}</p>
      <p><strong>Servings:</strong> ${recipe.serves}</p>
      <div class="tag-row">${recipe.tags.map((tag) => `<span class="tag">${tag}</span>`).join("")}</div>
      <div class="result__actions">
        <a class="button button--primary" href="#searchSection">Search for ingredients or notes</a>
        <a class="button button--ghost" href="./18733282951964.pdf" target="_blank" rel="noreferrer">
          Open the guide
        </a>
      </div>
    `;

    elements.recipeDialog.showModal();
  }

  function openRandomRecipe() {
    const recipe = data.recipes[Math.floor(Math.random() * data.recipes.length)];
    openRecipe(recipe.title);
  }

  function bindEvents() {
    elements.filterChips.addEventListener("click", (event) => {
      const button = event.target.closest("[data-filter]");
      if (!button) {
        return;
      }

      state.activeFilter = button.dataset.filter;
      renderFilters();
      renderSearchResults();
    });

    elements.searchInput.addEventListener("input", (event) => {
      state.query = event.target.value;
      renderSearchResults();
    });

    elements.favoritesOnly.addEventListener("change", (event) => {
      state.favoritesOnly = event.target.checked;
      renderSearchResults();
    });

    document.addEventListener("click", (event) => {
      const favoriteButton = event.target.closest("[data-favorite-id]");
      if (favoriteButton) {
        toggleFavorite(favoriteButton.dataset.favoriteId);
        return;
      }

      const openRecipeButton = event.target.closest("[data-open-recipe]");
      if (openRecipeButton) {
        openRecipe(openRecipeButton.dataset.openRecipe);
      }
    });

    elements.randomRecipeButton.addEventListener("click", openRandomRecipe);
    elements.closeDialogButton.addEventListener("click", () => elements.recipeDialog.close());
    elements.recipeDialog.addEventListener("click", (event) => {
      if (event.target === elements.recipeDialog) {
        elements.recipeDialog.close();
      }
    });
  }

  renderHero();
  renderFilters();
  renderHighlights();
  renderMealIdeas();
  renderRecipeCards();
  renderSources();
  renderResearch();
  renderSearchResults();
  bindEvents();
})();
