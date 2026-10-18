
const moment = require("moment-timezone");
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { downloadVideo } = require("sagor-video-downloader");

const TZ = "Asia/Dhaka";
const CACHE_DIR = path.join(__dirname, "cache", "autotimer");
const STATE_FILE = path.join(CACHE_DIR, "state.json");

let interval = null;
let running = false;
let prayerTimes = {};
let prayerDate = "";
let hourlyIndex = 0;

const sent = new Set();

const PRAYER_VIDEOS = {
  Fajr: "https://files.catbox.moe/ee9khu.mp4",
  Dhuhr: "https://files.catbox.moe/c5qbek.mp4",
  Asr: "https://files.catbox.moe/vcgbxq.mp4",
  Maghrib: "https://files.catbox.moe/y8pnz7.mp4",
  Isha: "https://files.catbox.moe/rpnut9.mp4"
};

const VIDEO_LINKS = [
  "https://vm.tiktok.com/ZSgjEsuVY/",
  "https://vm.tiktok.com/ZSgjoJSTf/",
  "https://vm.tiktok.com/ZSgjETWbr/",
  "https://vm.tiktok.com/ZSgjETe5S/",
  "https://vm.tiktok.com/ZSgjorety/",
  "https://vm.tiktok.com/ZSgjo2GHV/",
  "https://vm.tiktok.com/ZSgjoNAYo/",
  "https://vm.tiktok.com/ZSgjobepV/",
  "https://vm.tiktok.com/ZSgjoUQ7m/",
  "https://vm.tiktok.com/ZSgjoDSma/",
  "https://vm.tiktok.com/ZSg61d42X/",
  "https://vm.tiktok.com/ZSg6156Cr/",
  "https://vm.tiktok.com/ZSg61DbyV/",
  "https://vm.tiktok.com/ZSg61rF7Q/",
  "https://vm.tiktok.com/ZSg61n5hw/"
];

const PRAYER_NAMES = {
  Fajr: "ফজরের",
  Dhuhr: "যোহরের",
  Asr: "আসরের",
  Maghrib: "মাগরিবের",
  Isha: "এশার"
};

const HOURLY_MESSAGES = [
  "🌿 আল্লাহর প্রতিটি নিয়ামতের জন্য আলহামদুলিল্লাহ বলুন।",
  "🤲 নিজের ও পরিবারের জন্য দোয়া করুন।",
  "✨ ব্যস্ততার মাঝেও আল্লাহকে স্মরণ করুন।",
  "🌙 আল্লাহ আমাদের সবাইকে হেফাজত করুন।",
  "💚 ভালো কথা বলুন, ভালো কাজ করুন।",
  "📿 সুবহানাল্লাহ, আলহামদুলিল্লাহ, আল্লাহু আকবার।",
  "🤍 আল্লাহর রহমতের আশা রাখুন।",
  "🌸 মানুষের সঙ্গে সুন্দর ব্যবহার করুন।",
  "🤲 আপনার প্রতিটি ভালো কাজ কবুল হোক।",
  "🌱 নতুন মুহূর্ত, ভালো কাজের নতুন সুযোগ।",
  "💫 আল্লাহর ওপর ভরসা রাখুন।",
  "🕊️ মনকে শান্ত রাখুন এবং দোয়া করুন।"
];

async function loadState() {
  await fs.ensureDir(CACHE_DIR);

  try {
    const state = await fs.readJson(STATE_FILE);

    hourlyIndex =
      Number.isInteger(state.hourlyIndex) && state.hourlyIndex >= 0
        ? state.hourlyIndex % VIDEO_LINKS.length
        : 0;

    return state;
  } catch {
    hourlyIndex = 0;
    return {};
  }
}

async function saveState() {
  await fs.ensureDir(CACHE_DIR);

  await fs.writeJson(
    STATE_FILE,
    { hourlyIndex },
    { spaces: 2 }
  );
}

async function getPrayerTimes() {
  const date = moment().tz(TZ).format("DD-MM-YYYY");

  const response = await axios.get(
    `https://api.aladhan.com/v1/timings/${date}`,
    {
      params: {
        latitude: 23.8103,
        longitude: 90.4125,
        method: 1,
        school: 1
      },
      timeout: 15000
    }
  );

  if (response.data.code !== 200) {
    throw new Error("Prayer API unavailable");
  }

  const t = response.data.data.timings;

  return {
    Fajr: t.Fajr,
    Dhuhr: t.Dhuhr,
    Asr: t.Asr,
    Maghrib: t.Maghrib,
    Isha: t.Isha
  };
}

async function refreshPrayerTimes() {
  try {
    prayerTimes = await getPrayerTimes();
    prayerDate = moment().tz(TZ).format("YYYY-MM-DD");

    console.log("[AutoTimer] Prayer times updated.");
  } catch (error) {
    console.log("[AutoTimer] Prayer API error:", error.message);
  }
}

