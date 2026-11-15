// data.js — the "notebook": facts, real data, missions and words used in the game.
// Nothing here runs the game. Edit this file to add facts, missions or discoveries!

// -----------------------------------------------------------------------
// 1) YOUR NASA API KEY
// -----------------------------------------------------------------------
// "DEMO_KEY" works for quick tests but is shared by everyone and can get
// blocked. Get your own free key at https://api.nasa.gov/ and paste it here.
const NASA_API_KEY = "DEMO_KEY";

// -----------------------------------------------------------------------
// 2) BACKUP FLARES (used when live NASA data cannot be loaded)
// -----------------------------------------------------------------------
// Well-known real solar flares. The game labels them "ARCHIVED", never "live".
// TO-DO FOR THE TEAM: check each one on https://ccmc.gsfc.nasa.gov/tools/DONKI/
// (date, class, sunspot region) and fix anything that is wrong.
const ARCHIVED_FLARES = [
  { id: "2024-05-14", date: "2024-05-14", classType: "X8.7", region: "3664" },
  { id: "2024-10-03", date: "2024-10-03", classType: "X9.0", region: "3842" },
  { id: "2024-05-11", date: "2024-05-11", classType: "X5.8", region: "3664" },
  { id: "2017-09-06", date: "2017-09-06", classType: "X9.3", region: "2673" },
  { id: "2003-11-04", date: "2003-11-04", classType: "X28", region: "10486" }
];

// -----------------------------------------------------------------------
// 3) "DID YOU KNOW?" FACTS (shown by Earth when you call home)
// -----------------------------------------------------------------------
const FACTS = [
  { art: "flarescale", text: "Flares are rated A, B, C, M, X. Each letter is 10 times stronger!", source: "NASA / DONKI" },
  { art: "lighttime", text: "Flare light reaches the Moon in 8 minutes. The big particle clouds take 1 to 3 days.", source: "NASA / DONKI" },
  { art: "magfield", text: "Earth's magnetic field blocks most flare radiation. The Moon has none, so we need a shield.", source: "NASA science" },
  { art: "regolith", text: "Piling Moon soil over a base is one idea for a radiation shield.", source: "NASA Artemis" },
  { art: "dosimeter", text: "Astronauts wear tiny badges that count how much radiation they get.", source: "NASA OSDR RadLab" },
  { art: "dosimeter", text: "NASA's RadLab shares real radiation measurements from the space station.", source: "NASA OSDR RadLab" },
  { art: "nightlength", text: "A Moon night lasts two Earth weeks, so panels make no power. Some south pole peaks stay sunny much longer.", source: "NASA Artemis" },
  { art: "dust", text: "Moon dust is sharp and sticky. It coats panels and makes them weaker.", source: "NASA Apollo and Artemis" },
  { art: "radio", text: "Radio takes about 1.3 seconds from Earth to the Moon.", source: "NASA communications" },
  { art: "plants", text: "Growing food in space keeps astronauts healthy.", source: "Canadian Space Agency" },
  { art: "iceshadow", text: "Water ice hides in dark craters near the Moon's poles.", source: "NASA Artemis" },
  { art: "electrolysis", text: "Electricity can split water into oxygen to breathe and hydrogen for fuel.", source: "NASA" }
];

// -----------------------------------------------------------------------
// 4) THE STORY (shown before the game starts; short on purpose)
// -----------------------------------------------------------------------
const CREW_NAME = "Sam";
const STORY = [
  { pic: "🚀🚀", text: "Two astronauts flew from Earth to the Moon: YOU and your friend " + CREW_NAME + "." },
  { pic: "🌕", text: "Your pod landed on the NEAR side. " + CREW_NAME + " landed on the FAR side. You are on opposite sides of the Moon!" },
  { pic: "🚙", text: "To reach " + CREW_NAME + " you need a ROVER. Earth can build rover parts, but only if you send them science. 🔬➜🌍" }
];

// The first lesson: how to live on the Moon (three short slides with pictures)
const TUTORIAL = [
  { art: "noair", title: "1. The Moon has no air", text: "We can't breathe outside. Our base makes air from water using electricity. Turn the air generator ON!" },
  { art: "icefood", title: "2. Food needs ice", text: "Plants need water. On the Moon, water is frozen ice. Grab ice crystals and bring them to the greenhouse." },
  { art: "solardirty", title: "3. Power comes from the Sun", text: "Solar panels make all our power. Moon dust makes them dirty, so keep them clean!" }
];

