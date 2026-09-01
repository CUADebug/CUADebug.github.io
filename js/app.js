const DATASET_ROOT = "./data/cases";
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const taxonomyLabels = {
  P1: "P1 · Visual hallucination",
  P2: "P2 · Misrecognition / OCR error",
  P3: "P3 · Cross-modal misbinding",
  P4: "P4 · Observation omission",
  P5: "P5 · Semantic misunderstanding",
  G1: "G1 · Coordinate / element grounding error",
  G2: "G2 · Visibility / accessibility error",
  G3: "G3 · Interaction mechanics error",
  G4: "G4 · Distraction / adversarial misdirection",
  R1: "R1 · Constraint violation",
  R2: "R2 · Impossible plan / impossible action",
  R3: "R3 · Decomposition failure",
  R4: "R4 · Inefficient / redundant strategy",
  R5: "R5 · Action-intent misalignment",
  R6: "R6 · Invalid / malformed action",
  R7: "R7 · Parameter / argument error",
  R8: "R8 · Context loss / over-simplification",
  R9: "R9 · Memory hallucination",
  R10: "R10 · Progress misjudgment",
  R11: "R11 · Outcome misinterpretation",
  R12: "R12 · Failed self-correction",
  R13: "R13 · Causal misattribution",
  S1: "S1 · Rendering / layout failure",
  S2: "S2 · Timing / race condition",
  S3: "S3 · Unexpected system behavior",
  S4: "S4 · Step / resource limit",
  S5: "S5 · Tool / API failure",
  S6: "S6 · Environment instability",
  S7: "S7 · Benchmark / evaluation artifact",
  O1: "O1 · Infeasible-task",
};

const state = {
  cases: [],
  currentCase: null,
  caseRoot: "",
  steps: [],
  annotation: null,
  debuggerResult: null,
  evaluatorScore: null,
  currentIndex: 0,
  pairMode: "after",
  caseFilter: "ALL",
  imageRequest: 0,
  imageTimer: null,
  loadRequest: 0,
};

const elements = {
  viewerApp: document.querySelector("#viewer-app"),
  caseList: document.querySelector("#case-list"),
  caseGallery: document.querySelector("#case-gallery"),
  caseGalleryCount: document.querySelector("#case-gallery-count"),
  caseFilterButtons: [...document.querySelectorAll("[data-case-filter]")],
  taxonomyItems: [...document.querySelectorAll(".taxonomy-card li[data-tag]")],
  coveragePresent: document.querySelector("#coverage-present"),
  coverageMeterContainer: document.querySelector(".coverage-meter"),
  coverageMeter: document.querySelector(".coverage-meter i"),
  appBadge: document.querySelector("#app-badge"),
  applicationLabel: document.querySelector("#application-label"),
  caseIdShort: document.querySelector("#case-id-short"),
  caseTitle: document.querySelector("#case-title"),
  taskInstruction: document.querySelector("#task-instruction"),
  previousStep: document.querySelector("#previous-step"),
  nextStep: document.querySelector("#next-step"),
  stepNumber: document.querySelector("#step-number"),
  stepTotal: document.querySelector("#step-total"),
  pairButtons: [...document.querySelectorAll("[data-pair]")],
  screenLabel: document.querySelector("#screen-label"),
  screenFrame: document.querySelector("#screen-frame"),
  screenLoading: document.querySelector("#screen-loading"),
  screenFallback: document.querySelector("#screen-fallback"),
  screenshot: document.querySelector("#step-screenshot"),
  markers: document.querySelector("#evidence-markers"),
  timeline: document.querySelector("#timeline"),
  timelineCaption: document.querySelector("#timeline-caption"),
  timelineAnnouncement: document.querySelector("#timeline-announcement"),
  jumpRoot: document.querySelector("#jump-root"),
  stepStatus: document.querySelector("#step-status"),
  actionKind: document.querySelector("#action-kind"),
  agentResponse: document.querySelector("#agent-response"),
  actionCode: document.querySelector("#action-code"),
  stepNoteBlock: document.querySelector("#step-note-block"),
  stepNote: document.querySelector("#step-note"),
  stepReward: document.querySelector("#step-reward"),
  stepTerminal: document.querySelector("#step-terminal"),
  diagnosisStep: document.querySelector("#diagnosis-step"),
  agreementBadge: document.querySelector("#agreement-badge"),
  agreementDetail: document.querySelector("#agreement-detail"),
  debuggerVerdict: document.querySelector("#debugger-verdict"),
  debuggerVerdictIcon: document.querySelector("#debugger-verdict-icon"),
  debuggerCard: document.querySelector("#debugger-card"),
  humanAnnotators: document.querySelector("#human-annotators"),
  humanConfidence: document.querySelector("#human-confidence"),
  humanTag: document.querySelector("#human-tag"),
  humanEvidence: document.querySelector("#human-evidence"),
  humanCorrection: document.querySelector("#human-correction"),
  debuggerLabel: document.querySelector("#debugger-label"),
  debuggerConfidence: document.querySelector("#debugger-confidence"),
  debuggerStep: document.querySelector("#debugger-step"),
  debuggerTag: document.querySelector("#debugger-tag"),
  debuggerEvidence: document.querySelector("#debugger-evidence"),
  viewerError: document.querySelector("#viewer-error"),
  copyrightYear: document.querySelector("#copyright-year"),
};

