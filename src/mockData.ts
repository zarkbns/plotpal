import { Manuscript } from './types';

export const SAMPLE_MANUSCRIPTS: Manuscript[] = [
  {
    id: 'clockwork-conspiracy',
    title: 'The Clockwork Conspiracy',
    author: 'Elena Vance',
    genre: 'Mystery',
    chaptersCount: 4,
    currentChapter: 3,
    lastCheckedDate: 'Just now',
    coverBg: 'linear-gradient(135deg, #2D1A12 0%, #170E0A 100%)',
    coverAccent: '#FF6B35',
    textColor: '#F5E6D3',
    status: 'has_violations',
    violationsCount: 2,
    excerpt: 'Inspector Vance examined the broken brass astrolabe at the Grand Conservatory, noting the cipher seal was intact.',
    inUniverseTime: 450,
    timelineSpan: 'Cycle 100 – 600',
    description: 'An investigative plot tracking mechanical anomalies, stolen chronometer gears, and factional espionage across New Aethelgard.',
    ratingScore: '88% Plot Continuity',
    chapters: [
      {
        id: 1,
        title: 'Act I: The Shattered Vault',
        timelineMarker: 100,
        text: 'At the stroke of midnight, the Grand Archive vault was found breached. Professor Arthur Thorne secured the Golden Astrolabe inside his personal briefcase before retreating to the North Tower.',
        wordCount: 1420
      },
      {
        id: 2,
        title: 'Act II: The Iron District Clue',
        timelineMarker: 250,
        text: 'Elena Vance discovered copper gears hidden beneath the furnace. Faction records indicated the Guild had sealed the North Tower gate at Cycle 200, declaring it impassable.',
        wordCount: 1850
      },
      {
        id: 3,
        title: 'Act III: Confrontation at the Observatory',
        timelineMarker: 450,
        text: 'Arthur Thorne arrived empty-handed at the Observatory, claiming the Golden Astrolabe was destroyed during the North Tower collapse, yet Elena spotted the North Gate swinging open freely.',
        wordCount: 2100
      },
      {
        id: 4,
        title: 'Act IV: The Temporal Paradox',
        timelineMarker: 600,
        text: 'As the great gears ground together, the secret compartment in the pedestal revealed the master blueprint of the city clock.',
        wordCount: 1640
      }
    ],
    violations: [
      {
        id: 'viol-clockwork-1',
        type: 'item_ownership',
        severity: 'critical',
        entities_involved: ['Arthur Thorne', 'Golden Astrolabe'],
        timeline_conflict: {
          past_state: { owner: 'Arthur Thorne', location: 'Personal Briefcase' },
          past_timeline_marker: 100,
          current_state: { status: 'claimed destroyed / missing' },
          current_timeline_marker: 450
        },
        explanation: 'Arthur Thorne secured the Golden Astrolabe at Timeline 100, but arrives at Timeline 450 without any scene showing its loss, theft, or destruction.',
        suggestions: [
          'Add a scene in Act II where Thorne is ambushed or hides the astrolabe in the catacombs.',
          'Clarify Thorne’s deceptive dialogue or state if he is intentionally lying to Elena.'
        ]
      },
      {
        id: 'viol-clockwork-2',
        type: 'location_state',
        severity: 'medium',
        entities_involved: ['North Tower Gate'],
        timeline_conflict: {
          past_state: { status: 'sealed / impassable' },
          past_timeline_marker: 200,
          current_state: { status: 'open / accessible' },
          current_timeline_marker: 450
        },
        explanation: 'North Tower Gate was declared sealed at Timeline 200, but is found swinging open at Timeline 450 without explanation.',
        suggestions: [
          'Show signs of forced entry or mention who unlocked the North Tower gate.'
        ]
      }
    ],
    trackedEntities: [
      { name: 'Elena Vance', type: 'character', status: 'Investigating', lastSeenMarker: 450 },
      { name: 'Arthur Thorne', type: 'character', status: 'Deceptive', lastSeenMarker: 450 },
      { name: 'Golden Astrolabe', type: 'item', status: 'Unaccounted', lastSeenMarker: 100 },
      { name: 'North Tower Gate', type: 'location', status: 'Unsealed', lastSeenMarker: 450 },
      { name: 'Iron Guild', type: 'faction', status: 'Hostile', lastSeenMarker: 250 }
    ]
  },
  {
    id: 'echoes-of-the-void',
    title: 'Echoes of the Void',
    author: 'Marcus Reed',
    genre: 'Sci-Fi',
    chaptersCount: 3,
    currentChapter: 2,
    lastCheckedDate: '1 hour ago',
    coverBg: 'linear-gradient(135deg, #1C2321 0%, #0B100E 100%)',
    coverAccent: '#FF6B35',
    textColor: '#F5E6D3',
    status: 'clean',
    violationsCount: 0,
    excerpt: 'Commander Reed logged the quantum beacon pulse at Station Kepler-9, synchronizing sub-space coordinates.',
    inUniverseTime: 820,
    timelineSpan: 'Standard Day 700 – 900',
    description: 'A deep-space thriller about an isolated research relay encountering an unindexed broadcast signal from beyond the heliopause.',
    ratingScore: '100% Verified Clean',
    chapters: [
      {
        id: 1,
        title: 'Sector 7 Transmission',
        timelineMarker: 700,
        text: 'The long-range array picked up harmonic resonance at 14.2 GHz. Dr. Silva calibrated the decryption core using the station cipher key.',
        wordCount: 1650
      },
      {
        id: 2,
        title: 'The Ghost Signal',
        timelineMarker: 820,
        text: 'Commander Reed and Dr. Silva verified the containment field holding the quantum transceiver. The telemetry feeds remained stable across all sectors.',
        wordCount: 2200
      },
      {
        id: 3,
        title: 'Sub-space Breach',
        timelineMarker: 900,
        text: 'The relay core stabilized as the backup dampeners engaged, sealing the anomaly before threshold breach.',
        wordCount: 1950
      }
    ],
    violations: [],
    trackedEntities: [
      { name: 'Marcus Reed', type: 'character', status: 'Active Commander', lastSeenMarker: 820 },
      { name: 'Dr. Evelyn Silva', type: 'character', status: 'Chief Science Officer', lastSeenMarker: 820 },
      { name: 'Quantum Transceiver', type: 'item', status: 'Contained', lastSeenMarker: 820 },
      { name: 'Station Kepler-9', type: 'location', status: 'Operational', lastSeenMarker: 820 }
    ]
  },
  {
    id: 'shadows-of-the-citadel',
    title: 'Shadows of the Citadel',
    author: 'Kaelen Drake',
    genre: 'Fantasy',
    chaptersCount: 3,
    currentChapter: 1,
    lastCheckedDate: '3 hours ago',
    coverBg: 'linear-gradient(135deg, #301924 0%, #15090F 100%)',
    coverAccent: '#FF6B35',
    textColor: '#F5E6D3',
    status: 'clean',
    violationsCount: 0,
    excerpt: 'The warden extinguished the sapphire sconce as the council gates clicked shut under the eclipsed moon.',
    inUniverseTime: 310,
    timelineSpan: 'Era of Bells 200 – 450',
    description: 'A high-fantasy narrative exploring royal succession, enchanted relics, and the fractured pact between four magical houses.',
    ratingScore: '100% Verified Clean',
    chapters: [
      {
        id: 1,
        title: 'The Whispering Spire',
        timelineMarker: 200,
        text: 'Lady Vanya sealed the sapphire seal in the vault beneath the Spire. The High Warden swore the oath of silence before the four houses.',
        wordCount: 1780
      },
      {
        id: 2,
        title: 'Eclipse over Valen',
        timelineMarker: 310,
        text: 'The moon cast an indigo shadow over the courtyards. Guards maintained strict watch along the ramparts.',
        wordCount: 1540
      }
    ],
    violations: [],
    trackedEntities: [
      { name: 'Lady Vanya', type: 'character', status: 'High Noble', lastSeenMarker: 310 },
      { name: 'High Warden', type: 'character', status: 'On Duty', lastSeenMarker: 310 },
      { name: 'Sapphire Seal', type: 'item', status: 'Vault Secured', lastSeenMarker: 200 },
      { name: 'Whispering Spire', type: 'location', status: 'Protected', lastSeenMarker: 310 }
    ]
  }
];
