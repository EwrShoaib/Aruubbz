
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data");
const STATUS_FILE = path.join(DATA_DIR, "emojivoice_status.json");
const CACHE_DIR = path.join(__dirname, "..", "cache", "emojivoice");

// Author: Ariyan

const EMOJI_AUDIO_MAP = {
  "🥱": ["https://files.catbox.moe/9pou40.mp3", "https://files.catbox.moe/60cwcg.mp3"],
  "😁": ["https://files.catbox.moe/60cwcg.mp3"],
  "😌": ["https://files.catbox.moe/epqwbx.mp3"],
  "🥺": ["https://files.catbox.moe/wc17iq.mp3", "https://files.catbox.moe/dv9why.mp3"],
  "🤭": ["https://files.catbox.moe/cu0mpy.mp3"],
  "😅": ["https://files.catbox.moe/jl3pzb.mp3"],
  "😏": ["https://files.catbox.moe/z9e52r.mp3"],
  "😞": ["https://files.catbox.moe/tdimtx.mp3"],
  "🤫": ["https://files.catbox.moe/0uii99.mp3"],
  "🍼": ["https://files.catbox.moe/p6ht91.mp3"],
  "🤔": ["https://files.catbox.moe/hy6m6w.mp3"],
  "🥰": ["https://files.catbox.moe/dv9why.mp3"],
  "🤦": ["https://files.catbox.moe/ivlvoq.mp3"],
  "😘": ["https://files.catbox.moe/sbws0w.mp3", "https://files.catbox.moe/37dqpx.mp3"],
  "😑": ["https://files.catbox.moe/p78xfw.mp3"],
  "😢": ["https://files.catbox.moe/shxwj1.mp3"],
  "🙊": ["https://files.catbox.moe/3bejxv.mp3"],
  "🤨": ["https://files.catbox.moe/4aci0r.mp3"],
  "😡": ["https://files.catbox.moe/shxwj1.mp3", "https://files.catbox.moe/h9ekli.mp3"],
  "🤬": ["https://files.catbox.moe/shxwj1.mp3", "https://files.catbox.moe/h9ekli.mp3"],
  "🙈": ["https://files.catbox.moe/3qc90y.mp3"],
  "😍": ["https://files.catbox.moe/qjfk1b.mp3"],
  "😭": ["https://files.catbox.moe/itm4g0.mp3"],
  "😱": ["https://files.catbox.moe/mu0kka.mp3"],
  "😻": ["https://files.catbox.moe/y8ul2j.mp3"],
  "😿": ["https://files.catbox.moe/tqxemm.mp3"],
  "💔": ["https://files.catbox.moe/6yanv3.mp3"],
  "🤣": ["https://files.catbox.moe/2sweut.mp3", "https://files.catbox.moe/jl3pzb.mp3"],
  "🥹": ["https://files.catbox.moe/jf85xe.mp3"],
  "😩": ["https://files.catbox.moe/b4m5aj.mp3"],
  "🫣": ["https://files.catbox.moe/ttb6hi.mp3"],
  "🐸": ["https://files.catbox.moe/utl83s.mp3", "https://files.catbox.moe/sg6ugl.mp3"],
  "💋": ["https://files.catbox.moe/37dqpx.mp3"],
  "🫦": ["https://files.catbox.moe/61w3i0.mp3"],
  "😴": ["https://files.catbox.moe/rm5ozj.mp3"],
  "🙏": ["https://files.catbox.moe/7avi7u.mp3"],
  "😼": ["https://files.catbox.moe/4oz916.mp3"],
  "🖕": ["https://files.catbox.moe/593u3j.mp3", "https://files.catbox.moe/dtua60.mp3"],
  "🥵": ["https://files.catbox.moe/l90704.mp3"],
  "🙂": ["https://files.catbox.moe/4oks08.mp3"],
  "😒": ["https://files.catbox.moe/mt5il0.mp3"],
  "😓": ["https://files.catbox.moe/zh3mdg.mp3"],
  "🤧": ["https://files.catbox.moe/zh3mdg.mp3"],
  "🙄": ["https://files.catbox.moe/vgzkeu.mp3"],
  "🤪": ["https://files.catbox.moe/ihmbr7.mp3"],
  "👍": ["https://files.catbox.moe/74bho5.mp3"]
};

async function readStatus() {
  await fs.ensureDir(DATA_DIR);
  return fs.readJson(STATUS_FILE).catch(() => ({}));
}

module.exports = {
  config: {
    name: "emojivoice",
    aliases: ["ev"],
    version: "2.0.0",
    author: "Ariyan",
    countDown: 2,
    role: 0,
    shortDescription: "Auto voice reply on emoji",
    category: "group",
    guide: {
      en: "{pn} on\n{pn} off"
    }
  },

  onStart: async function ({ event, args, message }) {
    const threadID = event.threadID;
    const cmd = (args[0] || "").toLowerCase();

    if (cmd !== "on" && cmd !== "off") {
      return message.reply(
        "🎙️ EmojiVoice Commands\n\n" +
        "ev on  — চালু করতে\n" +
        "ev off — বন্ধ করতে"
      );
    }

    const status = await readStatus();
    status[threadID] = cmd === "on";

    await fs.writeJson(STATUS_FILE, status, { spaces: 2 });

    return message.reply(
      cmd === "on"
        ? "✅ EmojiVoice চালু হয়েছে!\nএখন নির্দিষ্ট emoji দিলে voice আসবে।"
        : "❌ EmojiVoice বন্ধ হয়েছে।"
    );
  },

  onChat: async function ({ api, event }) {
    const threadID = event.threadID;
    const messageID = event.messageID;
    const body = event.body;

    if (!body || !threadID || !messageID) return;

    // Only exact emoji matches from the map are accepted.
    const emoji = body.trim();
    const voiceList = EMOJI_AUDIO_MAP[emoji];

    if (!voiceList) return;

    const status = await readStatus();
    if (status[threadID] !== true) return;

    const voiceUrl =
      voiceList[Math.floor(Math.random() * voiceList.length)];

    const tempFile = path.join(
      CACHE_DIR,
      `voice_${Date.now()}_${Math.random().toString(36).slice(2)}.mp3`
    );

    try {
      await fs.ensureDir(CACHE_DIR);

      const response = await axios.get(voiceUrl, {
        responseType: "arraybuffer",
        timeout: 30000,
        maxContentLength: 15 * 1024 * 1024,
        maxBodyLength: 15 * 1024 * 1024,
        validateStatus: status => status >= 200 && status < 300
      });

      if (!response.data || response.data.byteLength === 0) {
        throw new Error("Empty audio response");
      }

      await fs.writeFile(tempFile, response.data);

      // Send audio as a file stream and reply to the emoji.
      await new Promise((resolve, reject) => {
        const stream = fs.createReadStream(tempFile);
        let finished = false;

        const done = error => {
          if (finished) return;
          finished = true;
          stream.destroy();

          if (error) reject(error);
          else resolve();
        };

        stream.on("error", done);

        api.sendMessage(
          {
            body: "🎙️",
            attachment: stream
          },
          threadID,
          err => done(err || null),
          messageID
        );
      });
    } catch (error) {
      console.error(
        "[EmojiVoice Error]",
        error.response?.status || error.message
      );
    } finally {
      await fs.remove(tempFile).catch(() => {});
    }
  }
};
  
