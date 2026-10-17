
const axios = require("axios");

const BASE_API = "https://noobs-api.top/dipto/baby";
const OWNER = "ariYa'n bb'z 🚩🫀";
const PREFIX_WORDS = /\b(bby|baby|babe|bbe|bot)\b/i;
const OWNER_WORDS = /\b(owner|malik|মালিক|owner ke|owner কে)\b/i;

module.exports.config = {
    name: "bby",
    aliases: ["baby", "bbe", "babe", "ridh"],
    version: "7.0.0",
    author: "AriYa'n",
    countDown: 0,
    role: 0,
    description: "A unique, fast and friendly AI baby chat bot",
    category: "chat",
    guide: {
        en:
            "{pn} [message]\n" +
            "{pn} teach [message] - [reply1, reply2]\n" +
            "{pn} teach react [message] - [reaction]\n" +
            "{pn} remove [message]\n" +
            "{pn} rm [message] - [index]\n" +
            "{pn} edit [message] - [new reply]\n" +
            "{pn} msg [message]\n" +
            "{pn} list\n" +
            "{pn} list all [limit]"
    }
};

const apiRequest = async (params = {}) => {
    const response = await axios.get(BASE_API, {
        params,
        timeout: 15000,
        headers: {
            "User-Agent": "AriYan-BbyBot/7.0"
        }
    });

    return response.data;
};

const send = (api, event, text) =>
    api.sendMessage(
        String(text || "🥺 কোনো উত্তর পাওয়া যায়নি, আবার চেষ্টা করো!"),
        event.threadID,
        event.messageID
    );

const getOwnerReply = (text) => {
    if (
        OWNER_WORDS.test(text) &&
        /(who|ke|কেউ|কী|ki|name|নাম|tomar|তোমার|your|is|bolo|বলো)/i.test(text)
    ) {
        return `👑 আমার Owner হলো ${OWNER} 💗`;
    }

    if (/who\s+made\s+you|ke\s+banaiছে|কে বানিয়েছে|কে বানাইছে|who created you/i.test(text)) {
        return `🥰 আমাকে তৈরি ও পরিচালনা করে ${OWNER} 🚩🫀`;
    }

    return null;
};

const getChatReply = async (text, senderID) => {
    const ownerReply = getOwnerReply(text);
    if (ownerReply) return ownerReply;

    const data = await apiRequest({
        text: text,
        senderID: senderID
    });

    return (
        data?.message ||
        data?.reply ||
        data?.response ||
        data?.answer ||
        data?.data?.message ||
        data?.data?.reply ||
        null
    );
};

