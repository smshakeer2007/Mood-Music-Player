import { db, songsTable, usersTable, moodHistoryTable } from "@workspace/db";

const COVER_URLS: Record<string, string[]> = {
  happy: [
    "https://i.scdn.co/image/ab67616d0000b273f6b55ca93bd7d8d8b2a47b3a",
    "https://i.scdn.co/image/ab67616d0000b273f935b6a62b2f89f46b8be8fc",
    "https://i.scdn.co/image/ab67616d0000b273be82673b5f79d9658ec0a9fd",
  ],
  sad: [
    "https://i.scdn.co/image/ab67616d0000b273a048415db06a5b6fa7ec4e1a",
    "https://i.scdn.co/image/ab67616d0000b2738b52c6b9bc4e43d873869699",
    "https://i.scdn.co/image/ab67616d0000b273b46f74b2f1c34a3b6e98e4a0",
  ],
  relaxed: [
    "https://i.scdn.co/image/ab67616d0000b27357aad0c98cd47d77b2a42bcc",
    "https://i.scdn.co/image/ab67616d0000b273b1a7c806bda4e08df9b01b4c",
    "https://i.scdn.co/image/ab67616d0000b273d9f9c4f00b4d5571a19dbde7",
  ],
  angry: [
    "https://i.scdn.co/image/ab67616d0000b273e8b066f70c206551210d902b",
    "https://i.scdn.co/image/ab67616d0000b2734f08cbea39fcfe0f2b023d33",
    "https://i.scdn.co/image/ab67616d0000b273e9e6f4fafb9b77a1b21d6e5b",
  ],
  motivated: [
    "https://i.scdn.co/image/ab67616d0000b273d9f9c4f00b4d5571a19dbde7",
    "https://i.scdn.co/image/ab67616d0000b273b174c0b4c8e18a6b4c67e0fa",
    "https://i.scdn.co/image/ab67616d0000b27357aad0c98cd47d77b2a42bcc",
  ],
  romantic: [
    "https://i.scdn.co/image/ab67616d0000b273f935b6a62b2f89f46b8be8fc",
    "https://i.scdn.co/image/ab67616d0000b273b1a7c806bda4e08df9b01b4c",
    "https://i.scdn.co/image/ab67616d0000b273a048415db06a5b6fa7ec4e1a",
  ],
  energetic: [
    "https://i.scdn.co/image/ab67616d0000b273be82673b5f79d9658ec0a9fd",
    "https://i.scdn.co/image/ab67616d0000b273e8b066f70c206551210d902b",
    "https://i.scdn.co/image/ab67616d0000b2734f08cbea39fcfe0f2b023d33",
  ],
  lonely: [
    "https://i.scdn.co/image/ab67616d0000b2738b52c6b9bc4e43d873869699",
    "https://i.scdn.co/image/ab67616d0000b273b46f74b2f1c34a3b6e98e4a0",
    "https://i.scdn.co/image/ab67616d0000b273e9e6f4fafb9b77a1b21d6e5b",
  ],
  party: [
    "https://i.scdn.co/image/ab67616d0000b273f6b55ca93bd7d8d8b2a47b3a",
    "https://i.scdn.co/image/ab67616d0000b273be82673b5f79d9658ec0a9fd",
    "https://i.scdn.co/image/ab67616d0000b273b174c0b4c8e18a6b4c67e0fa",
  ],
};

function pick<T>(arr: T[], index: number): T {
  return arr[index % arr.length];
}

