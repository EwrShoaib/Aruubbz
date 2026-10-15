module.exports = {
config: {
name: "truthdare",
version: "1.0.0",
author: "ariYa'n bb'z 🚩",
countDown: 3,
role: 0,
description: "AI-style Truth or Dare game",
category: "game",
guide: "{pn} | {pn} truth | {pn} dare"
},

onStart: async function ({ message, args, event }) {
const type = (args[0] || "").toLowerCase();

const truths = [
  "😳 তোমার সবচেয়ে বড় গোপন কথা কী?",
  "❤️ তুমি কি কাউকে গোপনে পছন্দ করো?",
  "😂 জীবনে সবচেয়ে লজ্জার ঘটনা কী?",
  "📱 তোমার Crush-এর নামের প্রথম অক্ষর কী?",
  "🤫 কখনো বন্ধুকে মিথ্যা বলেছ?",
  "💔 কখনো কারো জন্য কেঁদেছ?",
  "😈 এখানে থাকা কাউকে Date করতে হলে কাকে করতে?",
  "🤣 তোমার সবচেয়ে অদ্ভুত অভ্যাস কী?",
  "💌 শেষ কাকে মেসেজ করেছ?",
  "🙈 তোমার জীবনের সবচেয়ে বড় ভয় কী?",
  "😎 নিজের কোন বিষয়টি নিয়ে সবচেয়ে গর্বিত?",
  "🤭 কখনো কারো Message দেখেও Reply দাওনি?",
  "💖 তোমার Ideal partner কেমন?",
  "😅 কখনো ধরা পড়ে গিয়েও মিথ্যা বলেছ?",
  "🔥 তোমার জীবনের সবচেয়ে সাহসী কাজ কী?"
];

const dares = [
  "😂 পরের ২ মিনিট শুধু Emoji দিয়ে কথা বলো!",
  "🎤 তোমার পছন্দের গানের ২ লাইন গাও!",
  "😎 নিজের একটি Funny nickname দাও!",
  "🤣 একটি Funny joke বলো!",
  "💃 ১০ সেকেন্ডের জন্য Dance করো!",
  "🐱 পরের ৩টি Message-এর শেষে 😺 দাও!",
  "🤖 Bot-কে বলো: তুমি আমার Boss!",
  "😜 নিজের সম্পর্কে ৩টি মজার তথ্য বলো!",
  "🎭 একটি সিনেমার ডায়লগ বলো!",
  "😂 নিজের নাম দিয়ে একটি Meme caption বানাও!",
  "💌 বন্ধুকে একটি সুন্দর Compliment দাও!",
  "🗣️ ১ মিনিট নিজের পছন্দের বিষয় নিয়ে কথা বলো!",
  "🌟 নিজের ৩টি ভালো গুণ বলো!",
  "🥳 একটি Funny Status লিখো!",
  "🎶 একটি গানের নাম Emoji দিয়ে বোঝাও!"
];

if (!["truth", "dare"].includes(type)) {
  return message.reply(
    "🎮 ═══ TRUTH OR DARE ═══\n\n" +
    "😈 Ready for a challenge?\n\n" +
    "💬 Truth: truthdare truth\n" +
    "🔥 Dare: truthdare dare\n\n" +
    "✨ Choose your challenge!"
  );
}

const list = type === "truth" ? truths : dares;
const challenge = list[Math.floor(Math.random() * list.length)];

return message.reply(
  `🎮 ═══ ${type.toUpperCase()} OR DARE ═══\n\n` +
  `👤 Player: ${event.senderID}\n\n` +
  `${type === "truth" ? "💬 TRUTH QUESTION" : "🔥 DARE CHALLENGE"}\n\n` +
  `${challenge}\n\n` +
  `🔁 Play again:\n` +
  `• truthdare truth\n` +
  `• truthdare dare\n\n` +
  `😈 Challenge accepted?`
);

}
};