// Dr. Nova's help cards. They show the first time a bar turns yellow, in very simple words.
// fix = a list of things to try. art = a little picture.
const COACH = {
  battery: { icon: "🔋", hud: ["g-battery", "power-rate"], title: "Battery is low", art: "battery", why: "Machines use more power than the panels make.",
    fix: ["🧹 Clean the solar panels", "⏻ Turn OFF a machine you don't need", "⏳ Or wait: the Sun refills it"] },
  netneg: { icon: "➖", hud: ["g-battery", "power-rate"], title: "Using more power than you make", art: "battery", why: "Look at the glowing battery on your screen. ☀️ is power the panels make, 🔌 is power machines use. If the total (=) is negative, the battery slowly empties.",
    fix: ["🧹 Clean the panels", "⏻ Turn OFF the lab or greenhouse when idle", "🚀 Use BOOST only for flares"] },
  energy: { icon: "⚡", title: "You are tired", art: "energy", why: "Astronauts need food to have energy.",
    fix: ["🍎 Eat at the table", "🌱 No food? Grow some with ice", "🛏️ Sleeping helps too"] },
  air_out: { icon: "💨", title: "Your air is low!", art: "air", why: "Your suit air runs out outside the base.",
    fix: ["🏠 Go back inside the base", "🚙 Ride the rover home", "⏱️ Take shorter trips"] },
  air_in: { icon: "💨", title: "The air is going stale", art: "air", why: "The air generator is OFF.",
    fix: ["💨 Press E at the air generator", "Choose ON and wait 10 seconds", "🔋 It needs battery power"] },
  radbadge: { icon: "☢️", title: "Your radiation badge is counting!", art: "dosimeter", hud: ["g-rad"],
    why: "Real astronauts wear a tiny radiation badge, just like this one. Your ☢️ bar (top left) is YOUR badge. It started counting because the flare's particles are reaching you.",
    fix: ["🏠 Get inside the shield bubble", "🛡️ BOOST the shield to block more", "📈 Watch the bar: higher number = more radiation"] },
  rad: { icon: "☢️", hud: ["g-rad"], title: "Radiation is building up", art: "radiation", why: "A solar flare sends fast particles. Too much makes you sick and slow.",
    fix: ["🏠 Get inside the shield", "🛡️ Set the shield to BOOST", "⏳ Stay in until it ends"] },
  dust: { icon: "🧹", title: "Panels are very dirty!", art: "solardirty", why: "Dust covers over half the panels, so they make less power.",
    fix: ["🧹 Stand by the panels and press E", "🪥 Clean before bed and after waking", "💡 Clean panels = more power"] },
  blackout: { icon: "💡", title: "Blackout! No power", art: "battery", why: "The battery hit zero. Every machine is OFF and Zorp used a rescue.",
    fix: ["💨 Turn the air generator ON first", "🧹 Clean the panels", "⏻ Turn machines on one at a time"] },
  autooff: { icon: "💤", title: "A machine turned itself OFF", art: "battery", why: "It had nothing to do, so it switched OFF to save power.",
    fix: ["🔬 Bring samples, then switch the lab ON", "🌱 Bring ice, then switch the greenhouse ON", "🔋 Saved power helps the battery"] },
  storm: { icon: "🌪️", title: "A dust storm is here!", art: "solardirty", why: "Dust in the sky blocks the Sun. Panels make much less power today.",
    fix: ["🔋 Save power: turn OFF extra machines", "🧹 Clean the panels after the storm", "⏳ Storms pass in a day"] },
  apples: { icon: "🍎", title: "Your apples are ready!", art: "plants", why: "Ripe apples glow and bounce. Pick them up at the greenhouse!",
    fix: ["🌱 Walk to the greenhouse", "Press E to harvest", "🍎 Eat at the table for energy"] }
};

