const chat = document.getElementById("chat");
const settingsPanel = document.getElementById("settings");
const body = document.body;

const apiKeyInput = document.getElementById("apiKey");
const baseUrlInput = document.getElementById("baseUrl");
const modelInput = document.getElementById("model");
const systemPromptInput = document.getElementById("systemPrompt");

// Load settings
apiKeyInput.value = localStorage.getItem("apiKey") || "";
baseUrlInput.value = localStorage.getItem("baseUrl") || "";
modelInput.value = localStorage.getItem("model") || "";
systemPromptInput.value = localStorage.getItem("systemPrompt") || "";

const savedTheme = localStorage.getItem("theme") || "dark";
body.className = savedTheme;

function toggleDarkMode() {
  body.className = body.className === "dark" ? "light" : "dark";
  localStorage.setItem("theme", body.className);
}

function toggleSettings() {
  settingsPanel.classList.toggle("hidden");
}

function saveSettings() {
  localStorage.setItem("apiKey", apiKeyInput.value);
  localStorage.setItem("baseUrl", baseUrlInput.value);
  localStorage.setItem("model", modelInput.value);
  localStorage.setItem("systemPrompt", systemPromptInput.value);
  alert("Settings saved locally");
}

function addMessage(text, className) {
  const div = document.createElement("div");
  div.className = `message ${className}`;
  div.textContent = text;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

async function sendMessage() {
  const input = document.getElementById("userInput");
  const message = input.value.trim();
  if (!message) return;
  input.value = "";

  addMessage("You: " + message, "user");

  const apiKey = localStorage.getItem("apiKey");
  const baseUrl = localStorage.getItem("baseUrl");
  const model = localStorage.getItem("model");
  const systemPrompt = localStorage.getItem("systemPrompt");

  if (!apiKey || !baseUrl || !model) {
    addMessage("Missing API key, base URL, or model.", "error");
    return;
  }

  const messages = [];
  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }
  messages.push({ role: "user", content: message });

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages
      })
    });

    const data = await response.json();

    if (data.error) {
      addMessage("Error: " + data.error.message, "error");
      return;
    }

    addMessage("AI: " + data.choices[0].message.content, "ai");

  } catch (err) {
    addMessage("Network error: " + err.message, "error");
  }
}
