// Configurações
const TMDB_API_KEY = '52f130e3bedf5bc7e29fb66da85e6fe3'; // Substitua pela sua chave real

// Estado da aplicação
let currentUser = null;
let darkMode = false;
let isLoginForm = true;
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];

// Elementos DOM
const elements = {
  darkModeToggle: document.getElementById('darkModeToggle'),
  authSection: document.getElementById('authSection'),
  content: document.getElementById('content'),
  authModal: document.getElementById('authModal'),
  closeModal: document.getElementById('closeModal'),
  authForm: document.getElementById('authForm'),
  modalTitle: document.getElementById('modalTitle'),
  submitAuthBtn: document.getElementById('submitAuthBtn'),
  toggleFormText: document.getElementById('toggleFormText'),
  toggleFormBtn: document.getElementById('toggleFormBtn'),
  homeLink: document.getElementById('homeLink'),
  searchLink: document.getElementById('searchLink'),
  favoritesLink: document.getElementById('favoritesLink')
};

// Inicialização
document.addEventListener('DOMContentLoaded', init);

function init() {
  setupDarkMode();
  setupEventListeners();
  checkAuthState();
  loadHomePage();
}

// Configuração inicial
function setupDarkMode() {
  darkMode = localStorage.getItem('darkMode') === 'true';
  updateDarkMode();
}

function updateDarkMode() {
  document.body.classList.toggle('dark-mode', darkMode);
  const icon = elements.darkModeToggle.querySelector('i');
  icon.className = darkMode ? 'fas fa-sun' : 'fas fa-moon';
  localStorage.setItem('darkMode', darkMode);
}

function setupEventListeners() {
  // Dark mode toggle
  elements.darkModeToggle.addEventListener('click', () => {
    darkMode = !darkMode;
    updateDarkMode();
  });

  // Auth modal
  elements.closeModal.addEventListener('click', hideModal);
  elements.toggleFormBtn.addEventListener('click', toggleAuthForm);
  elements.authForm.addEventListener('submit', handleAuth);

  // Navigation
  elements.homeLink.addEventListener('click', (e) => {
    e.preventDefault();
    loadHomePage();
  });
  elements.searchLink.addEventListener('click', (e) => {
    e.preventDefault();
    showSearch();
  });
  elements.favoritesLink.addEventListener('click', (e) => {
    e.preventDefault();
    loadFavorites();
  });
}

// Autenticação
function checkAuthState() {
  currentUser = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
  renderAuthSection();
}

function renderAuthSection() {
  if (currentUser) {
    elements.authSection.innerHTML = `
      <span class="mr-2">${currentUser.email}</span>
      <button onclick="logout()" class="btn btn-outline">
        Sair
      </button>
    `;
  } else {
    elements.authSection.innerHTML = `
      <button onclick="showAuthModal()" class="btn btn-primary">
        <i class="fas fa-user"></i>
        Entrar
      </button>
    `;
  }
}

function showAuthModal() {
  elements.authModal.classList.add('active');
}

function hideModal() {
  elements.authModal.classList.remove('active');
}

function toggleAuthForm() {
  isLoginForm = !isLoginForm;
  if (isLoginForm) {
    elements.modalTitle.textContent = 'Entrar';
    elements.submitAuthBtn.textContent = 'Entrar';
    elements.toggleFormText.textContent = 'Não tem uma conta? ';
    elements.toggleFormBtn.textContent = 'Registre-se';
  } else {
    elements.modalTitle.textContent = 'Registrar';
    elements.submitAuthBtn.textContent = 'Registrar';
    elements.toggleFormText.textContent = 'Já tem uma conta? ';
    elements.toggleFormBtn.textContent = 'Entrar';
  }
}

