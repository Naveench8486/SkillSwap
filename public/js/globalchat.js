// ---------------------- globalchat.js ----------------------

// Create or reuse single shared socket connection
if (!window.socket) {
  window.socket = io("Your Ngork URL", {
    transports: ["polling"]
  });
}
const socket = window.socket;

document.addEventListener("DOMContentLoaded", () => {
  const userName = localStorage.getItem("username");
  const userId = localStorage.getItem("userId");

  if (!userName || !userId) {
    alert("⚠️ Session expired. Please log in again.");
    return window.location.href = "login.html";
  }

  document.getElementById("profile-name").innerText = userName;
  document.getElementById("profile-img").src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=0D8ABC&color=fff`;

  const messageInput = document.getElementById("message");
  const messagesContainer = document.getElementById("messages");
  const userList = document.getElementById("user-list");
  let selectedRecipient = "global";

  // 🔥 Join the socket
  socket.emit("join", { name: userName, userId });

  socket.on("connect", () => {
    console.log("✅ Socket connected with ID:", socket.id);
  });

  console.log("🔗 Joined global chat:", { name: userName, userId });

  // Send message button
  document.querySelector(".chat-input button")?.addEventListener("click", () => {
    const message = messageInput.value.trim();
    if (!message) return;

    const messageData = {
      name: userName,
      message,
      to: selectedRecipient,
    };

    socket.emit("chat message", messageData);
    messageInput.value = "";
  });

  // Handle received chat messages (global or private)
  socket.on("chat message", (data) => {
    // Display messages addressed to me (by ID) or to global, or if I am the sender
    if (data.to === userId || data.to === "global" || data.name === userName) {
      appendMessage({ ...data, private: data.to !== "global" });
    }
  });

  function appendMessage({ name, message, private: isPrivate }) {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${name}${isPrivate ? " (private)" : ""}:</strong> ${message}`;
    messagesContainer.appendChild(li);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // Populate the active user list
  socket.on("user list", (users) => {
    userList.innerHTML = "";
    users.forEach(({ name, userId: id }) => {
      if (id !== userId) {
        const li = document.createElement("li");
        li.innerHTML = `<span class="username">${name}</span>`;
        li.style.cursor = "pointer";
        // Clicking a user goes to their profile page
        li.onclick = () => {
          window.location.href = `profile-view.html?userId=${id}`;
        };
        userList.appendChild(li);
      }
    });
  });

  // Switch back to global chat
  document.getElementById("global-chat-btn")?.addEventListener("click", () => {
    selectedRecipient = "global";
    document.getElementById("chat-label").innerText = "🌐 Global Chat";
  });

  // Logout clears session
  document.getElementById("logout-btn")?.addEventListener("click", () => {
    localStorage.clear();
    socket.disconnect();
    window.location.href = "/login.html";
  });

  // 📞 Handle incoming call (no prompt – immediately join video call)
  socket.on("incoming-call", ({ from, name, offer }) => {
    console.log(`📞 Incoming call from ${name}`);

    // Save offer in sessionStorage and redirect to video page
    sessionStorage.setItem("incoming-offer", JSON.stringify(offer));
    sessionStorage.setItem("from-user", from);
    window.location.href = `video.html?target=${from}`;
  });
});
