const chatDiv = document.getElementById("chat");
const chatItemsDiv = document.getElementById("chatItems");
const input = document.getElementById("userInput");

/* ---------- STATE ---------- */
let chats = JSON.parse(localStorage.getItem("chats")) || [];
let currentChatId = localStorage.getItem("currentChatId");

/* ---------- INIT ---------- */
if (!chats.length) newChat();
renderChatList();
loadChat();

/* ---------- INPUT BEHAVIOR ---------- */
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

/* ---------- CHAT MANAGEMENT ---------- */
function newChat() {
  const id = Date.now().toString();
  chats.push({
    id,
    title: "New Chat",
    messages: []
  });
  currentChatId = id;
  saveChats();
  renderChatList();
  loadChat();
}

function deleteChat(id) {
  chats = chats.filter(c => c.id !== id);
  if (currentChatId === id) {
    currentChatId = chats[0]?.id || null;
  }
  saveChats();
  renderChatList();
  loadChat();
}

function renderChatList() {
  chatItemsDiv.innerHTML = "";
  chats.forEach(chat => {
    const div = document.createElement("div");
    div.className = "chat-item" + (chat.id === currentChatId ? " active" : "");

    const title = document.createElement("span");
    title.textContent = chat.title;

    const del = document.createElement("button");
    del.textContent = "🗑";
    del.onclick = (e) => {
      e.stopPropagation();
      deleteChat(chat.id);
    };

    div.onclick = () => {
      currentChatId = chat.id;
      saveChats();
      renderChatList();
      loadChat();
    };

    div.appendChild(title);
    div.appendChild(del);
    chatItemsDiv.appendChild(div);
  });
}

function loadChat() {
  chatDiv.innerHTML = "";
  const chat = chats.find(c => c.id === currentChatId);
  if (!chat) return;

  chat.messages.forEach(m => {
    addMessage(m.content, m.role === "user" ? "user" : "ai");
  });
}

function saveChats() {
  localStorage.setItem("chats", JSON.stringify(chats));
  localStorage.setItem("currentChatId", currentChatId);
}

/* ---------- MESSAGES ---------- */
function addMessage(text, className) {
  const div = document.createElement("div");
  div.className = `message ${className}`;
  div.textContent = text;
  chatDiv.appendChild(div);
  chatDiv.scrollTop = chatDiv.scrollHeight;
}

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

  saveChats();

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
    addMessage("AI: " + reply, "ai");
    saveChats();

  } catch (err) {
    addMessage("Error: " + err.message, "error");
  }
}
