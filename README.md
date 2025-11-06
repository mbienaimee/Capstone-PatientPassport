# Patient Passport System

Digital patient passport platform with: patient profiles, doctor/hospital workflows,
real-time notifications, OTP-protected passport access, and USSD support for feature phones.

This README provides concise, step-by-step install/run instructions, links to the
deployed app and API, related files, and a short 5-minute demo plan focused on core features.

## Quick links

- Deployed frontend (primary): https://patient-passpo.netlify.app/  
- Alternate frontend URL (used in some docs): https://jade-pothos-e432d0.netlify.app/patient-passport  
- Deployed backend API: https://patientpassport-api.azurewebsites.net/api
- Video Link: https://www.mediafire.com/file/dcrv0fvb8fhgxrq/demo-video.mp4.mp4/file

If you need an installable package (APK / .exe), tell me which platform and I can
produce a packaged artifact or guide you through building one.

## 1 — 1‑minute summary

- Backend: Node.js + TypeScript + Express + MongoDB
- Frontend: React + TypeScript + Vite + Tailwind
- USSD/SMS: Africa's Talking integration (optional)

## 2 — Installation & run (step-by-step)

Prerequisites
- Node.js v18+, npm, Git
- MongoDB (Atlas or local)

Start backend (development)
1) Open PowerShell and go to backend:

   cd c:\Users\user\OneDrive\Desktop\capp\Capstone-PatientPassport\backend

2) Install deps:

   npm install

3) Create `.env` from template and edit values:

   copy env.example .env

   # Edit .env: set MONGODB_URI, JWT_SECRET, EMAIL_* and (optionally) AFRICASTALKING_*

4) Run dev server:

   npm run dev

Backend dev URL: http://localhost:5000  (API base: http://localhost:5000/api)

Start frontend (development)
1) In a new PowerShell window:

   cd c:\Users\user\OneDrive\Desktop\capp\Capstone-PatientPassport\frontend

2) Install deps and create env:

   npm install
   copy env.example .env

   # Edit .env: set VITE_API_BASE_URL=http://localhost:5000/api and VITE_SOCKET_URL=http://localhost:5000

3) Run dev server:

   npm run dev

Frontend dev URL: http://localhost:5173

Run both concurrently (simple):

- Start backend in one terminal and frontend in another (recommended).

Docker (quick production-like run)

Backend
   cd backend
   docker build -t patient-passport-api .
   docker run -p 5000:5000 --env-file .env patient-passport-api

Frontend (serve built assets)
   cd frontend
   npm run build
   # deploy dist/ to a static host (Netlify/Vercel/Azure Static Web Apps)

## 3 — Related files (short map)

- `backend/` — API server, docs, Dockerfile, tests.  See `backend/README.md` for details.
- `frontend/` — React app (Vite), Dockerfile, public/static assets.
- `openmrs-patient-passport-module/` — OpenMRS integration (Maven project).
- `backend/docs/` — USSD guides: `USSD_GUIDE.md`, `USSD_DEPLOYMENT.md`, `USSD_QUICKSTART.md`.
- `QUICK_START_TESTING_GUIDE.md` — high-level testing and quickstart notes.
- `HOSPITAL_DOCTOR_WORKFLOW_IMPLEMENTATION.md` — workflow docs for clinical users.
- `AZURE_DEPLOYMENT_FIX.md`, `DEPLOYMENT_FIXES_SUMMARY.md` — deployment notes used in past deployments.

## 4 — 5‑minute demo video (what to include)

Place a 5-minute file named `demo-video.mp4` in the project root or upload to YouTube and replace the link below.

Provided download (MediaFire): https://www.mediafire.com/file/dcrv0fvb8fhgxrq/demo-video.mp4.mp4/file

To download directly into the repository root using PowerShell, run:

```powershell
Invoke-WebRequest -Uri 'https://www.mediafire.com/file/dcrv0fvb8fhgxrq/demo-video.mp4.mp4/file' -OutFile .\demo-video.mp4
```


## 5 — Deployed apps & packages

- Frontend (UI): https://patient-passpo.netlify.app/  
- Backend API: https://patientpassport-api.azurewebsites.net/api  
- Alternate frontend path used in docs: https://jade-pothos-e432d0.netlify.app/patient-passport

If you want an installable package (APK for Android or an Electron-based .exe for Windows), I can:
- build a production frontend bundle and produce an Electron wrapper (Windows .exe)
- produce an Android WebView APK (or PWA) and provide the .apk

Tell me target platform and I will add build commands and produce the artifact.

## 6 — How to test core features quickly

