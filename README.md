# PersonaGrid

## What is this?
PersonaGrid is a tool that helps you create "virtual marketing teams." Imagine having a group of digital assistants who can act like real people on social media—posting, liking, and commenting for you. You can create different "Personas" (like a "Tech Expert" or a "Friendly Helper"), and this tool helps them do their job automatically.

## What's Done So Far?
We have built the core foundation of the app. Here is what is ready:

*   **🏢 Organization Hub:** You can create different workspaces for different companies or agencies.
*   **🤖 Virtual Personas:** You can create AI characters, give them names, and define their personalities.
*   **🧠 Smart AI Commands:** We have "Global AI Users" that act as super-assistants to help generate content for everyone.
*   **👑 Admin Dashboard:** A powerful control panel for the main administrator to manage all users and settings.
*   **🔒 Secure Login:** A fully working login and signup system, including a "Forgot Password" feature if you get locked out.

## How to Install & Run

Follow these simple steps to get it running on your computer.

### 1. Get the Code
Download this folder or clone it using Git:
```bash
git clone <repository-url>
cd PersonaGrid
```

### 2. Install the Tools
You need to install the software packages for both the "Server" (Backend) and the "Client" (Frontend).
```bash
# Install Server tools
cd server
npm install

# Install Client tools
cd ../client
npm install
```

### 3. Setup Settings
We need to set up some secret keys (like database passwords).
*   **Server:** Copy the file `server/env.example` to a new file named `server/.env`. Fill in your details inside it.
*   **Client:** Copy the file `client/env.example` to a new file named `client/.env`.

### 4. Start the Database
Make sure you have **Docker** installed and running. Then run:
```bash
docker compose up -d
```
Then, set up the database tables:
```bash
cd server
npm run prisma:migrate
npm run prisma:seed
```

### 5. Run the App!
You need to open **two terminal windows**.

**In the first terminal (Server):**
```bash
cd server
npm run dev
```

**In the second terminal (Client):**
```bash
cd client
npm run dev
```

That's it! Open your browser to the link shown in the Client terminal (usually `http://localhost:5173`).

## 🚀 What's Next?
We are working hard to make this even better! Here is what is coming soon:

*   **🔗 Real Connections:** Soon, your personas will be able to connect to **real** Twitter/X, LinkedIn, and Facebook accounts to post for you.
*   **✈️ Auto-Pilot Mode:** You won't even need to click "Post." You can set a schedule, and the AI will generate and post content automatically while you sleep.
*   **📈 Performance Reports:** See how many likes, views, and comments your AI team is getting with simple charts.
*   **🧠 Better Brains:** We are upgrading the AI to remember past conversations and have even more unique personalities.
