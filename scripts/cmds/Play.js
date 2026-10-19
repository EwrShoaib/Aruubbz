const axios = require("axios");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { pipeline } = require("stream/promises");

const PRIMARY_API = "https://melissa-api-hub-1.onrender.com/Melissa-api-hub/badhon-00-api/apis/melissa/sing?q=";
const FALLBACK_API = "https://melissa-api-hub-1.onrender.com/api/sing/search?limit=5&q=";

module.exports = {
  config: {
    name: "play",
    author: "AriYa'n BB'Z",
    version: "3.2.0",
    role: 0,
    category: "tools",
    usage: "{pn} <query>"
  },

  react: async function ({ message, api, event }, emoji) {
    try {
      if (message?.react) {
        await message.react(emoji);
      } else if (api?.setMessageReaction && event?.messageID) {
        await api.setMessageReaction(
          emoji, event.messageID, () => {}, true
        );
      }
    } catch (_) {}
  },

  onStart: async function ({ message, args, api, event }) {
    const query = args.join(" ").trim();
    const ctx = { message, api, event };

    if (!query) {
      return message.reply("🎵 Usage: play <song name>");
    }

    let filePath;

    try {
      await module.exports.react(ctx, "⏳");
      console.log("[play] Searching:", query);

      let data;

      // Primary API first, fallback only if it fails
      try {
        const res = await axios.get(
          PRIMARY_API + encodeURIComponent(query),
          { timeout: 12000 }
        );
        data = res.data;
        console.log("[play] Primary API responded");
      } catch (err) {
        console.log("[play] Primary API failed:", err.message);

        const res = await axios.get(
          FALLBACK_API + encodeURIComponent(query),
          { timeout: 12000 }
        );
        data = res.data;
        console.log("[play] Fallback API responded");
      }

      const result = data?.result || data?.data || data;
      const first = Array.isArray(result) ? result[0] : result;

      const audioUrl =
        first?.download_url ||
        first?.audio_url ||
        first?.downloadUrl ||
        first?.url ||
        data?.download_url ||
        data?.audio_url;

      const title =
        first?.title ||
        first?.name ||
        data?.title ||
        query;

      if (!audioUrl || typeof audioUrl !== "string") {
        console.log("[play] No audio URL. Response:", JSON.stringify(data).slice(0, 1000));
        await module.exports.react(ctx, "❌");
        return message.reply("❌ Song URL not found. Check the API response.");
      }

      console.log("[play] Downloading audio:", title);

      filePath = path.join(
        os.tmpdir(),
        `play_${Date.now()}_${Math.random().toString(36).slice(2)}.mp3`
      );

      const audio = await axios.get(audioUrl, {
        responseType: "stream",
        timeout: 45000,
        maxRedirects: 5
      });

      await pipeline(
        audio.data,
        fs.createWriteStream(filePath)
      );

      const stats = fs.statSync(filePath);

      if (!stats.size) {
        throw new Error("Downloaded audio file is empty");
      }

      console.log("[play] Download complete:", stats.size, "bytes");
      console.log("[play] Sending audio to Messenger");

      await message.reply({
        body: `🎵 ${title}`,
        attachment: fs.createReadStream(filePath)
      });

      console.log("[play] Audio sent successfully");
      await module.exports.react(ctx, "✅");

    } catch (err) {
      console.error("[play] ERROR:", err.message);

      await module.exports.react(ctx, "❌");

      try {
        await message.reply(
          "❌ Music failed: " + err.message
        );
      } catch (_) {}

    } finally {
      if (filePath) {
        setTimeout(() => {
          try {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
          } catch (_) {}
        }, 30000);
      }
    }
  }
};
