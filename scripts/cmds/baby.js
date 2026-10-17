// code from goatstore
// api: https://store.agi.bd
const axios = require('axios');

const baseApiUrl = async () => {
    return "https://noobs-api.top/dipto";
};

module.exports.config = {
    name: "baby",
    aliases: ["baby", "bbe", "babe", "bot chan"],
    version: "7.0.0",
    author: "ariYa'n bbz",
    countDown: 0,
    role: 0,
    description: "Human-like emotional chatbot (Happy, Sad, Funny, Romantic)",
    category: "chat",
    guide: {
        en: "{pn} [anyMessage] OR\nteach [YourMessage] - [Reply1], [Reply2]... OR\nteach react [YourMessage] - [react1], [react2]... OR\nremove [YourMessage] OR\nrm [YourMessage] - [indexNumber] OR\nmsg [YourMessage] OR\nlist OR\nall OR\nedit [YourMessage] - [NewMessage]"
    }
};

// ইউজার মেসেজ অনুযায়ী ইমোশন/মুড নির্ধারণ করার হেল্পার ফাংশন
function detectEmotion(text) {
    const message = text.toLowerCase();

    if (message.includes("ভালোবাসি") || message.includes("love") || message.includes("জান") || message.includes("পাগল") || message.includes("উম্মাহ")) {
        return "romantic";
    } else if (message.includes("খারাপ") || message.includes("কষ্ট") || message.includes("sad") || message.includes("কান্না") || message.includes("একলা")) {
        return "sad";
    } else if (message.includes("ডিপ্রেশন") || message.includes("মরে যাব") || message.includes("ধুর") || message.includes("ভালো লাগে না")) {
        return "depression";
    } else if (message.includes("হাহা") || message.includes("lol") || message.includes("মজা") || message.includes("funny") || message.includes("হাসি")) {
        return "funny";
    } else if (message.includes("হ্যাপি") || message.includes("happy") || message.includes("খুশি") || message.includes("সুন্দর")) {
        return "happy";
    }
    return "normal";
}

