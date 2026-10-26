# Fields of Dreams Course Guide — Deployment

## Repository

- **GitHub**: https://github.com/DarkMatterGravity/fields-of-dreams-course-guide
- **Public URL**: https://darkmattergravity.github.io/fields-of-dreams-course-guide/
- **Status**: Deployed and verified 2026-10-26

## Files

### Source (version-controlled)
| File | Purpose |
|------|---------|
| `sign-design-v2.html` | Editable source design proof |
| `build-deploy.mjs` | Build script - copies the approved centered proof into deployment |
| `course-geometry-reference.json` | Full course geometry (sanitized for deployment) |
| `course-data.json` | Registration transform data |
| `design-tokens-v2.json` | Color palette |
| `label-placement-v2.js` | Hole label positioning algorithm |
| `course-display-v2.js` | Coordinate projection with tee5 offset |
| `Images/illustrated-course-river-corrected-v3.svg` | Course artwork |

### Deployed (`docs/` folder - GitHub Pages source)
| File | Purpose |
|------|---------|
| `index.html` | Centered proof (generated from sign-design-v2.html) |
| `course-geometry-reference.json` | Sanitized geometry (only consumed fields) |
| `course-data.json` | Sanitized to registration affine only |
| `design-tokens-v2.json` | Color palette (unchanged) |
| `label-placement-v2.js` | Label algorithm (unchanged) |
| `course-display-v2.js` | Projection (unchanged) |
| `Images/illustrated-course-river-corrected-v3.svg` | Artwork (unchanged) |

## Build & Update Process

### Prerequisites
- Node.js 18+
- GitHub CLI (`gh`) authenticated

### Making Design Changes

1. Edit `sign-design-v2.html` for visual/layout changes
2. Rebuild deployment bundle:
   ```bash
   node build-deploy.mjs
   ```
3. Verify locally by opening `docs/index.html` in browser
4. Commit and push:
   ```bash
   git add docs/ sign-design-v2.html
   git commit -m "Update course design"
   git push
   ```
5. GitHub Pages auto-deploys from `docs/` folder

### Updating Course Data

1. Update source JSON files as needed
2. Rebuild: `node build-deploy.mjs`
3. Commit and push changes

## Validation Checklist

Current route treatment: 1.9px yellow/orange strokes over a 2.9px title-ink outline. The hole 6 orange basket and hole 10 long tee have illustration offsets in `course-display-v2.js`; the coincident route vertices use the same offsets. Source coordinates and distance data remain intact.

After each deployment, verify:

- [ ] 18 hole labels visible on maps (woodland loop 1-14, field loop 15-18)
- [ ] 72 distance entries in scorecards (4 layouts × 18 holes)
- [ ] Proof is centered and fits the browser with no custom zoom controls

## Excluded from Repository

The following are explicitly NOT published:
- `.claude/` - AI session data
- `research/` - Working analysis files
- Credentials and API keys
- Raw UDisc account responses
- Unrelated source materials

## Technology

- Static HTML/CSS/JavaScript (no build framework)
- GitHub Pages hosting from `docs/` folder
- Responsive centered proof, automatically sized to fit the browser
- Print-optimized at 48×32 inches
