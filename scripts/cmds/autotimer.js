
const moment = require("moment-timezone");
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const TZ = "Asia/Dhaka";
const cacheDir = path.resolve(__dirname, "cache", "autotimer");

let interval = null;
let running = false;
let prayerTimes = {};
let prayerDate = "";
const sent = new Set();

const VIDEO_URLS = {
  hourly: [
    "https://files.catbox.moe/7ch5ym.mp4",
    "https://files.catbox.moe/rqnlpt.mp4",
    "https://files.catbox.moe/ev7guv.mp4",
    "https://files.catbox.moe/rijx8m.mp4",
    "https://files.catbox.moe/otdztt.mp4",
    "https://files.catbox.moe/otdztt.mp4"
  ],
  Fajr: "https://files.catbox.moe/ee9khu.mp4",
  Dhuhr: "https://files.catbox.moe/c5qbek.mp4",
  Asr: "https://files.catbox.moe/vcgbxq.mp4",
  Maghrib: "https://files.catbox.moe/y8pnz7.mp4",
  Isha: "https://files.catbox.moe/rpnut9.mp4"
};

const prayerNames = {
  Fajr: "ফজরের",
  Dhuhr: "যোহরের",
  Asr: "আসরের",
  Maghrib: "মাগরিবের",
  Isha: "এশার"
};

