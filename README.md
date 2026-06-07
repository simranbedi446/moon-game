# Celestial Cycles 🌙 (Rise of the Half Moon Card Game)

Celestial Cycles is a highly polished, responsive, and visually stunning web card strategy game inspired by the Google Doodle game **"Rise of the Half Moon"**. 

Built from scratch using **Next.js (App Router)**, **React.js**, and custom **Vanilla CSS**, the game tasks players with aligning lunar phases on a gravity-defying celestial board. Outsmart the "Half Moon" AI, cast powerful cosmic wildcards, and master the orbital cycles.

---

## 🎮 Game Rules & Mechanics

The goal of the game is to score more points than the Half Moon AI by placing cards onto a grid-based board. 

### 1. Scoring Combinations
When you place a card adjacent to other cards (horizontally or vertically), you immediately earn points if they form:
*   **Phase Pairs (1 Point):** Placing two identical lunar phases side-by-side (e.g., matching two First Quarter cards).
*   **Full Moon Pairs (2 Points):** Combining two complementary moon phases that sum to 100% illumination (e.g., matching a Waxing Crescent with a Waning Gibbous, or a First Quarter with a Last Quarter).
*   **Lunar Cycles (1 Point per card):** Aligning three or more consecutive phases of the moon in order along a straight line (e.g., Waxing Crescent ➔ First Quarter ➔ Waxing Gibbous). The sequence wraps around from Waning Crescent back to New Moon.

### 2. Tile Flipping & Board Ownership
*   Whenever a player scores a combination, all cards involved in that combination **flip to their color** (Gold for Player, Purple for AI).
*   When the board is completely full, the round ends.
*   **End-of-Round Bonus:** Each player receives **+1 point for every card** of their color remaining on the board. The player with the highest total score wins the round.

### 3. Cosmic Wildcards 🔮
Win rounds to unlock random celestial wildcards to turn the tide:
*   **Equinox:** Swaps scores between you and the Half Moon AI.
*   **Supermoon:** Doubles all combo points scored by your card placement this turn.
*   **Solar Eclipse:** Immediately flips all adjacent cards on the board to your color, regardless of whether they form combos.
*   **Meteor Shower:** Allows you to select and destroy any single card on the board to clear its slot (costs no turn!).

---

## ✨ Premium Features & Tech Stack

*   **Responsive Hybrid Layout:** Scales fluidly between desktop screens (horizontal dashboard) and mobile phones (vertical stacked controls).
*   **Web Audio API Synthesizer:** All sound effects (card draws, placements, chord chimes on matches, win/loss sweeps) and a soft ambient space drone are synthesized dynamically in the browser. Zero external audio file assets required.
*   **Reactive AI Face:** A custom SVG AI avatar that changes its expressions (thinking, happy, sad, shocked, sleeping) and speaks customized reactive speech bubbles depending on the state of the game.
*   **Tarot-Inspired Design:** Glassmorphism dashboard panels, starry parallax space backgrounds, 3D card tilt effects, and custom vector SVGs for all eight moon phases.

---

## 🛠️ Setup & Development

### Prerequisites
*   Node.js (v18 or higher recommended)
*   npm (v9 or higher)

### Installation
Clone the repository, navigate to the directory, and install dependencies:
```bash
npm install
```

### Running Locally (Dev Mode)
Start the local development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to play the game.

### Production Build
Generate an optimized static build:
```bash
npm run build
```

---

## 📁 Project Architecture

```text
moon-game/
├── public/                 # Static assets (favicons, manifest)
└── src/
    ├── app/
    │   ├── globals.css     # Unified CSS variables, starfields, card tilts, animations
    │   ├── layout.js       # App metadata & Font wrapping
    │   └── page.js         # Game entry point, stages, SVG rendering
    ├── hooks/
    │   └── useGameEngine.js# State engine, AI heuristics, combo evaluation, rules
    └── utils/
        └── soundSynth.js   # Browser-synthesized Web Audio API sound generator
```
