// ---------------------- profile.js ----------------------
document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  if (!token) return window.location.href = "login.html";

  const profileForm = document.getElementById("profile-form");
  const nameInput = document.getElementById("name");
  const ageInput = document.getElementById("age");
  const emailInput = document.getElementById("email");
  const skillsInput = document.getElementById("skills");
  const certificationsList = document.getElementById("certifications-list");
  const fileInput = document.getElementById("certification-file");

  async function loadProfile() {
    try {
      const res = await fetch("/api/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg);

      nameInput.value = data.name || "";
      ageInput.value = data.age || "";
      emailInput.value = data.email || "";
      skillsInput.value = Array.isArray(data.skills) ? data.skills.join(", ") : data.skills;

      certificationsList.innerHTML = "";
      (data.certifications || []).forEach(cert => {
        const li = document.createElement("li");
        li.innerHTML = `<a href="/uploads/${cert}" target="_blank">${cert}</a>`;
        certificationsList.appendChild(li);
      });
    } catch (err) {
      console.error("❌ Failed to load profile:", err);
      alert("⚠️ Could not load profile.");
    }
  }

  profileForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const updatedData = {
      name: nameInput.value.trim(),
      age: ageInput.value.trim(),
      email: emailInput.value.trim(),
      skills: skillsInput.value.split(",").map(s => s.trim()).filter(Boolean),
    };
    if (!updatedData.name || !updatedData.email) return alert("Name and Email are required.");

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedData),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.msg);
      alert("✅ Profile updated!");
    } catch (err) {
      console.error("❌ Update error:", err);
      alert("❌ Failed to update profile.");
    }
  });

  fileInput.addEventListener("change", async () => {
    const file = fileInput.files[0];
    if (!file) return alert("Please choose a file.");
    const formData = new FormData();
    formData.append("certification", file);
    try {
      const res = await fetch("/api/upload-certification", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.msg);
      const li = document.createElement("li");
      li.innerHTML = `<a href="/uploads/${result.filename}" target="_blank">${result.filename}</a>`;
      certificationsList.appendChild(li);
      fileInput.value = "";
      alert("✅ Certification uploaded!");
    } catch (err) {
      console.error("❌ Upload error:", err);
      alert("❌ Failed to upload certification.");
    }
  });

  loadProfile();
});
