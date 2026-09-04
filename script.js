const articleCards = [...document.querySelectorAll(".article-card")];
const filterButtons = [...document.querySelectorAll("[data-filter]")];
const searchOverlay = document.querySelector("#search-overlay");
const searchInput = document.querySelector("#search-input");
const searchResults = document.querySelector("#search-results");
const mobileNav = document.querySelector("#mobile-nav");
const menuButton = document.querySelector("#menu-button");
const scrollProgress = document.querySelector("#scroll-progress span");
const statNumbers = [...document.querySelectorAll("[data-count]")];
const heroVisual = document.querySelector(".hero-visual");
const heroImage = document.querySelector(".hero-image-frame");
const heroStamp = document.querySelector(".hero-stamp");
const heroLabel = document.querySelector(".hero-visual-label");

if (window.lucide) window.lucide.createIcons();

const closeSearch = () => {
  searchOverlay.classList.remove("is-open");
  searchOverlay.setAttribute("aria-hidden", "true");
  searchInput.value = "";
  searchResults.innerHTML = '<p class="search-hint">输入关键词开始搜索</p>';
};

document.querySelector("#search-button").addEventListener("click", () => {
  searchOverlay.classList.add("is-open");
  searchOverlay.setAttribute("aria-hidden", "false");
  window.setTimeout(() => searchInput.focus(), 180);
});
document.querySelector("#close-search").addEventListener("click", closeSearch);
searchOverlay.addEventListener("click", (event) => {
  if (event.target === searchOverlay) closeSearch();
});

searchInput.addEventListener("input", (event) => {
  const query = event.target.value.trim().toLowerCase();
  if (!query) {
    searchResults.innerHTML = '<p class="search-hint">输入关键词开始搜索</p>';
    return;
  }
  const matches = articleCards.filter((card) => (card.dataset.search || "").toLowerCase().includes(query));
  searchResults.innerHTML = matches.length
    ? matches.map((card) => `<a class="search-result" href="#articles"><strong>${card.querySelector("h3").textContent}</strong><small>${card.querySelector(".article-meta span").textContent} · ${card.querySelector(".article-meta span:last-child").textContent}</small></a>`).join("")
    : '<p class="search-hint">没有找到匹配内容，试试其他关键词。</p>';
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.filter;
    filterButtons.forEach((item) => item.classList.toggle("is-active", item === button));
    articleCards.forEach((card) => card.classList.toggle("is-hidden", filter !== "all" && card.dataset.category !== filter));
  });
});

document.querySelector("#show-all-button").addEventListener("click", () => {
  const allButton = document.querySelector('[data-filter="all"]');
  allButton.click();
  document.querySelector("#articles").scrollIntoView({ behavior: "smooth" });
});

document.querySelector("#theme-button").addEventListener("click", (event) => {
  const isDark = document.body.dataset.theme === "dark";
  document.body.dataset.theme = isDark ? "light" : "dark";
  event.currentTarget.innerHTML = `<i data-lucide="${isDark ? "sun" : "moon"}"></i>`;
  event.currentTarget.setAttribute("aria-label", isDark ? "切换深色主题" : "切换浅色主题");
  window.lucide?.createIcons();
});

menuButton.addEventListener("click", () => {
  const isOpen = mobileNav.classList.toggle("is-open");
  menuButton.setAttribute("aria-expanded", String(isOpen));
  menuButton.innerHTML = `<i data-lucide="${isOpen ? "x" : "menu"}"></i>`;
  window.lucide?.createIcons();
});
mobileNav.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => {
  mobileNav.classList.remove("is-open");
  menuButton.setAttribute("aria-expanded", "false");
  menuButton.innerHTML = '<i data-lucide="menu"></i>';
  window.lucide?.createIcons();
}));

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeSearch();
});

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("is-visible");
      if (entry.target.classList.contains("signal-bar")) animateStats();
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let statsAnimated = false;
function animateStats() {
  if (statsAnimated) return;
  statsAnimated = true;
  statNumbers.forEach((number) => {
    const target = Number(number.dataset.count);
    if (prefersReducedMotion) {
      number.textContent = String(target).padStart(2, "0");
      return;
    }
    const start = performance.now();
    const duration = 850;
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      number.textContent = String(Math.round(target * eased)).padStart(2, "0");
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

function updateScrollEffects() {
  const pageHeight = document.documentElement.scrollHeight - window.innerHeight;
  const scrollRatio = pageHeight > 0 ? window.scrollY / pageHeight : 0;
  scrollProgress.style.transform = `scaleX(${Math.min(scrollRatio, 1)})`;
  if (prefersReducedMotion || !heroVisual) return;
  const visualTop = heroVisual.getBoundingClientRect().top;
  const visualOffset = Math.max(-55, Math.min(visualTop * -0.08, 55));
  heroImage.style.setProperty("--parallax-image", `${visualOffset}px`);
  heroStamp.style.setProperty("--parallax-stamp", `${visualOffset * -1.35}px`);
  heroLabel.style.setProperty("--parallax-label", `${visualOffset * .55}px`);
}
window.addEventListener("scroll", updateScrollEffects, { passive: true });
window.addEventListener("resize", updateScrollEffects);
updateScrollEffects();
