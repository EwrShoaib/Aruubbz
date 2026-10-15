module.exports = {
config: {
name: "hack",
version: "2.0.0",
author: "ariYa'n bb'z 🚩",
countDown: 5,
role: 0,
description: "Hacker prank with reply support",
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

await message.reply(
  `╭━━━『 ☠️ HACKER MODE 』━━━╮\n` +
  `┃ 🎯 Target: ${name}\n` +
  `┃ 🔌 Connecting to system...\n` +
  `╰━━━━━━━━━━━━━━━━━━━━━━╯`
);

const steps = [
  "🔍 Scanning target...\n[██░░░░░░░░] 20%",
  "🔓 Bypassing firewall...\n[████░░░░░░] 40%",
  "📡 Connecting to mainframe...\n[██████░░░░] 60%",
  "💻 Running simulation...\n[████████░░] 80%",
  "✅ Simulation complete!\n[██████████] 100%"
];

for (const step of steps) {
  await new Promise(resolve => setTimeout(resolve, 1200));
  await message.reply(step);
}

return message.reply(
  `😈 TARGET: ${name}\n\n` +
  `💀 SYSTEM ACCESS: SIMULATED\n` +
  `🛡️ REAL STATUS: SAFE\n\n` +
  `🤣 PRANK SUCCESSFUL!\n` +
  `কোনো account hack করা হয়নি!\n\n` +
  `👑 Powered by BOT`
);

}
};