// -----------------------------------------------------------------------
// 5) PLACES TO DISCOVER (found by walking around the Moon)
// -----------------------------------------------------------------------
const DISCOVERIES = {
  lander: {
    title: "The Old Lander", icon: "🛰️", art: "lander",
    text: "A dusty old robot probe. Landers carry cameras to study the Moon.",
    source: "NASA robotic missions"
  },
  cave: {
    title: "Moon Caves", icon: "🕳️", art: "mooncave",
    text: "Lava once flowed here and left empty tunnels. A cave roof can shield astronauts from radiation!",
    source: "NASA lunar science (lava tubes)"
  },
  zorp: {
    title: "Zorp's Gift", icon: "👽", noPlus: false,
    pages: [
      { art: "zorp", title: "Zorp's Gift", text: "Zorp gives you a power crystal and shows the way to Crystal Crater. He will rescue you up to 3 times!", source: "Our game's imagination" },
      { art: "familyphoto", title: "Zorp's favorite treasure", text: "Zorp picked up a REAL family photo! Apollo 16 astronaut Charlie Duke left it on the Moon in 1972.", source: "NASA Apollo 16 (photo AS16-117-18841)", localPhoto: "assets/apollo16-family-photo.jpg" }
    ],
    source: "Our game's imagination"
  },
  earth: {
    title: "Earth Lookout", icon: "🌍", art: "earthrise", photo: "as08-14-2383",
    pages: [
      { art: "earthrise", title: "Earth Lookout", photo: "as08-14-2383", text: "That is Earth, our home, hanging in the Moon's sky!", source: "NASA Apollo 8 photo (Earthrise)" },
      { earthView: true, title: "🔭 Look through the telescope", source: "NASA" }
    ],
    text: "That is Earth, our home, hanging in the Moon's sky!",
    source: "NASA Apollo 8 photo (Earthrise)"
  },
  tranquility: {
    title: "Tranquility Base", icon: "🇺🇸", art: "tranquility",
    pages: [
      { art: "eagle", title: "The Eagle has landed", text: "July 20, 1969: Apollo 11 landed here. Neil Armstrong took the first step.", source: "NASA Apollo 11" },
      { art: "flagplant", title: "The flag", text: "They planted a flag. No wind, so a rod holds it out.", photo: "as11-40-5875", source: "NASA Apollo 11 photo" },
      { art: "descent", title: "The platform stays", text: "The bottom of Eagle, the descent stage, is still here. Its plaque says: we came in peace.", source: "NASA Apollo 11" },
      { art: "flagfall", title: "The flag fell", text: "When Eagle blasted off, the exhaust knocked the flag over!", source: "NASA Apollo 11" }
    ],
    text: "Apollo 11's landing site. See the flag and the platform Eagle left behind.",
    source: "NASA Apollo 11"
  },
  crystalcrater: {
    title: "Crystal Crater", icon: "💎", art: "crystals", rover: true,
    pages: [
      { art: "crystals", title: "Crystal Crater", text: "A crater full of sparkly crystals in yellow, white, green and red. (The glowing crystals are our game's imagination.)", source: "Our game's imagination" },
      { art: "crystals", title: "Real crystals on Mars!", localPhoto: "assets/sulfur-crystals.jpg", caption: "NASA/JPL-Caltech/MSSS · Curiosity, 2024", text: "In 2024 the Curiosity rover rolled over a rock and broke it open. Inside were yellow crystals of pure sulfur!", source: "NASA Curiosity" },
      { art: "crystals", title: "Crystals in a crack", localPhoto: "assets/sulfur-crack.jpg", caption: "NASA/JPL-Caltech/MSSS · Curiosity, 2024", text: "Yellow and green sulfur crystals shine out of a crack in the ground. Scientists study them to learn how Mars changed.", source: "NASA Curiosity" },
      { art: "crystals", title: "A pale, bumpy rock", localPhoto: "assets/sulfur-white-rock.jpg", caption: "NASA/JPL-Caltech/MSSS · Curiosity, 2024", text: "Curiosity also photographed pale, bumpy, hole-filled rocks. Every new rock is a clue about Mars long ago.", source: "NASA Curiosity" }
    ],
    text: "A crater full of sparkly crystals. Real sulfur crystals were found by Curiosity on Mars.", source: "NASA Curiosity + our game's imagination"
  },
  alpha: {
    title: "Landing Site Alpha", icon: "🛰️", art: "oldsite",
    text: "Old landing sites keep their metal parts. There is no wind or rain to wear them away.",
    source: "NASA Apollo", rover: true
  },
  southpole: {
    title: "The South Pole", icon: "🧊", art: "southpole",
    text: "Some craters here never see sunlight. Water ice hides in them.",
    source: "NASA Artemis", rover: true
  },
  northpole: {
    title: "The North Pole", icon: "🌑", art: "northpole",
    text: "The Sun stays low, so shadows are long. Some peaks get sun for a very long time.",
    source: "NASA science", rover: true
  }
};

// All the places you can reach by rover (fast travel). Edit names and costs here!
const DESTINATIONS = [
  { id: "crater",  name: "Crystal Crater",     icon: "💎", note: "Crystals are worth the most science! Zorp knows the way." },
  { id: "landing", name: "Landing Site Alpha", icon: "🔩", note: "Collect metal scraps" },
  { id: "far",     name: "Far Side Camp",      icon: "🧑‍🚀", note: "Where " + CREW_NAME + " is waiting!" }
];

// -----------------------------------------------------------------------
// 6) MISSIONS (what Earth asks you to do each day)
// -----------------------------------------------------------------------
// type: ice | study | rock | metal | crystal | clean | harvest | explore | flare | send | assemble | meet
const MISSION_ICONS = { ice: "❄️", study: "🔬", rock: "🪨", metal: "🔩", crystal: "💎", clean: "🧹", harvest: "🍎", explore: "🧭", flare: "☀️", send: "🚀", assemble: "🔧", meet: "🧑‍🚀" };

function missionText(m) {
  switch (m.type) {
    case "ice":      return "Get " + m.n + " ice and bring it to the greenhouse";
    case "study":    return "Study " + m.n + " rock" + (m.n === 1 ? "" : "s") + " in the lab";
    case "rock":     return "Study " + m.n + " rocks in the lab";
    case "metal":    return "Study " + m.n + " metal scraps in the lab";
    case "crystal":  return "Study " + m.n + " crystals in the lab";
    case "clean":    return "Clean the solar panels";
    case "harvest":  return "Harvest food from the greenhouse";
    case "explore":  return "Find the " + DISCOVERIES[m.loc].title;
    case "flare":    return "Stay safe from the solar flare";
    case "send":     return "Launch your research to Earth";
    case "assemble": return "Build the rover part at the Rover Bay";
    case "meet":     return "Drive the rover to " + CREW_NAME + " at Far Side Camp";
  }
  return "Mission";
}

// Extra missions used when the main story mission is already on your list.
// Earth never gives you more than 2 at once. Rover-only ones appear after the rover is built.
const MISSION_FILLERS = [
  { type: "clean", n: 1 },
  { type: "explore", loc: "cave", n: 1 },
  { type: "explore", loc: "lander", n: 1 },
  { type: "ice", n: 2 },
  { type: "explore", loc: "tranquility", n: 1 },
  { type: "explore", loc: "earth", n: 1 },
  { type: "harvest", n: 2 },
  { type: "crystal", n: 2 },
  { type: "metal", n: 2 },
  { type: "explore", loc: "southpole", n: 1 },
  { type: "explore", loc: "northpole", n: 1 },
  { type: "explore", loc: "crystalcrater", n: 1 },
  { type: "explore", loc: "alpha", n: 1 }
];

