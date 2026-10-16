const moment = require("moment-timezone");

module.exports = {
  config: {
    name: "daily",
    version: "1.3",
    author: "ariYa'n 🚩",
    countDown: 5,
    role: 0,
    description: {
      en: "Receive daily gift"
    },
    category: "game",
    guide: {
      en: "{pn}\n{pn} info: View daily gift information"
    },
    envConfig: {
      rewardFirstDay: {
        coin: 50000,
        exp: 20000
      }
    }
  },

  langs: {
    en: {
      monday: "Monday",
      tuesday: "Tuesday",
      wednesday: "Wednesday",
      thursday: "Thursday",
      friday: "Friday",
      saturday: "Saturday",
      sunday: "Sunday",
      alreadyReceived: "⏳ You have already claimed your daily reward!",
      received: "🎁 Daily Reward Claimed!\n\n💰 Balance: +$%1\n⭐ XP: +%2"
    }
  },

  onStart: async function ({
    args,
    message,
    event,
    envCommands,
    usersData,
    commandName,
    getLang
  }) {
    const reward = envCommands[commandName].rewardFirstDay;

    if (args[0] === "info") {
      return message.reply(
        `🎁 DAILY REWARDS\n\n` +
        `💰 Balance: $${reward.coin.toLocaleString()}\n` +
        `⭐ XP: ${reward.exp.toLocaleString()}\n\n` +
        `⏳ Claim once per day!`
      );
    }

    const dateTime = moment
      .tz("Asia/Dhaka")
      .format("DD/MM/YYYY");

    const { senderID } = event;
    const userData = await usersData.get(senderID);

    if (!userData) {
      return message.reply("❌ User data not found!");
    }

    userData.data = userData.data || {};

    if (userData.data.lastTimeGetReward === dateTime) {
      return message.reply(getLang("alreadyReceived"));
    }

    const getCoin = reward.coin;
    const getExp = reward.exp;

    userData.data.lastTimeGetReward = dateTime;

    await usersData.set(senderID, {
      ...userData,
      money: Number(userData.money || 0) + getCoin,
      exp: Number(userData.exp || 0) + getExp,
      data: userData.data
    });

    return message.reply(
      getLang(
        "received",
        getCoin.toLocaleString(),
        getExp.toLocaleString()
      )
    );
  }
};
