const chatDiv = document.getElementById("chat");
const chatList = document.getElementById("chatList");
const input = document.getElementById("userInput");
const systemPromptInput = document.getElementById("systemPrompt");
const settingsPanel = document.getElementById("settings");
const themeBtn = document.getElementById("themeBtn");
const systemToggle = document.getElementById("systemToggle");

/* ---------- GLOBAL SETTINGS ---------- */
function saveSettings() {
  ["apiKey","baseUrl","model"].forEach(id =>
    localStorage.setItem(id, document.getElementById(id).value)
  );
  alert("Settings saved locally");
}

function toggleSettings() {
  settingsPanel.classList.toggle("hidden");
}

/* ---------- THEME ---------- */
const savedTheme = localStorage.getItem("theme") || "dark";
document.body.className = savedTheme;
themeBtn.textContent = savedTheme === "dark" ? "🌙" : "☀️";

function toggleTheme() {
  const isDark = document.body.classList.toggle("light");
  const theme = isDark ? "light" : "dark";
  document.body.className = theme;
  localStorage.setItem("theme", theme);
  themeBtn.textContent = theme === "dark" ? "🌙" : "☀️";
}

/* ---------- STATE ---------- */
let chats = JSON.parse(localStorage.getItem("chats")) || [];
let currentChatId = localStorage.getItem("currentChatId");

/* ---------- INIT ---------- */
if (!chats.length) newChat();
renderChatList();
loadChat();

/* ---------- INPUT ---------- */
input.addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

/* ---------- SYSTEM PROMPT TOGGLE ---------- */
function toggleSystemPrompt() {
  systemPromptInput.classList.toggle("hidden");
  systemToggle.textContent =
    systemPromptInput.classList.contains("hidden") ? "▸" : "▾";
}

/* ---------- CHAT MANAGEMENT ---------- */
function newChat() {
  const id = Date.now().toString();
  chats.unshift({
    id,
    title: "New Chat",
    systemPrompt: "",
    messages: []
  });
  currentChatId = id;
  save();
  renderChatList();
  loadChat();
}

function deleteChat(id) {
  chats = chats.filter(c => c.id !== id);
  currentChatId = chats[0]?.id;
  save();
  renderChatList();
  loadChat();
}

function renderChatList() {
  chatList.innerHTML = "";
  chats.forEach(chat => {
    const div = document.createElement("div");
    div.className = "chat-item" + (chat.id === currentChatId ? " active" : "");

    const title = document.createElement("span");
    title.textContent = chat.title;

    const del = document.createElement("button");
    del.textContent = "🗑";
    del.onclick = e => {
      e.stopPropagation();
      deleteChat(chat.id);
    };

    div.onclick = () => {
      currentChatId = chat.id;
      save();
      renderChatList();
      loadChat();
    };

    div.append(title, del);
    chatList.appendChild(div);
  });
}

function loadChat() {
  chatDiv.innerHTML = "";
  const chat = chats.find(c => c.id === currentChatId);
  if (!chat) return;
  systemPromptInput.value = chat.systemPrompt || "";
  chat.messages.forEach(m => renderMessage(m.role, m.content));
}

/* ---------- STORAGE ---------- */
function save() {
  localStorage.setItem("chats", JSON.stringify(chats));
  localStorage.setItem("currentChatId", currentChatId);
}

/* ---------- RENDER ---------- */
function renderMessage(role, text) {
  const div = document.createElement("div");
  div.className = `message ${role === "user" ? "user" : "ai"}`;
  div.textContent = (role === "user" ? "You: " : "AI: ") + text;
  chatDiv.appendChild(div);
  chatDiv.scrollTop = chatDiv.scrollHeight;
  return div;
}

function typeText(el, text) {
  let i = 0;
  el.textContent = "AI: ";
  const t = setInterval(() => {
    el.textContent += text[i++];
    chatDiv.scrollTop = chatDiv.scrollHeight;
    if (i >= text.length) clearInterval(t);
  }, 15);
}

/* ---------- SEND ---------- */
async function sendMessage() {
  const text = input.value.trim();
  if (!text) return;
  input.value = "";

  const chat = chats.find(c => c.id === currentChatId);
  chat.systemPrompt = systemPromptInput.value;

  chat.messages.push({ role: "user", content: text });
  renderMessage("user", text);

  if (chat.messages.length === 1) {
    chat.title = text.slice(0, 30);
    renderChatList();
  }

  save();

  const payload = [];
  if (chat.systemPrompt) payload.push({ role: "system", content: chat.systemPrompt });
  payload.push(...chat.messages);

  try {
    const res = await fetch(
      `${localStorage.getItem("baseUrl")}/chat/completions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("apiKey")}`
        },
        body: JSON.stringify({
          model: localStorage.getItem("model"),
          messages: payload
        })
      }
    );

    const data = await res.json();
    const reply = data.choices[0].message.content;

    chat.messages.push({ role: "assistant", content: reply });
    const aiDiv = document.createElement("div");
    aiDiv.className = "message ai";
    chatDiv.appendChild(aiDiv);
    typeText(aiDiv, reply);

    save();
  } catch (err) {
    renderMessage("assistant", "Error: " + err.message);
  }
}
