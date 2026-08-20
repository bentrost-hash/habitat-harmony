# Habitat Harmony

A fast, offline Planet Zoo habitat compatibility companion. Search one of 167 current habitat species, compare two animals, or build a multi-species habitat that checks every pair.

## Community-ready extras

- DLC ownership filter, remembered locally
- Named habitat plans, saved only on your device
- Copyable habitat links (`?habitat=...`) for sharing an exact group or bug report
- Full-welfare and relaxed-foliage planning modes
- Whole-group “best next species” recommendations that score every candidate against every selected animal
- A GitHub Pages workflow and contribution guide for a hosted community edition

Before a public release, read `NOTICE.md`: the source workbook has clear attribution but no explicit redistribution license found during research. Get the data author's permission before publishing the normalized dataset or deploying it publicly.

`COMMUNITY_LAUNCH.md` includes a permission-request message, Reddit post draft,
and launch checklist.

## Launch

Double-click `index.html`. No server, account, installation, telemetry, or internet connection is required.

## Features

- Search-as-you-type discovery with enrichment kept separate from general compatibility
- Transparent pair comparisons with temperature, biome, origin, water, and safety evidence
- Multi-species whole-group checking and shared requirement intersections
- Current DLC/pack labels and offline structured data
- Reproducible normalization and validation scripts

## Verify

With Node.js and Python available:

```powershell
node tests/engine.test.js
python tools/validate_data.py data/animals.json
```

To rebuild the app data from a new exported workbook:

```powershell
python tools/update_data.py source-data.xlsx data/animals.json
```

See `DATA_SOURCES.md` for research, scoring, provenance, known source discrepancies, and limitations.
