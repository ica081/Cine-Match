// Configurações
const TMDB_API_KEY = 'sua_chave_tmdb'; // Substitua pela sua chave
const FIREBASE_CONFIG = {
  apiKey: "sua_chave_firebase",
  authDomain: "seu_projeto.firebaseapp.com",
  projectId: "seu_projeto",
  storageBucket: "seu_projeto.appspot.com",
  messagingSenderId: "seu_sender_id",
  appId: "seu_app_id"
};

// Estado da aplicação
let currentUser = null;
let darkMode = false;

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
  initFirebase();
  setupDarkMode();
  loadHomePage();
});

// Funções principais
async function loadHomePage() {
  const movies = await fetchPopularMovies();
  renderMovieGrid(movies, 'Filmes Populares');
}

async function fetchPopularMovies() {
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}&language=pt-BR`
    );
    const data = await response.json();
    return data.results;
  } catch (error) {
    console.error('Erro ao buscar filmes:', error);
    return [];
  }
}

function renderMovieGrid(movies, title) {
  const contentDiv = document.getElementById('content');
  contentDiv.innerHTML = `
    <h1 class="text-3xl font-bold mb-6 dark:text-white">${title}</h1>
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      ${movies.map(movie => `
        <div class="movie-card bg-white rounded-lg shadow-md overflow-hidden dark:bg-gray-700">
          <img src="https://image.tmdb.org/t/p/w500${movie.poster_path}" 
               alt="${movie.title}" 
               class="w-full h-64 object-cover">
          <div class="p-4">
            <h3 class="font-semibold text-lg dark:text-white">${movie.title}</h3>
            <div class="flex items-center mt-2">
              <span class="text-yellow-500">★</span>
              <span class="ml-1 dark:text-gray-300">${movie.vote_average.toFixed(1)}</span>
            </div>
            <button onclick="addToFavorites(${movie.id})" 
                    class="mt-2 text-blue-600 hover:text-blue-800 dark:text-blue-400">
              ♡ Favoritar
            </button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// Autenticação
function initFirebase() {
  // Inicialize o Firebase aqui
  // Implemente login/logout com Firebase Auth
}

function renderAuthSection(user) {
  const authSection = document.getElementById('authSection');
  if (user) {
    authSection.innerHTML = `
      <span class="mr-2 dark:text-white">${user.email}</span>
      <button onclick="logout()" class="bg-blue-600 text-white px-4 py-2 rounded-lg">
        Sair
      </button>
    `;
  } else {
    authSection.innerHTML = `
      <button onclick="showLoginModal()" class="bg-blue-600 text-white px-4 py-2 rounded-lg">
        Entrar
      </button>
    `;
  }
}

// Favoritos
function addToFavorites(movieId) {
  if (!currentUser) {
    alert('Faça login para adicionar favoritos');
    return;
  }
  // Implemente a lógica para salvar no Firebase
  alert(`Filme ${movieId} adicionado aos favoritos!`);
}

// Modo Escuro
function setupDarkMode() {
  const toggle = document.getElementById('darkModeToggle');
  toggle.addEventListener('click', () => {
    darkMode = !darkMode;
    document.body.classList.toggle('dark-mode', darkMode);
    toggle.textContent = darkMode ? '☀️' : '🌙';
    localStorage.setItem('darkMode', darkMode);
  });

  // Carregar preferência salva
  if (localStorage.getItem('darkMode') === 'true') {
    darkMode = true;
    document.body.classList.add('dark-mode');
    toggle.textContent = '☀️';
  }
}