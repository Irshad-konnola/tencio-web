<div align="center">

# ⚡ Tencio — AI-Integrated Digital Product Agency Platform

**The official web platform for Tencio Digital Product & Technology Agency, engineered with Astro Island Architecture, React, TypeScript, and interactive AI client workflows.**

[![Live Site](https://img.shields.io/badge/Live_Site-tencio.vercel.app-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://tencio.vercel.app/)
[![Astro](https://img.shields.io/badge/Astro-BC52EE?style=for-the-badge&logo=astro&logoColor=white)](https://astro.build/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

[**🚀 Visit Live Platform (tencio.vercel.app)**](https://tencio.vercel.app/) • [Architecture](#engineering-architecture) • [Key Features](#key-features) • [Local Setup](#getting-started-local-development)

</div>

---

## 📸 Platform Preview

<!-- Tip: Drag and drop 2 screenshots of tencio.vercel.app directly into the GitHub README editor -->
| Hero & Interactive Agency Showcase | AI-Assisted Client Workflow & Case Studies |
| :---: | :---: |
| <img width="1897" height="856" alt="Screenshot 2026-10-22 113506" src="https://github.com/user-attachments/assets/3db97af8-c434-4d39-a68b-afa4909a305a" /> | <img width="1895" height="851" alt="Screenshot 2026-10-22 113111" src="https://github.com/user-attachments/assets/1c424b3b-1c79-45da-900f-5ea3f95727ad" /> |

---

## 💡 Engineering Architecture

Traditional agency websites often suffer from heavy JavaScript bundles due to complex animations and interactive widgets, hurting Core Web Vitals and search rankings.

**Tencio Web** solves this using **Astro's Island Architecture**:
- **Zero-JS Default Rendering:** Static marketing sections, case studies, and SEO metadata compile to ultra-fast HTML and CSS at build time for near-instant First Contentful Paint (FCP).
- **Selective React Hydration (`client:load` / `client:visible`):** Interactive UI components, motion sequences, and the AI-assisted client consultation interface hydrate independently only when needed.
- **AI-Integrated Lead Qualification:** Guides prospective clients through project scoping, service matching (SaaS, Web, Mobile, UI/UX, SEO), and instant inquiry routing.

---

## ✨ Key Features

- **🏝️ Astro + React Island Architecture:** Combines static-site speed with rich, stateful React micro-frontends.
- **🤖 AI-Assisted Client Discovery:** Interactive conversational flow to help businesses scope software requirements and connect with the engineering team.
- **🎨 High-Craft Motion Design:** Smooth viewport-triggered transitions, bento-grid service showcases, and responsive dark/modern aesthetics.
- **🔍 Technical SEO & Performance:** Semantic HTML structure, OpenGraph social cards, automatic sitemap generation, and 95+ Lighthouse performance scores.

---

## 🛠️ Tech Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Core Framework** | Astro, React, TypeScript |
| **Styling & Motion** | Tailwind CSS, Framer Motion |
| **AI & Integrations** | LLM API Integration, Automated Lead Routing |
| **Deployment** | Vercel |

---

## 🚀 Getting Started (Local Development)

### 1. Clone the repository
```bash
git clone [https://github.com/Irshad-konnola/tencio-web.git](https://github.com/Irshad-konnola/tencio-web.git)
cd tencio-web
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure Environment Variables
If running AI or contact webhook endpoints locally, copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 4. Start the Astro development server
```bash
npm run dev
```
Open `http://localhost:4321` in your browser.

---

## 📄 License
Distributed under the MIT License. Engineered by [Irshad Konnola](https://irshadkonnola.vercel.app/) & the [Tencio](https://tencio.vercel.app/) Engineering Team.
