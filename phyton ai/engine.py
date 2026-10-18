"""Offline multilingual FAQ retrieval: TF-IDF, character matching, and safe fallbacks."""
from collections import Counter, defaultdict
import json
import math
from pathlib import Path
import re
import unicodedata

ROOT = Path(__file__).resolve().parent
STOP = set("a an the i my me we us you your of to and or in on at from for is are was were be been being do does did what how who where when can could should would will it this that these those about please with as have has had just some need help got tell know want get something ako ko akin ang ng sa na mga isang si niya nila mo ka po opo ba ay at o nang itong ito iyon yung iyong din rin kasi ano paano saan kailan bakit".split())
REPLACE = {"fb":"facebook", "gcash":"ewallet", "maya":"ewallet", "ewallets":"ewallet", "scammed":"scam", "scamming":"scam", "phising":"phishing", "hacked":"hacking", "hack":"hacking", "nahack":"hacking", "threatening":"threat", "threats":"threat", "binabantaan":"threat", "banta":"threat", "pekeng":"fake", "peke":"fake", "ebidensya":"evidence", "larawan":"photo", "photos":"photo", "pictures":"photo", "pano":"paano", "anu":"ano", "aq":"ako", "q":"ko"}
TL_WORDS = set("ano paano saan kailan bakit ako ko ang ng sa may po ba hindi wala ito iyon mga akin salamat gagawin kailangan nang na mag".split())
EN_WORDS = set("what how where when why my someone is are was were i the please thanks thank first should can do help received send need with without and after before me".split())
TOPIC_TERMS = {
 "facebook_takeover":"facebook hacked fb takeover na hack facebook", "email_takeover":"email hacked gmail yahoo outlook takeover", "messenger_impersonation":"messenger friend asking money nangutang kaibigan messenger", "instagram_impersonation":"instagram copied photos impersonation ig", "unauthorized_login":"unrecognized unfamiliar login device session alert",
 "password_reset_scam":"password reset unexpected link", "otp_scam":"otp verification code caller scam", "sim_swap":"sim swap no service lost signal", "phishing_email":"phishing suspicious email", "phishing_sms":"smishing suspicious text sms link",
 "fake_website":"fake phishing website entered information", "malware_attachment":"malware attachment suspicious file", "ransomware":"ransomware locked files ransom encrypted", "stolen_phone":"stolen phone ninakaw telepono", "lost_device":"lost laptop missing device nawala laptop",
 "shopping_non_delivery":"online order not delivered item never arrived nothing arrived did not receive item hindi dumating order", "fake_seller":"seller vanished deposit blocked seller", "fake_payment_receipt":"fake payment receipt screenshot buyer no money", "ewallet_scam":"gcash maya ewallet scam transfer", "bank_transfer_scam":"bank transfer scam fraud",
 "investment_scam":"investment guaranteed returns withdrawals", "crypto_scam":"crypto cryptocurrency wallet release fee bitcoin", "job_scam":"job hiring recruitment upfront fee", "romance_scam":"romance relationship boyfriend girlfriend emergency money", "fake_prize":"prize lottery winner processing fee",
 "fake_loan":"loan advance deposit approval", "delivery_scam":"courier redelivery parcel delivery fee", "government_impersonation":"government officer official impersonation payment", "recovery_scam":"account recovery hacker recovery fee", "refund_scam":"refund agent remote access screen control",
 "online_threat":"threat harm violence sasaktan papatayin", "persistent_harassment":"repeated abusive harassment bullying messages stop", "child_cyberbullying":"child student school class group cyberbullying anak bully", "doxxing":"doxxing exposed address phone number tirahan", "intimate_image_threat":"sextortion intimate image threat leak private photo pay",
 "shared_intimate_image":"intimate private image shared published without consent", "edited_defamatory_post":"edited altered photo defamatory reputation", "false_accusation":"false accusation paninirang puri social media", "fake_profile":"fake profile account copied name identity dummy pekeng profile facebook", "identity_theft":"identity theft stolen id documents unauthorized account opened",
 "loan_app_harassment":"loan app contacts harassment collections", "workplace_data_leak":"employer workplace employee personal data leak", "school_data_leak":"school student data leak published records", "photo_without_permission":"photo published without permission consent larawan", "location_tracking":"location tracking phone GPS stalker",
 "partner_spyware":"partner spyware monitoring spouse device", "business_email_fraud":"business email compromise manager supplier bank invoice", "unauthorized_purchase":"unauthorized card purchase credit debit charge", "online_extortion":"extortion blackmail demand money private information", "child_exploitation":"child adult sexual image request grooming exploitation"
}