function handleAuth(e) {
  e.preventDefault();
  const email = document.getElementById('authEmail').value;
  const password = document.getElementById('authPassword').value;

  // Simulação de autenticação
  currentUser = { email, uid: `user-${Date.now()}` };
  localStorage.setItem('user', JSON.stringify(currentUser));
  
  renderAuthSection();
  hideModal();
  loadHomePage();
  showToast(`Bem-vindo, ${email}!`);
  
  // Limpar formulário
  elements.authForm.reset();
}

function logout() {
  currentUser = null;
  localStorage.removeItem('user');
  renderAuthSection();
  loadHomePage();
  showToast('Você saiu da sua conta');
}

// Navegação
function loadHomePage() {
  elements.content.innerHTML = `
    <div class="loading">
      <div class="spinner"></div>
    </div>
  `;
  
  fetchPopularMovies()
    .then(movies => {
      renderMovieGrid(movies, 'Filmes Populares');
    })
    .catch(error => {
      console.error('Error loading movies:', error);
      showError('Ocorreu um erro ao carregar os filmes');
    });
}

function showSearch() {
  elements.content.innerHTML = `
    <div class="search-container">
      <i class="fas fa-search search-icon"></i>
      <input type="text" class="search-input" placeholder="Buscar filmes..." id="searchInput">
    </div>
    <div id="searchResults"></div>
  `;

  const searchInput = document.getElementById('searchInput');
  searchInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
      searchMovies();
    }
  });
}

function loadFavorites() {
  if (!currentUser) {
    showAuthModal();
    return;
  }

  elements.content.innerHTML = `
    <h1 class="section-title">Meus Favoritos</h1>
    <div id="favoritesList">
      ${favorites.length > 0 ? '' : '<p>Você ainda não tem filmes favoritos.</p>'}
    </div>
  `;

  if (favorites.length > 0) {
    renderMovieGrid(favorites, '', 'favoritesList');
  }
}

// API de Filmes
async function fetchPopularMovies() {
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}&language=pt-BR`
    );
    const data = await response.json();
    return data.results;
  } catch (error) {
    console.error('Error fetching popular movies:', error);
    throw error;
  }
}

async function searchMovies() {
  const query = document.getElementById('searchInput').value.trim();
  if (!query) return;

  const resultsContainer = document.getElementById('searchResults');
  resultsContainer.innerHTML = `
    <div class="loading">
      <div class="spinner"></div>
    </div>
  `;

  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&language=pt-BR&query=${encodeURIComponent(query)}`
    );
    const data = await response.json();
    
    if (data.results.length > 0) {
      renderMovieGrid(data.results, `Resultados para "${query}"`, 'searchResults');
    } else {
      resultsContainer.innerHTML = `
        <p>Nenhum filme encontrado para "${query}".</p>
      `;
    }
  } catch (error) {
    console.error('Error searching movies:', error);
    showError('Ocorreu um erro na busca');
  }
}

function renderMovieGrid(movies, title, containerId = 'content') {
  const container = containerId ? document.getElementById(containerId) : elements.content;
  
  const html = `
    ${title ? `<h1 class="section-title">${title}</h1>` : ''}
    <div class="movie-grid">
      ${movies.map(movie => `
        <div class="movie-card">
          <img src="${movie.poster_path ? 
            `https://image.tmdb.org/t/p/w500${movie.poster_path}` : 
            'https://via.placeholder.com/300x450?text=Poster+Indispon%C3%ADvel'}" 
               alt="${movie.title}" 
               class="movie-poster"
               onclick="showMovieDetail(${movie.id})">
          <div class="movie-info">
            <h3 class="movie-title">${movie.title}</h3>
            <div class="movie-meta">
              <div class="movie-rating">
                <i class="fas fa-star"></i>
                <span>${movie.vote_average.toFixed(1)}</span>
              </div>
              <div class="movie-actions">
                <button class="action-btn favorite-btn ${isFavorite(movie.id) ? 'active' : ''}" 
                        onclick="event.stopPropagation(); toggleFavorite(${movie.id})">
                  <i class="fas fa-heart"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
  
  container.innerHTML = html;
}