async function fetchChecked(path, type = "json") {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText} while loading ${path}`);
  return type === "text" ? response.text() : response.json();
}

async function fetchOptional(path, type = "json") {
  const response = await fetch(path, { cache: "no-store" });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`${response.status} ${response.statusText} while loading ${path}`);
  return type === "text" ? response.text() : response.json();
}

function caseKey(caseData) {
  return caseData?.case_key || caseData?.case_id || "";
}

function caseDataRoot(caseData) {
  return `${DATASET_ROOT}/${caseData.data_dir || caseData.case_id}`;
}

function findCase(identifier) {
  if (!identifier) return state.cases[0];
  const keyed = state.cases.find((item) => caseKey(item) === identifier);
  if (keyed) return keyed;
  const rawMatches = state.cases.filter((item) => item.case_id === identifier);
  return rawMatches.length === 1 ? rawMatches[0] : null;
}

function filteredCases() {
  return state.caseFilter === "ALL"
    ? state.cases
    : state.cases.filter((item) => item.category === state.caseFilter);
}

function parseJsonLines(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      try {
        return JSON.parse(line);
      } catch (error) {
        throw new Error(`Invalid JSON in trajectory line ${index + 1}: ${error.message}`);
      }
    });
}

function textValue(value) {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function cleanText(value) {
  return textValue(value)
    .replace(/```(?:python|json)?/gi, "")
    .replace(/\*\*/g, "")
    .replace(/^#+\s*/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function normalizeForMatch(value) {
  return cleanText(value).replace(/\s+/g, " ").trim().toLowerCase();
}

function displayConfidence(value) {
  if (typeof value === "number") return `${Math.round(value * 100)}% confidence`;
  const normalized = String(value || "unknown").trim().toLowerCase();
  return `${normalized.charAt(0).toUpperCase() + normalized.slice(1)} confidence`;
}

function normalizeTag(tag) {
  if (tag === "IF2" || tag === "Infeasible Task") return "O1";
  return tag || state.currentCase?.taxonomy_tag || "—";
}

function displayTaxonomy(tag) {
  const normalized = normalizeTag(tag);
  return taxonomyLabels[normalized] || normalized;
}

function humanDecisionFrom(annotation = {}) {
  if (annotation.final_decision) return annotation.final_decision;
  if (Array.isArray(annotation.human_values) && annotation.human_values.length) return annotation.human_values.at(-1);
  if (annotation.root_error_step != null) return annotation;
  return {};
}

function getHumanDecision() {
  return humanDecisionFrom(state.annotation || {});
}

function getActionKind(step) {
  const action = step.action;
  if (typeof action === "string") return action.trim() === "DONE" ? "DONE" : "grounded action";
  if (!action) return "action";
  if (action.action_type === "DONE") return "DONE";
  return action.input?.action || action.name || action.action_type || "action";
}

function getActionCode(step) {
  const action = step.action;
  if (typeof action === "string") return action.trim();
  if (!action) return "No action recorded.";
  if (action.action_type === "DONE") return "DONE";
  if (action.command) return textValue(action.command).trim();
  if (action.action_code) return textValue(action.action_code).trim();
  if (action.input) return JSON.stringify(action.input, null, 2);
  return JSON.stringify(action, null, 2);
}

function getAgentResponse(step) {
  return cleanText(
    step.response ||
      step.full_plan ||
      step.executor_plan ||
      step.plan_code ||
      step.action?.raw_response ||
      "No reasoning text was recorded for this step.",
  );
}

function getStepClass(stepNumber) {
  if (stepNumber < state.currentCase.root_step) return "context";
  if (stepNumber === state.currentCase.root_step) return "root";
  return "downstream";
}

