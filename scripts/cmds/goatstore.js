// code from goatstore
// api: https://store.agi.bd
const fs = require("fs");
const path = require("path");
const axios = require("axios");
module.exports = {
  config: {
    name: "goatstore",
    aliases: ["gs", "cmdstore", "commandstore"],
    version: "20.0.0",
    author: "Mirai Team",
    countDown: 3,
    role: 2,
    shortDescription: "GoatBot Store — Search, AutoUpdate, Install, Upload, AutoSync",
    longDescription: "Browse, install, upload, and autosync GoatBot commands and events from the MiraiStore API. Auto-detects your cmds/events folder naming. The bare-menu shows only the daily-use commands — every subcommand lives here in the guide.",
    category: "system",
    guide: {
      en:
        "{pn} — Menu / Notifications\n" +
        "{pn} <id | file name> — Search commands only\n" +
        "{pn} -a <name> — All files by an author\n" +
        "{pn} -c <goat|mirai|other|category> — Browse a framework or category\n" +
        "{pn} -e <name> — Search events\n" +
        "{pn} -e install <id> — Install as event\n" +
        "{pn} -e upload <fileName> — Upload an event file\n" +
        "{pn} n — Today's updates\n" +
        "{pn} list [page] — Command list\n" +
        "{pn} list event [page] — Event list\n" +
        "{pn} install <id> — Install a command\n" +
        "{pn} like <id> — Like\n" +
        "{pn} trend — Trending\n" +
        "{pn} upload <fileName> — Upload a command file\n" +
        "{pn} sync — Manual sync\n" +
        "{pn} dirs — Show & re-detect cmds/events locations\n" +
        "{pn} pr add <uid> — Add premium user (admin, or reply to a msg)\n" +
        "{pn} pr remove <uid> — Remove premium user (admin)\n" +
        "{pn} pr upload <cmdname> — Mark a command premium (admin)\n" +
        "{pn} pr delete <cmdname> — Unmark a command (admin)\n" +
        "{pn} pr author add|remove <authorname> — Premium by author (admin)\n" +
        "{pn} pr list — Show premium state (admin)\n" +
        "Reply \"in\" to a single result — Install\n" +
        "Reply \"in <id>\" to a list result — Install"
    },
    autoSync: true
  }
};

const API_URL_JSON = "https://raw.githubusercontent.com/abdullahrx07/X-api/main/MaRiA/baseApiUrl.json";
const HARD_FALLBACK_BASE = "https://store.agi.bd";
function envOverride() {
  const v = process.env.STORE_API_BASE;
  return v && v.startsWith("http") ? v.replace(/\/$/, "") : null;
}
let _apiBase = null;
let _apiBaseFetchedAt = 0;
const API_BASE_TTL_MS = 5 * 60 * 1000;

async function getApiBase() {
  const override = envOverride();
  if (override) return override;
  const now = Date.now();
  if (_apiBase && now - _apiBaseFetchedAt < API_BASE_TTL_MS) return _apiBase;
  try {
    const res = await axios.get(API_URL_JSON, { timeout: 8000 });
    const store = res.data && (res.data.store || res.data.Store);
    if (store && typeof store === "string" && store.startsWith("http")) {
      _apiBase = store.replace(/\/$/, "");
      _apiBaseFetchedAt = now;
      return _apiBase;
    }
  } catch (err) {
    console.error("[goatstore] failed to fetch store API URL:", err.message);
  }
  if (!_apiBase) _apiBase = HARD_FALLBACK_BASE;
  _apiBaseFetchedAt = now;
  return _apiBase;
}

async function storeGet(pathSuffix, config) {
  const primaryBase = await getApiBase();
  try {
    return await axios.get(`${primaryBase}${pathSuffix}`, config);
  } catch (err) {
    if (primaryBase === HARD_FALLBACK_BASE) throw err;
    console.error(`[goatstore] primary API failed (${primaryBase}), retrying via backup: ${HARD_FALLBACK_BASE}`);
    return await axios.get(`${HARD_FALLBACK_BASE}${pathSuffix}`, config);
  }
}

async function storePost(pathSuffix, data, config) {
  const primaryBase = await getApiBase();
  try {
    return await axios.post(`${primaryBase}${pathSuffix}`, data, config);
  } catch (err) {
    if (primaryBase === HARD_FALLBACK_BASE) throw err;
    console.error(`[goatstore] primary API failed (${primaryBase}), retrying via backup: ${HARD_FALLBACK_BASE}`);
    return await axios.post(`${HARD_FALLBACK_BASE}${pathSuffix}`, data, config);
  }
}

