const chat = document.getElementById("chat");
const apiKeyInput = document.getElementById("apiKey");
const baseUrlInput = document.getElementById("baseUrl");
const modelSelect = document.getElementById("model");

// Load saved settings
apiKeyInput.value = localStorage.getItem("apiKey") || "";
baseUrlInput.value = localStorage.getItem("baseUrl") || "";
modelSelect.value = localStorage.getItem("model") || "gpt-4o-mini";

function saveSettings() {
  localStorage.setItem("apiKey", apiKeyInput.value);
  localStorage.setItem("baseUrl", baseUrlInput.value);
  localStorage.setItem("model", modelSelect.value);
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

  if (!apiKey || !baseUrl) {
    addMessage("Missing API key or Base URL", "error");
    return;
  }

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: "user", content: message }
        ]
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