// -----------------------------------------------------------------------
// 7) BOLT THE ROBOT'S HINTS (short on purpose!)
// -----------------------------------------------------------------------
const HINTS = {
  start:        "Welcome! First, turn on the AIR generator 💨.",
  start_plain:  "Good morning! Go to the computer 🖥️ to talk to Earth.",
  after_call:   "Your missions are in the corner. Follow the arrow!",
  low_air:      "💨 Air is low! Go back inside the base bubble.",
  stale_air:    "💨 The air inside is going stale. Is the air generator ON?",
  blackout:     "💡 Lights out! Zorp used 1 rescue. Restart the air generator first!",
  low_battery:  "🔋 Battery is low! Turn a machine OFF or clean the panels 🧹.",
  dusty:        "🧹 Dusty panels make less power. Clean them!",
  lab_off:      "🔬 The lab is OFF. Turn it on to study samples.",
  gh_off:       "🌱 Water is in! Turn the greenhouse ON.",
  gh_ask:       "🌱 Great job! Now go to the greenhouse and turn it ON so the plants can grow.",
  no_water:     "💧 The greenhouse is thirsty. Bring ❄️ ice!",
  hungry:       "⚡ You are tired. Eat at the table 🍎!",
  no_food:      "🍎 No food! Grow some in the greenhouse.",
  sleepy:       "🥱 It's getting late. Go to bed 🛏️ before you faint!",
  siren:        "🚨 SOLAR FLARE! Get inside the shield bubble!",
  shield_boost: "🛡️ Tip: BOOST the shield before a flare. It takes a while!",
  forecast:     "☀️ Earth sent a space-weather message. Check the computer!",
  tired:        "⚡ Too tired to work. Eat or go to bed.",
  bag_full:     "🎒 Your bag is full!",
  busy:         "⏳ That machine is still changing. Please wait.",
  no_power:     "🔋 No power to change that right now!",
  not_sleepy:   "😴 Not sleepy yet. Do some exploring first!",
  no_comms:     "📡 No power, no signal! Get the battery up to talk to Earth.",
  send_ready:   "📦 You have enough research! Send it to Earth 🖥️.",
  part_arrived: "📦 A rover part landed at the Rover Bay! Go build it.",
  rover_ready:  "🚙 The ROVER is ready! Press E at the Rover Bay to travel.",
  need_rover:   "🚙 The rover isn't built yet. Send research to Earth to get parts!",
  too_late:     "🌙 Too late to travel. Sleep first, drive tomorrow!",
  trip_power:   "🔋 The battery is too low for the rover. It needs at least 15%.",
  trip_flare:   "☀️ No driving during a solar flare!",
  sam:          "🧑‍🚀 There's Sam! Go say hi!",
  tut_life:     "💨 Walk to the air generator and press E. Switch it ON!",
  tut_ice:      "❄️ Now food! Grab ice crystals from the ice crater.",
  tut_solar:    "☀️ Last one: clean the dusty solar panels 🧹.",
  tut_done:     "🎉 You know the basics! Earth will call with new missions.",
  explore_first:"🧭 Find every place on the Moon first! Check the Missions list for what is left.",
  crater_locked:"🔒 Crystal Crater is locked. Visit Zorp in the Moon cave first!",
  auto_off:     "💤 It turned itself OFF to save power. Turn it ON when you need it.",
  flare_boost:  "🛡️ Flare coming! Press E at the shield and pick BOOST.",
  bedtime_clean:"🪥 Brush the panels before bed!",
  wake_clean:   "🪥 Morning routine: clean the solar panels!",
  zorp_power:   "👽 Zorp used a rescue to save the base from the blackout."
};

// -----------------------------------------------------------------------
// 8) FACTS WHILE YOU JUMP (outside the base only!) AND WHILE YOU SLEEP
// -----------------------------------------------------------------------
const GRAVITY_FACTS = [
  { text: "Moon gravity is only 1/6 of Earth's. You can jump very high!", source: "NASA" },
  { text: "A 60 kg person weighs like 10 kg on the Moon.", source: "NASA" },
  { text: "Footprints last a very long time here: no wind or rain.", source: "NASA" },
  { text: "Apollo astronauts hopped like bunnies because walking was harder than hopping.", source: "NASA" },
  { text: "Dust kicked up on the Moon flies in a neat arc, with no air to slow it.", source: "NASA" },
  { text: "In 1971 astronaut Alan Shepard hit golf balls that flew very far in low gravity.", source: "NASA" },
  { text: "The Moon has less gravity because it has only about 1/80 of Earth's mass.", source: "NASA" },
  { text: "Apollo moon suits weighed about 80 kg on Earth but felt light on the Moon.", source: "NASA" }
];

