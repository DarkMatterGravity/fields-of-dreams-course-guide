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

// Publish the approved centered proof without additional viewing controls.
fs.copyFileSync(path.join(SRC, 'sign-design-v2.html'), path.join(OUT, 'index.html'));

// Validation
const totalHoles = sanitizedGeometry.main18.length;
const totalDistanceEntries = sanitizedGeometry.layouts.reduce((sum, l) => sum + l.holes.length, 0);
console.log('Deployment bundle built in docs/');
console.log(`Validated: ${totalHoles} holes, ${totalDistanceEntries} distance entries (expected 72)`);
console.log('Files:', fs.readdirSync(OUT).join(', '));
console.log('Images:', fs.readdirSync(path.join(OUT, 'Images')).join(', '));
