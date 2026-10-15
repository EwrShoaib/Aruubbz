module.exports = {
config: {
name: "futureme",
version: "1.0.0",
author: "ariYa'n bb'z 🚩",
countDown: 5,
role: 0,
description: "Funny AI future prediction",
category: "fun",
guide: "{pn} (reply to a message)"
},

onStart: async function ({ message, event, usersData }) {
const targetID =
event.messageReply?.senderID || event.senderID;

let name = "Unknown User";

try {
  name = await usersData.getName(targetID);
} catch (e) {}

const wait = ms =>
  new Promise(resolve => setTimeout(resolve, ms));

await message.reply(
  "╔════════════════════╗\n" +
  "   🔮 FUTURE.EXE 2035\n" +
  "╚════════════════════╝\n\n" +
  `🎯 Subject: ${name}\n` +
  "🌀 Entering time machine...\n" +
  "⏳ Scanning future timeline..."
);

const scenes = [
  "📡 Connecting to year 2035...",
  "🧬 Generating future timeline... 45%",
  "🚀 Traveling through time... 78%",
  "⚡ Future timeline successfully loaded!"
];

for (const scene of scenes) {
  await wait(1400);
  await message.reply(scene);
}

const jobs = [
  "CEO of a giant company 🏢",
  "World-famous gamer 🎮",
  "Millionaire entrepreneur 💸",
  "Legendary content creator 📸",
  "Professional sleeping expert 😴",
  "CEO of doing absolutely nothing 🤡"
];

const lifestyles = [
  "Private jet owner ✈️",
  "Luxury car collector 🚘",
  "Still asking friends for recharge money 📱",
  "Living like a king 👑",
  "Sleeping 14 hours every day 🛌"
];

const pick = list =>
  list[Math.floor(Math.random() * list.length)];

const wealth = Math.random() < 0.5
  ? "৳99,99,99,999 💰"
  : "Balance: ৳12.50 😂";

await message.reply(
  "╭━━━〔 🔮 FUTURE REPORT 〕━━━╮\n" +
  `👤 Name: ${name}\n` +
  "📅 Year: 2035\n" +
  `💼 Career: ${pick(jobs)}\n` +
  `🏠 Lifestyle: ${pick(lifestyles)}\n` +
  `💰 Bank Balance: ${wealth}\n` +
  "╰━━━━━━━━━━━━━━━━━━━━╯"
);

await wait(1500);

return message.reply(
  "🚨 TIMELINE ERROR!\n\n" +
  `😳 ${name}-এর Future Timeline পরিবর্তন হয়ে গেছে!\n` +
  "🤖 কারণ: অতিরিক্ত গ্রুপে আড্ডা!\n\n" +
  "😂 Relax! এটা একটা random fun prediction,\n" +
  "সত্যিকারের ভবিষ্যদ্বাণী নয়।\n\n" +
  "🔌 FUTURE.EXE DISCONNECTED"
);

}
};
