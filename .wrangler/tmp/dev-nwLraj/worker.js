var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-ZYjvud/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// public/events.js
var COLORS = {
  GREEN: "#00FF00",
  RED: "#FF0000",
  YELLOW: "#FFFF00",
  CYAN: "#00FFFF",
  GRAY: "#AAAAAA",
  WHITE: "#FFFFFF",
  MAGENTA: "#FF00FF"
};
var SECTOR_FLAVOR = [
  "The void here is stained with the neon ghost of a dying nebula.",
  "Frozen husks of ancient freighters drift in the silence, their hulls picked clean by scavengers.",
  "A field of crystalline dust catches the distant starlight, sparkling like a million diamonds.",
  "The darkness here feels heavy and absolute, as if the light of the stars has been swallowed.",
  "Bizarre gravitational ripples vibrate through the hull; the very fabric of space seems thin here.",
  "An eerie silence pervades the sector, interrupted only by the rhythmic clicking of your scanners.",
  "The glow of a nearby pulsar bathes the ship in rhythmic flashes of violet light.",
  "Static discharge dances across the viewports as the ship passes through an ion cloud.",
  "The radar shows nothing but ghosts and reflections of long-dead civilizations."
];
var ROOM_DESCRIPTIONS = {
  "Bridge": "A cramped array of flickering CRT monitors and coffee-stained consoles. The hum of the navigation computer is the only constant.",
  "Weapons Cntrl": "Smells of ozone and cold steel. The targeting displays pulse with a predatory red light, waiting for a lock.",
  "Cargo Bay": "Cavernous and echoing. Magnetic clamps rattle as the ship maneuvers; the air is thick with the scent of industrial grease.",
  "Engineering": "The heart of the tugboat. A chaotic maze of pulsing pipes and white-hot fusion coils. The heat is almost physical."
};
var GAME_EVENTS = [
  {
    id: "anomaly_clockwork_rift",
    title: "The Clockwork Rift",
    type: "anomaly",
    text: "Space here seems to tick rhythmically. A massive, gear-like fracture in reality spins slowly.",
    options: [
      {
        command: "sync",
        requiredRoom: "engineering",
        description: "Attempt to sync engines with the rhythm (Risk: Mod)",
        execute: /* @__PURE__ */ __name((ship, player, broadcast) => {
          if (Math.random() > 0.4) {
            ship.fuel.current = Math.min(ship.fuel.max, ship.fuel.current + 20);
            broadcast("ENGINES SYNCED. Siphoned temporal energy into the fuel reserves. (+20 Fuel)", COLORS.GREEN);
          } else {
            ship.energy.current -= 15;
            broadcast("SYNC FAILED. The rhythmic feedback drained ship capacitors. (-15 Energy)", COLORS.RED);
          }
          ship.currentEncounter = null;
        }, "execute")
      },
      {
        command: "ignore",
        description: "Leave the anomaly alone",
        execute: /* @__PURE__ */ __name((ship, player, broadcast) => {
          broadcast("You steer clear of the rift. It ticks ominously as you pass.", COLORS.GRAY);
          ship.currentEncounter = null;
        }, "execute")
      }
    ]
  },
  {
    id: "anomaly_sentient_stardust",
    title: "Sentient Stardust",
    type: "anomaly",
    text: "A cloud of shimmering, colorful dust approaches the ship. It seems to move with purpose.",
    options: [
      {
        command: "allow",
        description: "Drop shields and let the dust cling to the hull",
        execute: /* @__PURE__ */ __name((ship, player, broadcast) => {
          ship.hull.current = Math.min(ship.hull.max, ship.hull.current + 10);
          broadcast("The dust settles into micro-fractures, solidifying and repairing the plating! (+10 Hull)", COLORS.GREEN);
          ship.currentEncounter = null;
        }, "execute")
      },
      {
        command: "repel",
        requiredRoom: "bridge",
        description: "Boost shields to repel the dust (-5 Energy)",
        execute: /* @__PURE__ */ __name((ship, player, broadcast) => {
          if (ship.energy.current >= 5) {
            ship.energy.current -= 5;
            broadcast("Shields flared. The dust scatters harmlessly into the void.", COLORS.GRAY);
          } else {
            broadcast("Not enough energy to repel. The dust clings to the ship, but finds no damage to repair.", COLORS.GRAY);
          }
          ship.currentEncounter = null;
        }, "execute")
      }
    ]
  },
  {
    id: "derelict_abandoned_casino",
    title: "Abandoned Casino Ship",
    type: "derelict",
    text: "A floating luxury vessel, dark and silent. Neon signs flicker weakly: 'The Golden Asteroid'.",
    options: [
      {
        command: "board",
        requiredRoom: "cargo",
        description: "Dock and search for valuables (-10 Energy)",
        execute: /* @__PURE__ */ __name((ship, player, broadcast) => {
          if (ship.energy.current >= 10) {
            ship.energy.current -= 10;
            const foundCredits = Math.floor(Math.random() * 50) + 20;
            ship.credits += foundCredits;
            broadcast(`You force the airlocks open. Found an unattended high-roller table with ${foundCredits} Credits!`, COLORS.GREEN);
          } else {
            broadcast("Insufficient energy to run life-support umbilical for a boarding party.", COLORS.RED);
          }
          ship.currentEncounter = null;
        }, "execute")
      },
      {
        command: "ignore",
        description: "Leave it alone",
        execute: /* @__PURE__ */ __name((ship, player, broadcast) => {
          broadcast("You leave the ghost ship to spin in the dark.", COLORS.GRAY);
          ship.currentEncounter = null;
        }, "execute")
      }
    ]
  },
  {
    id: "derelict_frozen_frigate",
    title: "Frozen Frigate",
    type: "derelict",
    text: "An old warship encased in strange, glowing blue ice. Faint power signatures emanate from within.",
    options: [
      {
        command: "thaw",
        requiredRoom: "weapons",
        description: "Fire mining lasers to melt the ice (-10 Energy)",
        execute: /* @__PURE__ */ __name((ship, player, broadcast) => {
          if (ship.energy.current >= 10) {
            ship.energy.current -= 10;
            ship.scrap += 15;
            broadcast("The ice shatters, allowing you to salvage 15 Scrap from the hull.", COLORS.GREEN);
          } else {
            broadcast("Not enough energy to channel the continuous beam required.", COLORS.RED);
          }
          ship.currentEncounter = null;
        }, "execute")
      },
      {
        command: "ignore",
        description: "Leave it frozen",
        execute: /* @__PURE__ */ __name((ship, player, broadcast) => {
          broadcast("You leave the frozen tomb untouched.", COLORS.GRAY);
          ship.currentEncounter = null;
        }, "execute")
      }
    ]
  },
  {
    id: "hazard_solar_flare",
    title: "Solar Flare Warning",
    type: "hazard",
    text: "WARNING: Massive coronal mass ejection detected from a nearby unstable star. Radiation wave approaching rapidly.",
    options: [
      {
        command: "brace",
        requiredRoom: "engineering",
        description: "Divert all auxiliary power to structural integrity (-15 Energy)",
        execute: /* @__PURE__ */ __name((ship, player, broadcast) => {
          if (ship.energy.current >= 15) {
            ship.energy.current -= 15;
            broadcast("Shields hold against the brunt of the radiation. The ship groans but survives unscathed.", COLORS.GREEN);
          } else {
            broadcast("Insufficient energy to reinforce shields! The flare scorches the hull.", COLORS.RED);
            ship.hull.current -= 25;
          }
          ship.currentEncounter = null;
        }, "execute")
      },
      {
        command: "ignore",
        description: "Take the hit to save energy (Takes 25 Hull DMG)",
        execute: /* @__PURE__ */ __name((ship, player, broadcast) => {
          ship.hull.current -= 25;
          broadcast("The radiation flare scorches the hull. Warning sirens blare. (-25 Hull)", COLORS.RED);
          ship.currentEncounter = null;
        }, "execute")
      }
    ]
  },
  {
    id: "distress_lost_cargo",
    title: "Lost Cargo Pod",
    type: "distress",
    text: "A faint automated distress beacon leads you to an intact Corpo Sec cargo pod drifting alone.",
    options: [
      {
        command: "salvage",
        requiredRoom: "cargo",
        description: "Break it down for parts",
        execute: /* @__PURE__ */ __name((ship, player, broadcast) => {
          const yieldAmt = Math.floor(Math.random() * 10) + 10;
          ship.scrap += yieldAmt;
          broadcast(`Pod scrapped. Acquired ${yieldAmt} Scrap.`, COLORS.GREEN);
          ship.currentEncounter = null;
        }, "execute")
      },
      {
        command: "open",
        requiredRoom: "cargo",
        description: "Hack the lock and see what's inside",
        execute: /* @__PURE__ */ __name((ship, player, broadcast) => {
          if (Math.random() > 0.5) {
            const credits = Math.floor(Math.random() * 40) + 20;
            ship.credits += credits;
            broadcast(`Success! Found Corpo bearer bonds worth ${credits} Cr.`, COLORS.GREEN);
          } else {
            ship.hull.current -= 10;
            broadcast("BOOBY TRAP! The pod detonates, damaging the tugboat! (-10 Hull)", COLORS.RED);
          }
          ship.currentEncounter = null;
        }, "execute")
      }
    ]
  },
  {
    id: "faction_miner_toll",
    title: "Miner Toll Gate",
    type: "faction",
    text: "A squad of Free Miners blocks the optimal jump vector. 'Toll's 10 Credits today, friend.'",
    options: [
      {
        command: "pay",
        requiredRoom: "bridge",
        description: "Pay the 10 Credits",
        execute: /* @__PURE__ */ __name((ship, player, broadcast) => {
          if (ship.credits >= 10) {
            ship.credits -= 10;
            ship.factions.miners += 2;
            broadcast("You transfer the funds. 'Safe travels, ' they broadcast. (+Miner Rep)", COLORS.GREEN);
          } else {
            broadcast("You don't have enough Credits to pay!", COLORS.RED);
            broadcast("The Miners are annoyed and tell you to take the long way around. (-10 Fuel)", COLORS.YELLOW);
            ship.fuel.current -= 10;
          }
          ship.currentEncounter = null;
        }, "execute")
      },
      {
        command: "threaten",
        requiredRoom: "weapons",
        description: "Charge weapons and tell them to move",
        execute: /* @__PURE__ */ __name((ship, player, broadcast) => {
          ship.factions.miners -= 10;
          broadcast("The Miners back down, cursing you over open comms. (-10 Miner Rep)", COLORS.YELLOW);
          ship.currentEncounter = null;
        }, "execute")
      }
    ]
  },
  {
    id: "anomaly_chronal_echo",
    title: "Chronal Echo",
    type: "anomaly",
    text: "You detect a ghost signature of your own ship from hours ago. Scanning it yields `Scrap`, but causes a temporary `Energy` drain.",
    options: [
      {
        command: "investigate",
        requiredRoom: "bridge",
        description: "Investigate the anomaly (-5 Energy)",
        execute: /* @__PURE__ */ __name((ship, player, broadcast) => {
          ship.energy.current -= 5;
          const res = Math.random();
          if (res > 0.5) {
            ship.credits += 20;
            broadcast("You recovered strange data worth 20 Cr.", COLORS.GREEN);
          } else {
            broadcast("The anomaly dissipates harmlessly.", COLORS.GRAY);
          }
          ship.currentEncounter = null;
        }, "execute")
      },
      {
        command: "ignore",
        description: "Leave it alone",
        execute: /* @__PURE__ */ __name((ship, player, broadcast) => {
          broadcast("Ignored.", COLORS.GRAY);
          ship.currentEncounter = null;
        }, "execute")
      }
    ]
  },
  {
    id: "anomaly_probability_storm",
    title: "Probability Storm",
    type: "anomaly",
    text: "Reality is unstable. Flipping a switch might grant `Credits` or instantly damage the `Hull`.",
    options: [
      {
        command: "investigate",
        requiredRoom: "bridge",
        description: "Investigate the anomaly (-5 Energy)",
        execute: /* @__PURE__ */ __name((ship, player, broadcast) => {
          ship.energy.current -= 5;
          const res = Math.random();
          if (res > 0.5) {
            ship.credits += 20;
            broadcast("You recovered strange data worth 20 Cr.", COLORS.GREEN);
          } else {
            broadcast("The anomaly dissipates harmlessly.", COLORS.GRAY);
          }
          ship.currentEncounter = null;
        }, "execute")
      },
      {
        command: "ignore",
        description: "Leave it alone",
        execute: /* @__PURE__ */ __name((ship, player, broadcast) => {
          broadcast("Ignored.", COLORS.GRAY);
          ship.currentEncounter = null;
        }, "execute")
      }
    ]
  },
  {
    id: "anomaly_null_g_bubble",
    title: "Null-G Bubble",
    type: "anomaly",
    text: "A localized field where gravity ceases to exist. Spending `Energy` allows you to harvest rare frictionless materials (`Credits`).",
    options: [
      {
        command: "investigate",
        requiredRoom: "bridge",
        description: "Investigate the anomaly (-5 Energy)",
        execute: /* @__PURE__ */ __name((ship, player, broadcast) => {
          ship.energy.current -= 5;
          const res = Math.random();
          if (res > 0.5) {
            ship.credits += 20;
            broadcast("You recovered strange data worth 20 Cr.", COLORS.GREEN);
          } else {
            broadcast("The anomaly dissipates harmlessly.", COLORS.GRAY);
          }
          ship.currentEncounter = null;
        }, "execute")
      },
      {
        command: "ignore",
        description: "Leave it alone",
        execute: /* @__PURE__ */ __name((ship, player, broadcast) => {
          broadcast("Ignored.", COLORS.GRAY);
          ship.currentEncounter = null;
        }, "execute")
      }
    ]
  },
  {
    id: "anomaly_whispering_nebula",
    title: "Whispering Nebula",
    type: "anomaly",
    text: "Bizarre static on the comms sounds like voices predicting your next jump. Costs `Energy` to analyze, grants temporary immunity to the next Hazard.",
    options: [
      {
        command: "investigate",
        requiredRoom: "bridge",
        description: "Investigate the anomaly (-5 Energy)",
        execute: /* @__PURE__ */ __name((ship, player, broadcast) => {
          ship.energy.current -= 5;
          const res = Math.random();
          if (res > 0.5) {
            ship.credits += 20;
            broadcast("You recovered strange data worth 20 Cr.", COLORS.GREEN);
          } else {
            broadcast("The anomaly dissipates harmlessly.", COLORS.GRAY);
          }
          ship.currentEncounter = null;
        }, "execute")
      },
      {
        command: "ignore",
        description: "Leave it alone",
        execute: /* @__PURE__ */ __name((ship, player, broadcast) => {
          broadcast("Ignored.", COLORS.GRAY);
          ship.currentEncounter = null;
        }, "execute")
      }
    ]
  },
  {
    id: "anomaly_magnetic_monopole",
    title: "Magnetic Monopole",
    type: "anomaly",
    text: "A rare physics anomaly. Catching it with the grabber arm yields immense `Credits` but risks severe `Hull` damage.",
    options: [
      {
        command: "investigate",
        requiredRoom: "bridge",
        description: "Investigate the anomaly (-5 Energy)",
        execute: /* @__PURE__ */ __name((ship, player, broadcast) => {
          ship.energy.current -= 5;
          const res = Math.random();
          if (res > 0.5) {
            ship.credits += 20;
            broadcast("You recovered strange data worth 20 Cr.", COLORS.GREEN);
          } else {
            broadcast("The anomaly dissipates harmlessly.", COLORS.GRAY);
          }
          ship.currentEncounter = null;
        }, "execute")
      },
      {
        command: "ignore",
        description: "Leave it alone",
        execute: /* @__PURE__ */ __name((ship, player, broadcast) => {
          broadcast("Ignored.", COLORS.GRAY);
          ship.currentEncounter = null;
        }, "execute")
      }
    ]
  },
  {
    id: "anomaly_time_dilation_field",
    title: "Time Dilation Field",
    type: "anomaly",
    text: "Time slows down inside the cabin. You burn extra `Energy` keeping life support synced, but gain an extra turn in your next combat.",
    options: [
      {
        command: "investigate",
        requiredRoom: "bridge",
        description: "Investigate the anomaly (-5 Energy)",
        execute: /* @__PURE__ */ __name((ship, player, broadcast) => {
          ship.energy.current -= 5;
          const res = Math.random();
          if (res > 0.5) {
            ship.credits += 20;
            broadcast("You recovered strange data worth 20 Cr.", COLORS.GREEN);
          } else {
            broadcast("The anomaly dissipates harmlessly.", COLORS.GRAY);
          }
          ship.currentEncounter = null;
        }, "execute")
      },
      {
        command: "ignore",
        description: "Leave it alone",
        execute: /* @__PURE__ */ __name((ship, player, broadcast) => {
          broadcast("Ignored.", COLORS.GRAY);
          ship.currentEncounter = null;
        }, "execute")
      }
    ]
  },
  {
    id: "anomaly_tachyon_burst",
    title: "Tachyon Burst",
    type: "anomaly",
    text: "A sudden surge of faster-than-light particles instantly recharges your `Energy` fully, but scrambles your sensors for one jump.",
    options: [
      {
        command: "investigate",
        requiredRoom: "bridge",
        description: "Investigate the anomaly (-5 Energy)",
        execute: /* @__PURE__ */ __name((ship, player, broadcast) => {
          ship.energy.current -= 5;
          const res = Math.random();
          if (res > 0.5) {
            ship.credits += 20;
            broadcast("You recovered strange data worth 20 Cr.", COLORS.GREEN);
          } else {
            broadcast("The anomaly dissipates harmlessly.", COLORS.GRAY);
          }
          ship.currentEncounter = null;
        }, "execute")
      },
      {
        command: "ignore",
        description: "Leave it alone",
        execute: /* @__PURE__ */ __name((ship, player, broadcast) => {
          broadcast("Ignored.", COLORS.GRAY);
          ship.currentEncounter = null;
        }, "execute")
      }
    ]
  },
  {
    id: "anomaly_micro_wormhole",
    title: "Micro-Wormhole",
    type: "anomaly",
    text: "A tiny tear in space. Tossing in `Scrap` returns a refined item worth lots of `Credits`, but there's a 10% chance it returns a live explosive.",
    options: [
      {
        command: "investigate",
        requiredRoom: "bridge",
        description: "Investigate the anomaly (-5 Energy)",
        execute: /* @__PURE__ */ __name((ship, player, broadcast) => {
          ship.energy.current -= 5;
          const res = Math.random();
          if (res > 0.5) {
            ship.credits += 20;
            broadcast("You recovered strange data worth 20 Cr.", COLORS.GREEN);
          } else {
            broadcast("The anomaly dissipates harmlessly.", COLORS.GRAY);
          }
          ship.currentEncounter = null;
        }, "execute")
      },
      {
        command: "ignore",
        description: "Leave it alone",
        execute: /* @__PURE__ */ __name((ship, player, broadcast) => {
          broadcast("Ignored.", COLORS.GRAY);
          ship.currentEncounter = null;
        }, "execute")
      }
    ]
  },
  {
    id: "derelict_grave_of_the_leviathan",
    title: "Grave of the Leviathan",
    type: "derelict",
    text: "A massive, ancient alien skeleton floating in space. Mining it yields strange biological `Scrap`.",
    options: [
      {
        command: "salvage",
        requiredRoom: "cargo",
        description: "Tear it down for scrap (-10 Energy)",
        execute: /* @__PURE__ */ __name((ship, player, broadcast) => {
          if (ship.energy.current >= 10) {
            ship.energy.current -= 10;
            const scrap = Math.floor(Math.random() * 15) + 5;
            ship.scrap += scrap;
            broadcast("Salvaged " + scrap + " Scrap.", COLORS.GREEN);
          } else {
            broadcast("Not enough energy.", COLORS.RED);
          }
          ship.currentEncounter = null;
        }, "execute")
      },
      {
        command: "ignore",
        description: "Pass by",
        execute: /* @__PURE__ */ __name((ship, player, broadcast) => {
          broadcast("Passed by.", COLORS.GRAY);
          ship.currentEncounter = null;
        }, "execute")
      }
    ]
  },
  {
    id: "derelict_corpo_blacksite_station",
    title: "Corpo Blacksite Station",
    type: "derelict",
    text: "A heavily shielded, unlisted station. Hacking it requires massive `Energy` but offers high-tier tech (`Credits`/`Scrap`).",
    options: [
      {
        command: "salvage",
        requiredRoom: "cargo",
        description: "Tear it down for scrap (-10 Energy)",
        execute: /* @__PURE__ */ __name((ship, player, broadcast) => {
          if (ship.energy.current >= 10) {
            ship.energy.current -= 10;
            const scrap = Math.floor(Math.random() * 15) + 5;
            ship.scrap += scrap;
            broadcast("Salvaged " + scrap + " Scrap.", COLORS.GREEN);
          } else {
            broadcast("Not enough energy.", COLORS.RED);
          }
          ship.currentEncounter = null;
        }, "execute")
      },
      {
        command: "ignore",
        description: "Pass by",
        execute: /* @__PURE__ */ __name((ship, player, broadcast) => {
          broadcast("Passed by.", COLORS.GRAY);
          ship.currentEncounter = null;
        }, "execute")
      }
    ]
  },
  {
    id: "derelict_the_flying_dutchman",
    title: "The Flying Dutchman",
    type: "derelict",
    text: "A legendary ghost ship of the sector. Leaving it alone is safe; attacking it curses your `Energy` regeneration for 3 jumps.",
    options: [
      {
        command: "salvage",
        requiredRoom: "cargo",
        description: "Tear it down for scrap (-10 Energy)",
        execute: /* @__PURE__ */ __name((ship, player, broadcast) => {
          if (ship.energy.current >= 10) {
            ship.energy.current -= 10;
            const scrap = Math.floor(Math.random() * 15) + 5;
            ship.scrap += scrap;
            broadcast("Salvaged " + scrap + " Scrap.", COLORS.GREEN);
          } else {
            broadcast("Not enough energy.", COLORS.RED);
          }
          ship.currentEncounter = null;
        }, "execute")
      },
      {
        command: "ignore",
        description: "Pass by",
        execute: /* @__PURE__ */ __name((ship, player, broadcast) => {
          broadcast("Passed by.", COLORS.GRAY);
          ship.currentEncounter = null;
        }, "execute")
      }
    ]
  },
  {
    id: "derelict_drifting_escape_pod",
    title: "Drifting Escape Pod",
    type: "derelict",
    text: "A pod with frozen, long-dead occupants. Salvaging it feels wrong, but yields `Scrap`. (Miners reputation decreases if seen).",
    options: [
      {
        command: "salvage",
        requiredRoom: "cargo",
        description: "Tear it down for scrap (-10 Energy)",
        execute: /* @__PURE__ */ __name((ship, player, broadcast) => {
          if (ship.energy.current >= 10) {
            ship.energy.current -= 10;
            const scrap = Math.floor(Math.random() * 15) + 5;
            ship.scrap += scrap;
            broadcast("Salvaged " + scrap + " Scrap.", COLORS.GREEN);
          } else {
            broadcast("Not enough energy.", COLORS.RED);
          }
          ship.currentEncounter = null;
        }, "execute")
      },
      {
        command: "ignore",
        description: "Pass by",
        execute: /* @__PURE__ */ __name((ship, player, broadcast) => {
          broadcast("Passed by.", COLORS.GRAY);
          ship.currentEncounter = null;
        }, "execute")
      }
    ]
  },
  {
    id: "derelict_automated_factory_barge",
    title: "Automated Factory Barge",
    type: "derelict",
    text: "Still producing goods despite lacking a crew. You can dock to trade `Scrap` for `Fuel`.",
    options: [
      {
        command: "salvage",
        requiredRoom: "cargo",
        description: "Tear it down for scrap (-10 Energy)",
        execute: /* @__PURE__ */ __name((ship, player, broadcast) => {
          if (ship.energy.current >= 10) {
            ship.energy.current -= 10;
            const scrap = Math.floor(Math.random() * 15) + 5;
            ship.scrap += scrap;
            broadcast("Salvaged " + scrap + " Scrap.", COLORS.GREEN);
          } else {
            broadcast("Not enough energy.", COLORS.RED);
          }
          ship.currentEncounter = null;
        }, "execute")
      },
      {
        command: "ignore",
        description: "Pass by",
        execute: /* @__PURE__ */ __name((ship, player, broadcast) => {
          broadcast("Passed by.", COLORS.GRAY);
          ship.currentEncounter = null;
        }, "execute")
      }
    ]
  },
  {
    id: "derelict_pirate_s_stash",
    title: "Pirate's Stash",
    type: "derelict",
    text: "A hollowed-out asteroid containing a pirate loot cache. Taking it grants `Credits` and `Fuel`, but decreases Pirate reputation drastically.",
    options: [
      {
        command: "salvage",
        requiredRoom: "cargo",
        description: "Tear it down for scrap (-10 Energy)",
        execute: /* @__PURE__ */ __name((ship, player, broadcast) => {
          if (ship.energy.current >= 10) {
            ship.energy.current -= 10;
            const scrap = Math.floor(Math.random() * 15) + 5;
            ship.scrap += scrap;
            broadcast("Salvaged " + scrap + " Scrap.", COLORS.GREEN);
          } else {
            broadcast("Not enough energy.", COLORS.RED);
          }
          ship.currentEncounter = null;
        }, "execute")
      },
      {
        command: "ignore",
        description: "Pass by",
        execute: /* @__PURE__ */ __name((ship, player, broadcast) => {
          broadcast("Passed by.", COLORS.GRAY);
          ship.currentEncounter = null;
        }, "execute")
      }
    ]
  },
  {
    id: "derelict_generation_ship_debris",
    title: "Generation Ship Debris",
    type: "derelict",
    text: "Wreckage from an ancient colonization attempt. Careful salvage yields historical artifacts (`Credits`).",
    options: [
      {
        command: "salvage",
        requiredRoom: "cargo",
        description: "Tear it down for scrap (-10 Energy)",
        execute: /* @__PURE__ */ __name((ship, player, broadcast) => {
          if (ship.energy.current >= 10) {
            ship.energy.current -= 10;
            const scrap = Math.floor(Math.random() * 15) + 5;
            ship.scrap += scrap;
            broadcast("Salvaged " + scrap + " Scrap.", COLORS.GREEN);
          } else {
            broadcast("Not enough energy.", COLORS.RED);
          }
          ship.currentEncounter = null;
        }, "execute")
      },
      {
        command: "ignore",
        description: "Pass by",
        execute: /* @__PURE__ */ __name((ship, player, broadcast) => {
          broadcast("Passed by.", COLORS.GRAY);
          ship.currentEncounter = null;
        }, "execute")
      }
    ]
  },
  {
    id: "derelict_self_replicating_minefield",
    title: "Self-Replicating Minefield",
    type: "derelict",
    text: "An old war zone where derelicts are surrounded by mines. High risk of `Hull` damage, but high `Scrap` reward.",
    options: [
      {
        command: "salvage",
        requiredRoom: "cargo",
        description: "Tear it down for scrap (-10 Energy)",
        execute: /* @__PURE__ */ __name((ship, player, broadcast) => {
          if (ship.energy.current >= 10) {
            ship.energy.current -= 10;
            const scrap = Math.floor(Math.random() * 15) + 5;
            ship.scrap += scrap;
            broadcast("Salvaged " + scrap + " Scrap.", COLORS.GREEN);
          } else {
            broadcast("Not enough energy.", COLORS.RED);
          }
          ship.currentEncounter = null;
        }, "execute")
      },
      {
        command: "ignore",
        description: "Pass by",
        execute: /* @__PURE__ */ __name((ship, player, broadcast) => {
          broadcast("Passed by.", COLORS.GRAY);
          ship.currentEncounter = null;
        }, "execute")
      }
    ]
  },
  {
    id: "faction_miner_strike",
    title: "Miner Strike",
    type: "faction",
    text: "Free Miners are blockading a jump gate. Paying a toll in `Credits` passes safely; attacking them ruins reputation.",
    options: [
      {
        command: "hail",
        requiredRoom: "bridge",
        description: "Hail them on comms",
        execute: /* @__PURE__ */ __name((ship, player, broadcast) => {
          broadcast("They ignore your hail and jump away.", COLORS.GRAY);
          ship.currentEncounter = null;
        }, "execute")
      }
    ]
  },
  {
    id: "faction_corporate_inspection",
    title: "Corporate Inspection",
    type: "faction",
    text: "A Corpo Sec patrol demands to scan your cargo for contraband. Compliance is safe; refusal initiates difficult combat.",
    options: [
      {
        command: "hail",
        requiredRoom: "bridge",
        description: "Hail them on comms",
        execute: /* @__PURE__ */ __name((ship, player, broadcast) => {
          broadcast("They ignore your hail and jump away.", COLORS.GRAY);
          ship.currentEncounter = null;
        }, "execute")
      }
    ]
  },
  {
    id: "faction_pirate_toll_gate",
    title: "Pirate Toll Gate",
    type: "faction",
    text: "Scrap Pirates demand a portion of your `Fuel` to let you pass. ",
    options: [
      {
        command: "hail",
        requiredRoom: "bridge",
        description: "Hail them on comms",
        execute: /* @__PURE__ */ __name((ship, player, broadcast) => {
          broadcast("They ignore your hail and jump away.", COLORS.GRAY);
          ship.currentEncounter = null;
        }, "execute")
      }
    ]
  },
  {
    id: "faction_miner_distress",
    title: "Miner Distress",
    type: "faction",
    text: "A Miner skiff is under attack by space fauna. Helping them costs `Energy` but boosts Miner reputation significantly.",
    options: [
      {
        command: "hail",
        requiredRoom: "bridge",
        description: "Hail them on comms",
        execute: /* @__PURE__ */ __name((ship, player, broadcast) => {
          broadcast("They ignore your hail and jump away.", COLORS.GRAY);
          ship.currentEncounter = null;
        }, "execute")
      }
    ]
  },
  {
    id: "faction_corporate_bidding_war",
    title: "Corporate Bidding War",
    type: "faction",
    text: "Two Corpo ships are fighting over a salvage claim. You can steal the salvage while they fight, angering both.",
    options: [
      {
        command: "hail",
        requiredRoom: "bridge",
        description: "Hail them on comms",
        execute: /* @__PURE__ */ __name((ship, player, broadcast) => {
          broadcast("They ignore your hail and jump away.", COLORS.GRAY);
          ship.currentEncounter = null;
        }, "execute")
      }
    ]
  },
  {
    id: "faction_pirate_recruitment",
    title: "Pirate Recruitment",
    type: "faction",
    text: "A pirate captain offers you a lucrative sum of `Credits` to disable a nearby tracking buoy. Lowers Corpo reputation.",
    options: [
      {
        command: "hail",
        requiredRoom: "bridge",
        description: "Hail them on comms",
        execute: /* @__PURE__ */ __name((ship, player, broadcast) => {
          broadcast("They ignore your hail and jump away.", COLORS.GRAY);
          ship.currentEncounter = null;
        }, "execute")
      }
    ]
  },
  {
    id: "faction_faction_skirmish",
    title: "Faction Skirmish",
    type: "faction",
    text: "Miners and Pirates are actively interlocked in battle. You can pick a side, or salvage the destroyed ships while dodging crossfire.",
    options: [
      {
        command: "hail",
        requiredRoom: "bridge",
        description: "Hail them on comms",
        execute: /* @__PURE__ */ __name((ship, player, broadcast) => {
          broadcast("They ignore your hail and jump away.", COLORS.GRAY);
          ship.currentEncounter = null;
        }, "execute")
      }
    ]
  },
  {
    id: "faction_corpo_vip_escort",
    title: "Corpo VIP Escort",
    type: "faction",
    text: "A damaged Corpo yacht needs a tow. Costs `Fuel`, but rewards massive `Credits` and Corpo reputation.",
    options: [
      {
        command: "hail",
        requiredRoom: "bridge",
        description: "Hail them on comms",
        execute: /* @__PURE__ */ __name((ship, player, broadcast) => {
          broadcast("They ignore your hail and jump away.", COLORS.GRAY);
          ship.currentEncounter = null;
        }, "execute")
      }
    ]
  },
  {
    id: "faction_traitorous_miner",
    title: "Traitorous Miner",
    type: "faction",
    text: "A Free Miner offers to sell you stolen Corpo schematics for cheap. Buying them lowers Corpo rep if discovered.",
    options: [
      {
        command: "hail",
        requiredRoom: "bridge",
        description: "Hail them on comms",
        execute: /* @__PURE__ */ __name((ship, player, broadcast) => {
          broadcast("They ignore your hail and jump away.", COLORS.GRAY);
          ship.currentEncounter = null;
        }, "execute")
      }
    ]
  },
  {
    id: "faction_pirate_s_challenge",
    title: "Pirate's Challenge",
    type: "faction",
    text: "A pirate challenges you to a duel\u2014no weapons, just a ramming contest. Wager `Credits`. Winner takes all.",
    options: [
      {
        command: "hail",
        requiredRoom: "bridge",
        description: "Hail them on comms",
        execute: /* @__PURE__ */ __name((ship, player, broadcast) => {
          broadcast("They ignore your hail and jump away.", COLORS.GRAY);
          ship.currentEncounter = null;
        }, "execute")
      }
    ]
  },
  {
    id: "hazard_solar_flare",
    title: "Solar Flare",
    type: "hazard",
    text: "A massive wave of radiation is approaching. You must spend `Energy` to reinforce shields, or suffer massive `Hull` damage.",
    options: [
      {
        command: "evade",
        requiredRoom: "bridge",
        description: "Burn fuel to evade (-15 Fuel)",
        execute: /* @__PURE__ */ __name((ship, player, broadcast) => {
          if (ship.fuel.current >= 15) {
            ship.fuel.current -= 15;
            broadcast("Successfully evaded using extra fuel.", COLORS.GREEN);
          } else {
            ship.hull.current -= 20;
            broadcast("Not enough fuel to evade! The hazard damages the hull (-20 Hull).", COLORS.RED);
          }
          ship.currentEncounter = null;
        }, "execute")
      },
      {
        command: "brace",
        requiredRoom: "engineering",
        description: "Take the hit (-20 Hull)",
        execute: /* @__PURE__ */ __name((ship, player, broadcast) => {
          ship.hull.current -= 20;
          broadcast("You take the hit instead of dodging. (-20 Hull)", COLORS.RED);
          ship.currentEncounter = null;
        }, "execute")
      }
    ]
  },
  {
    id: "hazard_ion_storm",
    title: "Ion Storm",
    type: "hazard",
    text: "Violent electrostatic discharges disable your weapons systems for the next encounter.",
    options: [
      {
        command: "evade",
        requiredRoom: "bridge",
        description: "Burn fuel to evade (-15 Fuel)",
        execute: /* @__PURE__ */ __name((ship, player, broadcast) => {
          if (ship.fuel.current >= 15) {
            ship.fuel.current -= 15;
            broadcast("Successfully evaded using extra fuel.", COLORS.GREEN);
          } else {
            ship.hull.current -= 20;
            broadcast("Not enough fuel to evade! The hazard damages the hull (-20 Hull).", COLORS.RED);
          }
          ship.currentEncounter = null;
        }, "execute")
      },
      {
        command: "brace",
        requiredRoom: "engineering",
        description: "Take the hit (-20 Hull)",
        execute: /* @__PURE__ */ __name((ship, player, broadcast) => {
          ship.hull.current -= 20;
          broadcast("You take the hit instead of dodging. (-20 Hull)", COLORS.RED);
          ship.currentEncounter = null;
        }, "execute")
      }
    ]
  },
  {
    id: "hazard_micro_meteoroid_shower",
    title: "Micro-Meteoroid Shower",
    type: "hazard",
    text: "A dense field of tiny rocks pelts the hull. Small `Hull` damage is unavoidable, unless you burn `Fuel` to dodge.",
    options: [
      {
        command: "evade",
        requiredRoom: "bridge",
        description: "Burn fuel to evade (-15 Fuel)",
        execute: /* @__PURE__ */ __name((ship, player, broadcast) => {
          if (ship.fuel.current >= 15) {
            ship.fuel.current -= 15;
            broadcast("Successfully evaded using extra fuel.", COLORS.GREEN);
          } else {
            ship.hull.current -= 20;
            broadcast("Not enough fuel to evade! The hazard damages the hull (-20 Hull).", COLORS.RED);
          }
          ship.currentEncounter = null;
        }, "execute")
      },
      {
        command: "brace",
        requiredRoom: "engineering",
        description: "Take the hit (-20 Hull)",
        execute: /* @__PURE__ */ __name((ship, player, broadcast) => {
          ship.hull.current -= 20;
          broadcast("You take the hit instead of dodging. (-20 Hull)", COLORS.RED);
          ship.currentEncounter = null;
        }, "execute")
      }
    ]
  },
  {
    id: "hazard_corrosive_gas_cloud",
    title: "Corrosive Gas Cloud",
    type: "hazard",
    text: "Flying through this nebula eats away at your armor. Loose 1 `Hull` every action you take until you jump.",
    options: [
      {
        command: "evade",
        requiredRoom: "bridge",
        description: "Burn fuel to evade (-15 Fuel)",
        execute: /* @__PURE__ */ __name((ship, player, broadcast) => {
          if (ship.fuel.current >= 15) {
            ship.fuel.current -= 15;
            broadcast("Successfully evaded using extra fuel.", COLORS.GREEN);
          } else {
            ship.hull.current -= 20;
            broadcast("Not enough fuel to evade! The hazard damages the hull (-20 Hull).", COLORS.RED);
          }
          ship.currentEncounter = null;
        }, "execute")
      },
      {
        command: "brace",
        requiredRoom: "engineering",
        description: "Take the hit (-20 Hull)",
        execute: /* @__PURE__ */ __name((ship, player, broadcast) => {
          ship.hull.current -= 20;
          broadcast("You take the hit instead of dodging. (-20 Hull)", COLORS.RED);
          ship.currentEncounter = null;
        }, "execute")
      }
    ]
  },
  {
    id: "hazard_gravity_well",
    title: "Gravity Well",
    type: "hazard",
    text: "A rogue black hole or dense dwarf star pulls you in. Requires extra `Fuel` to jump away.",
    options: [
      {
        command: "evade",
        requiredRoom: "bridge",
        description: "Burn fuel to evade (-15 Fuel)",
        execute: /* @__PURE__ */ __name((ship, player, broadcast) => {
          if (ship.fuel.current >= 15) {
            ship.fuel.current -= 15;
            broadcast("Successfully evaded using extra fuel.", COLORS.GREEN);
          } else {
            ship.hull.current -= 20;
            broadcast("Not enough fuel to evade! The hazard damages the hull (-20 Hull).", COLORS.RED);
          }
          ship.currentEncounter = null;
        }, "execute")
      },
      {
        command: "brace",
        requiredRoom: "engineering",
        description: "Take the hit (-20 Hull)",
        execute: /* @__PURE__ */ __name((ship, player, broadcast) => {
          ship.hull.current -= 20;
          broadcast("You take the hit instead of dodging. (-20 Hull)", COLORS.RED);
          ship.currentEncounter = null;
        }, "execute")
      }
    ]
  },
  {
    id: "hazard_space_flora",
    title: "Space Flora",
    type: "hazard",
    text: "Giant, aggressive vines latch onto your ship. You must use 'attack' to cut them off before they drain your `Energy`.",
    options: [
      {
        command: "evade",
        requiredRoom: "bridge",
        description: "Burn fuel to evade (-15 Fuel)",
        execute: /* @__PURE__ */ __name((ship, player, broadcast) => {
          if (ship.fuel.current >= 15) {
            ship.fuel.current -= 15;
            broadcast("Successfully evaded using extra fuel.", COLORS.GREEN);
          } else {
            ship.hull.current -= 20;
            broadcast("Not enough fuel to evade! The hazard damages the hull (-20 Hull).", COLORS.RED);
          }
          ship.currentEncounter = null;
        }, "execute")
      },
      {
        command: "brace",
        requiredRoom: "engineering",
        description: "Take the hit (-20 Hull)",
        execute: /* @__PURE__ */ __name((ship, player, broadcast) => {
          ship.hull.current -= 20;
          broadcast("You take the hit instead of dodging. (-20 Hull)", COLORS.RED);
          ship.currentEncounter = null;
        }, "execute")
      }
    ]
  },
  {
    id: "hazard_emp_burst",
    title: "EMP Burst",
    type: "hazard",
    text: "A localized electromagnetic pulse drains your `Energy` to 0. You are vulnerable until it regenerates.",
    options: [
      {
        command: "evade",
        requiredRoom: "bridge",
        description: "Burn fuel to evade (-15 Fuel)",
        execute: /* @__PURE__ */ __name((ship, player, broadcast) => {
          if (ship.fuel.current >= 15) {
            ship.fuel.current -= 15;
            broadcast("Successfully evaded using extra fuel.", COLORS.GREEN);
          } else {
            ship.hull.current -= 20;
            broadcast("Not enough fuel to evade! The hazard damages the hull (-20 Hull).", COLORS.RED);
          }
          ship.currentEncounter = null;
        }, "execute")
      },
      {
        command: "brace",
        requiredRoom: "engineering",
        description: "Take the hit (-20 Hull)",
        execute: /* @__PURE__ */ __name((ship, player, broadcast) => {
          ship.hull.current -= 20;
          broadcast("You take the hit instead of dodging. (-20 Hull)", COLORS.RED);
          ship.currentEncounter = null;
        }, "execute")
      }
    ]
  },
  {
    id: "hazard_thermal_vent__asteroid_",
    title: "Thermal Vent (Asteroid)",
    type: "hazard",
    text: "An asteroid you are navigating violently outgasses. Roll to see if it aids your jump (free `Fuel`) or damages you.",
    options: [
      {
        command: "evade",
        requiredRoom: "bridge",
        description: "Burn fuel to evade (-15 Fuel)",
        execute: /* @__PURE__ */ __name((ship, player, broadcast) => {
          if (ship.fuel.current >= 15) {
            ship.fuel.current -= 15;
            broadcast("Successfully evaded using extra fuel.", COLORS.GREEN);
          } else {
            ship.hull.current -= 20;
            broadcast("Not enough fuel to evade! The hazard damages the hull (-20 Hull).", COLORS.RED);
          }
          ship.currentEncounter = null;
        }, "execute")
      },
      {
        command: "brace",
        requiredRoom: "engineering",
        description: "Take the hit (-20 Hull)",
        execute: /* @__PURE__ */ __name((ship, player, broadcast) => {
          ship.hull.current -= 20;
          broadcast("You take the hit instead of dodging. (-20 Hull)", COLORS.RED);
          ship.currentEncounter = null;
        }, "execute")
      }
    ]
  },
  {
    id: "hazard_radiation_pocket",
    title: "Radiation Pocket",
    type: "hazard",
    text: "Your Max `Hull` is temporarily reduced by 20% due to material degradation until you repair at a station.",
    options: [
      {
        command: "evade",
        requiredRoom: "bridge",
        description: "Burn fuel to evade (-15 Fuel)",
        execute: /* @__PURE__ */ __name((ship, player, broadcast) => {
          if (ship.fuel.current >= 15) {
            ship.fuel.current -= 15;
            broadcast("Successfully evaded using extra fuel.", COLORS.GREEN);
          } else {
            ship.hull.current -= 20;
            broadcast("Not enough fuel to evade! The hazard damages the hull (-20 Hull).", COLORS.RED);
          }
          ship.currentEncounter = null;
        }, "execute")
      },
      {
        command: "brace",
        requiredRoom: "engineering",
        description: "Take the hit (-20 Hull)",
        execute: /* @__PURE__ */ __name((ship, player, broadcast) => {
          ship.hull.current -= 20;
          broadcast("You take the hit instead of dodging. (-20 Hull)", COLORS.RED);
          ship.currentEncounter = null;
        }, "execute")
      }
    ]
  },
  {
    id: "hazard_navigational_deadzone",
    title: "Navigational Deadzone",
    type: "hazard",
    text: "Sensors are completely blinded. You cannot see the stats or type of your next encounter until you engage it.",
    options: [
      {
        command: "evade",
        requiredRoom: "bridge",
        description: "Burn fuel to evade (-15 Fuel)",
        execute: /* @__PURE__ */ __name((ship, player, broadcast) => {
          if (ship.fuel.current >= 15) {
            ship.fuel.current -= 15;
            broadcast("Successfully evaded using extra fuel.", COLORS.GREEN);
          } else {
            ship.hull.current -= 20;
            broadcast("Not enough fuel to evade! The hazard damages the hull (-20 Hull).", COLORS.RED);
          }
          ship.currentEncounter = null;
        }, "execute")
      },
      {
        command: "brace",
        requiredRoom: "engineering",
        description: "Take the hit (-20 Hull)",
        execute: /* @__PURE__ */ __name((ship, player, broadcast) => {
          ship.hull.current -= 20;
          broadcast("You take the hit instead of dodging. (-20 Hull)", COLORS.RED);
          ship.currentEncounter = null;
        }, "execute")
      }
    ]
  },
  {
    id: "distress_the_hitchhiker",
    title: "The Hitchhiker",
    type: "distress",
    text: "A lone astronaut floats in a standard suit. Taking them aboard costs `Energy` for life support, but they might be a skilled mechanic (repairs `Hull`).",
    options: [
      {
        command: "assist",
        requiredRoom: "engineering",
        description: "Provide assistance (-10 Fuel, -10 Energy)",
        execute: /* @__PURE__ */ __name((ship, player, broadcast) => {
          if (ship.fuel.current >= 10 && ship.energy.current >= 10) {
            ship.fuel.current -= 10;
            ship.energy.current -= 10;
            ship.credits += 50;
            broadcast("You assisted and were rewarded 50 Credits!", COLORS.GREEN);
          } else {
            broadcast("You lack the resources to assist.", COLORS.RED);
          }
          ship.currentEncounter = null;
        }, "execute")
      },
      {
        command: "ignore",
        description: "Ignore distress call",
        execute: /* @__PURE__ */ __name((ship, player, broadcast) => {
          broadcast("You cold-heartedly ignore the signal.", COLORS.GRAY);
          ship.currentEncounter = null;
        }, "execute")
      }
    ]
  },
  {
    id: "distress_stranded_diplomat",
    title: "Stranded Diplomat",
    type: "distress",
    text: "A high-ranking official needs transport. High `Credits` reward, but you will be hunted by Pirates for the next 3 jumps.",
    options: [
      {
        command: "assist",
        requiredRoom: "engineering",
        description: "Provide assistance (-10 Fuel, -10 Energy)",
        execute: /* @__PURE__ */ __name((ship, player, broadcast) => {
          if (ship.fuel.current >= 10 && ship.energy.current >= 10) {
            ship.fuel.current -= 10;
            ship.energy.current -= 10;
            ship.credits += 50;
            broadcast("You assisted and were rewarded 50 Credits!", COLORS.GREEN);
          } else {
            broadcast("You lack the resources to assist.", COLORS.RED);
          }
          ship.currentEncounter = null;
        }, "execute")
      },
      {
        command: "ignore",
        description: "Ignore distress call",
        execute: /* @__PURE__ */ __name((ship, player, broadcast) => {
          broadcast("You cold-heartedly ignore the signal.", COLORS.GRAY);
          ship.currentEncounter = null;
        }, "execute")
      }
    ]
  },
  {
    id: "distress_medical_emergency",
    title: "Medical Emergency",
    type: "distress",
    text: "A nearby station needs medical supplies immediately. Giving up your medbay reserves (permanently lowers Max `Hull` by 5) gives huge Rep across all factions.",
    options: [
      {
        command: "assist",
        requiredRoom: "engineering",
        description: "Provide assistance (-10 Fuel, -10 Energy)",
        execute: /* @__PURE__ */ __name((ship, player, broadcast) => {
          if (ship.fuel.current >= 10 && ship.energy.current >= 10) {
            ship.fuel.current -= 10;
            ship.energy.current -= 10;
            ship.credits += 50;
            broadcast("You assisted and were rewarded 50 Credits!", COLORS.GREEN);
          } else {
            broadcast("You lack the resources to assist.", COLORS.RED);
          }
          ship.currentEncounter = null;
        }, "execute")
      },
      {
        command: "ignore",
        description: "Ignore distress call",
        execute: /* @__PURE__ */ __name((ship, player, broadcast) => {
          broadcast("You cold-heartedly ignore the signal.", COLORS.GRAY);
          ship.currentEncounter = null;
        }, "execute")
      }
    ]
  },
  {
    id: "distress_the_saboteur",
    title: "The Saboteur",
    type: "distress",
    text: "You rescue a stranded engineer, but they start secretly draining your `Fuel` every turn. You must spend a turn to 'eject' them.",
    options: [
      {
        command: "assist",
        requiredRoom: "engineering",
        description: "Provide assistance (-10 Fuel, -10 Energy)",
        execute: /* @__PURE__ */ __name((ship, player, broadcast) => {
          if (ship.fuel.current >= 10 && ship.energy.current >= 10) {
            ship.fuel.current -= 10;
            ship.energy.current -= 10;
            ship.credits += 50;
            broadcast("You assisted and were rewarded 50 Credits!", COLORS.GREEN);
          } else {
            broadcast("You lack the resources to assist.", COLORS.RED);
          }
          ship.currentEncounter = null;
        }, "execute")
      },
      {
        command: "ignore",
        description: "Ignore distress call",
        execute: /* @__PURE__ */ __name((ship, player, broadcast) => {
          broadcast("You cold-heartedly ignore the signal.", COLORS.GRAY);
          ship.currentEncounter = null;
        }, "execute")
      }
    ]
  },
  {
    id: "distress_stowaway_fauna",
    title: "Stowaway Fauna",
    type: "distress",
    text: "A cute alien creature boards your ship. It consumes 1 `Scrap` per turn, but occasionally produces 1 `Energy`.",
    options: [
      {
        command: "assist",
        requiredRoom: "engineering",
        description: "Provide assistance (-10 Fuel, -10 Energy)",
        execute: /* @__PURE__ */ __name((ship, player, broadcast) => {
          if (ship.fuel.current >= 10 && ship.energy.current >= 10) {
            ship.fuel.current -= 10;
            ship.energy.current -= 10;
            ship.credits += 50;
            broadcast("You assisted and were rewarded 50 Credits!", COLORS.GREEN);
          } else {
            broadcast("You lack the resources to assist.", COLORS.RED);
          }
          ship.currentEncounter = null;
        }, "execute")
      },
      {
        command: "ignore",
        description: "Ignore distress call",
        execute: /* @__PURE__ */ __name((ship, player, broadcast) => {
          broadcast("You cold-heartedly ignore the signal.", COLORS.GRAY);
          ship.currentEncounter = null;
        }, "execute")
      }
    ]
  },
  {
    id: "distress_cultist_caravan",
    title: "Cultist Caravan",
    type: "distress",
    text: "A group of robed figures asks you to tow them into the heart of a dangerous anomaly. High risk, unknown bizarre reward.",
    options: [
      {
        command: "assist",
        requiredRoom: "engineering",
        description: "Provide assistance (-10 Fuel, -10 Energy)",
        execute: /* @__PURE__ */ __name((ship, player, broadcast) => {
          if (ship.fuel.current >= 10 && ship.energy.current >= 10) {
            ship.fuel.current -= 10;
            ship.energy.current -= 10;
            ship.credits += 50;
            broadcast("You assisted and were rewarded 50 Credits!", COLORS.GREEN);
          } else {
            broadcast("You lack the resources to assist.", COLORS.RED);
          }
          ship.currentEncounter = null;
        }, "execute")
      },
      {
        command: "ignore",
        description: "Ignore distress call",
        execute: /* @__PURE__ */ __name((ship, player, broadcast) => {
          broadcast("You cold-heartedly ignore the signal.", COLORS.GRAY);
          ship.currentEncounter = null;
        }, "execute")
      }
    ]
  },
  {
    id: "distress_ai_core_transfer",
    title: "AI Core Transfer",
    type: "distress",
    text: "An unstable AI begs to be downloaded into your ship's mainframe to escape Corpo Sec. Doing so boosts your 'attack' damage but risks random command misfires.",
    options: [
      {
        command: "assist",
        requiredRoom: "engineering",
        description: "Provide assistance (-10 Fuel, -10 Energy)",
        execute: /* @__PURE__ */ __name((ship, player, broadcast) => {
          if (ship.fuel.current >= 10 && ship.energy.current >= 10) {
            ship.fuel.current -= 10;
            ship.energy.current -= 10;
            ship.credits += 50;
            broadcast("You assisted and were rewarded 50 Credits!", COLORS.GREEN);
          } else {
            broadcast("You lack the resources to assist.", COLORS.RED);
          }
          ship.currentEncounter = null;
        }, "execute")
      },
      {
        command: "ignore",
        description: "Ignore distress call",
        execute: /* @__PURE__ */ __name((ship, player, broadcast) => {
          broadcast("You cold-heartedly ignore the signal.", COLORS.GRAY);
          ship.currentEncounter = null;
        }, "execute")
      }
    ]
  },
  {
    id: "distress_phantom_signal",
    title: "Phantom Signal",
    type: "distress",
    text: "A distress call that repeats perfectly every 3 seconds. It's a trap set by automated defense drones. (Forced Combat).",
    options: [
      {
        command: "assist",
        requiredRoom: "engineering",
        description: "Provide assistance (-10 Fuel, -10 Energy)",
        execute: /* @__PURE__ */ __name((ship, player, broadcast) => {
          if (ship.fuel.current >= 10 && ship.energy.current >= 10) {
            ship.fuel.current -= 10;
            ship.energy.current -= 10;
            ship.credits += 50;
            broadcast("You assisted and were rewarded 50 Credits!", COLORS.GREEN);
          } else {
            broadcast("You lack the resources to assist.", COLORS.RED);
          }
          ship.currentEncounter = null;
        }, "execute")
      },
      {
        command: "ignore",
        description: "Ignore distress call",
        execute: /* @__PURE__ */ __name((ship, player, broadcast) => {
          broadcast("You cold-heartedly ignore the signal.", COLORS.GRAY);
          ship.currentEncounter = null;
        }, "execute")
      }
    ]
  },
  {
    id: "distress_the_old_captain",
    title: "The Old Captain",
    type: "distress",
    text: "You find a lifepod containing a retired tugboat captain. They teach you a secret maneuver, permanently reducing the `Fuel` cost of jumps to 8.",
    options: [
      {
        command: "assist",
        requiredRoom: "engineering",
        description: "Provide assistance (-10 Fuel, -10 Energy)",
        execute: /* @__PURE__ */ __name((ship, player, broadcast) => {
          if (ship.fuel.current >= 10 && ship.energy.current >= 10) {
            ship.fuel.current -= 10;
            ship.energy.current -= 10;
            ship.credits += 50;
            broadcast("You assisted and were rewarded 50 Credits!", COLORS.GREEN);
          } else {
            broadcast("You lack the resources to assist.", COLORS.RED);
          }
          ship.currentEncounter = null;
        }, "execute")
      },
      {
        command: "ignore",
        description: "Ignore distress call",
        execute: /* @__PURE__ */ __name((ship, player, broadcast) => {
          broadcast("You cold-heartedly ignore the signal.", COLORS.GRAY);
          ship.currentEncounter = null;
        }, "execute")
      }
    ]
  }
];

