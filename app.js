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
  favoritesLink: document.getElementById('favoritesLink'),
  headerSearchInput: document.getElementById('headerSearchInput')
};

// Inicialização
document.addEventListener('DOMContentLoaded', init);

function init() {
  setupDarkMode();
  setupEventListeners();
  setupMobileMenu();
  checkAuthState();
  loadHomePage();

  // Event listeners para categorias desktop
  document.querySelectorAll('.category-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const genreId = link.getAttribute('data-genre');
      const genreName = link.textContent;
      loadMoviesByGenre(genreId, genreName);
    });
  });
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
  elements.favoritesLink.addEventListener('click', (e) => {
    e.preventDefault();
    loadFavorites();
  });

  // Header search
  const searchToggle = document.getElementById('searchToggle');
  const searchContainer = document.querySelector('.search-container');
  
  searchToggle.addEventListener('click', () => {
    searchContainer.classList.toggle('active');
    if (searchContainer.classList.contains('active')) {
      document.getElementById('headerSearchInput').focus();
    }
  });

  elements.headerSearchInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
      const query = elements.headerSearchInput.value.trim();
      if (query) {
        searchMovies(query);
        searchContainer.classList.remove('active');
      }
    }
  });

  // Fechar a barra de pesquisa ao clicar fora
  document.addEventListener('click', (e) => {
    if (!searchContainer.contains(e.target)) {
      searchContainer.classList.remove('active');
    }
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
      <span class="mr-2">${currentUser.username || currentUser.email}</span>
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
  const nameField = document.getElementById('nameField');
  
  if (isLoginForm) {
    nameField.style.display = 'none';
    elements.modalTitle.textContent = 'Entrar';
    elements.submitAuthBtn.textContent = 'Entrar';
    elements.toggleFormText.textContent = 'Não tem uma conta? ';
    elements.toggleFormBtn.textContent = 'Registre-se';
  } else {
    nameField.style.display = 'block';
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
  
  if (!email || !password) {
    showToast('Por favor, preencha todos os campos');
    return;
  }
  
  if (!isLoginForm) {
    const username = document.getElementById('authName').value;
    if (!username) {
      showToast('Por favor, insira um nome de usuário');
      return;
    }
    
    // Verificar se o usuário já existe
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const userExists = users.some(user => user.email === email);
    
    if (userExists) {
      showToast('Este email já está em uso');
      return;
    }
    
    // Criar novo usuário
    currentUser = { email, username, uid: `user-${Date.now()}` };
    users.push(currentUser);
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('user', JSON.stringify(currentUser));
    
    renderAuthSection();
    hideModal();
    loadHomePage();
    showToast(`Bem-vindo, ${username}!`);
  } else {
    // Verificar login
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(user => user.email === email);
    
    if (!user) {
      showToast('Email ou senha incorretos');
      return;
    }
    
    currentUser = user;
    localStorage.setItem('user', JSON.stringify(currentUser));
    
    renderAuthSection();
    hideModal();
    loadHomePage();
    showToast(`Bem-vindo de volta, ${user.username || user.email}!`);
  }
  
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

async function searchMovies(query) {
  if (!query) return;

  elements.content.innerHTML = `
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
      renderMovieGrid(data.results, `Resultados para "${query}"`);
    } else {
      elements.content.innerHTML = `
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
    favorites = favorites.filter(movie => movie.id !== movieId);
    showToast('Filme removido dos favoritos!');
  } else {
    fetch(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${TMDB_API_KEY}&language=pt-BR`)
      .then(res => res.json())
      .then(movie => {
        favorites.push(movie);
        showToast('Filme adicionado aos favoritos!');
      });
  }

  localStorage.setItem('favorites', JSON.stringify(favorites));
  updateFavoriteButtons(movieId, isFavorite(movieId));
}

function updateFavoriteButtons(movieId, isFavorite) {
  document.querySelectorAll(`.favorite-btn[onclick*="${movieId}"]`).forEach(btn => {
    btn.classList.toggle('active', isFavorite);
    btn.querySelector('i').className = isFavorite ? 'fas fa-heart' : 'far fa-heart';
  });
  
  const detailBtn = document.querySelector('.movie-detail-info .btn-primary');
  if (detailBtn) {
    detailBtn.innerHTML = `
      <i class="fas fa-heart"></i>
      ${isFavorite ? 'Remover dos Favoritos' : 'Adicionar aos Favoritos'}
    `;
  }
}

function setupMobileMenu() {
  const hamburgerMenu = document.querySelector('.hamburger-menu');
  const mobileMenu = document.createElement('div');
  mobileMenu.className = 'mobile-menu';
  mobileMenu.innerHTML = `
    <div class="mobile-menu-header">
      <h3>Menu</h3>
      <button class="close-mobile-menu">
        <i class="fas fa-times"></i>
      </button>
    </div>
    <div class="mobile-nav-links">
      <a href="#" class="mobile-nav-link" id="mobileHomeLink">Início</a>
      <a href="#" class="mobile-nav-link" id="mobileFavoritesLink">Favoritos</a>
    </div>
    <div class="mobile-categories">
      <h4>Categorias</h4>
      <a href="#" class="mobile-category-link" data-genre="28">Ação</a>
      <a href="#" class="mobile-category-link" data-genre="12">Aventura</a>
      <a href="#" class="mobile-category-link" data-genre="16">Animação</a>
      <a href="#" class="mobile-category-link" data-genre="35">Comédia</a>
      <a href="#" class="mobile-category-link" data-genre="80">Crime</a>
      <a href="#" class="mobile-category-link" data-genre="18">Drama</a>
      <a href="#" class="mobile-category-link" data-genre="10751">Família</a>
      <a href="#" class="mobile-category-link" data-genre="14">Fantasia</a>
      <a href="#" class="mobile-category-link" data-genre="27">Terror</a>
      <a href="#" class="mobile-category-link" data-genre="878">Ficção Científica</a>
    </div>
  `;
  document.body.appendChild(mobileMenu);

  hamburgerMenu.addEventListener('click', () => {
    mobileMenu.classList.add('active');
  });

  document.querySelector('.close-mobile-menu').addEventListener('click', () => {
    mobileMenu.classList.remove('active');
  });

  document.getElementById('mobileHomeLink').addEventListener('click', (e) => {
    e.preventDefault();
    loadHomePage();
    mobileMenu.classList.remove('active');
    document.getElementById('pagination').innerHTML = '';
  });

  document.getElementById('mobileFavoritesLink').addEventListener('click', (e) => {
    e.preventDefault();
    loadFavorites();
    mobileMenu.classList.remove('active');
    document.getElementById('pagination').innerHTML = '';
  });

  document.querySelectorAll('.mobile-category-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const genreId = link.getAttribute('data-genre');
      loadMoviesByGenre(genreId, link.textContent);
      mobileMenu.classList.remove('active');
    });
  });
}

function loadMoviesByGenre(genreId, genreName, page = 1) {
  elements.content.innerHTML = `
    <div class="loading">
      <div class="spinner"></div>
    </div>
  `;

  fetch(`https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&language=pt-BR&with_genres=${genreId}&page=${page}`)
    .then(response => response.json())
    .then(data => {
      renderMovieGrid(data.results, `Filmes de ${genreName}`);
      renderPagination(data.total_pages, page, (newPage) => {
        loadMoviesByGenre(genreId, genreName, newPage);
      });
    })
    .catch(error => {
      console.error('Error fetching movies by genre:', error);
      showError('Ocorreu um erro ao carregar os filmes desta categoria');
    });
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

function renderPagination(totalPages, currentPage, callback) {
  const paginationContainer = document.getElementById('pagination');
  paginationContainer.innerHTML = '';

  if (totalPages <= 1) return;

  const pagination = document.createElement('ul');
  pagination.className = 'pagination';

  // Botão Anterior
  const prevItem = document.createElement('li');
  prevItem.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
  prevItem.innerHTML = `<a class="page-link" href="#">&laquo;</a>`;
  prevItem.addEventListener('click', (e) => {
    e.preventDefault();
    if (currentPage > 1) callback(currentPage - 1);
  });
  pagination.appendChild(prevItem);

  // Números das páginas
  const maxVisiblePages = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    const pageItem = document.createElement('li');
    pageItem.className = `page-item ${i === currentPage ? 'active' : ''}`;
    pageItem.innerHTML = `<a class="page-link" href="#">${i}</a>`;
    pageItem.addEventListener('click', (e) => {
      e.preventDefault();
      callback(i);
    });
    pagination.appendChild(pageItem);
  }

  // Botão Próximo
  const nextItem = document.createElement('li');
  nextItem.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
  nextItem.innerHTML = `<a class="page-link" href="#">&raquo;</a>`;
  nextItem.addEventListener('click', (e) => {
    e.preventDefault();
    if (currentPage < totalPages) callback(currentPage + 1);
  });
  pagination.appendChild(nextItem);

  paginationContainer.appendChild(pagination);
}

// Expor funções globais
window.showMovieDetail = showMovieDetail;
window.toggleFavorite = toggleFavorite;
window.showAuthModal = showAuthModal;
window.logout = logout;
window.loadMoviesByGenre = loadMoviesByGenre;