module.exports.onStart = async ({ api, event, args, usersData }) => {
    const link = `${await baseApiUrl()}/baby`;
    const dipto = args.join(" ").toLowerCase();
    const uid = event.senderID;
    let command, comd, final;

    try {
        if (!args[0]) {
            const ran = [
                "হুম বলো সোনা, শুনছি... 🖤",
                "কি হলো? মন খারাপ নাকি? কথা বলো! 🥺",
                "হেই! আমি তো তোমার অপেক্ষাতেই ছিলাম ✨",
                "বলো Boss, আজকে তোমার মুড কেমন? 😌"
            ];
            return api.sendMessage(ran[Math.floor(Math.random() * ran.length)], event.threadID, event.messageID);
        }

        if (args[0] === 'remove') {
            const fina = dipto.replace("remove ", "");
            const dat = (await axios.get(`${link}?remove=${fina}&senderID=${uid}`)).data.message;
            return api.sendMessage(dat, event.threadID, event.messageID);
        }

        if (args[0] === 'rm' && dipto.includes('-')) {
            const [fi, f] = dipto.replace("rm ", "").split(/\s*-\s*/);
            const da = (await axios.get(`${link}?remove=${fi}&index=${f}`)).data.message;
            return api.sendMessage(da, event.threadID, event.messageID);
        }

        if (args[0] === 'list') {
            if (args[1] === 'all') {
                const data = (await axios.get(`${link}?list=all`)).data;
                const limit = parseInt(args[2]) || 100;
                const limited = data?.teacher?.teacherList?.slice(0, limit) || [];
                const teachers = await Promise.all(limited.map(async (item) => {
                    const number = Object.keys(item)[0];
                    const value = item[number];
                    const name = await usersData.getName(number).catch(() => number) || "Not found";
                    return { name, value };
                }));
                teachers.sort((a, b) => b.value - a.value);
                const output = teachers.map((t, i) => `${i + 1}/ ${t.name}: ${t.value}`).join('\n');
                return api.sendMessage(`Total Teach = ${data.length}\n👑 | List of Teachers of baby\n${output}`, event.threadID, event.messageID);
            } else {
                const d = (await axios.get(`${link}?list=all`)).data;
                return api.sendMessage(`❇️ | Total Teach = ${d.length || "api off"}\n♻️ | Total Response = ${d.responseLength || "api off"}`, event.threadID, event.messageID);
            }
        }

        if (args[0] === 'msg') {
            const fuk = dipto.replace("msg ", "");
            const d = (await axios.get(`${link}?list=${fuk}`)).data.data;
            return api.sendMessage(`Message ${fuk} = ${d}`, event.threadID, event.messageID);
        }

        if (args[0] === 'edit') {
            const command = dipto.split(/\s*-\s*/)[1];
            if (!command || command.length < 2) return api.sendMessage('❌ | Invalid format! Use edit [YourMessage] - [NewReply]', event.threadID, event.messageID);
            const dA = (await axios.get(`${link}?edit=${args[1]}&replace=${command}&senderID=${uid}`)).data.message;
            return api.sendMessage(`changed ${dA}`, event.threadID, event.messageID);
        }

        if (args[0] === 'teach' && args[1] !== 'amar' && args[1] !== 'react') {
            [comd, command] = dipto.split(/\s*-\s*/);
            final = comd.replace("teach ", "");
            if (!command || command.length < 2) return api.sendMessage('❌ | Invalid format!', event.threadID, event.messageID);
            const re = await axios.get(`${link}?teach=${final}&reply=${command}&senderID=${uid}&threadID=${event.threadID}`);
            const tex = re.data.message;
            const teacher = (await usersData.get(re.data.teacher))?.name || "Unknown";
            return api.sendMessage(`✅ Replies added ${tex}\nTeacher: ${teacher}\nTeachs: ${re.data.teachs}`, event.threadID, event.messageID);
        }

        if (args[0] === 'teach' && args[1] === 'amar') {
            [comd, command] = dipto.split(/\s*-\s*/);
            final = comd.replace("teach ", "");
            if (!command || command.length < 2) return api.sendMessage('❌ | Invalid format!', event.threadID, event.messageID);
            const tex = (await axios.get(`${link}?teach=${final}&senderID=${uid}&reply=${command}&key=intro`)).data.message;
            return api.sendMessage(`✅ Replies added ${tex}`, event.threadID, event.messageID);
        }

        if (args[0] === 'teach' && args[1] === 'react') {
            [comd, command] = dipto.split(/\s*-\s*/);
            final = comd.replace("teach react ", "");
            if (!command || command.length < 2) return api.sendMessage('❌ | Invalid format!', event.threadID, event.messageID);
            const tex = (await axios.get(`${link}?teach=${final}&react=${command}`)).data.message;
            return api.sendMessage(`✅ Replies added ${tex}`, event.threadID, event.messageID);
        }

        if (dipto.includes('amar name ki') || dipto.includes('amr nam ki') || dipto.includes('amar nam ki') || dipto.includes('amr name ki') || dipto.includes('whats my name')) {
            const data = (await axios.get(`${link}?text=amar name ki&senderID=${uid}&key=intro`)).data.reply;
            return api.sendMessage(data, event.threadID, event.messageID);
        }

        // ইমোশন ডিটেক্ট করে API রিকোয়েস্টে পাঠানো
        const emotion = detectEmotion(dipto);
        const d = (await axios.get(`${link}?text=${encodeURIComponent(dipto)}&senderID=${uid}&font=1&emotion=${emotion}`)).data.reply;

        api.sendMessage(d, event.threadID, (error, info) => {
            if (info && global.GoatBot) {
                global.GoatBot.onReply.set(info.messageID, {
                    commandName: this.config.name,
                    type: "reply",
                    messageID: info.messageID,
                    author: event.senderID,
                    d,
                    apiUrl: link
                });
            }
        }, event.messageID);

    } catch (e) {
        console.error(e);
        api.sendMessage("Check console for error", event.threadID, event.messageID);
    }
};

module.exports.onReply = async ({ api, event, Reply }) => {
    try {
        if (event.type === "message_reply") {
            const link = await baseApiUrl();
            const text = event.body?.toLowerCase() || "";
            const emotion = detectEmotion(text);

            const a = (await axios.get(`${link}/baby?text=${encodeURIComponent(text)}&senderID=${event.senderID}&font=1&emotion=${emotion}`)).data.reply;
            await api.sendMessage(a, event.threadID, (error, info) => {
                if (info && global.GoatBot) {
                    global.GoatBot.onReply.set(info.messageID, {
                        commandName: this.config.name,
                        type: "reply",
                        messageID: info.messageID,
                        author: event.senderID,
                        a
                    });
                }
            }, event.messageID);
        }
    } catch (err) {
        return api.sendMessage(`Error: ${err.message}`, event.threadID, event.messageID);
    }
};

