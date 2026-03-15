var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-mr8hhj/checked-fetch.js
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
function getRandomEvent() {
  return GAME_EVENTS[Math.floor(Math.random() * GAME_EVENTS.length)];
}
__name(getRandomEvent, "getRandomEvent");

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
    this.shipCounter = 1;
    this.pendingRequests = {};
    this.sessions = [];
    this.state.blockConcurrencyWhile(async () => {
      let stored = await this.state.storage.get(["ships", "players", "galaxy", "shipCounter", "pendingRequests"]);
      this.ships = stored.get("ships") || {};
      this.players = stored.get("players") || {};
      this.galaxy = stored.get("galaxy") || {};
      this.shipCounter = stored.get("shipCounter") || 1;
      this.pendingRequests = stored.get("pendingRequests") || {};
      if (Object.keys(this.galaxy).length === 0) {
        this.generateGalaxy();
        await this.state.storage.put("galaxy", this.galaxy);
      }
    });
  }
  generateGalaxy() {
    for (let i = 1; i <= NUM_SECTORS; i++) {
      this.galaxy[i] = { id: i, links: [] };
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
    }
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
    const id = crypto.randomUUID();
    const session = { id, ws, playerId: null };
    this.sessions.push(session);
    const newPlayer = {
      id,
      name: `Guest-${Math.floor(Math.random() * 1e3)}`,
      state: "LOBBY",
      room: "Bridge",
      shipId: null
    };
    this.players[id] = newPlayer;
    session.playerId = id;
    this.send(ws, "log", { message: `CONNECTION ESTABLISHED. WELCOME TO SPIRAL NEBULA LOBBY.`, color: "#00FF00" });
    this.send(ws, "log", { message: `Type 'help' to see all available commands.`, color: "#AAAAAA" });
    this.send(ws, "update_ui", { state: "LOBBY" });
    ws.addEventListener("message", async (msg) => {
      try {
        const data = JSON.parse(msg.data);
        if (data.type === "command") {
          await this.handleCommand(session, data.cmd);
        }
      } catch (err) {
        console.error("WS Message Error:", err);
      }
    });
    ws.addEventListener("close", async () => {
      this.sessions = this.sessions.filter((s) => s.id !== id);
      const p = this.players[id];
      if (p && p.shipId) {
        const ship = this.ships[p.shipId];
        if (ship) {
          ship.crew = ship.crew.filter((cid) => cid !== id);
          this.broadcastToShip(ship.id, {
            type: "log",
            data: { message: `[SYS] ${p.name} disconnected.`, color: "#FF0000" }
          });
          if (ship.crew.length === 0) {
            delete this.ships[ship.id];
            delete this.pendingRequests[ship.id];
          }
        }
      }
      delete this.players[id];
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
  async handleCommand(session, cmd) {
    const player = this.players[session.playerId];
    if (!player) return;
    const args = cmd.trim().split(" ");
    const mainCmd = args[0].toLowerCase();
    const ws = session.ws;
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
        scrap: 15,
        currentEncounter: null,
        cooldowns: { "Bridge": 0, "Weapons Cntrl": 0, "Cargo Bay": 0, "Engineering": 0 },
        crew: [player.id]
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
      const sectorData = this.galaxy[ship.sector];
      this.send(ws, "log", { message: `--- LONG RANGE SCANNERS ---`, color: "#FFFF00" });
      this.send(ws, "log", { message: `Current Sector: ${ship.sector}`, color: "#FFFFFF" });
      this.send(ws, "log", { message: `Linked Jump Points: ${sectorData.links.join(", ")}`, color: "#00FFFF" });
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
            this.generateEncounter(ship, broadcast);
            await this.saveState();
          }
        }, 2e3);
      } else {
        this.send(ws, "log", { message: "ERROR: Invalid jump path or no fuel.", color: "#FF0000" });
      }
    } else if (mainCmd === "attack") {
      if (player.room !== ROOMS["weapons"]) {
        this.send(ws, "log", { message: "ERROR: WEAPONS MUST BE EXECUTED FROM WEAPONS CNTRL.", color: "#FF0000" });
        return;
      }
      if (ship.cooldowns["Weapons Cntrl"] > 0 || ship.energy < 5) {
        this.send(ws, "log", { message: "ERROR: Weapons cooling down or low energy.", color: "#FF0000" });
        return;
      }
      if (ship.currentEncounter && (ship.currentEncounter.type === "ship" || ship.currentEncounter.type === "asteroid")) {
        ship.energy -= 5;
        ship.cooldowns["Weapons Cntrl"] = 3;
        const dmg = Math.floor(Math.random() * 20) + 10;
        ship.currentEncounter.hp -= dmg;
        broadcast(`[WEAPONS] Hit ${ship.currentEncounter.name || "Asteroid"} for ${dmg} DMG.`, "#FF00FF");
        if (ship.currentEncounter.hp <= 0) {
          broadcast(`** TARGET DESTROYED **`, "#00FF00");
          if (ship.currentEncounter.type === "ship") {
            const scrap = Math.floor(Math.random() * 30) + 10;
            ship.scrap += scrap;
            broadcast(`Salvaged ${scrap} Scrap.`, "#00FF00");
          }
          ship.currentEncounter = null;
        }
      } else {
        this.send(ws, "log", { message: "ERROR: NO TARGETS.", color: "#FF0000" });
      }
    } else if (mainCmd === "repair") {
      if (player.room !== ROOMS["engineering"]) {
        this.send(ws, "log", { message: "ERROR: REPAIR MUST BE EXECUTED FROM ENGINEERING.", color: "#FF0000" });
        return;
      }
      if (ship.cooldowns["Engineering"] > 0 || ship.scrap < 5 || ship.hull >= 100) {
        this.send(ws, "log", { message: "ERROR: Cannot repair now.", color: "#FF0000" });
        return;
      }
      ship.scrap -= 5;
      ship.hull = Math.min(100, ship.hull + 10);
      ship.cooldowns["Engineering"] = 5;
      broadcast(`[ENGINEERING] Hull repaired by ${player.name}.`, "#00FF00");
    } else if (mainCmd === "mine") {
      if (player.room !== ROOMS["cargo"]) {
        this.send(ws, "log", { message: "ERROR: MINE MUST BE EXECUTED FROM CARGO BAY.", color: "#FF0000" });
        return;
      }
      if (ship.cooldowns["Cargo Bay"] > 0 || ship.energy < 2) {
        this.send(ws, "log", { message: "ERROR: Mining lasers cooling or low energy.", color: "#FF0000" });
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
    } else if (mainCmd === "help") {
      this.send(ws, "log", { message: `--- COMMAND PROTOCOLS ---`, color: "#FFFF00" });
      this.send(ws, "log", { message: `> 'move <room>', 'jump <sector>', 'scan', 'comm <msg>', 'mine', 'attack', 'repair'`, color: "#FFFFFF" });
      this.send(ws, "log", { message: `> 'rename <name>', 'rename ship <name>', 'who', 'help'`, color: "#FFFFFF" });
    } else {
      this.send(ws, "log", { message: `Action '${mainCmd}' not recognized.`, color: "#AAAAAA" });
    }
  }
  generateEncounter(ship, broadcast) {
    const roll = Math.random();
    if (roll < 0.3) {
      const ev = getRandomEvent();
      ship.currentEncounter = { ...ev };
      broadcast(`
--- SENSORS DETECT AN OBJECT ---`, "#FFFF00");
      broadcast(`${ev.title.toUpperCase()} [${ev.type.toUpperCase()}]`, "#00FFFF");
      broadcast(ev.text, "#FFFFFF");
      broadcast("ACTIONS: " + ev.options.map((o) => `'${o.command}'`).join(", "), "#AAAAAA");
    } else if (roll < 0.5) {
      ship.currentEncounter = { type: "asteroid", hp: 30, name: "Asteroid" };
      broadcast(`--- SENSORS DETECT AN ASTEROID ---`, "#FFFF00");
    } else if (roll < 0.6) {
      ship.currentEncounter = { type: "ship", hp: 50, name: "Scrap Pirate" };
      broadcast(`--- PROXIMITY ALERT! ---`, "#FF0000");
    } else {
      ship.currentEncounter = null;
    }
  }
  startTick() {
    if (this.tickInterval) return;
    this.tickInterval = setInterval(async () => {
      let stateChanged = false;
      for (const shipId in this.ships) {
        const ship = this.ships[shipId];
        if (ship.energy < ship.maxEnergy) {
          ship.energy = Math.min(ship.maxEnergy, ship.energy + 0.2);
          stateChanged = true;
        }
        for (const room in ship.cooldowns) {
          if (ship.cooldowns[room] > 0) {
            ship.cooldowns[room] = Math.max(0, ship.cooldowns[room] - 1);
            stateChanged = true;
          }
        }
        if (ship.currentEncounter && ship.currentEncounter.type === "ship") {
          if (Math.random() < 0.1) {
            const dmg = Math.floor(Math.random() * 10) + 5;
            ship.hull -= dmg;
            ship.crew.forEach((mid) => {
              const ses = this.sessions.find((s) => s.playerId === mid);
              if (ses) this.send(ses.ws, "log", { message: `[!] ${ship.currentEncounter.name.toUpperCase()} FIRED! Took ${dmg} DMG!`, color: "#FF0000" });
            });
            stateChanged = true;
          }
        }
        ship.crew.forEach((mid) => {
          const ses = this.sessions.find((s) => s.playerId === mid);
          if (ses) this.send(ses.ws, "ship_sync", { hull: ship.hull, fuel: ship.fuel, energy: Math.floor(ship.energy), scrap: ship.scrap, cooldowns: ship.cooldowns });
        });
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

// .wrangler/tmp/bundle-mr8hhj/middleware-insertion-facade.js
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

// .wrangler/tmp/bundle-mr8hhj/middleware-loader.entry.ts
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
