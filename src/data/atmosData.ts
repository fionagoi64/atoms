export interface Fact {
  sup: string
  title: string
  body: string
  source: string
  progress: number
  align?: 'left' | 'right'
  titleMaxWidth?: number
  bodyMaxWidth?: number
  bodyFontSize?: number
}

export const ATMOS_FACTS: Fact[] = [
  {
    sup: "Fact #01",
    title: "SKY BABIES",
    body: "Apart from a crash, the worst nightmare of every flight attendant is childbirth on board. Although extremely rare, nearly 60 babies were born in the sky!",
    source: "https://www.cntraveller.in/story/explained-happens-baby-born-airplane/",
    progress: 0.12,
    align: "left"
  },
  {
    sup: "Fact #02",
    title: "A LONG FLIGHT",
    body: "The longest commercial flight you can book is a flight from Singapore to New York that lasts 18 hours 50 minutes... better get comfortable!",
    source: "https://upgradedpoints.com/travel/airlines/longest-nonstop-flights-in-the-world/",
    progress: 0.18,
    align: "right"
  },
  {
    sup: "Fact #03",
    title: "47 SECONDS",
    body: "Not a fan of airtime? The shortest flight available takes place in Scotland. It connects Westray to Papa Westray and takes 47 seconds!",
    source: "https://www.amusingplanet.com/2013/08/worlds-shortest-commercial-flight-is.html",
    progress: 0.24,
    align: "left"
  },
  {
    sup: "Fact #04",
    title: "FORBIDDEN NUMBER",
    body: "Since the number 13 is considered an unlucky number in Western culture, most airlines don't have a row 13 on their planes!",
    source: "https://simpleflying.com/row-13-on-planes/",
    progress: 0.30,
    align: "right"
  },
  {
    sup: "Fact #05",
    title: "NOWHERE TO GO",
    titleMaxWidth: 3.0,
    body: "As a result of the pandemic, some companies started offering ‘flights to nowhere’. Although the destination was the same as the departure, it seemed to have been a commercial success!",
    source: "https://www.nytimes.com/2020/09/19/travel/airlines-pandemic-flights-to-nowhere.html",
    progress: 0.36,
    align: "left"
  },
  {
    sup: "Fact #06",
    title: "FLIGHT TO HEL",
    titleMaxWidth: 2.25,
    body: "In 2017, on a Friday the 13th, Flight 666 to HEL took off for the last time, before being renumbered.",
    source: "https://www.washingtonpost.com/news/acts-of-faith/wp/2017/10/13/flight-666-to-hel-took-off-one-last-time-this-friday-the-13th/",
    progress: 0.42,
    align: "right"
  },
  {
    sup: "Fact #07",
    title: "DRIED OUT",
    body: "The pressurised air in the flight cabin is kept below 20% humidity, which is about the average humidity of the Sahara desert!",
    source: "https://blueskypit.com/2019/05/24/drier-than-the-desert-tips-to-stay-hydrated-on-your-flight/",
    progress: 0.48,
    align: "left"
  },
  {
    sup: "Fact #08",
    title: "PILOTS' MEALS",
    body: "In most airlines, pilots and co-pilots are required to eat different meals in case of food poisoning!",
    source: "https://www.foodandwine.com/travel/surprising-reason-airplane-pilots-and-co-pilots-eat-different-meals",
    progress: 0.54,
    align: "right"
  },
  {
    sup: "Fact #09",
    title: "LUCKY FEW",
    body: "It is estimated that only around 5% of the world’s population gets boards on a plane each year.",
    source: "https://www.smithsonianmag.com/air-space-magazine/how-much-worlds-population-has-flown-airplane-180957719/",
    progress: 0.60,
    align: "left"
  },
  {
    sup: "Fact #10",
    title: "TASTE BUDS",
    body: "Your taste buds become 30% less sensitive while flying. But not every flavor is affected equally!",
    source: "https://www.businessinsider.com/airplane-food-tastes-different-explained-2020-1",
    progress: 0.66,
    align: "right"
  },
  {
    sup: "Fact #11",
    title: "MAYDAY MAYDAY",
    body: '"MAYDAY" was made official as an international distress call in 1948. It is derived from the French word "m’aidez", which means "help me"!',
    source: "https://www.merriam-webster.com/words-at-play/mayday-meaning-origin",
    progress: 0.72,
    align: "left"
  },
  {
    sup: "Fact #12",
    title: "OLD BONES",
    body: "The average age of commercial aircraft is 20 years. They are usually retired at around 30 years of age.",
    source: "https://www.thehindubusinessline.com/specials/flight-plan/what-commercial-airlines-can-do-to-extend-the-longevity-of-their-fleet/article34805181.ece",
    progress: 0.78,
    align: "right"
  },
  {
    sup: "Fact #13",
    title: "FAST AS LIGHTNING",
    body: "From 1976 to 2003, the Concorde flew at twice the speed of sound, connecting NYC to London in 2 hours and 52 minutes!",
    source: "https://simpleflying.com/concorde-new-york-to-london-time/",
    progress: 0.84,
    align: "left"
  },
  {
    sup: "Fact #14",
    title: "IN THE DARK",
    body: "At night, lights on board are dimmed for landing and takeoff so that in the event of an emergency, passengers' eyes will already be adjusted to darkness.",
    source: "https://www.cntraveler.com/story/the-real-reason-planes-dim-the-lights-during-takeoff-and-landing",
    progress: 0.90,
    align: "right"
  },
  {
    sup: "Fact #15",
    title: "RAISE YOUR SHADE",
    titleMaxWidth: 3.5,
    body: "On landing and take-off, attendants ask you to raise your shade so they can see outside and decide which side of the aircraft is the safest if an evacuation was needed!",
    source: "https://www.cntraveler.com/story/why-do-airlines-ask-you-to-raise-window-shades-during-takeoff",
    progress: 0.95,
    align: "left"
  }
]

