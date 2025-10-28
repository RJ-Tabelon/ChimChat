const socket = io('https://hypnotisable-cleta-intimiste.ngrok-free.dev');

const messageInput = document.getElementById('message-input');
const nameInput = document.getElementById('name-input');
const sendBtn = document.getElementById('send-btn');
const chatDisplay = document.getElementById('chat-display');

let toxicityModel = null;
const TOXICITY_THRESHOLD = 0.9;

async function loadToxicityModel() {
  try {
    console.log('Loading toxicity model...');
    toxicityModel = await toxicity.load(TOXICITY_THRESHOLD);
    console.log('Toxicity model loaded successfully');
  } catch (error) {
    console.error('Error loading toxicity model:', error);
  }
}

async function checkToxicity(text) {
  if (!toxicityModel) {
    console.warn('Toxicity model not loaded yet');
    return { isToxic: false, filteredText: text };
  }

  try {
    const predictions = await toxicityModel.classify([text]);

    let isToxic = false;
    for (const prediction of predictions) {
      if (prediction.results[0].match) {
        isToxic = true;
        console.log(`Toxic content detected: ${prediction.label}`);
        break;
      }
    }

    const filteredText = isToxic ? '*****' : text;

    return { isToxic, filteredText };
  } catch (error) {
    console.error('Error checking toxicity:', error);
    return { isToxic: false, filteredText: text };
  }
}

const savedName = localStorage.getItem('chimchat:name');
if (savedName) nameInput.value = savedName;

loadToxicityModel();

nameInput.addEventListener('input', () => {
  localStorage.setItem('chimchat:name', nameInput.value.trim());
  updateSendEnabled();
});

function updateSendEnabled() {
  const name = nameInput.value.trim();
  const message = messageInput.value.trim();
  sendBtn.disabled = !(name && message);
}

async function sendMessage() {
  const name = nameInput.value.trim();
  const message = messageInput.value.trim();
  if (!name || !message) return;

  sendBtn.disabled = true;

  try {
    const { isToxic, filteredText } = await checkToxicity(message);

    if (isToxic) {
      console.log('Toxic content detected and filtered');
    }

    socket.emit('chatMessage', { name, message: filteredText });
    messageInput.value = '';
  } catch (error) {
    console.error('Error sending message:', error);
  } finally {
    updateSendEnabled();
  }
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
