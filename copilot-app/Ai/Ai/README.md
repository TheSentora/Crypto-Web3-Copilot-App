# Nexline Copilot

Nexline Copilot is a Next.js + Node.js application that provides an AI-powered Web3 assistant.  
It connects to the OpenAI backend API and allows users to interact with the AI from a browser.  
The app is served under the **/copilot** path (both locally and on your domain), not at the root.

---

## 🚨 Disclaimer
This project is **not affiliated with Sentora or SentoraLabs** in any way.  
It is an independent project under TheBlockchainCoders.

---

## 🚀 Features
- Next.js frontend (React + Tailwind)
- API proxy endpoint (/api/claude)
- Wallet integration ready
- Served under /copilot (e.g., http://localhost:3000/copilot and https://yourdomain.com/copilot)
- Easy deployment with PM2 + NGINX

---

## 📦 Installation

Clone the repo:
    
    git clone https://github.com/TheSentora/copilot-app
    cd copilot-app/ai/ai

Install dependencies:
    
    npm install

---

## 🌸 Environment Variables

Replace your api key in .env with your real api key from OpenAI

    OPENAI_API_KEY=your_api_key_here

---

## 🖥️ Development

Run the app locally:
    
    npm run dev

The app will be available at:
    
    http://localhost:3000/copilot

---

## 🚀 Production

Build the project:
    
    npm run build
    npm start

Run with PM2 (recommended):
    
    pm2 start npm --name "copilot" -- start

When deployed, the app will be accessible at:
    
    https://yourdomain.com/copilot

---

## 📂 Project Structure

    copilot-app/
    ├── pages/          # Next.js pages
    ├── public/         # Static files
    ├── styles/         # Tailwind CSS
    ├── .env            # Environment variables (use placeholders)
    ├── package.json    # Dependencies and scripts

---

## 📜 License
MIT License © 2025 Nexline

github.com/TheSentora
