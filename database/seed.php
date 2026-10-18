<?php
// Loaded only by the local CLI setup; do not expose data setup as an HTTP action.
if(PHP_SAPI!=='cli') { http_response_code(404);exit; }
$datasets=[];
foreach(['en','tl','taglish'] as $language) {
    $rows=json_decode(file_get_contents(dirname(__DIR__).'/phyton ai/data/qa_'.$language.'.json'),true,512,JSON_THROW_ON_ERROR);
    foreach($rows as $row) $datasets[$language][$row['intent_id']]=$row;
}
$sources=json_decode(file_get_contents(dirname(__DIR__).'/phyton ai/data/sources.json'),true,512,JSON_THROW_ON_ERROR);
$topics=[['overview','faq.ra10175'],['illegal-access','faq.illegal_access'],['computer-related-fraud','faq.computer_fraud'],['computer-related-identity-theft','faq.identity_definition'],['cyber-libel','faq.cyberlibel'],['online-harassment','persistent_harassment.first_steps']];
$pdo->beginTransaction();
foreach($topics as $i=>[$slug,$intent]) {
    $find=$pdo->prepare('SELECT id FROM law_topics WHERE slug=?');$find->execute([$slug]);$id=$find->fetchColumn();
    if($id) continue;
    $row=$datasets['en'][$intent];$urls=[];
    foreach($row['sources'] as $key) if(!empty($sources[$key]['url'])) $urls[]=$sources[$key]['url'];
    $insert=$pdo->prepare('INSERT INTO law_topics (slug,source_urls,sort_order) VALUES (?,?,?)');$insert->execute([$slug,json_encode($urls),$i]);$id=$pdo->lastInsertId();
    foreach(['en','tl','taglish'] as $language) {
        $r=$datasets[$language][$intent];
        $insert=$pdo->prepare('INSERT INTO law_translations (law_topic_id,language,title,summary) VALUES (?,?,?,?)');$insert->execute([$id,$language,$r['question'],$r['answer']]);
    }
}
if(!(int)$pdo->query("SELECT COUNT(*) FROM office_contacts WHERE slug='muntinlupa-pao'")->fetchColumn()) {
    $s=$pdo->prepare('INSERT INTO office_contacts (slug,contact_type,name,address,phone) VALUES (?,?,?,?,?)');
    $s->execute(['muntinlupa-pao','office','Muntinlupa City District Office - Public Attorney\'s Office','Ground Floor, Municipal City Hall of Justice Building Right Wing, National Road, Tunasan, Muntinlupa, 1773 Metro Manila','(02) 8862 2525']);
}
foreach([
    ['pnp-acg','Philippine National Police - Anti-Cybercrime Group','https://acg.pnp.gov.ph/'],
    ['nbi','National Bureau of Investigation','https://nbi.gov.ph/contact/'],
    ['npc','National Privacy Commission','https://privacy.gov.ph/file-a-complaint-2/']
] as $i=>[$slug,$name,$url]) {
    $s=$pdo->prepare('SELECT id FROM office_contacts WHERE slug=?');$s->execute([$slug]);
    if(!$s->fetchColumn()) { $s=$pdo->prepare('INSERT INTO office_contacts (slug,contact_type,name,website_url,source_url,sort_order) VALUES (?,\'agency\',?,?,?,?)');$s->execute([$slug,$name,$url,$url,$i+1]); }
}
if(!(int)$pdo->query('SELECT COUNT(*) FROM notifications')->fetchColumn()) {
    $s=$pdo->prepare('INSERT INTO notifications (audience,kind,title_en,body_en,title_tl,body_tl,action_tab) VALUES (?,?,?,?,?,?,?)');
    $s->execute(['all','notification','Welcome to CyberLawAssist','Find general cyber-law information and office contact details.','Maligayang pagdating sa CyberLawAssist','Alamin ang pangkalahatang impormasyon sa cybercrime at ugnayan ng tanggapan.','about']);
    $s->execute(['all','notification','RA 10175 guide available','Explore the Cybercrime Prevention Act overview in your Law tab.','May gabay tungkol sa RA 10175','Basahin ang buod ng Cybercrime Prevention Act sa pahina ng batas.','law']);
    $s->execute(['user','alert','Keep your information safe','Avoid sharing passwords, OTPs, or unnecessary identity documents in chat.','Ingatan ang iyong impormasyon','Huwag magbigay ng password, OTP, o hindi kailangang dokumento sa chat.','chatbot']);
    $s->execute(['admin','alert','Protect client information','Use only the details needed for office intake and support.','Ingatan ang impormasyon ng kliyente','Gamitin lamang ang detalyeng kailangan sa pagtanggap at pagtulong ng tanggapan.','intake']);
}
$pdo->commit();
