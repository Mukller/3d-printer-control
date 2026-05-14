# Online-Slicer 🖨️

**An online platform for viewing and slicing 3D models for 3D printing**

A fully functional web application for working with 3D files in STL format and other print formats. Allows uploading models, viewing them in real-time, and using the built-in slicer to prepare for printing.

![Status](https://img.shields.io/badge/status-development-yellow)
![License](https://img.shields.io/badge/license-ISC-blue)
![Node](https://img.shields.io/badge/node-v18%2B-green)
![React](https://img.shields.io/badge/react-19-61dafb)

---

## 🌟 Features

- **3D Model Viewer** — support for STL and other 3D print file formats
- **Interactive 3D Scene** — zoom, rotate, and move models in real-time
- **Built-in Slicer** — prepare models for printing (based on Kimi Moto)
- **Responsive UI** — optimized for desktop and mobile devices
- **Real-time Processing** — cloud-based model handling and storage
- **API for Integration** — REST API for external applications

---

## 🏗️ Project Structure

```
Online-slicer/
├── backend/              # Node.js + Express backend
│   ├── server.js         # Main server file
│   ├── package.json      # Dependencies (Express, Mongoose, Multer)
│   └── models/           # Mongoose database schemas
├── frontend/             # React + Vite frontend
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── pages/        # Application pages
│   │   └── App.jsx       # Main component
│   └── package.json      # Dependencies (React, Three.js, Tailwind)
├── print3d-app/          # Separate printing application
│   └── package.json      # Application dependencies
├── README.md             # Russian documentation
├── README_EN.md          # English documentation (this file)
└── LICENSE.md            # Project license
```

---

## 🚀 Quick Start

### Requirements
- **Node.js** 18.x or higher
- **npm** 9.x or higher
- **MongoDB** (for data storage)

### Installation

**1. Clone the repository:**
```bash
git clone https://github.com/Mukller/Online-slicer.git
cd Online-slicer
```

**2. Install backend dependencies:**
```bash
cd backend
npm install
```

**3. Install frontend dependencies:**
```bash
cd ../frontend
npm install
```

**4. Install print app dependencies:**
```bash
cd ../print3d-app
npm install
cd ..
```

### Running the Application

**Start the backend:**
```bash
cd backend
npm start
```
Server will run on `http://localhost:5000`

**Start the frontend (in another terminal):**
```bash
cd frontend
npm run dev
```
Application will open on `http://localhost:5173`

**Start the print app (in a third terminal):**
```bash
cd print3d-app
npm run dev
```

---

## 📚 Technology Stack

### Backend
- **Express.js** — web framework
- **Mongoose** — MongoDB ODM
- **Multer** — file upload handling
- **CORS** — cross-origin requests

### Frontend
- **React 19** — UI library
- **Vite** — build tool
- **Three.js** — 3D graphics
- **React Three Fiber** — React integration for Three.js
- **Framer Motion** — animations
- **Tailwind CSS** — CSS utilities
- **Axios** — HTTP client

### Database and Storage
- **MongoDB** — NoSQL database
- **GridFS** — large file storage (optional)

---

## 🔌 API Endpoints

### 3D Models
- `GET /api/models` — get list of all models
- `POST /api/models/upload` — upload a new model
- `GET /api/models/:id` — get model by ID
- `DELETE /api/models/:id` — delete a model

### Slicing
- `POST /api/slice` — slice a model
- `GET /api/slice/:jobId` — get slicing job status

### Users (planned)
- `POST /api/users/register` — user registration
- `POST /api/users/login` — user login

---

## 💻 Development

### Branch Structure
- `main` — stable version
- `develop` — development version
- `feature/*` — feature branches
- `bugfix/*` — bug fix branches

### Code Style
- **ESLint** for JavaScript code checking
- **Prettier** for code formatting (planned)
- Use `npm run lint` for code checking

### Testing (planned)
```bash
npm test
```

---

## 🤝 Contributing

We need your help! Read [CONTRIBUTING.md](./CONTRIBUTING.md) for information about the contribution process.

**Quick start:**
1. Fork the repository
2. Create a branch for your feature (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

The project is distributed under the **ISC** license. See [LICENSE.md](./LICENSE.md) for details.

---

## 📋 Documentation

- [Russian README](./README.md)
- [Code of Conduct](./CODE_OF_CONDUCT.md)
- [Contributor Guide](./CONTRIBUTING.md)
- [Changelog](./CHANGELOG.md)
- [Release Information](./RELEASE_INFO.md)

---

## 👥 Developers

- **Mukller** — creator and main developer

---

## 📞 Contact and Support

- **GitHub Issues** — for reporting bugs and requesting features
- **GitHub Discussions** — for discussions and ideas

---

## 🎯 Roadmap

- [ ] User authentication
- [ ] Cloud model storage
- [ ] Full slicer integration (Kimi Moto)
- [ ] G-code export
- [ ] Model version history
- [ ] Real-time collaboration
- [ ] Mobile application
- [ ] 3D printer integration
- [ ] Material recommendations system

---

**Thank you for your interest in Online-Slicer!** ⭐

If the project helps you, please star it on GitHub! This motivates us to develop the project further.