function getStepStatus(step) {
  if (step.step_num < state.currentCase.root_step) return { label: "Context", className: "review" };
  if (step.step_num === state.currentCase.root_step) return { label: "Root cause", className: "root" };
  if (step.done || step.step_num === state.currentCase.terminal_step) return { label: "Downstream · terminal", className: "downstream" };
  return { label: "Downstream drift", className: "downstream" };
}

function trajectoryLengthLabel(caseData) {
  const clips = Number(caseData.total_steps);
  const numberedSteps = Number(caseData.terminal_step);
  return clips === numberedSteps ? `${numberedSteps} steps` : `${clips} clips · ${numberedSteps} numbered steps`;
}

function renderCaseNavigation() {
  elements.caseList.replaceChildren();
  const fragment = document.createDocumentFragment();

  filteredCases().forEach((caseData) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `case-selector family-${caseData.category}`;
    button.dataset.caseKey = caseKey(caseData);
    button.dataset.tag = caseData.taxonomy_tag;
    button.setAttribute("aria-label", `Open ${caseData.family} case: ${caseData.title}`);
    if (caseKey(state.currentCase) === caseKey(caseData)) {
      button.classList.add("active");
      button.setAttribute("aria-current", "true");
    }

    const family = document.createElement("span");
    family.className = "case-family";
    family.textContent = caseData.category;
    const copy = document.createElement("span");
    const title = document.createElement("strong");
    title.textContent = caseData.title;
    const meta = document.createElement("small");
    meta.textContent = `${caseData.taxonomy_tag} · ${trajectoryLengthLabel(caseData)} · ${caseData.agent}`;
    copy.append(title, meta);
    button.append(family, copy);
    button.addEventListener("click", () => loadCase(caseKey(caseData)));
    fragment.append(button);
  });

  elements.caseList.append(fragment);
}

function renderCaseGallery() {
  elements.caseGallery.replaceChildren();
  const fragment = document.createDocumentFragment();
  const visibleCases = filteredCases();

  visibleCases.forEach((caseData) => {
    const article = document.createElement("article");
    article.className = `gallery-card family-${caseData.category}`;
    article.dataset.family = caseData.category;
    article.dataset.tag = caseData.taxonomy_tag;
    const thumb = document.createElement("div");
    thumb.className = "gallery-thumb";
    const image = document.createElement("img");
    image.loading = "lazy";
    image.src = `${caseDataRoot(caseData)}/${caseData.thumbnail}`;
    image.alt = `Root-cause screenshot for ${caseData.title}`;
    const family = document.createElement("span");
    family.className = "gallery-family";
    family.textContent = caseData.category;
    thumb.append(image, family);

    const body = document.createElement("div");
    body.className = "gallery-body";
    const label = document.createElement("p");
    label.textContent = `${caseData.taxonomy_tag} · ${caseData.taxonomy_name}`;
    const title = document.createElement("h3");
    title.textContent = caseData.title;
    const evidence = document.createElement("p");
    evidence.textContent = caseData.short_evidence;
    const meta = document.createElement("div");
    meta.className = "gallery-meta";
    const application = document.createElement("span");
    application.textContent = caseData.application;
    const trajectory = document.createElement("span");
    trajectory.textContent = `${trajectoryLengthLabel(caseData)} · root ${caseData.root_step}`;
    meta.append(application, trajectory);
    const open = document.createElement("button");
    open.type = "button";
    open.className = "gallery-open";
    open.textContent = "View complete trajectory";
    open.addEventListener("click", async () => {
      await loadCase(caseKey(caseData));
      document.querySelector("#demo").scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth" });
      elements.viewerApp.focus({ preventScroll: true });
    });

    body.append(label, title, evidence, meta, open);
    article.append(thumb, body);
    fragment.append(article);
  });

  elements.caseGallery.append(fragment);
  if (elements.caseGalleryCount) {
    elements.caseGalleryCount.textContent = state.caseFilter === "ALL"
      ? "Selected aligned trajectories across P/G/R/S"
      : `Showing ${visibleCases.length} aligned ${visibleCases.length === 1 ? "trajectory" : "trajectories"} in family ${state.caseFilter}`;
  }
}

