// code from goatstore
// api: https://store.agi.bd

module.exports = {
  config: {
    name: "top",
    aliases: ["tp"],
    version: "7.0.0",
    author: "ariYa'n",
    role: 0,
    shortDescription: {
      en: "Top 15 Rich Users"
    },
    longDescription: {
      en: "Displays the top 15 richest users by money"
    },
    category: "group",
    guide: {
      en: "{pn}"
    }
  },

  onStart: async function ({ message, usersData }) {
    try {
      function formatMoney(amount) {
        amount = Number(amount) || 0;

        if (amount >= 1e9) {
          return (amount / 1e9).toFixed(2) + " B";
        }

        if (amount >= 1e6) {
          return (amount / 1e6).toFixed(2) + " M";
        }

        if (amount >= 1e3) {
          return (amount / 1e3).toFixed(2) + " K";
        }

        return amount.toString();
      }

      const allUsers = await usersData.getAll();

      const topUsers = allUsers
        .sort((a, b) => (Number(b.money) || 0) - (Number(a.money) || 0))
        .slice(0, 15);

      if (!topUsers.length) {
        return message.reply("❌ No user data found!");
      }

      const topUsersList = topUsers.map((user, index) => {
        const name = user.name || "Unknown User";
        const money = formatMoney(user.money);

        return `${index + 1}. 🎀 ${name}: 💸 ${money} 💵`;
      });

      const messageText =
        "🎉 TOP 15 RICHEST USERS 🎉\n\n" +
        topUsersList.join("\n\n") +
        "\n\n🌟 KEEP EARNING TO CLIMB THE RANKS 🌟";

      return message.reply(messageText);
    } catch (error) {
      console.error("top command error:", error);
      return message.reply("❌ Failed to load top users. Please try again.");
    }
  }
};
