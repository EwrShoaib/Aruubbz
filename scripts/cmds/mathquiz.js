const games = global.mathQuizGames || (global.mathQuizGames = {});
const scores = global.mathQuizScores || (global.mathQuizScores = {});

module.exports = {
  config: {
    name: "mathquiz",
    version: "2.0.0",
    author: "ariYa'n bb'z 🚩",
    countDown: 2,
    role: 0,
    description: "Math quiz challenge",
    category: "game",
    guide: "{pn} | {pn} [answer] | {pn} new"
  },

  onStart: async function ({ message, args, event }) {
    const id = event.senderID;
    scores[id] ??= 0;

    if (args[0] === "new" || !games[id]) {
      const a = Math.floor(Math.random() * 20) + 1;
      const b = Math.floor(Math.random() * 20) + 1;
      const op = ["+", "-", "*"][Math.floor(Math.random() * 3)];

      let answer;
      if (op === "+") answer = a + b;
      else if (op === "-") answer = a - b;
      else answer = a * b;

      games[id] = {
        question: `${a} ${op} ${b}`,
        answer,
        attempts: 3
      };

      return message.reply(
        `🧠 MATH QUIZ\n\n` +
        `❓ ${games[id].question} = ?\n\n` +
        `❤️ Attempts: 3\n` +
        `✍️ উত্তর দাও: mathquiz [answer]`
      );
    }

    const game = games[id];
    const answer = Number(args[0]);

    if (args.length === 0 || !Number.isFinite(answer)) {
      return message.reply("✍️ একটি সংখ্যা দিয়ে উত্তর দাও: mathquiz 25");
    }

    if (answer === game.answer) {
      scores[id] += 10;
      delete games[id];

      return message.reply(
        `🎉 CORRECT!\n\n` +
        `🧮 ${game.question} = ${answer}\n` +
        `⭐ Earned: +10 points\n` +
        `🏆 Total Score: ${scores[id]}\n\n` +
        `🔁 Next question: mathquiz new`
      );
    }

    game.attempts--;

    if (game.attempts <= 0) {
      const correct = game.answer;
      const question = game.question;
      delete games[id];

      return message.reply(
        `😢 GAME OVER!\n\n` +
        `🧮 ${question} = ${correct}\n` +
        `🏆 Total Score: ${scores[id]}\n\n` +
        `🔁 Play again: mathquiz new`
      );
    }

    return message.reply(
      `❌ Wrong answer!\n` +
      `❤️ Attempts left: ${game.attempts}\n` +
      `🔁 আবার চেষ্টা করো: mathquiz [answer]`
    );
  }
};
