# KinTime — Neighborly Caregiver Time-Bank

KinTime is a mutual time-bank and community respite network engineered for unpaid family caregivers. Caregivers earn verified care hours by running errands or providing companionship for neighbors, and withdraw those hours when they require someone to sit with or care for their loved ones.

---

## 🌟 Key Features

- **Liquid Glass Interface**: High-aesthetic modern UI built with responsive layout, fluid micro-animations, and GSAP telemetry.
- **Care Exchange**: Real-time board to request and offer neighborly caregiving errands, companionship, and escort tasks.
- **Care Passbook & Ledger**: Cryptographically verified audit log with debit/credit transactions, escrow reserves, and grace thresholds.
- **Care Dossier & Care Matrix**: Clinical protocols, caregiver emergency profiles, allergy logs, and legal health directives.
- **Respite Emergency SOS**: Instant high-priority respite alert triggers for unexpected caregiver crises.
- **Dual Runtime**:
  - **Online Mode**: Express backend with SQLite persistence (`server/index.js`).
  - **Offline / Hosted Simulation**: Fully functional client-side fallback with sample caregiver data and interactive state management for GitHub Pages hosting.

---

## 🚀 Live Demo & GitHub Pages Hosting

This repository is configured with an automated **GitHub Actions** workflow (`.github/workflows/deploy.yml`).

### How GitHub Pages is Enabled:
1. Push this repository to GitHub.
2. In your repository on GitHub, navigate to **Settings** > **Pages**.
3. Under **Build and deployment** > **Source**, select **GitHub Actions**.
4. The workflow will automatically build the Vite app and deploy it to `https://<your-username>.github.io/<repository-name>/`.

---

## 💻 Local Development Setup

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (version 18+ recommended)
- `npm` (bundled with Node.js)

### 2. Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/<your-username>/<repo-name>.git
cd <repo-name>
npm install
```

### 3. Running Locally

#### Start the Frontend (Vite Dev Server)
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

#### Start the SQLite Backend Server (Optional)
In a separate terminal:
```bash
npm run server
```
The server will start on port `3001` and connect to `database/kintime.db`.

#### Inspect SQLite Database
```bash
npm run db:view
```

#### Build for Production
```bash
npm run build
```
The production bundle will be generated in `dist/`.

---

## 📂 Project Structure

```text
├── .github/
│   └── workflows/
│       └── deploy.yml          # Automated GitHub Pages CI/CD workflow
├── assets/                     # Static media & hero photography
├── database/
│   ├── schema.sql              # Database schema & seed records
│   └── kintime.db              # SQLite database
├── server/
│   ├── index.js                # Express REST API
│   ├── db.js                   # SQLite database connector & helpers
│   └── view_db.js              # CLI database inspector
├── src/
│   ├── components/
│   │   └── KinTimeAuth.jsx     # React authentication & registration system
│   ├── auth-guard.js           # Universal gatekeeping & session manager
│   ├── auth-main.jsx           # React mount entry point for auth
│   ├── main.js                 # Core animations, UI controller & sync engine
│   └── style.css               # Design system & CSS stylesheet
├── auth.html                   # Login & registration portal
├── care-exchange.html          # Community task exchange
├── dossier.html                # Care recipient medical & legal dossier
├── emergency-sos.html          # Respite SOS emergency trigger
├── index.html                  # Main application dashboard
├── passbook.html               # Ledger & care hours passbook
├── package.json                # Project dependencies & scripts
└── vite.config.js              # Vite configuration (with relative base path)
```

---

## 🛡️ License

This project is created for academic and community demonstration purposes.