function isVideoFile(file) {
  try {
    return (
      typeof file === "string" &&
      fs.existsSync(file) &&
      fs.statSync(file).isFile() &&
      fs.statSync(file).size > 0
    );
  } catch {
    return false;
  }
}

async function downloadDirectVideo(url, destination) {
  const response = await axios.get(url, {
    responseType: "stream",
    timeout: 90000,
    maxRedirects: 10
  });

  const contentType = response.headers["content-type"] || "";

  if (
    contentType.includes("text/html") ||
    contentType.includes("application/json")
  ) {
    response.data.destroy();
    throw new Error("URL did not return a video file");
  }

  await new Promise((resolve, reject) => {
    const writer = fs.createWriteStream(destination);

    response.data.pipe(writer);

    writer.on("finish", resolve);
    writer.on("error", reject);
    response.data.on("error", reject);
  });

  if (!isVideoFile(destination)) {
    throw new Error("Downloaded file is empty");
  }

  return destination;
}

function extractResult(result) {
  if (typeof result === "string") {
    return result;
  }

  if (Buffer.isBuffer(result)) {
    return result;
  }

  if (result && typeof result === "object") {
    return (
      result.filePath ||
      result.path ||
      result.videoUrl ||
      result.downloadUrl ||
      result.url ||
      result.video ||
      result.data?.videoUrl ||
      result.data?.url ||
      null
    );
  }

  return null;
}

async function getPrayerVideo(prayerKey) {
  const destination = path.join(
    CACHE_DIR,
    `prayer_${prayerKey}.mp4`
  );

  if (isVideoFile(destination)) {
    return destination;
  }

  return downloadDirectVideo(
    PRAYER_VIDEOS[prayerKey],
    destination
  );
}

async function getHourlyVideo(index) {
  const destination = path.join(
    CACHE_DIR,
    `hourly_${index + 1}.mp4`
  );

  if (isVideoFile(destination)) {
    return destination;
  }

  const result = await downloadVideo(VIDEO_LINKS[index]);
  const extracted = extractResult(result);

  if (Buffer.isBuffer(extracted)) {
    await fs.writeFile(destination, extracted);
    return destination;
  }

  if (typeof extracted === "string" && isVideoFile(extracted)) {
    if (path.resolve(extracted) !== path.resolve(destination)) {
      await fs.copyFile(extracted, destination);
    }

    return destination;
  }

  if (
    typeof extracted === "string" &&
    /^https?:\/\//i.test(extracted)
  ) {
    return downloadDirectVideo(extracted, destination);
  }

  throw new Error(
    `TikTok video ${index + 1} download failed: no usable video file returned`
  );
}

async function sendToGroups(api, body, filepath) {
  const threads = await api.getThreadList(200, null, ["INBOX"]);
  const groups = threads.filter(thread => thread.isGroup);

  if (!groups.length) {
    console.log("[AutoTimer] No groups found.");
    return;
  }

  for (const thread of groups) {
    try {
      await api.sendMessage(
        {
          body,
          attachment: fs.createReadStream(filepath)
        },
        thread.threadID
      );

      console.log(`[AutoTimer] Sent to ${thread.threadID}`);
    } catch (error) {
      console.log(
        `[AutoTimer] Group ${thread.threadID}: ${error.message}`
      );
    }

    await new Promise(resolve => setTimeout(resolve, 1200));
  }
}

function getUpcomingPrayer(prayers, now) {
  const upcoming = [];

  for (const [name, value] of Object.entries(prayers)) {
    const match = String(value).match(/^(\d{1,2}):(\d{2})/);

    if (!match) continue;

    const target = now.clone().set({
      hour: Number(match[1]),
      minute: Number(match[2]),
      second: 0,
      millisecond: 0
    });

    if (target.isAfter(now)) {
      upcoming.push({ name, target });
    }
  }

  return upcoming.sort(
    (a, b) => a.target.valueOf() - b.target.valueOf()
  );
}

