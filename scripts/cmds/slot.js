const balances = global.slotBalances || (global.slotBalances = {});

module.exports = {
config: {
name: "slot",
version: "3.0.0",
author: "ariYa'n bb'z 🚩",
countDown: 3,
role: 0,
description: "Slot machine betting game",
category: "game",
guide: "{pn} [amount]\nExample: {pn} 1m"
},

onStart: async function ({ message, args, event }) {
const id = event.senderID;

const amounts = {
  "1m": 1e6,
  "2m": 2e6,
  "5m": 5e6,
  "10m": 1e7,
  "20m": 2e7,
  "50m": 5e7,
  "100m": 1e8,
  "200m": 2e8,
  "500m": 5e8,
  "1b": 1e9,
  "2b": 2e9,
  "5b": 5e9,
  "10b": 1e10,
  "20b": 2e10,
  "50b": 5e10,
  "100b": 1e11,
  "200b": 2e11,
  "500b": 5e11,
  "1t": 1e12,
  "2t": 2e12,
  "5t": 5e12,
  "10t": 1e13,
  "20t": 2e13,
  "50t": 5e13,
  "100t": 1e14
};

const input = (args[0] || "").toLowerCase();
const bet = amounts[input];

if (!bet) {
  return message.reply(
    "🎰 SLOT MACHINE\n\n" +
    "💰 Available bets:\n" +
    "1m, 2m, 5m, 10m, 20m, 50m, 100m,\n" +
    "200m, 500m, 1b, 2b, 5b, 10b, 20b,\n" +
    "50b, 100b, 200b, 500b, 1t, 2t, 5t,\n" +
    "10t, 20t, 50t, 100t\n\n" +
    "Example: slot 1m"
  );
}

balances[id] ??= 1e9;

if (balances[id] < bet) {
  return message.reply(
    `❌ Not enough balance!\n\n` +
    `💵 Your Balance: ${balances[id].toLocaleString("en-US")}\n` +
    `🎯 Your Bet: ${bet.toLocaleString("en-US")}`
  );
}

const symbols = ["🍒", "🍋", "🍉", "⭐", "💎", "7️⃣"];

const reels = Array.from(
  { length: 3 },
  () => symbols[Math.floor(Math.random() * symbols.length)]
);

let multiplier = 0;
let result;

if (reels[0] === reels[1] && reels[1] === reels[2]) {
  multiplier = reels[0] === "7️⃣" ? 10 : 5;
  result = reels[0] === "7️⃣"
    ? "💎 JACKPOT! 10x BET!"
    : "🎉 TRIPLE MATCH! 5x BET!";
} else if (
  reels[0] === reels[1] ||
  reels[1] === reels[2] ||
  reels[0] === reels[2]
) {
  multiplier = 2;
  result = "✨ TWO MATCH! 2x BET!";
} else {
  multiplier = 0;
  result = "😢 YOU LOST YOUR BET!";
}

const winnings = bet * multiplier;
balances[id] += winnings - bet;

return message.reply(
  `🎰 SLOT MACHINE\n\n` +
  `╔══════════════════╗\n` +
  `║ ${reels.join(" │ ")} ║\n` +
  `╚══════════════════╝\n\n` +
  `${result}\n\n` +
  `🎯 Bet: ${bet.toLocaleString("en-US")}\n` +
  `💰 Payout: ${winnings.toLocaleString("en-US")}\n` +
  `📊 Net: ${((multiplier - 1) * bet).toLocaleString("en-US")}\n` +
  `🏦 Balance: ${balances[id].toLocaleString("en-US")}\n\n` +
  `🔁 Play again: slot ${input}`
);

}
};
