// ---------------------- auth.js ----------------------

if (!window.socket) {
  window.socket = io("Your Ngork URL", {
    transports: ["polling"]
  });
}
const socket = window.socket;

// ✅ Login Function
async function login() {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email || !password) {
      alert("❌ Please fill in all fields!");
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
        alert("✅ Login Successful! Redirecting...");
        window.location.href = "index.html";
      } else {
        alert("❌ Login Failed: " + (data.msg || data.errors?.[0]?.msg || "Unknown error"));
      }
    } catch (error) {
      alert("❌ Network Error: Unable to connect to server.");
      console.error("Login Error:", error);
    }
}

// ✅ Signup Function
async function signup() {
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const learnSkill = document.getElementById("learnSkill")?.value.trim();
    const teachSkill = document.getElementById("teachSkill")?.value.trim();

    if (!name || !email || !password || !learnSkill) {
      alert("❌ Please fill in all required fields!");
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
        alert("✅ Signup Successful! Please login.");
        window.location.href = "login.html";
      } else {
        alert("❌ Signup Failed: " + (data.msg || data.errors?.[0]?.msg || "Unknown error"));
      }
    } catch (error) {
      alert("❌ Network Error: Unable to connect to server.");
      console.error("Signup Error:", error);
    }
}

// ✅ Check if user is authenticated
function checkAuth() {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("⚠️ Session expired. Please log in.");
      window.location.href = "login.html";
    }
}
