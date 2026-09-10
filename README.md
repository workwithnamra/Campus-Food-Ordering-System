# SVKM Crazy Canteen

A full-stack, production-quality food ordering web app for SVKM college with 3 canteens (Ground Floor, 6th Floor, 8th Floor).

## Prerequisites
- **Node.js**: You need to install Node.js (v18 or higher) from [nodejs.org](https://nodejs.org/) to run this project. 
- *(Currently, Node is not detected in your terminal environment)*

## Quick Start

### 1. Backend Setup
1. Open a new terminal and navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Seed the database with 200+ food items:
   ```bash
   npm run seed
   ```
4. Start the server (runs on port 5000):
   ```bash
   npm run dev
   ```

### 2. Frontend Setup
1. Open *another* terminal and navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the React/Vite development server:
   ```bash
   npm run dev
   ```
4. Open the localhost URL (usually `http://localhost:5173`) in your browser to see the Crazy Canteen app!

## Features Implemented
- **3 Canteens**: Ground, 6th, and 8th floor selection.
- **Jain / Normal Mode**: Toggle right in the navbar to filter the entire menu instantly.
- **Rich UI**: High-end styling using Tailwind CSS, including hover effects and responsive grids.
- **Mock Razorpay/UPI Integration**: Fully mocked checkout flow where users can select Razorpay or UPI counter scanning.
- **Advanced Backend Schema**: SQLite database structure prepared for orders, users, loyalty programs, and coupons.
- **Massive Menu Database**: Seed script automatically generates 200 items covering Sushi, Street Food, South Indian, Gujrati specials, Protein Bars, etc.
