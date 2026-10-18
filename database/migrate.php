<?php
declare(strict_types=1);
if(PHP_SAPI!=='cli') { http_response_code(404);exit; }
$c=require dirname(__DIR__,3).'/cyberlawassist-private/config.php';
$p=new PDO('mysql:host=127.0.0.1;port=3306;dbname=cyberlawassist;charset=utf8mb4',getenv('CLA_DB_SETUP_USER')?:'root',getenv('CLA_DB_SETUP_PASSWORD')?:'',[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);
$changes=[
 ['users','policy_version','ADD COLUMN policy_version VARCHAR(20) NULL, ADD COLUMN policy_accepted_at DATETIME NULL'],
 ['users','admin_number','ADD COLUMN admin_number VARCHAR(40) CHARACTER SET ascii COLLATE ascii_bin NULL, ADD UNIQUE KEY uq_users_admin_number (admin_number)'],
 ['users','session_version','ADD COLUMN session_version INT UNSIGNED NOT NULL DEFAULT 1'],
 ['checklist_items','request_key','ADD COLUMN request_key VARCHAR(80) CHARACTER SET ascii COLLATE ascii_bin NULL, ADD UNIQUE KEY uq_checklist_request (user_id,request_key)'],
 ['case_records','request_key','ADD COLUMN request_key VARCHAR(80) CHARACTER SET ascii COLLATE ascii_bin NULL, ADD COLUMN revision INT UNSIGNED NOT NULL DEFAULT 1, ADD UNIQUE KEY uq_case_request (created_by,request_key)']
];
foreach($changes as [$table,$column,$sql]) {
    $s=$p->prepare('SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=? AND table_name=? AND column_name=?');$s->execute(['cyberlawassist',$table,$column]);
    if(!(int)$s->fetchColumn()) $p->exec('ALTER TABLE `'.$table.'` '.$sql);
}
// Give existing administrators a number without changing passwords or sessions.
function assign_admin_numbers(PDO $p): void {
    $ids=$p->query("SELECT id FROM users WHERE role='admin' AND admin_number IS NULL ORDER BY created_at,id")->fetchAll(PDO::FETCH_COLUMN);
    $check=$p->prepare('SELECT id FROM users WHERE admin_number=?');
    $update=$p->prepare("UPDATE users SET admin_number=? WHERE id=? AND role='admin' AND admin_number IS NULL");
    $number=1;
    foreach($ids as $id) {
        do { $candidate='ADM-'.str_pad((string)$number++,4,'0',STR_PAD_LEFT);$check->execute([$candidate]); } while($check->fetchColumn());
        $update->execute([$candidate,$id]);
    }
}
assign_admin_numbers($p);
echo "Database migrations complete.\n";