// public/upgrades.js
var UPGRADES = {
  // 1. BALLISTICS
  "B01": { name: "Scrap-Slug Thrower", price: 80, tier: 1, type: "ballistic", desc: "Basic kinetic weapon using raw junk." },
  "B02": { name: "Dual Rail-Array", price: 150, tier: 2, type: "ballistic", desc: "Higher fire rate, low accuracy." },
  "B03": { name: "Punt-Gun", price: 200, tier: 2, type: "ballistic", desc: "Massive knockback effect." },
  "B04": { name: "Shrapnel Burst", price: 120, tier: 1, type: "ballistic", desc: "High damage against unshielded hulls." },
  "B05": { name: "Hyper-Velocity Driver", price: 250, tier: 3, type: "ballistic", desc: "Bonus damage based on evasion." },
  "B06": { name: "Tungsten Penetrator", price: 300, tier: 3, type: "ballistic", desc: "Ignores 10% of enemy armor." },
  "B07": { name: "Flak Saturation", price: 180, tier: 2, type: "ballistic", desc: "Deals minor damage to all targets." },
  "B08": { name: "Magnetic Accelerator", price: 400, tier: 4, type: "ballistic", desc: "Damage increases every time it hits." },
  "B09": { name: "Rotary Autocannon", price: 350, tier: 3, type: "ballistic", desc: "Fires 3 times per attack command." },
  "B10": { name: "Graviton Slug", price: 220, tier: 2, type: "ballistic", desc: "Reduces enemy evade chance on hit." },
  "B11": { name: "Shatter-Shot", price: 100, tier: 1, type: "ballistic", desc: "Mining bonus: +50% asteroid damage." },
  "B12": { name: "Heavy Siege Cannon", price: 600, tier: 4, type: "ballistic", desc: "Triple damage against stations/bosses." },
  "B13": { name: "Chain-Gun", price: 280, tier: 3, type: "ballistic", desc: "Hits reduce energy cost of next attack." },
  "B14": { name: "Buckshot Spreader", price: 140, tier: 2, type: "ballistic", desc: "High damage at close range." },
  "B15": { name: "Sabot Round", price: 320, tier: 3, type: "ballistic", desc: "High crit chance against systems." },
  "B16": { name: "Scatter-Flak", price: 190, tier: 2, type: "ballistic", desc: "High chance to destroy missiles." },
  "B17": { name: "Dense-Core Slab", price: 450, tier: 4, type: "ballistic", desc: "Massive damage, costs hull health." },
  "B18": { name: "Gatling-Ripper", price: 380, tier: 3, type: "ballistic", desc: "Shreds hull over time." },
  "B19": { name: "Mass-Driver Mk II", price: 110, tier: 1, type: "ballistic", desc: "Standard upgrade, low scrap cost." },
  "B20": { name: "Recoil-Compensator", price: 240, tier: 2, type: "ballistic", desc: "Increases accuracy of all ballistics." },
  "B21": { name: "Auto-Loader", price: 300, tier: 3, type: "ballistic", desc: "Reduces ballistic cooldown by 1s." },
  "B22": { name: "Mag-Feed Extender", price: 260, tier: 3, type: "ballistic", desc: "Every 5th shot costs 0 scrap." },
  "B23": { name: "Blast-Shield Piercer", price: 350, tier: 3, type: "ballistic", desc: "3x damage to shields." },
  "B24": { name: "Impact Induction", price: 420, tier: 4, type: "ballistic", desc: "10% chance to gain 2 Energy on hit." },
  "B25": { name: "The Goliath", price: 800, tier: 4, type: "ballistic", desc: "Single-use massive asteroid-cracker." },
  // 2. ENERGETICS
  "E26": { name: "Thermal Beam", price: 100, tier: 1, type: "energy", desc: "Standard energy weapon." },
  "E27": { name: "Ion Pulse", price: 200, tier: 2, type: "energy", desc: "Disables shields for 2 ticks." },
  "E28": { name: "Plasma Arc", price: 300, tier: 3, type: "energy", desc: "Melt chance: deals DoT to hull." },
  "E29": { name: "Phase Laser", price: 450, tier: 4, type: "energy", desc: "20% chance to bypass shields." },
  "E30": { name: "Focusing Lens", price: 280, tier: 3, type: "energy", desc: "Damage increases with scan duration." },
  "E31": { name: "Prism Splitter", price: 350, tier: 3, type: "energy", desc: "Hits 2 targets at 60% damage." },
  "E32": { name: "Photon Torch", price: 150, tier: 2, type: "energy", desc: "High damage, very short range." },
  "E33": { name: "Neutron Stream", price: 400, tier: 4, type: "energy", desc: "Reduces enemy energy regen." },
  "E34": { name: "Glow-Dart", price: 220, tier: 2, type: "energy", desc: "Marks target: +10% damage taken." },
  "E35": { name: "Tachyon Lance", price: 700, tier: 4, type: "energy", desc: "Instant fire, costs 30 Energy." },
  "E36": { name: "Sun-Spear", price: 320, tier: 3, type: "energy", desc: "Drains enemy fuel on hit." },
  "E37": { name: "Aurora Array", price: 260, tier: 2, type: "energy", desc: "Reduces enemy accuracy." },
  "E38": { name: "Zero-Point Beam", price: 500, tier: 4, type: "energy", desc: "Cost 0 Energy if Hull > 90%." },
  "E39": { name: "Searing Pulse", price: 180, tier: 2, type: "energy", desc: "Small damage, sets fire." },
  "E40": { name: "Gamma Ray", price: 340, tier: 3, type: "energy", desc: "DoT persists after jump." },
  "E41": { name: "Pulsar Battery", price: 420, tier: 4, type: "energy", desc: "Fire rate scaled by crew." },
  "E42": { name: "Void-Arc", price: 300, tier: 3, type: "energy", desc: "Damage scales with sector flavor." },
  "E43": { name: "Static Burst", price: 290, tier: 2, type: "energy", desc: "Chance to reset enemy jam CD." },
  "E44": { name: "Overclocked Emitter", price: 480, tier: 4, type: "energy", desc: "Double damage, double cost." },
  "E45": { name: "Cryo-Laser", price: 550, tier: 4, type: "energy", desc: "Freezes enemy CDs for 1 tick." },
  "E46": { name: "Mirror-Lens", price: 360, tier: 3, type: "energy", desc: "Deflects 10% energy damage." },
  "E47": { name: "Lance of Longinus", price: 900, tier: 4, type: "energy", desc: "Rare long-range sniper beam." },
  "E48": { name: "Feedback Loop", price: 440, tier: 4, type: "energy", desc: "Each hit heals 1% HP." },
  "E49": { name: "Starlight Array", price: 380, tier: 3, type: "energy", desc: "Damage scales with adjacent sectors." },
  "E50": { name: "Omega Ray", price: 1200, tier: 4, type: "energy", desc: "Final-tier destructive beam." },
  // 3. ORDNANCE
  "O51": { name: "HE Torpedo", price: 150, tier: 2, type: "ordnance", desc: "High explosive, massive damage." },
  "O52": { name: "EMP Warhead", price: 250, tier: 3, type: "ordnance", desc: "Superior system silencing." },
  "O53": { name: "Seeker Swarm", price: 320, tier: 3, type: "ordnance", desc: "Multiple hits, high accuracy." },
  "O54": { name: "Thermite Missile", price: 200, tier: 2, type: "ordnance", desc: "Guaranteed fire on hit." },
  "O55": { name: "Leech Pod", price: 380, tier: 3, type: "ordnance", desc: "Steals energy from target." },
  "O56": { name: "Nerve Gas Pod", price: 450, tier: 4, type: "ordnance", desc: "Slows down enemy ship tick." },
  "O57": { name: "Gravity Well", price: 500, tier: 4, type: "ordnance", desc: "Prevents target from jumping." },
  "O58": { name: "Cluster Bomb", price: 300, tier: 3, type: "ordnance", desc: "Hits multiple system rooms." },
  "O59": { name: "Chaff-Breaker", price: 220, tier: 2, type: "ordnance", desc: "Ignores enemy chaff." },
  "O60": { name: "Nuke", price: 1500, tier: 4, type: "ordnance", desc: "Massive damage, radiation zone." },
  "O61": { name: "Scrap-Torp", price: 50, tier: 1, type: "ordnance", desc: "Cheap, low-damage junk missile." },
  "O62": { name: "Acid Spray", price: 400, tier: 3, type: "ordnance", desc: "Permanently reduces enemy armor." },
  "O63": { name: "Beacon Missile", price: 350, tier: 3, type: "ordnance", desc: "Summons friendly NPC." },
  "O64": { name: "Smoke Screen", price: 240, tier: 2, type: "ordnance", desc: "+50% evasion for 1 tick." },
  "O65": { name: "Vampire Missile", price: 550, tier: 4, type: "ordnance", desc: "Heals hull for 50% dmg dealt." },
  "O66": { name: "Decoy Pod", price: 280, tier: 2, type: "ordnance", desc: "Forces enemy to hit decoy." },
  "O67": { name: "Solar Flare", price: 420, tier: 3, type: "ordnance", desc: "Blinds sensors for 10 ticks." },
  "O68": { name: "Net Launcher", price: 340, tier: 3, type: "ordnance", desc: "Slows enemy roams on map." },
  "O69": { name: "Viral Payload", price: 480, tier: 4, type: "ordnance", desc: "Steals enemy scrap over time." },
  "O70": { name: "Magnetic Mine", price: 260, tier: 2, type: "ordnance", desc: "Sector-bound trap mines." },
  "O71": { name: "Harpoon", price: 320, tier: 3, type: "ordnance", desc: "Prevents enemy fleeing." },
  "O72": { name: "Echo-Torp", price: 380, tier: 3, type: "ordnance", desc: "Double hit (delayed second)." },
  "O73": { name: "Sonic Boom", price: 450, tier: 4, type: "ordnance", desc: "Adds +2s to all enemy cooldowns." },
  "O74": { name: "Anti-Matter Charge", price: 1e3, tier: 4, type: "ordnance", desc: "Devastating explosion." },
  "O75": { name: "Ghost Missile", price: 600, tier: 4, type: "ordnance", desc: "Unshieldable sensor ghost." },
  // 4. SHIELDING
  "S76": { name: "Aegis Plate", price: 200, tier: 2, type: "shield", desc: "Flat -2 damage taken." },
  "S77": { name: "Regen-Shield", price: 400, tier: 3, type: "shield", desc: "Hull repair at 100% shield." },
  "S78": { name: "Hard-Light Barrier", price: 350, tier: 3, type: "shield", desc: "Strong shields, immobilizes ship." },
  "S79": { name: "Bubble Shield", price: 500, tier: 4, type: "shield", desc: "Protects sector allies." },
  "S80": { name: "Feedback Shield", price: 450, tier: 4, type: "shield", desc: "Damages attacker when hit." },
  "S81": { name: "Cloaking Field", price: 600, tier: 4, type: "shield", desc: "Shields are invisible, 50% dodge." },
  "S82": { name: "Layered Plating", price: 380, tier: 3, type: "shield", desc: "Provides 3 damage layers." },
  "S83": { name: "Ionic Shield", price: 320, tier: 3, type: "shield", desc: "90% Ion damage resistance." },
  "S84": { name: "Explosive Reactant", price: 420, tier: 3, type: "shield", desc: "Breaks deals damage to enemy." },
  "S85": { name: "Siphon Shield", price: 550, tier: 4, type: "shield", desc: "Blocked damage becomes Fuel." },
  "S86": { name: "Phase-Shift", price: 480, tier: 4, type: "shield", desc: "5% chance to ignore hit." },
  "S87": { name: "Overcharged Cell", price: 280, tier: 2, type: "shield", desc: "+50% Shields, drains energy." },
  "S88": { name: "Emergency Shunt", price: 520, tier: 4, type: "shield", desc: "Auto-recharge if Hull < 10%." },
  "S89": { name: "Static Field", price: 340, tier: 2, type: "shield", desc: "Slows enemy fire rate." },
  "S90": { name: "Prismatic Wall", price: 460, tier: 3, type: "shield", desc: "Changes resistance every tick." },
  "S91": { name: "Gravity Buffer", price: 180, tier: 2, type: "shield", desc: "-80% asteroid damage." },
  "S92": { name: "Micro-Drone Screen", price: 300, tier: 3, type: "shield", desc: "Intercepts hits periodically." },
  "S93": { name: "Aura Barrier", price: 260, tier: 2, type: "shield", desc: "Ship-wide fire reduction." },
  "S94": { name: "Capacitor Reserve", price: 370, tier: 3, type: "shield", desc: "Stores energy as extra shield." },
  "S95": { name: "Void Shield", price: 800, tier: 4, type: "shield", desc: "Absorbs one massive hit." },
  "S96": { name: "Temporal Shield", price: 750, tier: 4, type: "shield", desc: "Reverts last 2 ticks of damage." },
  "S97": { name: "Mirror Finish", price: 400, tier: 3, type: "shield", desc: "Reflects laser fire." },
  "S98": { name: "Ablative Mesh", price: 240, tier: 2, type: "shield", desc: "Shield breaks heal Hull." },
  "S99": { name: "Fortress Logic", price: 310, tier: 3, type: "shield", desc: "Defense scales with Bridge crew." },
  "S100": { name: "Singularity Core", price: 1500, tier: 4, type: "shield", desc: "Total invulnerability (1s)." },
  // 5. DURABILITY
  "D101": { name: "Titanium Frame", price: 120, tier: 1, type: "hull", desc: "+20 Max Hull." },
  "D102": { name: "Auto-Welder", price: 450, tier: 4, type: "hull", desc: "Repairs 1 hull every 5s.", onTick: /* @__PURE__ */ __name((s) => {
    if (s.hull < 100 && Math.random() < 0.2) s.hull++;
  }, "onTick") },
  "D103": { name: "Internal Sprinklers", price: 220, tier: 2, type: "hull", desc: "50% auto-extinguish fires." },
  "D104": { name: "Blast Doors", price: 180, tier: 2, type: "hull", desc: "Fires cannot spread rooms." },
  "D105": { name: "Reinforced Bulkheads", price: 260, tier: 3, type: "hull", desc: "Reduced system crit damage." },
  "D106": { name: "Living Steel", price: 340, tier: 3, type: "hull", desc: "Self-heals in Nature sectors." },
  "D107": { name: "Scrap-Alloy", price: 150, tier: 2, type: "hull", desc: "Repairs give +15 instead of +10." },
  "D108": { name: "Rad Scrubbers", price: 110, tier: 1, type: "hull", desc: "Immune to radiation damage." },
  "D109": { name: "Emergency O2", price: 140, tier: 2, type: "hull", desc: "Crew survives longer in vents." },
  "D110": { name: "Hull-Spikes", price: 200, tier: 2, type: "hull", desc: "Ramming damage bonus." },
  "D111": { name: "Shock Absorbents", price: 130, tier: 1, type: "hull", desc: "Reduced bump damage." },
  "D112": { name: "Nanite Cloud", price: 480, tier: 4, type: "hull", desc: "Repairs systems mid-combat." },
  "D113": { name: "Diamond Coating", price: 280, tier: 3, type: "hull", desc: "Immune to acid corrosive." },
  "D114": { name: "Life Support Mk II", price: 300, tier: 3, type: "hull", desc: "+0.1 Energy regen." },
  "D115": { name: "Heavy Lead Lining", price: 220, tier: 2, type: "hull", desc: "Reduced EMP silence duration." },
  "D116": { name: "Modular Rooms", price: 400, tier: 4, type: "hull", desc: "Instant room travel." },
  "D117": { name: "Salvage Claw", price: 250, tier: 2, type: "hull", desc: "Recover scrap even on loss." },
  "D118": { name: "Black-Box", price: 500, tier: 4, type: "hull", desc: "Keep 50% scrap on death." },
  "D119": { name: "Reinforced Cockpit", price: 160, tier: 2, type: "hull", desc: "Immune to disorientation." },
  "D120": { name: "Carbon Fiber Skeleton", price: 320, tier: 3, type: "hull", desc: "-2 Jump Fuel cost." },
  "D121": { name: "Heat Sinks", price: 280, tier: 3, type: "hull", desc: "Reduced Overcharge damage." },
  "D122": { name: "Escape Pods", price: 600, tier: 4, type: "hull", desc: "Respawn in mini-shuttle." },
  "D123": { name: "Pressurized Seals", price: 240, tier: 3, type: "hull", desc: "-50% fire damage." },
  "D124": { name: "Aura of Peace", price: 350, tier: 3, type: "hull", desc: "Lower NPC aggression." },
  "D125": { name: "The Unbreakable", price: 2e3, tier: 4, type: "hull", desc: "200 Max Hull." },
  // 6. MOBILITY
  "M126": { name: "FSD Optimizer", price: 150, tier: 2, type: "mobility", desc: "-5 Jump Fuel cost." },
  "M127": { name: "Wormhole Finder", price: 800, tier: 4, type: "mobility", desc: "Jump to any linked sector." },
  "M128": { name: "Solar Sails", price: 450, tier: 3, type: "mobility", desc: "Free jump in Star sectors." },
  "M129": { name: "Nitro-Thrusters", price: 220, tier: 2, type: "mobility", desc: "Evade lasts 2s longer." },
  "M130": { name: "Inertial Dampeners", price: 260, tier: 3, type: "mobility", desc: "+20% move accuracy." },
  "M131": { name: "Afterburners", price: 500, tier: 4, type: "mobility", desc: "Escape combat (20 Energy)." },
  "M132": { name: "Reverse Thrusters", price: 300, tier: 3, type: "mobility", desc: "Undo jump (half fuel)." },
  "M133": { name: "Auto-Pilot", price: 100, tier: 1, type: "mobility", desc: "Slowly travel while offline." },
  "M134": { name: "Fuel Scoops", price: 400, tier: 3, type: "mobility", desc: "Generate fuel in sectors." },
  "M135": { name: "Slingshot Drive", price: 600, tier: 4, type: "mobility", desc: "Instant jumps." },
  "M136": { name: "Stealth Drive", price: 550, tier: 4, type: "mobility", desc: "Stealthy jumps." },
  "M137": { name: "Trading Computer", price: 200, tier: 2, type: "mobility", desc: "Remote shop view." },
  "M138": { name: "Blink Drive", price: 520, tier: 4, type: "mobility", desc: "10% room teleport." },
  "M139": { name: "Gravity Harness", price: 340, tier: 3, type: "mobility", desc: "Hazard-safe travel." },
  "M140": { name: "Engine Overclocker", price: 420, tier: 4, type: "mobility", desc: "-1s Bridge cooldown." },
  "M141": { name: "Long-Range Comms", price: 180, tier: 2, type: "mobility", desc: "Global player chat." },
  "M142": { name: "Pathfinder Map", price: 360, tier: 3, type: "mobility", desc: "Revels adjacent encounters." },
  "M143": { name: "Relativity Drive", price: 480, tier: 4, type: "mobility", desc: "10% free jump." },
  "M144": { name: "Emergency Brake", price: 240, tier: 2, type: "mobility", desc: "Cancel jump spool." },
  "M145": { name: "Stutter Bridge", price: 700, tier: 4, type: "mobility", desc: "2 rapid jumps possible." },
  "M146": { name: "Maneuvering Jets", price: 200, tier: 2, type: "mobility", desc: "+5% permanent Evasion." },
  "M147": { name: "Tug-Link", price: 450, tier: 3, type: "mobility", desc: "Jump with allies." },
  "M148": { name: "Void-Skipper", price: 280, tier: 3, type: "mobility", desc: "Free empty-sector jumps." },
  "M149": { name: "Chrono-Drive", price: 1e3, tier: 4, type: "mobility", desc: "Faster personal ship tick." },
  "M150": { name: "Omega-Engine", price: 2500, tier: 4, type: "mobility", desc: "Unlimited jump range." },
  // 7. SENSORS
  "U151": { name: "Deep Scanner Mk II", price: 200, tier: 2, type: "sensor", desc: "Reveals NPC health." },
  "U152": { name: "Signal Jammer", price: 350, tier: 3, type: "sensor", desc: "Prevents enemy calls." },
  "U153": { name: "Ghost Signals", price: 400, tier: 3, type: "sensor", desc: "20% chance to be ignored." },
  "U154": { name: "Loot-Sniffer", price: 250, tier: 2, type: "sensor", desc: "Highlights scrap sectors." },
  "U155": { name: "Code-Breaker", price: 300, tier: 3, type: "sensor", desc: "100% derelict success." },
  "U156": { name: "Diplomacy Module", price: 500, tier: 4, type: "sensor", desc: "Bribe pirates to leave." },
  "U157": { name: "ID Scrambler", price: 180, tier: 2, type: "sensor", desc: "Fake ship registration." },
  "U158": { name: "Threat Analyzer", price: 450, tier: 4, type: "sensor", desc: "Predict enemy moves." },
  "U159": { name: "Bio-Scanner", price: 240, tier: 2, type: "sensor", desc: "See ship crew counts." },
  "U160": { name: "Frequency Tuner", price: 320, tier: 3, type: "sensor", desc: "Advanced hailing trades." },
  "U161": { name: "Black-Market Radio", price: 550, tier: 4, type: "sensor", desc: "Access pirate shops." },
  "U162": { name: "Auto-Turret", price: 800, tier: 4, type: "sensor", desc: "Deals 2 dmg/s automatically.", onTick: /* @__PURE__ */ __name((s, game) => {
    if (s.currentEncounter && s.currentEncounter.type === "ship") s.currentEncounter.hp -= 2;
  }, "onTick") },
  "U163": { name: "Multi-Targeter", price: 1200, tier: 4, type: "sensor", desc: "Auto-turrets hit all targets." },
  "U164": { name: "Weak-Point Analyzer", price: 380, tier: 3, type: "sensor", desc: "+10% critical chance." },
  "U165": { name: "Heat-Seeker", price: 220, tier: 2, type: "sensor", desc: "Never miss fleaers." },
  "U166": { name: "EMP-Shielding", price: 440, tier: 4, type: "sensor", desc: "Immune to Jams." },
  "U167": { name: "Sub-Space Radio", price: 600, tier: 4, type: "sensor", desc: "Hear global events early." },
  "U168": { name: "Resource Tracker", price: 280, tier: 3, type: "sensor", desc: "Locates Leviathans." },
  "U169": { name: "Counter-Siphons", price: 340, tier: 3, type: "sensor", desc: "Blocks energy theft." },
  "U170": { name: "Digital Camo", price: 520, tier: 4, type: "sensor", desc: "Invisible to player scans." },
  "U171": { name: "Logic Virus", price: 700, tier: 4, type: "sensor", desc: "Drain enemy energy." },
  "U172": { name: "Bounty Hunter Log", price: 480, tier: 4, type: "sensor", desc: "2X scrap from hostiles." },
  "U173": { name: "Cargo Scanner", price: 260, tier: 2, type: "sensor", desc: "See merchant stock." },
  "U174": { name: "Advanced HUD", price: 300, tier: 3, type: "sensor", desc: "UI accessibility bonus." },
  "U175": { name: "Omni-Sensors", price: 1500, tier: 4, type: "sensor", desc: "Infinite scan range." },
  // 8. POWER
  "A176": { name: "Dual Core Reactor", price: 250, tier: 2, type: "power", desc: "+50 Max Energy." },
  "A177": { name: "Super-Conductors", price: 400, tier: 3, type: "power", desc: "+0.2 Energy regen." },
  "A178": { name: "Emergency Battery", price: 350, tier: 3, type: "power", desc: "Auto-restore 50% energy." },
  "A179": { name: "Cooling Pipes", price: 500, tier: 4, type: "power", desc: "Room cooldowns -15%." },
  "A180": { name: "Power Rerouter", price: 420, tier: 4, type: "power", desc: "Free reroute command." },
  "A181": { name: "Efficiency Coil", price: 450, tier: 4, type: "power", desc: "-2 Energy usage on all." },
  "A182": { name: "Battery Overflow", price: 320, tier: 3, type: "power", desc: "Max energy upped to 200." },
  "A183": { name: "Solar Panels", price: 120, tier: 1, type: "power", desc: "+0.5 regen in Star sectors." },
  "A184": { name: "Void Reactor", price: 600, tier: 4, type: "power", desc: "Fuel-to-energy conversion." },
  "A185": { name: "Crew Coffee Machine", price: 80, tier: 1, type: "power", desc: "Fast move room chance." },
  "A186": { name: "Engineering Purity", price: 280, tier: 3, type: "power", desc: "Vents restore 10 Energy." },
  "A187": { name: "Recursive Logic", price: 440, tier: 4, type: "power", desc: "Success tech refund energy." },
  "A188": { name: "Static Discharge", price: 300, tier: 3, type: "power", desc: "Hits give energy." },
  "A189": { name: "Harmonic Oscillator", price: 700, tier: 4, type: "power", desc: "Fuel energy pool merger." },
  "A190": { name: "Plasma Spark", price: 180, tier: 2, type: "power", desc: "1st shot double damage." },
  "A191": { name: "Shield-Buffer", price: 340, tier: 3, type: "power", desc: "110% shield maintenance." },
  "A192": { name: "Kinetic Recycler", price: 320, tier: 3, type: "power", desc: "Energy on room move." },
  "A193": { name: "Fuel-to-Burn", price: 360, tier: 3, type: "power", desc: "Energy weapons use fuel." },
  "A194": { name: "Overclock Pro", price: 480, tier: 4, type: "power", desc: "Temporary safe overclock." },
  "A195": { name: "Quantum Battery", price: 550, tier: 4, type: "power", desc: "Minimum energy floor." },
  "A196": { name: "Bridge Uplink", price: 850, tier: 4, type: "power", desc: "Engineer from bridge." },
  "A197": { name: "Weapons Link", price: 850, tier: 4, type: "power", desc: "Gunner from bridge." },
  "A198": { name: "Cargo Link", price: 850, tier: 4, type: "power", desc: "Minner from bridge." },
  "A199": { name: "Heart of Nebula", price: 2e3, tier: 4, type: "power", desc: "All stats +10%." },
  "A200": { name: "The Singularity", price: 5e3, tier: 4, type: "power", desc: "Invulnerability, no jumping." }
};