const premium = (function () {

  let state = { adminUid: null, premiumUsers: [], premiumCommands: [], premiumAuthors: [] };
  let _lastRefresh = 0;
  const REFRESH_INTERVAL = 1000 * 60 * 5;
  let _refreshing = null;

  function normUid(uid) { return String(uid == null ? "" : uid).trim(); }
  function normName(s) { return String(s == null ? "" : s).trim().toLowerCase(); }

  function refresh(force = false) {
    if (!force && Date.now() - _lastRefresh < REFRESH_INTERVAL) return Promise.resolve(state);
    if (_refreshing) return _refreshing;
    _refreshing = (async () => {
      try {
        const res = await storeGet(`/miraistore/premium`);
        if (res.data && !res.data.error) {
          state = {
            adminUid: res.data.adminUid || state.adminUid || null,
            premiumUsers: res.data.premiumUsers || [],
            premiumCommands: res.data.premiumCommands || [],
            premiumAuthors: res.data.premiumAuthors || []
          };
          _lastRefresh = Date.now();
        }
      } catch (_) {
      } finally {
        _refreshing = null;
      }
      return state;
    })();
    return _refreshing;
  }

  function isAdmin(senderId) { return !!state.adminUid && normUid(senderId) === state.adminUid; }

  function isPremiumUser(senderId) { return state.premiumUsers.some(u => normUid(u) === normUid(senderId)); }

  function isPremiumAuthor(author) { return state.premiumAuthors.some(a => normName(a) === normName(author)); }

  function isPremiumCmd(cmdName, author) {
    if (cmdName) {
      if (state.premiumCommands.some(c => normName(c) === normName(cmdName))) return true;
    }
    return isPremiumAuthor(author);
  }

  function isPremiumViewer(senderId) { return isAdmin(senderId) || isPremiumUser(senderId); }

  function isFiltered(cmdName, author, senderId) { return isPremiumCmd(cmdName, author) && !isPremiumViewer(senderId); }
  function canExecutePremium(senderId) { return isAdmin(senderId) || isPremiumUser(senderId); }
  function isAdminViewer(senderId) { return isAdmin(senderId); }

  async function mutate(action, value, senderId) {
    try {
      const res = await storePost(`/miraistore/premium`, { senderId, action, value });
      const data = res.data || {};
      if (Array.isArray(data.premiumUsers)) {
        state = {
          adminUid: data.adminUid || state.adminUid || null,
          premiumUsers: data.premiumUsers,
          premiumCommands: data.premiumCommands || [],
          premiumAuthors: data.premiumAuthors || []
        };
        _lastRefresh = Date.now();
      }
      if (data.error) return { ok: false, error: data.error };
      return { ok: data.ok !== false };
    } catch (e) {
      return { ok: false, error: e.response?.data?.error || "Premium API error." };
    }
  }

  async function addPremiumUser(uid, senderId) {
    const u = normUid(uid);
    if (!u) return { ok: false, error: "UID required" };
    if (isAdmin(u)) return { ok: false, error: "Admin is already premium by default" };
    return mutate("addUser", u, senderId);
  }

  async function removePremiumUser(uid, senderId) {
    const u = normUid(uid);
    if (!u) return { ok: false, error: "UID required" };
    return mutate("removeUser", u, senderId);
  }

  async function addPremiumCmd(cmdName, senderId) {
    const n = normName(cmdName);
    if (!n) return { ok: false, error: "Command name required" };
    return mutate("addCommand", n, senderId);
  }

  async function removePremiumCmd(cmdName, senderId) {
    const n = normName(cmdName);
    if (!n) return { ok: false, error: "Command name required" };
    return mutate("removeCommand", n, senderId);
  }

  async function addPremiumAuthor(author, senderId) {
    const a = normName(author);
    if (!a) return { ok: false, error: "Author name required" };
    return mutate("addAuthor", a, senderId);
  }

  async function removePremiumAuthor(author, senderId) {
    const a = normName(author);
    if (!a) return { ok: false, error: "Author name required" };
    return mutate("removeAuthor", a, senderId);
  }

  function listPremium() {
    return {
      adminUid: state.adminUid,
      premiumUsers: [...state.premiumUsers],
      premiumCommands: [...state.premiumCommands],
      premiumAuthors: [...state.premiumAuthors]
    };
  }

  refresh(true);

  return {
    isAdmin,
    isPremiumUser,
    isPremiumAuthor,
    isPremiumCmd,
    isPremiumViewer,
    canExecutePremium,
    isFiltered,
    isAdminViewer,
    addPremiumUser,
    removePremiumUser,
    addPremiumCmd,
    removePremiumCmd,
    addPremiumAuthor,
    removePremiumAuthor,
    listPremium,
    refresh
  };
})();


