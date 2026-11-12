/* ===== הגדרות: לעדכן כאן ===== */
const CONFIG = {
  // מספר הוואטסאפ של אירן בפורמט בינלאומי, בלי + ובלי מקפים. למשל: 972501234567
  whatsappNumber: "",
  // תאריך פתיחת המחזור הבא. מתעדכן בכל המקומות בדף
  nextCycleDate: "17.11.26",
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

/* ===== שאלון בשלבים ===== */
const form = document.getElementById("quiz");
if (form) {
  const steps = [...form.querySelectorAll(".quiz__step")];
  const total = steps.length;
  const backBtn = form.querySelector(".quiz__back");
  const stepNum = form.querySelector(".js-step-num");
  const fill = form.querySelector(".quiz__fill");
  const counter = form.querySelector(".quiz__count");
  const done = form.querySelector(".quiz__done");
  const top = form.querySelector(".quiz__top");
  const bar = form.querySelector(".quiz__bar");
  let current = 0;

  const show = (index, focus = true) => {
    current = index;
    steps.forEach((s, i) => {
      s.hidden = i !== index;
      s.classList.toggle("is-active", i === index);
    });
    stepNum.textContent = index + 1;
    fill.style.width = ((index + 1) / total) * 100 + "%";
    backBtn.hidden = index === 0;
    if (focus) {
      const target = steps[index].querySelector("input:checked") || steps[index].querySelector("input");
      if (target) target.focus({ preventScroll: true });
    }
  };

  // לחיצה או נגיעה בתשובה מעבירה לשאלה הבאה. במקלדת: חיצים לבחירה, Enter להמשך
  let pointerUsed = false;
  form.addEventListener("pointerdown", () => { pointerUsed = true; });
  form.addEventListener("keydown", () => { pointerUsed = false; });

  steps.forEach((step, i) => {
    step.querySelectorAll('input[type="radio"]').forEach((radio) => {
      radio.addEventListener("click", () => {
        if (pointerUsed && i < total - 1) setTimeout(() => show(i + 1), 220);
      });
      // במקלדת: Enter מאשר את הבחירה וממשיך
      radio.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          radio.checked = true;
          if (i < total - 1) show(i + 1);
        }
      });
    });
  });

  backBtn.addEventListener("click", () => {
    if (current > 0) show(current - 1);
  });

  const setError = (input, errEl, hasError) => {
    errEl.hidden = !hasError;
    if (input) {
      input.setAttribute("aria-invalid", hasError ? "true" : "false");
      if (hasError) input.setAttribute("aria-describedby", errEl.id);
      else input.removeAttribute("aria-describedby");
    }
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

    // אם דילגה על שאלה, חוזרים אליה
    const missing = ["goal", "hard", "decide", "when"].findIndex((n) => !form.elements[n].value);
    if (missing !== -1) return show(missing);

    const goal = form.elements.goal.value;
    const hard = form.elements.hard.value;
    const message =
      `היי אירן, מילאתי את השאלון באתר ואני רוצה מקום במחזור הקרוב של אתגר 10 הימים 🙂 ` +
      `שמי ${name}. המטרה שלי: לרדת ${goal}. הכי קשה לי: ${hard}.`;

    const base = CONFIG.whatsappNumber ? `https://wa.me/${CONFIG.whatsappNumber}` : "https://wa.me/";
    const url = `${base}?text=${encodeURIComponent(message)}`;

    steps.forEach((s) => (s.hidden = true));
    top.hidden = true;
    bar.hidden = true;
    counter.hidden = true;
    done.hidden = false;
    done.querySelector(".js-wa-link").href = url;
    done.focus();

    window.location.href = url;
  });

  show(0, false);
}