const hourlyMessages = [
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

async function getPrayerTimes() {
  const date = moment().tz(TZ).format("DD-MM-YYYY");

  const url =
    `https://api.aladhan.com/v1/timings/${date}` +
    "?latitude=23.8103&longitude=90.4125&method=1&school=1";

  const response = await axios.get(url, {
    timeout: 15000
  });

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

async function getVideo(url, key) {
  await fs.ensureDir(cacheDir);

  const filename = key.replace(/[^a-zA-Z0-9_-]/g, "_") + ".mp4";
  const filepath = path.join(cacheDir, filename);

  if (await fs.pathExists(filepath)) {
    const stat = await fs.stat(filepath);
    if (stat.size > 0) return filepath;
  }

  const response = await axios.get(url, {
    responseType: "arraybuffer",
    timeout: 60000
  });

  await fs.writeFile(filepath, Buffer.from(response.data));

  return filepath;
}

async function sendToGroups(api, body, videoUrl, key) {
  const filepath = await getVideo(videoUrl, key);

  const threads = await api.getThreadList(200, null, ["INBOX"]);
  const groups = threads.filter(thread => thread.isGroup);

  for (const thread of groups) {
    try {
      await api.sendMessage(
        {
          body,
          attachment: fs.createReadStream(filepath)
        },
        thread.threadID
      );

      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.log(
        `[AutoTimer] Failed in group ${thread.threadID}:`,
        error.message
      );
    }
  }
}

module.exports = {
  config: {
    name: "autotimer",
    version: "4.0.0",
    author: "ariYa'n bb'z bot 🚩",
    countDown: 5,
    role: 2,
    description: "Always-on Islamic message and video timer",
    category: "system",
    guide: "{pn} status / next / list / reload"
  },

  onStart: async function ({ message, args }) {
    const command = (args[0] || "status").toLowerCase();

    if (command === "off" || command === "on") {
      return message.reply(
        "🤖 AutoTimer স্বয়ংক্রিয়ভাবে চালু থাকে।\n" +
        "এটি বন্ধ বা চালু করতে আলাদা কমান্ড প্রয়োজন নেই।"
      );
    }

    if (command === "status") {
      return message.reply(
        "✅ AutoTimer: AUTO-ON\n" +
        "🌏 Timezone: Asia/Dhaka\n" +
        "🕌 Prayer schedule: API-based\n" +
        "🎥 Hourly reminders: Enabled\n" +
        "🤖 ariYa'n bb'z bot 🚩"
      );
    }

    if (command === "next") {
      try {
        const prayers = await getPrayerTimes();
        const now = moment().tz(TZ);
        const upcoming = [];

        for (const [name, value] of Object.entries(prayers)) {
          const [hour, minute] = value.split(":").map(Number);

          const target = now.clone().set({
            hour,
            minute,
            second: 0,
            millisecond: 0
          });

          if (target.isAfter(now)) {
            upcoming.push({ name, target });
          }
        }

        upcoming.sort((a, b) => a.target.valueOf() - b.target.valueOf());

        if (!upcoming.length) {
          return message.reply(
            "🕌 আজকের নামাজের সময় শেষ। আগামী দিনের সময় পরে দেখুন।"
          );
        }

        const next = upcoming[0];

        return message.reply(
          `🕌 পরবর্তী নামাজ: ${prayerNames[next.name]} নামাজ\n` +
          `🕒 সময়: ${next.target.format("hh:mm A")}\n` +
          `📅 তারিখ: ${next.target.format("DD-MM-YYYY")}`
        );
      } catch (error) {
        return message.reply("⚠️ নামাজের সময় পাওয়া যায়নি। পরে আবার চেষ্টা করুন।");
      }
    }

    if (command === "list") {
      return message.reply(
        "🕌 নামাজ: Fajr, Dhuhr, Asr, Maghrib, Isha\n" +
        "🌿 ইসলামিক রিমাইন্ডার: প্রতি ঘণ্টায়\n" +
        "🌏 Location: Dhaka, Bangladesh\n" +
        "🕒 Timezone: Asia/Dhaka"
      );
    }

    if (command === "reload") {
      try {
        await fs.remove(cacheDir);
        await fs.ensureDir(cacheDir);
        return message.reply("♻️ Video cache পরিষ্কার করা হয়েছে।");
      } catch (error) {
        return message.reply("❌ Cache পরিষ্কার করা যায়নি।");
      }
    }

    return message.reply(
      "📌 AutoTimer Commands\n\n" +
      "autotimer status — বর্তমান অবস্থা\n" +
      "autotimer next — পরবর্তী নামাজ\n" +
      "autotimer list — সময়সূচি\n" +
      "autotimer reload — ভিডিও cache পরিষ্কার"
    );
  },

  onLoad: function ({ api }) {
    if (interval) return;

    fs.ensureDirSync(cacheDir);

    refreshPrayerTimes();

    interval = setInterval(async () => {
      if (running) return;
      running = true;

      try {
        const now = moment().tz(TZ);
        const date = now.format("YYYY-MM-DD");
        const minute = now.format("HH:mm");
        const displayTime = now.format("hh:mm A");

        if (date !== prayerDate) {
          await refreshPrayerTimes();
        }

        if (!Object.keys(prayerTimes).length) return;

        const prayer = Object.entries(prayerTimes).find(
          ([, time]) => time.slice(0, 5) === minute
        );

        const key = `${date}_${minute}`;

        if (sent.has(key)) return;

        let videoUrl;
        let body;

        if (prayer) {
          const [prayerKey] = prayer;
          videoUrl = VIDEO_URLS[prayerKey];

          if (!videoUrl) return;

          body =
            `━━━━━━━━━━━━━━━━━━\n` +
            `🕌 ${prayerNames[prayerKey]} নামাজের সময়\n` +
            `🕒 সময়: ${displayTime}\n` +
            `📅 তারিখ: ${now.format("DD-MM-YYYY")}\n` +
            `━━━━━━━━━━━━━━━━━━\n\n` +
            `🤲 নামাজের জন্য প্রস্তুতি নিন।\n` +
            `আল্লাহ আমাদের সবার ইবাদত কবুল করুন।\n\n` +
            `🤖 ariYa'n bb'z bot 🚩`;
        } else if (now.minute() === 0) {
          const index = now.hour() % hourlyMessages.length;

          videoUrl =
            VIDEO_URLS.hourly[now.hour() % VIDEO_URLS.hourly.length];

          body =
            `🌿 ISLAMIC HOURLY REMINDER\n\n` +
            `🕒 সময়: ${displayTime}\n` +
            `📅 তারিখ: ${now.format("DD-MM-YYYY")}\n\n` +
            `${hourlyMessages[index]}\n\n` +
            `🤖 ariYa'n bb'z bot 🚩`;
        } else {
          return;
        }

        // Mark as sent only after preparing the content.
        sent.add(key);

        await sendToGroups(api, body, videoUrl, key);

        console.log(`[AutoTimer] Completed: ${key}`);

        if (sent.size > 1000) sent.clear();
      } catch (error) {
        console.log("[AutoTimer] Error:", error.message);
      } finally {
        running = false;
      }
    }, 15000);

    console.log("[AutoTimer] AUTO-ON successfully.");
  }
};
  
