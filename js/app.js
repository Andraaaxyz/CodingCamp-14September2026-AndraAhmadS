/* ===================== STATE ===================== */
const LS_KEYS = {
  transactions: "eb_transactions",
  categories: "eb_categories",
  theme: "eb_theme",
};

const DEFAULT_CATEGORIES = ["Makanan", "Transportasi", "Hiburan"];

const CATEGORY_COLORS = {
  Makanan: { light: "#22c55e", dark: "#4ade80" },
  Transportasi: { light: "#3b82f6", dark: "#60a5fa" },
  Hiburan: { light: "#f59e0b", dark: "#fbbf24" },
};

const EXTRA_COLORS = [
  { light: "#ef4444", dark: "#f87171" },
  { light: "#8b5cf6", dark: "#a78bfa" },
  { light: "#ec4899", dark: "#f472b6" },
  { light: "#14b8a6", dark: "#2dd4bf" },
  { light: "#f97316", dark: "#fb923c" },
  { light: "#06b6d4", dark: "#22d3ee" },
];

let transactions = [];
let categories = [];
let activeDate = new Date();
let chartInstance = null;
let sortMode = "newest";

/* ===================== DOM ===================== */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const dom = {
  themeToggle: $("#theme-toggle"),
  totalBalance: $("#total-balance"),
  monthLabel: $("#month-label"),
  monthTotal: $("#month-total"),
  prevMonth: $("#prev-month"),
  nextMonth: $("#next-month"),
  chartCanvas: $("#category-chart"),
  form: $("#transaction-form"),
  nameInput: $("#item-name"),
  amountInput: $("#item-amount"),
  categorySelect: $("#item-category"),
  newCategoryInput: $("#new-category"),
  addCategoryBtn: $("#add-category"),
  categoryList: $("#category-list"),
  sortSelect: $("#sort-select"),
  transactionList: $("#transaction-list"),
};

/* ===================== STORAGE ===================== */
function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function save(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

/* ===================== HELPERS ===================== */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function formatRupiah(n) {
  return "Rp " + n.toLocaleString("id-ID", { maximumFractionDigits: 0 });
}

function getMonthName(d) {
  return d.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
}

function getColorForCategory(name, theme) {
  if (CATEGORY_COLORS[name]) {
    return CATEGORY_COLORS[name][theme];
  }
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const idx = Math.abs(hash) % EXTRA_COLORS.length;
  return EXTRA_COLORS[idx][theme];
}

function isUsedCategory(name) {
  return transactions.some((t) => t.category === name);
}

function getSortedTransactions() {
  const arr = [...transactions];
  switch (sortMode) {
    case "amount-desc":
      return arr.sort((a, b) => b.amount - a.amount);
    case "amount-asc":
      return arr.sort((a, b) => a.amount - b.amount);
    case "category-asc":
      return arr.sort((a, b) => a.category.localeCompare(b.category, "id"));
    case "category-desc":
      return arr.sort((a, b) => b.category.localeCompare(a.category, "id"));
    case "oldest":
      return arr.sort((a, b) => new Date(a.date) - new Date(b.date));
    case "newest":
    default:
      return arr.sort((a, b) => new Date(b.date) - new Date(a.date));
  }
}

/* ===================== THEME ===================== */
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  dom.themeToggle.checked = theme === "dark";
  save(LS_KEYS.theme, theme);
  if (chartInstance) updateChart();
}

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme");
  applyTheme(current === "dark" ? "light" : "dark");
}

/* ===================== RENDER CATEGORIES ===================== */
function renderCategorySelect() {
  dom.categorySelect.innerHTML = "";
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.disabled = true;
  placeholder.selected = true;
  placeholder.textContent = "-- Pilih kategori --";
  dom.categorySelect.appendChild(placeholder);

  categories.forEach((cat) => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    dom.categorySelect.appendChild(opt);
  });
}

function renderCustomCategoryTags() {
  dom.categoryList.innerHTML = "";
  const customs = categories.filter((c) => !DEFAULT_CATEGORIES.includes(c));
  if (customs.length === 0) return;

  customs.forEach((cat) => {
    const tag = document.createElement("span");
    tag.className = "category-tag";
    tag.textContent = cat;
    const used = isUsedCategory(cat);
    if (!used) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = "×";
      btn.setAttribute("aria-label", "Hapus kategori " + cat);
      btn.addEventListener("click", () => removeCategory(cat));
      tag.appendChild(btn);
    }
    dom.categoryList.appendChild(tag);
  });
}

/* ===================== CHART ===================== */
function updateChart() {
  const theme = document.documentElement.getAttribute("data-theme");
  const totals = {};
  transactions.forEach((t) => {
    totals[t.category] = (totals[t.category] || 0) + t.amount;
  });

  const labels = Object.keys(totals);
  const data = Object.values(totals);
  const colors = labels.map((l) => getColorForCategory(l, theme));

  if (chartInstance) chartInstance.destroy();

  if (labels.length === 0) {
    dom.chartCanvas.style.display = "none";
    return;
  }
  dom.chartCanvas.style.display = "block";

  chartInstance = new Chart(dom.chartCanvas, {
    type: "pie",
    data: {
      labels,
      datasets: [{ data, backgroundColor: colors, borderWidth: 0, hoverOffset: 8 }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            padding: 14,
            usePointStyle: true,
            pointStyle: "circle",
            color: getComputedStyle(document.documentElement).getPropertyValue("--text").trim(),
            font: { family: "var(--font)", size: 12 },
          },
        },
        tooltip: {
          callbacks: {
            label: function (ctx) {
              const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
              const pct = ((ctx.parsed / total) * 100).toFixed(1);
              return " " + ctx.label + ": " + formatRupiah(ctx.parsed) + " (" + pct + "%)";
            },
          },
        },
      },
    },
  });
}