async function showMovieDetail(movieId) {
  elements.content.innerHTML = `
    <div class="loading">
      <div class="spinner"></div>
    </div>
  `;

  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/movie/${movieId}?api_key=${TMDB_API_KEY}&language=pt-BR`
    );
    const movie = await response.json();
    renderMovieDetail(movie);
  } catch (error) {
    console.error('Error fetching movie details:', error);
    showError('Ocorreu um erro ao carregar os detalhes do filme');
  }
}

function renderMovieDetail(movie) {
  const releaseYear = movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A';
  
  elements.content.innerHTML = `
    <div class="movie-detail">
      <div class="movie-detail-poster">
        <img src="${movie.poster_path ? 
          `https://image.tmdb.org/t/p/w500${movie.poster_path}` : 
          'https://via.placeholder.com/300x450?text=Poster+Indispon%C3%ADvel'}" 
               alt="${movie.title}">
      </div>
      <div class="movie-detail-info">
        <h1 class="movie-detail-title">${movie.title} (${releaseYear})</h1>
        <div class="movie-detail-meta">
          <div class="movie-detail-rating">
            <i class="fas fa-star text-yellow-500"></i>
            <span>${movie.vote_average.toFixed(1)} (${movie.vote_count} votos)</span>
          </div>
          <span>${movie.runtime || 'N/A'} min</span>
        </div>
        <div class="movie-detail-genres">
          ${movie.genres?.map(genre => `
            <span class="genre-tag">${genre.name}</span>
          `).join('') || 'Gêneros não disponíveis'}
        </div>
        <div class="movie-detail-overview">
          <h3 class="text-lg font-semibold mb-2">Sinopse</h3>
          <p>${movie.overview || 'Sinopse não disponível.'}</p>
        </div>
        <button class="btn btn-primary" onclick="toggleFavorite(${movie.id})">
          <i class="fas fa-heart"></i>
          ${isFavorite(movie.id) ? 'Remover dos Favoritos' : 'Adicionar aos Favoritos'}
        </button>
      </div>
    </div>
  `;
}

// Favoritos
function isFavorite(movieId) {
  return favorites.some(movie => movie.id === movieId);
}

function toggleFavorite(movieId) {
  if (!currentUser) {
    showAuthModal();
    return;
  }

  if (isFavorite(movieId)) {
    // Remover dos favoritos
    favorites = favorites.filter(movie => movie.id !== movieId);
    showToast('Filme removido dos favoritos!');
  } else {
    // Adicionar aos favoritos - precisamos buscar os detalhes do filme
    fetch(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${TMDB_API_KEY}&language=pt-BR`)
      .then(res => res.json())
      .then(movie => {
        favorites.push(movie);
        showToast('Filme adicionado aos favoritos!');
      });
  }

  // Atualizar localStorage
  localStorage.setItem('favorites', JSON.stringify(favorites));
  
  // Atualizar UI
  updateFavoriteButtons(movieId, isFavorite(movieId));
}

function updateFavoriteButtons(movieId, isFavorite) {
  // Atualiza botões na grade
  document.querySelectorAll(`.favorite-btn[onclick*="${movieId}"]`).forEach(btn => {
    btn.classList.toggle('active', isFavorite);
    btn.querySelector('i').className = isFavorite ? 'fas fa-heart' : 'far fa-heart';
  });
  
  // Atualiza botão na página de detalhes
  const detailBtn = document.querySelector('.movie-detail-info .btn-primary');
  if (detailBtn) {
    detailBtn.innerHTML = `
      <i class="fas fa-heart"></i>
      ${isFavorite ? 'Remover dos Favoritos' : 'Adicionar aos Favoritos'}
    `;
  }
}

// Utilitários
function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);
  
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
}

function showError(message) {
  elements.content.innerHTML = `
    <div class="error-message">
      <h2>${message}</h2>
      <button onclick="loadHomePage()" class="btn btn-primary">
        Voltar para a página inicial
      </button>
    </div>
  `;
}

