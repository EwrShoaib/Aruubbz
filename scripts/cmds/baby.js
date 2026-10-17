```javascript
const axios = require("axios");
const baseApiUrl = async () => { return "https://noobs-api.top/dipto"; };

module.exports.config = {
  name: "baby",
  aliases: ["baby", "bbe", "babe", "bot", "bby"],
  version: "7.0.0",
  author: "ariYa'n bb'z",
  countDown: 0,
  role: 0,
  description: "baby chatbot",
  category: "chat"
};

const OWNER_NAME = "ariYa'n bb'z";
const OWNER_REPLY = "Amar owner holo 👑 ariYa'n bb'z 🖤✨";

function isOwnerQuery(text) {
  if (!text) return false;
  const t = text.toLowerCase();
  return t.includes("owner ke") || t.includes("malik ke") || t.includes("tor malik") || t.includes("bot er owner") || t.includes("tomar owner") || t.includes("tumar owner") || t.includes("bot er malik");
}

function detectEmotion(text) {
  const m = text.toLowerCase();
  if (m.includes("love") || m.includes("ভালোবাসি") || m.includes("জান")) return "romantic";
  if (m.includes("sad") || m.includes("কষ্ট")) return "sad";
  if (m.includes("happy") || m.includes("খুশি")) return "happy";
  return "normal";
}

module.exports.onStart = async ({ api, event, args }) => {
  const text = args.join(" ");
  if (isOwnerQuery(text)) {
    return api.sendMessage(OWNER_REPLY, event.threadID, event.messageID);
  }
  try {
    const link = (await baseApiUrl()) + "/baby";
    const emotion = detectEmotion(text);
    const res = await axios.get(`${link}?text=${encodeURIComponent(text)}&senderID=${event.senderID}&font=1&emotion=${emotion}`);
    let reply = res.data.reply || "bolo?";
    reply = reply.replace(/dipto/gi, OWNER_NAME).replace(/Dipto/g, OWNER_NAME);
    return api.sendMessage(reply, event.threadID, event.messageID);
  } catch (e) {
    return api.sendMessage(OWNER_REPLY, event.threadID, event.messageID);
  }
};

module.exports.onChat = async ({ api, event }) => {
  if (!event.body) return;
  if (isOwnerQuery(event.body)) {
    return api.sendMessage(OWNER_REPLY, event.threadID, event.messageID);
  }
  const lower = event.body.toLowerCase();
  if (lower.startsWith("baby") || lower.startsWith("bby") || lower.startsWith("bot") || lower.startsWith("jan") || lower.startsWith("babu")) {
    const arr = event.body.replace(/^\S+\s*/, "").trim();
    if (isOwnerQuery(arr) || isOwnerQuery(event.body)) {
      return api.sendMessage(OWNER_REPLY, event.threadID, event.messageID);
    }
    if (!arr) {
      return api.sendMessage("Hmm bolo sona, shunchi... 🖤", event.threadID, event.messageID);
    }
    try {
      const link = await baseApiUrl();
      const emotion = detectEmotion(arr);
      const res = await axios.get(`${link}/baby?text=${encodeURIComponent(arr)}&senderID=${event.senderID}&font=1&emotion=${emotion}`);
      let reply = res.data.reply || "...";
      reply = reply.replace(/dipto/gi, OWNER_NAME).replace(/Dipto/g, OWNER_NAME);
      return api.sendMessage(reply, event.threadID, event.messageID);
    } catch (e) {}
  }
};

module.exports.onReply = async ({ api, event }) => {
  if (!event.body) return;
  if (isOwnerQuery(event.body)) {
    return api.sendMessage(OWNER_REPLY, event.threadID, event.messageID);
  }
  try {
    const link = await baseApiUrl();
    const emotion = detectEmotion(event.body);
    const res = await axios.get(`${link}/baby?text=${encodeURIComponent(event.body)}&senderID=${event.senderID}&font=1&emotion=${emotion}`);
    let reply = res.data.reply || "...";
    reply = reply.replace(/dipto/gi, OWNER_NAME).replace(/Dipto/g, OWNER_NAME);
    return api.sendMessage(reply, event.threadID, event.messageID);
  } catch (e) {}
};
```
