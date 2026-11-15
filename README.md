# Outpost Zero: Moon Base Adventure (v7)

A top-down 2D adventure for NASA Space Apps. Two astronauts flew to the Moon. You landed on the NEAR side; your friend Sam landed on the FAR side. Build a rover from your own research and drive to Sam, while keeping your base alive. Real solar flares from NASA's DONKI database hit your base.

## New in v9.1
- **Judge demo:** the rover is already built (press Q next to it to drive) and all fast-travel places are open (Crystal Crater, Landing Site Alpha, Far Side Camp). Tested on Moon and Mars. The poles are still reached on foot through the gaps in the wall.

## New in v9
- **Pointing hands much slower:** one slow sway every 10 seconds (small distance); the glow ring fades over 8 seconds.
- **Dr. Nova pop-ups are the same size as the discovery pop-ups from v7.2:** every pop-up box is 588 x 566 px at 1280 x 720 (29.4 x 28.3 units, so it scales with the window). Dr. Nova's picture is a little smaller and text shrinks slightly if needed. Checked: none of the Dr. Nova cards on Moon or Mars overflow.

## New in v8.9
- **Same width for every Dr. Nova / info pop-up** (fixed width, so shrinking text never changes the box width).
- **Pointing hands:** now 👉 on the left of the glowing bar, pointing right, swaying slowly (2.4 s) instead of bouncing; the glow ring pulses gently. If a bar is at the far left edge the hand flips to the right side and points left.
- **Earth Lookout:** the first visit shows two slides (Earth picture, then the telescope view), so you no longer have to press the telescope again. On Mars, Earth is drawn much smaller (a tiny dot), and the telescope view no longer shows the Moon's Earthrise photo.
- **Jezero slide 2:** the helicopter photo is zoomed in on Ingenuity (about 3x; position chosen by eye from the NASA picture, PIA24542).

