# 🤖 Intelligent Virtual Assistant

<div align="center">
  <img src="https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/Node.js-18.0-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/MongoDB-6.0-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/AI-Groq_API-FF6B6B?style=for-the-badge&logo=openai&logoColor=white" alt="AI" />
  <img src="https://img.shields.io/badge/Voice-Recognition-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Voice" />
</div>

<div align="center">
  <h3>🎤 Voice-Powered • 🧠 AI-Driven • 🌐 Multi-Language • 📱 Cross-Platform</h3>
  <p><em>An intelligent Virtual Assistant built with MERN stack that understands voice commands, processes natural language, and performs various tasks seamlessly.</em></p>
</div>

---

## 📋 Table of Contents
- [🎯 Overview](#-overview)
- [✨ Features](#-features)
- [🏗️ Architecture](#️-architecture)
- [🛠️ Tech Stack](#️-tech-stack)
- [🚀 Quick Start](#-quick-start)
- [📁 Project Structure](#-project-structure)
- [🎤 Voice Commands](#-voice-commands)
- [🔧 Configuration](#-configuration)
- [📸 Screenshots](#-screenshots)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

## 🎯 Overview

The **Intelligent Virtual Assistant** is a full-stack web application that enables users to interact through voice commands and text input. Built with the MERN stack and powered by advanced AI, it supports multiple languages (English, Hindi, Marathi) and integrates with various web services to perform tasks like web searches, media playback, system commands, and more.

### 🌟 Key Highlights
- **🎤 Advanced Voice Recognition** - Multi-language speech recognition with wake word detection
- **🤖 AI-Powered Responses** - Natural language processing using Groq API (Llama 3.1)
- **🔊 Text-to-Speech** - Browser-based TTS with language-appropriate voices
- **🌍 Multi-Language Support** - Seamless English, Hindi, and Marathi support
- **📱 WhatsApp Integration** - Message monitoring and sending capabilities
- **📷 Visual Search** - Camera-based image analysis using Google Vision API
- **💾 Conversation Memory** - Persistent chat history with context awareness
- **🎨 Customizable Interface** - Custom assistant name, avatar, and voice selection

## ✨ Features

<table>
<tr>
<td width="50%">

### 🎤 Voice & Speech
- **Multi-language Recognition** (English, Hindi, Marathi)
- **Wake Word Detection** (Custom assistant name)
- **Sleep/Wake Functionality**
- **Confidence-based Filtering**
- **Feedback Loop Prevention**
- **Browser TTS Integration**

### 🤖 AI & Intelligence
- **Natural Language Processing** (Groq API)
- **Context-Aware Conversations**
- **Command Classification**
- **Personality-based Responses**
- **Memory System**
- **Multi-language AI Responses**

</td>
<td width="50%">

### 🌐 Web Integration
- **Google Search** automation
- **YouTube** video playback
- **Website Navigation**
- **Calculator** access
- **Screenshot** capture
- **Camera Control**

### 📱 Communication
- **WhatsApp** message monitoring
- **Contact Management**
- **Message Sending**
- **Call Initiation**
- **Notification Alerts**
- **Real-time Updates**

</td>
</tr>
</table>

## 🏗️ Architecture

```mermaid
graph TB
    subgraph "Frontend Layer"
        A[React.js 19] --> B[Voice Recognition]
        A --> C[Text-to-Speech]
        A --> D[Camera Interface]
        A --> E[Chat Interface]
    end
    
    subgraph "API Layer"
        F[Express.js Server] --> G[Authentication]
        F --> H[User Controller]
        F --> I[Voice Controller]
        F --> J[Windows Integration]
    end
    
    subgraph "AI & Services"
        K[Groq API] --> L[Natural Language Processing]
        M[Google Vision API] --> N[Image Analysis]
        O[Cloudinary] --> P[Media Storage]
        Q[ElevenLabs] --> R[Voice Synthesis]
    end
    
    subgraph "Database Layer"
        S[MongoDB Atlas] --> T[User Data]
        S --> U[Conversation History]
        S --> V[Contact Information]
    end
    
    A --> F
    F --> K
    F --> M
    F --> O
    F --> Q
    F --> S
    
    style A fill:#61DAFB,stroke:#333,stroke-width:2px,color:#000
    style F fill:#339933,stroke:#333,stroke-width:2px,color:#fff
    style K fill:#FF6B6B,stroke:#333,stroke-width:2px,color:#fff
    style S fill:#47A248,stroke:#333,stroke-width:2px,color:#fff
```

### 🔄 Data Flow Architecture

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant AI as Groq AI
    participant DB as Database
    
    U->>F: Voice Command / Text Input
    F->>F: Speech Recognition
    F->>B: Send Command
    B->>DB: Fetch User Context
    DB-->>B: Return History & Preferences
    B->>AI: Process with Context
    AI-->>B: Structured Response
    B->>DB: Save Conversation
    B-->>F: Response + Actions
    F->>F: Text-to-Speech
    F->>F: Execute Actions
    F-->>U: Audio + Visual Response
```

## 🛠️ Tech Stack

<div align="center">

### Frontend
| Technology | Version | Purpose |
|------------|---------|----------|
| ![React](https://img.shields.io/badge/React-19.0-61DAFB?style=flat-square&logo=react) | 19.0 | UI Framework |
| ![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?style=flat-square&logo=vite) | 5.0 | Build Tool |
| ![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-06B6D4?style=flat-square&logo=tailwindcss) | 3.4 | Styling |
| ![Axios](https://img.shields.io/badge/Axios-1.11-5A29E4?style=flat-square&logo=axios) | 1.11 | HTTP Client |

### Backend
| Technology | Version | Purpose |
|------------|---------|----------|
| ![Node.js](https://img.shields.io/badge/Node.js-18.0-339933?style=flat-square&logo=node.js) | 18.0 | Runtime |
| ![Express](https://img.shields.io/badge/Express-5.1-000000?style=flat-square&logo=express) | 5.1 | Web Framework |
| ![MongoDB](https://img.shields.io/badge/MongoDB-8.16-47A248?style=flat-square&logo=mongodb) | 8.16 | Database |
| ![JWT](https://img.shields.io/badge/JWT-9.0-000000?style=flat-square&logo=jsonwebtokens) | 9.0 | Authentication |

### AI & Services
| Service | Purpose |
|---------|----------|
| ![Groq](https://img.shields.io/badge/Groq-API-FF6B6B?style=flat-square) | Natural Language Processing |
| ![Google](https://img.shields.io/badge/Google-Vision_API-4285F4?style=flat-square&logo=google) | Image Recognition |
| ![Cloudinary](https://img.shields.io/badge/Cloudinary-Media-3448C5?style=flat-square&logo=cloudinary) | Media Storage |
| ![ElevenLabs](https://img.shields.io/badge/ElevenLabs-TTS-FF6B35?style=flat-square) | Voice Synthesis |

</div>

## 🚀 Quick Start

### Prerequisites
- Node.js 18.0+
- MongoDB Atlas account
- Groq API key
- Google Cloud account (for Vision API)
- Cloudinary account

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/premzade12/Virtual_Assistant.git
cd Virtual_Assistant
```

2. **Backend Setup**
```bash
cd backend
npm install
```

3. **Frontend Setup**
```bash
cd ../frontend
npm install
```

4. **Environment Configuration**

Create `.env` files in both backend and frontend directories:

**Backend `.env`:**
```env
# Database
MONGO_URI=your_mongodb_connection_string

# Authentication
JWT_SECRET=your_jwt_secret_key

# AI Services
GROQ_API_URL=https://api.groq.com/openai/v1/chat/completions
GROQ_API_KEY=your_groq_api_key

# Google Cloud
GOOGLE_PROJECT_ID=your_project_id
GOOGLE_PRIVATE_KEY=your_private_key
GOOGLE_CLIENT_EMAIL=your_client_email

# Media Storage
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Voice Services
ELEVENLABS_API_KEY=your_elevenlabs_key

# Server
PORT=5000
```

**Frontend `.env`:**
```env
VITE_SERVER_URL=http://localhost:5000
```

5. **Start the Application**

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

6. **Access the Application**
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`

## 📁 Project Structure

```
Virtual_Assistant/
├── 📁 backend/
│   ├── 📁 config/
│   │   ├── 🔧 cloudinary.js      # Media upload config
│   │   ├── 🔧 db.js              # Database connection
│   │   └── 🔧 token.js           # JWT configuration
│   ├── 📁 controllers/
│   │   ├── 🎮 auth.controller.js  # Authentication logic
│   │   └── 🎮 user.controllers.js # User & AI logic
│   ├── 📁 middlewares/
│   │   ├── 🛡️ isAuth.js          # Auth middleware
│   │   └── 📤 multer.js          # File upload
│   ├── 📁 models/
│   │   └── 👤 user.model.js      # User schema
│   ├── 📁 routes/
│   │   ├── 🛣️ auth.routes.js     # Auth endpoints
│   │   ├── 🛣️ user.routes.js     # User endpoints
│   │   └── 🛣️ windows.routes.js  # System integration
│   ├── 📁 services/
│   │   ├── 🎤 elevenLabs.js      # Voice synthesis
│   │   ├── 🔊 voiceManager.js    # Voice management
│   │   └── 🖥️ windowsIntegration.js # System integration
│   ├── 🤖 groq.js               # AI processing
│   └── 🚀 index.js              # Server entry
├── 📁 frontend/
│   ├── 📁 src/
│   │   ├── 📁 components/
│   │   │   └── 🎴 Card.jsx       # Reusable components
│   │   ├── 📁 context/
│   │   │   └── 👤 UserContext.jsx # Global state
│   │   ├── 📁 pages/
│   │   │   ├── 🏠 Home.jsx        # Main interface
│   │   │   ├── 🔐 Signin.jsx      # Authentication
│   │   │   ├── 📝 Signup.jsx      # Registration
│   │   │   ├── ⚙️ Customize.jsx   # Assistant setup
│   │   │   └── ⚙️ Customize2.jsx  # Advanced setup
│   │   ├── 📁 utils/
│   │   │   ├── 📱 whatsappNotifications.js
│   │   │   └── 🖥️ windowsWhatsappMonitor.js
│   │   ├── 🎨 App.jsx            # Main app component
│   │   └── 🚀 main.jsx           # App entry
│   └── 📄 index.html             # HTML template
├── 📚 INTERVIEW_DOCUMENTATION.md  # Interview guide
├── 🌐 INTERVIEW_GUIDE.html        # Interactive guide
└── 📖 README.md                   # This file
```

## 🎤 Voice Commands

### 🔄 Basic Commands
```
"Hey [Assistant Name], search for React tutorials"
"Play some music on YouTube"
"What's the time?"
"Take a screenshot"
"Open calculator"
```

### 🌍 Multi-Language Examples
```
# English
"Open Instagram"
"Send message to John"

# Hindi
"समय बताओ" (Tell me the time)
"गूगल पर सर्च करो" (Search on Google)

# Mixed (Hinglish)
"YouTube पर गाना play करो"
"WhatsApp खोलो"
```

### 💤 Sleep/Wake Commands
```
"[Assistant Name], go to sleep"
"Wake up [Assistant Name]"
"Hey [Assistant Name]" (when sleeping)
```

## 🔧 Configuration

### 🎨 Customization Options
- **Assistant Name**: Personalize your assistant's name
- **Avatar**: Upload custom assistant avatar/video
- **Voice Selection**: Choose from available TTS voices
- **Language Preference**: Set primary language

### 🔐 Security Features
- JWT-based authentication
- bcrypt password hashing
- HTTP-only cookies
- CORS protection
- Input validation
- API key encryption

### 📊 Performance Optimizations
- Smart conversation history management
- Debounced voice recognition
- Efficient re-rendering
- Lazy loading components
- Optimized API calls

## 📸 Screenshots

<div align="center">

### 🏠 Main Interface
*Voice-activated assistant with real-time conversation*

### 🔐 Authentication
*Secure login and registration system*

### ⚙️ Customization
*Personalize your assistant's appearance and behavior*

### 📱 Mobile Responsive
*Fully responsive design for all devices*

</div>

## 🚀 Deployment

### 🌐 Production Setup

1. **Frontend Deployment** (Render/Vercel)
```bash
npm run build
# Deploy dist/ folder
```

2. **Backend Deployment** (Render/Railway)
```bash
# Set environment variables
# Deploy with Node.js runtime
```

3. **Database** (MongoDB Atlas)
- Configure connection string
- Set up indexes for performance
- Enable authentication

### 🔧 Environment Variables
Ensure all production environment variables are properly configured:
- Database connections
- API keys
- CORS origins
- JWT secrets

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### 🐛 Bug Reports
Please use the issue tracker to report bugs. Include:
- Browser/OS information
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <h3>🌟 If you found this project helpful, please give it a star! ⭐</h3>
  <p>Made with ❤️ by <a href="https://github.com/premzade12">Prem Zade</a></p>
  
  <p>
    <a href="https://github.com/premzade12/Virtual_Assistant/issues">Report Bug</a> •
    <a href="https://github.com/premzade12/Virtual_Assistant/issues">Request Feature</a> •
    <a href="#-quick-start">Documentation</a>
  </p>
</div>