async function setCaseFilter(filter) {
  const allowed = new Set(["ALL", "P", "G", "R", "S", "O"]);
  state.caseFilter = allowed.has(filter) ? filter : "ALL";
  elements.caseFilterButtons.forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.caseFilter === state.caseFilter));
  });
  renderCaseNavigation();
  renderCaseGallery();
  const visibleCases = filteredCases();
  if (state.currentCase && !visibleCases.some((item) => caseKey(item) === caseKey(state.currentCase)) && visibleCases.length) {
    await loadCase(caseKey(visibleCases[0]));
  }
}

function renderTaxonomyCoverage() {
  const casesByTag = new Map();
  state.cases.forEach((caseData) => {
    const casesForTag = casesByTag.get(caseData.taxonomy_tag) || [];
    casesForTag.push(caseData);
    casesByTag.set(caseData.taxonomy_tag, casesForTag);
  });
  const presentTags = new Set(casesByTag.keys());
  if (elements.coveragePresent) elements.coveragePresent.textContent = String(presentTags.size);
  if (elements.coverageMeter) elements.coverageMeter.style.setProperty("--coverage", `${(presentTags.size / elements.taxonomyItems.length) * 100}%`);
  if (elements.coverageMeterContainer) elements.coverageMeterContainer.setAttribute("aria-valuenow", String(presentTags.size));

  elements.caseFilterButtons.forEach((button) => {
    const filter = button.dataset.caseFilter;
    const count = filter === "ALL" ? state.cases.length : state.cases.filter((item) => item.category === filter).length;
    const countLabel = button.querySelector("span");
    if (countLabel) countLabel.textContent = String(count);
    button.disabled = count === 0;
  });

  elements.taxonomyItems.forEach((item) => {
    const tag = item.dataset.tag;
    const casesForTag = casesByTag.get(tag) || [];
    const caseData = casesForTag[0];
    item.dataset.subtype = tag;
    item.dataset.available = String(Boolean(caseData));
    item.dataset.sampleCount = String(caseData?.benchmark_count || (caseData ? 1 : 0));
    item.classList.toggle("has-case", Boolean(caseData));
    item.classList.toggle("no-case", !caseData);
    item.querySelector(".taxonomy-case-actions, .taxonomy-case-action")?.remove();

    if (caseData) {
      const actions = document.createElement("span");
      actions.className = "taxonomy-case-actions";
      casesForTag.forEach((tagCase, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "taxonomy-case-action";
        button.textContent = casesForTag.length === 1 ? "Open case" : `Case ${index + 1}`;
        button.setAttribute("aria-label", `Open ${tagCase.title}, a ${tag} trajectory example`);
        button.addEventListener("click", async () => {
          await setCaseFilter("ALL");
          await loadCase(caseKey(tagCase));
          document.querySelector("#demo").scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth" });
          elements.viewerApp.focus({ preventScroll: true });
        });
        actions.append(button);
      });
      item.append(actions);
    } else {
      const status = document.createElement("span");
      status.className = "taxonomy-case-action";
      status.textContent = "No selected aligned example in this release";
      item.append(status);
    }
  });

  document.querySelectorAll("[data-family-coverage]").forEach((label) => {
    const family = label.dataset.familyCoverage;
    const total = elements.taxonomyItems.filter((item) => item.dataset.tag.startsWith(family)).length;
    const available = [...presentTags].filter((tag) => tag.startsWith(family)).length;
    label.textContent = `${available} / ${total} examples`;
  });
}

function renderTimeline() {
  elements.timeline.replaceChildren();
  const fragment = document.createDocumentFragment();

  state.steps.forEach((step, index) => {
    const statusClass = getStepClass(step.step_num);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "timeline-step";
    button.dataset.index = String(index);
    if (statusClass !== "review") button.classList.add(statusClass);
    if (step.done || step.step_num === state.currentCase.terminal_step) button.classList.add("terminal");
    if (index === state.currentIndex) {
      button.classList.add("selected");
      button.setAttribute("aria-current", "step");
    }

    const number = document.createElement("span");
    number.textContent = String(step.step_num).padStart(2, "0");
    const label = document.createElement("small");
    label.textContent =
      statusClass === "root" ? "! root cause" :
      statusClass === "downstream" ? "downstream" :
      step.done ? "terminal" : "inspect";
    button.setAttribute("aria-label", `Step ${step.step_num}, ${label.textContent}`);
    button.append(number, label);
    button.addEventListener("click", () => selectStep(index));
    fragment.append(button);
  });

  elements.timeline.append(fragment);
  elements.timelineCaption.textContent = `Step ${state.currentCase.root_step} is the root cause; amber steps show downstream drift.`;
}

