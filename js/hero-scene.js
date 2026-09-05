(() => {
  "use strict";

  const scene = document.querySelector("#landing-scene");
  if (!scene) return;

  const selectors = [...scene.querySelectorAll("[data-scene-select]")];
  const panels = [...scene.querySelectorAll("[data-scene-panel]")];
  const motionToggle = scene.querySelector("#scene-motion-toggle");
  const motionLabel = motionToggle?.querySelector("[data-motion-label]");
  const phases = new Set(panels.map((panel) => panel.dataset.scenePanel));
  const reducedMotion = typeof window.matchMedia === "function"
    ? window.matchMedia("(prefers-reduced-motion: reduce)")
    : null;
  const precisePointer = typeof window.matchMedia === "function"
    ? window.matchMedia("(hover: hover) and (pointer: fine)")
    : null;
  let pointerFrame = null;
  let pointerX = 0;
  let pointerY = 0;
  const canMoveArtwork = () => Boolean(precisePointer?.matches)
    && !reducedMotion?.matches
    && !document.hidden
    && !scene.classList.contains("scene-paused")
    && !scene.classList.contains("scene-inactive")
    && typeof window.requestAnimationFrame === "function";
  const resetArtwork = () => {
    if (pointerFrame !== null) {
      window.cancelAnimationFrame(pointerFrame);
      pointerFrame = null;
    }
    pointerX = 0;
    pointerY = 0;
    scene.style.setProperty("--scene-pointer-x", "0px");
    scene.style.setProperty("--scene-pointer-y", "0px");
  };
  scene.addEventListener("pointermove", (event) => {
    if (event.pointerType === "touch" || !canMoveArtwork()) return;
    const bounds = scene.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    const clamp = (value) => Math.max(-12, Math.min(12, value));
    pointerX = clamp(((event.clientX - bounds.left) / bounds.width - 0.5) * 24);
    pointerY = clamp(((event.clientY - bounds.top) / bounds.height - 0.5) * 24);
    if (pointerFrame !== null) return;
    pointerFrame = window.requestAnimationFrame(() => {
      pointerFrame = null;
      if (!canMoveArtwork()) {
        resetArtwork();
        return;
      }
      scene.style.setProperty("--scene-pointer-x", `${pointerX.toFixed(2)}px`);
      scene.style.setProperty("--scene-pointer-y", `${pointerY.toFixed(2)}px`);
    });
  }, { passive: true });
  scene.addEventListener("pointerleave", resetArtwork);
  scene.addEventListener("pointercancel", resetArtwork);
  if (precisePointer?.addEventListener) {
    precisePointer.addEventListener("change", resetArtwork);
  } else if (precisePointer?.addListener) {
    precisePointer.addListener(resetArtwork);
  }
  resetArtwork();

  const selectPhase = (phase) => {
    if (!phases.has(phase)) return;
    scene.dataset.phase = phase;
    selectors.forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.sceneSelect === phase));
    });
    panels.forEach((panel) => {
      panel.hidden = panel.dataset.scenePanel !== phase;
    });
  };

  selectors.forEach((button) => {
    button.addEventListener("click", () => selectPhase(button.dataset.sceneSelect));
  });
  selectPhase(phases.has(scene.dataset.phase) ? scene.dataset.phase : "localize");

  let userPaused = null;
  const applyMotionPreference = () => {
    const reduced = Boolean(reducedMotion?.matches);
    const paused = reduced || (userPaused ?? false);
    scene.classList.toggle("scene-paused", paused);
    if (!canMoveArtwork()) resetArtwork();
    if (!motionToggle) return;
    motionToggle.hidden = reduced;
    const label = paused ? "Play motion" : "Pause motion";
    motionToggle.setAttribute("aria-pressed", String(paused));
    motionToggle.setAttribute("aria-label", label);
    if (motionLabel) motionLabel.textContent = label;
  };

  motionToggle?.addEventListener("click", () => {
    userPaused = !scene.classList.contains("scene-paused");
    applyMotionPreference();
  });
  if (reducedMotion?.addEventListener) {
    reducedMotion.addEventListener("change", applyMotionPreference);
  } else if (reducedMotion?.addListener) {
    reducedMotion.addListener(applyMotionPreference);
  }
  applyMotionPreference();

  let inViewport = true;
  const updateVisibility = () => {
    scene.classList.toggle("scene-inactive", !inViewport || document.hidden);
    if (!canMoveArtwork()) resetArtwork();
  };
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(([entry]) => {
      inViewport = entry.isIntersecting;
      updateVisibility();
    }, { threshold: 0 });
    observer.observe(scene);
  }
  document.addEventListener("visibilitychange", updateVisibility);
  updateVisibility();
  scene.classList.add("has-hero-scene");
})();
