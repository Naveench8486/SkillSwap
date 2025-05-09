// ---------------------- video.js ----------------------

if (!window.socket) {
  window.socket = io("Your Ngork URL", {
    transports: ["polling"]
  });
}
const socket = window.socket;

const myVideo = document.getElementById("my-video");
const remoteVideo = document.getElementById("remote-video");
const callStatus = document.getElementById("call-status");
const streamStatus = document.getElementById("stream-status");
const screenShareBtn = document.getElementById("share-screen-btn");

let localStream = null;
let remoteStream = null;
let peerConnection = null;
let isScreenSharing = false;

const configuration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

const userId = localStorage.getItem("userId");
const username = localStorage.getItem("username");

const urlParams = new URLSearchParams(window.location.search);
const targetId = urlParams.get("target");

socket.emit("join", { userId, name: username });

const incomingOffer = sessionStorage.getItem("incoming-offer");
const fromUserId = sessionStorage.getItem("from-user");

// 🔧 Setup peer connection first
createPeerConnection();

if (incomingOffer && fromUserId) {
  startAnsweringCall(fromUserId, JSON.parse(incomingOffer));
  sessionStorage.removeItem("incoming-offer");
  sessionStorage.removeItem("from-user");
} else {
  startCalling(targetId);
}

// 📞 Caller: Start call and send offer
async function startCalling(targetId) {
  try {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    myVideo.srcObject = localStream;
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    socket.emit("call-user", {
      from: userId,
      to: targetId,
      name: username,
      offer
    });

    setCallStatus("📡 Calling...");
    setStreamStatus("🔴 Camera Active");
  } catch (err) {
    console.error("Error starting call:", err);
  }
}

// 📞 Callee: Answer call and send back answer
async function startAnsweringCall(from, offer) {
  try {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    myVideo.srcObject = localStream;
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    socket.emit("send-answer", { to: from, answer });

    setCallStatus("✅ Connected");
    setStreamStatus("🔴 Camera Active");
  } catch (err) {
    console.error("Error answering call:", err);
  }
}

// 📡 Caller: Receive answer
socket.on("receive-answer", async ({ answer }) => {
  if (peerConnection) {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    setCallStatus("✅ Connected");
  }
});

// 🔄 ICE candidate exchange
socket.on("ice-candidate", ({ candidate }) => {
  if (candidate) {
    peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
      .then(() => console.log("✅ ICE candidate added"))
      .catch(err => console.error("❌ ICE error:", err));
  }
});

function createPeerConnection() {
  peerConnection = new RTCPeerConnection(configuration);

  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit("ice-candidate", { to: targetId, candidate: event.candidate });
    }
  };

  peerConnection.ontrack = (event) => {
    console.log("✅ Received remote track");
    if (!remoteStream) {
      remoteStream = new MediaStream();
      remoteVideo.srcObject = remoteStream;
    }
    remoteStream.addTrack(event.track);
  };
}

// 🔴 End Call
function endCall() {
  if (peerConnection) peerConnection.close();
  if (localStream) localStream.getTracks().forEach(track => track.stop());

  myVideo.srcObject = null;
  remoteVideo.srcObject = null;

  socket.emit("end-call", { to: targetId });
  setCallStatus("🔴 Call ended");
  setStreamStatus("🔘 Inactive");
}

socket.on("end-call", () => {
  console.log("🔔 Other user ended the call");
  if (peerConnection) peerConnection.close();
  if (localStream) localStream.getTracks().forEach(track => track.stop());

  myVideo.srcObject = null;
  remoteVideo.srcObject = null;

  setCallStatus("🔴 Call ended by other user");
  setStreamStatus("🔘 Inactive");
});

// 📺 Toggle Screen Share
async function toggleScreenShare() {
  try {
    const sender = peerConnection.getSenders().find(s => s.track.kind === 'video');

    if (!isScreenSharing) {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const screenTrack = screenStream.getVideoTracks()[0];
      sender.replaceTrack(screenTrack);
      isScreenSharing = true;
      screenTrack.onended = () => toggleScreenShare();
      screenShareBtn.textContent = "🎥 Back to Camera";
    } else {
      const camStream = await navigator.mediaDevices.getUserMedia({ video: true });
      const camTrack = camStream.getVideoTracks()[0];
      sender.replaceTrack(camTrack);
      isScreenSharing = false;
      screenShareBtn.textContent = "📺 Share Screen";
    }
  } catch (err) {
    console.error("❌ Screen share error:", err);
  }
}

// UI helpers
function setCallStatus(text) {
  if (callStatus) callStatus.textContent = text;
}
function setStreamStatus(text) {
  if (streamStatus) streamStatus.textContent = text;
}

screenShareBtn?.addEventListener("click", toggleScreenShare);
window.endCall = endCall;