module.exports.onChat = async ({ api, event }) => {
    try {
        if (!event.body) return;
        const body = event.body.toLowerCase();

        if (body.startsWith("baby") || body.startsWith("bby") || body.startsWith("bot") || body.startsWith("jan") || body.startsWith("babu") || body.startsWith("janu")) {
            const arr = body.replace(/^\S+\s*/, "").trim();

            // অনুভূতি অনুযায়ী ক্যাটাগরি করা র্যান্ডম রিপ্লাই
            const emotionalReplies = {
                romantic: [
                    "〆 জানু, তুমি ডাকলে আর আমি না এসে পারি? 🥰",
                    "〆 সবসময় তোমার পাশেই তো আছি সোনা! 🖤✨",
                    "〆 চোখ বন্ধ করলেও তোমাকেই দেখি, বলো কি বলবে? 😏❤️"
                ],
                sad: [
                    "〆 মন খারাপ কোরো না প্লিজ, আমি তো আছি তোমার পাশে... 🥺",
                    "〆 কি হয়েছে বলবে? একা একা কষ্ট পেয়ো না 🖤",
                    "〆 কষ্টগুলো আমাকে দিয়ে দাও, তুমি শুধু হাসো! 🥀"
                ],
                funny: [
                    "〆 ওরে বাবারে! হাসতে হাসতে তো পেট ব্যথা হয়ে গেল! 😂🔥",
                    "〆 আরে ভাই ভাই! এত মজা কোথায় পাও? 🤣",
                    "〆 দাঁড়াও দাঁড়াও, তোমার ফানি কথা শুনে তো আমার সিস্টেম হ্যাং হয়ে গেছে! 🤪"
                ],
                happy: [
                    "〆 তোমার খুশি দেখে আমারও মন ভালো হয়ে গেল! ✨🥰",
                    "〆 আজকের দিনটা সত্যিই দারুণ, তাই না? 🥳💫",
                    "〆 সবসময় এমন হাসিখুশি থেকো! 👑💛"
                ],
                depression: [
                    "〆 শোনো, অন্ধকার যত গভীর হয়, আলো তত কাছে আসে। একটু ধৈর্য ধরো... 💪🖤",
                    "〆 জীবনটা অনেক সুন্দর, এভাবে ভেঙে পড়ো না। আমি আছি তো কথা বলার জন্য। 🫂",
                    "〆 টেনশন নিও না, সব ঠিক হয়ে যাবে ইনশাআল্লাহ। ❤️"
                ],
                default: [
                    "〆 𝐇𝐮𝐦𝐦 𝐛𝐨𝐥𝐨, 𝐬𝐡𝐮𝐧𝐜𝐡𝐢… 𝐎𝐦𝐢 𝐚𝐜𝐡𝐢! 🖤",
                    "〆 𝐀𝐫𝐞 𝐒𝐢𝐫, 𝐛𝐨𝐥𝐞𝐧… 𝐎𝐦𝐢 𝐤𝐢 𝐤𝐨𝐫𝐭𝐞 𝐩𝐚𝐫𝐢? 😌",
                    "〆 𝐇𝐮𝐦𝐦 𝐁𝐨𝐬𝐬, 𝐝𝐚𝐤𝐥𝐞𝐧 𝐤𝐞𝐧? 𝐎𝐦𝐢 𝐭𝐨 𝐡𝐚𝐳𝐢𝐫! 😎",
                    "〆 𝐎𝐦𝐢 𝐨𝐧𝐥𝐢𝐧𝐞, 𝐛𝐨𝐫𝐢𝐧𝐠𝐧𝐞𝐬𝐬 𝐨𝐟𝐟𝐥𝐢𝐧𝐞! 😂🔥"
                ]
            };

            // যদি শুধু কাস্টম নাম দিয়ে ডাকে
            if (!arr) {
                const allDefault = emotionalReplies.default;
                const replyText = allDefault[Math.floor(Math.random() * allDefault.length)];
                return api.sendMessage(replyText, event.threadID, (error, info) => {
                    if (info && global.GoatBot) {
                        global.GoatBot.onReply.set(info.messageID, {
                            commandName: this.config.name,
                            type: "reply",
                            messageID: info.messageID,
                            author: event.senderID
                        });
                    }
                }, event.messageID);
            }

            // যদি নামের সাথে অন্য কিছু লেখে
            const link = await baseApiUrl();
            const emotion = detectEmotion(arr);
            const res = await axios.get(`${link}/baby?text=${encodeURIComponent(arr)}&senderID=${event.senderID}&font=1&emotion=${emotion}`);
            const a = res.data.reply;

            await api.sendMessage(a, event.threadID, (error, info) => {
                if (info && global.GoatBot) {
                    global.GoatBot.onReply.set(info.messageID, {
                        commandName: this.config.name,
                        type: "reply",
                        messageID: info.messageID,
                        author: event.senderID,
                        a
                    });
                }
            }, event.messageID);
        }
    } catch (err) {
        console.error(err);
    }
};
      
