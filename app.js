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
    showShortcutsButton: document.getElementById("showShortcutsButton"),
    recipeDialog: document.getElementById("recipeDialog"),
    dialogContent: document.getElementById("dialogContent"),
    closeDialogButton: document.getElementById("closeDialogButton"),
    themeToggle: document.getElementById("themeToggle"),
    timerWidget: document.getElementById("timerWidget"),
    timerDisplay: document.getElementById("timerDisplay"),
    startTimer: document.getElementById("startTimer"),
    pauseTimer: document.getElementById("pauseTimer"),
    resetTimer: document.getElementById("resetTimer"),
    closeTimer: document.getElementById("closeTimer"),
    timerMinutes: document.getElementById("timerMinutes"),
    toast: document.getElementById("toast"),
    keyboardHint: document.getElementById("keyboardHint"),
  };

  const FAVORITES_KEY = "app.ninja-crispi.favorites.v1";
  const THEME_KEY = "app.ninja-crispi.theme.v1";
  const RATINGS_KEY = "app.ninja-crispi.ratings.v1";
  const NOTES_KEY = "app.ninja-crispi.notes.v1";
  const SHOPPING_LIST_KEY = "app.ninja-crispi.shopping-list.v1";
  const MAX_RESULTS = 24;

  const state = {
    activeFilter: "all",
    query: "",
    queryRegex: null,
    queryRegexSource: "",
    favoritesOnly: false,
    favorites: new Set(loadFavorites()),
    theme: localStorage.getItem(THEME_KEY) || "light",
    ratings: loadRatings(),
    notes: loadNotes(),
    shoppingList: loadShoppingList(),
    timer: {
      interval: null,
      remaining: 0,
      running: false,
      duration: 600, // 10 minutes default
    },
    searchSuggestions: [],
  };

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

  function loadRatings() {
    try {
      return JSON.parse(localStorage.getItem(RATINGS_KEY) || "{}");
    } catch (error) {
      return {};
    }
  }

  function saveRatings() {
    localStorage.setItem(RATINGS_KEY, JSON.stringify(state.ratings));
  }

  function loadNotes() {
    try {
      return JSON.parse(localStorage.getItem(NOTES_KEY) || "{}");
    } catch (error) {
      return {};
    }
  }

  function saveNotes() {
    localStorage.setItem(NOTES_KEY, JSON.stringify(state.notes));
  }

  function loadShoppingList() {
    try {
      return JSON.parse(localStorage.getItem(SHOPPING_LIST_KEY) || "[]");
    } catch (error) {
      return [];
    }
  }

  function saveShoppingList() {
    localStorage.setItem(SHOPPING_LIST_KEY, JSON.stringify(state.shoppingList));
  }

  function showToast(message, duration = 3000) {
    elements.toast.textContent = message;
    elements.toast.classList.add("show");
    setTimeout(() => {
      elements.toast.classList.remove("show");
    }, duration);
  }

  function setTheme(theme) {
    state.theme = theme;
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_KEY, theme);
    elements.themeToggle.textContent = theme === "dark" ? "☀️" : "🌙";
    showToast(`${theme === "dark" ? "Dark" : "Light"} mode enabled`);
  }

  function toggleTheme() {
    setTheme(state.theme === "dark" ? "light" : "dark");
  }

  // Timer functions
  function startTimerCountdown() {
    if (state.timer.running) return;

    const minutes = parseInt(elements.timerMinutes.value) || 10;
    state.timer.duration = minutes * 60;
    state.timer.remaining = state.timer.duration;
    state.timer.running = true;

    updateTimerDisplay();

    state.timer.interval = setInterval(() => {
      state.timer.remaining--;
      updateTimerDisplay();

      if (state.timer.remaining <= 0) {
        stopTimer();
        showToast("⏰ Timer finished!");
        // Play notification sound if available
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Ninja CRISPi Timer', {
            body: 'Your cooking timer has finished!',
          });
        }
      }
    }, 1000);

    elements.timerWidget.classList.remove("hidden");
    showToast("Timer started!");
  }

  function pauseTimer() {
    if (state.timer.interval) {
      clearInterval(state.timer.interval);
      state.timer.interval = null;
      state.timer.running = false;
      showToast("Timer paused");
    }
  }

  function resetTimer() {
    stopTimer();
    state.timer.remaining = 0;
    updateTimerDisplay();
    showToast("Timer reset");
  }

  function stopTimer() {
    if (state.timer.interval) {
      clearInterval(state.timer.interval);
      state.timer.interval = null;
    }
    state.timer.running = false;
  }

  function updateTimerDisplay() {
    const minutes = Math.floor(state.timer.remaining / 60);
    const seconds = state.timer.remaining % 60;
    elements.timerDisplay.textContent =
      `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

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

    // Add pulse animation to the button
    const button = document.querySelector(`[data-favorite-id="${favoriteId}"]`);
    if (button) {
      button.classList.add('pulse');
      setTimeout(() => button.classList.remove('pulse'), 300);
    }

    showToast(state.favorites.has(favoriteId) ? 'Added to favorites! ⭐' : 'Removed from favorites');
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
    elements.productSummary.textContent = data.product.summary;

    elements.heroStats.innerHTML = [
      `${data.recipes.length} recipe spotlights`,
    ]
      .map((label) => `<span class="stat-pill">${label}</span>`)
      .join("");

    // Filter Quick Facts to only essential cooking info
    const essentialFacts = data.product.keyFacts.filter(fact =>
      ['Containers', 'Functions'].includes(fact.label)
    );

    elements.quickFacts.innerHTML = essentialFacts
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
        const rating = state.ratings[favoriteId] || 0;
        const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);
        return `
          <article class="recipe-card">
            <div class="result__actions">
              ${favoriteButtonMarkup(favoriteId)}
            </div>
            <h3>${recipe.title}</h3>
            ${rating > 0 ? `<div class="rating-display" style="color: #fbbf24; margin: 0.5rem 0;">${stars}</div>` : ''}
            <p>${recipe.summary}</p>
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
          <div style="font-size: 3rem; margin-bottom: 1rem;">🔍</div>
          <p style="margin: 0.5rem 0;"><strong>No results found</strong></p>
          <p style="margin: 0;">Try a broader search like <strong>cleaning</strong>, <strong>air fry</strong>, <strong>chicken</strong>, or <strong>temperature</strong>.</p>
          ${state.favoritesOnly ? '<p style="margin-top: 1rem;">💡 You have favorites filter enabled. Try turning it off to see more results.</p>' : ''}
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
              ${favoriteButtonMarkup(item.favoriteId)}
            </div>
            <h3>${highlightText(item.title)}</h3>
            <p>${buildSnippet(item)}</p>
            <div class="result__actions">
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

    const favoriteId = `recipe:${recipe.title}`;
    const rating = state.ratings[favoriteId] || 0;
    const note = state.notes[favoriteId] || '';

    elements.dialogContent.innerHTML = `
      <p class="eyebrow">Recipe spotlight</p>
      <h3>${recipe.title}</h3>

      <div style="margin: 1rem 0;">
        <strong>Rate this recipe:</strong>
        <div class="star-rating" data-recipe-id="${favoriteId}">
          ${[1, 2, 3, 4, 5].map(star => `
            <button type="button" class="star-btn ${star <= rating ? 'active' : ''}" data-star="${star}">★</button>
          `).join('')}
        </div>
      </div>

      <p>${recipe.summary}</p>
      <p><strong>Timing:</strong> ${recipe.time} • <strong>Servings:</strong> ${recipe.serves}</p>
      <div class="tag-row">${recipe.tags.map((tag) => `<span class="tag">${tag}</span>`).join("")}</div>

      <div class="recipe-notes">
        <strong>Personal Notes:</strong>
        <textarea
          id="recipeNote"
          placeholder="Add your cooking notes, modifications, or tips..."
          data-recipe-id="${favoriteId}"
        >${note}</textarea>
      </div>

      <div class="result__actions" style="margin-top: 1.5rem; flex-wrap: wrap;">
        <button class="button button--primary" type="button" id="startRecipeTimer">
          Set ${recipe.time} timer
        </button>
        <a class="button button--ghost" href="#searchSection" onclick="document.getElementById('recipeDialog').close()">
          Search ingredients
        </a>
        <a class="button button--ghost" href="./18733282951964.pdf" target="_blank" rel="noreferrer">
          Open guide
        </a>
        <button class="button button--ghost" type="button" onclick="window.print()">
          Print recipe
        </button>
      </div>
    `;

    // Add event listeners for rating
    const ratingContainer = elements.dialogContent.querySelector('.star-rating');
    if (ratingContainer) {
      ratingContainer.addEventListener('click', (e) => {
        const starBtn = e.target.closest('.star-btn');
        if (starBtn) {
          const newRating = parseInt(starBtn.dataset.star);
          state.ratings[favoriteId] = newRating;
          saveRatings();
          renderRecipeCards();
          showToast(`Rated ${newRating} star${newRating !== 1 ? 's' : ''}!`);

          // Update stars in dialog
          ratingContainer.querySelectorAll('.star-btn').forEach((btn, idx) => {
            btn.classList.toggle('active', idx < newRating);
          });
        }
      });
    }

    // Add event listener for notes
    const noteArea = elements.dialogContent.querySelector('#recipeNote');
    if (noteArea) {
      noteArea.addEventListener('blur', (e) => {
        state.notes[favoriteId] = e.target.value;
        saveNotes();
        showToast('Note saved!');
      });
    }

    // Add event listener for timer button
    const timerBtn = elements.dialogContent.querySelector('#startRecipeTimer');
    if (timerBtn) {
      timerBtn.addEventListener('click', () => {
        // Parse time from recipe.time (e.g., "25 mins" or "1 hr 30 mins")
        const timeMatch = recipe.time.match(/(\d+)\s*(min|hr)/gi);
        let totalMinutes = 0;
        if (timeMatch) {
          timeMatch.forEach(match => {
            const num = parseInt(match);
            if (match.includes('hr')) {
              totalMinutes += num * 60;
            } else {
              totalMinutes += num;
            }
          });
        }
        if (totalMinutes > 0) {
          elements.timerMinutes.value = totalMinutes;
          startTimerCountdown();
          elements.recipeDialog.close();
        } else {
          showToast('Could not parse recipe time');
        }
      });
    }

    elements.recipeDialog.showModal();
  }

  function openRandomRecipe() {
    const recipe = data.recipes[Math.floor(Math.random() * data.recipes.length)];
    openRecipe(recipe.title);
  }

  function bindEvents() {
    // Filter chips
    elements.filterChips.addEventListener("click", (event) => {
      const button = event.target.closest("[data-filter]");
      if (!button) {
        return;
      }

      state.activeFilter = button.dataset.filter;
      renderFilters();
      renderSearchResults();
    });

    // Search input with debouncing for performance
    let searchTimeout;
    elements.searchInput.addEventListener("input", (event) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        state.query = event.target.value;
        renderSearchResults();
      }, 150);
    });

    // Favorites toggle
    elements.favoritesOnly.addEventListener("change", (event) => {
      state.favoritesOnly = event.target.checked;
      renderSearchResults();
    });

    // Global click handler for favorites and recipe buttons
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

    // Theme toggle
    elements.themeToggle.addEventListener("click", toggleTheme);

    // Timer controls
    elements.startTimer.addEventListener("click", startTimerCountdown);
    elements.pauseTimer.addEventListener("click", pauseTimer);
    elements.resetTimer.addEventListener("click", resetTimer);
    elements.closeTimer.addEventListener("click", () => {
      stopTimer();
      state.timer.remaining = 0;
      updateTimerDisplay();
      elements.timerWidget.classList.add("hidden");
    });

    // Random recipe
    elements.randomRecipeButton.addEventListener("click", openRandomRecipe);

    // Shortcuts button
    if (elements.showShortcutsButton) {
      elements.showShortcutsButton.addEventListener("click", showKeyboardShortcuts);
    }

    // Dialog controls
    elements.closeDialogButton.addEventListener("click", () => elements.recipeDialog.close());
    elements.recipeDialog.addEventListener("click", (event) => {
      if (event.target === elements.recipeDialog) {
        elements.recipeDialog.close();
      }
    });

    // Keyboard shortcuts
    document.addEventListener("keydown", (event) => {
      // Ignore if user is typing in an input
      if (event.target.matches('input, textarea')) {
        return;
      }

      switch(event.key) {
        case '/':
          event.preventDefault();
          elements.searchInput.focus();
          break;
        case 'f':
          event.preventDefault();
          elements.favoritesOnly.checked = !elements.favoritesOnly.checked;
          state.favoritesOnly = elements.favoritesOnly.checked;
          renderSearchResults();
          showToast(`Favorites filter ${state.favoritesOnly ? 'on' : 'off'}`);
          break;
        case 't':
          event.preventDefault();
          elements.timerWidget.classList.toggle('hidden');
          break;
        case 'd':
          event.preventDefault();
          toggleTheme();
          break;
        case 'r':
          event.preventDefault();
          openRandomRecipe();
          break;
        case 'Escape':
          if (elements.recipeDialog.open) {
            elements.recipeDialog.close();
          }
          break;
        case '?':
          event.preventDefault();
          showKeyboardShortcuts();
          break;
      }
    });

    // Show keyboard hint on load
    setTimeout(() => {
      elements.keyboardHint.classList.add('show');
      setTimeout(() => {
        elements.keyboardHint.classList.remove('show');
      }, 5000);
    }, 2000);

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

  function showKeyboardShortcuts() {
    const shortcuts = [
      ['/', 'Focus search'],
      ['f', 'Toggle favorites filter'],
      ['t', 'Toggle timer'],
      ['d', 'Toggle dark mode'],
      ['r', 'Random recipe'],
      ['Esc', 'Close dialog'],
      ['?', 'Show shortcuts'],
    ];

    const shortcutsHTML = shortcuts.map(([key, desc]) =>
      `<div style="display: flex; justify-content: space-between; padding: 0.5rem 0;">
        <kbd style="background: var(--chip); padding: 0.25rem 0.5rem; border-radius: 4px; font-family: monospace;">${key}</kbd>
        <span style="margin-left: 1rem;">${desc}</span>
      </div>`
    ).join('');

    elements.dialogContent.innerHTML = `
      <p class="eyebrow">Keyboard Shortcuts</p>
      <h3>Quick Actions</h3>
      <div style="margin-top: 1rem;">
        ${shortcutsHTML}
      </div>
      <div class="result__actions" style="margin-top: 1.5rem;">
        <button class="button button--primary" type="button" onclick="document.getElementById('recipeDialog').close()">
          Got it!
        </button>
      </div>
    `;

    if (!elements.recipeDialog.open) {
      elements.recipeDialog.showModal();
    }
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

  // Apply saved theme on load
  setTheme(state.theme);

  // Show welcome message for first-time users
  const WELCOME_KEY = "app.ninja-crispi.welcome-shown.v1";
  if (!localStorage.getItem(WELCOME_KEY)) {
    setTimeout(() => {
      elements.dialogContent.innerHTML = `
        <p class="eyebrow">Welcome! 👋</p>
        <h3>Your Ninja CRISPi Companion</h3>
        <p style="margin: 1rem 0;">This enhanced web app now includes:</p>
        <ul style="margin: 1rem 0; padding-left: 1.5rem;">
          <li>🌙 <strong>Dark Mode</strong> - Toggle with the button in top right or press 'd'</li>
          <li>⏱️ <strong>Cooking Timer</strong> - Set timers directly from recipes or press 't'</li>
          <li>⭐ <strong>Recipe Ratings</strong> - Rate your favorite recipes with stars</li>
          <li>📝 <strong>Personal Notes</strong> - Add your own cooking tips and modifications</li>
          <li>⌨️ <strong>Keyboard Shortcuts</strong> - Press '?' anytime to see all shortcuts</li>
          <li>❤️ <strong>Favorites</strong> - Star recipes and filter to show only favorites</li>
          <li>🎲 <strong>Random Recipe</strong> - Can't decide? Get a random recipe suggestion</li>
        </ul>
        <p style="margin: 1rem 0;">All your preferences are saved locally in your browser!</p>
        <div class="result__actions" style="margin-top: 1.5rem;">
          <button class="button button--primary" type="button" onclick="document.getElementById('recipeDialog').close()">
            Let's cook! 🍳
          </button>
          <button class="button button--ghost" type="button" id="welcomeShortcutsButton">
            Show shortcuts
          </button>
        </div>
      `;
      elements.recipeDialog.showModal();
      localStorage.setItem(WELCOME_KEY, "true");

      const welcomeShortcutsButton = document.getElementById("welcomeShortcutsButton");
      if (welcomeShortcutsButton) {
        welcomeShortcutsButton.addEventListener("click", () => {
          showKeyboardShortcuts();
        });
      }
    }, 1000);
  }
})();
