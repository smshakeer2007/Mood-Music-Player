import { Router, type IRouter } from "express";
import { DetectMoodBody, GetMoodsResponse, DetectMoodResponse } from "@workspace/api-zod";

const router: IRouter = Router();

const MOODS = [
  { id: "happy", name: "Happy", emoji: "😊", color: "#FFD700", description: "Upbeat and joyful vibes" },
  { id: "sad", name: "Sad", emoji: "😔", color: "#6B8DD6", description: "Melancholic and emotional tunes" },
  { id: "relaxed", name: "Relaxed", emoji: "😌", color: "#56B4D3", description: "Calm and peaceful sounds" },
  { id: "angry", name: "Angry", emoji: "😤", color: "#FF4444", description: "Intense and powerful tracks" },
  { id: "motivated", name: "Motivated", emoji: "💪", color: "#FF6B35", description: "Drive and hustle anthems" },
  { id: "romantic", name: "Romantic", emoji: "❤️", color: "#FF69B4", description: "Love songs and tender melodies" },
  { id: "energetic", name: "Energetic", emoji: "⚡", color: "#00E676", description: "High energy and danceable beats" },
  { id: "lonely", name: "Lonely", emoji: "🌧️", color: "#7B68EE", description: "Reflective and introspective tracks" },
  { id: "party", name: "Party", emoji: "🎉", color: "#FF1493", description: "Bangers and crowd favorites" },
];

// Keyword mapping for mood detection
const MOOD_KEYWORDS: Record<string, string[]> = {
  happy: ["happy", "joy", "great", "wonderful", "amazing", "fantastic", "excited", "thrilled", "elated", "cheerful", "good", "smile", "laugh"],
  sad: ["sad", "down", "depressed", "cry", "upset", "lonely", "heartbroken", "tears", "miss", "loss", "grief", "sorrow", "unhappy"],
  relaxed: ["calm", "relaxed", "peaceful", "chill", "serene", "tranquil", "mellow", "easy", "gentle", "quiet", "rest"],
  angry: ["angry", "mad", "furious", "rage", "irritated", "frustrated", "annoyed", "hate", "pissed", "livid", "resentful"],
  motivated: ["motivated", "focused", "determined", "grind", "hustle", "goal", "achieve", "productive", "ambitious", "driven", "work"],
  romantic: ["love", "romantic", "crush", "date", "affection", "sweetheart", "tender", "intimate", "longing", "heart"],
  energetic: ["energy", "pumped", "active", "exercise", "workout", "dance", "electric", "hype", "wild", "adrenaline"],
  lonely: ["alone", "isolated", "empty", "hollow", "disconnected", "longing", "miss", "nobody", "solitude"],
  party: ["party", "celebrate", "fun", "dance", "night out", "club", "festival", "drinks", "friends", "banger", "vibe"],
};

router.get("/moods", (_req, res): Promise<void> => {
  res.json(GetMoodsResponse.parse(MOODS));
  return Promise.resolve();
});

router.post("/moods/detect", async (req, res): Promise<void> => {
  const parsed = DetectMoodBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const text = parsed.data.text.toLowerCase();
  const scores: Record<string, number> = {};

  for (const [mood, keywords] of Object.entries(MOOD_KEYWORDS)) {
    scores[mood] = 0;
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        scores[mood]++;
      }
    }
  }

  const topMood = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  const detected = topMood[1] > 0 ? topMood[0] : "relaxed";
  const totalMatches = Object.values(scores).reduce((a, b) => a + b, 0);
  const confidence = totalMatches > 0 ? Math.min(topMood[1] / totalMatches, 1) : 0.5;

  const moodInfo = MOODS.find((m) => m.id === detected);
  res.json(
    DetectMoodResponse.parse({
      mood: detected,
      confidence,
      message: `Based on your words, you seem to be feeling ${moodInfo?.name.toLowerCase() ?? detected}.`,
    }),
  );
});

export default router;
