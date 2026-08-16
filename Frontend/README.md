# 🎓 AI Study Assistant — Frontend

A modern, responsive web interface for the **AI Study Assistant** platform built with **Next.js 13 (App Router)**, **TypeScript**, and **Tailwind CSS**.

---

## 🚀 Key Features

* **🔐 Authentication System:**
  * User Registration (Sign Up) & Login with form validation.
  * JWT Token storage & session persistence via `localStorage`.
  * Forgot Password & Reset Password flows.
* **📊 Interactive Dashboard:**
  * Personalized study overview with metrics and progress tracking.
  * Subject shortcuts, recent activity, and quick AI prompts.
* **📚 Subject Management:**
  * Create, edit, and organize study subjects and topics.
  * Progress calculation per subject.
* **🤖 AI Workspace:**
  * Interactive AI study interface for notes, summaries, and Q&A.
* **🎨 Modern UI & Design:**
  * Glassmorphism aesthetics, smooth animations, and clean typography.
  * Component library built with **Radix UI** and **Tailwind CSS**.

---

## 🛠️ Tech Stack

* **Framework:** Next.js 13.5 (App Router)
* **Language:** TypeScript / React 18
* **Styling:** Tailwind CSS, PostCSS, `clsx`, `tailwind-merge`
* **Icons:** Lucide React (`lucide-react`)
* **UI Components:** Radix UI primitives (`@radix-ui/*`)
* **Data Visualization:** Recharts
* **Backend Connection:** Connected to NestJS + MongoDB backend (`http://localhost:3001`)

---

## 📁 Project Structure

```text
frontend/
├── app/                      # Next.js App Router Pages
│   ├── (auth)/               # Auth Group (Login, Signup, Forgot/Reset Password)
│   │   ├── login/
│   │   ├── signup/
│   │   ├── forgot-password/
│   │   └── reset-password/
│   ├── (dashboard)/          # Main Protected Dashboard Layout & Pages
│   │   └── dashboard/
│   │       ├── subjects/     # Subjects Page
│   │       ├── workspace/    # AI Workspace Page
│   │       └── settings/     # User Settings Page
│   ├── globals.css           # Global Styles & Tailwind Directives
│   └── layout.tsx            # Root App Layout
├── components/               # UI & Layout Components
│   ├── ui/                   # Reusable UI Primitives (Buttons, Dialogs, etc.)
│   ├── workspace/            # Workspace Components
│   └── AppLogo.tsx           # Branding Logo Component
├── hooks/                    # Custom React Hooks (useAuth, use-toast)
├── lib/                      # Utilities & API Services
│   ├── services/             # API Connectors (authService.js, subjectService.js)
│   └── utils.ts              # Classname helpers & utils
├── public/                   # Static Assets
├── package.json              # Dependencies & Scripts
└── tailwind.config.ts        # Tailwind Configuration
```

---

## ⚙️ Getting Started

### Prerequisites

* **Node.js**: v18.0.0 or higher
* **npm**: v9.0.0 or higher
* **Backend Server**: Running NestJS server (default: `http://localhost:3001`)

### 1. Environment Setup

Create a `.env.local` file in the `frontend` root directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---

## 📜 Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Next.js development server on port 3000 |
| `npm run build` | Builds the application for production deployment |
| `npm run start` | Starts the production server after building |
| `npm run lint` | Runs ESLint to check for code quality and errors |
| `npm run typecheck` | Validates TypeScript types without emitting files |

---

## 🔗 Backend Integration

The frontend communicates with the **NestJS Backend API** via HTTP requests implemented in `frontend/lib/services/`:

* **`authService.js`**: Handles authentication endpoints (`/auth/signin`, `/auth/signup`, `/auth/forgot-password`, `/auth/logout`).
* **`subjectService.js`**: Handles subjects endpoints (`/subjects`).

Access tokens are automatically saved to `localStorage` and sent with protected requests via the `Authorization: Bearer <token>` header.
