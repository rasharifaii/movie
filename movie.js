const API_KEY = "497c4eeed642320d4383962ed9f004d0";
const BASE_URL = "https://api.themoviedb.org/3";
const IMG_PATH = "https://image.tmdb.org/t/p/w500";

const moviesContainer = document.getElementById("movies");
const searchInput = document.getElementById("search");
const modal = document.getElementById("modal");
const modalContent = document.getElementById("modalContent");

let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

/* ================= FETCH MOVIES ================= */

async function getMovies(url) {
  const res = await fetch(url);
  const data = await res.json();
  displayMovies(data.results);
}

getMovies(`${BASE_URL}/trending/movie/week?api_key=${API_KEY}`);

/* ================= DISPLAY MOVIES ================= */

function displayMovies(movies) {
  localStorage.setItem("lastMovies", JSON.stringify(movies));
  moviesContainer.innerHTML = "";

  movies.forEach(movie => {
    const isFav = favorites.includes(movie.id);

    const card = document.createElement("div");
    card.classList.add("movie-card");

    card.innerHTML = `
      <div class="favorite">
        ${isFav ? "❤️" : "🤍"}
      </div>
      <img src="${IMG_PATH + movie.poster_path}">
      <div class="movie-info">
        <h3>${movie.title}</h3>
        <p class="${getRatingClass(movie.vote_average)}">
          ⭐ ${movie.vote_average}
        </p>
      </div>
    `;

    card.addEventListener("click", () => openModal(movie));

    card.querySelector(".favorite").addEventListener("click", (e) => {
      e.stopPropagation();
      toggleFavorite(movie.id);
    });

    moviesContainer.appendChild(card);
  });
}

/* ================= MODAL ================= */

async function openModal(movie) {
  modal.style.display = "flex";

  // Trailer
  const videoRes = await fetch(
    `${BASE_URL}/movie/${movie.id}/videos?api_key=${API_KEY}`
  );
  const videoData = await videoRes.json();

  const trailer = videoData.results.find(
    v => v.type === "Trailer" && v.site === "YouTube"
  );

  modalContent.innerHTML = `
    <h2>${movie.title}</h2>

    ${trailer ? `
      <iframe width="100%" height="315"
        src="https://www.youtube.com/embed/${trailer.key}"
        frameborder="0" allowfullscreen>
      </iframe>
    ` : "<p>No trailer available 🎬</p>"}

    <p>${movie.overview}</p>

    <p class="${getRatingClass(movie.vote_average)}">
      ⭐ Rating: ${movie.vote_average}
    </p>

    <button onclick="getWatchProviders(${movie.id})">
      🎬 Watch Options
    </button>

    <div id="watchProviders"></div>

    <h3 style="margin-top:20px;">Similar Movies</h3>
    <div id="similarMovies"
      style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:10px;">
    </div>

    <button class="close-btn" onclick="closeModal()">Close</button>
  `;

  loadSimilarMovies(movie.id);
}

function closeModal() {
  modal.style.display = "none";
}

/* اغلاق عند الضغط خارج الصندوق */
modal.addEventListener("click", (e) => {
  if (e.target === modal) {
    closeModal();
  }
});

/* ================= SIMILAR MOVIES ================= */

async function loadSimilarMovies(id) {
  const res = await fetch(
    `${BASE_URL}/movie/${id}/similar?api_key=${API_KEY}`
  );
  const data = await res.json();

  const container = document.getElementById("similarMovies");

  container.innerHTML = data.results.slice(0, 6).map(movie => `
    <img 
      src="${IMG_PATH + movie.poster_path}" 
      style="width:100%;border-radius:10px;cursor:pointer"
      onclick='openModal(${JSON.stringify(movie)})'
    >
  `).join("");
}

/* ================= RATING COLORS ================= */

function getRatingClass(vote) {
  if (vote >= 7.5) return "green";
  if (vote >= 5) return "orange";
  return "red";
}

/* ================= SEARCH ================= */

searchInput?.addEventListener("input", () => {
  const searchTerm = searchInput.value.trim();

  if (searchTerm.length > 2) {
    getMovies(`${BASE_URL}/search/movie?api_key=${API_KEY}&query=${searchTerm}`);
  } else {
    getMovies(`${BASE_URL}/trending/movie/week?api_key=${API_KEY}`);
  }
});

/* ================= FAVORITES ================= */

function toggleFavorite(id) {
  if (favorites.includes(id)) {
    favorites = favorites.filter(f => f !== id);
  } else {
    favorites.push(id);
  }

  localStorage.setItem("favorites", JSON.stringify(favorites));
  displayMovies(JSON.parse(localStorage.getItem("lastMovies")));
}

function loadFavoritesPage() {
  const favIds = JSON.parse(localStorage.getItem("favorites")) || [];

  if (favIds.length === 0) {
    moviesContainer.innerHTML = "<h2>No favorites yet 🤍</h2>";
    return;
  }

  fetch(`${BASE_URL}/trending/movie/week?api_key=${API_KEY}`)
    .then(res => res.json())
    .then(data => {
      const favMovies = data.results.filter(movie =>
        favIds.includes(movie.id)
      );
      displayMovies(favMovies);
    });
}

/* ================= WATCH PROVIDERS ================= */

async function getWatchProviders(id) {
  const res = await fetch(
    `${BASE_URL}/movie/${id}/watch/providers?api_key=${API_KEY}`
  );
  const data = await res.json();

  const providersDiv = document.getElementById("watchProviders");
  providersDiv.innerHTML = "";

  if (data.results && data.results.US) {

    const countryData = data.results.US;

    const providers = [
      ...(countryData.flatrate || []),
      ...(countryData.rent || []),
      ...(countryData.buy || [])
    ];

    if (providers.length === 0) {
      providersDiv.innerHTML = "<p>No streaming options available.</p>";
      return;
    }

    providersDiv.innerHTML = providers.map(provider => `
      <div class="provider-card">
        <img src="https://image.tmdb.org/t/p/w200${provider.logo_path}" />
        <p>${provider.provider_name}</p>
        <a href="${countryData.link}" target="_blank">
          Watch Now
        </a>
      </div>
    `).join("");

  } else {
    providersDiv.innerHTML = "<p>Not available in your region 🌍</p>";
  }
}