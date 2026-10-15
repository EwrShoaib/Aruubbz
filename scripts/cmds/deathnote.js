module.exports = {
config: {
name: "deathnote",
version: "1.0.0",
author: "ariYa'n bb'z 🚩",
countDown: 8,
role: 0,
description: "Anime mystery reply prank",
category: "fun",
guide: "{pn} (reply to someone's message)"
},

onStart: async function ({ message, event, usersData }) {
const targetID =
event.messageReply?.senderID || event.senderID;

let name = "Unknown";
try {
  name = await usersData.getName(targetID);
} catch (e) {}

const intro =
  `╔══════════════════╗\n` +
  `     📓 DEATH NOTE\n` +
  `╚══════════════════╝\n\n` +
  `👁️ Subject: ${name}\n` +
  `🔒 Secret file opened...\n\n` +
  `⚠️ CLASSIFIED INFORMATION`;

await message.reply(intro);

const scenes = [
  "🌑 The room suddenly goes dark...\n👣 Someone is behind you.",
  "🖋️ A mysterious name appears on the notebook...",
  "👁️ RYUK HAS ENTERED THE CHAT!\n🍎 Apple detected...",
  "🔮 Analyzing destiny...\n▓▓▓▓▓▓▓▓░░ 80%",
  "📡 Final report is ready..."
];

for (const scene of scenes) {
  await new Promise(resolve => setTimeout(resolve, 1300));
  await message.reply(scene);
}

return message.reply(
  `📓 ═══ FINAL REPORT ═══\n\n` +
  `🎯 Name: ${name}\n` +
  `🧠 Personality: Mysterious 😈\n` +
  `👑 Group Role: Main Character\n` +
  `🍎 Ryuk's Decision: APPLE FIRST!\n\n` +
  `😂 PLOT TWIST!\n` +
  `${name}-এর কিছুই হবে না!\n` +
  `এটা শুধু Anime prank 🤣\n\n` +
  `🖤 CASE CLOSED`
);

}
};