// Expor funções globais
window.showMovieDetail = showMovieDetail;
window.toggleFavorite = toggleFavorite;
window.showAuthModal = showAuthModal;
window.logout = logout;

// Adicione no início do arquivo, após a constante TMDB_API_KEY
const categories = {
    popular: { name: "Populares", url: "movie/popular" },
    top_rated: { name: "Melhores Avaliados", url: "movie/top_rated" },
    upcoming: { name: "Em Breve", url: "movie/upcoming" },
    now_playing: { name: "Nos Cinemas", url: "movie/now_playing" }
  };
  
  // Substitua a função loadHomePage por esta versão atualizada
  function loadHomePage() {
    elements.content.innerHTML = `
      <div class="loading">
        <div class="spinner"></div>
      </div>
    `;
    
    // Busca filmes populares primeiro
    fetchMoviesByCategory('popular')
      .then(movies => {
        renderHomePage(movies);
      })
      .catch(error => {
        console.error('Error loading movies:', error);
        showError('Ocorreu um erro ao carregar os filmes');
      });
  }
  
  // Nova função para buscar por categoria
  async function fetchMoviesByCategory(category) {
    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/${categories[category].url}?api_key=${TMDB_API_KEY}&language=pt-BR`
      );
      const data = await response.json();
      return data.results;
    } catch (error) {
      console.error(`Error fetching ${category} movies:`, error);
      throw error;
    }
  }
  
  // Nova função para renderizar a página inicial com várias categorias
  async function renderHomePage(popularMovies) {
    // Busca as outras categorias em paralelo
    const [topRated, upcoming, nowPlaying] = await Promise.all([
      fetchMoviesByCategory('top_rated'),
      fetchMoviesByCategory('upcoming'),
      fetchMoviesByCategory('now_playing')
    ]);
  
    elements.content.innerHTML = `
      <section class="category-section">
        <h2 class="section-title">Filmes Populares</h2>
        <div class="movie-grid" id="popularMovies"></div>
        <a href="#" class="see-more" onclick="showCategory('popular')">Ver mais</a>
      </section>
      
      <section class="category-section">
        <h2 class="section-title">Melhores Avaliados</h2>
        <div class="movie-grid" id="topRatedMovies"></div>
        <a href="#" class="see-more" onclick="showCategory('top_rated')">Ver mais</a>
      </section>
      
      <section class="category-section">
        <h2 class="section-title">Em Breve</h2>
        <div class="movie-grid" id="upcomingMovies"></div>
        <a href="#" class="see-more" onclick="showCategory('upcoming')">Ver mais</a>
      </section>
      
      <section class="category-section">
        <h2 class="section-title">Nos Cinemas</h2>
        <div class="movie-grid" id="nowPlayingMovies"></div>
        <a href="#" class="see-more" onclick="showCategory('now_playing')">Ver mais</a>
      </section>
    `;
  
    // Renderiza cada categoria
    renderMovieGrid(popularMovies.slice(0, 5), '', 'popularMovies');
    renderMovieGrid(topRated.slice(0, 5), '', 'topRatedMovies');
    renderMovieGrid(upcoming.slice(0, 5), '', 'upcomingMovies');
    renderMovieGrid(nowPlaying.slice(0, 5), '', 'nowPlayingMovies');
  }
  
  // Nova função para mostrar uma categoria completa
  function showCategory(category) {
    elements.content.innerHTML = `
      <div class="loading">
        <div class="spinner"></div>
      </div>
    `;
    
    fetchMoviesByCategory(category)
      .then(movies => {
        renderMovieGrid(movies, categories[category].name);
      })
      .catch(error => {
        console.error(`Error loading ${category} movies:`, error);
        showError(`Ocorreu um erro ao carregar os filmes ${categories[category].name.toLowerCase()}`);
      });
  }