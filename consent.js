/* =====================================================================
   הסכמה לעוגיות + פיקסל מטא
   הפיקסל לא נטען בכלל עד שהגולשת מאשרת "מדידה ופרסום".
   הבחירה נשמרת בדפדפן שלה (עד 12 חודשים) ואפשר לשנות אותה בכל רגע
   דרך "הגדרות עוגיות" בתחתית הדף.
   ===================================================================== */
(function () {
  "use strict";

  var PIXEL_ID = "1677676460613581";
  var KEY = "irene-consent-v1";
  var MAX_AGE = 365 * 24 * 60 * 60 * 1000; // 12 חודשים
  var PRIVACY_URL = "https://irenemetukim-dot.github.io/atgar-10-yamim/privacy.html#cookies";

  var pixelLoaded = false;

  function readChoice() {
    try {
      var v = JSON.parse(localStorage.getItem(KEY));
      if (!v || typeof v.ads !== "boolean" || Date.now() - v.ts > MAX_AGE) return null;
      return v;
    } catch (e) { return null; }
  }

  function saveChoice(ads) {
    try { localStorage.setItem(KEY, JSON.stringify({ ads: ads, ts: Date.now(), v: 1 })); } catch (e) { /* דפדפן חוסם אחסון */ }
  }

  /* קוד הבסיס הרשמי של מטא, עם כיבוי האיסוף האוטומטי (כדי שפרטי הטופס לא יעברו) */
  function loadPixel() {
    if (pixelLoaded) return;
    pixelLoaded = true;
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    window.fbq("set", "autoConfig", false, PIXEL_ID);
    window.fbq("init", PIXEL_ID);
    window.fbq("track", "PageView");
  }

  /* מחיקת עוגיות ומידע של מטא שנשמרו בדפדפן */
  function clearMeta() {
    var host = location.hostname;
    ["_fbp", "_fbc"].forEach(function (name) {
      [host, "." + host, ""].forEach(function (domain) {
        document.cookie = name + "=; Max-Age=0; path=/" + (domain ? "; domain=" + domain : "");
      });
    });
    try {
      ["lastExternalReferrer", "lastExternalReferrerTime", "multiFbc"].forEach(function (k) { localStorage.removeItem(k); });
    } catch (e) { /* אין גישה לאחסון */ }
  }

  function apply(ads) {
    if (ads) { loadPixel(); return; }
    clearMeta();
    if (pixelLoaded) {
      // הפיקסל כבר נטען בביקור הזה: עוצרים אותו וטוענים את הדף מחדש בלעדיו
      try { window.fbq("consent", "revoke"); } catch (e) { /* */ }
      location.reload();
    }
  }

  var stored = readChoice();
  if (stored) apply(stored.ads);

  /* ===== הבאנר ===== */
  function buildBanner() {
    var wrap = document.createElement("div");
    wrap.id = "cc-banner";
    wrap.className = "cc";
    wrap.setAttribute("role", "region");
    wrap.setAttribute("aria-label", "הגדרות עוגיות");
    wrap.hidden = true;
    wrap.innerHTML =
      '<div class="cc__box">' +
        '<p class="cc__text">אני משתמשת בעוגיות ובפיקסל של מטא כדי למדוד את המודעות שלי. הם יופעלו רק אם תאשרי. ' +
        '<a href="' + PRIVACY_URL + '">פרטים במדיניות הפרטיות</a></p>' +
        '<div class="cc__prefs" id="cc-prefs" hidden>' +
          '<label class="cc__opt"><input type="checkbox" checked disabled>' +
            '<span><b>חיוניות</b> (תמיד פעילות): שמירת הבחירה שלך לגבי עוגיות, בדפדפן שלך.</span></label>' +
          '<label class="cc__opt"><input type="checkbox" id="cc-ads">' +
            '<span><b>מדידה ופרסום (מטא)</b>: מדידה של ביקורים בדף ושל מילוי הטופס, כדי לשפר את המודעות שלי. בלי השם והטלפון שלך.</span></label>' +
        '</div>' +
        '<div class="cc__actions">' +
          '<button type="button" class="cc__btn cc__btn--yes" data-cc="accept">אישור</button>' +
          '<button type="button" class="cc__btn cc__btn--no" data-cc="reject">דחייה</button>' +
          '<button type="button" class="cc__btn cc__btn--yes" data-cc="save" hidden>שמירת הבחירה</button>' +
          '<button type="button" class="cc__link" data-cc="prefs" aria-expanded="false" aria-controls="cc-prefs">העדפות</button>' +
        '</div>' +
      '</div>';
    document.body.insertBefore(wrap, document.body.firstChild);

    var prefs = wrap.querySelector("#cc-prefs");
    var ads = wrap.querySelector("#cc-ads");
    var saveBtn = wrap.querySelector('[data-cc="save"]');
    var prefsBtn = wrap.querySelector('[data-cc="prefs"]');

    function showPrefs(open) {
      prefs.hidden = !open;
      saveBtn.hidden = !open;
      prefsBtn.setAttribute("aria-expanded", open ? "true" : "false");
    }
    function close() { wrap.hidden = true; document.body.classList.remove("has-cc"); }
    function decide(value) { saveChoice(value); close(); apply(value); }

    wrap.addEventListener("click", function (e) {
      var b = e.target.closest("[data-cc]");
      if (!b) return;
      var act = b.getAttribute("data-cc");
      if (act === "accept") decide(true);
      else if (act === "reject") decide(false);
      else if (act === "save") decide(ads.checked);
      else if (act === "prefs") showPrefs(prefs.hidden);
    });

    function open(withPrefs) {
      var cur = readChoice();
      ads.checked = !!(cur && cur.ads);
      showPrefs(!!withPrefs);
      wrap.hidden = false;
      document.body.classList.add("has-cc");
    }

    document.querySelectorAll(".js-cookie-settings").forEach(function (el) {
      el.addEventListener("click", function (e) {
        e.preventDefault();
        open(true);
        wrap.querySelector("#cc-ads").focus();
      });
    });

    if (!stored) {
      // מופיע אחרי שחלון הפתיחה של הרבלייף נסגר
      if (document.body.classList.contains("has-popup")) {
        var mo = new MutationObserver(function () {
          if (!document.body.classList.contains("has-popup")) { mo.disconnect(); open(false); }
        });
        mo.observe(document.body, { attributes: true, attributeFilter: ["class"] });
      } else {
        open(false);
      }
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", buildBanner);
  else buildBanner();
})();
