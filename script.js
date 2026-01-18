const chatDiv = document.getElementById("chat");
const apiKeyInput = document.getElementById("apiKey");
const baseUrlInput = document.getElementById("baseUrl");

// Load saved settings
apiKeyInput.value = localStorage.getItem("apiKey") || "";
baseUrlInput.value = localStorage.getItem("baseUrl") || "";

function saveSettings() {
  localStorage.setItem("apiKey", apiKeyInput.value);
  localStorage.setItem("baseUrl", baseUrlInput.value);
  alert("Saved locally on your PC");
}

async function sendMessage() {
  const message = document.getElementById("userInput").value;
  document.getElementById("userInput").value = "";

  addMessage("You", message);

  const apiKey = localStorage.getItem("apiKey");
  const baseUrl = localStorage.getItem("baseUrl");

  if (!apiKey || !baseUrl) {
    addMessage("Error", "API key or Base URL missing.");
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
        model: "gpt-4o-mini",
        messages: [
          { role: "user", content: message }
        ]
      })
    });

    const data = await response.json();
    addMessage("AI", data.choices[0].message.content);
  } catch (err) {
    addMessage("Error", err.message);
  }
}

function addMessage(sender, text) {
  const div = document.createElement("div");
  div.innerHTML = `<strong>${sender}:</strong> ${text}`;
  chatDiv.appendChild(div);
  chatDiv.scrollTop = chatDiv.scrollHeight;
}