module.exports.onStart = async ({ api, event, args, usersData }) => {
    const raw = args.join(" ").trim();
    const text = raw.toLowerCase();
    const uid = event.senderID;

    try {
        if (!raw) {
            const greetings = [
                "হ্যাঁ জানু, বলো 🥹💗",
                "বলো AriYa'n-এর Baby 😽🫶",
                "হুম জান, আমি শুনছি! 🌸",
                "কী হয়েছে বাবু? 🥺💕",
                "Bby online আছে! 🚩🫀"
            ];

            return send(
                api,
                event,
                greetings[Math.floor(Math.random() * greetings.length)]
            );
        }

        // OWNER
        const ownerReply = getOwnerReply(raw);
        if (ownerReply && !/^(teach|remove|rm|edit|msg|list)\b/i.test(raw)) {
            return send(api, event, ownerReply);
        }

        // REMOVE
        if (args[0].toLowerCase() === "remove") {
            const target = raw.slice(6).trim();
            if (!target) {
                return send(api, event, "❌ ব্যবহার: bby remove [message]");
            }

            const data = await apiRequest({
                remove: target,
                senderID: uid
            });

            return send(api, event, data?.message || "❌ Message remove করা যায়নি।");
        }

        // REMOVE BY INDEX
        if (args[0].toLowerCase() === "rm") {
            const match = raw.match(/^rm\s+(.+?)\s*-\s*(\d+)\s*$/i);

            if (!match) {
                return send(api, event, "❌ ব্যবহার: bby rm [message] - [index]");
            }

            const data = await apiRequest({
                remove: match[1],
                index: match[2],
                senderID: uid
            });

            return send(api, event, data?.message || "❌ Remove করা যায়নি।");
        }

        // LIST
        if (args[0].toLowerCase() === "list") {
            const data = await apiRequest({ list: "all" });

            if (args[1]?.toLowerCase() === "all") {
                const limit = Math.min(
                    Math.max(parseInt(args[2], 10) || 30, 1),
                    100
                );

                const teacherList = data?.teacher?.teacherList;

                if (!Array.isArray(teacherList) || !teacherList.length) {
                    return send(api, event, "📭 কোনো teacher list পাওয়া যায়নি।");
                }

                const lines = await Promise.all(
                    teacherList.slice(0, limit).map(async (item, index) => {
                        const id = Object.keys(item || {})[0];
                        if (!id) return `${index + 1}. Unknown: 0`;

                        let name = id;
                        try {
                            name = await usersData.getName(id) || id;
                        } catch (_) {}

                        return `${index + 1}. ${name}: ${item[id]}`;
                    })
                );

                return send(
                    api,
                    event,
                    `👑 BABY TEACHER LIST 🚩\n\n${lines.join("\n")}`
                );
            }

            return send(
                api,
                event,
                `💗 BABY STATS\n\n📚 Total Teach: ${
                    data?.length ?? "Unknown"
                }\n💬 Total Response: ${
                    data?.responseLength ?? "Unknown"
                }`
            );
        }

        // SHOW A SAVED RESPONSE
        if (args[0].toLowerCase() === "msg") {
            const target = raw.slice(4).trim();
            if (!target) {
                return send(api, event, "❌ ব্যবহার: bby msg [message]");
            }

            const data = await apiRequest({ list: target });
            const result = data?.data ?? data?.message ?? "কোনো response পাওয়া যায়নি।";

            return send(
                api,
                event,
                `💌 Message: ${target}\n\n${typeof result === "object" ? JSON.stringify(result) : result}`
            );
        }

        // EDIT
        if (args[0].toLowerCase() === "edit") {
            const match = raw.match(/^edit\s+(.+?)\s*-\s*(.+)$/i);

            if (!match || match[2].trim().length < 2) {
                return send(
                    api,
                    event,
                    "❌ ব্যবহার: bby edit [old message] - [new reply]"
                );
            }

            const data = await apiRequest({
                edit: match[1].trim(),
                replace: match[2].trim(),
                senderID: uid
            });

            return send(api, event, data?.message || "❌ Edit করা যায়নি।");
        }

        // TEACH / TEACH REACT
        if (args[0].toLowerCase() === "teach") {
            const isReact = args[1]?.toLowerCase() === "react";
            const isAmar = args[1]?.toLowerCase() === "amar";
            const match = raw.match(/^teach\s+(?:(?:react|amar)\s+)?(.+?)\s*-\s*(.+)$/i);

            if (!match || match[2].trim().length < 2) {
                return send(
                    api,
                    event,
                    "❌ ব্যবহার:\nbby teach [message] - [reply]\n" +
                    "bby teach react [message] - [reaction]"
                );
            }

            const params = {
                teach: match[1].trim(),
                reply: match[2].trim(),
                senderID: uid,
                threadID: event.threadID
            };

            if (isReact) params.react = "true";
            if (isAmar) params.key = "intro";

            const data = await apiRequest(params);

            return send(
                api,
                event,
                `✅ BABY TEACH UPDATED 💗\n\n${
                    data?.message || "API থেকে নিশ্চিত ফলাফল পাওয়া যায়নি।"
                }`
            );
        }

        // NORMAL CHAT
        const answer = await getChatReply(raw, uid);

        return send(
            api,
            event,
            answer || "🥺 বাবু, এই কথার উত্তর এখন দিতে পারছি না। অন্যভাবে জিজ্ঞেস করো!"
        );
    } catch (error) {
        console.error("[BBY onStart]", error?.response?.data || error.message);

        return send(
            api,
            event,
            error.code === "ECONNABORTED"
                ? "⏳ Baby API-তে দেরি হচ্ছে, একটু পরে চেষ্টা করো!"
                : "💔 Baby API-তে সমস্যা হচ্ছে। কিছুক্ষণ পর আবার চেষ্টা করো!"
        );
    }
};

// AUTO CHAT: responds when someone addresses bby/baby/bot.
module.exports.onChat = async ({ api, event }) => {
    const body = event.body?.trim();
    if (!body || event.senderID === api.getCurrentUserID?.()) return;

    // Avoid replying to every unrelated group message.
    if (!PREFIX_WORDS.test(body) && !getOwnerReply(body)) return;

    try {
        const answer = await getChatReply(body, event.senderID);

        if (answer) {
            return api.sendMessage(
                String(answer),
                event.threadID,
                event.messageID
            );
        }

        return;
    } catch (error) {
        console.error("[BBY onChat]", error?.response?.data || error.message);
        // Keep group chat clean during temporary API failures.
    }
};
        
