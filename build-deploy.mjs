#!/usr/bin/env node
// Build sanitized deployment bundle from sign-design-v2.html source
// Usage: node build-deploy.mjs

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = __dirname;
const OUT = path.join(__dirname, 'docs');

// Ensure output directories exist
fs.mkdirSync(path.join(OUT, 'Images'), { recursive: true });

// Sanitize course-geometry-reference.json to only consumed fields
const geometry = JSON.parse(fs.readFileSync(path.join(SRC, 'course-geometry-reference.json'), 'utf8'));
const sanitizedGeometry = {
  main18: geometry.main18.map(h => ({
    slot: h.slot,
    tees: h.tees.map(t => ({ teeId: t.teeId, type: t.type, markedPx: t.markedPx })),
    baskets: h.baskets.map(b => ({ pinId: b.pinId, type: b.type, markedPx: b.markedPx })),
    routes: h.routes.map(r => ({
      pathId: r.pathId,
      teeId: r.teeId,
      pinId: r.pinId,
      vertices: r.vertices.map(v => ({ markedPx: v.markedPx }))
    }))
  })),
  layouts: geometry.layouts.map(l => ({
    layoutId: l.layoutId,
    holes: l.holes.map(h => ({ slot: h.slot, par: h.par, effectiveDistanceFt: h.effectiveDistanceFt })),
    referenceTotals: l.referenceTotals,
    serverTotals: l.serverTotals
  }))
};
fs.writeFileSync(path.join(OUT, 'course-geometry-reference.json'), JSON.stringify(sanitizedGeometry, null, 2));

// Sanitize course-data.json to only registration affine
const courseData = JSON.parse(fs.readFileSync(path.join(SRC, 'course-data.json'), 'utf8'));
const sanitizedCourseData = {
  registration: {
    markedToClean: {
      affine: courseData.registration.markedToClean.affine
    }
  }
};
fs.writeFileSync(path.join(OUT, 'course-data.json'), JSON.stringify(sanitizedCourseData, null, 2));

// Copy unchanged assets
fs.copyFileSync(path.join(SRC, 'design-tokens-v2.json'), path.join(OUT, 'design-tokens-v2.json'));
fs.copyFileSync(path.join(SRC, 'label-placement-v2.js'), path.join(OUT, 'label-placement-v2.js'));
fs.copyFileSync(path.join(SRC, 'course-display-v2.js'), path.join(OUT, 'course-display-v2.js'));
fs.copyFileSync(path.join(SRC, 'Images', 'illustrated-course-river-corrected-v3.svg'), path.join(OUT, 'Images', 'illustrated-course-river-corrected-v3.svg'));

// Transform sign-design-v2.html into zoom-enabled docs/index.html
const sourceHtml = fs.readFileSync(path.join(SRC, 'sign-design-v2.html'), 'utf8');

// Inject zoom viewport wrapper and controls
const zoomStyles = `
/* Zoom viewport styles - override body grid to fixed viewport */
body{display:block;overflow:hidden;padding:0;height:100vh;width:100vw}
.zoom-viewport{position:fixed;top:0;left:0;right:0;bottom:0;overflow:auto;cursor:grab;background:#D9E0D9;padding:28px}
.zoom-viewport:active{cursor:grabbing}
.zoom-content{transform-origin:0 0;position:relative;display:inline-block}
.zoom-controls{position:fixed;bottom:24px;right:24px;display:flex;gap:8px;z-index:100;font-family:Inter,Arial,sans-serif}
.zoom-controls button{width:40px;height:40px;border:none;border-radius:8px;background:var(--paper,#F4F3ED);color:var(--ink,#20383C);font-size:18px;font-weight:600;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.15);transition:background .15s,transform .1s}
.zoom-controls button:hover{background:#E8E7E1}
.zoom-controls button:active{transform:scale(.95)}
.zoom-controls .zoom-level{min-width:52px;height:40px;display:flex;align-items:center;justify-content:center;background:var(--paper,#F4F3ED);border-radius:8px;font-size:12px;font-weight:600;box-shadow:0 2px 8px rgba(0,0,0,.15)}
`;

const zoomControlsHtml = `<div class="zoom-controls" id="zoom-controls">
 <button id="zoom-out" title="Zoom out">−</button>
 <div class="zoom-level" id="zoom-level">100%</div>
 <button id="zoom-in" title="Zoom in">+</button>
 <button id="zoom-reset" title="Reset zoom">⟲</button>
</div>`;

