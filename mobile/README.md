<div align="center">


```
 ██████╗██████╗  █████╗ ███████╗██╗  ██╗ ██████╗ ██╗   ██╗ █████╗ ██████╗ ██████╗ 
██╔════╝██╔══██╗██╔══██╗██╔════╝██║  ██║██╔════╝ ██║   ██║██╔══██╗██╔══██╗██╔══██╗
██║     ██████╔╝███████║███████╗███████║██║  ███╗██║   ██║███████║██████╔╝██║  ██║
██║     ██╔══██╗██╔══██║╚════██║██╔══██║██║   ██║██║   ██║██╔══██║██╔══██╗██║  ██║
╚██████╗██║  ██║██║  ██║███████║██║  ██║╚██████╔╝╚██████╔╝██║  ██║██║  ██║██████╔╝
 ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝ ╚═════╝  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝ 
```

### Adaptive Crash Detection & Real-Time Emergency Response System

🚨 Detect • Sync • Respond • Save Lives

</div>

---

## 🌍 Overview

CrashGuard is a real-time accident detection and emergency response platform built using **React Native (Expo)** and a **Node.js backend**.

It intelligently detects crashes using **mobile sensor data** and instantly alerts emergency contacts with **live GPS tracking**, even in **low or unstable network conditions**.

The system focuses on reducing **post-accident response time** and improving survival chances through **automated emergency communication**.

---

## 🚨 Problem Statement

- 🚗 Millions of road fatalities occur globally every year  
- 📵 Victims are often unable to call emergency services after impact  
- 📶 Many accidents occur in poor network coverage areas  
- ⏱️ Delay in response significantly increases fatality risk  

Traditional solutions rely heavily on **manual reporting and stable connectivity**, making them unreliable in critical moments.

---

## ✅ Our Solution

CrashGuard introduces an intelligent adaptive emergency response system that provides:

🔍 Automatic crash detection using real-time sensor intelligence  
📍 Real-time GPS location tracking with continuous updates  
📡 Adaptive network fallback (Online → Weak Signal → Offline Queue)  
📲 Multi-channel emergency alert notifications (Push, SMS, Call)  
🧠 AI-based false positive prevention workflow  
🔁 Offline retry mechanism for guaranteed alert delivery  

🚨 Instant emergency SMS alerts sent to **pre-registered family members / parents** with live location  
📡 Continuous **dynamic location sharing** with guardians until the victim is marked safe  
👥 Nearby **civilian responders notified** to provide immediate assistance  
🚓 Automatic alert dispatch to **nearest police authorities** with crash coordinates  
🚑 Emergency request transmitted to **nearest ambulance services** for rapid response  
📞 Automated emergency **voice call trigger** when severe crash is detected  
🗺️ Real-time rescue coordination enabled via live tracking dashboard  
⏱️ Smart escalation system if first alert is not acknowledged  

---

## ⚙️ System Workflow

1️⃣ User is driving → app runs silently in background  
2️⃣ Crash detected via accelerometer & motion patterns  
3️⃣ Countdown timer prevents false alerts  
4️⃣ GPS coordinates captured instantly  
5️⃣ Alert transmitted to backend server  
6️⃣ Emergency contacts notified with live location  
7️⃣ Continuous real-time tracking enabled  

---

## 🏗️ Architecture Deep Dive

```
crashguard/
├── 📁 backend/                   # Node.js + TypeScript
│   ├── crash-event-processor/    # Receives & validates crash events
│   ├── emergency-dispatcher/     # Routes alerts to contacts & services
│   ├── adaptive-sync-engine/     # Core sync orchestrator
│   ├── location-service/         # Real-time GPS tracking
│   ├── notification-gateway/     # Multi-channel alert delivery
│   └── api/                      # REST + WebSocket endpoints
│
└── 📁 mobile/                    # Cross-platform mobile client
    ├── crash-detector/           # Accelerometer + ML crash detection
    ├── sync-client/              # Adaptive SYNC client layer
    ├── offline-queue/            # Stores & retries alerts when offline
    ├── network-monitor/          # Tracks connectivity in real-time
    ├── location-tracker/         # Continuous GPS logging
    └── ui/                       # User interface + alert screens
```

---
## ✨ Key Features

### 📱 Mobile Application (React Native + Expo)

- Intelligent crash detection logic  
- Continuous GPS tracking system  
- Offline alert queue & retry engine  
- Real-time network monitoring  
- Emergency alert interface  
- Sensor-based motion analysis  

### 🌐 Backend System (Node.js + Express)

- Crash event API processing  
- Emergency notification routing  
- Contact & incident management  
- Real-time location handling  
- Middleware security architecture  

---

## 🛠️ Tech Stack

**Frontend**
- React Native (Expo)
- JavaScript / TypeScript

**Backend**
- Node.js
- Express.js

**System Components**
- GPS APIs  
- Sensor APIs  
- RESTful Services  

---

## 🚀 Getting Started

### Backend Setup

```bash
cd backend
npm install
node server.js

### Mobile Setup


cd mobile
npm install
npx expo start


---

## 🌍 Impact

CrashGuard aims to:

- Reduce accident response time
- Improve survival chances
- Provide automated emergency communication
- Enable smart safety infrastructure

---

## 👨‍💻 Team
- **Vishal Kumar**
- **Anshul Rana** 
- **Abhi Raj**
- **Abhijeet**  

Full Stack Developer

---

## 🔮 Future Improvements

- AI crash prediction model
- Emergency service direct integration
- Smartwatch crash detection
- Offline map support
- Cloud scaling architecture

---

## 📄 License

MIT License