# CodeSage AI 🌌 (AI-Powered Code Review Assistant)

CodeSage AI is an enterprise-grade, hackathon-winning automated code review and security auditing platform. Developers can paste code snippets or import files directly from public GitHub repositories to get comprehensive analyses on security, bugs, performance efficiency, and maintainability.

Unlike standard chatbots, CodeSage AI features an **interactive, SaaS-style dashboard** with an animated code quality score gauge, color-coded severity issue cards, inline diff viewers, and a live "Apply Suggestion" button that modifies the code editor in real-time.

---

## Key Features

1. **⚡ Intelligent Code Review Engine**: Leverages the Gemini API (`gemini-2.5-flash`) to parse, detect, and categorize issues in JavaScript, Python, C++, C#, and Java.
2. **🎯 Circular Quality Score Gauge**: Beautifully visualizes overall code quality with interactive letter grades (e.g. A+, B-) and radial loaders that automatically color-shift from red to emerald green.
3. **🔍 Filterable Issue Metrics**: Sort findings instantly by severity level (HIGH, MEDIUM, LOW) or category rating (Bugs, Security, Performance, Maintainability).
4. **🌳 GitHub Repository Explorer**: Paste a public repository URL to parse the directory tree hierarchy, traverse directories, and import files directly for analysis.
5. **🛠️ Dynamic Code Refactoring**: Ask the AI questions or specify inline instructions (e.g. "make it thread-safe", "optimize this nested loop") and get automatic rewrites.
6. **🚀 Inline Fix Application**: Review proposed fixes inside a side-by-side Diff Viewer and apply them directly back into the Monaco Code Editor with one click.

---

## Tech Stack

| Component | Technology |
| :--- | :--- |
| **Frontend Framework** | React (Vite) |
| **Styling Engine** | Tailwind CSS v4 |
| **Code Editor Engine** | Monaco Editor (`@monaco-editor/react`) |
| **Animation Library** | Framer Motion & Canvas Confetti |
| **Backend Framework** | Node.js + Express |
| **AI Integration** | Google Generative AI SDK (`@google/generative-ai`) |

---

## Installation & Local Run

### Prerequisites
- Node.js (v18 or higher recommended)
- npm (v9 or higher)

### 1. Clone/Navigate to the Directory
Set this folder as your active workspace or navigate inside the root project directory:
```bash
cd codesage-ai
```

### 2. Install All Dependencies
We have configured a concurrent root script to install dependencies for the root, frontend, and backend packages in a single command:
```bash
npm run install:all
```

### 3. Environment Setup
Configure your Gemini API Key. You can do this in two ways:
- **Option A (Recommended)**: Create a `.env` file in the `backend/` folder and insert your key:
  ```env
  PORT=5000
  GEMINI_API_KEY=your_gemini_api_key_here
  ```
- **Option B (Browser Storage)**: Leave the `.env` blank and paste your key in the **Settings Modal** (gear icon) directly in the UI.

### 4. Start the Application
Run the local dev command which starts the Express server (port 5000) and Vite development client (port 3000) simultaneously:
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## File Architecture

```
codesage-ai/
├── package.json          # Root scripts and workspace runner
├── backend/              # Express backend server
│   ├── package.json
│   ├── server.js         # API handlers (Gemini + GitHub API)
│   └── .env              # Backend configuration keys
└── frontend/             # React web application
    ├── package.json
    ├── vite.config.js    # Vite & proxy configuration
    ├── index.html        # Entry viewport, fonts imports
    └── src/
        ├── main.jsx      # React mounting file
        ├── App.jsx       # Main Dashboard layout & state orchestrator
        ├── index.css     # Tailwind v4 import + custom animations & styling utilities
        ├── utils/
        │   └── api.js    # API routing utility
        └── components/
            ├── CodeEditor.jsx   # Monaco code editor wrapper
            ├── ScoreMeter.jsx   # SVG circular scoring dashboard indicator
            ├── DiffViewer.jsx   # Side-by-side comparison screen
            └── IssueCard.jsx    # Collapsible issue reporter card with refactor targets
```

---

## Innovation & Judging Criteria Highlights

- **Real-World Problem Solving**: Reduces developer friction in code review by pinpointing exact line numbers, explanations, and offering automated corrections.
- **Enterprise-Grade UI**: The interface has been crafted with a rich, dark-mode styling utilizing glassmorphism cards, glowing border rings, responsive side-by-side diff viewers, and satisfying celebrations upon achieving high quality code scores.
- **No Chatbot Clones**: Stand out in the hackathon by submitting a functional business productivity SaaS tool instead of generic chatbot panels.
