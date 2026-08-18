import type { GenreOption } from '../types';
import type { DeezerTrack } from './deezer';

// Built-in demo library used when Deezer is unreachable (e.g. cloud previews
// with restricted network egress). Every BPM here is a real, documented tempo
// for the recording — never a heuristic guess.

interface DemoSong {
  name: string;
  artist: string;
  album: string;
  year: number;
  durationSec: number;
  bpm: number;
  genres: GenreOption[];
  popularity: number;
}

const LIBRARY: DemoSong[] = [
  // ── Pop ──
  { name: 'Billie Jean', artist: 'Michael Jackson', album: 'Thriller', year: 1982, durationSec: 294, bpm: 117, genres: ['Pop', 'Funk'], popularity: 100 },
  { name: 'Shape of You', artist: 'Ed Sheeran', album: '÷ (Divide)', year: 2017, durationSec: 233, bpm: 96, genres: ['Pop'], popularity: 98 },
  { name: 'Rolling in the Deep', artist: 'Adele', album: '21', year: 2010, durationSec: 228, bpm: 105, genres: ['Pop'], popularity: 96 },
  { name: 'Someone Like You', artist: 'Adele', album: '21', year: 2011, durationSec: 285, bpm: 68, genres: ['Pop'], popularity: 93 },
  { name: "Can't Stop the Feeling!", artist: 'Justin Timberlake', album: 'Trolls (Original Motion Picture Soundtrack)', year: 2016, durationSec: 236, bpm: 113, genres: ['Pop', 'Dance'], popularity: 92 },
  { name: 'Watermelon Sugar', artist: 'Harry Styles', album: 'Fine Line', year: 2019, durationSec: 174, bpm: 95, genres: ['Pop'], popularity: 94 },
  { name: 'Flowers', artist: 'Miley Cyrus', album: 'Endless Summer Vacation', year: 2023, durationSec: 200, bpm: 118, genres: ['Pop'], popularity: 95 },
  { name: 'Anti-Hero', artist: 'Taylor Swift', album: 'Midnights', year: 2022, durationSec: 200, bpm: 97, genres: ['Pop'], popularity: 97 },
  { name: 'Style', artist: 'Taylor Swift', album: '1989', year: 2014, durationSec: 231, bpm: 95, genres: ['Pop'], popularity: 91 },
  { name: 'bad guy', artist: 'Billie Eilish', album: 'When We All Fall Asleep, Where Do We Go?', year: 2019, durationSec: 194, bpm: 135, genres: ['Pop', 'Alternative'], popularity: 96 },
  { name: 'Save Your Tears', artist: 'The Weeknd', album: 'After Hours', year: 2020, durationSec: 215, bpm: 118, genres: ['Pop', 'R&B'], popularity: 95 },
  { name: 'Levitating', artist: 'Dua Lipa', album: 'Future Nostalgia', year: 2020, durationSec: 203, bpm: 103, genres: ['Pop', 'Dance'], popularity: 96 },
  { name: "Don't Start Now", artist: 'Dua Lipa', album: 'Future Nostalgia', year: 2019, durationSec: 183, bpm: 124, genres: ['Pop', 'Dance'], popularity: 94 },
  { name: 'Peaches', artist: 'Justin Bieber', album: 'Justice', year: 2021, durationSec: 198, bpm: 90, genres: ['Pop', 'R&B'], popularity: 90 },
  { name: 'Perfect', artist: 'Ed Sheeran', album: '÷ (Divide)', year: 2017, durationSec: 263, bpm: 63, genres: ['Pop'], popularity: 93 },
  { name: 'Thinking Out Loud', artist: 'Ed Sheeran', album: 'x (Multiply)', year: 2014, durationSec: 281, bpm: 79, genres: ['Pop', 'R&B'], popularity: 91 },

  // ── Hip-Hop ──
  { name: 'Lose Yourself', artist: 'Eminem', album: '8 Mile Soundtrack', year: 2002, durationSec: 326, bpm: 86, genres: ['Hip-Hop'], popularity: 97 },
  { name: 'In Da Club', artist: '50 Cent', album: "Get Rich or Die Tryin'", year: 2003, durationSec: 193, bpm: 90, genres: ['Hip-Hop'], popularity: 93 },
  { name: 'HUMBLE.', artist: 'Kendrick Lamar', album: 'DAMN.', year: 2017, durationSec: 177, bpm: 75, genres: ['Hip-Hop'], popularity: 95 },
  { name: "God's Plan", artist: 'Drake', album: 'Scorpion', year: 2018, durationSec: 198, bpm: 77, genres: ['Hip-Hop'], popularity: 94 },
  { name: 'Empire State of Mind', artist: 'JAY-Z, Alicia Keys', album: 'The Blueprint 3', year: 2009, durationSec: 276, bpm: 87, genres: ['Hip-Hop'], popularity: 92 },
  { name: 'Still D.R.E.', artist: 'Dr. Dre, Snoop Dogg', album: '2001', year: 1999, durationSec: 270, bpm: 93, genres: ['Hip-Hop'], popularity: 93 },
  { name: 'One Dance', artist: 'Drake, Wizkid, Kyla', album: 'Views', year: 2016, durationSec: 173, bpm: 104, genres: ['Hip-Hop', 'Dance'], popularity: 93 },

  // ── Rock ──
  { name: 'Back in Black', artist: 'AC/DC', album: 'Back in Black', year: 1980, durationSec: 255, bpm: 94, genres: ['Rock'], popularity: 95 },
  { name: 'Highway to Hell', artist: 'AC/DC', album: 'Highway to Hell', year: 1979, durationSec: 208, bpm: 116, genres: ['Rock'], popularity: 94 },
  { name: 'Smells Like Teen Spirit', artist: 'Nirvana', album: 'Nevermind', year: 1991, durationSec: 301, bpm: 117, genres: ['Rock', 'Alternative'], popularity: 96 },
  { name: 'Seven Nation Army', artist: 'The White Stripes', album: 'Elephant', year: 2003, durationSec: 231, bpm: 124, genres: ['Rock', 'Alternative'], popularity: 95 },
  { name: "Sweet Child O' Mine", artist: "Guns N' Roses", album: 'Appetite for Destruction', year: 1987, durationSec: 356, bpm: 125, genres: ['Rock'], popularity: 95 },
  { name: 'Wonderwall', artist: 'Oasis', album: "(What's the Story) Morning Glory?", year: 1995, durationSec: 258, bpm: 87, genres: ['Rock', 'Indie'], popularity: 93 },
  { name: 'Creep', artist: 'Radiohead', album: 'Pablo Honey', year: 1992, durationSec: 238, bpm: 92, genres: ['Rock', 'Alternative'], popularity: 92 },
  { name: 'Do I Wanna Know?', artist: 'Arctic Monkeys', album: 'AM', year: 2013, durationSec: 272, bpm: 85, genres: ['Rock', 'Indie'], popularity: 94 },

  // ── Metal ──
  { name: 'Enter Sandman', artist: 'Metallica', album: 'Metallica (The Black Album)', year: 1991, durationSec: 331, bpm: 123, genres: ['Metal', 'Rock'], popularity: 94 },
  { name: 'Crazy Train', artist: 'Ozzy Osbourne', album: 'Blizzard of Ozz', year: 1980, durationSec: 293, bpm: 138, genres: ['Metal', 'Rock'], popularity: 90 },
  { name: 'Nothing Else Matters', artist: 'Metallica', album: 'Metallica (The Black Album)', year: 1991, durationSec: 388, bpm: 69, genres: ['Metal', 'Rock'], popularity: 92 },

  // ── Dance ──
  { name: 'Get Lucky', artist: 'Daft Punk, Pharrell Williams', album: 'Random Access Memories', year: 2013, durationSec: 248, bpm: 116, genres: ['Dance', 'Funk'], popularity: 94 },
  { name: 'One More Time', artist: 'Daft Punk', album: 'Discovery', year: 2000, durationSec: 320, bpm: 123, genres: ['Dance'], popularity: 92 },
  { name: 'Titanium', artist: 'David Guetta, Sia', album: 'Nothing but the Beat', year: 2011, durationSec: 245, bpm: 126, genres: ['Dance', 'Pop'], popularity: 93 },
  { name: 'Wake Me Up', artist: 'Avicii', album: 'True', year: 2013, durationSec: 247, bpm: 124, genres: ['Dance'], popularity: 95 },
  { name: 'Animals', artist: 'Martin Garrix', album: 'Animals', year: 2013, durationSec: 190, bpm: 128, genres: ['Dance'], popularity: 89 },
  { name: 'Clarity', artist: 'Zedd, Foxes', album: 'Clarity', year: 2012, durationSec: 271, bpm: 128, genres: ['Dance'], popularity: 90 },
  { name: 'Shut Up and Dance', artist: 'Walk the Moon', album: 'Talking Is Hard', year: 2014, durationSec: 199, bpm: 128, genres: ['Dance', 'Pop', 'Rock'], popularity: 92 },

  // ── Funk ──
  { name: 'Superstition', artist: 'Stevie Wonder', album: 'Talking Book', year: 1972, durationSec: 245, bpm: 100, genres: ['Funk', 'R&B'], popularity: 94 },
  { name: 'Uptown Funk', artist: 'Mark Ronson, Bruno Mars', album: 'Uptown Special', year: 2014, durationSec: 270, bpm: 115, genres: ['Funk', 'Pop'], popularity: 97 },
  { name: 'September', artist: 'Earth, Wind & Fire', album: 'The Best of Earth, Wind & Fire, Vol. 1', year: 1978, durationSec: 215, bpm: 126, genres: ['Funk', 'R&B'], popularity: 95 },
  { name: 'Le Freak', artist: 'Chic', album: "C'est Chic", year: 1978, durationSec: 210, bpm: 120, genres: ['Funk', 'Dance'], popularity: 89 },
  { name: "Stayin' Alive", artist: 'Bee Gees', album: 'Saturday Night Fever', year: 1977, durationSec: 285, bpm: 104, genres: ['Funk', 'Pop', 'Dance'], popularity: 94 },
  { name: '24K Magic', artist: 'Bruno Mars', album: '24K Magic', year: 2016, durationSec: 226, bpm: 107, genres: ['Funk', 'R&B', 'Pop'], popularity: 93 },

  // ── R&B ──
  { name: 'Crazy in Love', artist: 'Beyoncé, JAY-Z', album: 'Dangerously in Love', year: 2003, durationSec: 236, bpm: 99, genres: ['R&B', 'Pop'], popularity: 94 },
  { name: 'Halo', artist: 'Beyoncé', album: 'I Am... Sasha Fierce', year: 2008, durationSec: 261, bpm: 80, genres: ['R&B', 'Pop'], popularity: 92 },
  { name: 'No Diggity', artist: 'Blackstreet, Dr. Dre', album: 'Another Level', year: 1996, durationSec: 274, bpm: 89, genres: ['R&B', 'Hip-Hop'], popularity: 91 },
  { name: 'All of Me', artist: 'John Legend', album: 'Love in the Future', year: 2013, durationSec: 269, bpm: 63, genres: ['R&B', 'Pop'], popularity: 93 },
  { name: 'Stay With Me', artist: 'Sam Smith', album: 'In the Lonely Hour', year: 2014, durationSec: 172, bpm: 84, genres: ['R&B', 'Pop', 'Gospel'], popularity: 91 },

  // ── Country ──
  { name: 'Jolene', artist: 'Dolly Parton', album: 'Jolene', year: 1973, durationSec: 162, bpm: 110, genres: ['Country'], popularity: 92 },
  { name: 'Take Me Home, Country Roads', artist: 'John Denver', album: 'Poems, Prayers & Promises', year: 1971, durationSec: 190, bpm: 82, genres: ['Country'], popularity: 93 },
  { name: 'Old Town Road', artist: 'Lil Nas X, Billy Ray Cyrus', album: '7 EP', year: 2019, durationSec: 157, bpm: 136, genres: ['Country', 'Hip-Hop'], popularity: 95 },
  { name: 'Need You Now', artist: 'Lady A', album: 'Need You Now', year: 2010, durationSec: 237, bpm: 108, genres: ['Country'], popularity: 89 },
  { name: 'Life Is a Highway', artist: 'Rascal Flatts', album: 'Cars (Original Soundtrack)', year: 2006, durationSec: 276, bpm: 103, genres: ['Country', 'Rock'], popularity: 90 },

  // ── Latin ──
  { name: 'Despacito', artist: 'Luis Fonsi, Daddy Yankee', album: 'Vida', year: 2017, durationSec: 229, bpm: 89, genres: ['Latin', 'Pop'], popularity: 96 },
  { name: 'Gasolina', artist: 'Daddy Yankee', album: 'Barrio Fino', year: 2004, durationSec: 192, bpm: 96, genres: ['Latin'], popularity: 91 },
  { name: 'Danza Kuduro', artist: 'Don Omar, Lucenzo', album: 'Meet the Orphans', year: 2010, durationSec: 198, bpm: 130, genres: ['Latin', 'Dance'], popularity: 92 },
  { name: 'Mi Gente', artist: 'J Balvin, Willy William', album: 'Vibras', year: 2017, durationSec: 189, bpm: 105, genres: ['Latin'], popularity: 91 },
  { name: "Hips Don't Lie", artist: 'Shakira, Wyclef Jean', album: 'Oral Fixation, Vol. 2', year: 2006, durationSec: 218, bpm: 100, genres: ['Latin', 'Pop'], popularity: 94 },

  // ── Reggae ──
  { name: 'Three Little Birds', artist: 'Bob Marley & The Wailers', album: 'Exodus', year: 1977, durationSec: 180, bpm: 74, genres: ['Reggae'], popularity: 93 },
  { name: 'No Woman, No Cry', artist: 'Bob Marley & The Wailers', album: 'Natty Dread', year: 1974, durationSec: 226, bpm: 79, genres: ['Reggae'], popularity: 92 },
  { name: 'Could You Be Loved', artist: 'Bob Marley & The Wailers', album: 'Uprising', year: 1980, durationSec: 237, bpm: 103, genres: ['Reggae'], popularity: 91 },
  { name: 'Is This Love', artist: 'Bob Marley & The Wailers', album: 'Kaya', year: 1978, durationSec: 232, bpm: 75, genres: ['Reggae'], popularity: 91 },
  { name: 'Red Red Wine', artist: 'UB40', album: 'Labour of Love', year: 1983, durationSec: 183, bpm: 88, genres: ['Reggae', 'Pop'], popularity: 88 },

  // ── K-Pop ──
  { name: 'Dynamite', artist: 'BTS', album: 'BE', year: 2020, durationSec: 199, bpm: 114, genres: ['K-Pop', 'Pop'], popularity: 95 },
  { name: 'Butter', artist: 'BTS', album: 'Butter', year: 2021, durationSec: 164, bpm: 110, genres: ['K-Pop', 'Pop'], popularity: 93 },
  { name: 'Gangnam Style', artist: 'PSY', album: 'PSY 6 (Six Rules), Part 1', year: 2012, durationSec: 219, bpm: 132, genres: ['K-Pop', 'Dance'], popularity: 93 },
  { name: 'How You Like That', artist: 'BLACKPINK', album: 'The Album', year: 2020, durationSec: 182, bpm: 130, genres: ['K-Pop'], popularity: 92 },

  // ── J-Pop ──
  { name: 'Plastic Love', artist: 'Mariya Takeuchi', album: 'Variety', year: 1984, durationSec: 292, bpm: 103, genres: ['J-Pop', 'Funk'], popularity: 87 },
  { name: 'Yoru ni Kakeru (Racing into the Night)', artist: 'YOASOBI', album: 'The Book', year: 2019, durationSec: 262, bpm: 130, genres: ['J-Pop'], popularity: 90 },
  { name: 'Gurenge', artist: 'LiSA', album: 'Gurenge', year: 2019, durationSec: 235, bpm: 135, genres: ['J-Pop', 'Rock'], popularity: 89 },
  { name: 'Pretender', artist: 'Official HIGE DANdism', album: 'Traveler', year: 2019, durationSec: 327, bpm: 92, genres: ['J-Pop'], popularity: 88 },

  // ── Indie / Alternative ──
  { name: 'Electric Feel', artist: 'MGMT', album: 'Oracular Spectacular', year: 2008, durationSec: 229, bpm: 103, genres: ['Indie', 'Alternative'], popularity: 90 },
  { name: 'Kids', artist: 'MGMT', album: 'Oracular Spectacular', year: 2008, durationSec: 302, bpm: 123, genres: ['Indie', 'Alternative'], popularity: 89 },
  { name: 'Pumped Up Kicks', artist: 'Foster the People', album: 'Torches', year: 2010, durationSec: 240, bpm: 128, genres: ['Indie', 'Alternative'], popularity: 92 },
  { name: 'Feel Good Inc.', artist: 'Gorillaz', album: 'Demon Days', year: 2005, durationSec: 222, bpm: 139, genres: ['Alternative', 'Hip-Hop'], popularity: 93 },
  { name: 'Somebody Told Me', artist: 'The Killers', album: 'Hot Fuss', year: 2004, durationSec: 197, bpm: 138, genres: ['Indie', 'Rock', 'Alternative'], popularity: 90 },
  { name: 'Take Me Out', artist: 'Franz Ferdinand', album: 'Franz Ferdinand', year: 2004, durationSec: 237, bpm: 105, genres: ['Indie', 'Rock'], popularity: 88 },

  // ── Punk ──
  { name: 'Should I Stay or Should I Go', artist: 'The Clash', album: 'Combat Rock', year: 1982, durationSec: 189, bpm: 113, genres: ['Punk', 'Rock'], popularity: 91 },
  { name: 'London Calling', artist: 'The Clash', album: 'London Calling', year: 1979, durationSec: 199, bpm: 133, genres: ['Punk', 'Rock'], popularity: 90 },
  { name: 'When I Come Around', artist: 'Green Day', album: 'Dookie', year: 1994, durationSec: 178, bpm: 98, genres: ['Punk', 'Rock'], popularity: 89 },
  { name: 'Buddy Holly', artist: 'Weezer', album: 'Weezer (Blue Album)', year: 1994, durationSec: 159, bpm: 120, genres: ['Punk', 'Rock', 'Alternative'], popularity: 88 },

  // ── Emo ──
  { name: 'Welcome to the Black Parade', artist: 'My Chemical Romance', album: 'The Black Parade', year: 2006, durationSec: 311, bpm: 97, genres: ['Emo', 'Rock'], popularity: 91 },
  { name: "Sugar, We're Goin Down", artist: 'Fall Out Boy', album: 'From Under the Cork Tree', year: 2005, durationSec: 229, bpm: 106, genres: ['Emo', 'Punk'], popularity: 90 },

  // ── Gospel ──
  { name: 'Oh Happy Day', artist: 'The Edwin Hawkins Singers', album: "Let Us Go into the House of the Lord", year: 1969, durationSec: 315, bpm: 105, genres: ['Gospel'], popularity: 85 },
];

