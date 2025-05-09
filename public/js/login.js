// ---------------------- login.js ----------------------

// Reuse the shared socket connection
if (!window.socket) {
  window.socket = io("Your Ngork URL", {
    transports: ["polling"]
  });
}
const socket = window.socket;

document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!email || !password) {
    alert("❌ Please enter both email and password.");
    return;
  }

  try {
    const res = await fetch("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (res.ok) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("userId", data.userId);
      localStorage.setItem("username", data.name);
      alert("✅ Login successful! Redirecting...");
      window.location.href = "index.html";
    } else {
      alert("❌ Login failed: " + (data.msg || "Unknown error"));
    }
  } catch (err) {
    console.error("Login error:", err);
    alert("❌ Something went wrong. Please try again.");
  }
});