async function checkAbuseGuard(senderID) {
  try {
    const res = await storeGet(`/miraistore/ratelimit/status`, {
      params: { clientFp: senderID },
      timeout: 6000
    });
    return res.data || { blocked: false };
  } catch (_) {
    return { blocked: false };
  }
}

function formatDuration(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h}h ${m}m ${s}s`;
}

const userSeenNoti = new Map();
const AUTOSYNC_CACHE_PATH = path.join(process.cwd(), "goatstore_sync_cache.json");
const DIR_CACHE_PATH = path.join(process.cwd(), "goatstore_dircache.json");

let _updateCheckCache = null;
const UPDATE_CHECK_INTERVAL = 1000 * 60 * 30;

const MAX_EDITS_PER_MESSAGE = 5;

function getPrefix(threadData) {
  try {
    if (threadData?.data?.prefix) return threadData.data.prefix;
    if (global.GoatBot?.config?.prefix) return global.GoatBot.config.prefix;
  } catch (_) {}
  return "!";
}

function loadSyncCache() {
  try { return JSON.parse(fs.readFileSync(AUTOSYNC_CACHE_PATH, "utf8")); }
  catch { return {}; }
}

function saveSyncCache(cache) {
  try { fs.writeFileSync(AUTOSYNC_CACHE_PATH, JSON.stringify(cache, null, 2)); }
  catch (_) {}
}

let _autoupdateInFlight = false;

async function stampUploadCode(code) {
  const apiBase = await getApiBase();
  return `// code from goatstore\n// api: ${apiBase}\n${code}`;
}

function hashContent(content) {
  let h = 0;
  for (let i = 0; i < content.length; i++) h = (h * 31 + content.charCodeAt(i)) | 0;
  return h.toString(16);
}

function parseVer(v) {
  return String(v).split(".").map(n => parseInt(n) || 0);
}

function cmpVer(a, b) {
  const pa = parseVer(a), pb = parseVer(b);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d !== 0) return d;
  }
  return 0;
}

