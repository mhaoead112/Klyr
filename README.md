# Klyr - Modern Cloud Banking & Finance Management

Klyr is a modern, full-stack banking and personal finance management application built with React, TypeScript, Node.js, and MySQL. It provides users with a seamless experience for managing their finances, including virtual cards, money transfers, and transaction tracking.

## ✨ Features

- 💳 Virtual Card Management
- 💰 Send & Receive Money
- 📊 Financial Insights & Analytics
- 🔒 Secure Authentication
- 🌓 Dark/Light Mode
- 📱 Responsive Design
- 🚀 Real-time Updates
- 💾 Cloud File Storage
- 🤝 Group Banking & Shared Wallets

## 🛠 Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (v16 or higher)
- npm (v8 or higher) or yarn
- MySQL Server (v8.0 or higher)
- Git

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/seif8911/Klyr.git
   cd project
   ```

2. **Install server dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Install client dependencies**
   ```bash
   cd ../client
   npm install
   ```

## 🔧 Configuration

1. **Database Setup**
   - Create a new MySQL database
   - Import the database schema from `./klyr.sql`

2. **Environment Variables**
   Create a `.env` file in the `server` directory with the following variables:
   ```env
   PORT=3001
   DB_HOST=localhost
   DB_USER=your_mysql_username
   DB_PASSWORD=your_mysql_password
   DB_NAME=your_database_name
   JWT_SECRET=your_jwt_secret_key
   NODE_ENV=development
   ```

## 🏃‍♂️ Running the Application

1. **Start the Entire server**
   ```bash
   npm run dev
   ```
   The server will start on `http://localhost:3001`
   The client will be available at `http://localhost:5173`

## 🧪 Testing

To run tests:

```bash
# Server tests
cd server
npm test

# Client tests
cd ../client
npm test
```

## 📂 Project Structure

```
project/
├── client/                 # Frontend React application
│   ├── public/            # Static files
│   └── src/               # Source files
│       ├── components/    # Reusable UI components
│       ├── pages/         # Page components
│       ├── services/      # API services
│       └── styles/        # Global styles
├── server/                # Backend Node.js server
│   ├── config/           # Configuration files
│   ├── controllers/      # Route controllers
│   ├── middleware/       # Express middleware
│   ├── models/           # Database models
│   ├── routes/           # API routes
│   └── utils/            # Utility functions
└── README.md             # This file
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with ❤️ using modern web technologies
- Inspired by modern fintech applications
- Special thanks to all contributors
- Made By Seif and mohamed Hesham For The Deci Level 5 Web development Track
---

<div align="center">
  Made with ❤️ by the Klyr Team
</div>
