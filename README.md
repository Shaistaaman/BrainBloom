# BrainBloom 🧠

BrainBloom is a vibrant, gamified learning platform that turns the challenge of acquiring new knowledge into an addictive, rewarding journey. Inspired by the best gamification patterns, it uses Active Recall and Spaced Repetition (SRS) to help you bloom your brain.

## ✨ Prominent Features

- **10-Level Learning Path**: A structured journey from Level 1 to Level 10. Each level offers new courses and challenges.
- **Physical Milestones**: Grounding exercises between levels to ensure focus and well-being.
  - *Level 1 Milestone*: 5s Breathing
  - *Level 2 Milestone*: 3x Sit-Stands
  - *Level 3 Milestone*: 5s Observation
  - *Level 4 Milestone*: Change Your Position
  - *...and more up to Level 10!*
- **Gamified Progression**:
  - **XP System**: Earn experience points by completing session and challenges.
  - **Daily Goals**: Set and hit daily XP targets to maintain your momentum.
  - **Streaks**: Keep your learning habit alive with consecutive active days.
  - **Level Up**: Reach new levels to unlock higher-tier courses and badges.
- **Advanced Course Creator**:
  - Build your own courses with custom questions and answers.
  - Support for both **Text-Only** and **Text + Image** formats.
  - Assign difficulty levels to target specific learning stages.
- **Smart Learning Engine**:
  - Leverages Spaced Repetition to show you the right content at the right time.
  - Interactive "Play" sessions with real-time feedback.
- **Achievements & Badges**:
  - **Explorer**: For your first complete session.
  - **Scholar**: Reach Level 5 to demonstrate mastery.
  - **Memory Master**: 100% accuracy in a long session.
  - **Visionary**: Share knowledge by creating multiple courses.
- **Real-time Persistence**: 
  - Powered by Firebase Auth and Firestore for cloud syncing across devices.
  - Seamless authentication with Google Login.

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

### Installation

1. Clone the project or download the source code.
2. Install the dependencies:
   ```bash
   npm install
   ```

### Development

To start the development server with hot reload:
```bash
npm run dev
```
The app will be available at `http://localhost:3000`.

### Production Build

To create an optimized production build:
```bash
npm run build
```
The output will be in the `dist/` directory.

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS 4, Motion (formerly Framer Motion)
- **Backend/Database**: Firebase (Auth, Firestore)
- **Icons**: Lucide React
- **Visuals**: Canvas Confetti for celebrations

## 📝 License

This project is created as part of the BrainBloom learning initiative.
