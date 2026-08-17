/* Estudio Coda — interacciones */

// 1) Año actual en el footer
document.getElementById("year").textContent = new Date().getFullYear();

// ---- Lightbox (foto en grande) ----
const lightbox = document.getElementById("lightbox");
const lightboxImg = lightbox && lightbox.querySelector(".lightbox-img");
const lightboxClose = lightbox && lightbox.querySelector(".lightbox-close");
let focoPrevio = null;

function abrirLightbox(src, alt, origen) {
  if (!lightbox) return;
  lightboxImg.src = src;
  lightboxImg.alt = alt || "";
  focoPrevio = origen || null;
  lightbox.classList.add("is-open");
  document.body.classList.add("no-scroll");
  lightboxClose.focus();
}
function cerrarLightbox() {
  if (!lightbox) return;
  lightbox.classList.remove("is-open");
  document.body.classList.remove("no-scroll");
  lightboxImg.removeAttribute("src");
  if (focoPrevio) focoPrevio.focus();
}
if (lightbox) {
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox || e.target === lightboxClose) cerrarLightbox();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && lightbox.classList.contains("is-open")) cerrarLightbox();
  });
}

// 2) Carrusel "Trabajos" (coverflow) — se arma desde FOTOS_GALERIA (ver galeria.js).
//    Para agregar, quitar o reordenar fotos, editá esa lista. Acá no hay que tocar nada.
(function () {
  const track = document.getElementById("carTrack");
  if (!track || typeof FOTOS_GALERIA === "undefined" || !Array.isArray(FOTOS_GALERIA)) return;

  const carousel = document.getElementById("carousel");
  const viewport = carousel.querySelector(".car-viewport");
  const prevBtn = carousel.querySelector(".car-prev");
  const nextBtn = carousel.querySelector(".car-next");
  const dotsCont = document.getElementById("carDots");
  let index = 0;

  // Construir las fotos (una por elemento de la lista), sin marco: la foto entera.
  track.innerHTML = FOTOS_GALERIA.map(
    (nombre, i) =>
      `<figure class="slide" data-i="${i}"><img src="assets/${nombre}" alt="Retrato profesional — Estudio Coda"></figure>`
  ).join("");
  const slides = Array.from(track.querySelectorAll(".slide"));
  const N = slides.length;

  // Puntitos indicadores
  if (dotsCont) {
    dotsCont.innerHTML = slides
      .map((s, i) => `<button class="car-dot" type="button" data-i="${i}" aria-label="Foto ${i + 1}"></button>`)
      .join("");
  }
  const dots = dotsCont ? Array.from(dotsCont.querySelectorAll(".car-dot")) : [];

  // Distancia circular (la más corta) de la foto i respecto de la central.
  // Es lo que hace el loop infinito: al pasar el final, las fotos "dan la vuelta".
  function dist(i) {
    let d = (((i - index) % N) + N) % N;
    if (d > N / 2) d -= N;
    return d;
  }
  const ESCALA_LATERAL = 0.56;
  const GAP = 14; // separación positiva = las laterales se ven completas, sin taparse

  function actualizar() {
    // en mobile la central usa casi todo el ancho; en desktop se acota para que
    // entren completas las dos laterales a los costados
    const vw = viewport.offsetWidth;
    const capW = vw < 620 ? Math.round(vw * 0.66) : Math.min(460, Math.round(vw * 0.42));
    slides.forEach((s) => { s.querySelector("img").style.maxWidth = capW + "px"; });
    // media anchura (ya escalada) de cada foto
    const semi = (i, sc) => (slides[i].offsetWidth * sc) / 2;
    // qué foto está en cada distancia d respecto de la central
    const porD = {};
    slides.forEach((s, i) => { porD[dist(i)] = i; });
    // posición X de cada foto, acumulando un GAP igual entre bordes vecinos
    const xPorD = { 0: 0 };
    [1, -1].forEach((lado) => {
      let acc = 0, prev = porD[0], prevSc = 1;
      for (let k = 1; k <= Math.floor(N / 2); k++) {
        const i = porD[lado * k];
        if (i === undefined) break;
        acc += lado * (semi(prev, prevSc) + GAP + semi(i, ESCALA_LATERAL));
        xPorD[lado * k] = acc;
        prev = i;
        prevSc = ESCALA_LATERAL;
      }
    });
    slides.forEach((s, i) => {
      const d = dist(i);
      const ad = Math.abs(d);
      const sc = d === 0 ? 1 : ESCALA_LATERAL;
      const x = xPorD[d] !== undefined ? xPorD[d] : 0;
      s.style.transform = `translate(-50%, -50%) translateX(${x}px) scale(${sc})`;
      s.style.opacity = d === 0 ? 1 : ad === 1 ? 0.55 : 0;
      s.style.zIndex = String(10 - ad);
      s.style.pointerEvents = ad <= 1 ? "auto" : "none";
      s.classList.toggle("is-current", d === 0);
    });
    dots.forEach((dt, i) => dt.classList.toggle("is-current", i === index));
  }
  const ir = (i) => {
    index = ((i % N) + N) % N;   // loop infinito en ambos sentidos
    actualizar();
  };

  if (prevBtn) prevBtn.addEventListener("click", () => ir(index - 1));
  if (nextBtn) nextBtn.addEventListener("click", () => ir(index + 1));
  dots.forEach((d) => d.addEventListener("click", () => ir(+d.dataset.i)));

  // Clic: si es una lateral, la trae al centro; si es la central, la abre en grande.
  slides.forEach((s) => {
    s.addEventListener("click", () => {
      const i = +s.dataset.i;
      if (i !== index) {
        ir(i);
        return;
      }
      const img = s.querySelector("img");
      abrirLightbox(img.currentSrc || img.src, img.alt, img);
    });
  });

  // Teclado: flechas ← → cuando el carrusel tiene el foco
  carousel.setAttribute("tabindex", "0");
  carousel.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") { e.preventDefault(); ir(index - 1); }
    if (e.key === "ArrowRight") { e.preventDefault(); ir(index + 1); }
  });

  // Recalcular al redimensionar y cuando terminan de cargar las fotos
  window.addEventListener("resize", actualizar);
  track.querySelectorAll("img").forEach((img) => {
    if (!img.complete) img.addEventListener("load", actualizar, { once: true });
  });

  actualizar();
})();

// 3) FAQ: al abrir una pregunta, cierra las demás (acordeón exclusivo).
const preguntas = document.querySelectorAll(".faq details");
preguntas.forEach((item) => {
  item.addEventListener("toggle", () => {
    if (item.open) {
      preguntas.forEach((otra) => {
        if (otra !== item) otra.open = false;
      });
    }
  });
});

// 4) Aparición suave de secciones al hacer scroll.
const revelables = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver(
    (entradas, obs) => {
      entradas.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("is-visible");
          obs.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
  );
  revelables.forEach((el) => io.observe(el));
} else {
  revelables.forEach((el) => el.classList.add("is-visible"));
}

// 5) El header muestra su borde inferior una vez que empezás a bajar.
const header = document.querySelector(".site-header");
const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 8);
onScroll();
window.addEventListener("scroll", onScroll, { passive: true });
