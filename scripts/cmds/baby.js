const axios = require("axios");

const baseApiUrl = async () => "https://noobs-api.top/dipto";

module.exports.config = {
  name: "baby",
  aliases: ["bbe", "babe", "bot", "bby"],
  version: "7.0.1",
  author: "ariYa'n bb'z",
  countDown: 0,
  role: 0,
  description: "Baby chatbot",
  category: "chat"
};

const OWNER_NAME = "ariYa'n bb'z";
const OWNER_REPLY = "Amar owner holo 👑 ariYa'n bb'z 🖤✨";

function isOwnerQuery(text) {
  if (!text) return false;

  const t = text.toLowerCase();

  return [
    "owner ke",
    "malik ke",
    "tor malik",
    "bot er owner",
    "tomar owner",
    "tumar owner",
    "bot er malik"
  ].some(query => t.includes(query));
}

function detectEmotion(text) {
  const m = (text || "").toLowerCase();

  if (m.includes("love") || m.includes("ভালোবাসি") || m.includes("জান")) {
    return "romantic";
  }

  if (m.includes("sad") || m.includes("কষ্ট")) {
    return "sad";
  }

  if (m.includes("happy") || m.includes("খুশি")) {
    return "happy";
  }

  return "normal";
}

async function getReply(text, senderID) {
  const link = await baseApiUrl();
  const emotion = detectEmotion(text);

  const res = await axios.get(`${link}/baby`, {
    params: {
      text,
      senderID,
      font: 1,
      emotion
    },
    timeout: 15000
  });

  let reply = res.data && res.data.reply
    ? res.data.reply
    : "Bolo?";

  reply = reply.replace(/dipto/gi, OWNER_NAME);

  return reply;
}

module.exports.onStart = async ({ api, event, args }) => {
  const text = (args || []).join(" ").trim();

  if (isOwnerQuery(text)) {
    return api.sendMessage(
      OWNER_REPLY,
      event.threadID,
      event.messageID
    );
  }

  try {
    const reply = await getReply(text, event.senderID);

    return api.sendMessage(
      reply,
      event.threadID,
      event.messageID
    );
  } catch (error) {
    console.error("[BABY onStart]", error.message);

    return api.sendMessage(
      "😓 Baby API ekhon kaj korche na, pore abar bolo.",
      event.threadID,
      event.messageID
    );
  }
};

module.exports.onChat = async ({ api, event }) => {
  if (!event.body) return;

  const body = event.body.trim();

  if (isOwnerQuery(body)) {
    return api.sendMessage(
      OWNER_REPLY,
      event.threadID,
      event.messageID
    );
  }

  if (!/^(baby|bby|bot|jan|babu)\b/i.test(body)) {
    return;
  }

  const text = body.replace(/^\S+\s*/i, "").trim();

  if (!text) {
    return api.sendMessage(
      "Hmm bolo sona, shunchi... 🖤",
      event.threadID,
      event.messageID
    );
  }

  if (isOwnerQuery(text)) {
    return api.sendMessage(
      OWNER_REPLY,
      event.threadID,
      event.messageID
    );
  }

  try {
    const reply = await getReply(text, event.senderID);

    return api.sendMessage(
      reply,
      event.threadID,
      event.messageID
    );
  } catch (error) {
    console.error("[BABY onChat]", error.message);
  }
};

module.exports.onReply = async ({ api, event }) => {
  if (!event.body) return;

  const text = event.body.trim();

  if (isOwnerQuery(text)) {
    return api.sendMessage(
      OWNER_REPLY,
      event.threadID,
      event.messageID
    );
  }

  try {
    const reply = await getReply(text, event.senderID);

    return api.sendMessage(
      reply,
      event.threadID,
      event.messageID
    );
  } catch (error) {
    console.error("[BABY onReply]", error.message);
  }
};