function renderMarkers(step) {
  elements.markers.replaceChildren();
  const markers = state.currentCase.paired_markers || [];
  const shouldShow =
    markers.length &&
    step.step_num === state.currentCase.root_step &&
    state.pairMode === "before";
  if (!shouldShow) return;

  markers.forEach((markerData) => {
    const marker = document.createElement("span");
    marker.className = `evidence-marker ${markerData.kind}`;
    marker.style.left = `${markerData.x_percent}%`;
    marker.style.top = `${markerData.y_percent}%`;
    marker.setAttribute("role", "img");
    marker.setAttribute("aria-label", markerData.label);
    const label = document.createElement("span");
    label.className = "marker-label";
    label.textContent = markerData.label;
    marker.append(label);
    elements.markers.append(marker);
  });
}

function screenshotFileFor(step) {
  if (state.pairMode !== "before") return step.screenshot_file;
  if (state.currentIndex > 0) return state.steps[state.currentIndex - 1].screenshot_file;
  return state.currentCase.initial_screenshot || step.screenshot_file;
}

function updateScreenshot(step) {
  const screenshotFile = screenshotFileFor(step);
  const requestId = ++state.imageRequest;
  elements.screenLoading.classList.remove("done");
  elements.screenFallback.hidden = true;
  elements.screenshot.classList.remove("loaded");
  elements.screenshot.alt = `${state.currentCase.application} screen ${state.pairMode === "before" ? "before" : "after"} the action at step ${step.step_num}`;
  elements.screenLabel.textContent =
    state.pairMode === "before" ? `State before step ${step.step_num} action` : `State after step ${step.step_num} action`;

  elements.screenshot.onload = () => {
    if (requestId !== state.imageRequest) return;
    window.clearTimeout(state.imageTimer);
    elements.screenshot.classList.add("loaded");
    elements.screenLoading.classList.add("done");
  };
  elements.screenshot.onerror = () => {
    if (requestId !== state.imageRequest) return;
    window.clearTimeout(state.imageTimer);
    elements.screenLoading.classList.add("done");
    showError(`The screenshot for step ${step.step_num} could not be loaded.`);
  };
  elements.screenshot.src = `${state.caseRoot}/${screenshotFile}`;
  window.clearTimeout(state.imageTimer);
  state.imageTimer = window.setTimeout(() => {
    if (requestId !== state.imageRequest || elements.screenshot.classList.contains("loaded")) return;
    showError(`The screenshot for step ${step.step_num} timed out while loading.`);
  }, 12000);

  [state.currentIndex - 1, state.currentIndex + 1]
    .filter((index) => index >= 0 && index < state.steps.length)
    .forEach((index) => {
      const preload = new Image();
      preload.src = `${state.caseRoot}/${state.steps[index].screenshot_file}`;
    });
}

