<?php
declare(strict_types=1);
if(PHP_SAPI!=='cli') { http_response_code(404);exit; }
date_default_timezone_set('UTC');
$root=dirname(__DIR__);$private=dirname(__DIR__,3).'/cyberlawassist-private';
if(!is_dir($private)&&!mkdir($private,0700,true)) throw new RuntimeException('Cannot create private configuration directory.');
$path=$private.'/config.php';
$rootUser=getenv('CLA_DB_SETUP_USER')?:'root';$rootPassword=getenv('CLA_DB_SETUP_PASSWORD')?:'';
$pdo=new PDO('mysql:host=127.0.0.1;port=3306;charset=utf8mb4',$rootUser,$rootPassword,[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::MYSQL_ATTR_MULTI_STATEMENTS=>true]);
$pdo->exec("SET time_zone='+00:00'");
$count=(int)$pdo->query("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='cyberlawassist'")->fetchColumn();
if($count<12) {
    if($count>0) {
        $expected=['users','chat_conversations','chat_messages','support_threads','support_messages','checklist_items','case_records','notifications','notification_reads','law_topics','law_translations','office_contacts'];
        foreach($pdo->query("SELECT table_name FROM information_schema.tables WHERE table_schema='cyberlawassist'")->fetchAll(PDO::FETCH_COLUMN) as $table) {
            if(!in_array($table,$expected,true)||(int)$pdo->query('SELECT COUNT(*) FROM cyberlawassist.`'.$table.'`')->fetchColumn()>0) throw new RuntimeException('Partial database contains data. Preserve it and resolve the migration before continuing.');
        }
    }
    $schema=file_get_contents(__DIR__.'/schema.sql');
    $pdo->exec(str_replace('CREATE TABLE ','CREATE TABLE IF NOT EXISTS ',$schema));
    echo "Created the 12 application tables.\n";
} elseif($count!==12) throw new RuntimeException('Existing database is incomplete. Preserve its data and resolve the migration before continuing.');
$pdo->exec('USE cyberlawassist');
if(!is_file($path)) {
    $password=bin2hex(random_bytes(24));$appUser='cla_app_'.substr(bin2hex(random_bytes(4)),0,8);
    $pdo->exec('CREATE USER '.$pdo->quote($appUser)."@'127.0.0.1' IDENTIFIED BY ".$pdo->quote($password));
    $pdo->exec('GRANT SELECT,INSERT,UPDATE,DELETE ON cyberlawassist.* TO '.$pdo->quote($appUser)."@'127.0.0.1'");
    $config=['dsn'=>'mysql:host=127.0.0.1;port=3306;dbname=cyberlawassist;charset=utf8mb4','user'=>$appUser,'password'=>$password,'ai_url'=>'http://127.0.0.1:8001/api/chat'];
    if(file_put_contents($path,"<?php\nreturn ".var_export($config,true).";\n",LOCK_EX)===false) throw new RuntimeException('Cannot save configuration.');
    chmod($path,0600);
    echo "Created restricted application credentials outside htdocs.\n";
}
require __DIR__.'/migrate.php';
require __DIR__.'/seed.php';

$legacy=$root.'/assets/php/private/users.json';$imported=0;
if(is_file($legacy)) {
    $users=json_decode(file_get_contents($legacy),true,512,JSON_THROW_ON_ERROR);
    if(!is_array($users)) throw new RuntimeException('Invalid legacy accounts file.');
    $pdo->beginTransaction();
    foreach($users as $u) {
        if(!preg_match('/^[a-f0-9]{32}$/D',$u['id']??'')||!filter_var($u['email']??'',FILTER_VALIDATE_EMAIL)||empty($u['password_hash'])) throw new RuntimeException('Invalid legacy account. Source file has been retained.');
        $existing=$pdo->prepare('SELECT id,email FROM users WHERE id=? OR email=?');$existing->execute([$u['id'],strtolower(trim($u['email']))]);$found=$existing->fetchAll(PDO::FETCH_ASSOC);
        if($found) { if(count($found)!==1||$found[0]['id']!==$u['id']||strtolower($found[0]['email'])!==strtolower(trim($u['email']))) throw new RuntimeException('Legacy account conflict. Source file retained.');continue; }
        $insert=$pdo->prepare('INSERT INTO users (id,name,email,phone,password_hash,role,created_at) VALUES (?,?,?,?,?,?,?)');
        $insert->execute([$u['id'],$u['name'],strtolower(trim($u['email'])),$u['phone']?:null,$u['password_hash'],($u['role']??'user')==='admin'?'admin':'user',gmdate('Y-m-d H:i:s',strtotime($u['created_at']??'now'))]);
        $check=$pdo->prepare('INSERT INTO checklist_items (user_id,label,sort_order) VALUES (?,?,?)');
        foreach(['Save relevant messages or posts','Record dates, times, and account names','Secure affected accounts','Write questions for the office'] as $i=>$label) $check->execute([$u['id'],$label,$i]);
        $imported++;
    }
    $pdo->commit();copy($legacy,$private.'/legacy-users-backup.json');
}
assign_admin_numbers($pdo);
$adminCount=(int)$pdo->query("SELECT COUNT(*) FROM users WHERE role='admin'")->fetchColumn();
if($adminCount===0) {
    $id=bin2hex(random_bytes(16));$password=bin2hex(random_bytes(24));$email='admin@cyberlawassist.test';
    $exists=$pdo->prepare('SELECT 1 FROM users WHERE email=?');$exists->execute([$email]);
    if($exists->fetchColumn()) $email='admin-'.bin2hex(random_bytes(4)).'@cyberlawassist.test';
    $pdo->beginTransaction();
    $insert=$pdo->prepare("INSERT INTO users (id,name,email,password_hash,role) VALUES (?,?,?,?,'admin')");
    $insert->execute([$id,'CyberLawAssist Administrator',$email,password_hash($password,PASSWORD_DEFAULT)]);
    $check=$pdo->prepare('INSERT INTO checklist_items (user_id,label,sort_order) VALUES (?,?,?)');
    foreach(['Save relevant messages or posts','Record dates, times, and account names','Secure affected accounts','Write questions for the office'] as $i=>$label) $check->execute([$id,$label,$i]);
    assign_admin_numbers($pdo);
    $adminNumber=$pdo->query('SELECT admin_number FROM users WHERE id='.$pdo->quote($id))->fetchColumn();
    $credentials="CyberLawAssist first administrator\nAdmin number: {$adminNumber}\nEmail: {$email}\nInitial password: {$password}\nChange this password after signing in.\n";
    if(file_put_contents($private.'/first-admin.txt',$credentials,LOCK_EX)===false) { $pdo->rollBack();throw new RuntimeException('Cannot save first administrator credentials outside the public project folder.'); }
    @chmod($private.'/first-admin.txt',0600);
    $pdo->commit();
    echo "Created the first administrator. Credentials saved outside htdocs: {$private}/first-admin.txt\n";
}
echo "Imported {$imported} existing accounts; source files retained.\n";
echo "Database ready. Open http://localhost/CyberLawAssist/pages/signup.html to register a User account. Existing administrators create further admins through Users > Create administrator.\n";
