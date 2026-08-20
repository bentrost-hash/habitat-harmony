# Data sources and research report

## Recommendation and completeness

This project uses **Villanelle's Planet Zoo Data Chest, final complete release (14 November 2025)** as its primary source. The workbook includes 167 habitat species through the Asia Animal Pack, together with DLC, origin, biome, temperature, land, barrier, swimming/deep-diving, climbing, walkthrough, enrichment, behavior and a complete compatibility matrix. The app excludes exhibit-only species because they cannot share standard habitats.

Primary source: https://docs.google.com/spreadsheets/d/1J5YrIya-yduiAqBC-dEHyBYZ8Ev3KsTM6fyP7DsKUJQ/edit

Release announcement and methodology: https://www.reddit.com/r/PlanetZoo/comments/1owwio3/villanelles_planet_zoo_data_chest_fully_updated/

Official DLC cross-checks:

- Frontier/Steam Americas Animal Pack: https://store.steampowered.com/app/3473820/Planet_Zoo_Americas_Animal_Pack/
- Planet Zoo DLC catalog: https://store.steampowered.com/dlc/703080/Planet_Zoo/

## Sources evaluated but not adopted as authoritative

- `msarczar/Planet-Zoo-Animal-Compatibility`: MIT-licensed static checker derived from an earlier version of Villanelle's workbook. Its May 2024 release covered the Barnyard Pack and therefore omitted later packs. Useful as a UX and result cross-check, but no longer the best roster source. https://github.com/msarczar/Planet-Zoo-Animal-Compatibility
- `connorlunsford/planet-zoo-compatibility-finder`: a recursive clique finder over a numeric CSV derived from BBarbeito's older list. It does ensure every pair in a group clears a threshold, but has no current DLC provenance or welfare-factor explanations. https://github.com/connorlunsford/planet-zoo-compatibility-finder
- Senginous' Habitat Husbandry Guide / Planet Zoo planners: useful interactive planning references, but not selected because a reproducible, downloadable current data artifact with clearer provenance was available.
- Fan wikis/Zoopedia pages: useful spot checks, but page-by-page extraction is harder to reproduce and does not provide the same reviewed all-pairs compatibility matrix.

## What “compatible” means

The Data Chest author describes a compatible match as a non-predatory pairing sharing both an origin (foliage availability) and a biome (terrain and temperature needs), allowing 100% welfare in franchise, campaign, and default sandbox settings. The source matrix also incorporates reviewed exceptions and grades pairs from 0–3, with a star for in-game interspecies enrichment.

The app preserves that distinction:

| Source value | App label | Meaning |
|---|---|---|
| Star | Interspecies enrichment | The game recognizes the relationship for enrichment. |
| 3 | Excellent | Safe, strong welfare overlap. |
| 2 | Compatible | Safe and practical with modest planning differences. |
| 1 | Possible with compromises | A meaningful welfare/habitat compromise remains. |
| 0 | Incompatible | Safety, aggression, predation, or full-welfare requirements prevent a recommended shared habitat. |

The numeric value is an ordinal category, not a percentage. The UI always shows the contributing source facts (temperature intersection, shared biome/origin, water and climbing requirements) and identifies the matrix as the final authority when the workbook contains a reviewed exception.

In optional **Relaxed foliage** mode, source rating 2 is displayed as excellent because the Data Chest author states that these peaceful pairs can reach full welfare when Sandbox plant-origin preferences are disabled. The original source rating remains attached to the comparison and is disclosed in the UI. Safety ratings, compromises and incompatibilities are never upgraded by this setting.

## Multi-species algorithm

Every unordered pair in a proposed habitat is evaluated. The overall result is the lowest pair rating; an enrichment star is treated as excellent for the overall group verdict. Temperature ranges are intersected across every species. Shared biomes and continents must appear for every species. The land number shown is the largest published family-group baseline, clearly labeled as a baseline rather than a final mixed-population area.

“Best next species” evaluates every unselected owned-DLC animal against every species already in the builder. Candidates whose worst pair scores below Compatible are excluded, then results are ranked by worst pair, number of enrichment matches, average score and name. This is deterministic and uses the same engine as the final habitat verdict.

## Data-quality findings and limitations

- Three directional source cells disagree for Galapagos Giant Tortoise paired with African Leopard, Bush Dog, or Coyote. The normalizer records these in `data/normalization-report.json` and takes the more restrictive value for safety.
- The final source workbook's compact habitat table does not expose exact terrain-percentage and plant-coverage ranges for every species. The source compatibility matrix's welfare grades account for terrain/foliage methodology, but this app does not invent exact percentages. The comparison UI states this limitation.
- “Aggressive” is source behavior metadata, not by itself a universal predator label. Safety decisions use the reviewed pair matrix rather than a blanket aggressive/species rule.
- Game updates or mods can change behavior. The app is a planning aid and the current in-game Zoopedia remains the final check.
- Enrichment stars are normalized symmetrically for discovery. Directional raw ratings are reviewed during normalization.

## Update and validation path

`source-data.xlsx` is a local source snapshot. `tools/update_data.py` transforms it into `data/animals.json` and `data/animals.js`; the JavaScript copy lets `index.html` work directly from disk without a server. `tools/validate_data.py` checks required fields, duplicate IDs/names, range validity, missing references, and symmetric relationships.
