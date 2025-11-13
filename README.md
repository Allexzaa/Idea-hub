# IdeaNest 🪺

**A safe, warm space where ideas hatch and grow together**

IdeaNest is a friendly, collaborative idea-sharing platform where people from all backgrounds can share ideas, pain points, and solutions in a supportive environment. Unlike traditional forums, IdeaNest focuses on positive collaboration, growth tracking, and human connection.

---

## ✨ Features

### Core Values
- **No Negativity** - No downvotes, only constructive support
- **People-First** - Show the human behind every idea
- **Collaboration > Competition** - Ideas can have multiple co-creators
- **Growth Journey** - Track how ideas evolve from spark to reality
- **Kindness Rewarded** - Recognition for helpful community members

### Unique Features
- **Spark & Nurture System** - Express interest (✨) or offer help (🌱) instead of voting
- **Idea Journey Stages** - Track progress: 💭 Spark → 🌱 Growing → 🔨 Building → 🚀 Launched → ✅ Validated
- **Co-Creation** - Invite collaborators to become co-owners of ideas
- **Rich Collaboration** - Comments, file sharing, direct messaging
- **Helpfulness Score** - Get recognized for being helpful, not just popular

---

## 🛠️ Tech Stack

### Frontend
- **React 18+** with **TypeScript**
- **Vite** - Fast build tool
- **Tailwind CSS** - Utility-first styling
- **React Router** - Client-side routing
- **Zustand** - Lightweight state management
- **TanStack Query** - Server state management
- **React Hook Form + Zod** - Form handling and validation
- **Socket.io Client** - Real-time features

### Backend
- **Node.js 20+** with **TypeScript**
- **Express.js** - Web framework
- **PostgreSQL 15** - Primary database
- **Redis** - Caching and sessions
- **Passport.js** - Authentication (Email, Google, GitHub)
- **Socket.io** - Real-time notifications
- **JWT** - Token-based auth
- **Zod** - Runtime validation

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 20+ and **npm**
- **Docker** and **Docker Compose** (for database)
- **Git**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/Idea-hub.git
   cd Idea-hub
   ```

2. **Start PostgreSQL and Redis with Docker**
   ```bash
   docker-compose up -d
   ```
   This will start:
   - PostgreSQL on `localhost:5432`
   - Redis on `localhost:6379`

3. **Set up the Backend**
   ```bash
   cd backend
   npm install

   # Copy environment file and configure
   cp .env.example .env
   # Edit .env with your configuration

   # Start development server
   npm run dev
   ```
   Backend will run on `http://localhost:5000`

4. **Set up the Frontend**
   ```bash
   cd frontend
   npm install

   # Copy environment file
   cp .env.example .env

   # Start development server
   npm run dev
   ```
   Frontend will run on `http://localhost:5173`

5. **Initialize the Database**
   The database schema will be automatically created when Docker starts.
   You can also run it manually:
   ```bash
   docker exec -i ideanest-postgres psql -U postgres -d ideanest < backend/database/schema.sql
   ```

---

## 📁 Project Structure

```
Idea-hub/
├── frontend/               # React frontend application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API service layer
│   │   ├── store/          # State management
│   │   ├── types/          # TypeScript type definitions
│   │   ├── utils/          # Utility functions
│   │   └── assets/         # Images, fonts, etc.
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                # Node.js backend API
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Custom middleware
│   │   ├── models/         # Data models
│   │   ├── routes/         # API routes
│   │   ├── types/          # TypeScript types
│   │   ├── utils/          # Utility functions
│   │   └── index.ts        # Entry point
│   ├── database/
│   │   └── schema.sql      # Database schema
│   ├── package.json
│   └── tsconfig.json
│
├── docker-compose.yml      # Docker services (PostgreSQL, Redis)
├── IDEANEST_DESIGN.md      # Comprehensive design document
└── README.md               # This file
```

---

## 🔧 Available Scripts

### Frontend
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

### Backend
```bash
npm run dev      # Start development server with hot reload
npm run build    # Compile TypeScript to JavaScript
npm run start    # Run production server
```

---

## 🗄️ Database Schema

The database includes tables for:
- **users** - User accounts and profiles
- **ideas** - Main idea threads
- **sparks** - Interest reactions
- **nurtures** - Help offers
- **comments** - Threaded discussions
- **attachments** - File uploads
- **conversations & messages** - Direct messaging
- **notifications** - User notifications

See `backend/database/schema.sql` for the complete schema.

---

## 🔐 Environment Variables

### Backend (.env)
```env
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173

DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ideanest
REDIS_URL=redis://localhost:6379

JWT_SECRET=your_secret_key
JWT_REFRESH_SECRET=your_refresh_secret

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

---

## 📖 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints
- `POST /auth/register` - Register with email/password
- `POST /auth/login` - Login
- `GET /auth/google` - Google OAuth
- `GET /auth/github` - GitHub OAuth

### Ideas Endpoints
- `GET /ideas` - List all ideas (with filters)
- `POST /ideas` - Create new idea
- `GET /ideas/:id` - Get idea details
- `PUT /ideas/:id` - Update idea
- `DELETE /ideas/:id` - Delete idea

See `IDEANEST_DESIGN.md` for complete API documentation.

---

## 🎨 Design Philosophy

### Color Palette
- **Primary (Orange)**: `#FF8C42` - Energy, creativity
- **Secondary (Green)**: `#7ED957` - Growth, nurturing
- **Accent (Blue)**: `#4A90E2` - Trust, calm

### Typography
- Font: Inter (rounded, friendly sans-serif)
- Generous spacing and rounded corners
- Warm, approachable aesthetic

---

## 🗺️ Roadmap

### Phase 1 - MVP (Current)
- [x] Project setup
- [ ] Authentication (email, Google, GitHub)
- [ ] User profiles
- [ ] Create/browse ideas
- [ ] Spark & Nurture system
- [ ] Comments
- [ ] File uploads
- [ ] Direct messaging
- [ ] Notifications

### Phase 2 - Enhanced Features
- [ ] Co-creator invites
- [ ] Accountability Pods
- [ ] Voice notes
- [ ] Video embeds
- [ ] AI-powered idea matching
- [ ] Mobile app (Expo)

### Phase 3 - Community Growth
- [ ] Buddy system for new users
- [ ] Industry circles
- [ ] Weekly idea mixers
- [ ] Badge system
- [ ] Analytics dashboard

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 💬 Support

For questions or support, please open an issue on GitHub.

---

**Built with ❤️ for the idea-sharing community** 🪺
