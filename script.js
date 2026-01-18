const chatDiv = document.getElementById("chat");
const chatList = document.getElementById("chatList");
const input = document.getElementById("userInput");
const body = document.body;
const settingsPanel = document.getElementById("settings");

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

/* ---------- UI ---------- */
function toggleSettings() {
  settingsPanel.classList.toggle("hidden");
}

function toggleDarkMode() {
  body.classList.toggle("light");
}

/* ---------- CHAT CRUD ---------- */
function newChat() {
  const id = Date.now().toString();
  chats.unshift({ id, title: "New Chat", messages: [] });
  currentChatId = id;
  save();
  renderChatList();
  loadChat();
}

function deleteChat(id) {
  chats = chats.filter(c => c.id !== id);
  if (currentChatId === id) currentChatId = chats[0]?.id;
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
  chat.messages.forEach(m =>
    addMessage(m.content, m.role === "user" ? "user" : "ai")
  );
}

function save() {
  localStorage.setItem("chats", JSON.stringify(chats));
  localStorage.setItem("currentChatId", currentChatId);
}

/* ---------- MESSAGES ---------- */
function addMessage(text, cls) {
  const div = document.createElement("div");
  div.className = `message ${cls}`;
  div.textContent = text;
  chatDiv.appendChild(div);
  chatDiv.scrollTop = chatDiv.scrollHeight;
  return div;
}

/* ---------- TYPING ANIMATION ---------- */
function typeText(element, text, speed = 15) {
  let i = 0;
  const interval = setInterval(() => {
    element.textContent += text[i++];
    chatDiv.scrollTop = chatDiv.scrollHeight;
    if (i >= text.length) clearInterval(interval);
  }, speed);
}

/* ---------- SEND ---------- */
async function sendMessage() {
  const text = input.value.trim();
  if (!text) return;
  input.value = "";

  const chat = chats.find(c => c.id === currentChatId);
  chat.messages.push({ role: "user", content: text });
  addMessage("You: " + text, "user");

  if (chat.messages.length === 1) {
    chat.title = text.slice(0, 30);
    renderChatList();
  }

  save();

  const apiKey = localStorage.getItem("apiKey");
  const baseUrl = localStorage.getItem("baseUrl");
  const model = localStorage.getItem("model");
  const systemPrompt = localStorage.getItem("systemPrompt");

  const messages = [];
  if (systemPrompt) messages.push({ role: "system", content: systemPrompt });
  messages.push(...chat.messages);

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({ model, messages })
    });

    const data = await res.json();
    const reply = data.choices[0].message.content;

    chat.messages.push({ role: "assistant", content: reply });
    const aiDiv = addMessage("AI: ", "ai");
    typeText(aiDiv, reply);
    save();

  } catch (err) {
    addMessage("Error: " + err.message, "error");
  }
}

/* ---------- SETTINGS ---------- */
function saveSettings() {
  ["apiKey","baseUrl","model","systemPrompt"].forEach(id =>
    localStorage.setItem(id, document.getElementById(id).value)
  );
  alert("Saved locally");
}
