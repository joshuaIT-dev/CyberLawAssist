"""Build 1,000 different scenario/facet pairs per language plus direct FAQs."""
from collections import Counter
import json
from pathlib import Path

from corpus import TOPICS
from facets import FACETS, ROUTES
from faqs import FAQS, SOURCES

ROOT = Path(__file__).resolve().parent
LANGUAGES = ("en", "tl", "taglish")


def build():
    folder = ROOT / "data"
    folder.mkdir(exist_ok=True)
    manifest = {"format_version": 1, "method": "50 scenarios x 20 distinct question facets, plus direct FAQs", "review_status": "Authored prototype guidance; not certified or reviewed by PAO", "counts": {}}
    for language in LANGUAGES:
        rows = []
        for topic, category, translations in TOPICS:
            scenario, overview, action, evidence = translations[language]
            for facet, versions in FACETS:
                question, answer = versions[language]
                rows.append({"id": f"{topic}.{facet}.{language}", "intent_id": f"{topic}.{facet}", "topic": topic, "facet": facet, "category": category, "language": language,
                             "question": f"{scenario} {question}", "answer": f"{overview}\n\n" + answer.format(action=action, evidence=evidence, route=ROUTES[language]),
                             "sources": ["ra10175", "pao"] + (["npc"] if category in {"privacy", "sensitive", "children", "identity"} else ["cybersecurity"])})
        for entry in FAQS:
            question, answer = entry["text"][language]
            rows.append({"id": f"faq.{entry['id']}.{language}", "intent_id": f"faq.{entry['id']}", "topic": entry["id"], "facet": "faq", "category": "information", "language": language,
                         "question": question, "answer": answer, "sources": entry["sources"], "aliases": entry.get("aliases", [])})
        assert len(TOPICS) == 50 and len(FACETS) == 20
        assert len(rows) >= 1000
        for field in ("id", "question", "answer"):
            duplicates = [value for value, count in Counter(row[field] for row in rows).items() if count > 1]
            assert not duplicates, (language, field, duplicates[:2])
        assert all(row["answer"].strip() and set(row["sources"]) <= SOURCES.keys() for row in rows)
        (folder / f"qa_{language}.json").write_text(json.dumps(rows, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        manifest["counts"][language] = len(rows)
    (folder / "sources.json").write_text(json.dumps(SOURCES, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (folder / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(manifest["counts"]))


if __name__ == "__main__":
    build()
