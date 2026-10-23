// التبويبات + المكافآت + المهام + الأصدقاء + الترتيب. يعمل مع الخادم داخل تيليجرام، وبوضع تجريبي محلي خارجه.
(function () {
  const BOT = "bestwin9_bot";   // اسم بوتك بدون @
  const ADS_BLOCK_ID = "";           // رقم وحدة Adsgram (فارغ = إعلان تجريبي)
  const BL = (window.BL = window.BL || {});
  BL.plv = 1; try { BL.cueId = localStorage.cue; } catch (e) {} BL.cueId = BL.cueId || "classic";
  const $ = (id) => document.getElementById(id), A = () => BL.Audio;
  const T = () => window.Telegram && Telegram.WebApp;
  const inTG = () => !!(T() && T().initData);
  const tgUser = () => (T() && T().initDataUnsafe && T().initDataUnsafe.user) || null;
  const set = (id, v) => { const e = $(id); if (e) e.textContent = v; };
  const tier = (e) => e < 1100 ? "🥉 برونزي" : e < 1300 ? "🥈 فضي" : e < 1500 ? "🥇 ذهبي" : e < 1800 ? "💎 بلاتيني" : "👑 ماسي";
  let tt;
  function toast(m) { const t = $("toast"); t.textContent = m; t.classList.add("show"); clearTimeout(tt); tt = setTimeout(() => t.classList.remove("show"), 3000); }
  BL.toast = toast;
  window.addEventListener("error", (e) => toast("⚠️ " + e.message));

  /* ----- وضع محلي (خارج تيليجرام): نفس منطق الخادم ----- */
  const day = () => new Date().toISOString().slice(0, 10);
  const MIS = [{ id: "ads3", name: "شاهد 3 إعلانات", k: "ad", goal: 3, pts: 30, xp: 20 }, { id: "ads10", name: "شاهد 10 إعلانات", k: "ad", goal: 10, pts: 80, xp: 50 },
    { id: "games3", name: "العب 3 مباريات", k: "g", goal: 3, pts: 20, xp: 15 }, { id: "win1", name: "اربح مباراة", k: "w", goal: 1, pts: 25, xp: 20 }];
  const S0 = { points: 0, xp: 0, games: 0, wins: 0, streak: 0, daily_t: 0, chest_t: 0, lv_paid: 1, m_day: "", mg: 0, mw: 0, mc: 0, ad_n: 0, ad_day: "", name: "" };
  const ld = () => { try { return { ...S0, ...JSON.parse(localStorage.bl || "{}") }; } catch (e) { return { ...S0 }; } };
  const sv = (s) => { try { localStorage.bl = JSON.stringify(s); } catch (e) {} };
  const lvl = (xp) => { const L = 1 + Math.floor(Math.pow(xp / 50, 1 / 2.1)), a = Math.round(50 * Math.pow(L - 1, 2.1)), c = Math.round(50 * Math.pow(L, 2.1)); return { level: L, xp, xp_cur: xp - a, xp_need: c - a }; };
  const roll = (s) => { if (s.m_day !== day()) { s.m_day = day(); s.mg = 0; s.mw = 0; s.mc = 0; } };
  const mis = (s) => { const cur = s.m_day === day(), p = { ad: s.ad_day === day() ? s.ad_n : 0, g: cur ? s.mg : 0, w: cur ? s.mw : 0 }, c = cur ? s.mc : 0;
    return MIS.map((m, i) => ({ id: m.id, name: m.name, goal: m.goal, prog: Math.min(p[m.k], m.goal), pts: m.pts, xp: m.xp, claimed: !!((c >> i) & 1), perm: false })); };
  const settle = (s) => { const L = lvl(s.xp).level; let b = 0; for (let l = s.lv_paid + 1; l <= L; l++) b += 25 * l; if (L > s.lv_paid) { s.points += b; s.lv_paid = L; sv(s); } return b; };
  const meOf = (s) => { const b = settle(s); return { name: s.name || (tgUser() && tgUser().first_name) || "لاعب", points: s.points, rank: 1, games: s.games, wins: s.wins, streak: s.streak, refs: 0, elo: 1000,
    daily_in: Math.max(0, 86400 - Math.floor((Date.now() - s.daily_t) / 1000)), chest_in: Math.max(0, 86400 - Math.floor((Date.now() - s.chest_t) / 1000)), lvl_bonus: b, ...lvl(s.xp), missions: mis(s) }; };
  const WX = { easy: 10, normal: 25, hard: 50 }, WP = { easy: 5, normal: 15, hard: 30 };
  const LOCAL = {
    "/api/me": () => meOf(ld()),
    "/api/result": (b) => { const s = ld(); roll(s); const win = b.result === "win", gain = win ? WP[b.level] || 15 : 5;
      s.points += gain; s.xp += 10 + (win ? WX[b.level] || 25 : 0); s.games++; s.mg++; if (win) { s.wins++; s.mw++; } sv(s); return { ...meOf(s), gain }; },
    "/api/daily": () => { const s = ld(), now = Date.now(), ok = now - s.daily_t >= 864e5; let gain = 0;
      if (ok) { s.streak = s.daily_t > 0 && now - s.daily_t <= 1728e5 ? s.streak + 1 : 1; gain = 25 + 5 * Math.min(s.streak, 7); s.points += gain; s.xp += 20; s.daily_t = now; sv(s); }
      return { ...meOf(s), ok, gain }; },
    "/api/chest": () => { const s = ld(), now = Date.now(), ok = now - s.chest_t >= 864e5; let pts = 0, xp = 0;
      if (ok) { const r = Math.random(); if (r < .65) pts = 20 + Math.floor(Math.random() * 41); else if (r < .92) { pts = 10; xp = 20 + Math.floor(Math.random() * 31); } else pts = 150; s.points += pts; s.xp += xp; s.chest_t = now; sv(s); }
      return { ...meOf(s), ok, pts, xp }; },
    "/api/ad": () => { const s = ld(), n = s.ad_day === day() ? s.ad_n : 0, ok = n < 20; if (ok) { s.points += 10; s.xp += 3; s.ad_n = n + 1; s.ad_day = day(); sv(s); } return { ...meOf(s), ok, gain: ok ? 10 : 0 }; },
    "/api/mission": (b) => { const s = ld(); roll(s); const ms = mis(s), i = ms.findIndex((m) => m.id === b.id); let ok = false;
      if (i >= 0 && ms[i].prog >= ms[i].goal && !ms[i].claimed) { s.points += ms[i].pts; s.xp += ms[i].xp; s.mc |= 1 << i; ok = true; sv(s); } return { ...meOf(s), ok }; },
  };
  const post = (url, body) => inTG()
    ? fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ initData: T().initData, ...body }) }).then((r) => r.json()).catch(() => null)
    : Promise.resolve(LOCAL[url] ? LOCAL[url](body || {}) : null);

  /* ----- التبويبات ----- */
  const tabs = document.querySelectorAll("#tabs button");
  function openTab(n) {
    document.querySelectorAll(".screen").forEach((s) => s.classList.toggle("hidden", s.id !== "sc-" + n));
    tabs.forEach((b) => b.classList.toggle("on", b.dataset.tab === n));
    BL.paused = n !== "play";
    if (n === "play") setTimeout(() => window.dispatchEvent(new Event("resize")), 50);
    if (n === "top") loadTop(document.querySelector(".seg .on").dataset.by); else if (n !== "play") loadMe();
  }
  tabs.forEach((b) => (b.onclick = () => { A().ui(); openTab(b.dataset.tab); }));

  /* ----- عرض البيانات ----- */
  let lvInit = false;
  async function loadMe() {
    const d = await post("/api/me", {}); if (!d || d.error) return;
    if (lvInit && d.level > BL.plv) {   // ترقية: عصي جديدة + مكافأة مستوى
      const nw = BL.CUES.filter((c) => c.lv > BL.plv && c.lv <= d.level).map((c) => c.n);
      A().level(); toast("🎉 المستوى " + d.level + (d.lvl_bonus ? " • +" + d.lvl_bonus + " نقطة" : "") + (nw.length ? " • عصا جديدة: " + nw.join("، ") : ""));
    } else if (d.lvl_bonus) toast("🎁 مكافأة المستويات: +" + d.lvl_bonus + " نقطة");
    lvInit = true; BL.pname = d.name; BL.plv = d.level;
    set("myPoints", "⭐ " + d.points); set("pName", d.name); set("avatar", (d.name || "؟").trim().charAt(0).toUpperCase()); set("pLv", "المستوى " + d.level + " • " + tier(d.elo));
    set("stPoints", d.points); set("stRank", "#" + d.rank); set("stGames", d.games); set("stWins", d.wins); set("stStreak", "🔥 " + d.streak); set("refCount", d.refs); set("meName", "👤 " + d.name);
    set("stElo", d.elo); set("stTier", tier(d.elo));
    set("stLevel", "⭐ المستوى " + d.level); $("xpFill").style.width = Math.min(100, d.xp_cur / d.xp_need * 100) + "%"; set("xpTxt", d.xp_cur + " / " + d.xp_need + " XP");
    const ready = d.daily_in <= 0, s = Math.min(d.streak, 7);
    $("dayGrid").innerHTML = [1, 2, 3, 4, 5, 6, 7].map((i) => `<div class="day${i <= s ? " done" : ""}${ready && i === Math.min(s + 1, 7) ? " next" : ""}"><small>يوم ${i}</small><b>+${25 + 5 * i}</b></div>`).join("");
    $("btnDaily").disabled = !ready;
    $("btnDaily").textContent = ready ? "🎁 سجّل حضورك واستلم جائزتك" : "⏳ المكافأة التالية بعد " + Math.ceil(d.daily_in / 3600) + " ساعة";
    $("btnChest").disabled = d.chest_in > 0;
    $("btnChest").textContent = d.chest_in > 0 ? "📦 الصندوق التالي بعد " + Math.ceil(d.chest_in / 3600) + " ساعة" : "📦 افتح صندوق الهدايا اليومي";
    set("modeNote", inTG() ? "" : "🧪 وضع تجريبي: بياناتك محفوظة على هذا الجهاز فقط. داخل تيليجرام تُحفظ على الخادم، ويعمل الأونلاين والترتيب العالمي.");
    renderCues(); renderMissions(d.missions);
  }
  async function loadTop(by) {
    let rows = inTG() ? await fetch("/api/top?by=" + by).then((r) => r.json()).catch(() => []) : [];
    if (!inTG()) { const d = meOf(ld()); rows = [{ name: d.name, points: d.points, wins: d.wins, elo: d.elo }]; }
    $("topList").innerHTML = rows.map((r, i) => `<div>${["🥇", "🥈", "🥉"][i] || i + 1 + "."} ${r.name} — ${r[by]}${by === "elo" ? " " + tier(r.elo) : ""}</div>`).join("") || "لا يوجد لاعبون بعد";
  }
  document.querySelectorAll(".seg button").forEach((b) => (b.onclick = () => { A().ui(); document.querySelectorAll(".seg button").forEach((x) => x.classList.toggle("on", x === b)); loadTop(b.dataset.by); }));

  function renderCues() {
    const g = $("cueGrid"); g.innerHTML = "";
    BL.CUES.forEach((c) => {
      const ok = BL.plv >= c.lv, b = document.createElement("button");
      b.className = "cue" + (BL.cueId === c.id ? " on" : "") + (ok ? "" : " lock");
      b.innerHTML = `<i style="background:linear-gradient(90deg,${c.a},${c.b},${c.c})"></i>${c.n}<small class="rar r${c.r}">${BL.RARITY[c.r]}</small><small>${ok ? "" : "🔒 المستوى " + c.lv}</small>`;
      b.onclick = () => { if (!ok) return toast("🔒 تُفتح عند المستوى " + c.lv); A().ui(); BL.cueId = c.id; try { localStorage.cue = c.id; } catch (e) {} renderCues(); toast("تم اختيار العصا " + c.n); };
      g.appendChild(b);
    });
  }
  function renderMissions(ms) {
    const g = $("missions"); g.innerHTML = "";
    (ms || []).forEach((m) => {
      const done = m.prog >= m.goal, e = document.createElement("div"); e.className = "mission";
      e.innerHTML = `<div><b>${m.name}</b><small>${m.prog}/${m.goal} • +${m.pts} نقطة • +${m.xp} XP${m.perm ? " • مرة واحدة" : ""}</small><div class="bar"><i style="width:${m.prog / m.goal * 100}%"></i></div></div>`;
      const b = document.createElement("button"); b.disabled = m.claimed;
      b.textContent = m.claimed ? "✅" : m.id === "join" ? "📢 تحقق" : done ? "استلم" : m.id.startsWith("ads") ? "📺 شاهد" : m.id.startsWith("ref") ? "👥 ادعُ" : "🎮 العب";
      b.onclick = async () => {
        if (done || m.id === "join") {
          const r = await post("/api/mission", { id: m.id });
          if (r && r.ok) { A().coin(); toast("🎉 +" + m.pts + " نقطة"); } else if (m.id === "join") { toast("اشترك في القناة أولا ثم اضغط تحقق"); if (m.url) T() ? T().openTelegramLink(m.url) : window.open(m.url, "_blank"); }
          loadMe();
        } else if (m.id.startsWith("ads")) runAd(); else if (m.id.startsWith("ref")) openTab("friends"); else openTab("play");
      };
      e.appendChild(b); g.appendChild(e);
    });
  }

  /* ----- المكافآت: تسجيل يومي، صندوق، إعلانات ----- */
  $("btnDaily").onclick = async () => { const d = await post("/api/daily", {}); if (!d) return; if (d.ok) A().coin(); toast(d.ok ? `🎁 +${d.gain} نقطة — سلسلة ${d.streak} 🔥` : "عُد لاحقا للمكافأة التالية"); loadMe(); };
  $("btnChest").onclick = async () => { const d = await post("/api/chest", {}); if (!d) return; if (d.ok) { A().coin(); toast("📦 حصلت على " + (d.pts ? "+" + d.pts + " نقطة " : "") + (d.xp ? "+" + d.xp + " XP" : "") + (d.pts >= 150 ? " 🎰 جائزة كبرى!" : "")); } else toast("عُد لاحقا"); loadMe(); };
  function demoAd() {
    return new Promise((res) => {
      const bx = $("adbox"), b = $("adDone"); let n = 5; bx.classList.remove("hidden"); b.disabled = true;
      const tick = () => { if (n > 0) { b.textContent = "⏳ " + n--; setTimeout(tick, 1000); } else { b.textContent = "استلم المكافأة ✅"; b.disabled = false; } }; tick();
      b.onclick = () => { bx.classList.add("hidden"); res(true); }; $("adClose").onclick = () => { bx.classList.add("hidden"); res(false); };
    });
  }
  async function runAd() {
    let ok;
    if (ADS_BLOCK_ID && window.Adsgram) { try { const r = await Adsgram.init({ blockId: ADS_BLOCK_ID }).show(); ok = !(r && r.done === false); } catch (e) { return toast("لا يوجد إعلان متاح الآن"); } }
    else ok = await demoAd();
    if (!ok) return;
    const d = await post("/api/ad", {}); if (!d) return;
    if (d.ok) A().coin(); toast(d.ok ? `📺 +${d.gain} نقطة` : "انتظر قليلا أو بلغت حد اليوم"); loadMe();
  }
  $("btnAd").onclick = runAd;

  /* ----- الأصدقاء ----- */
  const link = () => `https://t.me/${BOT}?start=ref_${tgUser() ? tgUser().id : 0}`;
  $("btnShare").onclick = () => { const u = "https://t.me/share/url?url=" + encodeURIComponent(link()) + "&text=" + encodeURIComponent("🎱 تعال العب البلياردو معي واجمع النقاط!"); T() ? T().openTelegramLink(u) : window.open(u, "_blank"); };
  $("btnCopy").onclick = () => { (navigator.clipboard ? navigator.clipboard.writeText(link()) : Promise.reject()).then(() => toast("تم نسخ الرابط ✅"), () => toast(link())); };
  $("btnGuide").onclick = () => { BL.guide = BL.guide === false; $("btnGuide").textContent = BL.guide === false ? "🎯 خط التصويب: متوقف" : "🎯 خط التصويب: يعمل"; };

  /* ----- اللعبة ----- */
  let hl = 0;
  BL.haptic = (t) => { const n = Date.now(); if (T() && T().HapticFeedback && n - hl > 60) { hl = n; T().HapticFeedback.impactOccurred(t); } };
  window.addEventListener("game:end", async (e) => {
    if (e.detail && (e.detail.online || !e.detail.cpu)) return;   // النقاط ضد الكمبيوتر فقط (الأونلاين يحتسبه الخادم)
    const win = e.detail && e.detail.winner === 0;
    win ? A().win() : A().lose();
    const d = await post("/api/result", { result: win ? "win" : "lose", level: e.detail && e.detail.level });
    if (d && d.gain) toast((win ? "🏆 فوز! +" : "+") + d.gain + " نقطة");
    loadMe();
  });
  window.addEventListener("net:over", (e) => {   // نتيجة مباراة أونلاين من الخادم
    const m = e.detail, mine = BL.game.myIdx, win = m.winner === mine;
    win ? A().win() : A().lose(); toast((win ? "🏆 فزت! " : "خسرت. ") + "القوة " + (m.d[mine] > 0 ? "+" : "") + m.d[mine] + " → " + m.elo[mine]); loadMe();
  });
  window.addEventListener("load", () => { if (T()) { T().ready(); T().expand(); } loadMe(); });
  loadMe();
})();
