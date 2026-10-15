module.exports = {
config: {
name: "hack",
version: "3.0.0",
author: "ariYa'n bb'z 🚩",
countDown: 5,
role: 0,
description: "Hacker profile prank",
category: "fun",
guide: "{pn} (reply to a message)"
},

onStart: async function ({ message, event, api, usersData }) {
const targetID =
event.messageReply?.senderID || event.senderID;

let name = "Unknown User";
let avatar = "";

try {
  const info = await api.getUserInfo(targetID);
  const user = info[targetID];

  if (user) {
    name = user.name || name;
    avatar = user.thumbSrc || user.profileUrl || "";
  }
} catch (e) {}

if (name === "Unknown User") {
  try {
    name = await usersData.getName(targetID);
  } catch (e) {}
}

const result =
  "╔══════════════════════╗\n" +
  "      ☠️ HACK SUCCESSFUL\n" +
  "╚══════════════════════╝\n\n" +
  `👤 TARGET: ${name}\n` +
  `🆔 ID: ${targetID}\n\n` +
  "🔓 PROFILE SCAN: COMPLETE\n" +
  "💻 SYSTEM ACCESS: SIMULATED\n" +
  "⚡ STATUS: SUCCESSFUL\n\n" +
  "😈 TARGET IDENTIFIED!";

// Try to send the target's profile photo with the result.
if (avatar && typeof api.sendMessage === "function") {
  try {
    return api.sendMessage(
      {
        body: result,
        attachment: await global.utils.getStreamFromURL(avatar)
      },
      event.threadID,
      event.messageID
    );
  } catch (e) {}
}

return message.reply(
  result +
  "\n\n📸 Profile photo API unavailable."
);

}
};
