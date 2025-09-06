export function sendAIMessage() {
    const input = document.getElementById("aiInput");
    const box = document.getElementById("aiChatBox");
    if (!input.value.trim()) return;
    box.innerHTML += `<p><b>Anda:</b> ${input.value}</p>`;
    setTimeout(() => {
      box.innerHTML += `<p><b>AI Asisten:</b> Saya akan bantu jawab: "${input.value}"</p>`;
      box.scrollTop = box.scrollHeight;
    }, 1000);
    input.value = "";
  }
  window.sendAIMessage = sendAIMessage;
  