// Formato de moneda para ARS
const money = n => new Intl.NumberFormat("es-AR", {
  style: "currency", currency: "ARS", maximumFractionDigits: 0
}).format(n);

// Agrupa productos por categoría
function groupByCategory(items){
  const g = {};
  items.forEach(p => {
    const cat = p.categoria || "Sin categoría";
    (g[cat] ||= []).push(p);
  });
  return g;
}

// Crea una tarjeta de producto (imagen + botón)
function createCard(p){
  const card = document.createElement("article");
  card.className = "card";

  const title = document.createElement("div");
  title.className = "card-title";
  title.textContent = p.nombre || "Sin título";
  card.appendChild(title);

  const thumb = document.createElement("div");
  thumb.className = "thumb";

  const img = document.createElement("img");
  img.src = p.imagen;
  img.alt = p.nombre || "Producto";
  img.loading = "lazy";

  const overlay = document.createElement("a");
  overlay.className = "btn-overlay";
  overlay.href = `producto.html?id=${encodeURIComponent(p.id)}`;
  overlay.setAttribute("aria-label", `Ver ${p.nombre || "producto"}`);
  overlay.textContent = "Ver";

  thumb.append(img, overlay);
  card.append(thumb);
  return card;
}

// Construye un bloque de categoría con carrusel y controles
function createCategoryBlock(cat, products){
  const block = document.createElement("section");
  block.className = "category-block";

  const title = document.createElement("h2");
  title.className = "category-title";
  title.textContent = cat;
  block.appendChild(title);

  const carousel = document.createElement("div");
  carousel.className = "carousel";

  const track = document.createElement("div");
  track.className = "track";
  track.tabIndex = 0;

  products.forEach(p => track.appendChild(createCard(p)));

  const prev = document.createElement("button");
  prev.className = "carousel-btn prev";
  prev.setAttribute("aria-label", `Desplazar ${cat} hacia la izquierda`);
  prev.innerHTML = "&#10094;";

  const next = document.createElement("button");
  next.className = "carousel-btn next";
  next.setAttribute("aria-label", `Desplazar ${cat} hacia la derecha`);
  next.innerHTML = "&#10095;";

  // Calcula ancho aproximado de una card (incluye gap)
  function cardWidth(){
    const sample = track.querySelector(".card");
    if(!sample) return 280;
    const gap = parseFloat(getComputedStyle(track).gap || "16");
    return Math.ceil(sample.getBoundingClientRect().width + gap);
  }
  // Actualiza estado de los botones según scroll
  function updateArrows(){
    const max = track.scrollWidth - track.clientWidth - 1;
    prev.disabled = track.scrollLeft <= 0;
    next.disabled = track.scrollLeft >= max;
  }
  // Desplaza el carrusel por la cantidad de cards indicada
  function scrollByCards(dir = 1){
    track.scrollBy({ left: dir * cardWidth(), behavior: "smooth" });
    setTimeout(updateArrows, 280);
  }

  prev.addEventListener("click", () => scrollByCards(-1));
  next.addEventListener("click", () => scrollByCards(1));
  track.addEventListener("scroll", updateArrows);
  window.addEventListener("resize", updateArrows);
  track.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") { e.preventDefault(); scrollByCards(1); }
    if (e.key === "ArrowLeft")  { e.preventDefault(); scrollByCards(-1); }
  });

  carousel.append(prev, track, next);
  block.appendChild(carousel);
  queueMicrotask(updateArrows);
  return block;
}

// Renderiza el catálogo completo en el DOM
function renderCatalog(items){
  const grid = document.getElementById("grid");
  const count = document.getElementById("count");
  grid.innerHTML = "";

  const groups = groupByCategory(items);
  Object.keys(groups).sort().forEach(cat => {
    grid.appendChild(createCategoryBlock(cat, groups[cat]));
  });

  if (count) count.textContent = items.length;
}

// Configura búsqueda por nombre y categoría
function setupSearch(source){
  const input = document.getElementById("search");
  if(!input) return;

  const norm = s => (s ?? "").toString().toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");

  function apply(){
    const q = norm(input.value);
    if(!q){ renderCatalog(source); return; }
    const filtered = source.filter(p =>
      [p.nombre, p.categoria].map(norm).join(" ").includes(q)
    );
    renderCatalog(filtered);
  }

  input.addEventListener("input", apply);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { input.value = ""; apply(); }
  });
}

// Inicialización al cargar la página
document.addEventListener("DOMContentLoaded", () => {
  renderCatalog(PRODUCTS);
  setupSearch(PRODUCTS);
});
