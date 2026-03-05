# Bayyinah (Frontend)

This is the Next.js frontend application for the Bayyinah-RAG. It provides an immersive, Islamic-themed chat interface with RTL (Right-to-Left) Arabic support.

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Styling:** Tailwind CSS v4
- **Components:** shadcn/ui
- **Fonts:** Noto Kufi Arabic, Noto Naskh Arabic
- **Authentication:** Supabase Auth (Google OAuth)
- **Deployment:** Vercel

## Requirements

- Node.js >= 18.x
- A running FastAPI backend instance (see `../backend`)
- A Supabase Project with Google Provider enabled

## Quick Start

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Environment Variables

Copy the example file to create your local environment:

```bash
cp .env.example .env.local
```

Edit `.env.local` to include your Supabase URL, Anon Key, and the Backend API URL (default: `http://localhost:8000`).

### 3. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Features

- **Google Login Flow:** Authenticate seamlessly via Supabase.
- **Arabic UI/UX:** Full RTL support, styled specifically with customized typography for Arabic reading readability.
- **RAG Citations:** Specialized components to render structured JSON citations from the AI backend to ground the AI responses in Quranic/Sunnah facts.
- **Responsive:** Optimized for both mobile and desktop views using Tailwind CSS.
