const delay = (ms) => new Promise(res => setTimeout(res, ms));

const activeMurgi = new Map();

module.exports = {
config: {
name: "chudi2",
version: "1.1.0",
role: 2,
author: "ariYa'n bb'z 🚩",
description: "Loop Banglish roast messages until stopped",
category: "fun",
usages: "@mention | off",
cooldowns: 5,
},

onStart: async function({ message, event, args }) {
const threadID = event.threadID;

if (args[0] && args[0].toLowerCase() === "off") {
  if (activeMurgi.has(threadID)) {
    activeMurgi.set(threadID, false);
    return message.reply("🛑 Roast mode বন্ধ করা হয়েছে।");
  }
  return message.reply("⚠️ Roast mode চালু নেই।");
}

const mention = Object.keys(event.mentions || {})[0];

if (!mention) {
  return message.reply("যাকে roast করবেন তাকে mention দিন! 😈");
}

if (activeMurgi.has(threadID) && activeMurgi.get(threadID)) {
  return message.reply("⚠️ এই গ্রুপে roast mode ইতিমধ্যে চালু আছে।");
}

const name = event.mentions[mention];
const arraytag = [{ id: mention, tag: name }];

const messages = [
  "ম্যাডাম, attitude একটু কমাও, personality এখনো loading-এ! 😂",
  "নিজেকে queen ভাবো, কিন্তু রাজত্বটা শুধু কল্পনায়! 👑",
  "তোমার drama দেখে সিরিয়ালের director-ও লজ্জা পাবে! 🎭",
  "Attitude full charge, কিন্তু logic low battery! 🔋",
  "তোমার কথা শুনে Google-ও বলে, এটা আমার জানা নেই! 🤣",
  "তোমার overacting দেখে cinema hall-ও refund চাইবে! 🎬",
  "Roast দিতে এসেছ, শেষে নিজেই roast হয়ে গেলে! 🔥",
  "তোমার ego এত বড়, লিফটেও জায়গা হবে না! 😂",
  "তোমার dialogue অনেক, কিন্তু sense-এর stock শেষ! 😆",
  "তুমি যেখানে comment করো, সেখানে শান্তি logout করে! 😈",
  "নিজেকে VIP ভাবো, কিন্তু common sense এখনো guest! 😎",
  "তোমার confidence দেখে ভুলও নিজেকে ঠিক মনে করে! 🤣",
  "Fashion নিয়ে এত ভাব, আয়নাটাও confused হয়ে যায়! 🤭",
  "তোমার logic-এর চেয়ে airplane mode বেশি useful! 😂",
  "নিজের character update দাও, পুরোনো version-এ অনেক bug! 😹",
  "তোমার drama দেখে Oscar-ও application cancel করবে! 🏆",
  "তোমার attitude international, কিন্তু যুক্তি এখনো offline! 😆",
  "তোমার roast-এর level দেখে চাও ঠান্ডা হয়ে যায়! ☕",
  "নিজেকে masterpiece ভাবো, কিন্তু tutorial এখনো incomplete! 😂",
  "Madam, আজকের attitude show এখানেই শেষ! Bye bye! 👋",
];

activeMurgi.set(threadID, true);
await message.reply("🔥 Roast mode চালু হয়েছে!");

try {
  while (activeMurgi.get(threadID)) {
    for (const msg of messages) {
      if (!activeMurgi.get(threadID)) break;

      await delay(2500);

      if (!activeMurgi.get(threadID)) break;

      await message.reply({
        body: `${name}\n${msg}`,
        mentions: arraytag
      });
    }
  }
} catch (err) {
  console.error(err);
  message.reply("⚠️ Roast mode-এ সমস্যা হয়েছে।");
} finally {
  activeMurgi.delete(threadID);
}

}
};
