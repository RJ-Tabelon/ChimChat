const socket = io('https://hypnotisable-cleta-intimiste.ngrok-free.dev');

const messageInput = document.getElementById('message-input');
const nameInput = document.getElementById('name-input');
const sendBtn = document.getElementById('send-btn');
const chatDisplay = document.getElementById('chat-display');

const savedName = localStorage.getItem('chimchat:name');
if (savedName) nameInput.value = savedName;

nameInput.addEventListener('input', () => {
  localStorage.setItem('chimchat:name', nameInput.value.trim());
  updateSendEnabled();
});

function updateSendEnabled() {
  const name = nameInput.value.trim();
  const message = messageInput.value.trim();
  sendBtn.disabled = !(name && message);
}

function sendMessage() {
  const name = nameInput.value.trim();
  const message = messageInput.value.trim();
  if (!name || !message) return;
  socket.emit('chatMessage', { name, message });
  messageInput.value = '';
  updateSendEnabled();
}

sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});
messageInput.addEventListener('input', updateSendEnabled);

window.addEventListener('load', () => {
  messageInput.focus();
  updateSendEnabled();
});

function appendMessage(data, isSelf = false) {
  const wrapper = document.createElement('div');
  wrapper.className = 'message ' + (isSelf ? 'self' : 'other');

  const nameEl = document.createElement('div');
  nameEl.className = 'message-name';
  nameEl.textContent = data.name;

  const textEl = document.createElement('div');
  textEl.className = 'message-text';
  textEl.textContent = data.message;

  wrapper.appendChild(nameEl);
  wrapper.appendChild(textEl);
  chatDisplay.appendChild(wrapper);

  chatDisplay.scrollTop = chatDisplay.scrollHeight;
}

socket.on('chatMessage', data => {
  const isSelf = nameInput.value.trim() && data.name === nameInput.value.trim();
  appendMessage(data, isSelf);
});