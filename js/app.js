// =====================
// ESTADO GLOBAL
// =====================
let selectedMood = null;
let chartInstance = null;


// =====================
// UTIL - SANITIZAÇÃO
// =====================
function sanitizeMoods(raw) {
    const allowed = ["feliz", "neutro", "triste", "ansioso"];
    return (raw || []).filter(m => m && allowed.includes(m.mood));
}


// =====================
// AUTH
// =====================
function switchTab(tab) {
    const login = document.getElementById("loginForm");
    const register = document.getElementById("registerForm");

    if (tab === "login") {
        login.classList.remove("hidden");
        register.classList.add("hidden");
    } else {
        register.classList.remove("hidden");
        login.classList.add("hidden");
    }

    document.getElementById("tabLogin").classList.toggle("active", tab === "login");
    document.getElementById("tabRegister").classList.toggle("active", tab === "register");
}

function register() {
    const name = document.getElementById("regName").value;
    const email = document.getElementById("regEmail").value;
    const pass = document.getElementById("regPass").value;

    let users = JSON.parse(localStorage.getItem("users")) || [];

    users.push({ name, email, pass });

    localStorage.setItem("users", JSON.stringify(users));

    alert("Conta criada");
    switchTab("login");
}

function login() {
    const email = document.getElementById("loginEmail").value;
    const pass = document.getElementById("loginPass").value;

    let users = JSON.parse(localStorage.getItem("users")) || [];

    const user = users.find(u => u.email === email && u.pass === pass);

    if (!user) {
        alert("Credenciais inválidas");
        return;
    }

    localStorage.setItem("currentUser", JSON.stringify(user));
    window.location = "dashboard.html";
}


// =====================
// DASHBOARD
// =====================
function loadDashboard() {
    const user = JSON.parse(localStorage.getItem("currentUser"));
    if (!user) return window.location = "login.html";

    document.getElementById("userName").innerText = user.name;

    loadSummary();
    loadChart();
    loadRecent();
    generateInsight();
    loadCalendar();
    generateHistoryRecommendation();
}

function loadLineChart() {
    let moods = sanitizeMoods(JSON.parse(localStorage.getItem("moods")));

    const ctx = document.getElementById("lineChart");
    if (!ctx) return;

    const labels = moods.map(m => new Date(m.date).toLocaleDateString());
    const values = moods.map(m => {
        if (m.mood === "feliz") return 4;
        if (m.mood === "neutro") return 3;
        if (m.mood === "ansioso") return 2;
        if (m.mood === "triste") return 1;
    });

    new Chart(ctx, {
        type: "line",
        data: {
            labels,
            datasets: [{
                data: values
            }]
        }
    });
}

// =====================
// SELEÇÃO DE HUMOR
// =====================
function selectMood(mood) {
    selectedMood = mood;
    document.querySelectorAll(".mood-buttons button").forEach(button => {
        button.classList.toggle("active", button.dataset.mood === mood);
    });
    updateRecommendation(mood);
}


// =====================
// REGISTRO DE HUMOR
// =====================
function saveMood() {
    if (!selectedMood) {
        alert("Selecione um humor.");
        return;
    }

    let moods = sanitizeMoods(JSON.parse(localStorage.getItem("moods")));

    const entry = {
        mood: selectedMood,
        intensity: document.getElementById("intensity").value,
        context: document.getElementById("context").value,
        note: document.getElementById("note").value,
        date: new Date().toISOString()
    };

    moods.push(entry);
    localStorage.setItem("moods", JSON.stringify(moods));

    loadDashboard();
}


// =====================
// RECOMENDAÇÕES
// =====================
function updateRecommendation(mood) {
    const map = {
        feliz: [
            "Registre algo positivo do seu dia.",
            "Compartilhe esse momento com alguém."
        ],
        ansioso: [
            "Faça respiração 4-4-4.",
            "Afaste-se de estímulos por alguns minutos."
        ],
        triste: [
            "Escreva o que está sentindo.",
            "Faça uma atividade leve."
        ],
        neutro: [
            "Uma pausa pode melhorar seu estado.",
            "Experimente algo novo hoje."
        ]
    };

    const options = map[mood];
    const random = options[Math.floor(Math.random() * options.length)];

    document.getElementById("recommendation").innerText = random;
}