function extractConfigBlock(src) {
  const idx = src.search(/\bconfig\s*[:=]\s*\{/);
  if (idx === -1) return src;
  const braceStart = src.indexOf("{", idx);
  if (braceStart === -1) return src;
  let depth = 0;
  for (let i = braceStart; i < src.length; i++) {
    if (src[i] === "{") depth++;
    else if (src[i] === "}") {
      depth--;
      if (depth === 0) return src.slice(braceStart, i + 1);
    }
  }
  return src.slice(braceStart);
}

function detectFramework(code) {
  const configBlock = extractConfigBlock(code);

  const hasCredits    = /\bcredits\s*:/.test(configBlock);
  const hasPermission = /\bhasPerm(?:i)?ssion\s*[:(]/i.test(configBlock);
  if (hasCredits && hasPermission) return "mirai";

  const hasAuthor = /\bauthor\s*:/.test(configBlock);
  const hasRole   = /\brole\s*:/.test(configBlock);
  if (hasAuthor && hasRole) return "goat";

  const isGoatStructure =
    /module\.exports\s*=\s*\{/.test(code) &&
    /onStart\s*[:(]|onChat\s*[:(]|onLoad\s*[:(]/.test(code);
  if (isGoatStructure) return "goat";

  const isMiraiStructure =
    /module\.exports\.config\s*=/.test(code) ||
    /module\.exports\.run\s*=/.test(code);
  if (isMiraiStructure) return "mirai";

  return "other";
}


const EVENTS_NAME_PATTERNS = ["events", "event"];
const SCAN_SKIP_DIRS = new Set(["node_modules", ".git", ".cache", ".github", "dist", "build"]);

function loadDirCache() {
  try { return JSON.parse(fs.readFileSync(DIR_CACHE_PATH, "utf8")); }
  catch { return {}; }
}

function saveDirCache(cache) {
  try { fs.writeFileSync(DIR_CACHE_PATH, JSON.stringify(cache, null, 2)); }
  catch (_) {}
}

let _dirCache = loadDirCache();

function scanForDir(startDir, namePatterns, maxDepth = 2) {
  const queue = [{ dir: startDir, depth: 0 }];
  while (queue.length) {
    const { dir, depth } = queue.shift();
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (_) { continue; }
    for (const ent of entries) {
      if (!ent.isDirectory()) continue;
      if (SCAN_SKIP_DIRS.has(ent.name)) continue;
      if (ent.name.startsWith(".")) continue;
      const lower = ent.name.toLowerCase();
      const full = path.join(dir, ent.name);
      if (namePatterns.includes(lower)) return full;
      if (depth < maxDepth) queue.push({ dir: full, depth: depth + 1 });
    }
  }
  return null;
}

function getCmdsDir(forceRescan = false) {
  if (!forceRescan && _dirCache.cmdsDir && fs.existsSync(_dirCache.cmdsDir)) return _dirCache.cmdsDir;
  const dir = __dirname;
  _dirCache.cmdsDir = dir;
  saveDirCache(_dirCache);
  return dir;
}

function getEventsDir(forceRescan = false) {
  if (!forceRescan && _dirCache.eventsDir && fs.existsSync(_dirCache.eventsDir)) return _dirCache.eventsDir;
  const cmdsDir = getCmdsDir(forceRescan);
  const parent = path.dirname(cmdsDir);
  const roots = [...new Set([parent, path.dirname(parent), process.cwd()])];
  let dir = null;
  for (const root of roots) {
    dir = scanForDir(root, EVENTS_NAME_PATTERNS, 3);
    if (dir) break;
  }
  if (!dir) dir = path.join(parent, "events");
  _dirCache.eventsDir = dir;
  saveDirCache(_dirCache);
  return dir;
}

function findLocalFile(fileName, kind) {
  const dirs = kind === "event" ? [getEventsDir()] : [getCmdsDir(), getEventsDir()];
  for (const dir of dirs) {
    const direct = path.join(dir, fileName);
    if (fs.existsSync(direct)) return { filePath: direct, dirs };
    const withExt = direct.endsWith(".js") ? null : direct + ".js";
    if (withExt && fs.existsSync(withExt)) return { filePath: withExt, dirs };
  }
  return { filePath: null, dirs };
}

function relDir(p) {
  const rel = path.relative(process.cwd(), p);
  return rel || ".";
}

function fileNotFoundMsg(fileName, dirs, prefix) {
  return (
    `❌ File not found: "${fileName}"\nSearched in:\n` +
    dirs.map(d => `• ${relDir(d)}`).join("\n") +
    `\n💡 Wrong location? Check with: ${prefix}gs dirs`
  );
}

async function checkSelfUpdate() {
  const now = Date.now();
  if (_updateCheckCache && (now - _updateCheckCache.checkedAt) < UPDATE_CHECK_INTERVAL)
    return _updateCheckCache.result;
  try {
    const res = await storeGet(`/miraistore/search?q=goatstore&limit=10&framework=goat&kind=command`);
    const cmds = Array.isArray(res.data?.commands) ? res.data.commands : [];
    const match =
      cmds.find(c => c.name?.toLowerCase() === "goatstore" && c.author === module.exports.config.author) ||
      cmds.find(c => c.name?.toLowerCase() === "goatstore");
    if (!match) { _updateCheckCache = { checkedAt: now, result: null }; return null; }
    const current = module.exports.config.version;
    const latest = match.version || "N/A";
    const result = {
      hasUpdate: cmpVer(latest, current) > 0,
      currentVersion: current,
      latestVersion: latest,
      latestId: match.id,
      description: match.description || match.changelog || ""
    };
    _updateCheckCache = { checkedAt: now, result };
    return result;
  } catch (_) { return null; }
}

async function getTodayUpdates(senderID = null) {
  try {
    const res = await storeGet(`/miraistore/list?limit=50&framework=goat&clientFp=${encodeURIComponent(senderID || "")}`);
    const today = new Date().toDateString();
    return (res.data.commands || [])
      .filter(cmd => new Date(cmd.uploadDate).toDateString() === today)
      .filter(cmd => premium.isPremiumViewer(senderID) || !premium.isPremiumCmd(cmd.name, cmd.author));
  } catch (_) { return []; }
}

async function getTrending(limit = 5) {
  const parse = d => Array.isArray(d) ? d : (Array.isArray(d?.commands) ? d.commands : null);
  try {
    const res = await storeGet(`/miraistore/trending?limit=${limit}`);
    const list = parse(res.data);
    if (list) return list.slice(0, limit);
  } catch (_) {}
  return null;
}

// ── Developer avatar sync ──────────────────────────────────────────────────────
// A bot that has goatstore.js installed publishes its OWN account profile
// picture as its developer avatar. GoatBot's FCA API exposes the picture in
// the getUserInfo() result (thumbSrc / profileUrl / imageSrc, depending on
// FCA version), so we read it there and POST it to /miraistore/profile. The
// GET first means a restart with an unchanged avatar doesn't re-send it.
async function fetchBotAvatar(api) {
  let botId = null;
  try { botId = api.getCurrentUserID(); } catch (_) {}
  if (!botId && global.GoatBot?.botID) botId = global.GoatBot.botID;
  if (!botId) return null;

  let info = null;
  try {
    const res = await api.getUserInfo(botId);
    info = res && (res[botId] || res[String(botId)]) ? (res[botId] || res[String(botId)]) : res;
  } catch (_) { return null; }
  if (!info) return null;

  const url =
    info.thumbSrc ||
    info.profileUrl ||
    info.profilePictureUrl ||
    info.imageSrc ||
    info.image ||
    info.avatar ||
    (info.profilePicture && (info.profilePicture.uri || info.profilePicture.url)) ||
    (info.thumbSrcBig) ||
    null;
  return typeof url === "string" && /^https?:\/\//i.test(url) ? url : null;
}

async function reportBotAvatar(api, { force = false } = {}) {
  const author = module.exports.config.author;
  if (!author) return;
  try {
    const avatarUrl = await fetchBotAvatar(api);
    if (!avatarUrl) return;

    if (!force) {
      try {
        const cur = await storeGet(`/miraistore/profile?author=${encodeURIComponent(author)}`);
        if (cur.data && cur.data.avatarUrl === avatarUrl) return;
      } catch (_) {}
    }

    await storePost(`/miraistore/profile`, { author, avatarUrl, clientFp: `avatar:${author}` });
    console.log(`[goatstore] developer avatar reported for "${author}"`);
  } catch (err) {
    console.error("[goatstore] avatar report failed:", err.response?.data?.error || err.message);
  }
}

async function runAutoSync() {
  const folders = [
    { dir: getCmdsDir(), kind: "command" },
    { dir: getEventsDir(), kind: "event" }
  ].filter(f => fs.existsSync(f.dir));

  if (!folders.length) return;

  const cache = loadSyncCache();

  // The store caps rewrites at 2 per bot per rolling minute. Sync at that
  // pace instead of hammering the API: after two rewrites, pause for the
  // rest of the minute before continuing. New entries aren't counted here
  // (the server only charges the rewrite path).
  let rewritesThisMinute = 0;
  const paceRewrites = async (isRewrite) => {
    if (!isRewrite) return;
    rewritesThisMinute++;
    if (rewritesThisMinute >= 2) {
      await new Promise(r => setTimeout(r, 60 * 1000));
      rewritesThisMinute = 0;
    }
  };

  for (const { dir, kind } of folders) {
    const files = fs.readdirSync(dir).filter(f => f.endsWith(".js"));
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const cacheKey = `${kind}:${file}`;
      let content;
      try { content = fs.readFileSync(fullPath, "utf8"); } catch (_) { continue; }

      const hash = hashContent(content);
      if (cache[cacheKey] === hash) continue;

      try { new Function(content); } catch (_) { continue; }
      const fw = detectFramework(content);
      if (fw !== "goat") {
        console.log(`[goatstore-sync] Skipped ${file}: detected as "${fw}" (only GoatBot files are synced).`);
        continue;
      }

      try {
        const author = content.match(/author\s*:\s*["'`](.*?)["'`]/)?.[1]
                    || content.match(/credits\s*:\s*["'`](.*?)["'`]/)?.[1]
                             
