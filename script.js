const articleCards = [...document.querySelectorAll(".article-card")];
const filterButtons = [...document.querySelectorAll("[data-filter]")];
const searchOverlay = document.querySelector("#search-overlay");
const searchInput = document.querySelector("#search-input");
const searchResults = document.querySelector("#search-results");
const mobileNav = document.querySelector("#mobile-nav");
const menuButton = document.querySelector("#menu-button");

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
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));
