<?php
declare(strict_types=1);
require __DIR__.'/bootstrap.php';
require __DIR__.'/data.php';
require __DIR__.'/docx.php';
$d=input();$action=$d['action']??$_GET['action']??'';
if(!is_string($action)) fail(400,'Choose an action.');
if($action==='public') respond(200,['ok'=>true,'csrf'=>$_SESSION['csrf'],'notices'=>notices(null,true)]+content_data());
if($action==='ai') {
    post();$message=text($d,'message',2000,true);$language=choice($d,'language',['auto','en','tl','taglish'],'auto');$topic=text($d,'context_topic',80);
    session_write_close();respond(200,['ok'=>true]+local_ai($message,$language,$topic?:null));
}
$u=current_user();$uid=$u['id'];
if(isset($_SERVER['HTTP_X_CLA_ACCOUNT'])&&!hash_equals($uid,$_SERVER['HTTP_X_CLA_ACCOUNT'])) fail(401,'The signed-in account changed. Please reopen your workspace.');
if($_SERVER['REQUEST_METHOD']==='POST') csrf();
if($action==='bootstrap') {
    $workspace=choice($_GET,'workspace',['user','admin'],$u['role']);
    if($workspace!==$u['role']) respond(403,['ok'=>false,'message'=>'Open the workspace assigned to your account.','workspace'=>$u['role']]);
    $result=['ok'=>true,'csrf'=>$_SESSION['csrf'],'user'=>public_user($u),'conversations'=>conversations($uid),'checklist'=>checklist($uid),'threads'=>support_data($u),'notices'=>notices($u)]+content_data();
    if($u['role']==='admin') $result+=['cases'=>cases_data(),'dashboard'=>dashboard(),'users'=>user_directory(),'administrators'=>user_directory('admin')];
    respond(200,$result);
}
if($action==='profile') {
    post();$name=text($d,'name',120,true);$email=strtolower(text($d,'email',254,true));$phone=text($d,'phone',50);
    if(!filter_var($email,FILTER_VALIDATE_EMAIL)) fail(422,'Enter a valid email address.');
    if($email!==$u['email']&&!password_verify(secret($d,'current_password'),$u['password_hash'])) fail(403,'Enter your current password to change your email.');
    try { query('UPDATE users SET name=?,email=?,phone=? WHERE id=?',[$name,$email,$phone?:null,$uid]); }
    catch(PDOException $e) { if($e->getCode()==='23000') fail(409,'This email is already used by another account.');throw $e; }
    respond(200,['ok'=>true,'user'=>public_user(current_user())]);
}
if($action==='preferences') {
    post();$ui=choice($d,'uiLanguage',['en','tl'],$u['ui_language']);$chat=choice($d,'chatLanguage',['auto','en','tl','taglish'],$u['chat_language']);
    $email=array_key_exists('emailUpdates',$d)?boolean($d,'emailUpdates'):(int)$u['email_updates'];$privacy=array_key_exists('privacyMode',$d)?boolean($d,'privacyMode'):(int)$u['privacy_reminders'];
    query('UPDATE users SET ui_language=?,chat_language=?,email_updates=?,privacy_reminders=? WHERE id=?',[$ui,$chat,$email,$privacy,$uid]);
    respond(200,['ok'=>true,'user'=>public_user(current_user())]);
}
if($action==='password') {
    post();$old=secret($d,'current_password');$new=$d['password']??'';
    if(!password_verify($old,$u['password_hash'])) fail(403,'Your current password is incorrect.');
    if(!is_string($new)||mb_strlen($new)<8||trim($new)===''||strlen($new)>72||str_contains($new,"\0")||$new!==($d['confirm-password']??null)) fail(422,'Choose a matching password with at least 8 characters.');
    query('UPDATE users SET password_hash=?,session_version=session_version+1 WHERE id=?',[password_hash($new,PASSWORD_DEFAULT),$uid]);sign_in(query('SELECT * FROM users WHERE id=?',[$uid])->fetch());respond(200,['ok'=>true,'csrf'=>$_SESSION['csrf']]);
}
if($action==='chats') respond(200,['ok'=>true,'conversations'=>conversations($uid)]);
if($action==='chat_change') {
    post();$id=record_id($d['id']??null);$operation=choice($d,'operation',['rename','pin','delete']);
    db()->beginTransaction();
    if(!query('SELECT id FROM chat_conversations WHERE id=? AND user_id=? FOR UPDATE',[$id,$uid])->fetch()) fail(404,'This conversation is no longer available.');
    if($operation==='rename') query('UPDATE chat_conversations SET title=? WHERE id=?',[text($d,'title',120,true),$id]);
    elseif($operation==='pin') query('UPDATE chat_conversations SET is_pinned=? WHERE id=?',[boolean($d,'pin'),$id]);
    else { if(($d['confirmation']??'')!=='DELETE') fail(422,'Type DELETE to confirm removal.');query('DELETE FROM chat_conversations WHERE id=?',[$id]); }
    db()->commit();respond(200,['ok'=>true,'conversations'=>conversations($uid)]);
}
if($action==='chat_send') {
    post();$message=text($d,'message',2000,true);$language=choice($d,'language',['auto','en','tl','taglish'],'auto');$key=text($d,'request_key',80,true);
    if(!preg_match('/^[a-zA-Z0-9_-]{8,80}$/D',$key)) fail(422,'Choose a valid request key.');
    $requestedId=empty($d['conversation_id'])?null:record_id($d['conversation_id']);
    session_write_close();
    if(!query('SELECT GET_LOCK(?,2)',['cla-ai-'.substr(hash('sha256',$uid.':'.$key),0,48)])->fetchColumn()) fail(409,'Your question is still being processed. Please wait before retrying.');
    $existing=query("SELECT m.* FROM chat_messages m JOIN chat_conversations c ON c.id=m.conversation_id WHERE c.user_id=? AND m.request_key=? AND m.sender='user'",[$uid,$key])->fetch();
    if($existing) {
        $id=(string)$existing['conversation_id'];
        if(($requestedId!==null&&$requestedId!==$id)||$message!==$existing['body']||$language!==$existing['language']) fail(409,'This request key belongs to a different question.');
        if(query("SELECT id FROM chat_messages WHERE conversation_id=? AND request_key=? AND sender='assistant'",[$id,$key])->fetch()) respond(200,['ok'=>true,'conversation'=>conversation($id,$uid)]);
        $c=query('SELECT * FROM chat_conversations WHERE id=? AND user_id=?',[$id,$uid])->fetch();
        if(!$c) fail(404,'This conversation was removed.');
        query("UPDATE chat_messages SET delivery_status='pending' WHERE id=?",[$existing['id']]);
    } else {
        db()->beginTransaction();
        if($requestedId!==null) { $c=query('SELECT * FROM chat_conversations WHERE id=? AND user_id=? FOR UPDATE',[$requestedId,$uid])->fetch();if(!$c) fail(404,'This conversation was removed.');$id=$requestedId; }
        else { query('INSERT INTO chat_conversations (user_id,title) VALUES (?,?)',[$uid,mb_substr($message,0,45)]);$id=db()->lastInsertId();$c=['last_topic'=>null]; }
        query("INSERT INTO chat_messages (conversation_id,request_key,sender,body,language,delivery_status) VALUES (?,?,'user',?,?,'pending')",[$id,$key,$message,$language]);db()->commit();
    }
    try { $reply=local_ai($message,$language,$c['last_topic']); }
    catch(ApiError $e) { query("UPDATE chat_messages SET delivery_status='failed' WHERE conversation_id=? AND request_key=? AND sender='user'",[$id,$key]);respond($e->status,['ok'=>false,'message'=>$e->getMessage(),'conversation'=>conversation($id,$uid)]); }
    db()->beginTransaction();
    if(!query('SELECT id FROM chat_conversations WHERE id=? AND user_id=? FOR UPDATE',[$id,$uid])->fetch()) fail(404,'This conversation was removed while the answer was being prepared.');
    $meta=array_intersect_key($reply,array_flip(['topic','intent_id','kind','match_score','sources','suggestions']));
    $replyLanguage=in_array($reply['language']??null,['en','tl','taglish'],true)?$reply['language']:'en';
    query("INSERT INTO chat_messages (conversation_id,request_key,sender,body,language,delivery_status,response_meta) VALUES (?,?,'assistant',?,?,'sent',?)",[$id,$key,$reply['answer'],$replyLanguage,json_encode($meta,JSON_UNESCAPED_UNICODE)]);
    query("UPDATE chat_messages SET delivery_status='sent' WHERE conversation_id=? AND request_key=? AND sender='user'",[$id,$key]);
    query('UPDATE chat_conversations SET last_topic=COALESCE(?,last_topic),updated_at=UTC_TIMESTAMP() WHERE id=?',[$reply['topic']??null,$id]);db()->commit();
    respond(200,['ok'=>true,'conversation'=>conversation($id,$uid)]);
}
if($action==='checklist') respond(200,['ok'=>true,'checklist'=>checklist($uid)]);
if($action==='checklist_save') {
    post();
    if(isset($d['id'])) {
        $id=record_id($d['id']);if(!query('SELECT id FROM checklist_items WHERE id=? AND user_id=?',[$id,$uid])->fetch()) fail(404,'Checklist item not found.');
        query('UPDATE checklist_items SET is_completed=? WHERE id=?',[boolean($d,'done'),$id]);
    } else {
        $label=text($d,'label',500,true);$key=text($d,'request_key',80,true);
        if(!preg_match('/^[a-zA-Z0-9_-]{8,80}$/D',$key)) fail(422,'Choose a valid request key.');
        if(!query('SELECT GET_LOCK(?,2)',['cla-check-'.substr(hash('sha256',$uid),0,40)])->fetchColumn()) fail(409,'Please retry adding your item.');
        $old=query('SELECT label FROM checklist_items WHERE user_id=? AND request_key=?',[$uid,$key])->fetch();
        if($old&&$old['label']!==$label) fail(409,'This request was already used for another item.');
        if(!$old) { $order=(int)query('SELECT COALESCE(MAX(sort_order),0)+1 FROM checklist_items WHERE user_id=?',[$uid])->fetchColumn();query('INSERT INTO checklist_items (user_id,label,sort_order,request_key) VALUES (?,?,?,?)',[$uid,$label,$order,$key]); }
    }
    respond(200,['ok'=>true,'checklist'=>checklist($uid)]);
}
if($action==='support') {
    $selected=empty($_GET['thread'])?null:record_id($_GET['thread']);
    respond(200,['ok'=>true,'threads'=>support_data($u,$selected),'notices'=>notices($u)]);
}
if($action==='support_send') {
    post();$body=text($d,'message',4000,true);$key=text($d,'request_key',80,true);
    if(!preg_match('/^[a-zA-Z0-9_-]{8,80}$/D',$key)) fail(422,'Choose a valid request key.');
    db()->beginTransaction();
    if($u['role']==='user') {
        query('INSERT INTO support_threads (user_id) VALUES (?) ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)',[$uid]);$thread=(string)db()->lastInsertId();
    } else { $thread=record_id($d['thread_id']??null); }
    $t=query('SELECT * FROM support_threads WHERE id=? FOR UPDATE',[$thread])->fetch();
    if(!$t||($u['role']==='user'&&$t['user_id']!==$uid)) fail(404,'Support conversation not found.');
    $old=query('SELECT body FROM support_messages WHERE thread_id=? AND sender_user_id=? AND request_key=?',[$thread,$uid,$key])->fetch();
    if($old&&$old['body']!==$body) fail(409,'This message request was already used.');
    if(!$old) {
        query('INSERT INTO support_messages (thread_id,sender_user_id,sender_role,request_key,body) VALUES (?,?,?,?,?)',[$thread,$uid,$u['role'],$key,$body]);
        query('UPDATE support_threads SET updated_at=UTC_TIMESTAMP() WHERE id=?',[$thread]);
        query('INSERT INTO notifications (recipient_user_id,audience,title_en,body_en,title_tl,body_tl,action_tab,support_thread_id) VALUES (?,?,?,?,?,?,?,?)',[
            $u['role']==='admin'?$t['user_id']:null,$u['role']==='admin'?'user':'admin',$u['role']==='admin'?'Office staff replied':'New support message','Open Live support to read the message.',$u['role']==='admin'?'May sagot ang tanggapan':'Bagong mensahe sa tanggapan','Buksan ang Tulong online upang basahin ang mensahe.','support',$thread]);
    }
    db()->commit();respond(200,['ok'=>true,'threads'=>support_data($u,$thread),'notices'=>notices($u)]);
}
if($action==='notifications') respond(200,['ok'=>true,'notices'=>notices($u)]);
if($action==='notice_read') {
    post();$visible=notices($u);$ids=array_column(isset($d['id'])?$visible:array_filter($visible,fn($n)=>$n['kind']==='notification'),'id');
    if(isset($d['id'])) { $id=record_id($d['id']);if(!in_array($id,$ids,true)) fail(404,'Notification not found.');$ids=[$id]; }
    db()->beginTransaction();foreach($ids as $id) query('INSERT IGNORE INTO notification_reads (notification_id,user_id) VALUES (?,?)',[$id,$uid]);db()->commit();
    respond(200,['ok'=>true,'notices'=>notices($u)]);
}
if($action==='checklist_export') {
    docx_response('cyberlawassist-checklist.docx','Preparation Checklist',checklist_document($u,checklist($uid)),$u['name']);
}
if(in_array($action,['cases','case_get','case_save','report','report_export','users','user_status','user_password','admin_create','user_delete'],true)) admin();
if($action==='users') respond(200,['ok'=>true,'users'=>user_directory(),'administrators'=>user_directory('admin')]);
if($action==='admin_create') {
    post();create_account($d,'admin');
    respond(201,['ok'=>true,'administrators'=>user_directory('admin')]);
}
if($action==='user_status') {
    post();$id=text($d,'id',32,true);$status=choice($d,'status',['active','disabled']);
    if(!query("SELECT id FROM users WHERE id=? AND role='user'",[$id])->fetch()) fail(404,'User account not found.');
    query("UPDATE users SET status=?,session_version=session_version+1 WHERE id=? AND role='user'",[$status,$id]);respond(200,['ok'=>true,'users'=>user_directory()]);
}
if($action==='user_delete') {
    post();$id=text($d,'id',32,true);
    if(($d['confirmation']??'')!=='DELETE') fail(422,'Type DELETE to confirm removal.');
    if(!password_verify(secret($d,'current_password'),$u['password_hash'])) fail(403,'Your administrator password is incorrect.');
    db()->beginTransaction();
    if(!query("SELECT id FROM users WHERE id=? AND role='user' FOR UPDATE",[$id])->fetch()) fail(404,'User account not found.');
    if(query('SELECT id FROM case_records WHERE created_by=? LIMIT 1',[$id])->fetch()) fail(409,'This account is linked to office records. Disable it instead.');
    query('DELETE FROM chat_conversations WHERE user_id=?',[$id]);
    query('DELETE FROM support_threads WHERE user_id=?',[$id]);
    query('DELETE FROM checklist_items WHERE user_id=?',[$id]);
    query('DELETE FROM notifications WHERE recipient_user_id=?',[$id]);
    query('DELETE FROM notification_reads WHERE user_id=?',[$id]);
    query("DELETE FROM users WHERE id=? AND role='user'",[$id]);
    db()->commit();respond(200,['ok'=>true,'users'=>user_directory(),'threads'=>support_data($u),'notices'=>notices($u)]);
}
if($action==='user_password') {
    post();$id=text($d,'id',32,true);$new=$d['password']??'';
    if(!password_verify(secret($d,'current_password'),$u['password_hash'])) fail(403,'Your administrator password is incorrect.');
    if(!is_string($new)||mb_strlen($new)<8||trim($new)===''||strlen($new)>72||str_contains($new,"\0")||$new!==($d['confirm-password']??null)) fail(422,'Choose a matching new password with at least 8 characters.');
    if(!query("SELECT id FROM users WHERE id=? AND role='user'",[$id])->fetch()) fail(404,'User account not found.');
    query('UPDATE users SET password_hash=?,session_version=session_version+1,login_failures=0,login_locked_until=NULL WHERE id=?',[password_hash($new,PASSWORD_DEFAULT),$id]);respond(200,['ok'=>true]);
}
if($action==='cases') {
    $search=text($_GET,'search',120);$offset=isset($_GET['offset'])&&ctype_digit((string)$_GET['offset'])?min(1000000,(int)$_GET['offset']):0;
    respond(200,['ok'=>true,'cases'=>cases_data($search,$offset),'dashboard'=>dashboard()]);
}
if($action==='case_get') {
    $reference=text($_GET,'reference',32,true);$r=query('SELECT * FROM case_records WHERE reference=?',[$reference])->fetch();if(!$r) fail(404,'Intake record not found.');respond(200,['ok'=>true,'record'=>case_row($r)]);
}
if($action==='case_save') {
    post();$name=text($d,'name',120,true);$phone=text($d,'phone',50);$staff=text($d,'staff',120);$notes=text($d,'notes',4000);$date=text($d,'date',10,true);
    $day=DateTimeImmutable::createFromFormat('!Y-m-d',$date);if(!$day||$day->format('Y-m-d')!==$date) fail(422,'Enter a valid visit date.');
    $type=choice($d,'type',array_values(CONCERNS));$status=choice($d,'status',array_values(CASE_STATUSES));
    db()->beginTransaction();
    if(isset($d['id'])) {
        $id=record_id($d['id']);$old=query('SELECT revision FROM case_records WHERE id=? FOR UPDATE',[$id])->fetch();if(!$old) fail(404,'Intake record not found.');
        if((int)($d['revision']??0)!==(int)$old['revision']) fail(409,'This record changed since you opened it. Reopen the record before editing.');
        query('UPDATE case_records SET visitor_name=?,contact_number=?,concern_type=?,visit_date=?,assigned_staff=?,status=?,factual_notes=?,is_legacy=0,revision=revision+1 WHERE id=?',[$name,$phone?:null,array_search($type,CONCERNS,true),$date,$staff?:null,array_search($status,CASE_STATUSES,true),$notes?:null,$id]);
    } else {
        $key=text($d,'request_key',80,true);
        if(!preg_match('/^[a-zA-Z0-9_-]{8,80}$/D',$key)) fail(422,'Choose a valid request key.');
        $old=query('SELECT * FROM case_records WHERE created_by=? AND request_key=? FOR UPDATE',[$uid,$key])->fetch();
        if($old) { db()->commit();respond(200,['ok'=>true,'record'=>case_row($old),'cases'=>cases_data(),'dashboard'=>dashboard()]); }
        query('INSERT INTO case_records (visitor_name,contact_number,concern_type,visit_date,assigned_staff,status,factual_notes,created_by,request_key) VALUES (?,?,?,?,?,?,?,?,?)',[$name,$phone?:null,array_search($type,CONCERNS,true),$date,$staff?:null,array_search($status,CASE_STATUSES,true),$notes?:null,$uid,$key]);
        $id=db()->lastInsertId();$year=(new DateTimeImmutable('now',new DateTimeZone('Asia/Manila')))->format('Y');
        query('UPDATE case_records SET reference=? WHERE id=?',['PAO-'.$year.'-'.str_pad($id,3,'0',STR_PAD_LEFT),$id]);
    }
    db()->commit();$r=query('SELECT * FROM case_records WHERE id=?',[$id])->fetch();respond(200,['ok'=>true,'record'=>case_row($r),'cases'=>cases_data(),'dashboard'=>dashboard()]);
}
if($action==='report'||$action==='report_export') {
    $range=choice($_GET,'range',['week','month','year'],'month');$anchor=text($_GET,'anchor',10)?:date('Y-m-d');$report=report_data($range,$anchor);
    if($action==='report') respond(200,['ok'=>true,'report'=>$report]);
    docx_response('cyberlawassist-'.$range.'-report-'.$anchor.'.docx','Office Activity Report',report_document($u,$report),$u['name']);
}
fail(400,'Unknown action.');
