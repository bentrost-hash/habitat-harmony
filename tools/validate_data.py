"""Validate the normalized offline dataset."""
import json
import sys


def main(path):
    data = json.load(open(path, encoding="utf-8"))
    animals = data["animals"]
    ids = [a["id"] for a in animals]
    names = [a["name"] for a in animals]
    failures = []
    if len(ids) != len(set(ids)): failures.append("Duplicate IDs")
    if len(names) != len(set(names)): failures.append("Duplicate names")
    known = set(ids)
    for animal in animals:
        if not all(key in animal for key in ("id", "name", "dlc", "temperature", "compatibility")):
            failures.append(f"Missing required field: {animal.get('name')}")
        temp = animal["temperature"]
        if not temp or temp["min"] > temp["max"]:
            failures.append(f"Invalid temperature: {animal['name']}")
        for partner in animal["interspeciesEnrichment"]:
            if partner not in known: failures.append(f"Unknown enrichment partner: {animal['name']} → {partner}")
            elif animal["id"] not in next(a for a in animals if a["id"] == partner)["interspeciesEnrichment"]:
                failures.append(f"Asymmetric enrichment: {animal['name']} ↔ {partner}")
        for partner, rating in animal["compatibility"].items():
            if partner not in known: failures.append(f"Unknown partner: {animal['name']} → {partner}")
            elif next(a for a in animals if a["id"] == partner)["compatibility"].get(animal["id"]) != rating:
                failures.append(f"Asymmetric compatibility: {animal['name']} ↔ {partner}")
    if failures:
        print("Validation failed:\n- " + "\n- ".join(failures[:25])); return 1
    print(f"Validation passed: {len(animals)} animals, {sum(len(a['compatibility']) for a in animals)//2} pairs")
    return 0


if __name__ == "__main__": sys.exit(main(sys.argv[1]))