function updatePairToggle() {
  const beforeUnavailable = state.currentIndex === 0 && !state.currentCase.initial_screenshot;
  elements.pairButtons.forEach((button) => {
    if (button.dataset.pair === "before") button.disabled = beforeUnavailable;
    const active = button.dataset.pair === state.pairMode;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

function updateUrl() {
  if (!state.currentCase || !state.steps.length) return;
  const url = new URL(window.location.href);
  url.searchParams.set("case_key", caseKey(state.currentCase));
  url.searchParams.delete("case");
  url.searchParams.set("step", String(state.steps[state.currentIndex].step_num));
  url.searchParams.delete("diagnosed");
  window.history.replaceState({}, "", url);
}

function renderSelectedStep({ scrollTimeline = false, focusTimeline = false } = {}) {
  const step = state.steps[state.currentIndex];
  if (!step) return;
  if (state.pairMode === "before" && state.currentIndex === 0 && !state.currentCase.initial_screenshot) state.pairMode = "after";

  elements.stepNumber.textContent = String(step.step_num).padStart(2, "0");
  elements.previousStep.disabled = state.currentIndex === 0;
  elements.nextStep.disabled = state.currentIndex === state.steps.length - 1;
  elements.actionKind.textContent = getActionKind(step).replaceAll("_", " ");
  elements.agentResponse.textContent = getAgentResponse(step);
  elements.actionCode.textContent = getActionCode(step);
  elements.stepReward.textContent = String(step.reward ?? "—");
  elements.stepTerminal.textContent = step.done ? "yes" : "no";

  const status = getStepStatus(step);
  elements.stepStatus.textContent = status.label;
  elements.stepStatus.className = `status-badge ${status.className}`;

  const isRoot = step.step_num === state.currentCase.root_step;
  elements.viewerApp.classList.toggle("root-active", isRoot);
  elements.stepNoteBlock.hidden = !isRoot;
  elements.stepNote.textContent = isRoot ? state.currentCase.short_evidence : "";

  updatePairToggle();
  updateScreenshot(step);
  renderMarkers(step);
  renderTimeline();
  updateUrl();

  const selected = elements.timeline.querySelector(".selected");
  if (selected && scrollTimeline) {
    const centeredLeft = selected.offsetLeft - (elements.timeline.parentElement.clientWidth - selected.clientWidth) / 2;
    elements.timeline.parentElement.scrollTo({ left: Math.max(0, centeredLeft), behavior: prefersReducedMotion ? "auto" : "smooth" });
  }
  if (selected && focusTimeline) selected.focus({ preventScroll: true });
}

function selectStep(index, options = {}) {
  if (index < 0 || index >= state.steps.length) return;
  state.currentIndex = index;
  renderSelectedStep({ scrollTimeline: options.scrollTimeline !== false, focusTimeline: Boolean(options.focusTimeline) });
}

function populateDiagnosis() {
  const machine = state.debuggerResult || {};
  const human = getHumanDecision();
  const machineAvailable = Boolean(state.debuggerResult && (machine.root_error_step != null || machine.taxonomy_tag));
  const machineTag = normalizeTag(machine.taxonomy_tag);
  const humanTag = normalizeTag(human.taxonomy_tag);
  const stepMatch = Number(machine.root_error_step) === Number(human.root_error_step);
  const tagMatch = machineTag === humanTag;
  const evidenceMatch = normalizeForMatch(machine.evidence) === normalizeForMatch(human.evidence);
  const correctionMatch = normalizeForMatch(machine.correction) === normalizeForMatch(human.correction);
  const coreMatch = machineAvailable && stepMatch && tagMatch;
  const exactMatch = coreMatch && evidenceMatch && correctionMatch;
  const humanSource = state.currentCase?.human_reference_source || "Recorded human annotation";

  elements.diagnosisStep.textContent = String(human.root_error_step ?? state.currentCase.root_step);
  elements.humanConfidence.textContent = displayConfidence(human.confidence);
  elements.humanTag.textContent = displayTaxonomy(humanTag);
  elements.humanEvidence.textContent = cleanText(human.evidence);
  elements.humanCorrection.textContent = cleanText(human.correction);
  elements.humanAnnotators.textContent = human.annotator ? `${humanSource} · ${human.annotator}` : humanSource;
  elements.debuggerLabel.textContent = machineAvailable ? `${machine.model || state.currentCase.debugger || "Machine"} debugger` : "Machine comparison unavailable";
  elements.debuggerConfidence.textContent = machineAvailable ? displayConfidence(machine.confidence) : "No checked-in RCA";
  elements.debuggerStep.textContent = machineAvailable ? String(machine.root_error_step ?? "—") : "—";
  elements.debuggerTag.textContent = machineAvailable ? displayTaxonomy(machineTag) : "—";
  elements.debuggerEvidence.textContent = machineAvailable ? cleanText(machine.evidence) : "No precomputed machine RCA was selected for this trajectory; the human reference diagnosis remains available above.";

  const verdictClass = !machineAvailable ? "unavailable" : exactMatch ? "aligned" : coreMatch ? "partial" : "mismatch";
  elements.debuggerVerdict.className = `debugger-verdict ${verdictClass}`;
  elements.debuggerCard.className = `debugger-card ${verdictClass}`;
  elements.debuggerVerdictIcon.textContent = !machineAvailable ? "?" : exactMatch ? "✓" : coreMatch ? "≈" : "×";
  elements.agreementBadge.textContent = !machineAvailable
    ? "Debugger result unavailable"
    : exactMatch ? "Aligned with human reference"
      : coreMatch ? "Debugger partly aligned"
        : "Debugger incorrect";
  elements.agreementDetail.textContent = !machineAvailable
    ? "No checked-in machine RCA for this trajectory."
    : exactMatch ? "Root step, subtype, evidence, and correction exactly match the checked-in human reference."
      : coreMatch ? "Root step and subtype match; written evidence or correction differs."
        : `Human: step ${human.root_error_step}, ${humanTag}. Debugger: step ${machine.root_error_step ?? "—"}, ${machineTag}.`;
}

function showError(message) {
  window.clearTimeout(state.imageTimer);
  elements.screenLoading.classList.add("done");
  elements.screenFallback.hidden = false;
  const fallbackDetail = elements.screenFallback.querySelector("span");
  if (fallbackDetail) fallbackDetail.textContent = message;
  elements.stepStatus.textContent = "Load error";
  elements.stepStatus.className = "status-badge downstream";
  elements.viewerError.hidden = false;
  elements.viewerError.textContent = message;
}

async function loadCase(identifier, options = {}) {
  const caseData = findCase(identifier);
  if (!caseData) return;
  const requestId = ++state.loadRequest;
  const caseRoot = caseDataRoot(caseData);

  elements.viewerApp.setAttribute("aria-busy", "true");
  elements.viewerError.hidden = true;
  elements.jumpRoot.disabled = true;
  elements.screenLoading.classList.remove("done");
  elements.screenFallback.hidden = true;
  elements.viewerApp.classList.remove("root-active");

  try {
    const [annotation, debuggerResult, trajectoryText, evaluatorText] = await Promise.all([
      fetchChecked(`${caseRoot}/human_annotation.json`),
      fetchOptional(`${caseRoot}/debugger_rca.json`),
      fetchChecked(`${caseRoot}/traj.jsonl`, "text"),
      fetchOptional(`${caseRoot}/result.txt`, "text"),
    ]);
    if (requestId !== state.loadRequest) return;

    const steps = parseJsonLines(trajectoryText).sort((a, b) => a.step_num - b.step_num);
    if (steps.length !== caseData.total_steps) {
      throw new Error(`Manifest expected ${caseData.total_steps} trajectory records, but ${steps.length} were loaded.`);
    }
    const humanDecision = humanDecisionFrom(annotation);
    const humanRoot = Number(humanDecision.root_error_step);
    const humanTag = humanDecision.taxonomy_tag === "IF2" || humanDecision.taxonomy_tag === "Infeasible Task"
      ? "O1"
      : humanDecision.taxonomy_tag;
    if (!steps.some((step) => Number(step.step_num) === Number(caseData.root_step))) {
      throw new Error(`Manifest root step ${caseData.root_step} is not present in the trajectory.`);
    }
    if (humanRoot !== Number(caseData.root_step)) {
      throw new Error(`Manifest root step ${caseData.root_step} disagrees with the human reference step ${humanRoot}.`);
    }
    if (humanTag !== caseData.taxonomy_tag) {
      throw new Error(`Manifest subtype ${caseData.taxonomy_tag} disagrees with the human reference subtype ${humanTag}.`);
    }
    if (caseData.machine_rca_match) {
      const machineTag = normalizeTag(debuggerResult?.taxonomy_tag);
      const exactMatch = debuggerResult
        && Number(debuggerResult.root_error_step) === humanRoot
        && machineTag === humanTag
        && normalizeForMatch(debuggerResult.evidence) === normalizeForMatch(humanDecision.evidence)
        && normalizeForMatch(debuggerResult.correction) === normalizeForMatch(humanDecision.correction);
      if (!exactMatch) throw new Error("The selected debugger RCA does not exactly match the checked-in human reference.");
    }
    if (caseData.machine_rca_model && debuggerResult?.model !== caseData.machine_rca_model) {
      throw new Error(`Manifest debugger model ${caseData.machine_rca_model} disagrees with the checked-in RCA model ${debuggerResult?.model || "unknown"}.`);
    }
    if (steps.some((step) => !step.screenshot_file)) {
      throw new Error("At least one trajectory step is missing its screenshot filename.");
    }

    state.currentCase = caseData;
    state.caseRoot = caseRoot;
    state.steps = steps;
    state.annotation = annotation;
    state.debuggerResult = debuggerResult;
    state.evaluatorScore = evaluatorText == null ? Number(caseData.evaluator_score) : Number(evaluatorText.trim());
    const rootIndex = steps.findIndex((step) => step.step_num === caseData.root_step);
    state.currentIndex = Math.max(0, rootIndex);

    const requestedStep = Number(options.step);
    if (Number.isFinite(requestedStep)) {
      const requestedIndex = steps.findIndex((step) => step.step_num === requestedStep);
      if (requestedIndex >= 0) state.currentIndex = requestedIndex;
    }
    state.pairMode = state.currentIndex === rootIndex && (state.currentIndex > 0 || caseData.initial_screenshot) ? "before" : "after";

    elements.appBadge.textContent = caseData.app_icon;
    elements.applicationLabel.textContent = caseData.application;
    elements.caseIdShort.textContent = caseData.case_id.slice(0, 8);
    elements.caseTitle.textContent = caseData.title;
    elements.taskInstruction.textContent = caseData.instruction;
    elements.stepTotal.textContent = String(caseData.terminal_step).padStart(2, "0");
    elements.jumpRoot.disabled = false;
    elements.viewerApp.setAttribute("aria-busy", "false");

    populateDiagnosis();
    renderCaseNavigation();
    elements.timelineAnnouncement.textContent = `Diagnosis shown. Root cause: step ${caseData.root_step}, ${caseData.taxonomy_tag}, ${caseData.taxonomy_name}.`;
    renderSelectedStep({ scrollTimeline: true });
  } catch (error) {
    if (requestId !== state.loadRequest) return;
    elements.viewerApp.setAttribute("aria-busy", "false");
    elements.screenLoading.classList.add("done");
    const localHint = window.location.protocol === "file:"
      ? " Open this directory through a local HTTP server; fetch requests do not work from file:// URLs."
      : "";
    showError(`Unable to load this trajectory: ${error.message}.${localHint}`);
  }
}

function bindEvents() {
  elements.previousStep.addEventListener("click", () => selectStep(state.currentIndex - 1));
  elements.nextStep.addEventListener("click", () => selectStep(state.currentIndex + 1));
  elements.jumpRoot.addEventListener("click", () => {
    if (!state.currentCase || !state.steps.length) return;
    const rootIndex = state.steps.findIndex((step) => step.step_num === state.currentCase.root_step);
    state.pairMode = rootIndex > 0 || state.currentCase.initial_screenshot ? "before" : "after";
    selectStep(rootIndex, { focusTimeline: true });
  });

  elements.pairButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (button.disabled) return;
      state.pairMode = button.dataset.pair;
      renderSelectedStep();
    });
  });

  elements.caseFilterButtons.forEach((button) => {
    button.addEventListener("click", async () => setCaseFilter(button.dataset.caseFilter));
  });

  window.addEventListener("keydown", (event) => {
    if (!elements.viewerApp.contains(document.activeElement)) return;
    const tag = document.activeElement?.tagName;
    if (["INPUT", "TEXTAREA", "SELECT"].includes(tag)) return;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      selectStep(state.currentIndex - 1, { focusTimeline: true });
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      selectStep(state.currentIndex + 1, { focusTimeline: true });
    }
  });

}