# Explicit information needs prevent a generic incident from matching an arbitrary facet.
FACET_PATTERNS = [
 ("follow_up", r"follow up|followup|susubaybay|status.*(?:report|case)"),
 ("deadlines", r"deadline|how long|filing period|gaano.*katagal|palugit"),
 ("screenshots", r"(?:screenshot|proof|patunay).*(?:enough|sapat|prove)|(?:enough|sapat).*screenshot"),
 ("deleting", r"delete|deleting|burahin|magbura|i delete"),
 ("timeline", r"timeline|time order|pagkakasunod|salaysay"),
 ("unknown_person", r"unknown|real name|tunay na pangalan|hindi.*kilala"),
 ("outside_city", r"outside.*muntinlupa|labas.*muntinlupa|jurisdiction|hurisdiksyon"),
 ("office_preparation", r"prepare.*(?:visit|office)|bring.*office|ihahanda|ipe prepare|dadalhin"),
 ("legal_assessment", r"proven crime|automatically|automatic|awtomatiko|guilty|mananalo|win.*case"),
 ("private_information", r"avoid sharing|private info|pribadong impormasyon|hindi.*(?:share|ibigay)"),
 ("contact_suspect", r"keep replying|mag reply|sumagot|retaliate|gumanti|meet.*suspect"),
 ("assistant_limits", r"chatbot.*(?:help|maitutulong|kaya)|(?:help|maitutulong|kaya).*chatbot"),
 ("safety", r"immediate danger|agarang panganib|emergency"),
 ("account_security", r"protect.*account|secure.*account|account.*security|mapoprotektahan"),
 ("evidence", r"evidence|screenshot|ebidens|itabi|i save|preserv|what.*save"),
 ("reporting", r"report|reklamo|mag ulat|magreklamo|sumbong"),
 ("lawyer", r"legal help|lawyer|abogado|tulong legal|lumapit.*pao"),
 ("money", r"money.*(?:also|involved)|pera.*sangkot|sangkot.*pera|refund|reversal"),
 ("minor_involved", r"what changes.*child|kung may.*(?:child|batang).*involved|batang sangkot"),
]


def question_facet(clean):
    return next((facet for facet, pattern in FACET_PATTERNS if re.search(pattern, clean)), "first_steps")


def normalize(value):
    value = "".join(c for c in unicodedata.normalize("NFKD", value.casefold()) if not unicodedata.combining(c))
    value = re.sub(r"\bra\s*10175\b", "ra 10175", value)
    return " ".join(REPLACE.get(w, w) for w in re.findall(r"[a-z0-9]+", value))


def features(value):
    words = [word for word in normalize(value).split() if word not in STOP]
    return words + [a + ":" + b for a, b in zip(words, words[1:])]


def grams(value):
    text = normalize(value)
    return {text[i:i + 3] for i in range(max(0, len(text) - 2))}


def detect_language(message):
    words = set(re.findall(r"[a-z]+", message.casefold()))
    tl, en = len(words & TL_WORDS), len(words & EN_WORDS)
    if tl and en:
        return "taglish"
    return "tl" if tl else "en"


