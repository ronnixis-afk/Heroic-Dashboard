/**
 * AUTO-GENERATED — do not edit by hand.
 *
 * Slim monster type/subtype catalog for Media Library Monster Portraits.
 * Source of truth: heroic-ai-rpg/src/constants/monsterTypes.ts
 *
 * Regenerate:
 *   npm run sync:monster-catalog
 *
 * Last synced: 2026-07-12
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
        "visualDescription": "Looks like a many-legged insect that flickers in and out of sight, its joints bending the wrong way as it crawls."
      },
      {
        "name": "Gnarled Tendril",
        "visualDescription": "Looks like a fallen deadwood trunk wrapped in living muscle, sprouting writhing feelers where branches and bark should grow instead."
      },
      {
        "name": "Mirage Terror",
        "visualDescription": "Looks like a desert heat shimmer given a solid body of crystal and glass, eyes flashing disorienting mirage light patterns."
      },
      {
        "name": "Deep-Sea Beholder",
        "visualDescription": "Looks like a bloated floating eyeball the size of a wooden barrel, trailing glowing translucent tentacles like long jellyfish arms."
      },
      {
        "name": "Storm-Cloud Polyp",
        "visualDescription": "Looks like a living thundercloud balloon crackling with static electricity, dangling tendrils of lightning beneath its swollen gas filled body."
      },
      {
        "name": "Cosmic Scavenger",
        "visualDescription": "Looks like a calcified crab grown from asteroid rock, multi-legged and scavenging hungrily among stellar debris and broken hull scrap."
      }
    ]
  },
  {
    "name": "Beast",
    "description": "Natural, non-magical creatures and typical animals.",
    "subtypes": [
      {
        "name": "Grassland Prowler",
        "visualDescription": "Looks like a wolf built for open plains sprinting, with camouflaged tawny fur and dense muscle running along its flanks."
      },
      {
        "name": "Thicket Stalker",
        "visualDescription": "Looks like a low crocodile crossed with a forest lizard, green scaled and multi jointed for slipping through shadowed underbrush silently."
      },
      {
        "name": "Dune Rover",
        "visualDescription": "Looks like an armored desert tortoise with shovel like forelimbs, built for burrowing deep through hot shifting sand dune flats."
      },
      {
        "name": "Tideclaw Predator",
        "visualDescription": "Looks like a lobster crossed with a hunting wolf, heavy pincers up front and webbed hind limbs for coastal hunting."
      },
      {
        "name": "Skywing Hunter",
        "visualDescription": "Looks like a giant eagle with segmented leathery wings instead of feathers, and razor talons shaped like hooked hunting blades."
      },
      {
        "name": "Void Skimmer",
        "visualDescription": "Looks like a sleek manta ray gliding through empty vacuum, riding shimmering electromagnetic fields instead of warm ocean water currents."
      }
    ]
  },
  {
    "name": "Celestial",
    "description": "Holy beings native to upper or divine realms.",
    "subtypes": [
      {
        "name": "Solar Vanguard",
        "visualDescription": "Looks like an ethereal knight forged from golden light, with armor plates humming with holy radiance instead of cold steel."
      },
      {
        "name": "Grove Guardian",
        "visualDescription": "Looks like a majestic stag shaped from petrified wood and silver vines, its branching antlers glowing with soft divine light."
      },
      {
        "name": "Searing Emissary",
        "visualDescription": "Looks like a hovering angel made entirely of white flame, ringed by rotating golden halos of burning holy light energy."
      },
      {
        "name": "Oceanic Seraph",
        "visualDescription": "Looks like a bioluminescent humanoid draped in warm sea light, skin glowing softly as if lit gently from deep within."
      },
      {
        "name": "Aureole Glider",
        "visualDescription": "Looks like a winged angel woven from pure white light, trailing ribbons of celestial energy behind each graceful slow wingbeat."
      },
      {
        "name": "Nebula Archon",
        "visualDescription": "Looks like a translucent figure woven from starlight and swirling nebula colors, shifting through bright solar hues as it drifts."
      }
    ]
  },
  {
    "name": "Construct",
    "description": "Artificially created or animated objects (like golems or clockwork).",
    "subtypes": [
      {
        "name": "Rustwork Sentinel",
        "visualDescription": "Looks like a bulky iron golem of corroded plates and ticking gears, clanking loudly with every heavy grinding metal step."
      },
      {
        "name": "Rune-Oak Automaton",
        "visualDescription": "Looks like a wooden golem carved from living oak timber, bound tightly by glowing emerald arcane glyphs across its limbs."
      },
      {
        "name": "Scrapwork Scavenger",
        "visualDescription": "Looks like a spindly scavenger bot cobbled from junk metal, dangling wires, and mismatched armor plates scavenged from old wrecks."
      },
      {
        "name": "Brass Mariner",
        "visualDescription": "Looks like an antique bronze diving suit walking on its own power, driven by steam valves and churning water pumps."
      },
      {
        "name": "Aether Skiff",
        "visualDescription": "Looks like a floating brass propeller drone with rotating crystal camera lenses, hovering steadily on spinning aether powered lift rotors."
      },
      {
        "name": "Solar Sentry",
        "visualDescription": "Looks like a polished chrome satellite probe studded with unfolded solar panels, bristling with high intensity energy weapon lens arrays."
      }
    ]
  },
  {
    "name": "Dragon",
    "description": "Powerful, ancient reptilian creatures with innate magic.",
    "subtypes": [
      {
        "name": "Plains Drake",
        "visualDescription": "Looks like a hornless dragon built low like a crocodile, emerald scaled with powerful stocky limbs made for plains sprinting."
      },
      {
        "name": "Forest Wyrm",
        "visualDescription": "Looks like a long serpentine dragon draped in moss colored scales, crowned with twisting branch like horns of living wood."
      },
      {
        "name": "Cinder Drake",
        "visualDescription": "Looks like a soot stained mountain dragon with glowing magma seeping between black obsidian scales like cracks in cooling lava."
      },
      {
        "name": "Reef Dragon",
        "visualDescription": "Looks like a sleek sea dragon with shimmering blue scales and living coral reefs growing thick along its ridged crest."
      },
      {
        "name": "Sky Sovereign",
        "visualDescription": "Looks like a colossal cloud winged dragon crowned with crackling lightning horns, wings stretched out as broad as storm fronts."
      },
      {
        "name": "Void Wyrm",
        "visualDescription": "Looks like an ancient wingless serpent woven from dark matter, swimming silently along gravity lines between cold and distant stars."
      }
    ]
  },
  {
    "name": "Elemental",
    "description": "Entities made entirely of raw natural elements (earth, air, fire, water).",
    "subtypes": [
      {
        "name": "Dust Devil",
        "visualDescription": "Looks like a tornado of sand and dirt given a whirling living body, crackling loudly with dry desert static energy."
      },
      {
        "name": "Living Grove",
        "visualDescription": "Looks like a walking mound of animated loam, tangled roots, and wet moss shaping roughly into a beast like silhouette."
      },
      {
        "name": "Magma Crag",
        "visualDescription": "Looks like a walking pile of molten rock armored in basalt plates, dripping bright lava between the cooling stone cracks."
      },
      {
        "name": "Tidal Wave",
        "visualDescription": "Looks like a surging wall of ocean water shaped into a semi humanoid form that never fully settles or stills."
      },
      {
        "name": "Zephyr Spirit",
        "visualDescription": "Looks like a formless breeze made visible only by glowing vapor clouds swirling restlessly through its restless winding airy path."
      },
      {
        "name": "Stellar Flare",
        "visualDescription": "Looks like an unstable cluster of solar plasma and looping magnetic arcs, burning fiercely like a miniature living sun flare."
      }
    ]
  },
  {
    "name": "Fey",
    "description": "Magical creatures intrinsically tied to nature or twilight realms (like fairies or sprites).",
    "subtypes": [
      {
        "name": "Meadow Sprite",
        "visualDescription": "Looks like a tiny glittering humanoid with gossamer insect wings and soft skin the bright color of fresh spring grass."
      },
      {
        "name": "Bramble Stalker",
        "visualDescription": "Looks like a humanoid wrapped entirely in twisting vines and autumn leaves, with sharp thorns bristling out from every joint."
      },
      {
        "name": "Mirage Pixie",
        "visualDescription": "Looks like a shifting iridescent fairy leaving trails of sparkling mind altering dust that shimmers like desert heat haze mirages."
      },
      {
        "name": "Shore Siren",
        "visualDescription": "Looks like a beautiful humanoid lightly dusted in fish scales, with webbed fingers and long flowing hair of living seaweed."
      },
      {
        "name": "Cloud Nymph",
        "visualDescription": "Looks like a pale floating woman whose flowing garments are woven from soft condensation, white mist, and a gentle breeze."
      },
      {
        "name": "Aurora Dancer",
        "visualDescription": "Looks like a spectral ribbon like sprite trailing glowing aurora colors as it dances and twists through cold empty space."
      }
    ]
  },
  {
    "name": "Fiend",
    "description": "Evil-aligned entities from lower or abyssal realms (demons and devils).",
    "subtypes": [
      {
        "name": "Hellspawn Hound",
        "visualDescription": "Looks like a skeletal wolf wreathed in sulfurous smoke, with eyes burning like hot coals inside a black hell furnace."
      },
      {
        "name": "Rot Demon",
        "visualDescription": "Looks like a bloated green skinned humanoid dripping noxious slime, half wrapped in rotting swamp vegetation and thick black mold."
      },
      {
        "name": "Abyssal Ravager",
        "visualDescription": "Looks like a multi limbed muscular demon with obsidian skin, curving horns, and clawed hands tipped in sharp iron talons."
      },
      {
        "name": "Trench Leviathan",
        "visualDescription": "Looks like a grotesque scale covered sea serpent with spiked claws and a gaping maw wide enough to swallow boats."
      },
      {
        "name": "Imp Harrier",
        "visualDescription": "Looks like a small red skinned leathery winged imp clutching a jagged pitchfork that glows red hot from hellfire heat."
      },
      {
        "name": "Void Terror",
        "visualDescription": "Looks like a formless shadow body etched with glowing violet runes across dark matter skin that never fully settles still."
      }
    ]
  },
  {
    "name": "Giant",
    "description": "Massive, towering humanoids.",
    "subtypes": [
      {
        "name": "Hill Goliath",
        "visualDescription": "Looks like a stocky thick skinned hill giant wearing patched animal hides and swinging a crude massive stone war club."
      },
      {
        "name": "Forest Colossus",
        "visualDescription": "Looks like a towering humanoid with rough bark for skin, cloaked heavily in clinging moss and trailing green forest ivy."
      },
      {
        "name": "Stone Titan",
        "visualDescription": "Looks like a massive humanoid carved from solid mountain granite, with glittering quartz crystals set deep as bright glowing eyes."
      },
      {
        "name": "Ocean Giant",
        "visualDescription": "Looks like a blue skinned ocean giant dressed in heavy robes woven from massive kelp leaves and tangled sea wrack."
      },
      {
        "name": "Storm Giant",
        "visualDescription": "Looks like a majestic giant with crackling blue skin, wild white hair, and piercing eyes that flash bright with thunder."
      },
      {
        "name": "Cosmic Colossus",
        "visualDescription": "Looks like a giant compacted from stardust and meteorite rock, its vast body shifting with the grand scale of constellations."
      }
    ]
  },
  {
    "name": "Humanoid",
    "description": "Bipedal beings with distinct societies and cultures (humans, orcs, elves).",
    "subtypes": [
      {
        "name": "Plains Raider",
        "visualDescription": "Looks like a rugged wind burnt plains scout clad in light leather armor, dust scarves, and protective desert style headwraps."
      },
      {
        "name": "Woodland Ranger",
        "visualDescription": "Looks like a stealthy forest hunter draped in mottled green and brown cloaks that blend deep into dark canopy shade."
      },
      {
        "name": "Nomadic Scavenger",
        "visualDescription": "Looks like a desert mountain traveler layered in cloth wraps, sand goggles, and filter masks against harsh blowing grit storms."
      },
      {
        "name": "Coral Diver",
        "visualDescription": "Looks like a lean gill necked humanoid sealed in a bone reinforced swimming suit built for long deep reef diving."
      },
      {
        "name": "Sky Corsair",
        "visualDescription": "Looks like a daring airship corsair strapped into leather harnesses, wearing flight goggles and a wind torn sky blue cloak."
      },
      {
        "name": "Station Engineer",
        "visualDescription": "Looks like a crew worker sealed inside a bulky modular pressurized hazard suit built for hard orbital station repair work."
      }
    ]
  },
  {
    "name": "Magical Beast",
    "description": "Creatures that resemble natural animals but possess supernatural abilities, high intelligence, or innate magic (often distinct from Monstrosities in certain systems).",
    "subtypes": [
      {
        "name": "Windrunner Wolf",
        "visualDescription": "Looks like a large silver wolf that leaves glowing trails of wind wherever its paws strike the open grassy ground."
      },
      {
        "name": "Grove Owlbear",
        "visualDescription": "Looks like a bear fused with a giant owl, feather furred with glowing green eyes and wooden antler like horns."
      },
      {
        "name": "Cinder Panther",
        "visualDescription": "Looks like a sleek panther with smoking charcoal fur and sharp claws of hot crystal that glow bright like embers."
      },
      {
        "name": "Sea Chimera",
        "visualDescription": "Looks like a multi headed aquatic hybrid armored in hard scale plating, with thick fin webs stretched between its limbs."
      },
      {
        "name": "Storm Griffin",
        "visualDescription": "Looks like a half eagle half lion beast whose broad wings crackle constantly with bright blue electrical storm charge energy."
      },
      {
        "name": "Void Stalker",
        "visualDescription": "Looks like a predatory big cat speckled with living stars, blending into the black empty backdrop of cold deep space."
      }
    ]
  },
  {
    "name": "Monstrosity",
    "description": "Frightening, unnatural creatures that defy the natural order, often the result of curses or magical experimentation.",
    "subtypes": [
      {
        "name": "Plainswarp Hydra",
        "visualDescription": "Looks like a multi headed reptilian hydra whose snapping necks burst out from spatial folds like torn open reality seams."
      },
      {
        "name": "Blighted Chimera",
        "visualDescription": "Looks like a stitched rotting beast with mismatched animal heads and exposed ribs where rotting flesh has already failed away."
      },
      {
        "name": "Gorgon Centaur",
        "visualDescription": "Looks like a half serpent half horse horror bristling with petrifying crystal spikes along its scaled flanks and long mane."
      },
      {
        "name": "Siren Lurker",
        "visualDescription": "Looks like a pale scale coated crawler with eerily human features and long clawed appendages for grasping struggling living prey."
      },
      {
        "name": "Manticore Skimmer",
        "visualDescription": "Looks like a bat winged lion beast with a whip tail made of organic needle launchers instead of a lash."
      },
      {
        "name": "Nebula Horror",
        "visualDescription": "Looks like a shifting multi limbed nightmare with no clear front or back, sheathed entirely in hard alien carapace plating."
      }
    ]
  },
  {
    "name": "Mutant",
    "description": "Creatures biologically warped by wild magic, radiation, or cosmic energies (common in weird-fantasy and sci-fi crossover games).",
    "subtypes": [
      {
        "name": "Glow-Hide Hound",
        "visualDescription": "Looks like a hairless dog with pulsing bioluminescent veins and extra vestigial limbs dangling loosely from both of its sides."
      },
      {
        "name": "Blight-Root Beast",
        "visualDescription": "Looks like a deformed forest animal whose flesh has fused with toxic roots and thorny strangling vines nearly everywhere around."
      },
      {
        "name": "Ash-Walker Juggernaut",
        "visualDescription": "Looks like a heavily mutated stone scaled humanoid with asymmetrical muscles bulging unevenly under cracked ash scarred desert hide plating."
      },
      {
        "name": "Gill-Spawn Crawler",
        "visualDescription": "Looks like an amphibious horror with exposed pulsing gills and oversized webbed claws built specially for wet shoreline mud crawling."
      },
      {
        "name": "Rad-Winged Flyer",
        "visualDescription": "Looks like a bat like beast with glowing irradiated wing membranes and a clustered set of many staring extra eyes."
      },
      {
        "name": "Cosmic Abomination",
        "visualDescription": "Looks like a radiation warped creature studded with crystalline tumors and staring eyes grown all across its twisted alien hide."
      }
    ]
  },
  {
    "name": "Ooze",
    "description": "Amorphous, gelatinous, or mindless mutating forms.",
    "subtypes": [
      {
        "name": "Slime Mold",
        "visualDescription": "Looks like a yellowish pulsing carpet of living protoplasm that slowly digests anything organic it crawls across and covers fully."
      },
      {
        "name": "Acidic Polyp",
        "visualDescription": "Looks like a bubbling emerald green blob that leaves scorched acid trails across wood, leaves, and wet forest floor moss."
      },
      {
        "name": "Tar Bleeder",
        "visualDescription": "Looks like a thick black ooze resembling animated crude oil, reeking strongly of sulfur as it creeps slowly ever forward."
      },
      {
        "name": "Coral Dissolver",
        "visualDescription": "Looks like a translucent stinging sea jelly that dissolves hard shells and bones wherever its soft jelly body first touches."
      },
      {
        "name": "Aerosol Cloud",
        "visualDescription": "Looks like a floating vaporous mist that burns the lungs and eyes of anyone who walks blindly through its path."
      },
      {
        "name": "Void Jelly",
        "visualDescription": "Looks like a dark purple zero gravity jelly filled with sparkling cosmic dust like tiny bright stars trapped in gel."
      }
    ]
  },
  {
    "name": "Outsider",
    "description": "Beings originating from alternate dimensions or planes of existence that do not strictly fall into \"holy\" or \"demonic\" alignments.",
    "subtypes": [
      {
        "name": "Dimension Wanderer",
        "visualDescription": "Looks like a tall slender humanoid whose outlines constantly flicker and warp like broken static on a bad television signal."
      },
      {
        "name": "Ether-Web Weaver",
        "visualDescription": "Looks like a multi limbed forest spider woven entirely from purple energy threads instead of solid flesh and hard chitin."
      },
      {
        "name": "Rift Nomad",
        "visualDescription": "Looks like a cloaked featureless desert nomad wearing a blank mask forged from shimmering pure force fields and void light."
      },
      {
        "name": "Astral Angler",
        "visualDescription": "Looks like a shimmering jellyfish like flyer trailing luminous energy fishing filaments that phase harmlessly through any nearby solid matter."
      },
      {
        "name": "Void Glider",
        "visualDescription": "Looks like a manta ray shaped entity of pure starlight that swims through air currents like warm deep ocean water."
      },
      {
        "name": "Stellar Sentinel",
        "visualDescription": "Looks like a silent geometric crystalline structure rotating in deep void, facets catching and refracting cold distant starlight beam flashes."
      }
    ]
  },
  {
    "name": "Plant",
    "description": "Sentient, mobile, or magically altered botanical life.",
    "subtypes": [
      {
        "name": "Tumble-Weed Creeper",
        "visualDescription": "Looks like a dry ball of thorny tumbleweed branches that rolls quickly across open ground entirely on its own will."
      },
      {
        "name": "Bramble Horror",
        "visualDescription": "Looks like a dense animated thicket of thorned vines and snapping leaf traps shaped into a stalking predatory forest beast."
      },
      {
        "name": "Alpine Lichen",
        "visualDescription": "Looks like a stone colored mountain lichen growth that unfolds rock hard tendrils when anything living approaches much too close."
      },
      {
        "name": "Kelp Strangler",
        "visualDescription": "Looks like a thick waving kelp plant with sticky suction cups and binding leaves that coil tightly like thick ropes."
      },
      {
        "name": "Spore Floater",
        "visualDescription": "Looks like a large drifting seed pod that releases thick clouds of sleeping spores from under its swollen soft underside."
      },
      {
        "name": "Solar Skimmer",
        "visualDescription": "Looks like a vacuum sealed space flower whose broad leaves have become solar sails for drifting slowly between distant stars."
      }
    ]
  },
  {
    "name": "Spirit",
    "description": "Incorporeal entities, psychic echoes, or animistic forces tied to specific concepts or locations (distinct from standard undead).",
    "subtypes": [
      {
        "name": "Wisp Guide",
        "visualDescription": "Looks like a flickering blue will o wisp flame that bobs gently just above the waving tall prairie grass blades."
      },
      {
        "name": "Weeping Shade",
        "visualDescription": "Looks like a weeping translucent specter half lost in forest mist, its pale face streaked with endless cold ghostly tears."
      },
      {
        "name": "Mirage Wraith",
        "visualDescription": "Looks like a shimmering heat wraith rising from desert air, whose burning touch leaves skin bone dry and badly cracked."
      },
      {
        "name": "Drowned Soul",
        "visualDescription": "Looks like a waterlogged glowing phantom trailing seaweed and cold bubbles as it drifts slowly through the dark ocean depths."
      },
      {
        "name": "Phantasm Gale",
        "visualDescription": "Looks like a screaming face sculpted from wind currents and sparkling vapor, howling loudly as it races swiftly past travelers."
      },
      {
        "name": "Cosmic Echo",
        "visualDescription": "Looks like a fading light reflection of a lost astronaut, floating silently forever in the cold and empty vacuum beyond."
      }
    ]
  },
  {
    "name": "Swarm",
    "description": "A collective mass of tiny creatures (like rats, bats, or insects) that function mechanically as a single, overwhelming entity.",
    "subtypes": [
      {
        "name": "Locust Cloud",
        "visualDescription": "Looks like a dense buzzing cloud of chewing locusts that strip all vegetation bare wherever the hungry swarm mass lands."
      },
      {
        "name": "Spore Beetle Swarm",
        "visualDescription": "Looks like thousands of glowing crawling beetles each covered in toxic fungal growths and drifting clouds of poisonous spore dust."
      },
      {
        "name": "Blight Rat Pack",
        "visualDescription": "Looks like a scurrying red eyed colony of diseased rats moving as one coordinated living carpet of filthy matted fur."
      },
      {
        "name": "Stinger Jellyfish Swarm",
        "visualDescription": "Looks like a glowing underwater cloud of tiny translucent jellyfish, each trailing clusters of needle thin stinging tentacle thread fronds."
      },
      {
        "name": "Sky-Wasp Swarm",
        "visualDescription": "Looks like a buzzing swarm of hover wasps with bright orange stingers glinting like hot coals while out in flight."
      },
      {
        "name": "Nanite Swarm",
        "visualDescription": "Looks like a cloud of microscopic silver drones acting with one shared buzzing hive intelligence across the empty silent void."
      }
    ]
  },
  {
    "name": "Undead",
    "description": "Once-living creatures brought back to unlife by dark magic.",
    "subtypes": [
      {
        "name": "Graveyard Ghoul",
        "visualDescription": "Looks like a pale gaunt corpse with elongated claws and dirt stained skin stretched tightly over brittle yellowed dry bone."
      },
      {
        "name": "Blighted Husk",
        "visualDescription": "Looks like a moss covered skeleton bound together by dark energy and parasitic vines wrapping tightly around the old bones."
      },
      {
        "name": "Dust Mummy",
        "visualDescription": "Looks like a desiccated desert corpse wrapped in decaying linen bandages, constantly shedding fine sand and dry desert dust clouds."
      },
      {
        "name": "Drowned Sailor",
        "visualDescription": "Looks like a bloated waterlogged zombie dripping seawater, still clad loosely in the rotted torn rags of a dead sailor."
      },
      {
        "name": "Phantom Wraith",
        "visualDescription": "Looks like a dark hovering specter draped in tattered black cloaks, with hollow eyes burning a deep angry blood red."
      },
      {
        "name": "Star-Husk",
        "visualDescription": "Looks like a reanimated corpse sealed inside a cracked space suit, driven onward only by cold distant cosmic void energies."
      }
    ]
  },
  {
    "name": "Vermin",
    "description": "Mindless or instinct-driven insects, arachnids, and arthropods, often grown to giant proportions.",
    "subtypes": [
      {
        "name": "Prairie Beetle",
        "visualDescription": "Looks like a horse sized hard shelled prairie beetle with heavy chewing mandibles strong enough to crush solid dry bone."
      },
      {
        "name": "Bramble Spider",
        "visualDescription": "Looks like a giant long legged forest spider with a green leaf patterned abdomen, perfectly camouflaged for silent underbrush ambush."
      },
      {
        "name": "Dune Scorpion",
        "visualDescription": "Looks like a sand colored giant desert scorpion with a thick venomous stinger and crushing pair of heavy front claws."
      },
      {
        "name": "Barnacle Crawler",
        "visualDescription": "Looks like a multi legged crustacean parasite clinging to coastal rocks like an oversized living barnacle feeding rock side cluster."
      },
      {
        "name": "Sky Cicada",
        "visualDescription": "Looks like a giant winged sky cicada that produces a deafening high pitched hum audible far across the open sky."
      },
      {
        "name": "Asteroid Tick",
        "visualDescription": "Looks like a silicon shelled parasite that drills into metal hulls like a hungry tick greedily feeding on hull radiation."
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
