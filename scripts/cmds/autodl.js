const fs = require("fs");
const path = require("path");
const { downloadVideo } = require("sagor-video-downloader");

const CACHE_DIR = path.join(__dirname, "cache");

if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
}

// Prevent duplicate processing
const processing = new Set();

const VIDEO_LINK_REGEX =
    /(https?:\/\/(?:www\.|m\.)?(?:facebook\.com|fb\.watch|fb\.com|tiktok\.com|vt\.tiktok\.com|vm\.tiktok\.com|instagram\.com|instagr\.am|threads\.net|twitter\.com|x\.com|t\.co|youtube\.com|youtu\.be|pinterest\.com|pin\.it|likee\.video|capcut\.com)[^\s]*)/gi;

module.exports = {
    config: {
        name: "autodl",
        aliases: ["adl", "autodown"],
        version: "1.2.0",
        author: "ariYa'n bb'z",
        countDown: 5,
        role: 0,

        shortDescription: {
            en: "Auto download video when link is pasted"
        },

        description: {
            en: "Automatically downloads supported videos when a link is pasted"
        },

        category: "media",

        guide: {
            en: "Paste a supported video link in the chat\nOr use: {pn} <link>"
        }
    },

    onStart: async function ({ api, args, message, event }) {
        const url = args.join(" ").trim();

        if (!url) {
            return message.reply(
                "📥 শুধু ভিডিও লিংক পেস্ট করো, অটো ডাউনলোড হয়ে যাবে!\n\nঅথবা: autodl <link>"
            );
        }

        await handleDownload({
            api,
            message,
            event,
            url,
            isAuto: false
        });
    },

    onChat: async function ({ api, message, event }) {
        // Ignore bot's own messages
        if (event.senderID == api.getCurrentUserID()) return;

        const body = event.body || "";
        if (!body || body.length < 10) return;

        const matches = body.match(VIDEO_LINK_REGEX);
        if (!matches || matches.length === 0) return;

        const url = matches[0].trim();
        const lockKey = event.messageID || `${event.threadID}_${url}`;

        if (processing.has(lockKey)) return;
        processing.add(lockKey);

        try {
            await new Promise(resolve => setTimeout(resolve, 600));

            await handleDownload({
                api,
                message,
                event,
                url,
                isAuto: true,
                lockKey
            });
        } finally {
            processing.delete(lockKey);
        }
    }
};

async function handleDownload({
    api,
    message,
    event,
    url,
    isAuto = false,
    lockKey = null
}) {
    let waitingMsg;
    let filePath;

    try {
        waitingMsg = await message.reply(
            isAuto
                ? "🔗 লিংক ডিটেক্ট হয়েছে!\n⏳ ভিডিও ডাউনলোড হচ্ছে..."
                : "⏳ ভিডিও ডাউনলোড হচ্ছে..."
        );

        const fileName = `autodl_${Date.now()}.mp4`;
        filePath = path.join(CACHE_DIR, fileName);

        const result = await downloadVideo(url, filePath);

        const title = result?.title || "Video";
        const finalPath = result?.filePath || filePath;

        if (!fs.existsSync(finalPath)) {
            throw new Error("ফাইল তৈরি হয়নি");
        }

        const stats = fs.statSync(finalPath);

        if (stats.size < 1024) {
            throw new Error("ফাইল খুব ছোট — ডাউনলোড ফেইল হয়েছে");
        }

        await message.reply({
            body: `🎬 𝗧𝗶𝘁𝗹𝗲: ${title}\n\n✅ Owner: ariYa'n bb'z`,
            attachment: fs.createReadStream(finalPath)
        });

        // Cleanup downloaded file
        setTimeout(() => {
            try {
                if (fs.existsSync(finalPath)) {
                    fs.unlinkSync(finalPath);
                }
            } catch (error) {
                console.error("[autodl] Cleanup error:", error.message);
            }
        }, 20000);

    } catch (err) {
        console.error("[autodl] Error:", err.message);

        if (!isAuto) {
            await message.reply(
                `❌ ডাউনলোড করতে পারিনি:\n${err.message}`
            );
        }
    } finally {
        if (lockKey) processing.delete(lockKey);

        if (waitingMsg?.messageID) {
            try {
                await api.unsendMessage(waitingMsg.messageID);
            } catch (_) {}
        }
    }
}
