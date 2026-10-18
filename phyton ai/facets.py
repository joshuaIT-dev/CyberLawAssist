"""Twenty different information needs, not duplicated question prefixes."""

FACETS = [
 ("first_steps", {
  "en": ["What should I do first?", "First: {action}"],
  "tl": ["Ano ang dapat kong unang gawin?", "Unang hakbang: {action}"],
  "taglish": ["Ano ang first step na dapat kong gawin?", "First step: {action}"]}),
 ("evidence", {
  "en": ["What evidence should I preserve?", "Keep {evidence}. Preserve original files and their context; do not alter them to make your account look stronger."],
  "tl": ["Anong ebidensya ang dapat kong itabi?", "Itabi ang {evidence}. Panatilihin ang orihinal na file at konteksto; huwag baguhin upang palakasin lamang ang salaysay."],
  "taglish": ["Anong evidence ang kailangan kong i-save?", "I-save ang {evidence}. Keep original files at context; huwag i-edit para lang lumakas ang account mo sa nangyari."]}),
 ("reporting", {
  "en": ["Where can I report this concern?", "{route} Use independently verified official contact details; a message in this chatbot does not file a complaint."],
  "tl": ["Saan ako maaaring mag-ulat ng suliraning ito?", "{route} Gumamit ng opisyal at nakumpirmang ugnayan; hindi paghahain ng reklamo ang pag-chat dito."],
  "taglish": ["Saan puwedeng i-report ang concern na ito?", "{route} Gamitin ang independently verified official contacts; hindi automatic complaint filing ang pag-chat dito."]}),
 ("safety", {
  "en": ["What if I am in immediate danger?", "If someone may hurt you now, leave the unsafe situation if you can and contact local emergency assistance or a trusted person. Do not wait for this chatbot or for office staff to reply."],
  "tl": ["Paano kung nasa agarang panganib ako?", "Kung maaaring saktan ka ngayon, lumayo sa panganib kung kaya at humingi ng lokal na tulong pang-emergency o tulong ng pinagkakatiwalaang tao. Huwag hintayin ang sagot ng chatbot o tanggapan."],
  "taglish": ["Paano kung may immediate danger sa akin?", "Kung may puwedeng manakit sa iyo ngayon, move to safety kung kaya at contact local emergency help o trusted person. Huwag hintayin ang chatbot o office reply."]}),
 ("lawyer", {
  "en": ["Can I ask PAO for legal help about this?", "Ask the Muntinlupa City District Office–PAO about an assessment and its current requirements. PAO staff determine eligibility and appropriate assistance; this chatbot cannot guarantee representation."],
  "tl": ["Maaari ba akong humingi ng tulong legal sa PAO tungkol dito?", "Magtanong sa Muntinlupa City District Office–PAO tungkol sa pagsusuri at kasalukuyang kailangan. Kawani ng PAO ang tumutukoy sa kwalipikasyon at tulong; hindi makapapangako ang chatbot ng representasyon."],
  "taglish": ["Puwede ba akong lumapit sa PAO for legal help dito?", "Ask the Muntinlupa City District Office–PAO tungkol sa assessment at current requirements. PAO staff ang magde-decide ng eligibility at assistance; hindi guaranteed representation ang chatbot reply."]}),
 ("account_security", {
  "en": ["How can I protect my accounts while handling this?", "Use a trusted device, protect your main email, review account recovery details, and enable multifactor authentication where available. Only change accounts you are authorized to manage; consider personal safety before changing shared access."],
  "tl": ["Paano ko mapoprotektahan ang aking mga account habang inaasikaso ito?", "Gumamit ng ligtas na device, protektahan ang pangunahing email, suriin ang detalye sa pagbawi, at paganahin ang karagdagang pagpapatunay kung mayroon. Baguhin lamang ang awtorisado mong account at isaalang-alang ang kaligtasan sa magkasalong pag-access."],
  "taglish": ["Paano ko ise-secure ang accounts habang inaasikaso ito?", "Use a trusted device, protect your main email, review recovery details, at enable multifactor authentication kung available. Authorized accounts lang ang baguhin at consider safety bago mag-change ng shared access."]}),
 ("money", {
  "en": ["What should I do if money was also involved?", "If a payment or unauthorized charge is involved, contact the bank or payment provider promptly through its official channel. Keep transaction references and ask about protective and dispute options. A refund or reversal is not guaranteed."],
  "tl": ["Ano ang gagawin ko kung may sangkot ding pera?", "Kung may padala o hindi pinahintulutang bayad, kausapin agad ang bangko o tagapagbigay sa opisyal na paraan. Itabi ang mga sanggunian at itanong ang pagprotekta at pagtutol sa transaksyon. Hindi garantisado ang pagbabalik ng pera."],
  "taglish": ["Ano ang gagawin kung may money o payment na involved?", "Kung may payment o unauthorized charge, contact the bank o provider agad through official support. Keep transaction references at ask about protective at dispute options. Hindi guaranteed ang refund o reversal."]}),
 ("private_information", {
  "en": ["What private information should I avoid sharing in chat?", "Do not share passwords, OTPs, recovery codes, full payment-card details, or unnecessary identity documents. Describe the problem in general terms and ask authorized staff how sensitive evidence should be submitted securely."],
  "tl": ["Anong pribadong impormasyon ang hindi ko dapat ibigay sa chat?", "Huwag magbigay ng password, OTP, code sa pagbawi, buong detalye ng card, o hindi kailangang dokumento ng pagkakakilanlan. Ilarawan muna ang problema at itanong sa awtorisadong kawani ang ligtas na pagsusumite ng sensitibong ebidensya."],
  "taglish": ["Anong private info ang hindi dapat i-share sa chat?", "Huwag i-share ang passwords, OTPs, recovery codes, full card details, o unnecessary IDs. Describe the problem generally at ask authorized staff paano secure na mag-submit ng sensitive evidence."]}),
 ("contact_suspect", {
  "en": ["Should I keep replying to the person involved?", "Do not threaten, impersonate, or retaliate. Preserve relevant communications before using block or report tools, and ask an appropriate investigator or lawyer before arranging any meeting, payment, or continued interaction."],
  "tl": ["Dapat ba akong patuloy na sumagot sa taong sangkot?", "Huwag magbanta, magpanggap, o gumanti. Itabi ang mahalagang usapan bago magharang o mag-ulat at magtanong sa tamang imbestigador o abogado bago makipagkita, magbayad, o magpatuloy ng ugnayan."],
  "taglish": ["Dapat ba akong patuloy na mag-reply sa involved na tao?", "Huwag mag-threat, impersonate, o retaliate. Preserve relevant chats bago mag-block o report, at ask an investigator o lawyer bago mag-meet, pay, o continue ng interaction."]}),
 ("deleting", {
  "en": ["Should I delete the messages or account now?", "Preserve {evidence} before deleting anything. Deleting an account or conversation may remove useful context. Ask authorized staff how to preserve evidence while using platform tools to protect yourself."],
  "tl": ["Dapat ko na bang burahin ang mga mensahe o account?", "Itabi muna ang {evidence} bago magbura. Maaaring mawala ang mahalagang konteksto kapag binura ang account o usapan. Itanong sa tamang kawani ang pag-iingat ng ebidensya habang pinoprotektahan ang sarili."],
  "taglish": ["I-delete ko na ba ang messages o account?", "I-preserve muna ang {evidence} bago mag-delete. Puwedeng mawala ang useful context sa account o conversation deletion. Ask authorized staff about evidence preservation habang pinoprotektahan mo ang sarili."]}),
 ("screenshots", {
  "en": ["Are screenshots alone enough to prove what happened?", "Screenshots may help document an incident, but this chatbot cannot determine admissibility or whether they prove a case. Keep originals, complete context, dates, URLs, and other related records where lawful and safe."],
  "tl": ["Sapat na ba ang screenshot upang patunayan ang nangyari?", "Maaaring makatulong ang screenshot, ngunit hindi matutukoy ng chatbot kung tanggap ito bilang ebidensya o sapat sa kaso. Itabi ang orihinal, buong konteksto, petsa, URL, at iba pang kaugnay na tala kung legal at ligtas."],
  "taglish": ["Enough na ba ang screenshots as proof?", "Helpful ang screenshots para mag-document pero hindi makakapag-decide ang chatbot ng admissibility o case proof. Keep originals, complete context, dates, URLs, at related records kung lawful at safe."]}),
 ("timeline", {
  "en": ["How should I write a timeline of this incident?", "List events in time order, distinguishing what you personally observed from assumptions or information supplied by others. Include dates, approximate times, account identifiers, actions taken, and the supporting record for each event."],
  "tl": ["Paano ko isusulat ang pagkakasunod ng mga pangyayari?", "Ilista ang mga pangyayari ayon sa oras at ihiwalay ang sariling nakita sa hinala o sinabi ng iba. Isama ang petsa, tinatayang oras, pagkakakilanlan ng account, ginawa mong hakbang, at katumbas na tala."],
  "taglish": ["Paano gumawa ng incident timeline?", "List events in time order at ihiwalay ang personally observed facts sa assumptions o sabi ng iba. Include dates, approximate times, account identifiers, actions taken, at supporting records per event."]}),
 ("unknown_person", {
  "en": ["Can I seek help if I do not know the person's real name?", "Record identifiers you can lawfully see, such as profile links, usernames, contact details, and payment references. Do not invent a suspect's identity or try to break into accounts. Investigators decide what lawful identification steps are appropriate."],
  "tl": ["Maaari ba akong humingi ng tulong kahit hindi ko alam ang tunay na pangalan niya?", "Itala ang legal na nakikitang pagkakakilanlan gaya ng link ng profile, pangalan ng account, ugnayan, at sanggunian ng bayad. Huwag mag-imbento ng pangalan o pumasok sa account ng iba. Imbestigador ang tutukoy sa tamang legal na hakbang."],
  "taglish": ["Puwede bang humingi ng help kahit unknown ang real name ng suspect?", "Record lawfully visible identifiers tulad ng profile links, usernames, contacts, at payment references. Huwag mag-invent ng identity o mag-break into accounts. Investigators ang magde-decide ng lawful identification steps."]}),
 ("outside_city", {
  "en": ["What if the other person lives outside Muntinlupa?", "Record the places connected with the incident and ask PAO or the appropriate investigating office about referral and jurisdiction. A person's location alone does not let this chatbot determine where a complaint must be filed."],
  "tl": ["Paano kung nakatira sa labas ng Muntinlupa ang kabilang tao?", "Itala ang mga lugar na may kaugnayan sa nangyari at itanong sa PAO o tamang imbestigador ang pagsangguni at hurisdiksyon. Hindi sapat ang lokasyon ng isang tao upang matukoy ng chatbot kung saan ihahain ang reklamo."],
  "taglish": ["Paano kung outside Muntinlupa nakatira ang other person?", "Record the locations connected sa incident at ask PAO o the investigating office tungkol sa referral at jurisdiction. Hindi sapat ang location alone para mag-decide ang chatbot saan dapat mag-file."]}),
 ("office_preparation", {
  "en": ["What should I prepare before visiting the office?", "Prepare a short factual timeline, {evidence}, and questions you want answered. Ask the office which identity or eligibility documents it currently requires and how to submit sensitive materials. Keep your own copies."],
  "tl": ["Ano ang ihahanda ko bago pumunta sa tanggapan?", "Maghanda ng maikling salaysay ayon sa petsa, {evidence}, at mga tanong. Kumpirmahin sa tanggapan ang kasalukuyang dokumento sa pagkakakilanlan o kwalipikasyon at ligtas na pagsusumite ng maselang materyal. Magtabi ng sariling kopya."],
  "taglish": ["Ano ang ipe-prepare ko bago pumunta sa office?", "Prepare a short factual timeline, {evidence}, at questions. Ask the office tungkol sa current identity o eligibility documents at secure submission ng sensitive materials. Keep your own copies."]}),
 ("minor_involved", {
  "en": ["What changes if a child is involved in this concern?", "Prioritize the child's safety and involve a safe trusted caregiver or appropriate child-protection professional. Do not download or forward sexual images of children. If the caregiver may be unsafe, seek an appropriate safeguarding service instead."],
  "tl": ["Ano ang dapat isaalang-alang kung may batang sangkot?", "Unahin ang kaligtasan ng bata at humingi ng tulong sa ligtas na tagapag-alaga o tamang propesyonal sa proteksyon ng bata. Huwag mag-download o magpasa ng sekswal na larawan ng bata. Kung hindi ligtas ang tagapag-alaga, lumapit sa tamang serbisyo ng proteksyon."],
  "taglish": ["Ano ang dapat gawin kung may child na involved?", "Unahin ang child safety at involve a safe trusted caregiver o child-protection professional. Huwag mag-download o forward ng sexual images ng children. Kung unsafe ang caregiver, contact an appropriate safeguarding service instead."]}),
 ("legal_assessment", {
  "en": ["Does this automatically prove a crime under RA 10175?", "No automatic conclusion follows from this description. A lawyer or investigator must assess the facts, evidence, applicable law, and relevant court rulings. This chatbot does not decide guilt, legal liability, or whether a particular charge will succeed."],
  "tl": ["Awtomatiko bang may krimen na sa ilalim ng RA 10175 dahil dito?", "Hindi awtomatikong may legal na konklusyon mula sa paglalarawang ito. Dapat suriin ng abogado o imbestigador ang pangyayari, ebidensya, batas, at mga pasya ng hukuman. Hindi nagpapasya ang chatbot sa pagkakasala, pananagutan, o tagumpay ng kaso."],
  "taglish": ["Automatic bang proven crime under RA 10175 ito?", "Hindi automatic ang legal conclusion mula sa description. Lawyer o investigator ang dapat mag-assess ng facts, evidence, applicable law, at court rulings. Hindi nagde-decide ang chatbot ng guilt, liability, o kung mananalo ang charge."]}),
 ("deadlines", {
  "en": ["How long can I wait before taking action?", "Preserve the records promptly and ask a qualified lawyer about any deadline that applies to your exact facts. Deadlines can differ by the possible claim and circumstances; this chatbot should not invent a single filing period for every concern."],
  "tl": ["Gaano ako katagal maaaring maghintay bago kumilos?", "Itabi agad ang mga tala at itanong sa kwalipikadong abogado ang takdang panahong naaangkop sa iyong sitwasyon. Nagkakaiba ang panahon ayon sa posibleng reklamo at pangyayari; hindi dapat mag-imbento ang chatbot ng iisang palugit para sa lahat."],
  "taglish": ["Gaano katagal puwedeng mag-wait bago mag-take action?", "Preserve records promptly at ask a qualified lawyer tungkol sa deadline para sa exact facts mo. Iba-iba ang deadlines depende sa possible claim at circumstances; hindi dapat mag-invent ang chatbot ng one filing period para sa lahat."]}),
 ("follow_up", {
  "en": ["How do I follow up after reporting this?", "Keep the acknowledgment, reference number, submission date, and office contact provided when you report. Follow up through that office's verified channel and record its instructions. A chat reply here is not an official case-status update."],
  "tl": ["Paano ako susubaybay matapos mag-ulat?", "Itabi ang patunay ng pagtanggap, sanggunian, petsa ng pagsusumite, at ugnayang ibinigay ng tanggapan. Sa opisyal na paraan magtanong at itala ang tagubilin. Hindi opisyal na katayuan ng kaso ang sagot sa chat na ito."],
  "taglish": ["Paano mag-follow up after mag-report?", "Keep the acknowledgment, reference number, submission date, at office contact na ibinigay. Follow up sa verified channel ng office at record its instructions. Hindi official case-status update ang chat reply dito."]}),
 ("assistant_limits", {
  "en": ["What can this chatbot help me with in this situation?", "I can explain general information and suggest how to organize {evidence}. I cannot file a complaint, contact a suspect, recover an account, book an appointment, or act as your lawyer. Use the office's verified channels for official assistance."],
  "tl": ["Ano ang maitutulong ng chatbot sa sitwasyong ito?", "Maaari akong magpaliwanag ng pangkalahatang impormasyon at magmungkahi sa pag-aayos ng {evidence}. Hindi ako naghahain ng reklamo, kumokontak ng pinaghihinalaan, bumabawi ng account, nagtatakda ng appointment, o umaaktong abogado. Gamitin ang opisyal na ugnayan ng tanggapan."],
  "taglish": ["Ano ang kayang i-help ng chatbot sa situation na ito?", "Puwede akong mag-explain ng general information at mag-suggest paano i-organize ang {evidence}. Hindi ako nagfa-file ng complaint, contact ng suspect, recover ng account, book ng appointment, o act as your lawyer. Use verified office channels for official help."]})
]

ROUTES = {
 "en": "For a possible cybercrime, ask the appropriate PNP or NBI office about reporting. For a personal-data complaint, ask the National Privacy Commission about its current process. PAO can assess a request for legal assistance.",
 "tl": "Para sa posibleng cybercrime, magtanong sa tamang tanggapan ng PNP o NBI tungkol sa pag-uulat. Para sa reklamo sa personal na datos, itanong sa National Privacy Commission ang kasalukuyang proseso. Maaaring suriin ng PAO ang hiling na tulong legal.",
 "taglish": "For possible cybercrime, ask the appropriate PNP o NBI office about reporting. Para sa personal-data complaint, ask the National Privacy Commission tungkol sa current process. PAO can assess a request for legal assistance."
}
