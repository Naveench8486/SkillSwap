// ---------------------- chat.js ----------------------

// Create or reuse socket connection
if (!window.socket) {
  window.socket = io("Your Ngork URL", {
    transports: ["polling"]
  });
}
const socket = window.socket;

const receiverId = new URLSearchParams(window.location.search).get("userId");
const senderId = localStorage.getItem("userId");
const senderName = localStorage.getItem("username");

if (!receiverId || !senderId || !senderName) {
  alert("❌ Missing user info. Please login again.");
  window.location.href = "login.html";
}

socket.emit("join", { userId: senderId, name: senderName });

socket.on("connect", () => {
  console.log("✅ Connected to private chat socket");
});

// Receive a private message
socket.on("privateMessage", (data) => {
  const li = document.createElement("li");
  li.innerHTML = `<strong>${data.from}:</strong> ${data.content}`;
  document.getElementById("messages").appendChild(li);
  scrollMessagesToBottom();
});

// Send a message
document.getElementById("send-btn").onclick = () => {
  const msg = document.getElementById("message").value.trim();
  if (!msg) return;

  const messageData = {
    to: receiverId,
    from: senderName,
    fromId: senderId,
    type: "text",
    content: msg
  };

  socket.emit("privateMessage", messageData);

  const li = document.createElement("li");
  li.innerHTML = `<strong>You:</strong> ${msg}`;
  document.getElementById("messages").appendChild(li);
  document.getElementById("message").value = "";
  scrollMessagesToBottom();
};

function scrollMessagesToBottom() {
  const messagesContainer = document.getElementById("messages");
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}
