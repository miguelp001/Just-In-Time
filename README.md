# Spiral Nebula Tugboat (Just In Time)

A persistent, multiplayer space-tugboat MMO where players cooperate to salvage, mine, and explore a procedurally generated galaxy. The game features an atmospheric retro-CRT terminal interface, high-stakes authoritative server logic, and evocative narrative descriptions, running entirely on the edge via Cloudflare Workers and Durable Objects.

## 🚀 Overview

In **Spiral Nebula Tugboat**, you step into the role of a pilot or crew member aboard a heavy-duty asteroid tug. Whether you're commissioning your own vessel or joining an existing crew, the nebula is a dangerous and unpredictable frontier.

### Key Features
- **Authoritative Edge Multiplayer**: Real-time synchronization using Cloudflare Workers, Durable Objects, and native WebSockets.
- **Persistent Pilot Sessions**: Progress is saved between sessions. Closing your browser doesn't mean the end of your mission; your identity and ship membership are preserved via `localStorage`.
- **Retro CRT Interface**: A specialized Phaser 3 engine rendering a post-processing CRT filter for an immersive, lo-fi sci-fi experience.
- **Evocative Narratives**: Context-aware room descriptions and randomized sector flavor text bring the universe to life.
- **Procedural Galaxy**: A persistent, interconnected map of 200 sectors with dynamic encounters and roaming NPCs.

---

## 🕹️ Command Guide

Interaction is handled entirely through the terminal. Commands are context-aware based on your location.

### Lobby Commands
- `who`: View all connected pilots in the nebula.
- `ships`: List all active vessels currently in operation.
- `create <name>`: Commission a new ship and become its Captain.
- `join <name/id>`: Send a boarding request to an existing ship.
- `rename <name>`: Change your pilot callsign.
- `help`: Show the lobby-specific instruction manual.

### In-Game Commands (Room Specific)

**Global (Any Room):**
- `move <room>`: Travel between **Bridge**, **Weapons**, **Cargo**, or **Engineering**.
- `rename ship <name>`: Rename your current ship.
- `who`: View active pilots and crewmates.
- `help`: View commands available in your current room.

**Bridge (Command & Navigation):**
- `jump <sector>`: Plot an FSD jump to a linked sector (Costs 10 Fuel, triggers encounter).
- `scan [deep]`: View local sector data, or deep scan adjacent sectors (Costs 5 Energy).
- `hail`: Attempt communications with an NPC target.
- `shields`: Activate damage mitigation (Costs 5 Energy).
- `evade`: Initiate maneuvers to dodge incoming fire.
- `jam`: Deploy countermeasures to jam enemy targeting (Costs 8 Energy).
- `comm server <msg>`: Broadcast a nebula-wide message to all players (Costs 5 Energy).

**Weapons Control (Offense & Tactics):**
- `attack`: Fire main beams at the target (Costs 5 Energy).
- `target <weapons|engines>`: Cripple specific enemy systems (Costs 8 Energy).
- `emp`: Build and fire an EMP torpedo to disable the enemy (Costs 10 Scrap).
- `chaff`: Deflect incoming missiles (Costs 5 Energy).
- `overcharge`: Double main beam damage at the cost of your own hull (Costs 15 Energy).
- `flak`: Fire an indiscriminate scrap-based AOE blast (Costs 5 Scrap).

**Cargo Bay (Logistics & Utility):**
- `mine`: Harvest scrap from local asteroid fields (Costs 2 Energy).
- `refine <fuel|energy>`: Break down 10 Scrap into Jump Fuel or Energy Cells.
- `airlock`: Jettison scrap to escape hazards or board derelict vessels.
- `probe`: Launch a deep-space probe for telemetry (Costs 20 Scrap).
- `drone`: Deploy an automated salvage unit for passive income (Costs 10 Scrap).
- `hide`: Conceal valuable contraband in the bulkheads.

**Engineering (Power & Maintenance):**
- `repair`: Consume 5 Scrap for heavy hull repairs (+10 Hull).
- `patch`: Perform rapid emergency micro-repairs (+2 Hull).
- `reroute <room>`: Clear cooldowns for another room by draining power (Costs 15 Energy).
- `overclock`: Drastically increase energy regen, but risk starting onboard fires.
- `siphon`: Synthesize emergency Jump Fuel from raw reactor power (Costs 40 Energy).
- `vent`: Purge the ship of fires or plasma anomalies.

---

## 🛠️ Technical Architecture

### Tech Stack
- **Edge Deployment**: Cloudflare Workers
- **State Management**: Cloudflare Durable Objects
- **Networking**: Native WebSockets
- **Frontend**: HTML5, Vanilla JS, Phaser 3 (2D Game Engine)
- **Shaders**: GLSL (Custom CRT post-processing pipeline)

### File Structure
- `worker.js`: The authoritative core. Contains the Cloudflare Worker fetch handler and the `GameServer` Durable Object class managing state, ticks, and WebSocket clients.
- `public/main.js`: Client-side entry point. Manages Phaser scenes, the terminal UI, mobile responsiveness, and WebSocket communication.
- `public/crt_shader.js`: Custom post-processing shader for the retro monitor effect.
- `public/index.html`: Main entry point for the web client.

### Persistence Architecture
- **Client Identity**: On the first connection, the server assigns a unique UUID to the pilot. This ID is stored in the browser's `localStorage` (`jit_player_id`).
- **Session Restoration**: Upon reconnecting, the client sends this ID during the initial handshake. The server retrieves the existing pilot profile, restoring their name, ship membership, and current room location.
- **Server-Side Storage**: All game state (ships, pilots, galaxy data) is stored in a Cloudflare Durable Object. The server uses `this.state.storage` to ensure all data survivies worker restarts and server maintenance.
- `wrangler.toml`: Cloudflare Workers configuration file.

---

## ⚙️ Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Run the Local Environment**:
   Using Wrangler to simulate the Cloudflare edge:
   ```bash
   npx wrangler dev
   ```

3. **Launch the Game**:
   Open a browser and navigate to `http://127.0.0.1:8787` (port may vary based on Wrangler output).

4. **Deploying**:
   ```bash
   npx wrangler deploy
   ```

---

## 🛡️ License
Distributed under the ISC License. See `package.json` for details.
