const scores = global.coinflipScores || (global.coinflipScores = {});

module.exports = {
  config: {
    name: "coinflip",
    version: "2.0.0",
    author: "ariYa'n bb'z 🚩",
    countDown: 2,
    role: 0,
    description: "Coin flip prediction game",
    category: "game",
    guide: "{pn} heads | tails"
  },

  onStart: async function ({ message, args, event }) {
    const id = event.senderID;
    const guess = (args[0] || "").toLowerCase();

    if (!["heads", "tails"].includes(guess)) {
      return message.reply(
        "🪙 COIN FLIP GAME\n\n" +
        "Usage: coinflip heads\n" +
        "Usage: coinflip tails\n\n" +
        "সঠিক অনুমান করলে +10 points!\n" +
        "ভুল হলে -5 points।"
      );
    }

    const result = Math.random() < 0.5 ? "heads" : "tails";
    scores[id] ??= 0;

    const win = guess === result;
    scores[id] += win ? 10 : -5;

    return message.reply(
      `🪙 COIN FLIP RESULT\n\n` +
      `🎯 Your guess: ${guess.toUpperCase()}\n` +
      `🪙 Result: ${result.toUpperCase()}\n\n` +
      `${win ? "🎉 YOU WIN! +10 points" : "😢 YOU LOSE! -5 points"}\n` +
      `🏆 Score: ${scores[id]}\n\n` +
      `🔁 আবার খেলতে: coinflip heads / tails`
    );
  }
};