1) Start backend + frontend (see section 2).  
2) Use seeded/demo user or create a lightweight test user (skip heavy sign-up).  
3) Create a patient record (POST /api/patients).  
4) From doctor dashboard, request passport access and verify with OTP route (focus on OTP flow, not sign-in screens).  
5) Run USSD test endpoint:
   cd backend
   node test/ussd.test.js

## 7 — Notes & next steps

- I added concise run instructions, related file map, the live deployment links found in repo docs,
  and a 5-minute demo plan focused on core functionality.  
- Current placeholders you may want to provide (or I can help create):
  - `demo-video.mp4` file or a YouTube URL to embed
  - If you want an installable package, specify platform (Android/Windows) so I can produce artifacts

If you'd like, I can also:
- produce the demo-video script and a short narration file
- build an Electron .exe or Android .apk and upload the artifact into the repo `releases/` folder

---


Credits & license: See `LICENSE` file in repo.


## Hospital & Doctor Workflow

### Hospital Workflow

1. **Hospital Login**
   - Hospitals log in via `/hospital-login`
   - Access dashboard with tabs: Overview, Doctors, Patients

2. **Doctor Management**
   - Add doctors with automatic user account creation
   - View all hospital doctors
   - Remove doctors from hospital
   - Doctors can immediately login with provided credentials

3. **Patient Management**
   - View all patients associated with hospital
   - Search and filter patients
   - View patient details and assigned doctors

### Doctor Workflow

1. **Doctor Login**
   - Login with email/password (provided by hospital)
   - 2FA OTP verification via email

2. **Patient Access**
   - View all patients in database
   - Request access to patient passport
   - OTP sent to patient's email
   - Enter OTP to view full medical history

3. **Medical Record Viewing**
   - View complete patient passport (read-only)
   - See medical conditions, medications, test results
   - View hospital visits and immunizations

##  Deployment

### Production Deployment

#### Backend Deployment

1. **Build the application**
   ```bash
   cd backend
   npm run build
   ```

2. **Start production server**
   ```bash
   npm start
   ```

3. **Environment Setup**
   - Configure production environment variables
   - Set up MongoDB Atlas cluster
   - Configure email service (SendGrid recommended)
   - Set up Africa's Talking for USSD/SMS

#### Frontend Deployment

1. **Build for production**
   ```bash
   cd frontend
   npm run build
   ```

2. **Deploy dist/ folder**
   - Deploy to Netlify, Vercel, or Azure Static Web Apps
   - Or use any static hosting service


#### Frontend
```bash
cd frontend
docker build -t patient-passport-frontend .
docker run -p 5173:5173 patient-passport-frontend
```


### Environment Checklist

- [ ] MongoDB Atlas cluster configured
- [ ] Environment variables set
- [ ] Email service configured
- [ ] JWT secrets generated
- [ ] CORS origins configured
- [ ] SSL certificates installed
- [ ] Africa's Talking configured (if using USSD)
- [ ] Monitoring and logging setup
- [ ] Backup strategy implemented

##  Testing

### Backend Tests
```bash
cd backend
npm test              # Run all tests
npm run test:watch    # Run tests in watch mode
```

### Frontend Tests
```bash
cd frontend
npm run test          # Run tests (if configured)
```

### USSD Testing
```bash
cd backend
node test/ussd.test.js
```

### Integration Testing
```bash
cd frontend
npm run test:integration
```

##  Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

#### Code Style
- Use TypeScript for type safety
- Follow ESLint configuration
- Write meaningful commit messages
- Add JSDoc comments for functions
- Use descriptive variable and function names

#### Testing
- Write unit tests for business logic
- Test API endpoints
- Test React components
- Maintain test coverage above 80%

#### Security
- Never commit sensitive information
- Use environment variables for configuration
- Implement proper input validation
- Follow OWASP security guidelines

##  Development Scripts

### Backend Scripts
```bash
npm run dev          # Start development server
npm run build        # Build TypeScript
npm start           # Start production server
npm test            # Run tests
npm run lint        # Run ESLint
npm run docs        # Serve API documentation
```

### Frontend Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint        # Run ESLint
```

##  Troubleshooting

### Common Issues

**Backend won't start:**
- Check MongoDB connection string
- Verify all environment variables are set
- Check port 5000 is not in use

**Frontend can't connect to API:**
- Verify `VITE_API_BASE_URL` in `.env`
- Check backend server is running
- Verify CORS settings

**USSD not working:**
- Verify Africa's Talking credentials
- Check webhook URL is correct
- Ensure server has SSL certificate (HTTPS)

**OTP not received:**
- Check email service configuration
- Verify patient email address
- Check spam folder


---
