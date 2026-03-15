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

## 📌 Overview

CrashGuard is a real-time accident detection and emergency response platform built using **React Native (Expo)** and **Node.js backend**.

The system automatically detects crashes using mobile sensor intelligence and instantly alerts emergency contacts with live location data.

It is designed to work even in **low or unstable network conditions** using adaptive synchronization strategies.

---

## 🚨 Problem Statement

- Road accidents cause millions of deaths globally every year  
- Victims often cannot call emergency services after impact  
- Many accidents occur in low-network areas  
- Delay in response increases fatality risk  

---

## ✅ Solution

CrashGuard provides:

- Automatic crash detection via motion sensors
- Real-time GPS tracking
- Emergency alert notification system
- Offline alert retry mechanism
- Adaptive network communication strategy
- False positive prevention workflow

---

## ⚙️ System Workflow

1. User is driving → app runs in background  
2. Crash detected via accelerometer pattern  
3. Countdown timer to cancel false alert  
4. GPS coordinates captured  
5. Alert sent to backend server  
6. Emergency contacts notified  
7. Live tracking enabled for rescue

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

## 🧠 Key Features

### 📱 Mobile App (React Native + Expo)

- Crash detection logic
- GPS location tracking
- Offline queue system
- Network monitoring
- Emergency alert UI
- Sensor data processing

### 🌐 Backend (Node.js + Express)

- Crash event API handling
- Emergency notification logic
- Contact management
- Location processing
- Middleware security layer

---

## 🛠️ Tech Stack

Frontend:
- React Native (Expo)
- JavaScript / TypeScript

Backend:
- Node.js
- Express.js

Other:
- GPS APIs
- Sensor APIs
- REST APIs

---

## 🚀 Getting Started

### Backend Setup


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