module.exports = {
  config: {
    name: "autotimer",
    aliases: ["atimer"],
    version: "6.0.0",
    author: "ariYa'n bb'z bot 🚩",
    countDown: 5,
    role: 2,
    description: "Prayer video and hourly TikTok reminders",
    category: "system",
    guide: "{pn} status / next / list / reload"
  },

  onStart: async function ({ message, args }) {
    const command = (args[0] || "status").toLowerCase();

    if (command === "status") {
      return message.reply(
        "✅ AutoTimer: AUTO-ON\n" +
        "🕌 Prayer reminders: 5\n" +
        "🎥 Prayer videos: Old videos\n" +
        `⏰ Hourly videos: ${VIDEO_LINKS.length} TikTok links\n` +
        "🔁 One video per reminder\n" +
        "🌏 Timezone: Asia/Dhaka\n" +
        "🤖 ariYa'n bb'z bot 🚩"
      );
    }

    if (command === "next") {
      try {
        const prayers = await getPrayerTimes();
        const now = moment().tz(TZ);
        const upcoming = getUpcomingPrayer(prayers, now);

        if (!upcoming.length) {
          return message.reply(
            "🕌 আজকের নামাজের সময় শেষ।"
          );
        }

        const next = upcoming[0];

        return message.reply(
          `🕌 পরবর্তী নামাজ: ${PRAYER_NAMES[next.name]} নামাজ\n` +
          `🕒 সময়: ${next.target.format("hh:mm A")}\n` +
          `📅 তারিখ: ${next.target.format("DD-MM-YYYY")}`
        );
      } catch {
        return message.reply(
          "⚠️ নামাজের সময় পাওয়া যায়নি। পরে চেষ্টা করুন।"
        );
      }
    }

    if (command === "list") {
      return message.reply(
        "🕌 নামাজ: Fajr, Dhuhr, Asr, Maghrib, Isha\n" +
        "🎥 নামাজের সময়: পুরোনো ভিডিও\n" +
        "⏰ প্রতি ঘণ্টায়: নতুন TikTok ভিডিও\n" +
        `📹 নতুন ভিডিও: ${VIDEO_LINKS.length}টি\n` +
        "🌏 Asia/Dhaka"
      );
    }

    if (command === "reload") {
      try {
        await fs.emptyDir(CACHE_DIR);

        // Preserve the saved hourly index.
        await saveState();

        return message.reply(
          "♻️ Video cache পরিষ্কার হয়েছে। পরবর্তী রিমাইন্ডারে ভিডিও আবার ডাউনলোড হবে।"
        );
      } catch (error) {
        return message.reply(
          `❌ Cache পরিষ্কার করা যায়নি: ${error.message}`
        );
      }
    }

    return message.reply(
      "📌 AutoTimer Commands\n\n" +
      "autotimer status — অবস্থা\n" +
      "autotimer next — পরবর্তী নামাজ\n" +
      "autotimer list — রিমাইন্ডার তালিকা\n" +
      "autotimer reload — ভিডিও cache পরিষ্কার"
    );
  },

  onLoad: function ({ api }) {
    if (interval) return;

    fs.ensureDirSync(CACHE_DIR);

    (async () => {
      await loadState();
      await refreshPrayerTimes();

      interval = setInterval(async () => {
        if (running) return;

        running = true;

        try {
          const now = moment().tz(TZ);
          const date = now.format("YYYY-MM-DD");
          const minute = now.format("HH:mm");

          if (date !== prayerDate) {
            await refreshPrayerTimes();
          }

          if (!Object.keys(prayerTimes).length) return;

          const key = `${date}_${minute}`;

          if (sent.has(key)) return;

          const prayer = Object.entries(prayerTimes).find(
            ([, value]) => String(value).slice(0, 5) === minute
          );

          let body;
          let filepath;

          if (prayer) {
            const [prayerKey] = prayer;

            body =
              "━━━━━━━━━━━━━━━━━━\n" +
              `🕌 ${PRAYER_NAMES[prayerKey]} নামাজের সময়\n` +
              `🕒 সময়: ${now.format("hh:mm A")}\n` +
              `📅 তারিখ: ${now.format("DD-MM-YYYY")}\n` +
              "━━━━━━━━━━━━━━━━━━\n\n" +
              "🤲 নামাজের জন্য প্রস্তুতি নিন।\n" +
              "আল্লাহ আমাদের সবার ইবাদত কবুল করুন।\n\n" +
              "🤖 ariYa'n bb'z bot 🚩";

            // Prayer time always uses its designated old video.
            filepath = await getPrayerVideo(prayerKey);
          } else if (now.minute() === 0) {
            const index = hourlyIndex;

            body =
              "🌿 HOURLY REMINDER\n\n" +
              `🕒 সময়: ${now.format("hh:mm A")}\n` +
              `📅 তারিখ: ${now.format("DD-MM-YYYY")}\n\n` +
              `${HOURLY_MESSAGES[now.hour() % HOURLY_MESSAGES.length]}\n\n` +
              "🤖 ariYa'n bb'z bot 🚩";

            // Hourly reminders use only the new TikTok videos.
            filepath = await getHourlyVideo(index);

            hourlyIndex = (hourlyIndex + 1) % VIDEO_LINKS.length;
            await saveState();
          } else {
            return;
          }

          await sendToGroups(api, body, filepath);
          sent.add(key);

          if (sent.size > 1500) {
            const entries = Array.from(sent);
            entries.slice(0, 500).forEach(item => sent.delete(item));
          }

          console.log(`[AutoTimer] Completed ${key}`);
        } catch (error) {
          console.log("[AutoTimer] Error:", error.message);
        } finally {
          running = false;
        }
      }, TICK_MS);

      console.log("[AutoTimer] AUTO-ON successfully.");
    })().catch(error => {
      console.log("[AutoTimer] Startup error:", error.message);
    });
  }
};
