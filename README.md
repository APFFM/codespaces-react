# 🎓 Mini Teacher AI — React + OpenAI (BYOK)

A minimalist AI-powered **teaching assistant** built with React + Vite. Connects to OpenAI’s GPT-3.5+ with your own API key to provide real-time tutoring, Q&A, and study help. Fast, portable, and GitHub Codespaces-ready.

[🚀 Live Demo](https://apffm.github.io/codespaces-react/)

---

## ✨ Features
- 🧠 **Chat with OpenAI GPT** (BYOK — bring your own key)
- 💬 **Multi-chat tabs** with save/load/delete
- 🔄 **Streaming responses** with auto-scroll
- 🌙 **Dark/light mode toggle**
- 📊 **Token usage display** per chat
- 📁 **Export chats** as text
- 💾 **Local storage** persistence
- ⚡ **Vite + Tailwind CSS**
- 🧑‍💻 Ready for **GitHub Codespaces**

---

## 🛠 Getting Started

```bash
# 1. Clone & install
npm install

# 2. Run the app
npm run dev
# Visit: http://localhost:5173
```

---

## 🔑 API Key (BYOK)
Input your OpenAI API key on first use. It’s stored **locally in-browser** (never sent elsewhere).

---

## 📦 Deployment

```bash
npm run build
```

Deploy via GitHub Pages or any static host. See `vite.config.js` for base path settings.

---

## 📄 License
MIT
