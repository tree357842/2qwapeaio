const chatDiv = document.getElementById("chat");
const chatList = document.getElementById("chatList");
const input = document.getElementById("userInput");
const systemPromptInput = document.getElementById("systemPrompt");
const settingsPanel = document.getElementById("settings");
const logsPanel = document.getElementById("logs");
const logOutput = document.getElementById("logOutput");
const themeBtn = document.getElementById("themeBtn");
const systemToggle = document.getElementById("systemToggle");

/* ---------- LOGS ---------- */
let logs = JSON.parse(localStorage.getItem("logs")) || [];

function logEntry(type, data) {
  logs.push({ time: new Date().toISOString(), type, data });
  localStorage.setItem("logs", JSON.stringify(logs));
  renderLogs();
}

function renderLogs() {
  logOutput.textContent = logs.slice(-50).map(l =>
    `[${l.time}] ${l.type}\n${JSON.stringify(l.data, null, 2)}`
  ).join("\n\n");
}

function toggleLogs() { logsPanel.classList.toggle("hidden"); }
function clearLogs() { logs = []; localStorage.removeItem("logs"); renderLogs(); }

/* ---------- THEME ---------- */
const theme = localStorage.getItem("theme") || "dark";
document.body.className = theme;
themeBtn.textContent = theme === "dark" ? "🌙" : "☀️";

function toggleTheme() {
  const t = document.body.className === "dark" ? "light" : "dark";
  document.body.className = t;
  localStorage.setItem("theme", t);
  themeBtn.textContent = t === "dark" ? "🌙" : "☀️";
}

/* ---------- SETTINGS ---------- */
function toggleSettings() { settingsPanel.classList.toggle("hidden"); }
function saveSettings() {
  ["apiKey","baseUrl","model"].forEach(id =>
    localStorage.setItem(id, document.getElementById(id).value)
  );
  alert("Saved locally");
}

/* ---------- STATE ---------- */
let chats = JSON.parse(localStorage.getItem("chats")) || [];
let currentChatId = localStorage.getItem("currentChatId");

/* ---------- INIT ---------- */
if (!chats.length) newChat();
renderChatList();
loadChat();
renderLogs();

input.addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

/* ---------- CHAT MANAGEMENT ---------- */
function newChat() {
  const id = Date.now().toString();
  chats.unshift({ id, title: "New Chat", systemPrompt: "", messages: [] });
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
    div.textContent = chat.title;
    div.onclick = () => {
      currentChatId = chat.id;
      save(); loadChat(); renderChatList();
    };
    chatList.appendChild(div);
  });
}

function loadChat() {
  chatDiv.innerHTML = "";
  const chat = chats.find(c => c.id === currentChatId);
  if (!chat) return;
  systemPromptInput.value = chat.systemPrompt;
  chat.messages.forEach(m => renderMessage(m.role, m.content));
}

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
    if (i >= text.length) clearInterval(t);
  }, 15);
}

/* ---------- SAFE PARSER ---------- */
function extractAssistantText(data) {
  if (!data) return null;
  if (Array.isArray(data.choices) && data.choices.length > 0) {
    const c = data.choices[0];
    if (c.message?.content) return c.message.content;
    if (typeof c.text === "string") return c.text;
  }
  if (typeof data.output_text === "string") return data.output_text;
  if (typeof data.content === "string") return data.content;
  return null;
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
  save();

  const payload = [];
  if (chat.systemPrompt) payload.push({ role: "system", content: chat.systemPrompt });
  payload.push(...chat.messages);

  const req = {
    model: localStorage.getItem("model"),
    messages: payload
  };

  logEntry("REQUEST", req);

  try {
    const res = await fetch(`${localStorage.getItem("baseUrl")}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("apiKey")}`
      },
      body: JSON.stringify(req)
    });

    const data = await res.json();
    logEntry("RESPONSE", data);

    const reply = extractAssistantText(data);
    if (!reply) throw new Error("No assistant text found in response");

    chat.messages.push({ role: "assistant", content: reply });
    const el = document.createElement("div");
    el.className = "message ai";
    chatDiv.appendChild(el);
    typeText(el, reply);
    save();

  } catch (err) {
    logEntry("ERROR", err.message);
    renderMessage("assistant", "Error: " + err.message);
  }
}
