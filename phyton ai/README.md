# CyberLawAssist offline NLP

## Start

Double-click **start-ai.bat** and leave that window open. Start Apache in XAMPP, then open `http://localhost/CyberLawAssist/pages/guest-chatbot.html` (or the User/Admin Chatbot tab).

The existing local Python environment can run the bot now. On another computer, install Python 3.10+ or uv and run `setup-ai.ps1` once. No model download, cloud key, or internet connection is needed for replies. The website's existing Lucide CDN still needs internet for icons; it is separate from the AI.

For the FastAPI server, install its two packages once while connected:

```powershell
cd 'C:\Users\nope\Downloads\xampp\htdocs\CyberLawAssist\phyton ai'
powershell -ExecutionPolicy Bypass -File .\setup-ai.ps1 -FastApi
powershell -ExecutionPolicy Bypass -File .\start-ai.ps1
```

The launcher uses FastAPI/Uvicorn when installed, otherwise a built-in Python HTTP server with the same endpoints. Both use exactly the same local NLP engine and dataset. Port: **8001**. Close the window or press Ctrl+C to stop it. Package downloads were blocked in the coding environment, so FastAPI itself could not be installed there.

### Phone on the same Wi-Fi

Keep Python bound to `127.0.0.1` and open the website using the XAMPP computer's LAN IP, for example `http://192.168.1.20/CyberLawAssist/`. The PHP backend forwards requests to the local Python service. Phones need access to Apache only; Python port 8001 does not need to be exposed on the network. `-Lan` remains an option for direct API development.

## What was built

- `data/qa_en.json`: **1,023** English Q&A pairs.
- `data/qa_tl.json`: **1,023** Tagalog Q&A pairs.
- `data/qa_taglish.json`: **1,023** Taglish Q&A pairs.
- **3,069 total**, with unique questions and answers within each language.
- 50 distinct scenarios × 20 information needs = 1,000, plus 23 direct FAQs per language. These are authored scenario/template combinations, not 3,069 independently researched legal issues.
- Local TF-IDF word/bigram retrieval, character matching for spelling variations, common abbreviation normalization, short follow-up context, and explicit or automatic reply language.
- Unmatched questions request clarification. The engine retrieves prepared answers; it is not a generative LLM, does not learn automatically from chats, and cannot answer arbitrary subjects.
- Saved conversations, sources, suggestions, request progress, and retry without duplicating the original question. An answer remains attached to its original conversation if you switch tabs or start a new chat.

Automatic language detection is heuristic; select English, Tagalog, or Taglish for predictable output. `match_score` measures text similarity, not confidence in a legal conclusion.

## Local API

`GET http://127.0.0.1:8001/api/health` shows language counts and readiness.

`POST http://127.0.0.1:8001/api/chat` accepts JSON:

```json
{"message":"Na-scam ako sa GCash, ano ang first step?","language":"taglish","context_topic":null}
```

Language values: `auto`, `en`, `tl`, `taglish`. Messages: 1–2,000 characters. Response includes `answer`, `language`, `topic`, `intent_id`, `kind`, `sources`, `suggestions`, and `elapsed_ms`. Pass the previous `topic` for short follow-up questions. The server keeps no conversation database and does not send messages to an internet service. Existing browser history remains stored locally by role.

## Review and update the content

Edit `corpus.py` (50 scenarios), `facets.py` (20 question types), or `faqs.py` (direct FAQs and references). Then run:

```powershell
.\.venv\Scripts\python.exe build_dataset.py
```

Restart the local server after changes. The generator checks minimum counts, unique IDs/questions/answers, and valid references. `data/manifest.json` records how the dataset was assembled.

This is a prototype information corpus, **not reviewed or certified by PAO**. Have an authorized legal reviewer check translations and guidance before public deployment. It does not decide guilt, predict case outcomes, file complaints, recover accounts, or book appointments. Office contact details were supplied by the project owner; hours and current requirements must be confirmed directly. No live legal updates are fetched while offline.

Sources used as references for the original plain-language guidance (reviewed October 18, 2026):

- [RA 10175 statutory text](https://lawphil.net/statutes/repacts/ra2012/ra_10175_2012.html)
- [Supreme Court: Disini v. Secretary of Justice](https://elibrary.judiciary.gov.ph/thebookshelf/showdocs/1/56650)
- [PAO services and eligibility](https://pao.gov.ph/services-2/)
- [National Privacy Commission complaint guidance](https://privacy.gov.ph/file-a-complaint-2/)
- [CISA: Secure Our World](https://www.cisa.gov/secure-our-world)

Source links open online only when clicked; their contents are not downloaded during replies. The prepared answers already contain the local guidance.