// Bolt on your FIRST jump: the real Apollo 15 hammer and feather clip (NASA)
const HAMMER_FEATHER = {
  title: "Jump! Gravity test",
  text: "Bolt: In 1971, astronaut David Scott dropped a hammer and a feather. With no air, they landed together!",
  art: "hammerfeather", source: "NASA Apollo 15",
  clip: { url: "https://nssdc.gsfc.nasa.gov/planetary/image/AS15_Ham_feath_drop.mp4", start: 57, end: 62, pos: "50% 92%" }
};

// Zorp tells you one short real fact each time you visit him after the first time
const ZORP_FACTS = [
  "Earth's Moon is about one quarter as wide as Earth.",
  "Apollo astronauts brought back about 382 kg of Moon rocks.",
  "Alan Shepard hit golf balls on the Moon in 1971.",
  "Apollo 15 drove the first Moon buggy in 1971.",
  "The far side of the Moon gets just as much sunlight as the near side.",
  "Apollo astronauts said Moon dust smelled like gunpowder.",
  "Eugene Cernan was the last person to walk on the Moon, in 1972.",
  "In 2009 NASA's LCROSS found water in a dark Moon crater.",
  "The Moon's sky is black, even in the daytime.",
  "The Moon drifts about 3.8 cm farther from Earth every year.",
  "Apollo seismometers heard real moonquakes.",
  "Artemis I sent an empty Orion capsule around the Moon in 2022."
];

const SLEEP_FACTS = [
  { art: "daynight", text: "One Moon day and night lasts about 29.5 Earth days.", source: "NASA" },
  { art: "temps", text: "The Moon goes from 127 °C in sunlight to -173 °C in the dark.", source: "NASA" },
  { art: "distance", text: "The Moon is 384,000 km away. Radio takes 1.3 seconds.", source: "NASA" },
  { art: "tidal", text: "One side of the Moon always faces Earth. From the far side you never see it!", source: "NASA" },
  { art: "apollo", text: "Twelve people have walked on the Moon, from 1969 to 1972.", source: "NASA Apollo" },
  { art: "moonquake", text: "Moonquakes are real! Apollo seismometers felt them.", source: "NASA Apollo" },
  { art: "drift", text: "The Moon drifts away from Earth 3.8 cm a year, as fast as fingernails grow.", source: "NASA" },
  { art: "iss", text: "Space station astronauts sleep in bags attached to the wall.", source: "NASA ISS" }
];

// -----------------------------------------------------------------------
// 9) CREDITS
// -----------------------------------------------------------------------
const CREDITS = [
  { name: "NASA DONKI (space weather database)", url: "https://ccmc.gsfc.nasa.gov/tools/DONKI/" },
  { name: "NASA Open APIs", url: "https://api.nasa.gov/" },
  { name: "NASA OSDR RadLab (radiation facts)", url: "https://visualization.osdr.nasa.gov/radlab/gui/data-api/" },
  { name: "Canadian Space Agency: food production toolkit", url: "https://www.asc-csa.gc.ca/eng/youth-educators/toolkits/food-production/" },
  { name: "NASA Artemis I mission timeline", url: "https://www.nasa.gov/reference/artemis-i-mission-timeline/" },
  { name: "NASA Apollo 11 plaque", url: "https://science.nasa.gov/resource/apollo-11-plaque/" }
];


// -----------------------------------------------------------------------
// 10) THE END-OF-MISSION CARDS AND QUIZ (shown only at the end)
// -----------------------------------------------------------------------
// "In the game" next to "In real life", so players see how the game matches real space work.
const LEARN_CARDS = [
  { icon: "☀️", title: "Power", game: "Dirty panels made less power.", real: "Real habitats use solar panels too, and dust is a known problem on the Moon and Mars.", source: "NASA Apollo / Artemis" },
  { icon: "💨", title: "Air", game: "The air generator used power to make oxygen.", real: "The space station makes oxygen from water. On Mars, NASA's MOXIE made oxygen from carbon dioxide.", source: "NASA ISS / Perseverance MOXIE" },
  { icon: "☢️", title: "Radiation", game: "Flares are rated C, M and X. Stronger flares leak more through weak shields.", real: "NASA watches the Sun with space-weather forecasts (DONKI) so crews can shelter in time.", source: "NASA DONKI" },
  { icon: "🌱", title: "Food and water", game: "Ice became water for plants.", real: "Water ice hides in dark craters near the Moon's poles. NASA wants to use it.", source: "NASA Artemis" },
  { icon: "📡", title: "Talking to Earth", game: "Messages and parts took time to arrive.", real: "Radio takes 1.3 seconds to the Moon and 5 to 20 minutes to Mars.", source: "NASA communications" }
];

const QUIZ_MOON = [
  { q: "What makes solar panels weaker on the Moon?", options: ["Moon dust", "Moonlight", "Gravity"], answer: 0, why: "Sticky Moon dust covers the panels." },
  { q: "Why does a Moon base need a radiation shield?", options: ["To keep air in", "The Moon has no air or magnetic field to block flare particles", "To stop dust"], answer: 1, why: "Earth's air and magnetic field protect us. The Moon has neither." },
  { q: "Where could astronauts find water on the Moon?", options: ["Ice in dark craters", "Moon rivers", "Clouds"], answer: 0, why: "Water ice hides in shadowed craters near the poles." }
];
const QUIZ_MARS = [
  { q: "What can a dust storm do to Mars solar panels?", options: ["Give extra power", "Block sunlight so they make less", "Nothing"], answer: 1, why: "Dust in the sky blocks the Sun. In 2018 a giant storm silenced the Opportunity rover." },
  { q: "Why does a Mars base need a radiation shield?", options: ["Mars air is too thin to block flare particles", "Mars is too hot", "To stop wind"], answer: 0, why: "Mars has a very thin atmosphere and no global magnetic field." },
  { q: "How long does a radio message take from Earth to Mars?", options: ["1.3 seconds", "5 to 20 minutes", "2 days"], answer: 1, why: "It depends on where the planets are." }
];

