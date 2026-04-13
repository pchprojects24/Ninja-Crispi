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
    mealPlanButton: document.getElementById("mealPlanButton"),
    shoppingListButton: document.getElementById("shoppingListButton"),
    cookingHistoryButton: document.getElementById("cookingHistoryButton"),
  };

  // Storage keys
  const FAVORITES_KEY = "app.ninja-crispi.favorites.v1";
  const THEME_KEY = "app.ninja-crispi.theme.v1";
  const RATINGS_KEY = "app.ninja-crispi.ratings.v1";
  const NOTES_KEY = "app.ninja-crispi.notes.v1";
  const SHOPPING_LIST_KEY = "app.ninja-crispi.shopping-list.v2";
  const MEAL_PLAN_KEY = "app.ninja-crispi.meal-plan.v1";
  const COOKING_HISTORY_KEY = "app.ninja-crispi.cooking-history.v1";
  const COLLECTIONS_KEY = "app.ninja-crispi.collections.v1";
  const ACHIEVEMENTS_KEY = "app.ninja-crispi.achievements.v1";
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
    mealPlan: loadMealPlan(),
    cookingHistory: loadCookingHistory(),
    collections: loadCollections(),
    achievements: loadAchievements(),
    timer: {
      interval: null,
      remaining: 0,
      running: false,
      duration: 600,
    },
    currentRecipeSteps: [],
    currentStepIndex: 0,
    voiceEnabled: 'speechSynthesis' in window,
    servingMultiplier: 1,
  };

  // Load functions
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

  function loadMealPlan() {
    try {
      return JSON.parse(localStorage.getItem(MEAL_PLAN_KEY) || "{}");
    } catch (error) {
      return {};
    }
  }

  function saveMealPlan() {
    localStorage.setItem(MEAL_PLAN_KEY, JSON.stringify(state.mealPlan));
  }

  function loadCookingHistory() {
    try {
      return JSON.parse(localStorage.getItem(COOKING_HISTORY_KEY) || "[]");
    } catch (error) {
      return [];
    }
  }

  function saveCookingHistory() {
    localStorage.setItem(COOKING_HISTORY_KEY, JSON.stringify(state.cookingHistory));
  }

  function loadCollections() {
    try {
      return JSON.parse(localStorage.getItem(COLLECTIONS_KEY) || "{}");
    } catch (error) {
      return {};
    }
  }

  function saveCollections() {
    localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(state.collections));
  }

  function loadAchievements() {
    try {
      return JSON.parse(localStorage.getItem(ACHIEVEMENTS_KEY) || "[]");
    } catch (error) {
      return [];
    }
  }

  function saveAchievements() {
    localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(state.achievements));
  }

  // Toast notification
  function showToast(message, duration = 3000, type = '') {
    elements.toast.textContent = message;
    elements.toast.classList.remove('toast--success', 'toast--error', 'toast--info');
    if (type) elements.toast.classList.add(`toast--${type}`);
    elements.toast.classList.add("show");
    clearTimeout(elements.toast._hideTimeout);
    elements.toast._hideTimeout = setTimeout(() => {
      elements.toast.classList.remove("show");
    }, duration);
  }

  // Theme functions
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
        showToast("⏰ Timer finished!", 5000, 'success');
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Ninja CRISPi Timer', {
            body: 'Your cooking timer has finished!',
            icon: '/favicon.ico'
          });
        }
        if (state.voiceEnabled) {
          speak("Your timer has finished!");
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

  // Voice synthesis
  function speak(text) {
    if (!state.voiceEnabled) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    speechSynthesis.speak(utterance);
  }

  // Search index
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
      recipeData: recipe,
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
      checkAchievements();
    }

    saveFavorites();
    renderSearchResults();
    renderRecipeCards();

    const button = document.querySelector(`[data-favorite-id="${favoriteId}"]`);
    if (button) {
      button.classList.add('pulse');
      setTimeout(() => button.classList.remove('pulse'), 300);
    }

    showToast(state.favorites.has(favoriteId) ? 'Added to favorites! ⭐' : 'Removed from favorites', 3000, state.favorites.has(favoriteId) ? 'success' : 'info');
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

  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning, chef!';
    if (hour < 17) return 'Good afternoon, chef!';
    if (hour < 21) return 'Good evening, chef!';
    return "Late night snack? Let's cook!";
  }

  function renderHero() {
    elements.productSummary.textContent = data.product.summary;

    // Greeting
    const existingGreeting = elements.productSummary.previousElementSibling;
    if (!existingGreeting || !existingGreeting.classList.contains('hero__greeting')) {
      const greeting = document.createElement('span');
      greeting.className = 'hero__greeting';
      greeting.textContent = getGreeting();
      elements.productSummary.parentNode.insertBefore(greeting, elements.productSummary);
    }

    const historyCount = state.cookingHistory.length;
    elements.heroStats.innerHTML = [
      `${data.recipes.length} recipe spotlights`,
      historyCount > 0 ? `${historyCount} meals cooked` : null,
      state.achievements.length > 0 ? `${state.achievements.length} achievements` : null,
    ]
      .filter(Boolean)
      .map((label) => `<span class="stat-pill">${label}</span>`)
      .join("");

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

  function getDifficultyBadge(recipe) {
    const prepTime = parseInt(recipe.time.match(/Prep (\d+)/)?.[1] || 0);
    const cookTime = parseInt(recipe.time.match(/Cook (\d+)/)?.[1] || 0);
    const totalTime = prepTime + cookTime;

    if (totalTime < 20) return '<span class="difficulty-badge easy">Easy</span>';
    if (totalTime < 40) return '<span class="difficulty-badge medium">Medium</span>';
    return '<span class="difficulty-badge advanced">Advanced</span>';
  }

  function renderRecipeCards() {
    const recipesWithHistory = data.recipes.map(recipe => {
      const favoriteId = `recipe:${recipe.title}`;
      const cookedCount = state.cookingHistory.filter(h => h.recipeId === favoriteId).length;
      return { ...recipe, favoriteId, cookedCount };
    });

    elements.recipeCards.innerHTML = recipesWithHistory
      .map((recipe) => {
        const rating = state.ratings[recipe.favoriteId] || 0;
        const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);
        return `
          <article class="recipe-card">
            <div class="result__actions">
              ${favoriteButtonMarkup(recipe.favoriteId)}
            </div>
            <h3>${recipe.title}</h3>
            ${getDifficultyBadge(recipe)}
            ${rating > 0 ? `<div class="rating-display" style="color: #fbbf24; margin: 0.5rem 0;">${stars}</div>` : ''}
            ${recipe.cookedCount > 0 ? `<div class="cooked-badge">🍳 Cooked ${recipe.cookedCount}x</div>` : ''}
            <p>${recipe.summary}</p>
            <div class="recipe-card__meta">
              <span class="recipe-meta-badge recipe-meta-badge--container">${recipe.container}</span>
              <span class="recipe-meta-badge recipe-meta-badge--function">${recipe.function}</span>
            </div>
            <div class="tag-row">
              ${recipe.tags.map((tag) => `<span class="tag">${tag}</span>`).join("")}
            </div>
            <div class="result__actions">
              <span class="result__meta">${recipe.time} • ${recipe.serves}</span>
              <button class="button button--primary" type="button" data-open-recipe="${recipe.title}" style="flex: 1; min-width: 0;">
                View recipe →
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

  // Recipe detail functions
  function parseRecipeDetails(recipe) {
    // Find the full recipe text from pages data
    const recipePage = data.pages.find(p =>
      p.title.includes(recipe.title) || p.text.includes(recipe.title)
    );

    if (!recipePage) return null;

    const text = recipePage.text;

    // Extract ingredients
    const ingredientsMatch = text.match(/Ingredients(.*?)Directions/s);
    const ingredientsText = ingredientsMatch ? ingredientsMatch[1] : '';
    const ingredients = ingredientsText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('Prep:') && !line.startsWith('Makes:'));

    // Extract steps
    const directionsMatch = text.match(/Directions\s+(.*?)(?:TIP:|STARTERS|$)/s);
    const directionsText = directionsMatch ? directionsMatch[1] : '';
    const steps = directionsText
      .split(/\d+\./)
      .map(step => step.trim())
      .filter(step => step.length > 20);

    return { ingredients, steps };
  }

  function openCookingMode(recipe) {
    const details = parseRecipeDetails(recipe);
    if (!details || !details.steps.length) {
      showToast("Step-by-step mode not available for this recipe");
      return;
    }

    state.currentRecipeSteps = details.steps;
    state.currentStepIndex = 0;

    const cookingModeHTML = `
      <div class="cooking-mode" id="cookingMode">
        <div class="cooking-mode-header">
          <h2>${recipe.title}</h2>
          <button class="button button--ghost" id="exitCookingMode">Exit</button>
        </div>
        <div class="cooking-mode-progress">
          <div class="progress-bar">
            <div class="progress-fill" id="progressFill" style="width: 0%"></div>
          </div>
          <p class="progress-text">Step <span id="currentStep">1</span> of ${details.steps.length}</p>
        </div>
        <div class="cooking-step" id="cookingStep">
          <div class="cooking-step-number">1</div>
          <p class="cooking-step-text">${details.steps[0]}</p>
        </div>
        <div class="cooking-navigation">
          <button class="button button--ghost" id="prevStep" disabled>← Previous</button>
          <button class="button button--primary" id="voiceStep">🔊 Read aloud</button>
          <button class="button button--primary" id="nextStep">Next →</button>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', cookingModeHTML);

    document.getElementById('exitCookingMode').addEventListener('click', exitCookingMode);
    document.getElementById('prevStep').addEventListener('click', () => navigateStep(-1));
    document.getElementById('nextStep').addEventListener('click', () => navigateStep(1));
    document.getElementById('voiceStep').addEventListener('click', () => {
      speak(state.currentRecipeSteps[state.currentStepIndex]);
    });

    if (state.voiceEnabled) {
      speak(`Step 1: ${state.currentRecipeSteps[0]}`);
    }
  }

  function navigateStep(direction) {
    const newIndex = state.currentStepIndex + direction;
    if (newIndex < 0 || newIndex >= state.currentRecipeSteps.length) return;

    state.currentStepIndex = newIndex;
    updateCookingStep();
  }

  function updateCookingStep() {
    const stepNumber = state.currentStepIndex + 1;
    const totalSteps = state.currentRecipeSteps.length;
    const progress = (stepNumber / totalSteps) * 100;

    document.getElementById('currentStep').textContent = stepNumber;
    document.getElementById('progressFill').style.width = `${progress}%`;
    document.querySelector('.cooking-step-number').textContent = stepNumber;
    document.querySelector('.cooking-step-text').textContent = state.currentRecipeSteps[state.currentStepIndex];

    document.getElementById('prevStep').disabled = state.currentStepIndex === 0;
    document.getElementById('nextStep').textContent =
      state.currentStepIndex === totalSteps - 1 ? 'Finish 🎉' : 'Next →';

    if (state.currentStepIndex === totalSteps - 1) {
      document.getElementById('nextStep').onclick = () => {
        exitCookingMode();
        showToast("Recipe completed! 🎉");
      };
    }
  }

  function exitCookingMode() {
    const cookingMode = document.getElementById('cookingMode');
    if (cookingMode) {
      cookingMode.remove();
    }
  }

  function openRecipe(title) {
    const recipe = data.recipes.find((item) => item.title === title);
    if (!recipe) {
      return;
    }

    const favoriteId = `recipe:${recipe.title}`;
    const rating = state.ratings[favoriteId] || 0;
    const note = state.notes[favoriteId] || '';
    const details = parseRecipeDetails(recipe);

    let ingredientsHTML = '';
    if (details && details.ingredients.length > 0) {
      ingredientsHTML = `
        <div class="recipe-section">
          <h4>Ingredients</h4>
          <div class="serving-adjuster">
            <button class="button button--ghost" id="decreaseServing">−</button>
            <span id="servingDisplay">×${state.servingMultiplier}</span>
            <button class="button button--ghost" id="increaseServing">+</button>
          </div>
          <ul class="ingredient-list">
            ${details.ingredients.map((ing, idx) => `
              <li>
                <label class="ingredient-item">
                  <input type="checkbox" class="ingredient-checkbox" data-idx="${idx}">
                  <span>${ing}</span>
                </label>
                <button class="add-to-list-btn" data-ingredient="${escapeHtml(ing)}" title="Add to shopping list">🛒</button>
              </li>
            `).join('')}
          </ul>
        </div>
      `;
    }

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
      <p><strong>Container:</strong> ${recipe.container} • <strong>Function:</strong> ${recipe.function}</p>
      ${getDifficultyBadge(recipe)}
      <div class="tag-row">${recipe.tags.map((tag) => `<span class="tag">${tag}</span>`).join("")}</div>

      ${ingredientsHTML}

      ${details && details.steps.length > 0 ? `
        <div class="recipe-section">
          <h4>Quick Steps Preview</h4>
          <ol class="steps-preview">
            ${details.steps.slice(0, 3).map(step => `<li>${step.substring(0, 100)}${step.length > 100 ? '...' : ''}</li>`).join('')}
          </ol>
        </div>
      ` : ''}

      <div class="recipe-notes">
        <strong>Personal Notes:</strong>
        <textarea
          id="recipeNote"
          placeholder="Add your cooking notes, modifications, or tips..."
          data-recipe-id="${favoriteId}"
        >${note}</textarea>
      </div>

      <div class="result__actions" style="margin-top: 1.5rem; flex-wrap: wrap;">
        ${details && details.steps.length > 0 ? `
          <button class="button button--primary" type="button" id="startCookingMode">
            👨‍🍳 Start Cooking Mode
          </button>
        ` : ''}
        <button class="button button--primary" type="button" id="startRecipeTimer">
          ⏱️ Set timer
        </button>
        <button class="button button--ghost" type="button" id="addToMealPlan">
          📅 Add to meal plan
        </button>
        <button class="button button--ghost" type="button" id="shareRecipe">
          📤 Share
        </button>
        ${recipe.youtubeUrl ? `
          <a class="button button--primary" href="${recipe.youtubeUrl}" target="_blank" rel="noreferrer">
            🎥 Watch video
          </a>
        ` : ''}
        <a class="button button--ghost" href="./18733282951964.pdf" target="_blank" rel="noreferrer">
          Open guide
        </a>
      </div>
    `;

    // Event listeners
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

          ratingContainer.querySelectorAll('.star-btn').forEach((btn, idx) => {
            btn.classList.toggle('active', idx < newRating);
          });
        }
      });
    }

    const noteArea = elements.dialogContent.querySelector('#recipeNote');
    if (noteArea) {
      noteArea.addEventListener('blur', (e) => {
        state.notes[favoriteId] = e.target.value;
        saveNotes();
        showToast('Note saved!');
      });
    }

    const timerBtn = elements.dialogContent.querySelector('#startRecipeTimer');
    if (timerBtn) {
      timerBtn.addEventListener('click', () => {
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

    const cookingModeBtn = elements.dialogContent.querySelector('#startCookingMode');
    if (cookingModeBtn) {
      cookingModeBtn.addEventListener('click', () => {
        elements.recipeDialog.close();
        openCookingMode(recipe);
        addToCookingHistory(favoriteId, recipe.title);
      });
    }

    const addToListBtns = elements.dialogContent.querySelectorAll('.add-to-list-btn');
    addToListBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const ingredient = e.target.dataset.ingredient;
        addToShoppingList(ingredient);
      });
    });

    const decreaseBtn = elements.dialogContent.querySelector('#decreaseServing');
    const increaseBtn = elements.dialogContent.querySelector('#increaseServing');
    if (decreaseBtn && increaseBtn) {
      decreaseBtn.addEventListener('click', () => {
        if (state.servingMultiplier > 0.5) {
          state.servingMultiplier -= 0.5;
          document.getElementById('servingDisplay').textContent = `×${state.servingMultiplier}`;
          showToast(`Servings adjusted to ${state.servingMultiplier}x`);
        }
      });
      increaseBtn.addEventListener('click', () => {
        if (state.servingMultiplier < 3) {
          state.servingMultiplier += 0.5;
          document.getElementById('servingDisplay').textContent = `×${state.servingMultiplier}`;
          showToast(`Servings adjusted to ${state.servingMultiplier}x`);
        }
      });
    }

    const shareBtn = elements.dialogContent.querySelector('#shareRecipe');
    if (shareBtn) {
      shareBtn.addEventListener('click', () => {
        const url = window.location.href;
        if (navigator.share) {
          navigator.share({
            title: recipe.title,
            text: recipe.summary,
            url: url
          });
        } else {
          navigator.clipboard.writeText(url);
          showToast('Link copied to clipboard!');
        }
      });
    }

    const mealPlanBtn = elements.dialogContent.querySelector('#addToMealPlan');
    if (mealPlanBtn) {
      mealPlanBtn.addEventListener('click', () => {
        showMealPlanDialog(recipe);
      });
    }

    elements.recipeDialog.showModal();
  }

  function addToCookingHistory(recipeId, recipeTitle) {
    state.cookingHistory.unshift({
      recipeId,
      recipeTitle,
      date: new Date().toISOString(),
    });
    // Keep only last 50 entries
    if (state.cookingHistory.length > 50) {
      state.cookingHistory = state.cookingHistory.slice(0, 50);
    }
    saveCookingHistory();
    checkAchievements();
    renderHero();
  }

  function addToShoppingList(ingredient) {
    const item = {
      id: Date.now(),
      text: ingredient,
      checked: false,
      addedAt: new Date().toISOString(),
    };
    state.shoppingList.push(item);
    saveShoppingList();
    showToast('Added to shopping list! 🛒', 3000, 'success');
  }

  function showShoppingList() {
    elements.dialogContent.innerHTML = `
      <p class="eyebrow">Shopping List</p>
      <h3>Your Ingredients</h3>

      <div class="shopping-list-container">
        <div class="shopping-list-header">
          <button class="button button--ghost" id="clearChecked">Clear checked</button>
          <button class="button button--ghost" id="clearAll">Clear all</button>
        </div>
        <div class="shopping-list" id="shoppingListContent">
          ${state.shoppingList.length === 0 ? '<p class="empty-message">No items in shopping list</p>' : ''}
          ${state.shoppingList.map(item => `
            <div class="shopping-list-item ${item.checked ? 'checked' : ''}">
              <label>
                <input type="checkbox" ${item.checked ? 'checked' : ''} data-item-id="${item.id}">
                <span>${item.text}</span>
              </label>
              <button class="delete-item" data-item-id="${item.id}">×</button>
            </div>
          `).join('')}
        </div>
        <div class="add-item-form">
          <input type="text" id="newItemInput" placeholder="Add item..." />
          <button class="button button--primary" id="addItemBtn">Add</button>
        </div>
      </div>
    `;

    // Event listeners
    const checkboxes = elements.dialogContent.querySelectorAll('.shopping-list-item input');
    checkboxes.forEach(cb => {
      cb.addEventListener('change', (e) => {
        const itemId = parseInt(e.target.dataset.itemId);
        const item = state.shoppingList.find(i => i.id === itemId);
        if (item) {
          item.checked = e.target.checked;
          saveShoppingList();
          e.target.closest('.shopping-list-item').classList.toggle('checked', e.target.checked);
        }
      });
    });

    const deleteButtons = elements.dialogContent.querySelectorAll('.delete-item');
    deleteButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const itemId = parseInt(e.target.dataset.itemId);
        state.shoppingList = state.shoppingList.filter(i => i.id !== itemId);
        saveShoppingList();
        showShoppingList();
      });
    });

    document.getElementById('clearChecked')?.addEventListener('click', () => {
      state.shoppingList = state.shoppingList.filter(i => !i.checked);
      saveShoppingList();
      showShoppingList();
    });

    document.getElementById('clearAll')?.addEventListener('click', () => {
      if (confirm('Clear entire shopping list?')) {
        state.shoppingList = [];
        saveShoppingList();
        showShoppingList();
      }
    });

    const addItemBtn = document.getElementById('addItemBtn');
    const newItemInput = document.getElementById('newItemInput');
    if (addItemBtn && newItemInput) {
      const addItem = () => {
        const text = newItemInput.value.trim();
        if (text) {
          addToShoppingList(text);
          newItemInput.value = '';
          showShoppingList();
        }
      };
      addItemBtn.addEventListener('click', addItem);
      newItemInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addItem();
      });
    }

    elements.recipeDialog.showModal();
  }

  function showMealPlanDialog(recipe) {
    const today = new Date();
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push({
        date: date.toISOString().split('T')[0],
        label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
      });
    }

    elements.dialogContent.innerHTML = `
      <p class="eyebrow">Add to Meal Plan</p>
      <h3>${recipe.title}</h3>
      <p>When would you like to cook this?</p>
      <div class="meal-plan-days">
        ${days.map(day => {
          const planned = state.mealPlan[day.date] || [];
          const hasRecipe = planned.some(r => r.title === recipe.title);
          return `
            <button
              class="meal-day-btn ${hasRecipe ? 'planned' : ''}"
              data-date="${day.date}"
              ${hasRecipe ? 'disabled' : ''}
            >
              ${day.label}
              ${hasRecipe ? '✓' : ''}
            </button>
          `;
        }).join('')}
      </div>
    `;

    const dayButtons = elements.dialogContent.querySelectorAll('.meal-day-btn:not([disabled])');
    dayButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const date = btn.dataset.date;
        if (!state.mealPlan[date]) {
          state.mealPlan[date] = [];
        }
        state.mealPlan[date].push({
          title: recipe.title,
          recipeId: `recipe:${recipe.title}`,
        });
        saveMealPlan();
        showToast(`Added to meal plan for ${btn.textContent}!`);
        elements.recipeDialog.close();
      });
    });

    elements.recipeDialog.showModal();
  }

  function showCookingHistory() {
    const grouped = {};
    state.cookingHistory.forEach(entry => {
      const date = new Date(entry.date).toLocaleDateString();
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(entry);
    });

    elements.dialogContent.innerHTML = `
      <p class="eyebrow">Cooking History</p>
      <h3>Your Culinary Journey</h3>

      ${state.cookingHistory.length === 0 ? '<p>No cooking history yet. Start cooking to track your progress!</p>' : ''}

      <div class="history-stats">
        <div class="stat-card">
          <div class="stat-number">${state.cookingHistory.length}</div>
          <div class="stat-label">Meals Cooked</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${new Set(state.cookingHistory.map(h => h.recipeId)).size}</div>
          <div class="stat-label">Unique Recipes</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${state.achievements.length}</div>
          <div class="stat-label">Achievements</div>
        </div>
      </div>

      ${Object.keys(grouped).length > 0 ? `
        <div class="history-list">
          ${Object.entries(grouped).map(([date, entries]) => `
            <div class="history-group">
              <h4>${date}</h4>
              ${entries.map(entry => `
                <div class="history-entry">
                  <span>🍳 ${entry.recipeTitle}</span>
                  <span class="time">${new Date(entry.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              `).join('')}
            </div>
          `).join('')}
        </div>
      ` : ''}

      ${state.achievements.length > 0 ? `
        <div class="achievements-section">
          <h4>🏆 Achievements</h4>
          <div class="achievements-grid">
            ${state.achievements.map(achievement => `
              <div class="achievement-badge">
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-name">${achievement.name}</div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    `;

    elements.recipeDialog.showModal();
  }

  function checkAchievements() {
    const achievements = [
      { id: 'first-cook', name: 'First Steps', icon: '🌱', condition: () => state.cookingHistory.length >= 1 },
      { id: 'cook-5', name: 'Getting Started', icon: '🔥', condition: () => state.cookingHistory.length >= 5 },
      { id: 'cook-10', name: 'Cooking Regular', icon: '👨‍🍳', condition: () => state.cookingHistory.length >= 10 },
      { id: 'cook-25', name: 'Chef in Training', icon: '⭐', condition: () => state.cookingHistory.length >= 25 },
      { id: 'favorite-5', name: 'Favorite Finder', icon: '❤️', condition: () => state.favorites.size >= 5 },
      { id: 'rate-10', name: 'Critic', icon: '⭐⭐⭐', condition: () => Object.keys(state.ratings).length >= 10 },
    ];

    let newAchievements = false;
    achievements.forEach(achievement => {
      if (achievement.condition() && !state.achievements.find(a => a.id === achievement.id)) {
        state.achievements.push(achievement);
        newAchievements = true;
        showToast(`🎉 Achievement unlocked: ${achievement.name}!`, 5000);
      }
    });

    if (newAchievements) {
      saveAchievements();
      renderHero();
    }
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

    // Search input with debouncing
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

    // Global click handler
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

    // Shopping list button
    if (elements.shoppingListButton) {
      elements.shoppingListButton.addEventListener("click", showShoppingList);
    }

    // Cooking history button
    if (elements.cookingHistoryButton) {
      elements.cookingHistoryButton.addEventListener("click", showCookingHistory);
    }

    // Mobile bottom navigation
    const navShopping = document.getElementById('navShopping');
    const navTimer = document.getElementById('navTimer');
    const navProgress = document.getElementById('navProgress');
    if (navShopping) navShopping.addEventListener('click', () => { showShoppingList(); });
    if (navTimer) navTimer.addEventListener('click', () => {
      elements.timerWidget.classList.toggle('hidden');
      navTimer.classList.toggle('is-active', !elements.timerWidget.classList.contains('hidden'));
    });
    if (navProgress) navProgress.addEventListener('click', () => { showCookingHistory(); });

    // Highlight active nav item on scroll
    const navSections = [
      { id: 'searchSection', navId: 'navSearch' },
      { id: 'recipesSection', navId: 'navRecipes' },
    ];
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const match = navSections.find(s => s.id === entry.target.id);
          if (match) {
            document.querySelectorAll('.bottom-nav__item').forEach(el => el.classList.remove('is-active'));
            const navEl = document.getElementById(match.navId);
            if (navEl) navEl.classList.add('is-active');
          }
        }
      });
    }, { threshold: 0.3 });
    navSections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    // Search clear button
    const searchClear = document.getElementById('searchClear');
    if (searchClear) {
      elements.searchInput.addEventListener('input', () => {
        searchClear.classList.toggle('visible', elements.searchInput.value.length > 0);
      });
      searchClear.addEventListener('click', () => {
        elements.searchInput.value = '';
        state.query = '';
        searchClear.classList.remove('visible');
        renderSearchResults();
        elements.searchInput.focus();
      });
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
        case 's':
          event.preventDefault();
          showShoppingList();
          break;
        case 'h':
          event.preventDefault();
          showCookingHistory();
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
      ['s', 'Shopping list'],
      ['h', 'Cooking history'],
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
  const WELCOME_KEY = "app.ninja-crispi.welcome-shown.v2";
  if (!localStorage.getItem(WELCOME_KEY)) {
    setTimeout(() => {
      elements.dialogContent.innerHTML = `
        <p class="eyebrow">Welcome! 👋</p>
        <h3>Your Ultimate Ninja CRISPi Companion</h3>
        <p style="margin: 1rem 0;">Experience the complete overhaul with amazing new features:</p>
        <ul style="margin: 1rem 0; padding-left: 1.5rem;">
          <li>👨‍🍳 <strong>Step-by-Step Cooking Mode</strong> - Navigate recipes with visual progress</li>
          <li>🔊 <strong>Voice-Guided Cooking</strong> - Hands-free cooking with read-aloud steps</li>
          <li>🛒 <strong>Smart Shopping List</strong> - Add ingredients directly from recipes</li>
          <li>📅 <strong>Meal Planning</strong> - Plan your week ahead with recipe scheduler</li>
          <li>📊 <strong>Cooking History & Achievements</strong> - Track your culinary journey</li>
          <li>🎯 <strong>Difficulty Badges</strong> - Find recipes matching your skill level</li>
          <li>📱 <strong>Enhanced Mobile Experience</strong> - Optimized for cooking on your phone</li>
          <li>⚖️ <strong>Recipe Scaling</strong> - Adjust servings to your needs</li>
          <li>📤 <strong>Share Recipes</strong> - Share your favorites with friends</li>
          <li>⌨️ <strong>Keyboard Shortcuts</strong> - Power user features (press '?')</li>
        </ul>
        <p style="margin: 1rem 0;">All your data stays private and syncs across your devices!</p>
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

  // Register service worker for PWA
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Service worker registration failed, continue without PWA features
      });
    });
  }
})();
