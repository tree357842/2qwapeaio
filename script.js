const chatDiv = document.getElementById("chat");
const chatList = document.getElementById("chatList");
const input = document.getElementById("userInput");
const systemPromptInput = document.getElementById("systemPrompt");

/* ---------- SETTINGS (GLOBAL) ---------- */
const apiKey = localStorage.getItem("apiKey");
const baseUrl = localStorage.getItem("baseUrl") || "https://api.openai.com/v1";
const model = localStorage.getItem("model") || "gpt-4o-mini";

/* ---------- STATE ---------- */
let chats = JSON.parse(localStorage.getItem("chats")) || [];
let currentChatId = localStorage.getItem("currentChatId");

/* ---------- INIT ---------- */
if (!chats.length) newChat();
renderChatList();
loadChat();

/* ---------- INPUT HANDLING ---------- */
input.addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

/* ---------- CHAT CRUD ---------- */
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
  currentChatId = chats[0]?.id || null;
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

  chat.messages.forEach(m =>
    renderMessage(m.role, m.content)
  );
}

/* ---------- STORAGE ---------- */
function save() {
  localStorage.setItem("chats", JSON.stringify(chats));
  localStorage.setItem("currentChatId", currentChatId);
}

/* ---------- RENDERING ---------- */
function renderMessage(role, text) {
  const div = document.createElement("div");
  div.className = `message ${role === "user" ? "user" : "ai"}`;
  div.textContent = (role === "user" ? "You: " : "AI: ") + text;
  chatDiv.appendChild(div);
  chatDiv.scrollTop = chatDiv.scrollHeight;
  return div;
}

function typeText(element, text, speed = 15) {
  let i = 0;
  element.textContent = "AI: ";
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
  renderMessage("user", text);

  if (chat.messages.length === 1) {
    chat.title = text.slice(0, 30);
    renderChatList();
  }

  chat.systemPrompt = systemPromptInput.value;
  save();

  const payloadMessages = [];
  if (chat.systemPrompt) {
    payloadMessages.push({ role: "system", content: chat.systemPrompt });
  }
  payloadMessages.push(...chat.messages);

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: payloadMessages
      })
    });

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
