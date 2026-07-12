/**
 * Slim monster type/subtype catalog for Media Library Monster Portraits.
 * Source of truth: heroic-ai-rpg/src/constants/monsterTypes.ts — keep in sync when subtypes change.
 */

export interface MonsterPortraitSubtype {
  readonly name: string;
  readonly visualDescription: string;
}

export interface MonsterPortraitType {
  readonly name: string;
  readonly description: string;
  readonly subtypes: readonly MonsterPortraitSubtype[];
}

export const MONSTER_PORTRAIT_CATALOG: readonly MonsterPortraitType[] = [
  {
    "name": "Aberration",
    "description": "Alien, utterly bizarre, or otherworldly entities that defy natural laws.",
    "subtypes": [
      {
        "name": "Phasing Crawler",
        "visualDescription": "A writhing anomaly with multi-jointed limbs that shifts out of phase, appearing and vanishing as it crawls."
      },
      {
        "name": "Gnarled Tendril",
        "visualDescription": "An alien mass of branch-like muscle that mimics deadwood, covered in writhing feelers."
      },
      {
        "name": "Mirage Terror",
        "visualDescription": "A shimmering, heat-distorting entity whose crystalline eyes project disorienting light patterns."
      },
      {
        "name": "Deep-Sea Beholder",
        "visualDescription": "A bloated, multi-eyed levitating orb trailing glowing, translucent tentacles."
      },
      {
        "name": "Storm-Cloud Polyp",
        "visualDescription": "A gas-filled floating bladder crackling with captured static electricity."
      },
      {
        "name": "Cosmic Scavenger",
        "visualDescription": "A calcified, multi-legged horror that feeds on background stellar radiation and space debris."
      }
    ]
  },
  {
    "name": "Beast",
    "description": "Natural, non-magical creatures and typical animals.",
    "subtypes": [
      {
        "name": "Grassland Prowler",
        "visualDescription": "A sleek, quadrupedal hunter with camouflaged fur and high-density muscle built for sprinting."
      },
      {
        "name": "Thicket Stalker",
        "visualDescription": "A low-slung, green-scaled reptile with multi-jointed legs that blends seamlessly with shadows."
      },
      {
        "name": "Dune Rover",
        "visualDescription": "A hard-shelled reptile with shovel-like limbs for burrowing through shifting sand."
      },
      {
        "name": "Tideclaw Predator",
        "visualDescription": "An armored crustacean-beast with heavy pincers and webbed hind limbs."
      },
      {
        "name": "Skywing Hunter",
        "visualDescription": "A massive avian predator with segmented leathery wings and razor-sharp talons."
      },
      {
        "name": "Void Skimmer",
        "visualDescription": "A sleek, vacuum-breathing creature that uses electromagnetic fields to glide between space debris."
      }
    ]
  },
  {
    "name": "Celestial",
    "description": "Holy beings native to upper or divine realms.",
    "subtypes": [
      {
        "name": "Solar Vanguard",
        "visualDescription": "An ethereal warrior clad in gleaming, golden armor plates that hum with holy light."
      },
      {
        "name": "Grove Guardian",
        "visualDescription": "A majestic cervid-like construct made of petrified wood and glowing silver vines."
      },
      {
        "name": "Searing Emissary",
        "visualDescription": "A hovering figure composed of pure white flame and rotating golden rings."
      },
      {
        "name": "Oceanic Seraph",
        "visualDescription": "A glowing, bioluminescent humanoid entity whose skin radiates a calming warm light."
      },
      {
        "name": "Aureole Glider",
        "visualDescription": "A winged angelic presence composed of light, trailing ribbons of celestial energy."
      },
      {
        "name": "Nebula Archon",
        "visualDescription": "A translucent cosmic entity woven from starlight, shifting with solar colors."
      }
    ]
  },
  {
    "name": "Construct",
    "description": "Artificially created or animated objects (like golems or clockwork).",
    "subtypes": [
      {
        "name": "Rustwork Sentinel",
        "visualDescription": "A bulky, clanking automaton made of corroded iron and ticking gears."
      },
      {
        "name": "Rune-Oak Automaton",
        "visualDescription": "An animated wooden golem bound by glowing emerald arcane glyphs."
      },
      {
        "name": "Scrapwork Scavenger",
        "visualDescription": "A spindly construct cobbled together from metal debris, wires, and makeshift armor plates."
      },
      {
        "name": "Brass Mariner",
        "visualDescription": "A pressurized bronze diving suit driven by steam valves and internal water pumps."
      },
      {
        "name": "Aether Skiff",
        "visualDescription": "A floating mechanical drone with brass propellers and rotating crystal lenses."
      },
      {
        "name": "Solar Sentry",
        "visualDescription": "A polished chrome probe with solar panels and high-intensity energy arrays."
      }
    ]
  },
  {
    "name": "Dragon",
    "description": "Powerful, ancient reptilian creatures with innate magic.",
    "subtypes": [
      {
        "name": "Plains Drake",
        "visualDescription": "A hornless, low-slung dragon with emerald scales and powerful, stocky limbs."
      },
      {
        "name": "Forest Wyrm",
        "visualDescription": "A long, serpentine dragon covered in moss-colored scales and branch-like horns."
      },
      {
        "name": "Cinder Drake",
        "visualDescription": "A massive, soot-stained dragon with magma flowing between its obsidian scales."
      },
      {
        "name": "Reef Dragon",
        "visualDescription": "A sleek, finned dragon with shimmering blue scales and coral-like crests."
      },
      {
        "name": "Sky Sovereign",
        "visualDescription": "A colossal dragon with broad, cloud-colored wings and a crown of lightning horns."
      },
      {
        "name": "Void Wyrm",
        "visualDescription": "An ancient, wingless serpent of dark matter that swims through the gravity lines of space."
      }
    ]
  },
  {
    "name": "Elemental",
    "description": "Entities made entirely of raw natural elements (earth, air, fire, water).",
    "subtypes": [
      {
        "name": "Dust Devil",
        "visualDescription": "A swirling vortex of sand, dirt, and crackling dry static energy."
      },
      {
        "name": "Living Grove",
        "visualDescription": "A shifting mound of animated loam, roots, and wet moss."
      },
      {
        "name": "Magma Crag",
        "visualDescription": "A heavy, semi-liquid pile of molten rock and basalt plates."
      },
      {
        "name": "Tidal Wave",
        "visualDescription": "A surging, self-propelled body of water taking on a semi-humanoid shape."
      },
      {
        "name": "Zephyr Spirit",
        "visualDescription": "A formless breeze made visible by carrying glowing, vaporous clouds."
      },
      {
        "name": "Stellar Flare",
        "visualDescription": "A highly unstable cluster of solar plasma and magnetic loops."
      }
    ]
  },
  {
    "name": "Fey",
    "description": "Magical creatures intrinsically tied to nature or twilight realms (like fairies or sprites).",
    "subtypes": [
      {
        "name": "Meadow Sprite",
        "visualDescription": "A tiny, glittering humanoid with gossamer wings and skin like fresh grass."
      },
      {
        "name": "Bramble Stalker",
        "visualDescription": "A thorny humanoid construct made of twisting vines and autumn leaves."
      },
      {
        "name": "Mirage Pixie",
        "visualDescription": "A shifting, iridescent fairy that leaves trails of sparkling, mind-altering dust."
      },
      {
        "name": "Shore Siren",
        "visualDescription": "A beautiful, scale-dusted humanoid with webbed fingers and seaweed hair."
      },
      {
        "name": "Cloud Nymph",
        "visualDescription": "A pale, floating entity whose garments are made of woven condensation and breeze."
      },
      {
        "name": "Aurora Dancer",
        "visualDescription": "A spectral, ribbon-like sprite that leaves a glowing trail resembling the northern lights."
      }
    ]
  },
  {
    "name": "Fiend",
    "description": "Evil-aligned entities from lower or abyssal realms (demons and devils).",
    "subtypes": [
      {
        "name": "Hellspawn Hound",
        "visualDescription": "A skeletal canine surrounded by sulfurous smoke and burning coal eyes."
      },
      {
        "name": "Rot Demon",
        "visualDescription": "A bloated, green-skinned humanoid dripping with noxious slime and rotting vegetation."
      },
      {
        "name": "Abyssal Ravager",
        "visualDescription": "A multi-limbed, muscular demon with obsidian skin, curving horns, and iron talons."
      },
      {
        "name": "Trench Leviathan",
        "visualDescription": "A grotesque, scale-covered monstrosity with long, spiked claws and a gaping maw."
      },
      {
        "name": "Imp Harrier",
        "visualDescription": "A leathery-winged, red-skinned imp carrying a jagged, red-hot pitchfork."
      },
      {
        "name": "Void Terror",
        "visualDescription": "A formless entity with glowing violet runes etched across its dark-matter skin."
      }
    ]
  },
  {
    "name": "Giant",
    "description": "Massive, towering humanoids.",
    "subtypes": [
      {
        "name": "Hill Goliath",
        "visualDescription": "A stocky, thick-skinned giant wearing patched hides and carrying a stone club."
      },
      {
        "name": "Forest Colossus",
        "visualDescription": "A towering giant with skin like bark, covered in clinging moss and ivy."
      },
      {
        "name": "Stone Titan",
        "visualDescription": "A massive humanoid carved from solid granite, with quartz crystals for eyes."
      },
      {
        "name": "Ocean Giant",
        "visualDescription": "A blue-skinned giant wearing clothing woven from massive kelp leaves."
      },
      {
        "name": "Storm Giant",
        "visualDescription": "A majestic giant with crackling blue skin, white hair, and eyes that flash with thunder."
      },
      {
        "name": "Cosmic Colossus",
        "visualDescription": "A giant composed of compacted stardust and meteorites, shifting with cosmic scale."
      }
    ]
  },
  {
    "name": "Humanoid",
    "description": "Bipedal beings with distinct societies and cultures (humans, orcs, elves).",
    "subtypes": [
      {
        "name": "Plains Raider",
        "visualDescription": "A rugged, wind-burnt scout clad in light leather and protective headwraps."
      },
      {
        "name": "Woodland Ranger",
        "visualDescription": "A stealthy hunter dressed in mottled green and brown cloaks."
      },
      {
        "name": "Nomadic Scavenger",
        "visualDescription": "A traveler wearing protective layers of cloth, goggles, and filter masks."
      },
      {
        "name": "Coral Diver",
        "visualDescription": "A lean, gill-necked humanoid wearing bone-reinforced swimming suits."
      },
      {
        "name": "Sky Corsair",
        "visualDescription": "An aviator equipped with leather harness straps, flight goggles, and cloaks."
      },
      {
        "name": "Station Engineer",
        "visualDescription": "A worker sealed inside a modular, pressurized environmental hazard suit."
      }
    ]
  },
  {
    "name": "Magical Beast",
    "description": "Creatures that resemble natural animals but possess supernatural abilities, high intelligence, or innate magic (often distinct from Monstrosities in certain systems).",
    "subtypes": [
      {
        "name": "Windrunner Wolf",
        "visualDescription": "A large wolf with silver fur that leaves glowing trails of wind in its wake."
      },
      {
        "name": "Grove Owlbear",
        "visualDescription": "A massive, feather-furred hybrid with glowing green eyes and wooden horns."
      },
      {
        "name": "Cinder Panther",
        "visualDescription": "A sleek cat with smoking, charcoal-colored fur and claws made of hot crystal."
      },
      {
        "name": "Sea Chimera",
        "visualDescription": "A multi-headed aquatic hybrid with scale plating and thick fin-webs."
      },
      {
        "name": "Storm Griffin",
        "visualDescription": "A half-eagle, half-lion beast whose wings crackle with blue electrical charge."
      },
      {
        "name": "Void Stalker",
        "visualDescription": "A star-speckled, predatory cat that blends into the background of space."
      }
    ]
  },
  {
    "name": "Monstrosity",
    "description": "Frightening, unnatural creatures that defy the natural order, often the result of curses or magical experimentation.",
    "subtypes": [
      {
        "name": "Plainswarp Hydra",
        "visualDescription": "A multi-headed reptilian horror whose heads snap out from spatial folds."
      },
      {
        "name": "Blighted Chimera",
        "visualDescription": "A stitched, rotting beast with multiple animal heads and exposed ribs."
      },
      {
        "name": "Gorgon Centaur",
        "visualDescription": "A half-serpent, half-horse creature with petrifying crystal protrusions."
      },
      {
        "name": "Siren Lurker",
        "visualDescription": "A pale, scale-coated crawler with human-like features and long clawed appendages."
      },
      {
        "name": "Manticore Skimmer",
        "visualDescription": "A bat-winged lion-beast with a tail composed of organic needle-launchers."
      },
      {
        "name": "Nebula Horror",
        "visualDescription": "A shifting, multi-limbed nightmare with no defined front or back, covered in alien carapace."
      }
    ]
  },
  {
    "name": "Mutant",
    "description": "Creatures biologically warped by wild magic, radiation, or cosmic energies (common in weird-fantasy and sci-fi crossover games).",
    "subtypes": [
      {
        "name": "Glow-Hide Hound",
        "visualDescription": "A hairless dog with pulsing, bioluminescent veins and extra vestigial limbs."
      },
      {
        "name": "Blight-Root Beast",
        "visualDescription": "A deformed animal whose flesh has fused with toxic roots and thorny vines."
      },
      {
        "name": "Ash-Walker Juggernaut",
        "visualDescription": "A heavily mutated, stone-scaled humanoid with asymmetrical muscles."
      },
      {
        "name": "Gill-Spawn Crawler",
        "visualDescription": "An amphibious creature with exposed, pulsing gills and webbed claws."
      },
      {
        "name": "Rad-Winged Flyer",
        "visualDescription": "A bat-like beast with glowing, irradiated membranes and multiple eyes."
      },
      {
        "name": "Cosmic Abomination",
        "visualDescription": "A creature warped by solar radiation, covered in crystalline tumors and eyes."
      }
    ]
  },
  {
    "name": "Ooze",
    "description": "Amorphous, gelatinous, or mindless mutating forms.",
    "subtypes": [
      {
        "name": "Slime Mold",
        "visualDescription": "A yellowish, pulsing carpet of protoplasm that digests organic matter."
      },
      {
        "name": "Acidic Polyp",
        "visualDescription": "A bubbling, emerald-green blob that leaves scorched trails on wood and moss."
      },
      {
        "name": "Tar Bleeder",
        "visualDescription": "A thick, black ooze resembling animated crude oil, smelling of sulfur."
      },
      {
        "name": "Coral Dissolver",
        "visualDescription": "A translucent, stinging jelly that dissolves shells and bones on contact."
      },
      {
        "name": "Aerosol Cloud",
        "visualDescription": "A floating, vaporous mist that burns the lungs and eyes of those who touch it."
      },
      {
        "name": "Void Jelly",
        "visualDescription": "A dark purple, zero-gravity jelly filled with sparkling cosmic dust particles."
      }
    ]
  },
  {
    "name": "Outsider",
    "description": "Beings originating from alternate dimensions or planes of existence that do not strictly fall into \\",
    "subtypes": [
      {
        "name": "Dimension Wanderer",
        "visualDescription": "A tall, slender figure whose outlines flicker and warp like a bad signal."
      },
      {
        "name": "Ether-Web Weaver",
        "visualDescription": "A multi-limbed spider-like entity made of purple energy threads."
      },
      {
        "name": "Rift Nomad",
        "visualDescription": "A cloaked, featureless humanoid wearing masks made of pure force fields."
      },
      {
        "name": "Astral Angler",
        "visualDescription": "A shimmering jellyfish-like flyer trailing energy filaments that phase through matter."
      },
      {
        "name": "Void Glider",
        "visualDescription": "A manta-ray-shaped entity of pure starlight that swims through air currents."
      },
      {
        "name": "Stellar Sentinel",
        "visualDescription": "A geometric crystalline structure that rotates silently in the void of space."
      }
    ]
  },
  {
    "name": "Plant",
    "description": "Sentient, mobile, or magically altered botanical life.",
    "subtypes": [
      {
        "name": "Tumble-Weed Creeper",
        "visualDescription": "A dry, ball-like mass of thorny branches that rolls quickly across open ground."
      },
      {
        "name": "Bramble Horror",
        "visualDescription": "A dense, animated cluster of thorned vines and snapping leaf traps."
      },
      {
        "name": "Alpine Lichen",
        "visualDescription": "A stone-like plant growth that unfolds rock-hard tendrils when approached."
      },
      {
        "name": "Kelp Strangler",
        "visualDescription": "A thick, waving sea-plant with suction cups and strong binding leaves."
      },
      {
        "name": "Spore Floater",
        "visualDescription": "A large, drifting seed pod that releases clouds of sleeping spores."
      },
      {
        "name": "Solar Skimmer",
        "visualDescription": "A hardy, vacuum-sealed space flower with leaves modified into solar sails."
      }
    ]
  },
  {
    "name": "Spirit",
    "description": "Incorporeal entities, psychic echoes, or animistic forces tied to specific concepts or locations (distinct from standard undead).",
    "subtypes": [
      {
        "name": "Wisp Guide",
        "visualDescription": "A flickering, blue flame that bobs gently above the grass."
      },
      {
        "name": "Weeping Shade",
        "visualDescription": "A weeping, translucent specter that blends into forest mists."
      },
      {
        "name": "Mirage Wraith",
        "visualDescription": "A shimmering heat-wraith whose touch causes dry dehydration."
      },
      {
        "name": "Drowned Soul",
        "visualDescription": "A waterlogged, glowing phantom trailing seaweed and cold bubbles."
      },
      {
        "name": "Phantasm Gale",
        "visualDescription": "A screaming face formed from wind currents and sparkling vapor."
      },
      {
        "name": "Cosmic Echo",
        "visualDescription": "A fading light reflection of a lost astronaut, floating silently in vacuum."
      }
    ]
  },
  {
    "name": "Swarm",
    "description": "A collective mass of tiny creatures (like rats, bats, or insects) that function mechanically as a single, overwhelming entity.",
    "subtypes": [
      {
        "name": "Locust Cloud",
        "visualDescription": "A dense, buzzing mass of chewing insects that strip everything bare."
      },
      {
        "name": "Spore Beetle Swarm",
        "visualDescription": "Thousands of glowing, crawling insects covered in toxic fungal growths."
      },
      {
        "name": "Blight Rat Pack",
        "visualDescription": "A scurrying, red-eyed colony of diseased rodents that move in unison."
      },
      {
        "name": "Stinger Jellyfish Swarm",
        "visualDescription": "A glowing cloud of tiny, translucent jellyfish with stinging tentacles."
      },
      {
        "name": "Sky-Wasp Swarm",
        "visualDescription": "A buzzing swarm of hover-capable insects with bright orange stingers."
      },
      {
        "name": "Nanite Swarm",
        "visualDescription": "A cloud of microscopic silver drones acting with a single, buzzing intelligence."
      }
    ]
  },
  {
    "name": "Undead",
    "description": "Once-living creatures brought back to unlife by dark magic.",
    "subtypes": [
      {
        "name": "Graveyard Ghoul",
        "visualDescription": "A pale, gaunt corpse with elongated claws and dirt-stained skin."
      },
      {
        "name": "Blighted Husk",
        "visualDescription": "A moss-covered skeleton bound together by dark energy and parasitic vines."
      },
      {
        "name": "Dust Mummy",
        "visualDescription": "A desiccated corpse wrapped in decaying linen, emitting sand and dust."
      },
      {
        "name": "Drowned Sailor",
        "visualDescription": "A bloated, waterlogged zombie dripping water and clad in rotted rags."
      },
      {
        "name": "Phantom Wraith",
        "visualDescription": "A dark, hovering specter draped in tattered black cloaks with burning red eyes."
      },
      {
        "name": "Star-Husk",
        "visualDescription": "A reanimated body preserved in a cracked space suit, driven by cosmic energies."
      }
    ]
  },
  {
    "name": "Vermin",
    "description": "Mindless or instinct-driven insects, arachnids, and arthropods, often grown to giant proportions.",
    "subtypes": [
      {
        "name": "Prairie Beetle",
        "visualDescription": "A horse-sized, hard-shelled beetle with heavy chewing mandibles."
      },
      {
        "name": "Bramble Spider",
        "visualDescription": "A long-legged spider with a green, leaf-patterned abdomen."
      },
      {
        "name": "Dune Scorpion",
        "visualDescription": "A sand-colored arachnid with a thick stinger and heavy front claws."
      },
      {
        "name": "Barnacle Crawler",
        "visualDescription": "A multi-legged crustacean parasite that clings to coastal rocks."
      },
      {
        "name": "Sky Cicada",
        "visualDescription": "A giant, winged insect that produces a deafening, high-pitched hum."
      },
      {
        "name": "Asteroid Tick",
        "visualDescription": "A silicon-shelled parasite that drills into metal hulls to feed on radiation."
      }
    ]
  }
] as const;

export const getMonsterTypeNames = (): string[] =>
  MONSTER_PORTRAIT_CATALOG.map((entry) => entry.name);

export const getMonsterSubtypes = (typeName: string): readonly MonsterPortraitSubtype[] => {
  const match = MONSTER_PORTRAIT_CATALOG.find(
    (entry) => entry.name.toLowerCase() === typeName.trim().toLowerCase()
  );
  return match?.subtypes ?? [];
};

export const getMonsterSubtypeDescription = (typeName: string, subtypeName: string): string => {
  const subtype = getMonsterSubtypes(typeName).find(
    (entry) => entry.name.toLowerCase() === subtypeName.trim().toLowerCase()
  );
  return subtype?.visualDescription ?? '';
};
