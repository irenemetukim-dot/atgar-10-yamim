/* ===== הגדרות: לעדכן כאן ===== */
const CONFIG = {
  // מספר הוואטסאפ של אירן בפורמט בינלאומי, בלי + ובלי מקפים. למשל: 972501234567
  whatsappNumber: "972542559279",
  // מספר הטלפון להצגה בראש הדף ובתחתית (חובה לפי מחלקת האתיקה של הרבלייף). למשל: 050-1234567
  phoneDisplay: "054-2559279",
  // תאריך פתיחת המחזור הבא. מתעדכן בכל המקומות בדף
  nextCycleDate: "1.12.26",
};

document.documentElement.classList.add("js");

/* תאריך המחזור הבא */
document.querySelectorAll(".js-next-date").forEach((el) => {
  el.textContent = CONFIG.nextCycleDate;
});

/* מספרים כמו "1-4" או "ב-10" לא נשברים בין שורות */
(() => {
  const pattern = /([בלמהו]?-?\d+(?:[.,]\d+)?-\d+(?:[.,]\d+)?|[בלמהו]-\d+(?:[.,]\d+)?)/g;
  const walker = document.createTreeWalker(document.getElementById("main"), NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) {
    const n = walker.currentNode;
    if (n.parentElement.closest("script, style, .nw, .media__ph")) continue;
    pattern.lastIndex = 0;
    if (pattern.test(n.nodeValue)) nodes.push(n);
  }
  nodes.forEach((n) => {
    const frag = document.createDocumentFragment();
    n.nodeValue.split(pattern).forEach((part, i) => {
      if (!part) return;
      if (i % 2 === 1) {
        const s = document.createElement("span");
        s.className = "nw";
        s.textContent = part;
        frag.appendChild(s);
      } else frag.appendChild(document.createTextNode(part));
    });
    n.replaceWith(frag);
  });
})();

/* בועות הצ'אט נכנסות כשהן נראות במסך */
const chat = document.querySelector(".js-chat");
if (chat && "IntersectionObserver" in window) {
  const chatObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          chat.classList.add("is-playing");
          chatObserver.disconnect();
        }
      });
    },
    { threshold: 0.35 }
  );
  chatObserver.observe(chat);
} else if (chat) {
  chat.classList.add("is-playing");
}

/* כפתור קבוע בנייד: מופיע אחרי ההירו, נעלם ליד הטופס */
const sticky = document.querySelector(".sticky-cta");
const hero = document.querySelector(".hero");
const formSection = document.querySelector("#form");
if (sticky && hero && formSection && "IntersectionObserver" in window) {
  let heroVisible = true;
  let formVisible = false;
  const update = () => sticky.classList.toggle("is-visible", !heroVisible && !formVisible);
  new IntersectionObserver(([e]) => { heroVisible = e.isIntersecting; update(); }).observe(hero);
  new IntersectionObserver(([e]) => { formVisible = e.isIntersecting; update(); }, { threshold: 0.05 }).observe(formSection);
}

/* ===== טלפון בראש הדף ובתחתית ===== */
if (CONFIG.phoneDisplay) {
  const tel = "+972" + CONFIG.phoneDisplay.replace(/\D/g, "").replace(/^0/, "");
  document.querySelectorAll(".js-phone").forEach((el) => (el.textContent = CONFIG.phoneDisplay));
  document.querySelectorAll(".js-phone-link").forEach((a) => (a.href = "tel:" + tel));
}

/* ===== חלון הפתיחה של הרבלייף: מופיע בכל כניסה לדף, גם בכניסות חוזרות ===== */
const popup = document.getElementById("hl-popup");
if (popup) {
  let lastFocus = null;
  const closePopup = () => {
    popup.hidden = true;
    document.body.classList.remove("has-popup");
    if (lastFocus) lastFocus.focus({ preventScroll: true });
  };
  lastFocus = document.activeElement;
  popup.hidden = false;
  document.body.classList.add("has-popup");
  popup.querySelector(".hl-popup__close").focus({ preventScroll: true });
  popup.querySelectorAll(".js-popup-close").forEach((b) => b.addEventListener("click", closePopup));
  popup.addEventListener("click", (e) => { if (e.target === popup) closePopup(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !popup.hidden) closePopup(); });
}

/* ===== מדיניות פרטיות והצהרת נגישות בחלון ===== */
[["privacy", ".js-privacy"], ["accessibility", ".js-a11y"]].forEach(([id, sel]) => {
  const dlg = document.getElementById(id);
  if (!dlg || typeof dlg.showModal !== "function") return;
  document.querySelectorAll(sel).forEach((a) =>
    a.addEventListener("click", (e) => { e.preventDefault(); dlg.showModal(); })
  );
  dlg.querySelector(".js-policy-close").addEventListener("click", () => dlg.close());
  dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });
});

/* ===== טופס: שם וטלפון, וממשיכים לוואטסאפ ===== */
const form = document.getElementById("lead-form");
if (form) {
  const fields = form.querySelector(".lead-form__fields");
  const done = form.querySelector(".quiz__done");

  const setError = (input, errEl, hasError) => {
    errEl.hidden = !hasError;
    input.setAttribute("aria-invalid", hasError ? "true" : "false");
    if (hasError) input.setAttribute("aria-describedby", errEl.id);
    else input.removeAttribute("aria-describedby");
  };

  const normalizePhone = (raw) => {
    let digits = raw.replace(/\D/g, "");
    if (digits.startsWith("972")) digits = "0" + digits.slice(3);
    return digits;
  };

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const nameInput = form.elements.name;
    const phoneInput = form.elements.phone;
    const consentInput = form.elements.consent;

    const name = nameInput.value.trim();
    const phone = normalizePhone(phoneInput.value);
    const nameBad = name.length < 2;
    const phoneBad = !/^05\d{8}$/.test(phone);
    const consentBad = !consentInput.checked;

    setError(nameInput, document.getElementById("err-name"), nameBad);
    setError(phoneInput, document.getElementById("err-phone"), phoneBad);
    setError(consentInput, document.getElementById("err-consent"), consentBad);

    if (nameBad) return nameInput.focus();
    if (phoneBad) return phoneInput.focus();
    if (consentBad) return consentInput.focus();

    const message =
      `היי אירן, השארתי פרטים בדף ואני רוצה מקום במחזור הקרוב של אתגר 10 הימים. ` +
      `שמי ${name}, הטלפון שלי ${phone}.`;

    const base = CONFIG.whatsappNumber ? `https://wa.me/${CONFIG.whatsappNumber}` : "https://wa.me/";
    const url = `${base}?text=${encodeURIComponent(message)}`;

    fields.hidden = true;
    done.hidden = false;
    done.querySelector(".js-wa-link").href = url;
    done.focus();

    // פיקסל מטא: אירוע "יצירת קשר" אחד לכל שליחה תקינה של הטופס.
    // זה לא ליד מאומת: עדיין לא ידוע אם ההודעה נשלחה בוואטסאפ.
    // בלי שום פרט מהטופס (שם/טלפון) - רק שם האירוע.
    if (!form.dataset.contactSent && typeof window.fbq === "function") {
      form.dataset.contactSent = "1";
      window.fbq("track", "Contact");
    }

    window.location.href = url;
  });
}