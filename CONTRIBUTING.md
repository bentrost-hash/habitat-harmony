# Contributing

Thanks for helping keep Habitat Harmony useful.

## Data corrections

Open an issue with the species, the observed in-game behavior, mode/settings,
and an in-game Zoopedia screenshot or credible source. Do not submit a
compatibility matrix replacement without provenance.

## Code changes

Keep the app dependency-free and usable by opening `index.html` directly.
Run the checks before opening a pull request:

```powershell
python tools/validate_data.py data/animals.json
node tests/engine.test.js
```

Please preserve source attribution and explain any scoring or normalization
change in `DATA_SOURCES.md`.
