const HEX_COLOR = /^#[0-9a-f]{6}$/i;

export function validatePromptData(data) {
  if (!data || !Array.isArray(data.categories) || data.categories.length < 2) {
    throw new Error('QR prompt data must contain at least two categories.');
  }

  data.categories.forEach((entry, index) => {
    const label = `QR prompt category ${index + 1}`;
    if (!entry || typeof entry.category !== 'string' || !entry.category.trim()) {
      throw new Error(`${label} must have a non-empty category label.`);
    }
    if (typeof entry.color !== 'string' || !HEX_COLOR.test(entry.color)) {
      throw new Error(`${label} must use a six-digit hex color.`);
    }
    if (!Array.isArray(entry.prompts) || entry.prompts.length === 0) {
      throw new Error(`${label} must contain at least one prompt.`);
    }
    if (entry.prompts.some((prompt) => typeof prompt !== 'string' || !prompt.trim())) {
      throw new Error(`${label} contains an empty prompt.`);
    }
  });

  return data.categories.map((entry) => ({
    category: entry.category.trim(),
    color: entry.color,
    prompts: entry.prompts.map((prompt) => prompt.trim()),
  }));
}

function polarPoint(cx, cy, radius, degrees) {
  const radians = degrees * Math.PI / 180;
  return {
    x: cx + radius * Math.cos(radians),
    y: cy + radius * Math.sin(radians),
  };
}

function round(value) {
  return Number(value.toFixed(3));
}

export function createWheelSegments(categories, options = {}) {
  const center = options.center ?? 160;
  const radius = options.radius ?? 148;
  const labelRadius = options.labelRadius ?? 99;
  const sliceAngle = 360 / categories.length;

  return categories.map((entry, index) => {
    const startAngle = -90 + index * sliceAngle;
    const endAngle = startAngle + sliceAngle;
    const centerAngle = startAngle + sliceAngle / 2;
    const start = polarPoint(center, center, radius, startAngle);
    const end = polarPoint(center, center, radius, endAngle);
    const label = polarPoint(center, center, labelRadius, centerAngle);
    const normalizedCenter = ((centerAngle % 360) + 360) % 360;
    const labelRotation = normalizedCenter > 90 && normalizedCenter < 270
      ? centerAngle + 180
      : centerAngle;

    return {
      ...entry,
      index,
      path: `M ${center} ${center} L ${round(start.x)} ${round(start.y)} A ${radius} ${radius} 0 ${sliceAngle > 180 ? 1 : 0} 1 ${round(end.x)} ${round(end.y)} Z`,
      labelX: round(label.x),
      labelY: round(label.y),
      labelRotation: round(labelRotation),
    };
  });
}

export function chooseIndex(length, random = Math.random) {
  if (!Number.isInteger(length) || length < 1) {
    throw new Error('Random selection requires a positive length.');
  }
  return Math.min(length - 1, Math.floor(random() * length));
}

export function choosePrompt(prompts, previousPrompt = '', random = Math.random) {
  if (!Array.isArray(prompts) || prompts.length === 0) {
    throw new Error('Prompt selection requires at least one prompt.');
  }
  const candidates = prompts.length > 1
    ? prompts.filter((prompt) => prompt !== previousPrompt)
    : prompts;
  return candidates[chooseIndex(candidates.length, random)];
}

export function initializeQrRoulette(options = {}) {
  const root = options.root ?? document.querySelector('[data-qr-roulette]');
  if (!root) return null;

  const random = options.random ?? Math.random;
  const browserWindow = options.window ?? globalThis.window;
  const reducedMotion = options.reducedMotion
    ?? browserWindow?.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    ?? false;
  const schedule = options.schedule ?? browserWindow.setTimeout.bind(browserWindow);
  const categories = validatePromptData({
    contentStatus: 'final',
    categories: JSON.parse(root.dataset.categories),
  });
  const elements = {
    wheel: root.querySelector('[data-wheel]'),
    spin: root.querySelector('[data-spin]'),
    result: root.querySelector('[data-result]'),
    category: root.querySelector('[data-result-category]'),
    prompt: root.querySelector('[data-result-prompt]'),
    announcement: root.querySelector('[data-announcement]'),
    another: root.querySelector('[data-another]'),
    reset: root.querySelector('[data-reset]'),
    error: root.querySelector('[data-error]'),
    segments: Array.from(root.querySelectorAll('[data-wheel-segment]')),
  };
  let state = 'ready';
  let selectedIndex = -1;
  let previousPrompt = '';
  let completedTurns = 0;

  function setState(nextState) {
    state = nextState;
    root.dataset.state = nextState;
  }

  function showResult() {
    const selected = categories[selectedIndex];
    previousPrompt = choosePrompt(selected.prompts, previousPrompt, random);
    elements.category.textContent = selected.category;
    elements.prompt.textContent = previousPrompt;
    elements.announcement.textContent = `${selected.category}. ${previousPrompt}`;
    elements.result.hidden = false;
    elements.spin.disabled = false;
    elements.segments.forEach((segment, index) => {
      segment.setAttribute('data-selected', String(index === selectedIndex));
    });
    setState('result');
  }

  function recover() {
    elements.result.hidden = false;
    elements.error.hidden = false;
    elements.spin.disabled = false;
    setState('ready');
  }

  function spin() {
    if (state === 'spinning') return;
    try {
      elements.error.hidden = true;
      elements.result.hidden = true;
      elements.spin.disabled = true;
      selectedIndex = chooseIndex(categories.length, random);
      previousPrompt = '';
      completedTurns += 4;
      const sliceAngle = 360 / categories.length;
      const rotation = completedTurns * 360 - (selectedIndex + 0.5) * sliceAngle;
      elements.wheel.style.setProperty('--wheel-rotation', `${rotation}deg`);
      setState('spinning');
      schedule(() => {
        try {
          showResult();
        } catch {
          recover();
        }
      }, reducedMotion ? 80 : 2600);
    } catch {
      recover();
    }
  }

  function anotherPrompt() {
    if (selectedIndex < 0 || state !== 'result') return;
    showResult();
  }

  function reset() {
    elements.result.hidden = true;
    elements.spin.disabled = false;
    elements.announcement.textContent = '';
    elements.segments.forEach((segment) => segment.setAttribute('data-selected', 'false'));
    setState('ready');
  }

  elements.spin.addEventListener('click', spin);
  elements.another.addEventListener('click', anotherPrompt);
  elements.reset.addEventListener('click', reset);

  return { spin, anotherPrompt, reset, getState: () => state };
}
