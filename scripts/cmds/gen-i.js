module.exports = {
config: {
name: "gen-i",
version: "1.0.0",
author: "ariYa'n bb'z 🚩",
countDown: 10,
role: 0,
description: "Generate AI videos from text prompts",
category: "AI",
guide: "{pn} [video description]"
},

onStart: async function ({ message, args, event }) {
const prompt = args.join(" ").trim();

if (!prompt) {
  return message.reply(
    "🎬 AI VIDEO GENERATOR\n\n" +
    "তুমি কী ধরনের ভিডিও চাও লিখে দাও!\n\n" +
    "Examples:\n" +
    "➤ gen-i a boy smoking cinematic video\n" +
    "➤ gen-i a boy doing bike stunts\n" +
    "➤ gen-i a dragon flying in the sky\n" +
    "➤ gen-i a boy walking in rain slow motion\n\n" +
    "✨ তোমার description অনুযায়ী AI video তৈরি করবে!"
  );
}

await message.reply(
  "🎬 AI VIDEO GENERATOR\n\n" +
  "📝 Prompt: " + prompt + "\n\n" +
  "⏳ Video generation request প্রস্তুত হচ্ছে...\n\n" +
  "⚠️ AI video API connect করা হয়নি। " +
  "ভিডিও তৈরি ও ফেরত পাঠানোর জন্য একটি video generation API যুক্ত করতে হবে।"
);

}
};
