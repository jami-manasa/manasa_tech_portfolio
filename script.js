const sections = [...document.querySelectorAll(".section")];
const busMarker = document.querySelector(".bus-marker");
const heroScene = document.querySelector(".hero-scene");
const railLinks = [...document.querySelectorAll(".rail-link")];
const welcomeGuide = document.querySelector(".welcome-guide");
const startRideButton = document.querySelector(".start-ride");
const welcomeAudioSrc = "assets/manasa-welcome.mp3";
const tourStops = ["summary", "skills", "experience", "projects", "certifications", "education", "contact"]
  .map((id) => document.getElementById(id))
  .filter(Boolean);
let welcomePlayed = false;
let autoRideActive = false;
let autoRideTimeout = null;

const moveBus = () => {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollable > 0 ? window.scrollY / scrollable : 0;
  const trackHeight = window.innerHeight - 160;
  const offset = progress * Math.max(trackHeight, 0);

  if (busMarker) {
    busMarker.style.transform = `translateY(${offset}px)`;
  }
};

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("section-active");

        railLinks.forEach((link) => {
          const href = link.getAttribute("href");
          link.classList.toggle("is-active", href === `#${entry.target.id}`);
        });
      }
    });
  },
  {
    threshold: 0.18,
    rootMargin: "0px 0px -8% 0px",
  }
);

sections.forEach((section) => revealObserver.observe(section));

const sliderGroups = new Map();

const activateSlide = (sliderName, targetId) => {
  const slider = sliderGroups.get(sliderName);
  if (!slider) {
    return;
  }

  const nextIndex = slider.panels.findIndex((panel) => panel.id === targetId);
  if (nextIndex === -1) {
    return;
  }

  slider.index = nextIndex;
  slider.buttons.forEach((item, index) => item.classList.toggle("is-active", index === nextIndex));
  slider.panels.forEach((panel, index) => panel.classList.toggle("is-active", index === nextIndex));

  if (slider.count) {
    const current = String(nextIndex + 1).padStart(2, "0");
    const total = String(slider.panels.length).padStart(2, "0");
    slider.count.textContent = `${current} / ${total}`;
  }
};

document.querySelectorAll(".slide-tabs").forEach((tabGroup) => {
  const sliderName = tabGroup.dataset.slider;
  const buttons = [...tabGroup.querySelectorAll(".slide-tab")];
  const stage = tabGroup.nextElementSibling;
  const stagePanels = stage && stage.nextElementSibling?.matches?.(".slide-stage")
    ? stage.nextElementSibling
    : stage?.matches?.(".slide-stage")
      ? stage
      : null;
  const panels = stagePanels ? [...stagePanels.querySelectorAll(".slide-panel")] : [];
  const count = document.querySelector(`[data-count-for="${sliderName}"]`);

  sliderGroups.set(sliderName, {
    buttons,
    panels,
    count,
    index: buttons.findIndex((button) => button.classList.contains("is-active")),
  });

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      activateSlide(sliderName, button.dataset.target);
    });
  });

  tabGroup.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight"].includes(event.key)) {
      return;
    }

    const slider = sliderGroups.get(sliderName);
    if (!slider || !slider.panels.length) {
      return;
    }

    event.preventDefault();
    const delta = event.key === "ArrowRight" ? 1 : -1;
    const nextIndex = (slider.index + delta + slider.panels.length) % slider.panels.length;
    activateSlide(sliderName, slider.panels[nextIndex].id);
    slider.buttons[nextIndex].focus();
  });
});

document.querySelectorAll("[data-prev-for]").forEach((button) => {
  button.addEventListener("click", () => {
    const slider = sliderGroups.get(button.dataset.prevFor);
    if (!slider || !slider.panels.length) {
      return;
    }

    const nextIndex = (slider.index - 1 + slider.panels.length) % slider.panels.length;
    activateSlide(button.dataset.prevFor, slider.panels[nextIndex].id);
  });
});