class OfflineBot:
    def __init__(self, directory=ROOT / "data"):
        self.rows, self.by_intent, self.exact = [], defaultdict(dict), {}
        for language in ("en", "tl", "taglish"):
            rows = json.loads((directory / f"qa_{language}.json").read_text(encoding="utf-8"))
            if len(rows) < 1000:
                raise ValueError(f"Expected at least 1000 Q&A pairs for {language}")
            for row in rows:
                self.by_intent[row["intent_id"]][language] = row
                self.exact[normalize(row["question"])] = row["intent_id"]
                for alias in row.get("aliases", []):
                    self.exact[normalize(alias)] = row["intent_id"]
                self.rows.append(row)
        self.sources = json.loads((directory / "sources.json").read_text(encoding="utf-8"))
        self.counts = dict(Counter(row["language"] for row in self.rows))
        self.postings, self.char_postings = defaultdict(list), defaultdict(list)
        documents = [Counter(features(row["question"] + " " + " ".join(row.get("aliases", [])) + " " + TOPIC_TERMS.get(row["topic"], ""))) for row in self.rows]
        frequency = Counter(term for doc in documents for term in doc)
        self.idf = {term: math.log((len(documents) + 1) / (count + 1)) + 1 for term, count in frequency.items()}
        self.char_sets = []
        for index, (row, counts) in enumerate(zip(self.rows, documents)):
            vector = {term: (1 + math.log(count)) * self.idf[term] for term, count in counts.items()}
            norm = math.sqrt(sum(weight * weight for weight in vector.values())) or 1
            for term, weight in vector.items():
                self.postings[term].append((index, weight / norm))
            char_set = grams(row["question"])
            self.char_sets.append(char_set)
            for gram in char_set:
                self.char_postings[gram].append(index)

    def result(self, intent, language, score, kind="matched"):
        row = self.by_intent[intent][language]
        return {"answer": row["answer"], "language": language, "topic": row["topic"] if row["topic"] in TOPIC_TERMS else None, "intent_id": intent,
                "matched_question": row["question"], "match_score": round(score, 4), "kind": kind,
                "sources": [{"id": key, **self.sources[key]} for key in row["sources"]],
                "suggestions": self.suggestions(row["topic"], language)}

    def suggestions(self, topic, language):
        if topic in TOPIC_TERMS:
            return [self.by_intent[f"{topic}.{facet}"][language]["question"] for facet in ("first_steps", "evidence", "reporting")]
        return [self.by_intent[f"faq.{name}"][language]["question"] for name in ("ra10175", "reporting", "office_address")]

    def reply(self, message, language="auto", context_topic=None):
        if language not in {"auto", "en", "tl", "taglish"}:
            raise ValueError("Unsupported response language")
        if not isinstance(message, str) or not message.strip() or len(message) > 2000:
            raise ValueError("Message must contain 1–2000 characters")
        language = detect_language(message) if language == "auto" else language
        clean = normalize(message)
        if re.search(r"\b(hurt|kill|attack) (me|us) (right )?now\b|\b(sasaktan|papatayin) (ako|kami) ngayon\b|\b(kill myself|magpakamatay)\b", clean):
            return self.result("faq.emergency", language, 1, "urgent")
        if re.search(r"(how|paano).{0,25}hack(?:ing)?.{0,40}(someone|neighbor|neighbour|friend|iba|kapitbahay).{0,20}account|(how|paano).{0,25}hack(?:ing)?.{0,25}account.{0,25}(iba|someone|friend|kapitbahay)", clean):
            answer = {"en":"I can help protect accounts you are authorized to use, but I cannot help break into someone else's account. Describe your own account-security concern or use the provider's official recovery process.", "tl":"Maaari akong tumulong sa pagprotekta ng awtorisado mong account, ngunit hindi sa pagpasok sa account ng iba nang walang pahintulot. Ilarawan ang suliranin ng sarili mong account o gamitin ang opisyal na pagbawi.", "taglish":"Puwede akong tumulong i-protect ang authorized accounts mo, pero hindi sa pag-break into account ng iba. Describe your own account concern o gamitin ang official recovery process."}[language]
            return {"answer": answer, "language": language, "topic": None, "intent_id": None, "matched_question": None, "match_score": 0, "kind":"safe_redirect", "sources":[], "suggestions":self.suggestions(None, language)}
        if clean in self.exact:
            if context_topic in TOPIC_TERMS and self.exact[clean] == "faq.evidence_general":
                return self.result(f"{context_topic}.evidence", language, 1)
            return self.result(self.exact[clean], language, 1)
        query = message
        explicit_topic = re.search(r"facebook|ewallet|email|sms|instagram|messenger|\bsim\b|\botp\b|ransomware|loan|harass|bully|threat|\bjob\b|seller|phishing|crypto|\bbank\b|shopping|investment|spyware|tracking|\bchild\b|\bbata\b|\banak\b|data leak", clean)
        contextual = context_topic in TOPIC_TERMS and not explicit_topic and question_facet(clean) != "first_steps" and len(clean.split()) <= 12
        if contextual:
            query += " " + self.by_intent[f"{context_topic}.first_steps"][language]["question"].split(". ")[0]
        counts = Counter(features(query))
        vector = {term:(1 + math.log(count)) * self.idf[term] for term,count in counts.items() if term in self.idf}
        norm = math.sqrt(sum(weight * weight for weight in vector.values())) or 1
        scores = defaultdict(float)
        for term, weight in vector.items():
            for index, doc_weight in self.postings[term]:
                scores[index] += weight / norm * doc_weight
        query_grams, char_hits = grams(query), Counter()
        for gram in query_grams:
            postings = self.char_postings.get(gram, [])
            if len(postings) < len(self.rows) * 0.35:
                char_hits.update(postings)
        candidates = set(sorted(scores, key=scores.get, reverse=True)[:100]) | {index for index,_ in char_hits.most_common(60)}
        ranked = []
        for index in candidates:
            characters = self.char_sets[index]
            dice = 2 * len(query_grams & characters) / max(1, len(query_grams) + len(characters))
            score = 0.85 * scores.get(index, 0) + 0.15 * dice
            if self.rows[index]["language"] == language:
                score += 0.015
            ranked.append((score, index))
        if ranked:
            score, index = max(ranked)
            informative = {word for word in normalize(message).split() if word not in STOP}
            coverage = sum(word in self.idf for word in informative) / max(1, len(informative))
            if score >= 0.22 and coverage >= 0.35:
                row = self.rows[index]
                topic = row["topic"]
                if topic in TOPIC_TERMS:
                    return self.result(f"{topic}.{question_facet(clean)}", language, min(score, 1))
                return self.result(row["intent_id"], language, min(score, 1))
        answer = {
         "en":"I could not find a reliable match in my offline cyber-law information. Briefly describe what happened, the platform involved, and whether money, account access, or threats are involved. I can also explain RA 10175 or give the Muntinlupa PAO contact details.",
         "tl":"Wala akong nakitang sapat na tugma sa offline na impormasyon. Ilarawan nang maikli ang nangyari, ang plataporma, at kung may pera, pagpasok sa account, o banta. Maaari rin akong magpaliwanag ng RA 10175 o magbigay ng ugnayan ng Muntinlupa PAO.",
         "taglish":"Wala akong reliable match sa offline cyber-law information. Briefly describe kung ano ang nangyari, anong platform, at kung may money, account access, o threats. Puwede rin akong mag-explain ng RA 10175 o magbigay ng Muntinlupa PAO contacts."
        }[language]
        return {"answer":answer, "language":language, "topic":None, "intent_id":None, "matched_question":None, "match_score":0, "kind":"clarification", "sources":[], "suggestions":self.suggestions(None,language)}
