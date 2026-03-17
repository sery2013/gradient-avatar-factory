# 🎨 OpenGradient Avatar Factory

**OpenGradient Avatar Factory** is a high-performance AI-powered avatar generation tool built for the OpenGradient ecosystem, leveraging the **Leonardo AI API**.

---

### 🚀 Key Features

*   **🤖 AI Generation (Text-to-Image)**
    Create unique characters from simple text descriptions. Just type your idea, and the AI brings it to life.
*   **🎭 Style Presets**
    Instant stylization using curated presets: *Cyberpunk, Anime, Steampunk, Retro 80s, Minimalist,* and more.
*   **📸 Photo-to-Avatar (Image-to-Image)**
    Upload your own photos and transform them into stylized avatars while maintaining original features.
*   **🔗 NFT Ready**
    Every generated avatar is automatically assigned a unique **NFT ID**, making it ready for Web3 identity integration.
*   **💾 Smart Download System**
    Implemented a custom server-side proxy to bypass CORS restrictions, allowing users to save high-res images directly to their devices.

---

### 🛠 Tech Stack

| Component | Technology |
| :--- | :--- |
| **Frontend** | HTML5, CSS3, Vanilla JavaScript |
| **Backend** | Node.js (Vercel Serverless Functions) |
| **AI Engine** | Leonardo AI REST API |
| **Hosting** | Vercel Platform |

---

### ⚙️ How It Works

1.  **Request:** User inputs a prompt or uploads a source photo.
2.  **Processing:** The request is sent to a Vercel Serverless Function, which communicates securely with Leonardo AI.
3.  **Polling:** The frontend checks the generation status every 3 seconds in real-time.
4.  **Result:** Once complete, the avatar is displayed with an instant download option and a generated NFT ID.

---

### 👨‍💻 Development

Developed for **OpenGradient.ai**.

*   **Developer Twitter:** [@kaye_moni](https://x.com/kaye_moni)
*   **AI Infrastructure:** Powered by Leonardo AI

---
© 2026 OpenGradient.ai | All Rights Reserved.
