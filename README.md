"# SkillSwap" 

SkillSwap is a full-stack web application where users can connect, chat, and share their skills via global chat, private messaging, and video calls — including file sharing and screen sharing features.

---

##  Features

-  **Authentication** – Sign up / login using JWT tokens
-  **User Profiles** – View and edit skills, certifications, and personal info
-  **Global Chat** – Real-time public chat with all online users
-  **Private Chat** – One-on-one messaging with file sharing
-  **Video Call** – Peer-to-peer video calling using WebRTC (PeerJS-style)
-  **Screen Sharing** – Easily toggle screen sharing in a call
-  **Call Notifications** – Accept or reject incoming video calls
-  **Dark Mode** – Stylish UI with mobile responsiveness

---

##  Tech Stack

- **Frontend:** HTML, CSS, JavaScript , Bootstrap, FontAwesome
- **Backend:** Node.js, Express.js
- **Database:** MongoDB with Mongoose
- **Real-Time:** Socket.IO
- **Video Calls:** WebRTC (native) + custom signaling
- **File Uploads:** Multer (for certifications)
- **Authentication:** JSON Web Tokens (JWT)

---

##  Project Structure
```
SkillSwap/
├── public/
│ ├── css/
│ ├── js/
│ ├── uploads/
│ ├── index.html
│ ├── login.html
│ ├── signup.html
│ ├── profile.html
│ ├── profile-view.html
│ ├── globalchat.html
│ ├── chat.html
│ └── video.html
├── models/
│ └── User.js
├── server.js
├── .env
├── package.json
└── README.md
```

##  Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/SkillSwap.git
cd SkillSwap
```

### 2. Install Dependencies

```bash
npm install
```
### 3. Configure Environment
Create a .env file in the root
```bash
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```
### 4. Start the Server

```bash
node server.js
```

Visit http://localhost:5000 in your browser.

### ngrok for Tunnel 

Install and run ngrok to expose your localhost to the internet
```bash
ngrok http 5000
```
Use the generated https://xxxxx.ngrok-free.app URL in:
```this files
auth.js
chat.js
globalchat.js
login.js
profile-view.js
script.js
video.js
signup.js
```

### How It Works
- On login, users get a JWT and are identified by userId
- Users can chat globally or privately using Socket.IO
- Clicking "Start Video Call" sends a call request via socket
- Receiver sees "Accept/Reject" confirmation
- If accepted, both peers connect via WebRTC and exchange media
- ICE candidates are handled manually between peers
- Users can toggle screen sharing mid-call

### Future Improvements
- Custom modal for call acceptance (instead of confirm)
- Chat message persistence (currently in-memory only)
- Push notifications for calls
- Group calls and chat rooms

Built by Naveen
---
GitHub: @Naveench8486