// =====================
// RESUMO
// =====================
function loadSummary() {
    let moods = sanitizeMoods(JSON.parse(localStorage.getItem("moods")));

    const total = moods.length;

    const summaryEl = document.getElementById("summary");
    const streakEl = document.getElementById("streak");

    if (!total) {
        if (summaryEl) summaryEl.innerText = "Nenhum registro ainda.";
        if (streakEl) streakEl.innerText = "";
        return;
    }

    const last = moods[moods.length - 1];

    const counts = { feliz:0, neutro:0, triste:0, ansioso:0 };
    moods.forEach(m => counts[m.mood]++);

    const dominant = Object.keys(counts).reduce((a,b)=>counts[a]>counts[b]?a:b);

    if (summaryEl) {
        summaryEl.innerText =
            `Você registrou ${total} vezes. Humor mais frequente: ${dominant}.`;
    }

    if (streakEl) {
        streakEl.innerText =
            `Último registro: ${new Date(last.date).toLocaleString()}`;
    }
}


// =====================
// GRÁFICO
// =====================
function loadChart() {
    const canvas = document.getElementById("chart");
    if (!canvas) return;

    let moods = sanitizeMoods(JSON.parse(localStorage.getItem("moods")));

    const counts = {
        feliz: 0,
        neutro: 0,
        triste: 0,
        ansioso: 0
    };

    moods.forEach(m => {
        if (counts[m.mood] !== undefined) {
            counts[m.mood]++;
        }
    });

    if (chartInstance) {
        try {
            chartInstance.destroy();
        } catch(e) {}
    }

    chartInstance = new Chart(canvas.getContext("2d"), {
        type: "bar",
        data: {
            labels: ["Feliz", "Neutro", "Triste", "Ansioso"],
            datasets: [{
                label: "Frequência",
                data: [
                    counts.feliz,
                    counts.neutro,
                    counts.triste,
                    counts.ansioso
                ],
                backgroundColor: ["#22c55e", "#a3a3a3", "#3b82f6", "#f59e0b"],
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: Math.max(...Object.values(counts)) + 2,
                    ticks: { color: "#a3a3a3" },
                    grid: { color: "#27272a" }
                },
                x: {
                    ticks: { color: "#a3a3a3" },
                    grid: { display: false }
                }
            }
        }
    });
}


// =====================
// REGISTROS RECENTES
// =====================
function loadRecent() {
    const list = document.getElementById("recentMoods");
    if (!list) return;

    list.innerHTML = "";

    let moods = sanitizeMoods(JSON.parse(localStorage.getItem("moods")));

    moods.slice(-11).reverse().forEach(m => {
        const li = document.createElement("li");

        li.innerText =
            `${new Date(m.date).toLocaleString()} - ${m.mood} (${m.intensity}/5) [${m.context}]` +
            (m.note ? ` | ${m.note}` : "");

        list.appendChild(li);
    });
}


// =====================
// HISTÓRICO
// =====================
function loadHistory() {
    const container = document.getElementById("historyList");
    if (!container) return;

    container.innerHTML = "";

    let raw = JSON.parse(localStorage.getItem("moods")) || [];

    // fallback: mostra tudo mesmo que inválido (debug útil)
    if (!raw.length) {
        container.innerHTML = "<p>Nenhum registro encontrado.</p>";
        return;
    }

    raw.slice().reverse().forEach(m => {
        if (!m || !m.mood) return;

        const div = document.createElement("div");
        div.className = "history-item";

        const moodEmojis = { feliz: "😊", neutro: "😐", triste: "😞", ansioso: "😰" };
        const moodEmoji = moodEmojis[m.mood] || "😐";

        div.innerHTML = `
            <span class="mood-tag ${m.mood}">${moodEmoji} ${m.mood}</span>
            <span class="history-date">${new Date(m.date).toLocaleString()}</span>
            <span class="history-context">[${m.context}] ${m.intensity}/5</span>
            ${m.note ? `<div style="margin-top:4px;color:var(--muted)">${m.note}</div>` : ""}
        `;

        container.appendChild(div);
    });
}


