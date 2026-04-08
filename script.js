const sections = [...document.querySelectorAll(".section")];
const busMarker = document.querySelector(".bus-marker");
const heroScene = document.querySelector(".hero-scene");

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
      }
    });
  },
  {
    threshold: 0.18,
    rootMargin: "0px 0px -8% 0px",
  }
);

sections.forEach((section) => revealObserver.observe(section));

document.querySelectorAll(".slide-tabs").forEach((tabGroup) => {
  const buttons = [...tabGroup.querySelectorAll(".slide-tab")];
  const stage = tabGroup.nextElementSibling;
  const panels = stage ? [...stage.querySelectorAll(".slide-panel")] : [];

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const targetId = button.dataset.target;

      buttons.forEach((item) => item.classList.toggle("is-active", item === button));
      panels.forEach((panel) => panel.classList.toggle("is-active", panel.id === targetId));
    });
  });
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
