import type { EpubBook, EpubChapter } from '../types/epub';
import { computeReadingStats, countWords } from '../utils/epubParser';

function createChapter(id: string, title: string, blocks: EpubChapter['blocks']): EpubChapter {
  const firstPara = blocks.find((b) => b.type === 'paragraph')?.text ?? blocks[0]?.text ?? '';
  const wordCount = blocks.reduce((acc, b) => acc + countWords(b.text), 0);
  return {
    id,
    title,
    excerpt: firstPara,
    wordCount,
    blocks,
  };
}

function buildSeedBook(
  partial: Omit<
    EpubBook,
    | 'totalWords'
    | 'estimatedReadMinutes'
    | 'openingExcerpt'
    | 'source'
    | 'scrollPercent'
  >
): EpubBook {
  const stats = computeReadingStats(partial.chapters);
  return {
    ...partial,
    totalWords: stats.totalWords,
    estimatedReadMinutes: stats.estimatedReadMinutes,
    openingExcerpt: stats.openingExcerpt,
    scrollPercent: partial.currentChapterIndex > 0 ? 35 : 0,
    source: 'seed',
  };
}

const BASE_TIME = 1795500000000;

export const SEED_BOOKS: EpubBook[] = [
  buildSeedBook({
    id: 'seed-glass-archipelago',
    fileName: 'The_Glass_Archipelago.epub',
    title: 'The Glass Archipelago',
    author: 'Nadia K. Solis',
    language: 'en',
    subject: 'Speculative Fiction',
    description:
      'A cartographer charts seven translucent tidal islands where maritime glassmakers record shifting currents in blown lenses.',
    fileSizeBytes: 412800,
    coverUrl: '/src/assets/images/cover_glass_archipelago_1795546143442.jpg',
    isStarred: true,
    starredAt: BASE_TIME + 4000,
    addedAt: BASE_TIME + 6000,
    lastOpenedAt: BASE_TIME + 5000,
    currentChapterIndex: 1,
    kindleSentAt: null,
    kindleSentTo: null,
    chapters: [
      createChapter('ga-1', 'Chapter 1: Low Tide Soundings', [
        { type: 'heading', text: 'Chapter 1: Low Tide Soundings' },
        {
          type: 'paragraph',
          text: 'At six in the morning the shoals off Vesterholm turned clear enough to read the seabed like an old ledger. Mara leaned over the cedar gunwale with a brass lead line coiled across her knees, watching pale green slabs of sea-fused quartz catch the first cold glare from the east.',
        },
        {
          type: 'paragraph',
          text: 'The Harbour Board in Bergen had promised seven islands on the copperplate chart, yet every skipper who worked the outer skerries knew the count changed with the spring equinoctial tide. Two outcrops belonged strictly to winter; a third emerged only when a northwesterly pushed water out of the sound for forty hours straight.',
        },
        {
          type: 'quote',
          text: 'Never trust a coastline drawn in dry ink; salt always edits the margin.',
        },
        {
          type: 'paragraph',
          text: 'She dropped the weight twelve fathoms and marked the damp slate beside the compass box. Ahead of the bow, smoke rose in a straight gray ribbon from the kiln house on Orra, the only chimney left burning after the glassworks guild split in eighty-four.',
        },
      ]),
      createChapter('ga-2', 'Chapter 2: The Lens Ledger', [
        { type: 'heading', text: 'Chapter 2: The Lens Ledger' },
        {
          type: 'paragraph',
          text: 'Inside the drying loft, forty curved glass blanks rested on beds of sifted ash. Each pane carried a faint etched coordinate near its rim—not a date of manufacture, as Mara had assumed on the ferry north, but the exact bearing of the lighthouse channel it had been ground to bend.',
        },
        {
          type: 'paragraph',
          text: 'Old Halvor did not look up from the annealing grate when she set her brass tube on the workbench. Instead he slid a linen-bound register across the pine plank, its corners darkened by decades of peat smoke and wet wool sleeves.',
        },
        {
          type: 'paragraph',
          text: 'Line by line, the entries matched the anomalies in her tidal soundings. Whenever the shoal shifted three yards to leeward, the islanders ground a new prism rather than dredging the channel. They had been editing the light instead of the sea.',
        },
      ]),
      createChapter('ga-3', 'Chapter 3: Lantern Bearings', [
        { type: 'heading', text: 'Chapter 3: Lantern Bearings' },
        {
          type: 'paragraph',
          text: 'By dusk the wind swung into the northeast and swept the mist clear of the outer bar. From the gallery walk, Mara sighted through the freshly mounted fresnel sector and watched a narrow wedge of amber light fall squarely across the hidden basalt reef.',
        },
        {
          type: 'paragraph',
          text: 'Far down the sound, a coastal packet sounded two short blasts on its steam whistle and altered course four degrees to starboard, trusting a beam that existed nowhere in the Admiralty notices.',
        },
      ]),
    ],
  }),

  buildSeedBook({
    id: 'seed-quiet-algorithms',
    fileName: 'Field_Notes_on_Quiet_Algorithms.epub',
    title: 'Field Notes on Quiet Algorithms',
    author: 'Dr. Henrik Lindqvist',
    language: 'en',
    subject: 'Computing & Design',
    description:
      'Essays on software that respects attention, offline-first personal archives, and the craft of small tools that age well.',
    fileSizeBytes: 286400,
    coverUrl: '/src/assets/images/cover_quiet_algorithms_1795546143054.jpg',
    isStarred: true,
    starredAt: BASE_TIME + 3500,
    addedAt: BASE_TIME + 5500,
    lastOpenedAt: BASE_TIME + 2000,
    currentChapterIndex: 0,
    kindleSentAt: BASE_TIME + 3800,
    kindleSentTo: 'reader@kindle.com',
    chapters: [
      createChapter('qa-1', '1. Software Without Urgency', [
        { type: 'heading', text: '1. Software Without Urgency' },
        {
          type: 'paragraph',
          text: 'Most digital tools borrow the pacing of a trading floor even when the task belongs in a reading room. Red counters, animated badges, and endless feeds assume that every idle second is a defect to be repaired with another prompt.',
        },
        {
          type: 'paragraph',
          text: 'A quiet tool takes the opposite premise. It holds state faithfully while you are away, opens directly to the material you came to inspect, and lets you finish a thought in twenty seconds without negotiating three menus.',
        },
        {
          type: 'quote',
          text: 'Latency is not only measured in milliseconds; it is measured in how many decisions a tool forces before the work begins.',
        },
      ]),
      createChapter('qa-2', '2. Local Files as Durable Memory', [
        { type: 'heading', text: '2. Local Files as Durable Memory' },
        {
          type: 'paragraph',
          text: 'When a reader keeps an EPUB archive on a handheld device, ownership is concrete. The chapters do not vanish when a subscription lapses, and a train tunnel never interrupts the turn of a page.',
        },
        {
          type: 'paragraph',
          text: 'Designing around local storage changes how indexing works. Instead of waiting on distant servers, the interface can parse metadata in memory, surface opening paragraphs immediately, and reserve network handoffs strictly for deliberate transfers.',
        },
      ]),
      createChapter('qa-3', '3. The Two-Speed Reading Habit', [
        { type: 'heading', text: '3. The Two-Speed Reading Habit' },
        {
          type: 'paragraph',
          text: 'Serious readers rarely treat every document identically. First comes triage—skimming a table of contents, testing the cadence of an opening chapter, and starring the few works that earn deep focus. Only then does the material move to a dedicated e-ink screen for slow evening reading.',
        },
        {
          type: 'paragraph',
          text: 'Bridging those two speeds gracefully—fast phone skimming paired with clean export to an e-reader library—prevents digital bookshelves from turning into unexamined piles.',
        },
      ]),
    ],
  }),

  buildSeedBook({
    id: 'seed-alpine-botany',
    fileName: 'High_Altitude_Flora_Dolomites.epub',
    title: 'High-Altitude Flora of the Dolomites',
    author: 'Elena Marchetti',
    language: 'en',
    subject: 'Natural History',
    description:
      'A compact field handbook cataloguing cushion plants, limestone gentians, and wind-sculpted lichens above 2,200 meters.',
    fileSizeBytes: 634900,
    coverUrl: '/src/assets/images/cover_alpine_botany_1795546143583.jpg',
    isStarred: false,
    starredAt: null,
    addedAt: BASE_TIME + 5000,
    lastOpenedAt: null,
    currentChapterIndex: 0,
    kindleSentAt: null,
    kindleSentTo: null,
    chapters: [
      createChapter('ab-1', '1. Limestone Scree & Microclimates', [
        { type: 'heading', text: '1. Limestone Scree & Microclimates' },
        {
          type: 'paragraph',
          text: 'Above the larch line, pale dolomitic scree looks barren from fifty paces away. Kneel beside a sheltered boulder, however, and the temperature at soil level can sit twelve degrees warmer than the wind whistling over the ridge.',
        },
        {
          type: 'paragraph',
          text: 'Within those hand-sized pockets of trapped warmth, saxifrages and dwarf willows compress an entire growing season into nine frost-free weeks.',
        },
      ]),
      createChapter('ab-2', '2. Gentiana Nivalis & Blue Pigments', [
        { type: 'heading', text: '2. Gentiana Nivalis & Blue Pigments' },
        {
          type: 'paragraph',
          text: 'The snow gentian opens its narrow, intensely cobalt star only in direct sun. When mountain fog rolls over the pass, the petals fold tightly within ten minutes to protect pollen from sudden sleet.',
        },
        {
          type: 'paragraph',
          text: 'Its deep blue anthocyanins act simultaneously as an ultraviolet shield and a beacon for high-elevation bumblebees foraging in thin air.',
        },
      ]),
      createChapter('ab-3', '3. Pressing & Field Notes', [
        { type: 'heading', text: '3. Pressing & Field Notes' },
        {
          type: 'paragraph',
          text: 'Modern alpine botany replaces specimen collection with calibrated sketches and elevation logs. Record slope aspect, substrate moisture, and nearest companion species before the afternoon clouds descend.',
        },
      ]),
    ],
  }),

  buildSeedBook({
    id: 'seed-clockwork-harbor',
    fileName: 'The_Clockwork_Harbor.epub',
    title: 'The Clockwork Harbor',
    author: 'Thomas V. Greer',
    language: 'en',
    subject: 'Historical Mystery',
    description:
      'When a tide-predicting brass machine stops three minutes early in 1897 Bristol, an apprentice watchmaker uncovers a smuggler schedule.',
    fileSizeBytes: 518200,
    coverUrl: '/src/assets/images/cover_clockwork_harbor_1795546144085.jpg',
    isStarred: false,
    starredAt: null,
    addedAt: BASE_TIME + 4500,
    lastOpenedAt: null,
    currentChapterIndex: 0,
    kindleSentAt: null,
    kindleSentTo: null,
    chapters: [
      createChapter('ch-1', 'Chapter 1: Three Minutes Behind the Moon', [
        { type: 'heading', text: 'Chapter 1: Three Minutes Behind the Moon' },
        {
          type: 'paragraph',
          text: 'The harbourmaster’s tide-predictor stood six feet tall behind glazed mahogany doors, its twenty-four brass pulleys turning in silent mimicry of sun, moon, and estuary drag. For eleven winters it had never missed high water by more than forty seconds.',
        },
        {
          type: 'paragraph',
          text: 'On the Tuesday after Michaelmas, Arthur found the inked drum stopped dead at four-seventeen, with a sliver of beeswax jammed neatly inside the lunar declination gear.',
        },
      ]),
      createChapter('ch-2', 'Chapter 2: The Custom House Stairs', [
        { type: 'heading', text: 'Chapter 2: The Custom House Stairs' },
        {
          type: 'paragraph',
          text: 'A three-minute error meant nothing to a timber brig waiting off Avonmouth, yet to a steam launch slipping under the lock gates before the night watch changed lanterns, three minutes was an open door.',
        },
        {
          type: 'paragraph',
          text: 'Arthur copied the altered cam ratios onto the cuff of his drafting smock and set off down the cobbled slipway toward the lantern oil warehouse.',
        },
      ]),
      createChapter('ch-3', 'Chapter 3: The Missing Escapement', [
        { type: 'heading', text: 'Chapter 3: The Missing Escapement' },
        {
          type: 'paragraph',
          text: 'No thief breaks into a harbour observatory merely to slow a clock; someone wanted the printed tide-tables for November to carry a polite, official mistake.',
        },
      ]),
    ],
  }),

  buildSeedBook({
    id: 'seed-urban-acoustics',
    fileName: 'Cities_That_Listen.epub',
    title: 'Cities That Listen',
    author: 'Maya Chen-Okonkwo',
    language: 'en',
    subject: 'Architecture',
    description:
      'How courtyard proportions, timber baffles, and street paving transform noisy metropolitan corridors into humane acoustic landscapes.',
    fileSizeBytes: 349100,
    coverUrl: '/src/assets/images/cover_urban_acoustics_1795546144454.jpg',
    isStarred: false,
    starredAt: null,
    addedAt: BASE_TIME + 4000,
    lastOpenedAt: null,
    currentChapterIndex: 0,
    kindleSentAt: null,
    kindleSentTo: null,
    chapters: [
      createChapter('ua-1', '1. The Geometry of Quiet Courtyards', [
        { type: 'heading', text: '1. The Geometry of Quiet Courtyards' },
        {
          type: 'paragraph',
          text: 'Step twenty paces through a brick archway off a four-lane boulevard in Kyoto or Milan and traffic drops by eighteen decibels without a single mechanical sound barrier in sight. The quiet is structural, carved out by recessed alcoves and stepped eaves.',
        },
        {
          type: 'paragraph',
          text: 'Acoustic comfort begins long before interior finishing; it is decided the moment an architect draws the angle of a facade against the street.',
        },
      ]),
      createChapter('ua-2', '2. Timber Slats & Warm Reverberation', [
        { type: 'heading', text: '2. Timber Slats & Warm Reverberation' },
        {
          type: 'paragraph',
          text: 'Raw concrete reflects speech into a fatiguing metallic clatter, while overly damped rooms feel airless and eerie. Vertical cedar slats spaced at irregular intervals scatter mid-frequency reflections so conversation remains crisp at a natural whisper.',
        },
      ]),
      createChapter('ua-3', '3. Designing for Rain & Footsteps', [
        { type: 'heading', text: '3. Designing for Rain & Footsteps' },
        {
          type: 'paragraph',
          text: 'A livable city is never silent. The goal is to trade the drone of combustion engines for legible human-scale sounds: footsteps on granite, water moving through a stone channel, and wind brushing street trees.',
        },
      ]),
    ],
  }),

  buildSeedBook({
    id: 'seed-northern-letters',
    fileName: 'Letters_from_the_Winter_Coast.epub',
    title: 'Letters from the Winter Coast',
    author: 'Soren Lindholm',
    language: 'en',
    subject: 'Essays & Letters',
    description:
      'Twelve monthly dispatches written from a basalt headland on the North Atlantic, observing weather, reading habits, and slow winters.',
    fileSizeBytes: 198400,
    coverUrl: '/src/assets/images/cover_northern_letters_1795546144213.jpg',
    isStarred: false,
    starredAt: null,
    addedAt: BASE_TIME + 3500,
    lastOpenedAt: null,
    currentChapterIndex: 0,
    kindleSentAt: null,
    kindleSentTo: null,
    chapters: [
      createChapter('nl-1', 'November: Basalt & Early Dusk', [
        { type: 'heading', text: 'November: Basalt & Early Dusk' },
        {
          type: 'paragraph',
          text: 'Dear Clara, the sun slid behind the southern ridge at three-twenty today, leaving the pebble beach the exact color of wet graphite. When the ferry stops calling twice a week, the shelves inside the house grow much larger.',
        },
        {
          type: 'paragraph',
          text: 'I spent the evening clearing two years of unread essays from my pocket reader, keeping only the six books that still sounded alive after the first two pages.',
        },
      ]),
      createChapter('nl-2', 'December: Lamp Oil & Long Chapters', [
        { type: 'heading', text: 'December: Lamp Oil & Long Chapters' },
        {
          type: 'paragraph',
          text: 'A storm pinned us indoors from Thursday until Sunday morning. Without errands to fragment the afternoon, a chapter that normally takes three commutes unfolded in one unbroken sitting.',
        },
      ]),
      createChapter('nl-3', 'January: The Return of Pale Light', [
        { type: 'heading', text: 'January: The Return of Pale Light' },
        {
          type: 'paragraph',
          text: 'This morning a silver ribbon lingered above the headland for forty minutes past noon. Spring is still ten weeks away, yet the sea has already changed its tone from iron to slate.',
        },
      ]),
    ],
  }),
];
