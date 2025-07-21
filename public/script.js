document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const joinModal = document.getElementById('joinModal');
  const joinForm = document.getElementById('joinForm');
  const messageForm = document.getElementById('messageForm');
  const messageInput = document.getElementById('messageInput');
  const messagesContainer = document.getElementById('messages');
  const userList = document.getElementById('userList');
  const typingIndicator = document.getElementById('typingIndicator');

  // Connect to Socket.IO server
  const socket = io('http://localhost:5000');

  // Variables to track typing state
  let isTyping = false;
  let typingTimeout;

  // Join chat
  joinForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const avatar = document.getElementById('avatar').value;
    
    if (username) {
      socket.emit('join', { username, avatar });
      joinModal.style.display = 'none';
    }
  });

  // Send message
  messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const message = messageInput.value.trim();
    
    if (message) {
      socket.emit('sendMessage', message);
      messageInput.value = '';
    }
  });

  // Typing indicator
  messageInput.addEventListener('input', () => {
    if (!isTyping) {
      isTyping = true;
      socket.emit('typing');
    }
    
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      isTyping = false;
      socket.emit('stopTyping');
    }, 2000);
  });

  // Handle incoming messages
  socket.on('message', (data) => {
    const messageElement = document.createElement('div');
    messageElement.className = 'message-enter flex items-start gap-3';
    
    messageElement.innerHTML = `
      <div class="flex-shrink-0">
        <div class="bg-gray-600 rounded-full w-10 h-10 flex items-center justify-center text-xl">
          ${data.avatar}
        </div>
      </div>
      <div class="flex-1">
        <div class="flex items-center gap-2">
          <span class="font-semibold text-purple-300">${data.username}</span>
          <span class="text-xs text-gray-400">${new Date(data.timestamp).toLocaleTimeString()}</span>
        </div>
        <div class="bg-gray-600 rounded-lg p-3 mt-1 inline-block max-w-xs lg:max-w-md">
          ${data.text}
        </div>
      </div>
    `;
    
    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  });

  // Handle user joining
  socket.on('userJoined', (data) => {
    const notification = document.createElement('div');
    notification.className = 'text-center text-sm text-gray-400 my-2';
    notification.textContent = `${data.username} joined the chat`;
    messagesContainer.appendChild(notification);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  });

  // Handle user leaving
  socket.on('userLeft', (username) => {
    const notification = document.createElement('div');
    notification.className = 'text-center text-sm text-gray-400 my-2';
    notification.textContent = `${username} left the chat`;
    messagesContainer.appendChild(notification);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  });

  // Update user list
  socket.on('updateUsers', (users) => {
    userList.innerHTML = '';
    Object.values(users).forEach(user => {
      const userElement = document.createElement('li');
      userElement.className = 'flex items-center gap-2 p-2 hover:bg-gray-700 rounded-lg transition-colors';
      userElement.innerHTML = `
        <span class="text-xl">${user.avatar}</span>
        <span>${user.username}</span>
      `;
      userList.appendChild(userElement);
    });
  });

  // Handle typing indicator
  socket.on('userTyping', (username) => {
    typingIndicator.textContent = `${username} is typing...`;
    typingIndicator.classList.add('typing-indicator');
  });

  socket.on('stopTyping', () => {
    typingIndicator.textContent = '';
    typingIndicator.classList.remove('typing-indicator');
  });
});