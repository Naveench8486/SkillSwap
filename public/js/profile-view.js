// ---------------------- profile-view.js ----------------------

if (!window.socket) {
  window.socket = io("Your Ngork URL", { transports: ["polling"] });
}
const socket = window.socket;

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const userId = params.get("userId");

  const myId = localStorage.getItem("userId");
  const myName = localStorage.getItem("username");

  socket.emit("join", { userId: myId, name: myName });

  socket.on("incoming-call", ({ from, name, offer }) => {
    console.log(`📞 Incoming call from ${name}`);
    const accept = confirm(`📞 ${name} is calling. Accept?`);

    if (accept) {
      sessionStorage.setItem("incoming-offer", JSON.stringify(offer));
      sessionStorage.setItem("from-user", from);
      window.location.href = `video.html?target=${from}`;
    } else {
      socket.emit("call-rejected", { to: from });
      alert("❌ Call rejected");
    }
  });

  try {
    const res = await fetch(`/api/user/${userId}`);
    const user = await res.json();

    document.getElementById("user-name").textContent = user.name;
    document.getElementById("user-email").textContent = user.email;
    document.getElementById("user-skills").textContent = user.skills?.join(", ") || "N/A";

    const certList = document.getElementById("user-certs");
    certList.innerHTML = "";
    (user.certifications || []).forEach(cert => {
      const li = document.createElement("li");
      li.innerHTML = `<a href="/uploads/${cert}" target="_blank">${cert}</a>`;
      certList.appendChild(li);
    });

    document.getElementById("chat-btn")?.addEventListener("click", () => {
      window.location.href = `chat.html?userId=${userId}`;
    });

    document.getElementById("video-btn")?.addEventListener("click", () => {
      window.location.href = `video.html?target=${userId}`;
    });

    document.getElementById("user-img").src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
      user.name
    )}&background=0D8ABC&color=fff`;
  } catch (err) {
    console.error("❌ Error loading profile:", err);
    alert("❌ Failed to load profile");
  }
});