const SONGS = [
  // happy
  { title: "Happy", artist: "Pharrell Williams", mood: "happy", genre: "Pop", duration: 233, playCount: 9821 },
  { title: "Can't Stop the Feeling!", artist: "Justin Timberlake", mood: "happy", genre: "Pop", duration: 236, playCount: 8567 },
  { title: "Good as Hell", artist: "Lizzo", mood: "happy", genre: "R&B", duration: 159, playCount: 7234 },
  { title: "Uptown Funk", artist: "Mark Ronson ft. Bruno Mars", mood: "happy", genre: "Funk", duration: 270, playCount: 10234 },
  { title: "Walking on Sunshine", artist: "Katrina & The Waves", mood: "happy", genre: "Pop", duration: 239, playCount: 6523 },
  // sad
  { title: "Someone Like You", artist: "Adele", mood: "sad", genre: "Pop", duration: 285, playCount: 11203 },
  { title: "The Night We Met", artist: "Lord Huron", mood: "sad", genre: "Indie", duration: 213, playCount: 9045 },
  { title: "Fix You", artist: "Coldplay", mood: "sad", genre: "Alternative", duration: 295, playCount: 8901 },
  { title: "Skinny Love", artist: "Bon Iver", mood: "sad", genre: "Indie Folk", duration: 222, playCount: 6234 },
  { title: "All I Want", artist: "Kodaline", mood: "sad", genre: "Indie", duration: 289, playCount: 7821 },
  // relaxed
  { title: "Sunset Lover", artist: "Petit Biscuit", mood: "relaxed", genre: "Electronic", duration: 244, playCount: 5643 },
  { title: "Bloom", artist: "The Paper Kites", mood: "relaxed", genre: "Folk", duration: 188, playCount: 4892 },
  { title: "Coffee", artist: "beabadoobee", mood: "relaxed", genre: "Indie", duration: 175, playCount: 6012 },
  { title: "River", artist: "Leon Bridges", mood: "relaxed", genre: "Soul", duration: 249, playCount: 5301 },
  { title: "Golden Hour", artist: "JVKE", mood: "relaxed", genre: "Pop", duration: 210, playCount: 7832 },
  // angry
  { title: "Killing in the Name", artist: "Rage Against the Machine", mood: "angry", genre: "Rock", duration: 312, playCount: 8234 },
  { title: "Break Stuff", artist: "Limp Bizkit", mood: "angry", genre: "Nu-Metal", duration: 167, playCount: 7012 },
  { title: "Given Up", artist: "Linkin Park", mood: "angry", genre: "Rock", duration: 185, playCount: 9123 },
  { title: "Bulls on Parade", artist: "Rage Against the Machine", mood: "angry", genre: "Rock", duration: 243, playCount: 6789 },
  { title: "Sabotage", artist: "Beastie Boys", mood: "angry", genre: "Hip-Hop", duration: 168, playCount: 5432 },
  // motivated
  { title: "Lose Yourself", artist: "Eminem", mood: "motivated", genre: "Hip-Hop", duration: 326, playCount: 14521 },
  { title: "Eye of the Tiger", artist: "Survivor", mood: "motivated", genre: "Rock", duration: 245, playCount: 10234 },
  { title: "Stronger", artist: "Kanye West", mood: "motivated", genre: "Hip-Hop", duration: 311, playCount: 8901 },
  { title: "Run the World (Girls)", artist: "Beyoncé", mood: "motivated", genre: "Pop", duration: 236, playCount: 7654 },
  { title: "Hall of Fame", artist: "The Script ft. will.i.am", mood: "motivated", genre: "Pop", duration: 214, playCount: 9012 },
  // romantic
  { title: "Perfect", artist: "Ed Sheeran", mood: "romantic", genre: "Pop", duration: 263, playCount: 12453 },
  { title: "All of Me", artist: "John Legend", mood: "romantic", genre: "R&B", duration: 269, playCount: 11234 },
  { title: "A Thousand Years", artist: "Christina Perri", mood: "romantic", genre: "Pop", duration: 285, playCount: 10123 },
  { title: "Can't Help Falling in Love", artist: "Elvis Presley", mood: "romantic", genre: "Classic", duration: 183, playCount: 9876 },
  { title: "Make You Feel My Love", artist: "Adele", mood: "romantic", genre: "Pop", duration: 215, playCount: 8234 },
  // energetic
  { title: "Blinding Lights", artist: "The Weeknd", mood: "energetic", genre: "Synth-Pop", duration: 200, playCount: 15234 },
  { title: "Levitating", artist: "Dua Lipa", mood: "energetic", genre: "Pop", duration: 203, playCount: 12345 },
  { title: "Physical", artist: "Dua Lipa", mood: "energetic", genre: "Pop", duration: 194, playCount: 9012 },
  { title: "Titanium", artist: "David Guetta ft. Sia", mood: "energetic", genre: "Electronic", duration: 245, playCount: 11234 },
  { title: "Wake Me Up", artist: "Avicii", mood: "energetic", genre: "Electronic", duration: 247, playCount: 13456 },
  // lonely
  { title: "Hurt", artist: "Johnny Cash", mood: "lonely", genre: "Country", duration: 217, playCount: 9234 },
  { title: "Mad World", artist: "Gary Jules", mood: "lonely", genre: "Alternative", duration: 192, playCount: 8123 },
  { title: "The Sound of Silence", artist: "Simon & Garfunkel", mood: "lonely", genre: "Folk Rock", duration: 186, playCount: 7012 },
  { title: "Yesterday", artist: "The Beatles", mood: "lonely", genre: "Classic Rock", duration: 125, playCount: 10234 },
  { title: "Creep", artist: "Radiohead", mood: "lonely", genre: "Alternative", duration: 238, playCount: 8901 },
  // party
  { title: "Dynamite", artist: "BTS", mood: "party", genre: "K-Pop", duration: 199, playCount: 18234 },
  { title: "Shut Up and Dance", artist: "WALK THE MOON", mood: "party", genre: "Pop Rock", duration: 199, playCount: 10123 },
  { title: "Party Rock Anthem", artist: "LMFAO", mood: "party", genre: "Electronic", duration: 282, playCount: 12345 },
  { title: "Jump Around", artist: "House of Pain", mood: "party", genre: "Hip-Hop", duration: 211, playCount: 8901 },
  { title: "Mr. Brightside", artist: "The Killers", mood: "party", genre: "Indie Rock", duration: 222, playCount: 14567 },
];

async function seed() {
  console.log("Seeding songs...");

  const existing = await db.select({ id: songsTable.id }).from(songsTable);
  if (existing.length > 0) {
    console.log(`Found ${existing.length} songs already — skipping seed.`);
    return;
  }

  const songRows = SONGS.map((s, i) => ({
    ...s,
    coverUrl: pick(COVER_URLS[s.mood], i),
    audioPreviewUrl: null,
  }));

  await db.insert(songsTable).values(songRows);
  console.log(`Inserted ${songRows.length} songs.`);

  // Seed guest user mood history
  await db.insert(usersTable).values({ id: "guest-user", username: "Guest", isGuest: true }).onConflictDoNothing();

  const moods = ["happy", "sad", "relaxed", "energetic", "motivated", "party", "happy", "relaxed", "lonely"];
  for (let i = 0; i < moods.length; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (moods.length - 1 - i));
    await db.insert(moodHistoryTable).values({
      userId: "guest-user",
      mood: moods[i],
      note: null,
      recordedAt: date,
    });
  }
  console.log("Seeded mood history for guest user.");

  console.log("Done seeding.");
}

seed().catch(console.error).finally(() => process.exit());
