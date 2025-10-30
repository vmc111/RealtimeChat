RealtimeChat
RealtimeChat is a full-stack real-time chat application built with a modern TypeScript-based frontend and Go-powered backend. Experience seamless, instant messaging with a clean and responsive UI.

Demo
Try the live version: realtime-chat-jkp3.vercel.app​

Features
Real-time messaging: Instant communication between users.

Modern stack: TypeScript frontend, Go backend.

Responsive design: Usable on desktop and mobile.

Vite-powered frontend: Fast development, hot reloads.

API server with Go: High performance and concurrency.

Project Structure
chat-app/ – Frontend codebase (TypeScript, Vite, React)

chat-backend/ – Backend codebase (Go API server)

.vscode/ – Editor settings and Prettier config

yarn.lock – Frontend dependencies lock file

Installation & Running Locally
Prerequisites
Node.js and Yarn (for frontend)

Go (for backend)

1. Clone the Repository
bash
git clone https://github.com/vmc111/RealtimeChat.git
cd RealtimeChat
2. Setup Backend
bash
cd chat-backend
go build
./chat-backend  # or the appropriate binary name
Configure environment variables if needed (database URL, port, etc.).

3. Setup Frontend
bash
cd chat-app
yarn install
yarn dev
Access the app via http://localhost:3000 (default Vite setting).

Configuration
Modify backend /chat-backend config files for server, DB, and chat options.

Update frontend /chat-app .env for API endpoint.