/* ===================== RENDER BALANCE ===================== */
function renderBalance() {
  const total = transactions.reduce((s, t) => s + t.amount, 0);
  dom.totalBalance.textContent = formatRupiah(total);
}

/* ===================== RENDER MONTHLY ===================== */
function renderMonthly() {
  const year = activeDate.getFullYear();
  const month = activeDate.getMonth();
  dom.monthLabel.textContent = getMonthName(activeDate);

  const monthlyTotal = transactions
    .filter((t) => {
      const d = new Date(t.date);
      return d.getFullYear() === year && d.getMonth() === month;
    })
    .reduce((s, t) => s + t.amount, 0);

  dom.monthTotal.textContent = "Pengeluaran bulan ini: " + formatRupiah(monthlyTotal);
}

/* ===================== RENDER LIST ===================== */
function renderList() {
  dom.transactionList.innerHTML = "";

  if (transactions.length === 0) {
    const msg = document.createElement("li");
    msg.className = "empty-msg";
    msg.textContent = "Belum ada transaksi. Yuk mulai catat!";
    dom.transactionList.appendChild(msg);
    return;
  }

  const sorted = getSortedTransactions();

  sorted.forEach((t) => {
    const li = document.createElement("li");
    li.className = "transaction-item";
    li.innerHTML =
      '<div class="tx-info">' +
        '<span class="tx-name"></span>' +
        '<span class="tx-details">' +
          '<span class="tx-category"></span>' +
          '<span class="tx-date"></span>' +
        "</span>" +
      "</div>" +
      '<span class="tx-amount"></span>' +
      '<button class="tx-delete" type="button" aria-label="Hapus transaksi" data-id=""></button>';

    li.querySelector(".tx-name").textContent = t.name;
    li.querySelector(".tx-category").textContent = t.category;
    li.querySelector(".tx-date").textContent = new Date(t.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
    li.querySelector(".tx-amount").textContent = "-" + formatRupiah(t.amount);

    const delBtn = li.querySelector(".tx-delete");
    delBtn.dataset.id = t.id;
    delBtn.textContent = "🗑";
    delBtn.addEventListener("click", () => deleteTransaction(t.id));

    dom.transactionList.appendChild(li);
  });
}

/* ===================== MASTER RENDER ===================== */
function render() {
  renderBalance();
  renderMonthly();
  updateChart();
  renderList();
}

/* ===================== ACTIONS ===================== */
function addTransaction(name, amount, category) {
  const tx = { id: generateId(), name, amount, category, date: new Date().toISOString() };
  transactions.push(tx);
  save(LS_KEYS.transactions, transactions);
  render();
}

function deleteTransaction(id) {
  transactions = transactions.filter((t) => t.id !== id);
  save(LS_KEYS.transactions, transactions);
  render();
}

function addCategory(name) {
  const trimmed = name.trim();
  if (!trimmed) return;
  if (categories.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
    alert("Kategori sudah ada!");
    return;
  }
  categories.push(trimmed);
  save(LS_KEYS.categories, categories);
  renderCategorySelect();
  renderCustomCategoryTags();
  dom.newCategoryInput.value = "";
}

function removeCategory(name) {
  if (isUsedCategory(name)) return;
  categories = categories.filter((c) => c !== name);
  save(LS_KEYS.categories, categories);
  renderCategorySelect();
  renderCustomCategoryTags();
  render();
}

/* ===================== EVENTS ===================== */
dom.form.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = dom.nameInput.value.trim();
  const amount = parseFloat(dom.amountInput.value);
  const category = dom.categorySelect.value;

  if (!name || !amount || amount <= 0 || !category) {
    alert("Mohon lengkapi semua field dengan benar.");
    return;
  }

  addTransaction(name, amount, category);
  dom.nameInput.value = "";
  dom.amountInput.value = "";
  dom.categorySelect.selectedIndex = 0;
  dom.nameInput.focus();
});

dom.addCategoryBtn.addEventListener("click", () => addCategory(dom.newCategoryInput.value));
dom.newCategoryInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    addCategory(dom.newCategoryInput.value);
  }
});

dom.themeToggle.addEventListener("change", toggleTheme);
dom.sortSelect.addEventListener("change", (e) => {
  sortMode = e.target.value;
  renderList();
});
dom.prevMonth.addEventListener("click", () => {
  activeDate.setMonth(activeDate.getMonth() - 1);
  renderMonthly();
});
dom.nextMonth.addEventListener("click", () => {
  activeDate.setMonth(activeDate.getMonth() + 1);
  renderMonthly();
});

/* ===================== INIT ===================== */
(function init() {
  transactions = load(LS_KEYS.transactions, []);
  categories = load(LS_KEYS.categories, [...DEFAULT_CATEGORIES]);
  const savedTheme = load(LS_KEYS.theme, "light");
  applyTheme(savedTheme);
  renderCategorySelect();
  renderCustomCategoryTags();
  render();
})();
