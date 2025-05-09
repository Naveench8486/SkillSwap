// ---------------------- signup.js ----------------------

// No socket logic needed here, but we will ensure it's in the shared socket pattern

// Just in case, we initialize a shared socket instance
if (!window.socket) {
  window.socket = io("Your Ngork URL", {
    transports: ["polling"] // polling first to avoid WebSocket issues
  });
}
const socket = window.socket;

document.getElementById("signup-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const learnSkill = document.getElementById("learnSkill").value.trim();
  const teachSkill = document.getElementById("teachSkill").value.trim();

  if (!name || !email || !password || !learnSkill) {
    alert("❌ Please fill out all required fields.");
    return;
  }

  try {
    const res = await fetch("/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, learnSkill, teachSkill })
    });

    const data = await res.json();

    if (res.ok) {
      alert("✅ Signup successful! Please login.");
      window.location.href = "login.html";
    } else {
      alert("❌ Signup failed: " + (data.msg || data.errors?.[0]?.msg || "Unknown error"));
    }
  } catch (err) {
    console.error("Signup error:", err);
    alert("❌ Something went wrong. Please check your connection.");
  }
});
