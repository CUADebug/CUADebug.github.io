(() => {
  "use strict";

  const root = document.documentElement;
  const header = document.querySelector(".site-header");
  const navigation = document.querySelector("#primary-navigation");
  const menuToggle = document.querySelector("#nav-toggle");
  const mobileViewport = typeof window.matchMedia === "function"
    ? window.matchMedia("(max-width: 1100px)")
    : null;

  root.classList.add("has-presentation");

  if (header && navigation && menuToggle) {
    const setMenuOpen = (open, returnFocus = false) => {
      header.classList.toggle("is-open", open);
      menuToggle.setAttribute("aria-expanded", String(open));
      menuToggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
      if (returnFocus) menuToggle.focus({ preventScroll: true });
    };

    menuToggle.setAttribute("aria-controls", navigation.id);
    setMenuOpen(false);

    menuToggle.addEventListener("click", () => {
      setMenuOpen(menuToggle.getAttribute("aria-expanded") !== "true");
    });

    navigation.addEventListener("click", (event) => {
      if (event.target.closest("a")) setMenuOpen(false);
    });

    document.addEventListener("click", (event) => {
      if (!header.contains(event.target)) setMenuOpen(false);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && menuToggle.getAttribute("aria-expanded") === "true") {
        setMenuOpen(false, true);
      }
    });

    const onViewportChange = () => {
      if (mobileViewport && !mobileViewport.matches) setMenuOpen(false);
    };
    if (mobileViewport?.addEventListener) {
      mobileViewport.addEventListener("change", onViewportChange);
    } else if (mobileViewport?.addListener) {
      mobileViewport.addListener(onViewportChange);
    }
  }

  const sectionLinks = Array.from(document.querySelectorAll(".site-nav a[href]"))
    .map((link) => {
      try {
        const url = new URL(link.href, window.location.href);
        if (url.origin !== window.location.origin || url.pathname !== window.location.pathname || !url.hash) {
          return null;
        }
        const section = document.getElementById(decodeURIComponent(url.hash.slice(1)));
        return section ? { link, section } : null;
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  if (sectionLinks.length) {
    let framePending = false;
    const updateCurrentSection = () => {
      framePending = false;
      let current = null;
      let nearestTop = -Infinity;
      const threshold = (header?.getBoundingClientRect().height || 0) + 100;
      if (window.scrollY > 8) {
        sectionLinks.forEach((entry) => {
          const top = entry.section.getBoundingClientRect().top;
          if (top <= threshold && top > nearestTop) {
            current = entry;
            nearestTop = top;
          }
        });
      }
      sectionLinks.forEach((entry) => {
        if (entry === current) entry.link.setAttribute("aria-current", "location");
        else entry.link.removeAttribute("aria-current");
      });
    };
    const scheduleSectionUpdate = () => {
      if (framePending) return;
      framePending = true;
      window.requestAnimationFrame(updateCurrentSection);
    };
    window.addEventListener("scroll", scheduleSectionUpdate, { passive: true });
    window.addEventListener("resize", scheduleSectionUpdate, { passive: true });
    window.addEventListener("load", scheduleSectionUpdate, { once: true });
    updateCurrentSection();
  }

  const dialog = document.querySelector("#figure-dialog");
  const dialogImage = document.querySelector("#figure-dialog-image");
  const dialogTitle = document.querySelector("#figure-dialog-title");
  const zoomToggle = document.querySelector("#figure-zoom");
  const figureTriggers = document.querySelectorAll("button[data-figure]");
  if (!dialog || !dialogImage || !dialogTitle || !figureTriggers.length) return;

  let openingTrigger = null;
  let previouslyLocked = false;
  let pointerStartedOnBackdrop = false;

  const setZoom = (zoomed) => {
    dialog.classList.toggle("is-zoomed", zoomed);
    if (zoomToggle) {
      zoomToggle.setAttribute("aria-pressed", String(zoomed));
      zoomToggle.setAttribute("aria-label", zoomed ? "Fit figure to window" : "Show figure at full resolution");
      const label = zoomToggle.querySelector("[data-zoom-label]");
      if (label) label.textContent = zoomed ? "Fit image" : "Full size";
    }
    const body = dialog.querySelector(".figure-dialog-body");
    if (body) {
      body.scrollLeft = 0;
      body.scrollTop = 0;
    }
  };

  const closeFigure = () => {
    if (dialog.open && typeof dialog.close === "function") dialog.close();
  };

  const isBackdrop = (event) => {
    if (event.target !== dialog) return false;
    const bounds = dialog.getBoundingClientRect();
    return event.clientX < bounds.left || event.clientX > bounds.right
      || event.clientY < bounds.top || event.clientY > bounds.bottom;
  };

  figureTriggers.forEach((trigger) => {
    trigger.addEventListener("click", () => {
      const source = trigger.dataset.figure;
      if (!source) return;
      if (typeof dialog.showModal !== "function") {
        window.open(source, "_blank", "noopener,noreferrer");
        return;
      }
      openingTrigger = trigger;
      dialogTitle.textContent = trigger.dataset.figureTitle || "Paper figure";
      dialogImage.alt = trigger.dataset.figureAlt
        || trigger.querySelector("img")?.alt
        || dialogTitle.textContent;
      setZoom(false);
      dialogImage.src = source;
      if (zoomToggle) zoomToggle.disabled = !dialogImage.complete || !dialogImage.naturalWidth;
      if (!dialog.open) {
        previouslyLocked = root.classList.contains("has-open-figure");
        dialog.showModal();
        root.classList.add("has-open-figure");
      }
    });
  });

  dialog.querySelectorAll("[data-close-figure]").forEach((button) => {
    button.addEventListener("click", closeFigure);
  });

  dialog.addEventListener("pointerdown", (event) => {
    pointerStartedOnBackdrop = isBackdrop(event);
  });
  dialog.addEventListener("click", (event) => {
    if (pointerStartedOnBackdrop && isBackdrop(event)) closeFigure();
    pointerStartedOnBackdrop = false;
  });
  dialog.addEventListener("close", () => {
    if (!previouslyLocked) root.classList.remove("has-open-figure");
    setZoom(false);
    if (openingTrigger?.isConnected) openingTrigger.focus({ preventScroll: true });
    openingTrigger = null;
  });

  if (zoomToggle) {
    zoomToggle.addEventListener("click", () => setZoom(!dialog.classList.contains("is-zoomed")));
    dialogImage.addEventListener("load", () => { zoomToggle.disabled = false; });
    dialogImage.addEventListener("error", () => { zoomToggle.disabled = true; });
    setZoom(false);
  }
})();
