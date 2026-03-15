# Spiral Nebula Tugboat (Just In Time)

A persistent, multiplayer space-tugboat MMO where players cooperate to salvage, mine, and explore a procedurally generated galaxy. The game features a atmospheric retro-CRT terminal interface, high-stakes authoritative server logic, and evocative narrative descriptions.

## 🚀 Overview

In **Spiral Nebula Tugboat**, you step into the role of a pilot or crew member aboard a heavy-duty asteroid tug. Whether you're commissioning your own vessel or joining an existing crew, the nebula is a dangerous and unpredictable frontier.

### Key Features
- **Authoritative Multiplayer**: Real-time synchronization using Socket.io ensures all crew members see the same state and events.
- **Retro CRT Interface**: A specialized Phaser 3 engine rendering a post-processing CRT filter for an immersive, lo-fi sci-fi experience.
- **Evocative Narratives**: Context-aware room descriptions and randomized sector flavor text bring the "Just In Time" universe to life.
- **Procedural Galaxy**: 200 interconnected sectors to explore, each with its own potential for treasures or hazards.
- **Modular Ship Systems**: Commands are tied to physical locations on the ship (e.g., you must be in Engineering to perform repairs).

---

## 🕹️ Command Guide

Interaction is handled entirely through the terminal. Commands are context-aware based on whether you are in the **Lobby** or **Aboard a Ship**.

### Lobby Commands
| Command | Action |
| :--- | :--- |
| `who` | View all connected pilots in the nebula. |
| `ships` | List all active vessels currently in operation. |
| `create <name>` | Commission a new ship and become its Captain. |
| `join <id>` | Send a boarding request to an existing ship. |
| `help` | Show the lobby-specific instruction manual. |

### In-Game Commands
| Command | Location Required | Action |
| :--- | :--- | :--- |
| `move <room>` | Any | Travel between **Bridge**, **Weapons**, **Cargo**, or **Engineering**. |
| `scan` | Any | View local sector data and reachable jump points. |
| `jump <id>` | **Bridge** | Plot an FSD jump to a linked sector (Costs 10 Fuel). |
| `attack` | **Weapons** | Engage hostile targets or derelicts. |
| `mine` | **Cargo Bay** | Harvest Scrap from local asteroid fields. |
| `repair` | **Engineering**| Consume 5 Scrap to restore 10 Hull integrity. |
| `comm <msg>` | Any | Broadcast a message to all ships in your current sector. |
| `who` | Any | See your crewmates and other active pilots. |
| `help` | Any | View the full operational protocol guide. |

---

## 🛠️ Technical Architecture

### Tech Stack
- **Server**: Node.js & Express
- **Networking**: Socket.io (Real-time events)
- **Frontend**: Phaser 3 (2D Game Engine)
- **Shaders**: GLSL (Custom CRT post-processing pipeline)

### File Structure
- `server.js`: The authoritative core. Handles player state, ship logic, and turn-based increments.
- `events.js`: Central library for procedural encounters, flavor text, and narrative data.
- `main.js`: Client-side entry point. Manages Phaser scenes, terminal rendering, and socket communication.
- `crt_shader.js`: Custom post-processing shader for the retro monitor effect.
- `index.html`: Main entry point for the web client.

---

## ⚙️ Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Run the Server**:
   ```bash
   node server.js
   ```

3. **Launch the Game**:
   Open a browser and navigate to `http://localhost:3000`.

---

## 🛡️ License
Distributed under the ISC License. See `package.json` for details.