export const SKY_GRADIENT_STOPS = [
  { progress: 0.0, top: [8, 37, 198], bot: [159, 181, 205], noise: [8, 37, 198] },
  { progress: 0.15, top: [8, 37, 198], bot: [196, 203, 244], noise: [0, 27, 181] },
  { progress: 0.3, top: [116, 136, 234], bot: [255, 192, 148], noise: [116, 136, 234] },
  { progress: 0.45, top: [255, 192, 148], bot: [222, 229, 253], noise: [136, 162, 247] },
  { progress: 0.6, top: [136, 162, 247], bot: [222, 229, 253], noise: [255, 192, 148] },
  { progress: 0.75, top: [253, 175, 120], bot: [255, 230, 213], noise: [253, 175, 120] },
  { progress: 0.88, top: [253, 175, 120], bot: [197, 211, 254], noise: [90, 108, 216] },
  { progress: 1.0, top: [90, 108, 216], bot: [197, 211, 254], noise: [90, 108, 216] }
]

export interface CloudConfig {
  type: 1 | 2
  progress: number
  pos: [number, number, number]
  scale?: [number, number, number]
  rot?: [number, number, number]
}

export const CLOUD_CONFIGS: CloudConfig[] = [
  { type: 1, progress: 0.034, pos: [5.5, -4.6, 0], scale: [3, 3, 3] },
  { type: 1, progress: 0.037, pos: [10.7, 1, 0], scale: [2, 2, 2] },
  { type: 1, progress: 0.1, pos: [-0.5, -4.5, 0], rot: [0, Math.PI, 0] },
  { type: 1, progress: 0.12, pos: [-4, -1, 0], scale: [1.3, 1.3, 1.3] },
  { type: 2, progress: 0.16, pos: [3.5, -1, 0], scale: [1, 1, 1] },
  { type: 1, progress: 0.18, pos: [-3, -1, 0] },
  { type: 2, progress: 0.22, pos: [-4.5, 1.5, 0], scale: [-1, 1, 1] },
  { type: 1, progress: 0.25, pos: [0, -4.5, 0], scale: [-1, 1, 1], rot: [0, Math.PI, 0] },
  { type: 2, progress: 0.28, pos: [-4, 1.5, 0], scale: [-1, 1, 1] },
  { type: 1, progress: 0.32, pos: [3.5, 0.5, 0], scale: [1, 1, -1] },
  { type: 2, progress: 0.37, pos: [-2.5, -3, 0] },
  { type: 1, progress: 0.4, pos: [2, 1.5, 0] },
  { type: 1, progress: 0.46, pos: [2.5, 1.5, 0], scale: [1, 1, -1] },
  { type: 1, progress: 0.5, pos: [-3, -1.5, 0], scale: [-1.2, 1.2, 1.2] },
  { type: 1, progress: 0.55, pos: [-2.5, 1.5, 0], scale: [-1, 1, 1] },
  { type: 2, progress: 0.6, pos: [3, -3, 0], rot: [0, Math.PI, 0] },
  { type: 1, progress: 0.62, pos: [-3, 2, 0] },
  { type: 1, progress: 0.65, pos: [3, -2, 0], rot: [0, Math.PI, 0] },
  { type: 1, progress: 0.69, pos: [4, -2.5, 0], scale: [0.3, 0.3, 0.3] },
  { type: 1, progress: 0.7, pos: [-3, 1, 0], scale: [0.35, 0.35, 0.35] },
  { type: 1, progress: 0.76, pos: [-4, -1, 0], scale: [-1.5, 1.5, 1.5] },
  { type: 1, progress: 0.85, pos: [-0.5, -4.5, 0], rot: [0, Math.PI, 0] },
  { type: 1, progress: 0.87, pos: [-3, -1, 0], rot: [-1, Math.PI, 0] },
  // Secondary atmospheric layer (cm array from original Atmos)
  { type: 1, progress: 0.053, pos: [-7, -6, 0], scale: [-3.5, 3.5, -3.5] },
  { type: 2, progress: 0.05, pos: [-15, 0, 0], scale: [-2.5, 2.5, 2.5] },
  { type: 2, progress: 0.08, pos: [8, 6, 0], scale: [-2, 2, -2] },
  { type: 1, progress: 0.09, pos: [8, -6, 0], scale: [2.5, 2.5, -2.5] },
  { type: 2, progress: 0.13, pos: [8, 6, 0], scale: [2.5, 2.5, -2.5] },
  { type: 1, progress: 0.185, pos: [-9, 6, 0], scale: [1.8, 1.8, 1.8] },
  { type: 2, progress: 0.2, pos: [8, 6, 0], scale: [2, 2, 2] },
  { type: 1, progress: 0.24, pos: [8, 0, 0], scale: [2, 2, 2] },
  { type: 1, progress: 0.32, pos: [-5, 0, 0], scale: [1.5, 1.5, 1.5] },
  { type: 1, progress: 0.32, pos: [-5, 0, 0], scale: [1.5, 1.5, 1.5] },
  { type: 1, progress: 0.35, pos: [-5, 2, 0], scale: [-0.5, 0.5, 0.5] },
  { type: 2, progress: 0.36, pos: [5, -1, 0], scale: [-0.5, 0.5, 0.5] },
  { type: 2, progress: 0.41, pos: [9, -9, 0], scale: [3, 3, 3] },
  { type: 2, progress: 0.42, pos: [-9, -9, 0], scale: [3, 3, 3] },
  { type: 2, progress: 0.43, pos: [-9, 7, 0], scale: [3, 3, 3] },
  { type: 2, progress: 0.57, pos: [9, 0, 0], scale: [2, 2, 2] },
  { type: 2, progress: 0.7, pos: [3.5, 2, 0], scale: [0.4, 0.4, 0.4] },
  { type: 1, progress: 0.72, pos: [2, 0, 0], scale: [0.4, 0.4, 0.4] }
]