// -----------------------------------------------------------------------
// 11) MARS MODE: same base, a different world
// -----------------------------------------------------------------------
const MARS_STORY = [
  { pic: "🤖", text: "No human has ever been to Mars! So NASA sends ROBOTS first, like Curiosity and Perseverance." },
  { pic: "🚀🔴", text: "In our game you are a robot explorer. You and your robot friend " + CREW_NAME + " flew to Mars. The trip takes about 7 months!" },
  { pic: "🔴", text: "Your pod landed on one side. " + CREW_NAME + " landed far away. Dust storms and radio delays are the hard part." },
  { pic: "🚙", text: "Send science to Earth to get rover parts. Radio takes about 13 minutes, so be patient! 🔬➜🌍" }
];
const MARS_TUTORIAL = [
  { art: "noair", title: "1. Stay linked to the base", text: "You are a robot: you do not breathe! But you need a radio link and power from the base. Stay inside the base circle to stay connected, and turn the link station ON." },
  { art: "icefood", title: "2. Food needs ice", text: "Water ice hides under Mars soil. Mine ice crystals and bring them to the greenhouse." },
  { art: "solardirty", title: "3. Sun is weak and dusty", text: "Mars gets about half the Sun Earth does. Keep panels clean. Dust storms are coming!" }
];
const MARS_FACTS = [
  { art: "magfield", text: "Mars has no global magnetic field and a very thin air, so radiation reaches the ground.", source: "NASA Mars science" },
  { art: "radio", text: "Radio takes 5 to 20 minutes between Earth and Mars.", source: "NASA communications" },
  { art: "dust", photo: "PIA22519", text: "Mars dust storms can cover the whole planet and block sunlight.", source: "NASA Mars" },
  { art: "electrolysis", text: "NASA's MOXIE on Perseverance made oxygen from Mars air.", source: "NASA Perseverance" },
  { art: "iceshadow", text: "Mars has water ice at its poles and under the soil.", source: "NASA Mars" },
  { art: "plants", text: "Growing food will keep Mars crews healthy and save cargo.", source: "NASA / Canadian Space Agency" },
  { art: "dosimeter", text: "Curiosity measured space radiation during its trip to Mars.", source: "NASA Curiosity RAD" },
  { art: "flarescale", text: "Flares are rated C, M and X. X is the strongest.", source: "NASA / DONKI" }
];
const MARS_SLEEP_FACTS = [
  { art: "marsday", text: "A Mars day (a sol) is 24 hours and 37 minutes.", source: "NASA Mars" },
  { art: "marstemp", text: "Mars is cold: an average of about -60 °C.", source: "NASA Mars" },
  { art: "phobos", photo: "PIA21837", text: "Mars has two small moons, Phobos and Deimos.", source: "NASA Mars" },
  { art: "marssun", text: "Mars gets less than half the sunlight Earth does.", source: "NASA Mars" },
  { art: "olympus", photo: "PIA10020", text: "Olympus Mons on Mars is the tallest volcano in the Solar System.", source: "NASA Mars" },
  { art: "marsdust", photo: "PIA22487", text: "Mars looks red because its dust contains rusty iron. Dust storms can darken the whole sky.", source: "NASA Mars" },
  { art: "oldsite", photo: "PIA22210", text: "NASA's Curiosity robot has been exploring Gale Crater on Mars since 2012.", source: "NASA Curiosity" }
];
const MARS_GRAVITY_FACTS = [
  { text: "Mars gravity is about 38% of Earth's, so you float a little.", source: "NASA Mars" },
  { text: "A 60 kg person would weigh about 23 kg on Mars.", source: "NASA Mars" },
  { text: "On Mars you could jump about 2.6 times higher than on Earth!", source: "NASA Mars" },
  { text: "Mars gravity is stronger than the Moon's. The Moon only has 1/6 of Earth's.", source: "NASA Mars" },
  { text: "Weak gravity means dust floats down slowly after a jump.", source: "NASA Mars" },
  { text: "Mars has less gravity because it has only about 1/10 of Earth's mass.", source: "NASA Mars" },
  { text: "Future Mars explorers will need exercise: low gravity weakens muscles and bones.", source: "NASA Mars" },
  { text: "A rock thrown on Mars flies farther than on Earth.", source: "NASA Mars" },
  { text: "Mars is about half as wide as Earth, so its gravity pulls less.", source: "NASA Mars" },
  { text: "Rocket engines need less push to leave Mars than to leave Earth.", source: "NASA Mars" }
];
const MARS_ZORP_FACTS = [
  "A Mars day is 24 hours and 37 minutes long.",
  "Ingenuity was the first helicopter to fly on another planet, in 2021.",
  "Mars has two tiny moons: Phobos and Deimos.",
  "Olympus Mons is about 22 km tall. That is taller than Everest!",
  "Valles Marineris is a canyon about 4,000 km long.",
  "Mars looks red because its dust is full of rust.",
  "Viking 1 landed on Mars on July 20, 1976.",
  "Perseverance landed in Jezero Crater in February 2021."
];
// What changes in the places on Mars
const MARS_DISCOVERIES = {
  lander: { title: "Viking 1 Lander", icon: "🛰️", art: "lander",
    pages: [
      { art: "lander", title: "Viking 1 landed here", text: "Viking 1 landed in Mars's northern lowlands on July 20, 1976. It was NASA's first lander to work on Mars.", source: "NASA Viking" },
      { art: "lander", title: "First color photo", localPhoto: "assets/viking1-first-color.jpg", caption: "NASA · Viking 1, July 1976", text: "This was the first color photo ever sent from the surface of Mars. The sky looked pinkish-red.", source: "NASA Viking 1" },
      { art: "lander", title: "First photo from Mars", localPhoto: "assets/viking1-first-bw.jpg", caption: "NASA · Viking 1, July 20, 1976", text: "Minutes after landing, Viking 1 sent this black-and-white picture. You can see its own foot pad and rocks!", source: "NASA Viking 1" }
    ],
    text: "Viking 1 landed in the northern lowlands in 1976 and sent the first photos from Mars.", source: "NASA Viking" },
  cave: { title: "Mars Caves", icon: "🕳️", art: "mooncave", text: "Mars has pits that may lead to lava tube caves. Caves could shield crews from radiation!", source: "NASA Mars science" },
  zorp: { title: "Zorp's Gift", icon: "👽", art: "zorp", noPlus: false, text: "Zorp gives you a power crystal and shows the way to Crystal Crater. He will rescue you up to 3 times!", source: "Our game's imagination" },
  earth: { title: "Earth Lookout", icon: "🌍", art: "earthrise", text: "From Mars, Earth is just a tiny bright blue dot!", source: "NASA",
    pages: [
      { art: "earthrise", title: "Earth Lookout", text: "From Mars, Earth is just a tiny bright blue dot!", source: "NASA" },
      { earthView: true, title: "🔭 Look through the telescope", source: "NASA" }
    ] },
  tranquility: { title: "Jezero Landing Site", icon: "🚙", art: "jezero",
    pages: [
      { art: "jezero", title: "Perseverance lands", photo: "PIA26344", text: "February 18, 2021: Perseverance landed in Jezero Crater using a sky crane.", source: "NASA Perseverance" },
      { art: "ingenuity", title: "A helicopter flies!", photo: "PIA24542", zoom: { s: 3, x: 48, y: 37 }, text: "April 19, 2021: Ingenuity made the first powered flight on another planet.", source: "NASA Ingenuity" },
      { art: "wright", title: "A piece of history", text: "Ingenuity carried a tiny piece of the Wright brothers' first airplane wing.", source: "NASA Ingenuity" },
      { art: "moxie", title: "Making air", text: "MOXIE on Perseverance made oxygen from Mars carbon dioxide.", source: "NASA MOXIE" }
    ],
    text: "Where Perseverance landed and Ingenuity flew.", source: "NASA Mars 2020" },
  crystalcrater: {
    title: "Crystal Crater", icon: "💎", art: "crystals", rover: true,
    pages: [
      { art: "crystals", title: "Crystal Crater", text: "A crater full of sparkly crystals in yellow, white, green and red. (The glowing crystals are our game's imagination.)", source: "Our game's imagination" },
      { art: "crystals", title: "Real crystals on Mars!", localPhoto: "assets/sulfur-crystals.jpg", caption: "NASA/JPL-Caltech/MSSS · Curiosity, 2024", text: "In 2024 the Curiosity rover rolled over a rock and broke it open. Inside were yellow crystals of pure sulfur!", source: "NASA Curiosity" },
      { art: "crystals", title: "Crystals in a crack", localPhoto: "assets/sulfur-crack.jpg", caption: "NASA/JPL-Caltech/MSSS · Curiosity, 2024", text: "Yellow and green sulfur crystals shine out of a crack in the ground. Scientists study them to learn how Mars changed.", source: "NASA Curiosity" },
      { art: "crystals", title: "A pale, bumpy rock", localPhoto: "assets/sulfur-white-rock.jpg", caption: "NASA/JPL-Caltech/MSSS · Curiosity, 2024", text: "Curiosity also photographed pale, bumpy, hole-filled rocks. Every new rock is a clue about Mars long ago.", source: "NASA Curiosity" }
    ],
    text: "A crater full of sparkly crystals. Real sulfur crystals were found by Curiosity on Mars.", source: "NASA Curiosity + our game's imagination"
  },
  alpha: { title: "Landing Site Alpha", icon: "🛰️", art: "oldsite", text: "Old landing sites keep their metal parts for a very long time.", source: "NASA Mars missions", rover: true },
  southpole: { title: "Southern Highlands", icon: "⛰️", art: "southpole", text: "The south of Mars is high ground covered in craters. It also has an ice cap.", source: "NASA Mars", rover: true },
  northpole: { title: "Northern Lowlands", icon: "🏜️", art: "northpole", text: "The north of Mars is low, smooth plains. It is several kilometers lower than the south.", photo: "PIA10789", source: "NASA Mars", rover: true }
};
// Switch every list to Mars or back to the Moon (the arrays and objects are changed in place)
// ---- Mars robot wording: a robot does not breathe. It needs a radio LINK and power from the base ----
const MARS_HINTS = {
  start:        "Welcome, robot! First, switch on the LINK 📡 so you stay connected.",
  low_air:      "📡 Your signal is fading! Go back inside the base circle to reconnect.",
  stale_air:    "📡 The link inside is weak. Is the link station ON?",
  blackout:     "💡 Lights out! Zorp used 1 rescue. Restart the link station first!",
  sam:          "🤖 There's Sam the robot! Go say hi!",
  tut_life:     "📡 Walk to the link station and press E. Switch it ON!"
};
const MARS_COACH = {
  air_out: { icon: "📡", title: "Your signal is fading!", art: "radio", why: "Your robot gets data and power from the base. Too far from the base circle, the link drops.",
    fix: ["🏠 Go back inside the base circle", "🚙 Ride the rover home", "⏱️ Take shorter trips"] },
  air_in: { icon: "📡", title: "The link is going weak", art: "radio", why: "The link station is OFF.",
    fix: ["📡 Press E at the link station", "Choose ON and wait 10 seconds", "🔋 It needs battery power"] }
};
const _MOON_TEXT = { hints: Object.assign({}, HINTS), coach: { air_out: Object.assign({}, COACH.air_out), air_in: Object.assign({}, COACH.air_in) } };
const _MOON_BACKUP = { disc: JSON.parse(JSON.stringify(DISCOVERIES)), facts: FACTS.slice(), sleep: SLEEP_FACTS.slice(), grav: GRAVITY_FACTS.slice(), tut: TUTORIAL.slice(), story: STORY.slice(), zorp: ZORP_FACTS.slice(), quiz: null };
function swapList(target, items) { target.splice(0, target.length); items.forEach((i) => target.push(i)); }
function applyPlanet(id) {
  const mars = id === "mars";
  const src = mars ? Object.assign({}, _MOON_BACKUP.disc, MARS_DISCOVERIES) : _MOON_BACKUP.disc;
  Object.keys(src).forEach((k) => { DISCOVERIES[k] = JSON.parse(JSON.stringify(src[k])); });
  // Viking 1 landed in the northern lowlands, so on Mars the old lander sits in the north region
  if (typeof DISCOVERY_SPOTS !== "undefined") {
    const L = DISCOVERY_SPOTS.find((q) => q.id === "lander");
    if (L) { L.x = mars ? 2760 : 270; L.y = mars ? 345 : 1096; L.region = regionAt(L.x, L.y); }
    REGIONS.north.name = mars ? "Northern Lowlands" : "North Pole";
  }
  swapList(FACTS, mars ? MARS_FACTS : _MOON_BACKUP.facts);
  swapList(SLEEP_FACTS, mars ? MARS_SLEEP_FACTS : _MOON_BACKUP.sleep);
  swapList(GRAVITY_FACTS, mars ? MARS_GRAVITY_FACTS : _MOON_BACKUP.grav);
  swapList(TUTORIAL, mars ? MARS_TUTORIAL : _MOON_BACKUP.tut);
  swapList(STORY, mars ? MARS_STORY : _MOON_BACKUP.story);
  swapList(ZORP_FACTS, mars ? MARS_ZORP_FACTS : _MOON_BACKUP.zorp);
  Object.assign(HINTS, mars ? MARS_HINTS : _MOON_TEXT.hints);
  Object.assign(COACH, mars ? MARS_COACH : _MOON_TEXT.coach);
  // Sam is a robot on Mars (no human has ever been there)
  MISSION_ICONS.meet = mars ? "🤖" : "🧑‍🚀";
  DESTINATIONS.forEach((x) => { if (x.id === "far") x.icon = mars ? "🤖" : "🧑‍🚀"; });
  // the "air generator" becomes the robot's link station on Mars
  if (typeof CONFIG !== "undefined") { CONFIG.systems.life.name = mars ? "Link station" : "Air generator"; CONFIG.systems.life.icon = mars ? "📡" : "💨"; }
}
function quizFor(id) { return id === "mars" ? QUIZ_MARS : QUIZ_MOON; }

// Lets the test files (run with Node) read this file. Browsers ignore it.
if (typeof module !== "undefined") {
  module.exports = { NASA_API_KEY, ARCHIVED_FLARES, FACTS, STORY, CREW_NAME, DISCOVERIES, DESTINATIONS, MISSION_FILLERS, TUTORIAL, COACH,
    MISSION_ICONS, missionText, HINTS, GRAVITY_FACTS, MARS_GRAVITY_FACTS, MARS_DISCOVERIES, SLEEP_FACTS, CREDITS,
    HAMMER_FEATHER, ZORP_FACTS, LEARN_CARDS, QUIZ_MOON, QUIZ_MARS, applyPlanet, quizFor };
}