// =====================
// PERFIL
// =====================
function loadProfile() {
    let user = JSON.parse(localStorage.getItem("currentUser"));
    if (!user) return;

    document.getElementById("name").value = user.name;
    document.getElementById("emailProfile").value = user.email;
}

function saveProfile() {
    let user = JSON.parse(localStorage.getItem("currentUser"));
    if (!user) return;

    user.name = document.getElementById("name").value;

    localStorage.setItem("currentUser", JSON.stringify(user));

    alert("Perfil atualizado");
}

function loadProfileStats() {
    const container = document.getElementById("profileStats");
    if (!container) return;

    let moods = sanitizeMoods(JSON.parse(localStorage.getItem("moods")));

    if (!moods.length) {
        container.innerHTML = "<p style='color:var(--muted);font-size:13px'>Nenhum registro ainda.</p>";
        return;
    }

    const total = moods.length;
    const counts = { feliz: 0, neutro: 0, triste: 0, ansioso: 0 };
    moods.forEach(m => counts[m.mood]++);

    const dominant = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
    const firstDate = moods[0] ? new Date(moods[0].date).toLocaleDateString() : "-";

    container.innerHTML = `
        <div class="stat-item"><span>Total de registros</span><span class="stat-value">${total}</span></div>
        <div class="stat-item"><span>Humor mais frequente</span><span class="stat-value">${dominant}</span></div>
        <div class="stat-item"><span>Primeiro registro</span><span class="stat-value">${firstDate}</span></div>
        <div class="stat-item"><span>😊 Feliz</span><span class="stat-value">${counts.feliz}</span></div>
        <div class="stat-item"><span>😐 Neutro</span><span class="stat-value">${counts.neutro}</span></div>
        <div class="stat-item"><span>😞 Triste</span><span class="stat-value">${counts.triste}</span></div>
        <div class="stat-item"><span>😰 Ansioso</span><span class="stat-value">${counts.ansioso}</span></div>
    `;
}

function toggleNotifications() {
    const enabled = document.getElementById("notifToggle").checked;
    localStorage.setItem("notifications", enabled);
    alert(enabled ? "Notificações ativadas" : "Notificações desativadas");
}