## New in v8.8
- **Pop-ups are back to the v7.2 style:** each pop-up sizes itself around its content (no fixed box, no grow-to-fill), as in v7.2.
- **Live NASA flares:** tested the whole path with a pretend NASA reply (live flares load, the label says "Live NASA data", games use the real flares first) and with a "rate limit" reply (falls back to the archive and says so honestly). The "found" number now counts only real flares.
- **Your own NASA key:** open the game with `?nasakey=YOURKEY` at the end of the link, or paste it in `data.js`. IMPORTANT: when we tried the real NASA service with the shared `DEMO_KEY` on Nov 15, NASA answered "OVER_RATE_LIMIT". A free personal key (https://api.nasa.gov, takes a minute) fixes this. Without it, the game shows archived flares and says so.

## New in v8.7
- **Pause menu works with the keyboard:** arrows / W A S D move between buttons, E or Enter presses, Esc resumes (Resume is highlighted when it opens).
- **Frost on Mars:** in the Southern Highlands the screen turns cooler, with icy corners, a frosty edge and drifting snow sparkles.
- **Darker Moon south pole:** a much stronger dark vignette, so the vision is darker like the ground.
- **Rover and low battery:** when the battery is under 15%, every destination is locked and says "Battery too low! Needs 15% (now X%)".
- **No more title-menu size jump at launch:** the stage scale is now pure CSS, and the title stays hidden until fonts and text are ready.
- **One pop-up box for everything:** the box is sized around the biggest pop-up (about 34 x 32 units); shorter pop-ups grow their text and picture to fill it, so there is no dead space.
- **Tranquility flag:** the falling flag now has the blue star field and 13 stripes, like the American flag.
- Tests: 46 checks pass. Not browser-tested: the live NASA photos and the gravity video (the test machine is offline).

## New in v8.6
- **No more shaking hand / ring:** the 👆 ring now freezes the pulsing gauge it points at and only moves when the HUD really changes (before, it was placed once on a pulsing, resizing gauge). Gauge classes are only touched when the warning level actually changes.
- **Gentler critical warnings:** energy, air/link and battery pulse slower and smaller (1.04x instead of 1.12x, icon wiggle 4 degrees instead of 12). Screen shake during flares is halved.
- **All info / "let you know" pop-ups are one bigger size** (36 x 32 units, about 720 x 640 px on a 1280 x 720 window; text shrinks to fit if needed).
- **Mars telescope** is silver with black stripes, painted after the Mars colour grade so it no longer blends with the ground.
- **Crystal Crater:** yellow, white, green and red crystals in the world, the glow, the pickups and the picture. New pop-up pages with your three real Curiosity sulfur photos (NASA/JPL-Caltech/MSSS).
- **Gravity clip** now looks at the lower part of the video so the hammer and feather stay in view after the drop.
- **Viking 1** now sits in the Northern Lowlands on Mars (north region, no rover needed). Pop-up pages: first colour photo and first black-and-white photo from Mars (bundled in `assets/`).
- **Jump facts:** 10 Mars and 8 Moon facts. One fact every 10 to 15 jumps (random), at most 4 per day.
- **Pop-up photo flash fixed:** our drawing stays hidden while the real photo loads (5 s limit, then the drawing appears), and all photos are preloaded when a game starts.
- Tests: 46 checks pass (new: jump-fact pacing, Viking and crystal photo pages).

## New in v8.5
- Mars: the parts crate at the Rover Bay is now bright lime green with a dark outline and a soft glow, so it stands out on the red ground. (The Moon keeps the brown crate.)

## New in v8.4
- With more than 10 apples in the food store, Earth no longer asks (or points the arrow) to switch the greenhouse ON. The guide focuses on the daily missions instead.

## New in v8.4
- The "turn on the greenhouse" reminders (arrow and hints) only appear when you have 3 apples or fewer. With more food, the guide focuses on the daily missions instead.

## New in v8.3
- "The flag fell" picture now shows the Eagle's ascent stage lifting off from its gold descent stage, with a flame and blown dust.
- The driving message no longer ends with "(E) · Q = get out".
- North Pole picture: half the Sun peeks in at the top. South Pole picture and ground are darker.
- "Twelve people walked on the Moon" picture shows 12 mini astronauts, evenly spaced, facing you. The "photo: Apollo 11 bootprint" note and photo overlay are gone.

## New in v8.2
- The mission list in the bottom left now has a "Daily missions" heading.

## New in v8.2
- The mission list (bottom left) is labelled "Daily missions (your jobs for today)". A finished mission turns green with a green check on the right.

## New in v8.1
- Zorp's favorite treasure now shows the real Apollo 16 family photo (Charlie Duke, 1972). The picture is stored in the game (`assets/apollo16-family-photo.jpg`), so it shows even offline.

## New in v8
- The title screen no longer scrolls (it shrinks to fit any window).
- The opening film (Moon and Mars) has synthesized sound: radio chatter, a countdown, engine rumble and roar, stage separation thuds, the hum of space, solar panel motor, thruster hiss and a touchdown thump. The 🔊 button mutes it. (Checked by rendering the audio offline for levels and timing; I could not listen to it.)
- Flare forecast: shows the real date ("October 3, 2024"), or says "a typical flare" instead of an empty date. "Each letter is 10x stronger" now has x10 arrows between the letters and a highlighted note (X is 10,000x stronger than A).
- After you claim the "grab ice" mission, Earth asks you to switch the greenhouse ON, and the arrow points at it.
- The first time radiation builds up in a flare, Dr. Nova explains your radiation bar is like the badge astronauts wear. A glowing ring points at the bar.
- "Using more power than you make" (and the low battery card) now put a glowing ring on the battery and the power numbers.
- "Drop ice here" no longer stays as the guide after the water is in. While plants grow there is nothing to do; ripe apples say "Pick the apples"; when no required mission is left the guide suggests a "Bonus: collect rocks" for extra science.
- Fixed: the South Pole gap did not work (the code only found the top gap). North and South both work now.

## New in v7.2
- Radiation now builds up much faster during flares (radK 4.4 to 7). The careful-explorer robot still wins 58/60 (7 days) and 51/60 (5 days).
- The bag holds 4 ice or 4 samples. At 4 you cannot start picking up more (the prompt says "Bag full (4)").
- North and South Pole (and Northern Lowlands / Southern Highlands on Mars) are reached through a lit gap in the top/bottom mountain wall of the home map. There is no return pad: walk back out through the gap at the other end. The rover can drive through too.
- Fast travel (E) works only at the Rover Bay at home and at the return pads of Crystal Crater, Landing Site and Far Side Camp. The poles are no longer in the fast-travel menu.
- A "Q" tip (Drive the rover / Get out) appears next to the "E" tip.
- Mars: the first move shows the real radio delay (about 13 minutes, 5 to 20) and says we made it instant; the Earth link screen says the same. Your robot needs the base circle to stay linked (the old "air" bar is now the 📡 link bar and the air generator is the Link station). Sam is a robot, and the ending cards use robots. Dust storms now have a severity (mild/strong/huge): they ramp up and fade, dim the Sun (up to 65% less power), cover the panels in dust and tint the whole screen with blowing streaks.
- More real NASA photos on Mars pages (IDs checked in NASA's image library: PIA26344, PIA24542, PIA22519, PIA22487, PIA21837, PIA10020, PIA22210, PIA10789).

## New in v7
- **Driving:** stand by the rover and press Q to get in (you are drawn sitting inside), Q again to get out and park. While driving: faster, sealed from the outside air, half the flare radiation, and E opens fast travel. Riding HOME is always allowed, even during a flare.
- **Poles on foot or by rover:** walk to the top edge of the home map for the North Pole (Northern Lowlands on Mars) or the bottom edge for the South Pole (Southern Highlands). Walk back to the opposite edge to return.
- **Mars:** you play a robot (no human has ever been to Mars; the intro says so) and there is a Mars launch-and-landing film.
- Smaller round camp with the solar panels outside the dome (cleaning them costs air). Radiation rises faster in flares. You can carry 4 ice. Zorp shows the real Apollo 16 family photo (Moon only). Hammer-feather clip: 57 s to 62 s.
- Fixed: pop-ups no longer resize after opening, and the Earth-link screen no longer shows code.

## New in v6.2
- **Press Q anywhere to drive the rover** (opens the trip menu, or rides home when you are far away).
- **Round camp:** the shield tower is in the middle, the stations sit on a ring, and the shield dome is smaller and fits the camp.
- **Mars "Did you know?"** now has its own Mars pictures and facts; Moon-only pictures get a rusty tint on Mars, and Mars text no longer says "Moon" in the flare call, rover lock text, Earth lookout and results.

## New in v6
- **Main menu** (Moon or Mars, 5 / 7 / infinite days) and a **pause menu** (press Esc): resume, restart, sound, how to play, main menu. A small "Judge demo" button jumps straight to a solar flare.
- **Mars mode:** red ground, weaker sunlight, dust storms that cut solar power, 38% gravity, Mars facts, Jezero / Ingenuity discoveries, 5 to 20 minute radio delay. Simplified.
- **Solar flares:** at least 3 in every 5 days, random, each weak (C), medium (M) or strong (X). Weak = hardly any vignette and rain, strong = lots. No red vignette inside the shield. Shield ON leaks little for weak flares and a lot for strong ones; BOOST holds. Radiation above 30 slows you down. Flares marked "typical" are NOT a real date (see Honest notes).
- **Round shield with hexagons:** normal = light hexagons near the edge fading inward; BOOST = purple, hexagons across the whole circle. Camp stations are spaced further apart.
- **Real NASA media (needs internet):** the Apollo 15 hammer and feather clip plays after your first jump (Bolt explains), plus NASA photos on the Earth lookout and some discoveries. If they cannot load, the game's own drawings are shown instead.
- **After the first meeting, Zorp tells a real one-line fun fact.** Footprints from jump landings stay until you start a new game. Apples glow and show "APPLES READY!". Launcher caps at 2/2 and shows DONE. Rover menu marks places your missions need with a red star. Messages cannot be skipped in their first second. New-day text is bigger. Earth shows clear continents.
- **End of mission:** "Game vs real life" cards and a 3-question quiz (only after play), plus the space-weather summary.

## Honest notes
- v7.2: NASA photo IDs were looked up in NASA's library, but the pictures themselves load from the internet, so I could not see them in my offline test (the drawing is shown if a photo fails to load). The Mars "try moving" message is my reading of your note. (v6/v7)
- The Zorp family-photo NASA image (AS16-117-18841) is a real photo ID, but I could not confirm its web address works; if it fails the game's own drawing is shown.
- NASA media and live flare data were NOT tested live here (no internet in the build sandbox). The hammer-feather clip window (`HAMMER_FEATHER.clip` in `data.js`: start 22 s, end 40 s) is a guess; adjust it after watching the clip.
- "Typical" flares fill in missing weak/medium/strong tiers so every game has all three. They are labelled typical, not a real event.
- Balance was tuned only with simulated players (careful bot wins about 85% of 5-day games and 97% of 7-day). Touch controls and Mars balance are untested with real players.

## New in v5
- Three modes: 5 days, 7 days, or infinite. In 5 and 7 days you must discover EVERY place on the Moon before the rover can go to Sam. Infinite mode never ends when you meet Sam; press the flag button (top right) to finish.
- Press E while standing inside the yellow guide ring. The thing you face wins when two buildings are close; more space between Earth and the shield.
- Smaller arrows with slimmer labels, bigger "Did you know" pictures, pop-ups shrink to fit (no scrolling), bigger progress bar close to the astronaut, launcher counts 2 samples per part.

## New in v4
- Opening film: a simplified Artemis I style launch (boosters drop, trip to the Moon), skippable. Plays once.
- First-time tutorial (air, ice for food, clean solar panels), and help cards the first time any bar gets low.
- Missions: only 1-2 at a time, new ones appear when you finish. First mission = get ice.
- Press E beside ANY side of a building. Arrow keys + E work in all menus.
- Launcher (separate from the Rover Bay) sends research to Earth. Rover needs 2 parts.
- Tranquility Base (flag, Eagle descent stage), Moon Caves (walk in), Zorp's gift unlocks the Crystal Crater.
- Phone call before big flares, shield arrow and highlight, red DIRTY warning over 50%, "brush the panels" bed reminder.
- Lab and greenhouse switch themselves OFF when idle. Machines change in 10 s. Power-out costs a Zorp life.
- Picture explanations (Art library in `art.js`), crisper text, current-region minimap.

## Play (2 minutes)
1. Unzip the folder. Double-click `index.html`. No installs, no accounts.
2. Move: arrow keys or WASD. **E (or Enter)**: use, pick up, continue. **Space**: jump (only outside the base bubble). Touch screens get on-screen buttons.
3. Optional: get a free NASA key at https://api.nasa.gov/ and paste it into `data.js` (`NASA_API_KEY`).

## The story loop
1. Collect rocks, drop them on the brown ROCKS mat by the lab door. Turn the lab ON.
2. After 2 studied samples, press E at the Launcher 🚀 to send research (needs power: no power means no radio!).
3. Earth builds a rover part and lands it at the Rover Bay (about 45 s). Press E at the bay to build it. 2 parts = rover.
4. The rover fast-travels to Crystal Crater (crystals), Landing Site Alpha (metal), the poles (just for fun) and Far Side Camp (Sam). Trips cost battery and time.
5. Talk to Sam to win. Modes: 5 days, 7 days, or infinite.

## What kids discover by playing (no reading required)
| If this happens... | ...they learn |
|---|---|
| Battery hits 0 -> blackout, machines OFF, radio dead | Machines use power, solar panels make it, dust makes less |
| Air runs out outside -> you faint | Spacewalks have limits; air only refills inside the bubble |
| Flare while outside / shield low -> sick, then faint | Shielding and shelter matter; forecasts help |
| Machines take 10-15 s to change | Plan ahead: BOOST the shield BEFORE the flare |
| Stay up until 2 AM -> faint, Zorp the alien carries you to bed | Rest is part of the mission |
| Jumping outside | Moon gravity facts (1/6 of Earth's) |
All contact with Earth goes through the computer in the base.

## Files
| File | Job |
|---|---|
| `index.html` / `style.css` | Page layout and look of menus, meters, computer screen |
| `data.js` | Story, facts, missions, discoveries, destinations, hint words, backup flares, API key |
| `engine.js` | ALL the rules and numbers (power, air, radiation, research, rover, sleep, fainting) |
| `world.js` | The map: 6 regions (home + 5 rover destinations), buildings, nodes, collisions |
| `render.js` | Draws everything with simple shapes (no image files) |
| `art.js` | The little animated pictures in cards and tutorials |
| `cinematic.js` | The opening launch film |
| `ui.js` | Meters, minimap, computer screens, rover menu, Earth telescope, day-change screens |
| `main.js` | The game loop: keys, jumping, movement, interactions |
| `tests/engine.test.js` | Rule checks and robot players |

## Easy first experiments
In `engine.js` `CONFIG`: `days`, `minPerSec`, `speed`, `rover.samplesPerPackage` (2), `rover.deliverSec` (45), `rover.travelBattery`, `sampleScience`.
In `data.js`: add to `SLEEP_FACTS`, `GRAVITY_FACTS`, `DESTINATIONS`, `TUTORIAL`, or `COACH`.
In `world.js`: move a building, add crystal or metal nodes.

## Check the balance (needs Node.js)
`node tests/engine.test.js` runs rule checks and robot players. A careful robot reaches Sam; doing nothing (never cleaning panels) fails.

## Honesty notes
- Flares are real. Power, air and radiation numbers are simplified game rules, NOT NASA models.
- If live NASA data can't load, the game uses archived flares and labels them "ARCHIVED".
- TO DO: verify the archived flares in `data.js` on https://ccmc.gsfc.nasa.gov/tools/DONKI/
- Crystals, Zorp and Sam are our game's imagination. Facts shown with a source come from NASA material.
- The film is a simplified story: real Artemis missions use a separate lander. Armstrong/flag facts come from NASA Apollo 11 material.
- The 5-day mode is tight: a perfect robot player only just makes it. Test it with real players.
- Balance was tuned only by robot players, not real kids.
- Not yet tested: a real phone/tablet (touch controls), and the live NASA fetch from a normal internet connection.