const zoomScript = `
// Zoom and pan controls
const zoomState = { scale: 1, minScale: 0.25, maxScale: 4 };
const viewport = document.getElementById('zoom-viewport');
const content = document.getElementById('zoom-content');
const zoomLevelEl = document.getElementById('zoom-level');

function updateZoom(newScale, centerX, centerY) {
  const oldScale = zoomState.scale;
  zoomState.scale = Math.max(zoomState.minScale, Math.min(zoomState.maxScale, newScale));
  content.style.transform = \`scale(\${zoomState.scale})\`;
  // Set explicit dimensions so scrollable area grows with zoom
  content.style.width = (WIDTH * zoomState.scale) + 'px';
  content.style.height = (HEIGHT * zoomState.scale) + 'px';
  zoomLevelEl.textContent = Math.round(zoomState.scale * 100) + '%';
  if (centerX !== undefined && centerY !== undefined) {
    const ratio = zoomState.scale / oldScale;
    viewport.scrollLeft = centerX * ratio - (centerX - viewport.scrollLeft);
    viewport.scrollTop = centerY * ratio - (centerY - viewport.scrollTop);
  }
}

function fitToViewport() {
  const vw = viewport.clientWidth;
  const vh = viewport.clientHeight;
  const scale = Math.min(vw / WIDTH, vh / HEIGHT, 1);
  updateZoom(scale);
  setTimeout(() => {
    const contentW = WIDTH * zoomState.scale;
    const contentH = HEIGHT * zoomState.scale;
    viewport.scrollLeft = Math.max(0, (contentW - vw) / 2);
    viewport.scrollTop = Math.max(0, (contentH - vh) / 2);
  }, 0);
}

document.getElementById('zoom-in').addEventListener('click', () => updateZoom(zoomState.scale * 1.25));
document.getElementById('zoom-out').addEventListener('click', () => updateZoom(zoomState.scale / 1.25));
document.getElementById('zoom-reset').addEventListener('click', fitToViewport);

viewport.addEventListener('wheel', e => {
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    const rect = viewport.getBoundingClientRect();
    const centerX = e.clientX - rect.left + viewport.scrollLeft;
    const centerY = e.clientY - rect.top + viewport.scrollTop;
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    updateZoom(zoomState.scale * delta, centerX, centerY);
  }
}, { passive: false });

let lastTouchDist = 0;
viewport.addEventListener('touchstart', e => {
  if (e.touches.length === 2) {
    lastTouchDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
  }
});
viewport.addEventListener('touchmove', e => {
  if (e.touches.length === 2) {
    e.preventDefault();
    const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
    if (lastTouchDist > 0) updateZoom(zoomState.scale * (dist / lastTouchDist));
    lastTouchDist = dist;
  }
}, { passive: false });
`;

let outputHtml = sourceHtml;

// Insert zoom styles before </style>
outputHtml = outputHtml.replace('</style>', zoomStyles + '</style>');

// Replace print media query entirely for proper zoom handling
// Match from @media print{ to the final }} (the line ends with }})
outputHtml = outputHtml.replace(
  /@media print\{[^]*?print-color-adjust:exact\}\}/,
  `@media print{@page{size:48in 32in;margin:0}body{display:block;overflow:visible;padding:0;height:auto;width:auto;background:white}.zoom-viewport{position:static;overflow:visible;height:auto;width:auto;padding:0;cursor:auto}.zoom-content{transform:none!important;width:auto!important;height:auto!important}.proof-stage{width:48in!important;height:32in!important}.sign{transform:scale(2.88)!important;transform-origin:top left}.zoom-controls{display:none!important}*{-webkit-print-color-adjust:exact;print-color-adjust:exact}}`
);

// Wrap proof-stage in zoom viewport
outputHtml = outputHtml.replace(
  '<div class="proof-stage" id="proof-stage">',
  '<div class="zoom-viewport" id="zoom-viewport">\n<div class="zoom-content" id="zoom-content">\n<div class="proof-stage" id="proof-stage">'
);
outputHtml = outputHtml.replace(
  '</main></div>',
  '</main></div>\n</div>\n</div>\n' + zoomControlsHtml
);

// Remove the old scaleProof function completely
outputHtml = outputHtml.replace(/function scaleProof\(\)\{[^}]+\}/, '');

// Replace scaleProof() call inside load() with fitToViewport()
outputHtml = outputHtml.replace(/;scaleProof\(\);document\.documentElement\.dataset\.ready/, ';fitToViewport();document.documentElement.dataset.ready');

// Inject zoom script before load() call
outputHtml = outputHtml.replace(
  /async function load\(\)/,
  zoomScript + '\nasync function load()'
);

// Replace the final line that calls scaleProof with fitToViewport
outputHtml = outputHtml.replace(
  /addEventListener\('resize',\s*scaleProof\);\s*scaleProof\(\);\s*load\(\);/,
  "addEventListener('resize', fitToViewport);\nload();"
);

fs.writeFileSync(path.join(OUT, 'index.html'), outputHtml);

// Validation
const totalHoles = sanitizedGeometry.main18.length;
const totalDistanceEntries = sanitizedGeometry.layouts.reduce((sum, l) => sum + l.holes.length, 0);
console.log('Deployment bundle built in docs/');
console.log(`Validated: ${totalHoles} holes, ${totalDistanceEntries} distance entries (expected 72)`);
console.log('Files:', fs.readdirSync(OUT).join(', '));
console.log('Images:', fs.readdirSync(path.join(OUT, 'Images')).join(', '));
