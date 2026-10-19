const axios = require("axios");

const PRIMARY_API = "https://melissa-api-hub-1.onrender.com/Melissa-api-hub/badhon-00-api/apis/melissa/sing?q=";
const FALLBACK_API = "https://melissa-api-hub-1.onrender.com/api/sing/search?limit=5&q=";

module.exports = {
  config: {
    name: "play",
    author: "AriYa'n BB'Z",
    version: "3.1.0",
    role: 0,
    category: "tools",
    usage: "{pn} <query>"
  },

  react: async function ({ message, api, event }, emoji) {
    try {
      if (message && typeof message.react === "function") {
        await message.react(emoji);
        return;
      }

      if (api && typeof api.setMessageReaction === "function" && event) {
        await api.setMessageReaction(
          emoji,
          event.messageID,
          () => {},
          true
        );
      }
    } catch (e) {
      console.log("[play] Reaction error:", e.message);
    }
  },

  fetchAudioStream: async function (audioUrl) {
    return axios.get(audioUrl, {
      responseType: "stream",
      timeout: 60000,
      maxRedirects: 5
    });
  },

  onStart: async function ({ message, args, api, event }) {
    const query = args.join(" ").trim();

    if (!query) {
      return message.reply(
        "🎵 Please provide a song name!\nExample: play Shape of You"
      );
    }

    const ctx = { message, api, event };

    await module.exports.react(ctx, "⏳");

    try {
      let data;

      // Try the primary API first
      try {
        const res = await axios.get(
          PRIMARY_API + encodeURIComponent(query),
          { timeout: 15000 }
        );

        data = res.data;
      } catch (primaryError) {
        console.log(
          "[play] Primary API failed:",
          primaryError.message
        );

        // Use the existing fallback API
        const res = await axios.get(
          FALLBACK_API + encodeURIComponent(query),
          { timeout: 15000 }
        );

        data = res.data;
      }

      const result = data?.result || data?.data || data;

      const audioUrl =
        data?.download_url ||
        data?.audio_url ||
        data?.url ||
        result?.download_url ||
        result?.audio_url ||
        result?.url;

      const title =
        data?.title ||
        result?.title ||
        query;

      if (!audioUrl || typeof audioUrl !== "string") {
        await module.exports.react(ctx, "❌");
        return message.reply(
          "❌ Song not found. Please try another song name."
        );
      }

      // Stream audio instead of downloading the whole file first
      let audioRes;

      try {
        audioRes = await module.exports.fetchAudioStream(audioUrl);
      } catch (audioError) {
        console.log(
          "[play] Audio stream error:",
          audioError.message
        );

        await module.exports.react(ctx, "❌");

        return message.reply(
          "❌ Couldn't load the audio. Please try again."
        );
      }

      // Send the audio as soon as the stream is ready
      try {
        await message.reply({
          body: `🎵 Now Playing\n🎧 ${title}`,
          attachment: audioRes.data
        });

        await module.exports.react(ctx, "✅");
      } catch (sendError) {
        if (audioRes.data && typeof audioRes.data.destroy === "function") {
          audioRes.data.destroy();
        }

        throw sendError;
      }
    } catch (err) {
      console.log("[play] Error:", err.message);

      await module.exports.react(ctx, "❌");

      return message.reply(
        "❌ Something went wrong: " +
        (err.response?.data?.error || err.message)
      );
    }
  }
};
