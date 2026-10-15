const scores = global.diceScores || (global.diceScores = {});

module.exports = {
  config: {
    name: "dice",
    version: "2.0.0",
    author: "ariYa'n bb'z 🚩",
    countDown: 2,
    role: 0,
    description: "Dice battle game",
    category: "game",
    guide: "{pn}"
  },

  onStart: async function ({ message, event }) {
    const id = event.senderID;
    const player = Math.floor(Math.random() * 6) + 1;
    const bot = Math.floor(Math.random() * 6) + 1;

    scores[id] ??= 0;

    let result;
    let points;

    if (player > bot) {
      result = "🎉 YOU WIN!";
      points = 10;
    } else if (player < bot) {
      result = "😢 YOU LOSE!";
      points = -5;
    } else {
      result = "🤝 DRAW!";
      points = 2;
    }

    scores[id] += points;

    return message.reply(
      `🎲 DICE BATTLE\n\n` +
      `👤 Your Dice: 🎲 ${player}\n` +
      `🤖 Bot Dice: 🎲 ${bot}\n\n` +
      `${result}\n` +
      `⭐ Points: ${points > 0 ? "+" : ""}${points}\n` +
      `🏆 Total Score: ${scores[id]}\n\n` +
      `🔁 আবার খেলতে: dice`
    );
  }
};