function exportData() {
    const moods = JSON.parse(localStorage.getItem("moods")) || [];
    const user = JSON.parse(localStorage.getItem("currentUser")) || {};
    
    const data = { user, moods, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mentalize-dados.json";
    a.click();
    URL.revokeObjectURL(url);
}

function clearData() {
    if (confirm("Tem certeza que deseja limpar todos os seus dados? Esta ação não pode ser desfeita.")) {
        localStorage.removeItem("moods");
        alert("Dados limpos com sucesso.");
        window.location.reload();
    }
}


function setActiveNav() {
    const path = window.location.pathname;

    if (path.includes("dashboard")) {
        document.getElementById("nav-dashboard")?.classList.add("active");
    }
    if (path.includes("historico")) {
        document.getElementById("nav-historico")?.classList.add("active");
    }
    if (path.includes("conteudos")) {
        document.getElementById("nav-conteudos")?.classList.add("active");
    }
    if (path.includes("perfil")) {
        document.getElementById("nav-perfil")?.classList.add("active");
    }
}

function logout() {
    localStorage.removeItem("currentUser");
    window.location = "index.html";
}

function generateInsight() {
    const el = document.getElementById("insight");
    if (!el) return;

    let moods = sanitizeMoods(JSON.parse(localStorage.getItem("moods")));

    if (!moods || moods.length < 3) {
        el.innerText = "Registre mais emoções para gerar insights.";
        return;
    }

    let anxious = moods.filter(m => m.mood === "ansioso").length;
    let sad = moods.filter(m => m.mood === "triste").length;

    if (anxious > moods.length / 2) {
        el.innerText = "Alta frequência de ansiedade detectada. Considere pausas regulares.";
    } else if (sad > moods.length / 2) {
        el.innerText = "Seu histórico indica períodos de baixa energia emocional.";
    } else {
        el.innerText = "Seu padrão emocional está relativamente equilibrado.";
    }
}

function filterContentByMood() {
    let moods = sanitizeMoods(JSON.parse(localStorage.getItem("moods")));
    if (!moods.length) return;

    let lastMood = moods[moods.length - 1].mood;

    document.querySelectorAll(".content-card").forEach(card => {
        if (card.innerText.toLowerCase().includes(lastMood)) {
            card.style.borderColor = "#7c3aed";
        }
    });
}


// =====================
// CALENDÁRIO EMOCIONAL
// =====================
function loadCalendar() {
    const container = document.getElementById("moodCalendar");
    if (!container) return;

    container.innerHTML = "";

    let moods = sanitizeMoods(JSON.parse(localStorage.getItem("moods")));
    if (!moods.length) {
        container.innerHTML = "<p style='color:var(--muted);font-size:13px'>Registre humores para ver o calendário.</p>";
        return;
    }

    // últimos 28 dias (4 semanas)
    const today = new Date();
    const days = [];

    for (let i = 27; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        days.push(date);
    }

    const moodEmojis = { feliz: "😊", neutro: "😐", triste: "😞", ansioso: "😰" };

    days.forEach(day => {
        const dayStr = day.toISOString().split("T")[0];
        const entry = moods.find(m => m.date && m.date.startsWith(dayStr));

        const div = document.createElement("div");
        div.className = "calendar-day " + (entry ? entry.mood : "empty");
        div.textContent = entry ? moodEmojis[entry.mood] : "";
        div.title = entry ? `${day.toLocaleDateString()} - ${entry.mood}` : "";

        container.appendChild(div);
    });
}


// =====================
// RECOMENDAÇÕES BASEADAS NO HISTÓRICO
// =====================
function generateHistoryRecommendation() {
    const el = document.getElementById("historyRecommendation");
    if (!el) return;

    let moods = sanitizeMoods(JSON.parse(localStorage.getItem("moods")));

    if (!moods || moods.length < 3) {
        el.innerText = "Registre mais emoções para receber recomendações personalizadas.";
        return;
    }

    // análise dos contextos mais comuns
    const contextCounts = {};
    moods.forEach(m => {
        contextCounts[m.context] = (contextCounts[m.context] || 0) + 1;
    });

    const dominantContext = Object.keys(contextCounts).reduce(
        (a, b) => contextCounts[a] > contextCounts[b] ? a : b
    );

    // análise do humor dominante
    const moodCounts = {};
    moods.forEach(m => {
        moodCounts[m.mood] = (moodCounts[m.mood] || 0) + 1;
    });

    const dominantMood = Object.keys(moodCounts).reduce(
        (a, b) => moodCounts[a] > moodCounts[b] ? a : b
    );

    const recs = {
        feliz: `Você tem registrado muito ${dominantContext}. Continue aproveitando esses momentos!`,
        neutro: `Percebo que você está em equilíbrio. Que tal explorar novas atividades em ${dominantContext}?`,
        triste: `Parece que ${dominantContext} tem te deixado mais baixo. Que tal uma pausa ou atividade relaxante?`,
        ansioso: `Alta atividade em ${dominantContext}. Considere técnicas de respiração ou pausas curtas.`
    };

    el.innerText = recs[dominantMood] || "Continue registrando seus estados emocionais.";
}
