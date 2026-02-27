const langBtn = document.getElementById("langBtn");
const bgMusic = document.getElementById("bgMusic");

const whishCopyBtn = document.getElementById("whishCopyBtn");
const whishMsg = document.getElementById("whishMsg");

const startBtn = document.getElementById("startBtn");
const startScreen = document.getElementById("startScreen");

const envelope = document.getElementById("envelope");
const sealBtn = document.querySelector(".sealBtn");

/* =========================
   START SCREEN
   ========================= */
startBtn?.addEventListener("click", () => {
  document.body.classList.add("started");
  setTimeout(() => {
    if (startScreen) startScreen.style.display = "none";
  }, 800);
});

/* =========================
   OPEN INVITE (2 seconds total)
   - flap opens slowly (2s)
   - envelope fades near end
   - bg + card appear as envelope disappears
   ========================= */
function openInvite() {
  if (!envelope) return;
  if (document.body.classList.contains("opened") || document.body.classList.contains("opening")) return;

  document.body.classList.add("opening");

  // start music
  if (bgMusic && bgMusic.paused) {
    bgMusic.play().catch(() => {});
  }

  // Find the top flap in YOUR current HTML:
  // <div class="flap backTop"></div>
  const topFlap = envelope.querySelector(".flap.backTop");

  // Force correct initial state so it never "appears from nowhere"
  if (topFlap) {
    topFlap.style.opacity = "1";
    topFlap.style.transformOrigin = "50% 0%";
    topFlap.style.backfaceVisibility = "hidden";
    topFlap.style.willChange = "transform";
    // Ensure it starts closed
    topFlap.style.transform = "rotateX(0deg)";
    // Apply the opening transition (2 seconds)
    topFlap.style.transition = "transform 2000ms cubic-bezier(.18,.85,.22,1)";
  }

  // Fade envelope near the end of those 2 seconds
  envelope.style.willChange = "opacity, transform";
  envelope.style.transition = "opacity 450ms ease, transform 450ms ease";

  // Kick the flap animation on next frame
  requestAnimationFrame(() => {
    if (topFlap) topFlap.style.transform = "rotateX(-160deg)";
  });

  // Start showing bg/card while envelope is fading
  // (so the picture appears as the envelope disappears)
  setTimeout(() => {
    document.body.classList.add("opened");
  }, 1450);

  // Fade envelope out near the end
  setTimeout(() => {
    envelope.style.opacity = "0";
    envelope.style.transform = "translateY(-10px) scale(0.985)";
    envelope.style.pointerEvents = "none";
  }, 1550);

  // End at exactly 2 seconds
  setTimeout(() => {
    document.body.classList.remove("opening");
    envelope.style.display = "none";
  }, 2000);
}

/* Trigger ONLY from seal press */
sealBtn?.addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation();
  openInvite();
});

/* Optional accessibility: Enter/Space on envelope opens (remove if you don’t want it) */
envelope?.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") openInvite();
});

/* =========================
   LANGUAGE TOGGLE
   ========================= */
langBtn?.addEventListener("click", () => {
  document.body.classList.toggle("lang-ar");
});

/* =========================
   WHISH COPY
   ========================= */
whishCopyBtn?.addEventListener("click", async () => {
  const textToCopy = whishCopyBtn.dataset.copy;

  try {
    await navigator.clipboard.writeText(textToCopy);

    if (whishMsg) {
      whishMsg.textContent = document.body.classList.contains("lang-ar")
        ? "تم نسخ حساب Whish بنجاح ✓"
        : "Whish account copied successfully ✓";

      whishMsg.animate(
        [
          { opacity: 0, transform: "translateY(6px)" },
          { opacity: 1, transform: "translateY(0px)" }
        ],
        { duration: 400, easing: "ease-out" }
      );
    }
  } catch (err) {
    if (whishMsg) whishMsg.textContent = "Copy failed";
    console.warn(err);
  }
});

/* =========================
   SCRATCH CIRCLES (unchanged)
   ========================= */