const DECADE_START: Record<string, number> = {
  '70s': 1970, '80s': 1980, '90s': 1990,
  '2000s': 2000, '2010s': 2010, '2020s': 2020,
};

function toDeezerTrack(song: DemoSong): DeezerTrack {
  return {
    id: `demo-${LIBRARY.indexOf(song)}`,
    name: song.name,
    artist: song.artist,
    album: song.album,
    durationMs: song.durationSec * 1000,
    bpm: song.bpm,
    bpmIsReal: true,
    popularity: song.popularity,
    demo: true,
  };
}

export function fetchDemoTracks(genre: GenreOption, decade?: string): DeezerTrack[] {
  let matches: DemoSong[];

  if (genre === 'Hits') {
    matches = [...LIBRARY];
  } else if (genre === 'Decades' && decade && DECADE_START[decade] !== undefined) {
    const start = DECADE_START[decade];
    matches = LIBRARY.filter(s => s.year >= start && s.year < start + 10);
  } else {
    matches = LIBRARY.filter(s => s.genres.includes(genre));
  }

  // Thin genres get topped up with the most popular tracks from the rest of
  // the library so the builder always has a workable BPM spread.
  if (matches.length < 25) {
    const chosen = new Set(matches);
    const extras = LIBRARY
      .filter(s => !chosen.has(s))
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 25 - matches.length);
    matches = [...matches, ...extras];
  }

  return matches.map(toDeezerTrack);
}