document.querySelectorAll("[data-next-for]").forEach((button) => {
  button.addEventListener("click", () => {
    const slider = sliderGroups.get(button.dataset.nextFor);
    if (!slider || !slider.panels.length) {
      return;
    }

    const nextIndex = (slider.index + 1) % slider.panels.length;
    activateSlide(button.dataset.nextFor, slider.panels[nextIndex].id);
  });
});

sliderGroups.forEach((slider, sliderName) => {
  if (slider.buttons[slider.index]) {
    activateSlide(sliderName, slider.buttons[slider.index].dataset.target);
  }
});

const speakWelcomeFallback = () => {
  if (!("speechSynthesis" in window) || welcomePlayed) {
    return;
  }

  const message = new SpeechSynthesisUtterance(
    "Hello and welcome aboard. This is Manasa, your guide for today's journey through data engineering and A I. Please enjoy the ride."
  );
  const voices = window.speechSynthesis.getVoices();
  const preferredVoice = voices.find((voice) => /zira|aria|samantha|victoria|susan|female/i.test(voice.name));

  if (preferredVoice) {
    message.voice = preferredVoice;
  }

  message.rate = 0.96;
  message.pitch = 1.05;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(message);
  welcomePlayed = true;
};

const playWelcomeVoice = async () => {
  if (welcomePlayed) {
    return;
  }

  try {
    const response = await fetch(welcomeAudioSrc, {
      method: "HEAD",
      cache: "no-store",
    });

    if (response.ok) {
      const audio = new Audio(welcomeAudioSrc);
      audio.preload = "auto";
      audio.currentTime = 0;
      await audio.play();
      welcomePlayed = true;
      return;
    }
  } catch (error) {
    // Fall back to browser speech if a recorded welcome file is not available.
  }

  speakWelcomeFallback();
};

const clearAutoRideTimeout = () => {
  if (autoRideTimeout) {
    window.clearTimeout(autoRideTimeout);
    autoRideTimeout = null;
  }
};

const stopAutoRide = () => {
  if (!autoRideActive) {
    return;
  }

  autoRideActive = false;
  clearAutoRideTimeout();
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
};

const runAutoRide = (index = 0) => {
  if (!autoRideActive || !tourStops[index]) {
    autoRideActive = false;
    return;
  }

  tourStops[index].scrollIntoView({
    behavior: "smooth",
    block: "start",
  });

  autoRideTimeout = window.setTimeout(() => {
    runAutoRide(index + 1);
  }, index === 0 ? 1800 : 2400);
};

if (startRideButton && welcomeGuide) {
  startRideButton.addEventListener("click", async () => {
    welcomeGuide.classList.remove("is-exit");
    welcomeGuide.classList.add("is-visible");
    welcomeGuide.setAttribute("aria-hidden", "false");
    await playWelcomeVoice();

    window.setTimeout(() => {
      welcomeGuide.classList.add("is-exit");
      window.setTimeout(() => {
        welcomeGuide.classList.remove("is-visible", "is-exit");
        welcomeGuide.setAttribute("aria-hidden", "true");
      }, 800);
    }, 4200);

    stopAutoRide();
    autoRideActive = true;
    clearAutoRideTimeout();
    runAutoRide(0);
  });
}

["wheel", "touchstart", "mousedown", "keydown"].forEach((eventName) => {
  window.addEventListener(
    eventName,
    (event) => {
      if (eventName === "keydown" && ["Tab", "Shift", "Control", "Alt"].includes(event.key)) {
        return;
      }
      stopAutoRide();
    },
    { passive: true }
  );
});

window.addEventListener("scroll", moveBus, { passive: true });
window.addEventListener("resize", moveBus);
moveBus();

window.addEventListener("mousemove", (event) => {
  if (!heroScene || window.innerWidth < 980) {
    return;
  }

  const bounds = heroScene.getBoundingClientRect();
  const x = (event.clientX - bounds.left) / bounds.width - 0.5;
  const y = (event.clientY - bounds.top) / bounds.height - 0.5;

  heroScene.style.transform = `rotateY(${x * 5}deg) rotateX(${y * -4}deg)`;
});