function initScratchCircles() {
  const canvases = document.querySelectorAll(".scratchCanvas");
  const finalEl = document.getElementById("scratchFinal");

  canvases.forEach((canvas) => {
    const item = canvas.closest(".scratchItem");
    if (!item) return;

    const threshold = parseFloat(canvas.dataset.threshold || "0.45");
    const cssSize = 140;
    const dpr = window.devicePixelRatio || 1;

    canvas.style.width = cssSize + "px";
    canvas.style.height = cssSize + "px";
    canvas.width = Math.floor(cssSize * dpr);
    canvas.height = Math.floor(cssSize * dpr);

    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    function drawCover() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(dpr, dpr);

      ctx.beginPath();
      ctx.arc(cssSize / 2, cssSize / 2, cssSize / 2, 0, Math.PI * 2);
      ctx.clip();

      const g = ctx.createRadialGradient(
        cssSize * 0.35, cssSize * 0.30, 10,
        cssSize / 2, cssSize / 2, cssSize * 0.75
      );
      g.addColorStop(0.0, "rgba(255,244,214,1)");
      g.addColorStop(0.35, "rgba(214,180,107,1)");
      g.addColorStop(0.70, "rgba(242,230,201,1)");
      g.addColorStop(1.0, "rgba(184,146,61,1)");

      ctx.fillStyle = g;
      ctx.fillRect(0, 0, cssSize, cssSize);
      ctx.restore();
    }

    drawCover();

    let isDown = false;
    let revealed = false;
    const brush = 18;

    function getPos(clientX, clientY) {
      const rect = canvas.getBoundingClientRect();
      return {
        x: (clientX - rect.left) * (canvas.width / rect.width),
        y: (clientY - rect.top) * (canvas.height / rect.height)
      };
    }

    function scratch(x, y) {
      if (revealed) return;
      ctx.save();
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(x, y, brush * dpr, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    function clearedRatio() {
      const img = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let transparent = 0;
      const step = 40;
      for (let i = 3; i < img.length; i += step) {
        if (img[i] === 0) transparent++;
      }
      return transparent / (img.length / step);
    }

    function tryReveal() {
      if (revealed) return;

      if (clearedRatio() >= threshold) {
        revealed = true;
        item.classList.add("done");

        canvas.animate([{ opacity: 1 }, { opacity: 0 }], {
          duration: 350,
          easing: "ease-out",
          fill: "forwards"
        });

        setTimeout(() => ctx.clearRect(0, 0, canvas.width, canvas.height), 360);

        const allDone = document.querySelectorAll(".scratchItem.done").length === 3;
        if (allDone && finalEl) finalEl.classList.remove("hidden");
      }
    }

    canvas.addEventListener("pointerdown", (e) => {
      isDown = true;
      canvas.setPointerCapture?.(e.pointerId);
      const p = getPos(e.clientX, e.clientY);
      scratch(p.x, p.y);
      e.preventDefault();
    });

    canvas.addEventListener("pointermove", (e) => {
      if (!isDown) return;
      const p = getPos(e.clientX, e.clientY);
      scratch(p.x, p.y);
      e.preventDefault();
    });

    canvas.addEventListener("pointerup", () => {
      isDown = false;
      tryReveal();
    });

    canvas.addEventListener("pointercancel", () => {
      isDown = false;
      tryReveal();
    });
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initScratchCircles);
} else {
  initScratchCircles();
}

/* =========================
   GOOGLE SHEET RSVP
   ========================= */

const rsvpForm = document.getElementById("rsvpForm");
const rsvpMsg = document.getElementById("rsvpMsg");

/* 🔴 PASTE YOUR GOOGLE SCRIPT URL HERE */
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxjc6smbl6FjY6HXcXa0B6bfNn0_PUW1Dnek8h0Kuv9DmgWt90GPLP89mvC6P71DWwZ/exec";

rsvpForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("rsvpName").value.trim();
  const status = document.getElementById("rsvpStatus").value;
  const guests = document.getElementById("rsvpGuests").value;
  const note = document.getElementById("rsvpNote").value.trim();

  if (!name || !status) {
    rsvpMsg.textContent = "Please complete required fields.";
    return;
  }

  try {
    await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name,
        status,
        guests,
        note
      })
    });

    rsvpMsg.textContent = "RSVP submitted successfully ✓";
    rsvpForm.reset();

  } catch (err) {
    rsvpMsg.textContent = "Something went wrong.";
    console.error(err);
  }
});