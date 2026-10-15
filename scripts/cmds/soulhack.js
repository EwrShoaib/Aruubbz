module.exports = {
config: {
name: "soulhack",
version: "1.0.0",
author: "ariYa'n bb'z 🚩",
countDown: 5,
role: 0,
description: "Mystery soul scanner prank",
category: "fun",
guide: "{pn} (reply to a message)"
},

onStart: async function ({ message, event, usersData }) {
const targetID =
event.messageReply?.senderID || event.senderID;

let name = "Unknown Soul";

try {
  name = await usersData.getName(targetID);
} catch (e) {}

const loading = await message.reply(
  "╭━━━━━━━━━━━━━━━━━━╮\n" +
  "   👁️ SOUL SCANNER AI\n" +
  "╰━━━━━━━━━━━━━━━━━━╯\n\n" +
  "📡 Connecting to target...\n" +
  "🔐 Accessing soul database...\n\n" +
  "⏳ Please wait..."
);

const wait = ms =>
  new Promise(resolve => setTimeout(resolve, ms));

const scenes = [
  "🧬 Scanning digital aura...\n[██░░░░░░░░] 20%",
  "👁️ Detecting hidden personality...\n[████░░░░░░] 40%",
  "🧠 Analyzing mystery profile...\n[██████░░░░] 60%",
  "🌌 Opening secret dimension...\n[████████░░] 80%",
  "⚡ Soul analysis complete!\n[██████████] 100%"
];

for (const scene of scenes) {
  await wait(1200);
  await message.reply(scene);
}

const personalities = [
  "Silent Killer 😈",
  "Hidden Legend 👑",
  "Professional Overthinker 🥲",
  "Secret Romantic 💘",
  "Certified Pagol 🤡",
  "Mysterious Human 👽",
  "Future Millionaire 💸"
];

const aura = [
  "Dark Purple 🟣",
  "Phantom Blue 🔵",
  "Inferno Red 🔴",
  "Galaxy Gold 🟡",
  "Shadow Black ⚫"
];

const pick = list =>
  list[Math.floor(Math.random() * list.length)];

const report =
  "╭━━━「 🔮 SOUL REPORT 」━━━╮\n" +
  `👤 Target: ${name}\n` +
  `🧠 Personality: ${pick(personalities)}\n` +
  `✨ Aura: ${pick(aura)}\n` +
  `👑 Rarity: ${Math.floor(Math.random() * 100) + 1}%\n` +
  "╰━━━━━━━━━━━━━━━━━━━━╯\n\n" +
  "🚨 SECRET DETECTED!\n" +
  "এই মানুষটি বাইরে যতই innocent হোক...\n" +
  "ভেতরে ততটাই mysterious! 👀";

await message.reply(report);
await wait(1500);

return message.reply(
  "💀 SYSTEM MESSAGE\n\n" +
  `Hey ${name}...\n` +
  "তোমার Soul Scan শেষ!\n\n" +
  "😂 চিন্তা করো না, সবই random fun result!\n" +
  "কোনো real data scan করা হয়নি।\n\n" +
  "👁️ SOULHACK AI — DISCONNECTED"
);

}
};