async function initialize() {
  elements.copyrightYear.textContent = String(new Date().getFullYear());
  const initializationTimer = window.setTimeout(() => {
    if (elements.viewerApp.getAttribute("aria-busy") === "true") {
      showError("Trajectory initialization timed out. Refresh the local website page and try again.");
    }
  }, 12000);

  try {
    bindEvents();
    const manifest = await fetchChecked("./data/cases.json");
    state.cases = Array.isArray(manifest) ? manifest : manifest.cases;
    if (!Array.isArray(state.cases) || !state.cases.length) throw new Error("The case manifest is empty or invalid.");
    if (state.cases.length !== 12) throw new Error(`This release requires 12 selected cases, but the manifest contains ${state.cases.length}.`);
    if (new Set(state.cases.map(caseKey)).size !== state.cases.length) throw new Error("The case manifest contains duplicate case keys.");
    if (state.cases.some((item) => !taxonomyLabels[item.taxonomy_tag])) throw new Error("The case manifest contains a subtype outside the canonical taxonomy.");
    if (state.cases.some((item) => !item.case_key || !item.data_dir || !item.case_id || !item.source_split)) throw new Error("The case manifest is missing collision-safe source metadata.");
    const familyCounts = Object.fromEntries(["P", "G", "R", "S"].map((family) => [family, state.cases.filter((item) => item.category === family).length]));
    if (Object.values(familyCounts).some((count) => count !== 3)) throw new Error("This release requires three selected trajectories in each P/G/R/S family.");
    renderCaseNavigation();
    renderCaseGallery();
    renderTaxonomyCoverage();
    const params = new URLSearchParams(window.location.search);
    const requestedCase = params.get("case_key") || params.get("case");
    const initialCase = findCase(requestedCase) || state.cases[0];
    await loadCase(caseKey(initialCase), {
      step: params.get("step"),
    });
  } catch (error) {
    elements.viewerApp.setAttribute("aria-busy", "false");
    showError(`Unable to initialize the trajectory library: ${error.message}`);
  } finally {
    window.clearTimeout(initializationTimer);
  }
}

initialize();
