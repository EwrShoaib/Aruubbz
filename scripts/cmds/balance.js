const { config } = global.GoatBot;
const { createCanvas, loadImage } = require("canvas");
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

const nx_210 = "ariYa'n";

module.exports = {
    config: {
        name: "balance",
        aliases: ["bal", "money"],
        version: "4.3.0",
        author: "ariYa'n",
        countDown: 5,
        role: 0,
        description: "View your premium neon balance card",
        category: "economy",
        guide: { en: "{pn} | {pn} @tag | {pn} transfer @tag 100" }
    },

    onStart: async function ({ message, usersData, event, args }) {
        const senderID = event.senderID;

        // Balance format supports up to 1T
        const formatBalance = (num) => {
            const n = Number(num);

            if (!Number.isFinite(n) || n >= 1e15) {
                return "∞ Unlimited";
            }

            if (n >= 1e12) return (n / 1e12).toFixed(2) + "T";
            if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
            if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
            if (n >= 1e3) return (n / 1e3).toFixed(2) + "K";

            return n.toLocaleString();
        };

        const getTargetUID = () => {
            if (event.messageReply) {
                return event.messageReply.senderID;
            }

            if (
                event.mentions &&
                Object.keys(event.mentions).length > 0
            ) {
                return Object.keys(event.mentions)[0];
            }

            if (args[0] && /^\d+$/.test(args[0])) {
                return args[0];
            }

            return null;
        };

        const createUniqueCard = async (name, balance, uid) => {
            const canvas = createCanvas(800, 450);
            const ctx = canvas.getContext("2d");

            const gradient = ctx.createLinearGradient(0, 0, 800, 450);
            gradient.addColorStop(0, "#0f0c29");
            gradient.addColorStop(0.5, "#302b63");
            gradient.addColorStop(1, "#24243e");

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.roundRect(0, 0, 800, 450, 30);
            ctx.fill();

            ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
            ctx.lineWidth = 2;

            for (let i = 0; i < 10; i++) {
                ctx.beginPath();
                ctx.moveTo(0, 100 + i * 30);
                ctx.bezierCurveTo(
                    200, 50 + i * 20,
                    500, 400 + i * 20,
                    800, 300
                );
                ctx.stroke();
            }

            ctx.font = "bold 32px Arial";
            ctx.fillStyle = "#ffffff";
            ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
            ctx.shadowBlur = 4;
            ctx.fillText("GOAT BANK LTD.", 50, 60);
            ctx.shadowBlur = 0;

            try {
                const avatarURL =
                    `https://graph.facebook.com/${uid}/picture?width=512&height=512`;

                const response = await axios.get(avatarURL, {
                    responseType: "arraybuffer",
                    timeout: 10000
                });

                const avatarImg = await loadImage(
                    Buffer.from(response.data)
                );

                ctx.save();
                ctx.shadowColor = "#00d2ff";
                ctx.shadowBlur = 20;
                ctx.beginPath();
                ctx.arc(100, 150, 60, 0, Math.PI * 2);
                ctx.closePath();
                ctx.clip();
                ctx.drawImage(avatarImg, 40, 90, 120, 120);
                ctx.restore();

                ctx.beginPath();
                ctx.arc(100, 150, 60, 0, Math.PI * 2);
                ctx.strokeStyle = "#00d2ff";
                ctx.lineWidth = 3;
                ctx.stroke();
            } catch (e) {
                console.log("Avatar unavailable:", e.message);
            }

            ctx.shadowBlur = 0;
            ctx.fillStyle = "#ffffff";
            ctx.font = "italic bold 40px sans-serif";
            ctx.fillText("VISA", 650, 60);

            ctx.font = "20px Arial";
            ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
            ctx.fillText("AVAILABLE BALANCE", 60, 260);

            const displayBal = formatBalance(balance);

            ctx.shadowColor = "#00d2ff";
            ctx.shadowBlur = 15;
            ctx.fillStyle = "#00d2ff";

            ctx.font = displayBal.length > 10
                ? "bold 48px Arial"
                : displayBal.length > 7
                ? "bold 60px Arial"
                : "bold 80px Arial";

            ctx.fillText(`$${displayBal}`, 60, 330);

            ctx.shadowBlur = 0;
            ctx.font = "28px monospace";
            ctx.fillStyle = "rgba(255, 255, 255, 0.8)";

            const formattedUID = String(uid)
                .padEnd(16, "0")
                .match(/.{1,4}/g)
                .join("  ");

            ctx.fillText(formattedUID, 60, 385);

            ctx.font = "bold 25px Arial";
            ctx.fillStyle = "#ffffff";
            ctx.fillText(
                String(name).toUpperCase().slice(0, 25),
                60,
                420
            );

            ctx.font = "18px Arial";
            ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
            ctx.fillText("VALID THRU: 12/29", 580, 420);

            const cachePath = path.join(__dirname, "cache");
            await fs.ensureDir(cachePath);

            const cardPath = path.join(
                cachePath,
                `premium_card_${uid}_${Date.now()}.png`
            );

            await fs.writeFile(cardPath, canvas.toBuffer("image/png"));

            return cardPath;
        };

        // Transfer command
        if (args[0]?.toLowerCase() === "transfer") {
            const targetUID = getTargetUID();
            const amountInput = args[args.length - 1];

            const amount = Number(amountInput);

            if (
                !targetUID ||
                !Number.isSafeInteger(amount) ||
                amount <= 0 ||
                targetUID === senderID
            ) {
                return message.reply(
                    "❌ Usage: balance transfer @tag 100"
                );
            }

            const senderData = await usersData.get(senderID);
            const receiverData = await usersData.get(targetUID);

            if (!senderData || !receiverData) {
                return message.reply("❌ User not found!");
            }

            const senderMoney = Number(senderData.money || 0);
            const receiverMoney = Number(receiverData.money || 0);

            if (senderMoney < amount) {
                return message.reply("❌ Insufficient balance!");
            }

            // Preserve the rest of both users' data
            await usersData.set(senderID, {
                ...senderData,
                money: senderMoney - amount
            });

            await usersData.set(targetUID, {
                ...receiverData,
                money: receiverMoney + amount
            });

            return message.reply(
                `✅ Transfer Successful!\n\n` +
                `💸 Amount: $${formatBalance(amount)}\n` +
                `👤 Receiver: ${receiverData.name || "User"}\n` +
                `💰 Your Balance: $${formatBalance(senderMoney - amount)}\n` +
                `🏦 System Provider: ${nx_210}`
            );
        }

        // Balance card: reads the same money field used by slot.js
        const targetID = getTargetUID() || senderID;
        const userData = await usersData.get(targetID);

        if (!userData) {
            return message.reply("❌ User not found!");
        }

        const balance = Number(userData.money || 0);

        const cardImg = await createUniqueCard(
            userData.name || "Global User",
            balance,
            targetID
        );

        return message.reply(
            {
                body:
                    `💳 GOAT BANK Premium Card\n\n` +
                    `👤 Name: ${userData.name || "Global User"}\n` +
                    `💰 Balance: $${formatBalance(balance)}`,
                attachment: fs.createReadStream(cardImg)
            },
            () => {
                fs.unlink(cardImg).catch(() => {});
            }
        );
    }
};
