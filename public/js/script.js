// ---------------------- script.js ----------------------

// Reuse the shared socket connection
if (!window.socket) {
  window.socket = io("Your Ngork URL", {
    transports: ["polling"] // polling first to avoid WebSocket issues
  });
}
const socket = window.socket;

document.addEventListener("DOMContentLoaded", () => {
  const userName = localStorage.getItem("userName") || "Guest";
  const userId = localStorage.getItem("userId");

  socket.emit("join", { userId, name: userName });
  console.log("📲 Sent join for", userId);

  // Show avatar and name in profile area
  document.getElementById("profile-name").innerText = userName;
  document.getElementById("profile-img").src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=0D8ABC&color=fff`;

  const messageInput = document.getElementById("message");
  const messagesContainer = document.getElementById("messages");
  const userList = document.getElementById("user-list");
  let selectedRecipient = "global";

  function sendMessage() {
    const message = messageInput.value.trim();
    if (!message) return;

    const messageData = {
      name: userName,
      userId,
      message,
      to: selectedRecipient,
    };

    socket.emit("chat message", messageData);
    appendMessage({ name: userName, message, private: selectedRecipient !== "global" });
    messageInput.value = "";
  }

  function appendMessage({ name, message, private: isPrivate }) {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${name}${isPrivate ? " (private)" : ""}:</strong> ${message}`;
    messagesContainer.appendChild(li);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  document.querySelector(".chat-input button")?.addEventListener("click", sendMessage);

  socket.on("chat message", (data) => {
    if (
      data.to === userName ||
      data.to === "global" ||
      data.userId === userId ||
      data.name === userName
    ) {
      appendMessage({ ...data, private: data.to !== "global" });
    }
  });

  socket.on("user list", (users) => {
    userList.innerHTML = "";
    users.forEach((user) => {
      if (user !== userName) {
        const li = document.createElement("li");
        li.textContent = user;
        li.style.cursor = "pointer";
        li.onclick = () => {
          selectedRecipient = user;
          document.getElementById("chat-label").innerText = `💬 Chatting with ${user}`;
        };
        userList.appendChild(li);
      }
    });
  });

  document.getElementById("global-chat-btn")?.addEventListener("click", () => {
    selectedRecipient = "global";
    document.getElementById("chat-label").innerText = "🌐 Global Chat";
  });

  document.getElementById("logout-btn")?.addEventListener("click", () => {
    localStorage.clear();
    socket.disconnect();
    window.location.href = "/login.html";
  });

  // WebRTC
  let localStream;
  let peerConnection;
  const config = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

  function startCall(remoteId) {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        document.getElementById("my-video").srcObject = stream;
        localStream = stream;

        peerConnection = new RTCPeerConnection(config);
        localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

        peerConnection.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit("ice-candidate", { to: remoteId, candidate: event.candidate });
          }
        };

        peerConnection.ontrack = (event) => {
          document.getElementById("remote-video").srcObject = event.streams[0];
        };

        peerConnection.createOffer()
          .then((offer) => peerConnection.setLocalDescription(offer))
          .then(() => {
            socket.emit("video-offer", { to: remoteId, offer: peerConnection.localDescription });
          })
          .catch((error) => console.error("Error creating offer:", error));
      })
      .catch((error) => console.error("Error accessing media devices:", error));
  }

  socket.on("video-offer", (data) => {
    const { from, offer } = data;

    if (confirm(`📞 Incoming call from ${from}. Accept?`)) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then((stream) => {
          document.getElementById("my-video").srcObject = stream;
          localStream = stream;

          socket.emit("call-accepted", { to: from });

          peerConnection = new RTCPeerConnection(config);
          localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

          peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
              socket.emit("ice-candidate", { to: from, candidate: event.candidate });
            }
          };

          peerConnection.ontrack = (event) => {
            document.getElementById("remote-video").srcObject = event.streams[0];
          };

          peerConnection.setRemoteDescription(new RTCSessionDescription(offer))
            .then(() => peerConnection.createAnswer())
            .then((answer) => peerConnection.setLocalDescription(answer))
            .then(() => {
              socket.emit("video-answer", { to: from, answer: peerConnection.localDescription });
            })
            .catch((error) => console.error("Error handling offer:", error));
        })
        .catch((error) => console.error("Media access error:", error));
    } else {
      socket.emit("call-rejected", { to: from });
    }
  });

  socket.on("video-answer", ({ answer }) => {
    peerConnection.setRemoteDescription(new RTCSessionDescription(answer))
      .catch((error) => console.error("Error setting remote description:", error));
  });

  socket.on("ice-candidate", ({ candidate }) => {
    if (candidate) {
      peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
        .catch((error) => console.error("Error adding ICE candidate:", error));
    }
  });

  document.querySelector(".video-buttons .danger")?.addEventListener("click", () => {
    if (peerConnection) {
      peerConnection.close();
      peerConnection = null;
    }
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      localStream = null;
    }
    document.getElementById("my-video").srcObject = null;
    document.getElementById("remote-video").srcObject = null;
  });

  document.querySelector(".video-buttons button:first-child")?.addEventListener("click", () => {
    const remotePeerId = document.getElementById("remote-peer-id").value;
    if (!remotePeerId) return alert("Please enter a remote peer ID to call.");
    startCall(remotePeerId);
  });
});