// worker.js
var NUM_SECTORS = 200;
var ROOMS = {
  "bridge": "Bridge",
  "weapons": "Weapons Cntrl",
  "cargo": "Cargo Bay",
  "engineering": "Engineering"
};
var GameServer = class {
  static {
    __name(this, "GameServer");
  }
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.ships = {};
    this.players = {};
    this.galaxy = {};
    this.npcs = {};
    this.stations = {};
    this.shipCounter = 1;
    this.npcCounter = 1;
    this.pendingRequests = {};
    this.sessions = [];
    this.state.blockConcurrencyWhile(async () => {
      let stored = await this.state.storage.get(["ships", "players", "galaxy", "npcs", "stations", "shipCounter", "npcCounter", "pendingRequests"]);
      this.ships = stored.get("ships") || {};
      this.players = stored.get("players") || {};
      this.galaxy = stored.get("galaxy") || {};
      this.npcs = stored.get("npcs") || {};
      this.stations = stored.get("stations") || {};
      this.shipCounter = stored.get("shipCounter") || 1;
      this.npcCounter = stored.get("npcCounter") || 1;
      this.pendingRequests = stored.get("pendingRequests") || {};
      if (Object.keys(this.galaxy).length === 0) {
        this.generateGalaxy();
        await this.state.storage.put("galaxy", this.galaxy);
        await this.state.storage.put("stations", this.stations);
      }
      if (Object.keys(this.npcs).length === 0) {
        this.setupNPCs();
        await this.state.storage.put("npcs", this.npcs);
        await this.state.storage.put("npcCounter", this.npcCounter);
      }
      this.startTick();
    });
  }
  generateGalaxy() {
    for (let i = 1; i <= NUM_SECTORS; i++) {
      this.galaxy[i] = { id: i, links: [], encounterType: null, encounterData: null };
    }
    const upgradeIds = Object.keys(UPGRADES);
    for (let i = 0; i < 20; i++) {
      const sector = Math.floor(Math.random() * NUM_SECTORS) + 1;
      if (!this.stations[sector]) {
        const stock = [];
        const tempIds = [...upgradeIds];
        for (let j = 0; j < 10; j++) {
          const idx = Math.floor(Math.random() * tempIds.length);
          stock.push(tempIds.splice(idx, 1)[0]);
        }
        this.stations[sector] = {
          name: `Station ${String.fromCharCode(65 + i)}-${Math.floor(Math.random() * 900) + 100}`,
          stock
        };
      }
    }
    for (let i = 1; i <= NUM_SECTORS; i++) {
      const numLinks = Math.floor(Math.random() * 3) + 2;
      while (this.galaxy[i].links.length < numLinks) {
        const target = Math.floor(Math.random() * NUM_SECTORS) + 1;
        if (target !== i && !this.galaxy[i].links.includes(target)) {
          this.galaxy[i].links.push(target);
          if (!this.galaxy[target].links.includes(i)) {
            this.galaxy[target].links.push(i);
          }
        }
      }
      const encounterRoll = Math.random();
      if (encounterRoll < 0.25) {
        const evTemplate = GAME_EVENTS[Math.floor(Math.random() * GAME_EVENTS.length)];
        this.galaxy[i].encounterType = evTemplate.type;
        this.galaxy[i].encounterData = { id: evTemplate.id };
      } else if (encounterRoll < 0.4) {
        this.galaxy[i].encounterType = "asteroid";
        this.galaxy[i].encounterData = { hp: 30, name: "Asteroid" };
      } else if (encounterRoll < 0.45) {
        this.galaxy[i].encounterType = "ship";
        this.galaxy[i].encounterData = { hp: 50, name: "Scrap Pirate" };
      }
    }
  }
  clearGlobalEncounter(sector) {
    if (this.galaxy[sector]) {
      this.galaxy[sector].encounterType = null;
      this.galaxy[sector].encounterData = null;
      Object.values(this.ships).forEach((s) => {
        if (s.sector === sector && s.currentEncounter && !s.currentEncounter.isGlobalNPC) {
          s.currentEncounter = null;
          s.crew.forEach((mid) => {
            const ses = this.sessions.find((ses2) => ses2.playerId === mid);
            if (ses) this.send(ses.ws, "log", { message: `[SENSORS] Local encounter signature dissipated.`, color: "#AAAAAA" });
          });
        }
      });
    }
  }
  setupNPCs() {
    const spawnNPC = /* @__PURE__ */ __name((type, baseName, count, hp, behavior) => {
      for (let i = 0; i < count; i++) {
        const id = `N-${this.npcCounter.toString().padStart(3, "0")}`;
        this.npcCounter++;
        const sector = Math.floor(Math.random() * NUM_SECTORS) + 1;
        this.npcs[id] = {
          id,
          type,
          name: `${baseName} ${Math.floor(Math.random() * 1e3)}`,
          sector,
          hp,
          maxHp: hp,
          behavior,
          // 'aggressive', 'flee', 'neutral'
          cooldown: 0
        };
      }
    }, "spawnNPC");
    spawnNPC("pirate", "Pirate Dreadnaught", 10, 150, "aggressive");
    spawnNPC("merchant", "Nomad Merchant", 5, 50, "flee");
    spawnNPC("leviathan", "Void Leviathan", 5, 300, "neutral");
    spawnNPC("scavenger", "Scrap Scavenger", 5, 50, "neutral");
  }
  async fetch(request) {
    const upgradeHeader = request.headers.get("Upgrade");
    if (!upgradeHeader || upgradeHeader !== "websocket") {
      return new Response("Expected Upgrade: websocket", { status: 426 });
    }
    const [client, server] = new WebSocketPair();
    await this.handleSession(server);
    return new Response(null, {
      status: 101,
      webSocket: client
    });
  }
  async handleSession(ws) {
    ws.accept();
    const session = { id: crypto.randomUUID(), ws, playerId: null };
    this.sessions.push(session);
    ws.addEventListener("message", async (msg) => {
      try {
        const data = JSON.parse(msg.data);
        if (data.type === "init") {
          let playerId = data.playerId;
          let player = null;
          if (playerId && this.players[playerId]) {
            player = this.players[playerId];
            this.send(ws, "log", { message: `RECONSECUTIVE UPLINK RESTORED. WELCOME BACK, ${player.name}.`, color: "#00FF00" });
          } else {
            playerId = crypto.randomUUID();
            player = {
              id: playerId,
              name: `Guest-${Math.floor(Math.random() * 1e3)}`,
              state: "LOBBY",
              room: "Bridge",
              shipId: null
            };
            this.players[playerId] = player;
            this.send(ws, "log", { message: `NEW UPLINK ESTABLISHED. WELCOME TO SPIRAL NEBULA LOBBY.`, color: "#00FF00" });
          }
          session.playerId = playerId;
          this.send(ws, "identity", { id: playerId });
          if (player.state === "IN_GAME" && player.shipId && this.ships[player.shipId]) {
            const ship = this.ships[player.shipId];
            if (!ship.crew.includes(playerId)) ship.crew.push(playerId);
            this.send(ws, "update_ui", { state: "IN_GAME", location: player.room, sector: ship.sector });
            this.send(ws, "ship_sync", {
              hull: { current: ship.hull, max: 100 },
              fuel: { current: ship.fuel, max: 100 },
              energy: { current: ship.energy, max: ship.maxEnergy },
              scrap: ship.scrap,
              cooldowns: ship.cooldowns
            });
            this.broadcastToShip(ship.id, {
              type: "log",
              data: { message: `[SYS] ${player.name} reconnected.`, color: "#00FF00" }
            });
          } else {
            this.send(ws, "update_ui", { state: "LOBBY" });
          }
          this.send(ws, "log", { message: `Type 'help' to see all available commands.`, color: "#AAAAAA" });
          await this.saveState();
          return;
        }
        if (!session.playerId) return;
        if (data.type === "command") {
          await this.handleCommand(session, data.cmd);
        }
      } catch (err) {
        console.error("WS Message Error:", err);
      }
    });
    ws.addEventListener("close", async () => {
      this.sessions = this.sessions.filter((s) => s.id !== session.id);
      if (session.playerId) {
        const p = this.players[session.playerId];
        if (p && p.shipId) {
          const ship = this.ships[p.shipId];
          if (ship) {
            this.broadcastToShip(ship.id, {
              type: "log",
              data: { message: `[SYS] ${p.name} disconnected.`, color: "#FF0000" }
            });
          }
        }
      }
      await this.saveState();
    });
  }
  send(ws, type, data) {
    ws.send(JSON.stringify({ type, data }));
  }
  broadcastToShip(shipId, message) {
    const ship = this.ships[shipId];
    if (!ship) return;
    ship.crew.forEach((memberId) => {
      const session = this.sessions.find((s) => s.playerId === memberId);
      if (session) {
        this.send(session.ws, message.type, message.data);
      }
    });
  }
  async saveState() {
    await this.state.storage.put({
      ships: this.ships,
      players: this.players,
      shipCounter: this.shipCounter,
      pendingRequests: this.pendingRequests
    });
  }
  async destroyShip(shipId) {
    const ship = this.ships[shipId];
    if (!ship) return;
    ship.crew.forEach((playerId) => {
      const player = this.players[playerId];
      if (player) {
        player.state = "LOBBY";
        player.shipId = null;
        player.room = "Bridge";
      }
      const session = this.sessions.find((s) => s.playerId === playerId);
      if (session) {
        this.send(session.ws, "log", { message: `
[!!!] CRITICAL FAILURE: THE ${ship.name} HAS BEEN DESTROYED.`, color: "#FF0000" });
        this.send(session.ws, "log", { message: `EJECTING TO LOBBY...`, color: "#FFFF00" });
        this.send(session.ws, "update_ui", { state: "LOBBY" });
      }
    });
    delete this.ships[shipId];
    delete this.pendingRequests[shipId];
    await this.saveState();
  }
  async handleCommand(session, cmdString) {
    const player = this.players[session.playerId];
    const ws = session.ws;
    if (!player) return;
    const args = cmdString.trim().split(/\s+/);
    let mainCmd = args[0].toLowerCase();
    const ALIAS_MAP = {
      "l": "look",
      "m": "move",
      "h": "help",
      "?": "help",
      "w": "who",
      "rn": "rename",
      "j": "jump",
      "s": "scan",
      "sc": "scan",
      "hl": "hail",
      "sh": "shields",
      "ev": "evade",
      "jm": "jam",
      "a": "attack",
      "t": "target",
      "e": "emp",
      "cf": "chaff",
      "oc": "overcharge",
      "fk": "flak",
      "r": "repair",
      "p": "patch",
      "rr": "reroute",
      "ov": "overclock",
      "sn": "siphon",
      "v": "vent",
      "mn": "mine",
      "rf": "refine",
      "al": "airlock",
      "pb": "probe",
      "dr": "drone",
      "hd": "hide",
      "dk": "dock",
      "b": "buy",
      "i": "inventory",
      "inv": "inventory"
    };
    if (ALIAS_MAP[mainCmd]) mainCmd = ALIAS_MAP[mainCmd];
    const ship = player.shipId ? this.ships[player.shipId] : null;
    if (player.state === "LOBBY") {
      await this.handleLobbyCommand(session, player, mainCmd, args);
    } else {
      await this.handleGameCommand(session, player, mainCmd, args);
    }
    await this.saveState();
  }
  async handleLobbyCommand(session, player, mainCmd, args) {
    const ws = session.ws;
    if (mainCmd === "create") {
      if (args.length < 2) {
        this.send(ws, "log", { message: "ERROR: Provide a ship name (e.g., 'create Vanguard').", color: "#FF0000" });
        return;
      }
      const shipName = args.slice(1).join(" ").toUpperCase();
      const newShipId = `TGB-${1e3 + this.shipCounter++}`;
      this.ships[newShipId] = {
        id: newShipId,
        name: shipName,
        sector: 1,
        fuel: 80,
        energy: 50,
        maxEnergy: 50,
        hull: 100,
        scrap: 25,
        // Increased from 15
        credits: 250,
        // Increased from 200
        upgrades: [],
        currentEncounter: null,
        cooldowns: { "Bridge": 0, "Weapons Cntrl": 0, "Cargo Bay": 0, "Engineering": 0 },
        crew: [player.id],
        // Phase 15 state variables
        shieldsActive: false,
        evadeActive: false,
        jammedCooldown: 0,
        chaffActive: false,
        overchargeActive: false,
        droneActive: false,
        hideActive: false,
        overclockActive: false,
        fires: 0,
        enemyModifiers: {
          weaponsDisabled: 0,
          enginesDisabled: 0,
          emped: 0
        }
      };
      player.state = "IN_GAME";
      player.shipId = newShipId;
      player.room = ROOMS["bridge"];
      this.send(ws, "log", { message: `[SYS] Commissioned ${shipName} (${newShipId}). You are the Captain.`, color: "#00FF00" });
      this.send(ws, "update_ui", { state: "IN_GAME", location: player.room, sector: this.ships[newShipId].sector });
      this.send(ws, "log", { message: ROOM_DESCRIPTIONS[player.room], color: "#AAAAAA" });
    } else if (mainCmd === "ships") {
      const activeShips = Object.values(this.ships);
      if (activeShips.length === 0) {
        this.send(ws, "log", { message: `No active ships in the sector.`, color: "#AAAAAA" });
      } else {
        this.send(ws, "log", { message: `--- ACTIVE VESSELS ---`, color: "#FFFF00" });
        activeShips.forEach((s) => {
          this.send(ws, "log", { message: `[${s.id}] ${s.name} - Crew: ${s.crew.length}/4`, color: "#FFFFFF" });
        });
      }
    } else if (mainCmd === "join") {
      if (args.length < 2) {
        this.send(ws, "log", { message: "ERROR: Provide a ship ID or name (e.g., 'join TGB-1001' or 'join Vanguard').", color: "#FF0000" });
        return;
      }
      const targetInput = args.slice(1).join(" ").toUpperCase();
      let targetShip = this.ships[targetInput] || Object.values(this.ships).find((s) => s.name.toUpperCase() === targetInput);
      if (!targetShip) {
        this.send(ws, "log", { message: `ERROR: No ship found with name or registration '${targetInput}'.`, color: "#FF0000" });
        return;
      }
      if (targetShip.crew.length >= 4) {
        this.send(ws, "log", { message: `ERROR: ${targetShip.name} is at maximum crew capacity.`, color: "#FF0000" });
        return;
      }
      if (!this.pendingRequests[targetShip.id]) this.pendingRequests[targetShip.id] = [];
      if (!this.pendingRequests[targetShip.id].includes(player.id)) {
        this.pendingRequests[targetShip.id].push(player.id);
      }
      this.send(ws, "log", { message: `[SYS] Boarding request sent to ${targetShip.name}. Awaiting approval...`, color: "#FFFF00" });
      targetShip.crew.forEach((memberId) => {
        const session2 = this.sessions.find((s) => s.playerId === memberId);
        if (session2) {
          this.send(session2.ws, "log", { message: `[!] BOARDING REQUEST FROM ${player.name} (${player.id.slice(0, 4)}). Type 'approve ${player.id}' or 'deny ${player.id}'.`, color: "#FF00FF" });
        }
      });
    } else if (mainCmd === "who") {
      const totalPlayers = Object.values(this.players).length;
      this.send(ws, "log", { message: `--- CONNECTED PILOTS [${totalPlayers}] ---`, color: "#FFFF00" });
      Object.values(this.players).forEach((p) => {
        const status = p.state === "LOBBY" ? "LOBBY" : `STEWARDING ${p.shipId}`;
        this.send(ws, "log", { message: `[${p.id.slice(0, 4)}] ${p.name} - STATUS: ${status}`, color: "#FFFFFF" });
      });
    } else if (mainCmd === "rename") {
      if (args.length < 2) {
        this.send(ws, "log", { message: "ERROR: Provide a new name (e.g., 'rename StarPilot').", color: "#FF0000" });
        return;
      }
      const newName = args.slice(1).join(" ");
      if (newName.toLowerCase() === "ship") {
        this.send(ws, "log", { message: "ERROR: Player name cannot be 'ship'.", color: "#FF0000" });
        return;
      }
      const nameExists = Object.values(this.players).some((p) => p.name.toLowerCase() === newName.toLowerCase());
      if (nameExists) {
        this.send(ws, "log", { message: `ERROR: The name '${newName}' is already taken.`, color: "#FF0000" });
        return;
      }
      const oldName = player.name;
      player.name = newName;
      this.send(ws, "log", { message: `[SYS] Name changed to ${newName}.`, color: "#00FF00" });
    } else if (mainCmd === "help") {
      this.send(ws, "log", { message: `--- LOBBY COMMANDS ---`, color: "#FFFF00" });
      this.send(ws, "log", { message: `> 'ships': List all active vessels in the nebula.`, color: "#FFFFFF" });
      this.send(ws, "log", { message: `> 'create <name>': Commission a new ship and become its Captain.`, color: "#FFFFFF" });
      this.send(ws, "log", { message: `> 'join <id>': Request to join the crew of an existing ship.`, color: "#FFFFFF" });
      this.send(ws, "log", { message: `> 'rename <name>': Change your pilot callsign.`, color: "#FFFFFF" });
      this.send(ws, "log", { message: `> 'who': See a list of all connected players.`, color: "#FFFFFF" });
      this.send(ws, "log", { message: `> 'help': Show this message.`, color: "#FFFFFF" });
    } else {
      this.send(ws, "log", { message: `ERROR: Invalid lobby command.`, color: "#FF0000" });
    }
  }
  async handleGameCommand(session, player, mainCmd, args) {
    const ws = session.ws;
    const ship = this.ships[player.shipId];
    if (!ship) {
      player.state = "LOBBY";
      this.send(ws, "update_ui", { state: "LOBBY" });
      return;
    }
    const broadcast = /* @__PURE__ */ __name((text, color = "#FFFFFF") => {
      ship.crew.forEach((memberId) => {
        const s = this.sessions.find((ses) => ses.playerId === memberId);
        if (s) this.send(s.ws, "log", { message: text, color });
      });
    }, "broadcast");
    if (ship.currentEncounter && ["anomaly", "derelict", "hazard", "distress", "faction"].includes(ship.currentEncounter.type)) {
      const ev = ship.currentEncounter;
      const eventOpt = ev.options.find((o) => o.command === mainCmd);
      if (!["move", "comm", "ships", "help", "who"].includes(mainCmd)) {
        if (eventOpt) {
          if (eventOpt.requiredRoom && !player.room.toLowerCase().includes(eventOpt.requiredRoom.toLowerCase())) {
            this.send(ws, "log", { message: `ERROR: '${mainCmd}' MUST BE EXECUTED FROM ${ROOMS[eventOpt.requiredRoom] || eventOpt.requiredRoom.toUpperCase()}.`, color: "#FF0000" });
            return;
          }
          eventOpt.execute(ship, player, broadcast);
          if (!ship.currentEncounter) {
            this.clearGlobalEncounter(ship.sector);
          }
          return;
        } else {
          this.send(ws, "log", { message: `ERROR: Invalid action during event.`, color: "#FF0000" });
          return;
        }
      }
    }
    if (mainCmd === "comm") {
      const msgText = args.slice(1).join(" ").replace(/^['"](.*)['"]$/, "$1");
      if (msgText) {
        Object.values(this.players).forEach((p) => {
          const targetShip = this.ships[p.shipId];
          if (targetShip && targetShip.sector === ship.sector) {
            const s = this.sessions.find((ses) => ses.playerId === p.id);
            if (s) s.ws.send(JSON.stringify({ type: "chat", data: { sender: player.name, ship: ship.id, text: msgText, color: "#00FFFF" } }));
          }
        });
      }
    } else if (mainCmd === "approve" || mainCmd === "deny") {
      const targetIdInput = args[1];
      if (!this.pendingRequests[ship.id]) {
        this.send(ws, "log", { message: "ERROR: No pending requests for this ship.", color: "#FF0000" });
        return;
      }
      const actualPlayerId = this.pendingRequests[ship.id].find((id) => id === targetIdInput || id.startsWith(targetIdInput));
      if (actualPlayerId) {
        this.pendingRequests[ship.id] = this.pendingRequests[ship.id].filter((id) => id !== actualPlayerId);
        const targetPlayer = this.players[actualPlayerId];
        if (mainCmd === "approve" && targetPlayer && ship.crew.length < 4) {
          targetPlayer.state = "IN_GAME";
          targetPlayer.shipId = ship.id;
          targetPlayer.room = ROOMS["cargo"];
          ship.crew.push(actualPlayerId);
          const ts = this.sessions.find((s) => s.playerId === actualPlayerId);
          if (ts) {
            this.send(ts.ws, "update_ui", { state: "IN_GAME", location: targetPlayer.room, sector: ship.sector });
            this.send(ts.ws, "log", { message: `[SYS] Boarding request APPROVED. Welcome to the ${ship.name}.`, color: "#00FF00" });
            this.send(ts.ws, "log", { message: ROOM_DESCRIPTIONS[targetPlayer.room], color: "#AAAAAA" });
          }
          broadcast(`[SYS] ${targetPlayer.name} has joined the crew.`, "#FFFF00");
        } else if (targetPlayer) {
          const ts = this.sessions.find((s) => s.playerId === actualPlayerId);
          if (ts) this.send(ts.ws, "log", { message: `[SYS] Boarding request DENIED by ${ship.name}.`, color: "#FF0000" });
        }
      } else {
        this.send(ws, "log", { message: `ERROR: No pending request matching '${targetIdInput}'.`, color: "#FF0000" });
      }
    } else if (mainCmd === "move") {
      const dest = args[1]?.toLowerCase();
      if (ROOMS[dest]) {
        player.room = ROOMS[dest];
        this.send(ws, "update_ui", { location: player.room });
        this.send(ws, "log", { message: `Moved to ${player.room}.`, color: "#00FFFF" });
        this.send(ws, "log", { message: ROOM_DESCRIPTIONS[player.room], color: "#AAAAAA" });
        ship.crew.forEach((mid) => {
          if (mid !== player.id) {
            const s = this.sessions.find((ses) => ses.playerId === mid);
            if (s) this.send(s.ws, "log", { message: `[CREW] ${player.name} moved to ${player.room}.`, color: "#AAAAAA" });
          }
        });
      } else {
        this.send(ws, "log", { message: `ERROR: Unknown room.`, color: "#FF0000" });
      }
    } else if (mainCmd === "scan") {
      if (player.room !== ROOMS["bridge"]) {
        this.send(ws, "log", { message: "ERROR: SCANNERS ACCESSED FROM BRIDGE ONLY.", color: "#FF0000" });
        return;
      }
      if (args[1] === "deep") {
        if (ship.energy < 5) {
          this.send(ws, "log", { message: "ERROR: INSUFFICIENT ENERGY FOR DEEP SCAN.", color: "#FF0000" });
          return;
        }
        ship.energy -= 5;
        const sectorData = this.galaxy[ship.sector];
        this.send(ws, "log", { message: `--- DEEP SPACE SCAN ---`, color: "#00FFFF" });
        this.send(ws, "log", { message: `Adjacent Sectors analyzed.`, color: "#FFFFFF" });
        let npcsFound = false;
        sectorData.links.forEach((linkedSector) => {
          const npcsInAdj = Object.values(this.npcs).filter((n) => n.sector === linkedSector && n.hp > 0);
          npcsInAdj.forEach((n) => {
            this.send(ws, "log", { message: `[SECTOR ${linkedSector}] Detected ${n.name}`, color: "#FFFF00" });
            npcsFound = true;
          });
        });
        if (!npcsFound) this.send(ws, "log", { message: `No significant entities detected in adjacent sectors.`, color: "#AAAAAA" });
        broadcast(`[BRIDGE] ${player.name} initiated a Deep Space Scan. (-5 Energy)`, "#00FFFF");
      } else {
        const sectorData = this.galaxy[ship.sector];
        this.send(ws, "log", { message: `--- LONG RANGE SCANNERS ---`, color: "#FFFF00" });
        this.send(ws, "log", { message: `Current Sector: ${ship.sector}`, color: "#FFFFFF" });
        this.send(ws, "log", { message: `Linked Jump Points: ${sectorData.links.join(", ")}`, color: "#00FFFF" });
        const localNpcs = Object.values(this.npcs).filter((n) => n.sector === ship.sector && n.hp > 0);
        if (localNpcs.length > 0) {
          this.send(ws, "log", { message: `--- LOCAL ENTITIES DETECTED ---`, color: "#FF00FF" });
          localNpcs.forEach((n) => {
            this.send(ws, "log", { message: `- ${n.name} [${n.type.toUpperCase()}]`, color: "#FFFFFF" });
          });
        }
      }
    } else if (mainCmd === "hail") {
      if (player.room !== ROOMS["bridge"]) {
        this.send(ws, "log", { message: "ERROR: COMMS ACCESSED FROM BRIDGE ONLY.", color: "#FF0000" });
        return;
      }
      if (ship.currentEncounter && ship.currentEncounter.type === "ship") {
        if (ship.currentEncounter.isGlobalNPC) {
          const globalNpc = this.npcs[ship.currentEncounter.id];
          if (globalNpc && globalNpc.type === "merchant") {
            if (ship.scrap >= 20) {
              ship.scrap -= 20;
              ship.fuel += 50;
              ship.energy += 50;
              broadcast(`[COMM] ${globalNpc.name}: "A pleasure doing business." (Traded 20 Scrap for 50 Fuel & Energy)`, "#00FF00");
              globalNpc.cooldown = 0;
            } else {
              broadcast(`[COMM] ${globalNpc.name}: "Come back when you have 20 units of scrap."`, "#AAAAAA");
            }
          } else if (globalNpc && globalNpc.type === "pirate") {
            broadcast(`[COMM] ${globalNpc.name}: "We only deal in laser blasts."`, "#FF0000");
          } else {
            broadcast(`[COMM] Hailing the entity... No response.`, "#00FFFF");
          }
        } else {
          broadcast(`[BRIDGE] Hailing ${ship.currentEncounter.name}... No response.`, "#00FFFF");
        }
      } else {
        const localMerchant = Object.values(this.npcs).find((n) => n.sector === ship.sector && n.type === "merchant" && n.hp > 0);
        if (localMerchant) {
          if (ship.scrap >= 20) {
            ship.scrap -= 20;
            ship.fuel += 50;
            ship.energy += 50;
            broadcast(`[COMM] ${localMerchant.name}: "A pleasure doing business." (Traded 20 Scrap for 50 Fuel & Energy)`, "#00FF00");
          } else {
            broadcast(`[COMM] ${localMerchant.name}: "Come back when you have 20 units of scrap."`, "#AAAAAA");
          }
        } else {
          this.send(ws, "log", { message: "ERROR: NO VALID TARGET TO HAIL.", color: "#FF0000" });
        }
      }
    } else if (mainCmd === "shields") {
      if (player.room !== ROOMS["bridge"]) {
        this.send(ws, "log", { message: "ERROR: SHIELDS ACCESSED FROM BRIDGE ONLY.", color: "#FF0000" });
        return;
      }
      if (ship.energy < 15) {
        this.send(ws, "log", { message: "ERROR: INSUFFICIENT ENERGY. (15 REQ)", color: "#FF0000" });
        return;
      }
      ship.energy -= 15;
      ship.shieldsActive = true;
      broadcast(`[BRIDGE] INCOMING DAMAGE MITIGATION ACTIVE. (-15 Energy, Absorbs 8 DMG)`, "#00FFFF");
    } else if (mainCmd === "evade") {
      if (player.room !== ROOMS["bridge"]) {
        this.send(ws, "log", { message: "ERROR: HELM ACCESSED FROM BRIDGE ONLY.", color: "#FF0000" });
        return;
      }
      if (ship.cooldowns["Bridge"] > 0) {
        this.send(ws, "log", { message: "ERROR: BRIDGE CONTROLS ON COOLDOWN.", color: "#FF0000" });
        return;
      }
      ship.evadeActive = true;
      ship.cooldowns["Bridge"] = 3;
      broadcast(`[BRIDGE] EVASIVE MANEUVERS INITIATED. BRACING FOR IMPACT.`, "#00FFFF");
    } else if (mainCmd === "jam") {
      if (player.room !== ROOMS["bridge"]) {
        this.send(ws, "log", { message: "ERROR: COMMS ACCESSED FROM BRIDGE ONLY.", color: "#FF0000" });
        return;
      }
      if (!ship.currentEncounter || ship.currentEncounter.type !== "ship") {
        this.send(ws, "log", { message: "ERROR: NO COMBAT TARGET TO JAM.", color: "#FF0000" });
        return;
      }
      if (ship.energy < 8) {
        this.send(ws, "log", { message: "ERROR: INSUFFICIENT ENERGY (8 REQ).", color: "#FF0000" });
        return;
      }
      ship.energy -= 8;
      ship.jammedCooldown = 3;
      broadcast(`[BRIDGE] ELECTRONIC COUNTERMEASURES DEPLOYED. ENEMY SENSORS JAMMED.`, "#00FFFF");
    } else if (mainCmd === "jump") {
      if (player.room !== ROOMS["bridge"]) {
        this.send(ws, "log", { message: "ERROR: JUMP MUST BE EXECUTED FROM THE BRIDGE.", color: "#FF0000" });
        return;
      }
      const destSector = parseInt(args[1]);
      const currentSectorData = this.galaxy[ship.sector];
      if (ship.cooldowns["Bridge"] > 0) {
        this.send(ws, "log", { message: `ERROR: BRIDGE ON COOLDOWN.`, color: "#FF0000" });
        return;
      }
      if (currentSectorData.links.includes(destSector) && ship.fuel >= 10) {
        ship.fuel -= 10;
        ship.cooldowns["Bridge"] = 5;
        broadcast(`SPOOLING FSD DRIVE...`, "#00FFFF");
        setTimeout(async () => {
          if (this.ships[ship.id]) {
            ship.sector = destSector;
            ship.crew.forEach((mid) => {
              const s = this.sessions.find((ses) => ses.playerId === mid);
              if (s) {
                this.send(s.ws, "update_ui", { sector: ship.sector });
                this.send(s.ws, "log", { message: `JUMP SUCCESSFUL. Sector ${destSector}.`, color: "#00FF00" });
                this.send(s.ws, "log", { message: SECTOR_FLAVOR[Math.floor(Math.random() * SECTOR_FLAVOR.length)], color: "#AAAAAA" });
              }
            });
            const encType = this.galaxy[destSector].encounterType;
            const encData = this.galaxy[destSector].encounterData;
            if (encType && encData) {
              if (encType === "asteroid") {
                ship.currentEncounter = { type: "asteroid", hp: encData.hp, name: encData.name };
                broadcast(`--- SENSORS DETECT AN ASTEROID ---`, "#FFFF00");
              } else if (encType === "ship") {
                ship.currentEncounter = { type: "ship", hp: encData.hp, name: encData.name };
                broadcast(`--- PROXIMITY ALERT! ---`, "#FF0000");
                broadcast(`[!] ${encData.name.toUpperCase()} LIES IN AMBUSH!`, "#FF0000");
              } else {
                const template = GAME_EVENTS.find((e) => e.id === encData.id);
                if (template) {
                  ship.currentEncounter = Object.assign({}, template);
                  broadcast(`
--- SENSORS DETECT AN OBJECT ---`, "#FFFF00");
                  broadcast(`${template.title.toUpperCase()} [${template.type.toUpperCase()}]`, "#00FFFF");
                  broadcast(template.text, "#FFFFFF");
                  if (template.options) {
                    broadcast("ACTIONS: " + template.options.map((o) => `'${o.command}'`).join(", "), "#AAAAAA");
                  }
                } else {
                  ship.currentEncounter = null;
                }
              }
            } else {
              ship.currentEncounter = null;
            }
            await this.saveState();
          }
        }, 2e3);
      } else {
        this.send(ws, "log", { message: "ERROR: Invalid jump path or no fuel.", color: "#FF0000" });
      }
    } else if (mainCmd === "attack" || mainCmd === "target" || mainCmd === "emp" || mainCmd === "chaff" || mainCmd === "overcharge" || mainCmd === "flak") {
      if (player.room !== ROOMS["weapons"]) {
        this.send(ws, "log", { message: "ERROR: WEAPONS MUST BE EXECUTED FROM WEAPONS CNTRL.", color: "#FF0000" });
        return;
      }
      if (ship.cooldowns["Weapons Cntrl"] > 0) {
        this.send(ws, "log", { message: "ERROR: Weapons cooling down.", color: "#FF0000" });
        return;
      }
      const noTargetErr = /* @__PURE__ */ __name(() => this.send(ws, "log", { message: "ERROR: NO TARGETS.", color: "#FF0000" }), "noTargetErr");
      const noEnergyErr = /* @__PURE__ */ __name((cost) => this.send(ws, "log", { message: `ERROR: LOW ENERGY. (${cost} REQ)`, color: "#FF0000" }), "noEnergyErr");
      if (!ship.currentEncounter || ship.currentEncounter.type !== "ship" && ship.currentEncounter.type !== "asteroid") {
        const targetableNpc = Object.values(this.npcs).find((n) => n.sector === ship.sector && n.hp > 0 && n.type !== "merchant");
        if (targetableNpc && (mainCmd === "attack" || mainCmd === "target" || mainCmd === "emp" || mainCmd === "chaff" || mainCmd === "overcharge" || mainCmd === "flak")) {
          ship.currentEncounter = {
            id: targetableNpc.id,
            type: "ship",
            name: targetableNpc.name,
            hp: targetableNpc.hp,
            maxHp: targetableNpc.maxHp,
            isGlobalNPC: true
          };
          broadcast(`[WEAPONS] TARGET LOCKED: ${targetableNpc.name.toUpperCase()}`, "#FF0000");
        } else {
          noTargetErr();
          return;
        }
      }
      if (mainCmd === "attack") {
        if (ship.energy < 5) return noEnergyErr(5);
        ship.energy -= 5;
        ship.cooldowns["Weapons Cntrl"] = 3;
        let dmg = Math.floor(Math.random() * 20) + 10;
        if (Math.random() < 0.05) {
          dmg = Math.floor(dmg * 1.5);
          this.send(ws, "log", { message: `[!!!] CRITICAL HIT! Main battery struck a vulnerable sector!`, color: "#00FF00" });
        }
        if (ship.overchargeActive) {
          dmg *= 2;
          ship.overchargeActive = false;
          broadcast(`[WEAPONS] OVERCHARGED BEAM FIRED! DEVASTATING DAMAGE!`, "#FF0000");
        }
        ship.currentEncounter.hp -= dmg;
        broadcast(`[WEAPONS] Hit ${ship.currentEncounter.name || "Asteroid"} for ${dmg} DMG.`, "#FF00FF");
      } else if (mainCmd === "target") {
        if (ship.energy < 8) return noEnergyErr(8);
        const sysTarget = args[1]?.toLowerCase();
        if (sysTarget === "weapons") {
          ship.enemyModifiers.weaponsDisabled = 3;
          broadcast(`[WEAPONS] TARGETED FIRE ON ENEMY WEAPONS. DAMAGE OUTPUT REUDCED.`, "#FF00FF");
        } else if (sysTarget === "engines") {
          ship.enemyModifiers.enginesDisabled = 3;
          broadcast(`[WEAPONS] TARGETED FIRE ON ENEMY ENGINES. THEY CANNOT FLEE.`, "#FF00FF");
        } else {
          this.send(ws, "log", { message: "ERROR: Valid targets: 'weapons', 'engines'.", color: "#FF0000" });
          return;
        }
        ship.energy -= 8;
        ship.cooldowns["Weapons Cntrl"] = 4;
      } else if (mainCmd === "emp") {
        if (ship.scrap < 10) {
          this.send(ws, "log", { message: "ERROR: REQUIRES 10 SCRAP TO BUILD EMP TORPEDO.", color: "#FF0000" });
          return;
        }
        if (ship.currentEncounter.type !== "ship") {
          this.send(ws, "log", { message: "ERROR: EMP ONLY AFFECTS SHIPS.", color: "#FF0000" });
          return;
        }
        ship.scrap -= 10;
        ship.enemyModifiers.emped = 4;
        ship.cooldowns["Weapons Cntrl"] = 5;
        broadcast(`[WEAPONS] EMP TORPEDO DEPLOYED! ENEMY SYSTEMS OFFLINE!`, "#00FFFF");
      } else if (mainCmd === "chaff") {
        if (ship.energy < 5) return noEnergyErr(5);
        ship.energy -= 5;
        ship.chaffActive = true;
        ship.cooldowns["Weapons Cntrl"] = 2;
        broadcast(`[WEAPONS] COUNTERMEASURES DEPLOYED. NEXT ATTACK WILL BE DEFLECTED.`, "#FF00FF");
      } else if (mainCmd === "overcharge") {
        if (ship.energy < 15) return noEnergyErr(15);
        ship.energy -= 15;
        ship.hull -= 5;
        ship.overchargeActive = true;
        ship.cooldowns["Weapons Cntrl"] = 2;
        broadcast(`[WEAPONS] WARNING: WEAPONS OVERCHARGED. HULL TOOK 5 DMG FROM HEAT.`, "#FF0000");
        if (ship.hull <= 0) {
          await this.destroyShip(ship.id);
          return;
        }
      } else if (mainCmd === "flak") {
        if (ship.scrap < 5) {
          this.send(ws, "log", { message: "ERROR: REQUIRES 5 SCRAP AMMO.", color: "#FF0000" });
          return;
        }
        ship.scrap -= 5;
        ship.cooldowns["Weapons Cntrl"] = 2;
        const dmg = Math.floor(Math.random() * 15) + 5;
        ship.currentEncounter.hp -= dmg;
        broadcast(`[WEAPONS] FLAK CANNON FIRED! Hit for ${dmg} DMG.`, "#FF00FF");
      }
      if (ship.currentEncounter && ship.currentEncounter.hp <= 0) {
        broadcast(`** TARGET DESTROYED **`, "#00FF00");
        if (ship.currentEncounter.type === "ship") {
          const scrap = Math.floor(Math.random() * 30) + 10;
          ship.scrap += scrap;
          broadcast(`Salvaged ${scrap} Scrap.`, "#00FF00");
        }
        if (ship.currentEncounter.isGlobalNPC && this.npcs[ship.currentEncounter.id]) {
          this.npcs[ship.currentEncounter.id].hp = 0;
        } else if (!ship.currentEncounter.isGlobalNPC) {
          this.clearGlobalEncounter(ship.sector);
        }
        ship.currentEncounter = null;
      } else if (ship.currentEncounter && ship.currentEncounter.isGlobalNPC && this.npcs[ship.currentEncounter.id]) {
        this.npcs[ship.currentEncounter.id].hp = ship.currentEncounter.hp;
      }
    } else if (mainCmd === "repair" || mainCmd === "reroute" || mainCmd === "patch" || mainCmd === "overclock" || mainCmd === "siphon" || mainCmd === "vent") {
      if (player.room !== ROOMS["engineering"]) {
        this.send(ws, "log", { message: "ERROR: MUST BE EXECUTED FROM ENGINEERING.", color: "#FF0000" });
        return;
      }
      if (ship.cooldowns["Engineering"] > 0) {
        this.send(ws, "log", { message: "ERROR: ENGINEERING SYSTEMS ON COOLDOWN.", color: "#FF0000" });
        return;
      }
      if (mainCmd === "repair") {
        if (ship.scrap < 10 || ship.hull >= 100) {
          this.send(ws, "log", { message: "ERROR: Requires 10 Scrap or Hull is already full.", color: "#FF0000" });
          return;
        }
        ship.scrap -= 10;
        ship.hull = Math.min(100, ship.hull + 10);
        ship.cooldowns["Engineering"] = 5;
        broadcast(`[ENGINEERING] Heavy hull repair complete. (+10 Hull, -10 Scrap)`, "#00FF00");
      } else if (mainCmd === "reroute") {
        const targetRoomStr = args[1]?.toLowerCase();
        let targetRoomMap = { "bridge": "Bridge", "weapons": "Weapons Cntrl", "cargo": "Cargo Bay" };
        let mapped = targetRoomMap[targetRoomStr];
        if (!mapped) {
          this.send(ws, "log", { message: "ERROR: reroute <bridge|weapons|cargo>", color: "#FF0000" });
          return;
        }
        if (ship.energy < 15) {
          this.send(ws, "log", { message: "ERROR: REQUIRES 15 ENERGY.", color: "#FF0000" });
          return;
        }
        ship.energy -= 15;
        ship.cooldowns[mapped] = 0;
        ship.cooldowns["Engineering"] = 4;
        broadcast(`[ENGINEERING] Power rerouted to ${mapped}! Cooldowns cleared.`, "#00FFFF");
      } else if (mainCmd === "patch") {
        ship.hull = Math.min(100, ship.hull + 2);
        ship.cooldowns["Engineering"] = 2;
        broadcast(`[ENGINEERING] Emergency micro-patch applied. (+2 Hull)`, "#00FF00");
      } else if (mainCmd === "overclock") {
        if (ship.overclockActive) {
          ship.overclockActive = false;
          broadcast(`[ENGINEERING] REACTOR OVERCLOCK DISABLED.`, "#00FFFF");
        } else {
          ship.overclockActive = true;
          broadcast(`[ENGINEERING] WARNING: REACTOR OVERCLOCKED. ENERGY REGEN INCREASED. FIRE RISK HIGH.`, "#FF0000");
        }
        ship.cooldowns["Engineering"] = 3;
      } else if (mainCmd === "siphon") {
        if (ship.energy < 40) {
          this.send(ws, "log", { message: "ERROR: REQUIRES 40 ENERGY TO SYNTHESIZE FUEL.", color: "#FF0000" });
          return;
        }
        ship.energy -= 40;
        ship.fuel += 1;
        ship.cooldowns["Engineering"] = 5;
        broadcast(`[ENGINEERING] Emergency siphon complete. Synthesized 1 Jump Fuel.`, "#00FF00");
      } else if (mainCmd === "vent") {
        if (ship.fires > 0) {
          broadcast(`[ENGINEERING] Plasma vents opened. ${ship.fires} fires extinguished!`, "#00FFFF");
          ship.fires = 0;
        } else {
          broadcast(`[ENGINEERING] Vents cycled. No hazards detected.`, "#AAAAAA");
        }
        ship.cooldowns["Engineering"] = 4;
      }
    } else if (mainCmd === "mine" || mainCmd === "refine" || mainCmd === "airlock" || mainCmd === "probe" || mainCmd === "drone" || mainCmd === "hide") {
      if (player.room !== ROOMS["cargo"]) {
        this.send(ws, "log", { message: "ERROR: MUST BE EXECUTED FROM CARGO BAY.", color: "#FF0000" });
        return;
      }
      if (ship.cooldowns["Cargo Bay"] > 0) {
        this.send(ws, "log", { message: "ERROR: CARGO SYSTEMS ON COOLDOWN.", color: "#FF0000" });
        return;
      }
      if (mainCmd === "mine") {
        if (ship.energy < 2) {
          this.send(ws, "log", { message: "ERROR: Low energy.", color: "#FF0000" });
          return;
        }
        if (ship.currentEncounter && ship.currentEncounter.type === "asteroid") {
          ship.energy -= 2;
          ship.cooldowns["Cargo Bay"] = 3;
          const yieldAmt = Math.floor(Math.random() * 5) + 2;
          ship.scrap += yieldAmt;
          ship.currentEncounter.hp -= 10;
          broadcast(`[CARGO] ${player.name} mined ${yieldAmt} Scrap.`, "#00FF00");
          if (ship.currentEncounter.hp <= 0) {
            broadcast(`ASTEROID DEPLETED.`, "#AAAAAA");
            ship.currentEncounter = null;
          }
        } else {
          this.send(ws, "log", { message: "ERROR: NO ASTEROID.", color: "#FF0000" });
        }
      } else if (mainCmd === "refine") {
        if (ship.scrap < 10) {
          this.send(ws, "log", { message: "ERROR: REQUIRES 10 SCRAP.", color: "#FF0000" });
          return;
        }
        const targetRes = args[1]?.toLowerCase();
        if (targetRes === "fuel") {
          ship.scrap -= 10;
          ship.fuel += 5;
          broadcast(`[CARGO] 10 Scrap refined into 5 Jump Fuel.`, "#00FF00");
        } else if (targetRes === "energy") {
          ship.scrap -= 10;
          ship.energy = Math.min(ship.maxEnergy, ship.energy + 20);
          broadcast(`[CARGO] 10 Scrap refined into 20 Energy cells.`, "#00FF00");
        } else {
          this.send(ws, "log", { message: "ERROR: refine <fuel|energy>", color: "#FF0000" });
          return;
        }
        ship.cooldowns["Cargo Bay"] = 4;
      } else if (mainCmd === "airlock") {
        ship.cooldowns["Cargo Bay"] = 5;
        if (ship.currentEncounter && ship.currentEncounter.hp <= 0 && ship.currentEncounter.type === "ship") {
          const bonus = Math.floor(Math.random() * 20);
          ship.scrap += bonus;
          broadcast(`[CARGO] Airlock boarding successful. Recovered ${bonus} extra scrap from derelict.`, "#00FF00");
        } else {
          if (ship.scrap < 15) {
            this.send(ws, "log", { message: "ERROR: REQUIRES 15 SCRAP TO JETTISON.", color: "#FF0000" });
            return;
          }
          ship.scrap -= 15;
          broadcast(`[CARGO] 15 Scrap jettisoned! Environmental hazards temporarily distracted.`, "#00FFFF");
        }
      } else if (mainCmd === "probe") {
        if (ship.scrap < 20) {
          this.send(ws, "log", { message: "ERROR: REQUIRES 20 SCRAP TO BUILD PROBE.", color: "#FF0000" });
          return;
        }
        ship.scrap -= 20;
        ship.cooldowns["Cargo Bay"] = 5;
        broadcast(`[CARGO] PROBE LAUNCHED. Gathering deep sector telemetry...`, "#00FFFF");
      } else if (mainCmd === "drone") {
        if (ship.scrap < 10) {
          this.send(ws, "log", { message: "ERROR: REQUIRES 10 SCRAP TO ASSEMBLE DRONE.", color: "#FF0000" });
          return;
        }
        ship.scrap -= 10;
        ship.droneActive = true;
        ship.cooldowns["Cargo Bay"] = 5;
        broadcast(`[CARGO] AUTOMATED SALVAGE DRONE DEPLOYED. Passive scrap collection active.`, "#00FF00");
      } else if (mainCmd === "hide") {
        ship.hideActive = true;
        ship.cooldowns["Cargo Bay"] = 3;
        broadcast(`[CARGO] VALUABLE CONTRABAND CONCEALED IN BULKHEADS.`, "#00FFFF");
      }
    } else if (mainCmd === "comm") {
      if (args[1]?.toLowerCase() === "server") {
        if (ship.energy < 5) {
          this.send(ws, "log", { message: "ERROR: REQUIRES 5 ENERGY TO BROADCAST.", color: "#FF0000" });
          return;
        }
        if (player.room !== ROOMS["bridge"]) {
          this.send(ws, "log", { message: "ERROR: SERVER COMMS MUST BE SENT FROM THE BRIDGE.", color: "#FF0000" });
          return;
        }
        const msg = args.slice(2).join(" ");
        if (!msg) {
          this.send(ws, "log", { message: "ERROR: Provide a message (e.g. 'comm server Hello Sector').", color: "#FF0000" });
          return;
        }
        ship.energy -= 5;
        const globalMessage = `[BROADCAST] ${ship.name} (${player.name}): ${msg}`;
        Object.values(this.ships).forEach((s) => {
          s.crew.forEach((memberId) => {
            const ses = this.sessions.find((session2) => session2.playerId === memberId);
            if (ses) this.send(ses.ws, "log", { message: globalMessage, color: "#FF00FF" });
          });
        });
      } else {
        this.send(ws, "log", { message: "ERROR: Usage: 'comm server <message>'", color: "#FF0000" });
      }
    } else if (mainCmd === "who") {
      const totalPlayers = Object.values(this.players).length;
      this.send(ws, "log", { message: `--- CONNECTED PILOTS [${totalPlayers}] ---`, color: "#FFFF00" });
      Object.values(this.players).forEach((p) => {
        const status = p.shipId === ship.id ? "CREWMATE" : p.state === "LOBBY" ? "LOBBY" : `ABOARD ${p.shipId}`;
        this.send(ws, "log", { message: `[${p.id.slice(0, 4)}] ${p.name} - STATUS: ${status}`, color: "#FFFFFF" });
      });
    } else if (mainCmd === "rename") {
      if (args.length < 2) {
        this.send(ws, "log", { message: "ERROR: Provide a name or 'ship <newname>'.", color: "#FF0000" });
        return;
      }
      if (args[1].toLowerCase() === "ship") {
        if (args.length < 3) {
          this.send(ws, "log", { message: "ERROR: Provide a new name for the ship.", color: "#FF0000" });
          return;
        }
        const newShipName = args.slice(2).join(" ").toUpperCase();
        const oldShipName = ship.name;
        ship.name = newShipName;
        broadcast(`[SYS] ${player.name} has renamed the ship to ${newShipName}.`, "#00FF00");
      } else {
        const newName = args.slice(1).join(" ");
        const nameExists = Object.values(this.players).some((p) => p.name.toLowerCase() === newName.toLowerCase());
        if (nameExists) {
          this.send(ws, "log", { message: `ERROR: The name '${newName}' is already taken.`, color: "#FF0000" });
          return;
        }
        const oldName = player.name;
        player.name = newName;
        broadcast(`[SYS] ${oldName} is now known as ${newName}.`, "#00FF00");
      }
    } else if (mainCmd === "scan") {
      const sectorData = this.galaxy[ship.sector];
      const station = this.stations[ship.sector];
      this.send(ws, "log", { message: `--- LONG RANGE SENSOR LOG ---`, color: "#00FFFF" });
      this.send(ws, "log", { message: `SECTOR: ${sectorData.id}`, color: "#FFFFFF" });
      this.send(ws, "log", { message: `HYPERLANES: ${sectorData.links.join(", ")}`, color: "#FFFFFF" });
      if (station) {
        this.send(ws, "log", { message: `[!!!] STATION DETECTED: ${station.name}`, color: "#00FF00" });
      }
      this.send(ws, "log", { message: `SIGNATURES: ${sectorData.encounterType ? sectorData.encounterType.toUpperCase() : "CLEAR"}`, color: "#FFFFFF" });
      this.send(ws, "update_sector", { ...sectorData, station });
    } else if (mainCmd === "help") {
      this.send(ws, "log", { message: `--- COMMAND PROTOCOLS ---`, color: "#FFFF00" });
      this.send(ws, "log", { message: `> GLOBAL: move [m], who [w], rename ship [rn], look [l], help [h/?]`, color: "#FFFFFF" });
      if (player.room === ROOMS["bridge"]) {
        this.send(ws, "log", { message: `> BRIDGE: jump [j], scan [s], hail [hl], shields [sh], evade [ev], jam [jm], comm server`, color: "#00FFFF" });
      } else if (player.room === ROOMS["weapons"]) {
        this.send(ws, "log", { message: `> WEAPONS: attack [a], target [t], emp [e], chaff [cf], overcharge [oc], flak [fk]`, color: "#FF00FF" });
      } else if (player.room === ROOMS["cargo"]) {
        this.send(ws, "log", { message: `> CARGO BAY: mine [mn], refine [rf], airlock [al], probe [pb], drone [dr], hide [hd]`, color: "#00FF00" });
      } else if (player.room === ROOMS["engineering"]) {
        this.send(ws, "log", { message: `> ENGINEERING: repair [r], reroute [rr], patch [p], overclock [ov], siphon [sn], vent [v]`, color: "#FFA500" });
      }
      this.send(ws, "log", { message: `> SHIP: scan [s], hail [hl], dock [dk], buy [b], inventory [i/inv]`, color: "#FFFFFF" });
    } else if (mainCmd === "dock") {
      const station = this.stations[ship.sector];
      if (!station) {
        this.send(ws, "log", { message: "ERROR: NO SPACE STATION IN THIS SECTOR.", color: "#FF0000" });
        return;
      }
      this.send(ws, "log", { message: `--- DOCKED AT ${station.name.toUpperCase()} ---`, color: "#00FF00" });
      this.send(ws, "log", { message: `CREDITS: ${ship.credits} | SCRAP: ${ship.scrap}`, color: "#FFFF00" });
      this.send(ws, "log", { message: `AVAILABLE MODULES:`, color: "#00FFFF" });
      station.stock.forEach((id) => {
        const u = UPGRADES[id];
        this.send(ws, "log", { message: `[${id}] ${u.name} - ${u.price}c: ${u.desc}`, color: "#FFFFFF" });
      });
      this.send(ws, "log", { message: `Type 'buy <id>' to purchase.`, color: "#AAAAAA" });
    } else if (mainCmd === "look") {
      const target = args.length > 1 ? args.slice(1).join(" ").toLowerCase() : null;
      if (!target) {
        let desc = ROOM_DESCRIPTIONS[player.room] || "A functional part of the ship.";
        if (player.room === ROOMS["bridge"]) {
          const sectorDesc = SECTOR_FLAVOR[ship.sector % SECTOR_FLAVOR.length];
          desc += `

THROUGH THE VIEWPORT: ${sectorDesc}`;
        }
        this.send(ws, "log", { message: `--- ${player.room.toUpperCase()} ---`, color: "#FFFF00" });
        this.send(ws, "log", { message: desc, color: "#FFFFFF" });
      } else if (target === "ship") {
        this.send(ws, "log", { message: `--- THE ${ship.name} ---`, color: "#00FFFF" });
        this.send(ws, "log", { message: "A rugged, blocky Spiral Nebula tugboat. Her hull is scarred by micro-meteors and old docking accidents, but she's reliable and has a certain industrial charm.", color: "#FFFFFF" });
      } else if (target === "sector") {
        const sectorDesc = SECTOR_FLAVOR[ship.sector % SECTOR_FLAVOR.length];
        this.send(ws, "log", { message: `--- SECTOR ${ship.sector} ---`, color: "#FFFF00" });
        this.send(ws, "log", { message: sectorDesc, color: "#FFFFFF" });
      } else {
        let foundUpgrade = null;
        for (const upgradeId of ship.upgrades) {
          const u = UPGRADES[upgradeId];
          if (u.name.toLowerCase().includes(target) || upgradeId.toLowerCase() === target) {
            foundUpgrade = u;
            break;
          }
        }
        if (foundUpgrade) {
          this.send(ws, "log", { message: `--- ${foundUpgrade.name.toUpperCase()} ---`, color: "#00FF00" });
          this.send(ws, "log", { message: foundUpgrade.desc, color: "#FFFFFF" });
        } else {
          let enc = ship.currentEncounter;
          let localNpcs = Object.values(this.npcs).filter((n) => n.sector === ship.sector && n.hp > 0);
          let targetNpc = null;
          if (enc && (enc.name.toLowerCase().includes(target) || target === "target" || target === "enemy" || enc.id && enc.id.toLowerCase() === target)) {
            targetNpc = enc;
          } else {
            targetNpc = localNpcs.find((n) => n.name.toLowerCase().includes(target) || n.id.toLowerCase() === target);
          }
          if (targetNpc) {
            this.send(ws, "log", { message: `--- ${targetNpc.name.toUpperCase()} ---`, color: "#FF0000" });
            let encDesc = "A formidable signature on your scanners.";
            if (targetNpc.type === "ship") encDesc = "A vessel of unknown intent, its systems humming with potential energy.";
            if (targetNpc.type === "asteroid") encDesc = "A massive chunk of ore and stone, drifting silently through the void.";
            if (targetNpc.type === "merchant") encDesc = "A heavily laden trading vessel, its hull covered in the decals of various merchant guilds.";
            if (targetNpc.type === "leviathan") encDesc = "An ancient, organic mass of scales and bioluminescent tendrils. It ignores you with a cold, primordial indifference.";
            this.send(ws, "log", { message: encDesc, color: "#FFFFFF" });
          } else {
            this.send(ws, "log", { message: `ERROR: Cannot see '${target}' here.`, color: "#FF0000" });
          }
        }
      }
    } else if (mainCmd === "buy") {
      const station = this.stations[ship.sector];
      const upgradeId = args[1]?.toUpperCase();
      if (!station || !station.stock.includes(upgradeId)) {
        this.send(ws, "log", { message: "ERROR: MODULE NOT AVAILABLE AT THIS STATION.", color: "#FF0000" });
        return;
      }
      const upgrade = UPGRADES[upgradeId];
      if (ship.upgrades.includes(upgradeId)) {
        this.send(ws, "log", { message: `ERROR: ${upgrade.name} ALREADY INSTALLED.`, color: "#FF0000" });
        return;
      }
      if (ship.credits < upgrade.price) {
        this.send(ws, "log", { message: `ERROR: INSUFFICIENT CREDITS. REQUIRED: ${upgrade.price}`, color: "#FF0000" });
        return;
      }
      ship.credits -= upgrade.price;
      ship.upgrades.push(upgradeId);
      broadcast(`[SYS] ${player.name} purchased and installed ${upgrade.name.toUpperCase()}.`, "#00FF00");
      if (upgradeId === "D101") ship.hull = Math.min(120, ship.hull + 20);
      if (upgradeId === "D125") ship.hull = 200;
      await this.saveState();
    } else if (mainCmd === "inventory") {
      if (ship.upgrades.length === 0) {
        this.send(ws, "log", { message: "NO UPGRADES INSTALLED.", color: "#AAAAAA" });
      } else {
        this.send(ws, "log", { message: `--- SHIP SYSTEMS INVENTORY ---`, color: "#FFFF00" });
        ship.upgrades.forEach((id) => {
          const u = UPGRADES[id];
          this.send(ws, "log", { message: `[${id}] ${u.name}: ${u.desc}`, color: "#FFFFFF" });
        });
      }
    } else {
      this.send(ws, "log", { message: `Action '${mainCmd}' not recognized.`, color: "#AAAAAA" });
    }
  }
  startTick() {
    if (this.tickInterval) return;
    this.tickInterval = setInterval(async () => {
      let stateChanged = false;
      for (const shipId in this.ships) {
        const ship = this.ships[shipId];
        if (ship.maxEnergy === void 0) ship.maxEnergy = 50;
        if (ship.shieldsActive === void 0) ship.shieldsActive = false;
        if (ship.evadeActive === void 0) ship.evadeActive = false;
        if (ship.jammedCooldown === void 0) ship.jammedCooldown = 0;
        if (ship.chaffActive === void 0) ship.chaffActive = false;
        if (ship.overchargeActive === void 0) ship.overchargeActive = false;
        if (ship.droneActive === void 0) ship.droneActive = false;
        if (ship.hideActive === void 0) ship.hideActive = false;
        if (ship.overclockActive === void 0) ship.overclockActive = false;
        if (ship.fires === void 0) ship.fires = 0;
        if (ship.enemyModifiers === void 0) ship.enemyModifiers = { weaponsDisabled: 0, enginesDisabled: 0, emped: 0 };
        const broadcast = /* @__PURE__ */ __name((text, color = "#FFFFFF") => {
          ship.crew.forEach((memberId) => {
            const ses = this.sessions.find((s) => s.playerId === memberId);
            if (ses) this.send(ses.ws, "log", { message: text, color });
          });
        }, "broadcast");
        if (ship.energy < ship.maxEnergy) {
          let regen = ship.overclockActive ? 1 : 0.5;
          ship.energy = Math.min(ship.maxEnergy, ship.energy + regen);
          stateChanged = true;
        }
        if (ship.droneActive && Math.random() < 0.1) {
          ship.scrap += 1;
          broadcast(`[DRONE] Recovered 1 unit of scrap.`, "#00FF00");
          stateChanged = true;
        }
        if (ship.overclockActive && Math.random() < 0.05) {
          ship.fires += 1;
          broadcast(`WARNING: OVERCLOCKING HAS STARTED A SECONARY FIRE. (${ship.fires} total)`, "#FF0000");
          stateChanged = true;
        }
        if (ship.fires > 0) {
          let fireDmg = ship.fires * 2;
          ship.hull -= fireDmg;
          if (Math.random() < 0.3) {
            broadcast(`[FIRE] Passive hull damage taken: ${fireDmg}`, "#FF0000");
          }
          stateChanged = true;
        }
        for (const room in ship.cooldowns) {
          if (ship.cooldowns[room] > 0) {
            ship.cooldowns[room] = Math.max(0, ship.cooldowns[room] - 1);
            stateChanged = true;
          }
        }
        if (ship.enemyModifiers.weaponsDisabled > 0) ship.enemyModifiers.weaponsDisabled--;
        if (ship.enemyModifiers.enginesDisabled > 0) ship.enemyModifiers.enginesDisabled--;
        if (ship.enemyModifiers.emped > 0) {
          ship.enemyModifiers.emped--;
          if (ship.enemyModifiers.emped === 0) broadcast(`[!] Enemy ship is rebooting...`, "#00FFFF");
        }
        if (ship.jammedCooldown > 0) ship.jammedCooldown--;
        if (ship.currentEncounter && ship.currentEncounter.type === "ship") {
          if (ship.enemyModifiers.emped === 0 && ship.jammedCooldown === 0) {
            if (Math.random() < 0.15) {
              if (ship.evadeActive && Math.random() < 0.85) {
                broadcast(`[BRIDGE] EVASIVE MANEUVERS SUCCESSFUL! Incoming fire missed!`, "#00FF00");
                ship.evadeActive = false;
              } else if (ship.chaffActive) {
                broadcast(`[WEAPONS] CHAFF DEPLOYED! Incoming missiles deflected!`, "#00FF00");
                ship.chaffActive = false;
              } else {
                const sectorModifier = 1 + ship.sector / NUM_SECTORS;
                let baseDmg = Math.floor(Math.random() * 10) + 5;
                let dmg = Math.floor(baseDmg * sectorModifier);
                if (Math.random() < 0.05) {
                  dmg = Math.floor(dmg * 1.5);
                  broadcast(`[!!!] CRITICAL HIT DETECTED! TARGET STRUCK VULNERABLE SYSTEM rooms!`, "#FF0000");
                }
                if (ship.enemyModifiers.weaponsDisabled > 0) dmg = Math.floor(dmg / 2);
                if (ship.shieldsActive) {
                  dmg = Math.max(0, dmg - 8);
                  broadcast(`[SHIELDS] Absorbed 8 damage.`, "#00FFFF");
                  ship.shieldsActive = false;
                }
                ship.hull -= dmg;
                broadcast(`[!] ${ship.currentEncounter.name.toUpperCase()} FIRED! Took ${dmg} DMG!`, "#FF0000");
                ship.evadeActive = false;
              }
              stateChanged = true;
            }
          } else if (ship.jammedCooldown > 0 && Math.random() < 0.1) {
            broadcast(`[!] Enemy attempted to fire but targeting systems are JAMMED.`, "#00FFFF");
          }
        }
        if (ship.hull <= 0) {
          await this.destroyShip(ship.id);
          stateChanged = true;
          continue;
        }
        if (ship.upgrades.includes("D102")) {
          if (ship.hull < 100 && Math.random() < 0.1) {
            ship.hull++;
            stateChanged = true;
          }
        }
        if (ship.upgrades.includes("U162")) {
          if (ship.currentEncounter && ship.currentEncounter.type === "ship") {
            ship.currentEncounter.hp -= 2;
            if (ship.currentEncounter.hp <= 0) {
              broadcast(`[WEAPONS] AUTO-TURRET CRYSTALLIZED TARGET.`, "#00FF00");
            }
            stateChanged = true;
          }
        }
        if (ship.upgrades.includes("A177")) {
          ship.energy = Math.min(ship.maxEnergy, ship.energy + 0.2);
          stateChanged = true;
        }
        ship.crew.forEach((mid) => {
          const ses = this.sessions.find((s) => s.playerId === mid);
          if (ses) this.send(ses.ws, "ship_sync", {
            hull: ship.hull,
            fuel: ship.fuel,
            energy: Math.floor(ship.energy),
            scrap: ship.scrap,
            credits: ship.credits,
            cooldowns: ship.cooldowns
          });
        });
      }
      if (!this.npcTickCounter) this.npcTickCounter = 0;
      this.npcTickCounter++;
      if (this.npcTickCounter >= 5) {
        this.npcTickCounter = 0;
        for (const npcId in this.npcs) {
          const npc = this.npcs[npcId];
          if (npc.hp <= 0) continue;
          let playersInSector = Object.values(this.ships).filter((s) => s.sector === npc.sector);
          if (npc.cooldown > 0) npc.cooldown--;
          if (playersInSector.length > 0) {
            if (npc.behavior === "aggressive" && npc.cooldown === 0) {
              const targetShip = playersInSector[Math.floor(Math.random() * playersInSector.length)];
              if (!targetShip.currentEncounter || targetShip.currentEncounter.id !== npc.id) {
                targetShip.currentEncounter = {
                  id: npc.id,
                  type: "ship",
                  name: npc.name,
                  hp: npc.hp,
                  maxHp: npc.maxHp,
                  isGlobalNPC: true
                };
                const broadcast = /* @__PURE__ */ __name((text, color = "#FFFFFF") => {
                  targetShip.crew.forEach((memberId) => {
                    const ses = this.sessions.find((s) => s.playerId === memberId);
                    if (ses) this.send(ses.ws, "log", { message: text, color });
                  });
                }, "broadcast");
                broadcast(`
--- WARNING: PROXIMITY ALERT! ---`, "#FF0000");
                broadcast(`[!] ${npc.name.toUpperCase()} HAS ENGAGED YOU!`, "#FF0000");
                npc.cooldown = 1;
                stateChanged = true;
              }
            } else if (npc.behavior === "flee" && npc.cooldown === 0) {
              const links = this.galaxy[npc.sector].links;
              npc.sector = links[Math.floor(Math.random() * links.length)];
              npc.cooldown = 2;
              stateChanged = true;
              playersInSector.forEach((ship) => {
                const broadcast = /* @__PURE__ */ __name((text, color = "#FFFFFF") => {
                  ship.crew.forEach((memberId) => {
                    const ses = this.sessions.find((s) => s.playerId === memberId);
                    if (ses) this.send(ses.ws, "log", { message: text, color });
                  });
                }, "broadcast");
                broadcast(`[SENSORS] ${npc.name} has fled the sector.`, "#AAAAAA");
                if (ship.currentEncounter && ship.currentEncounter.id === npc.id) {
                  ship.currentEncounter = null;
                }
              });
            }
          } else {
            if (Math.random() < 0.2 && npc.cooldown === 0) {
              const links = this.galaxy[npc.sector].links;
              npc.sector = links[Math.floor(Math.random() * links.length)];
              npc.cooldown = 2;
              stateChanged = true;
            }
          }
        }
      }
      if (!this.respawnTickCounter) this.respawnTickCounter = 0;
      this.respawnTickCounter++;
      if (this.respawnTickCounter >= 30) {
        this.respawnTickCounter = 0;
        const emptySectors = Object.values(this.galaxy).filter((s) => !s.encounterType);
        if (emptySectors.length > 0) {
          const targetSector = emptySectors[Math.floor(Math.random() * emptySectors.length)];
          const encounterRoll = Math.random();
          if (encounterRoll < 0.25) {
            const evTemplate = GAME_EVENTS[Math.floor(Math.random() * GAME_EVENTS.length)];
            targetSector.encounterType = evTemplate.type;
            targetSector.encounterData = { id: evTemplate.id };
          } else if (encounterRoll < 0.4) {
            targetSector.encounterType = "asteroid";
            targetSector.encounterData = { hp: 30, name: "Asteroid" };
          } else if (encounterRoll < 0.45) {
            targetSector.encounterType = "ship";
            targetSector.encounterData = { hp: 50, name: "Scrap Pirate" };
          }
          if (targetSector.encounterType) stateChanged = true;
        }
      }
      if (stateChanged) await this.saveState();
    }, 1e3);
  }
};
var worker_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/ws") {
      const id = env.GAME_SERVER.idFromName("global");
      const obj = env.GAME_SERVER.get(id);
      return obj.fetch(request);
    }
    return new Response("Not found", { status: 404 });
  }
};

// ../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-ZYjvud/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = worker_default;

// ../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-ZYjvud/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  GameServer,
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=worker.js.map
