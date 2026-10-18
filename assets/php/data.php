<?php
declare(strict_types=1);
function conversations(string $userId): array {
    $rows=query('SELECT * FROM chat_conversations WHERE user_id=? ORDER BY is_pinned DESC,updated_at DESC,id DESC',[$userId])->fetchAll();
    $map=[];
    foreach($rows as $r) $map[(string)$r['id']]=['id'=>(string)$r['id'],'title'=>$r['title'],'pin'=>(bool)$r['is_pinned'],'lastTopic'=>$r['last_topic'],'updatedAt'=>timestamp($r['updated_at']),'messages'=>[]];
    $messages=query('SELECT m.* FROM chat_messages m JOIN chat_conversations c ON c.id=m.conversation_id WHERE c.user_id=? ORDER BY m.id',[$userId])->fetchAll();
    $pairs=[];
    foreach($messages as $m) {
        $meta=json_decode($m['response_meta']??'null',true)?:[];
        $pairs[(string)$m['conversation_id']][$m['request_key']][$m['sender']]=['id'=>$m['sender']==='user'?$m['request_key']:'reply-'.$m['id'],'requestKey'=>$m['request_key'],'text'=>$m['body'],'mine'=>$m['sender']==='user','delivery'=>$m['delivery_status'],'language'=>$m['language'],'createdAt'=>timestamp($m['created_at'])]+$meta;
    }
    foreach($pairs as $id=>$requests) foreach($requests as $pair) foreach(['user','assistant'] as $sender) if(isset($pair[$sender])) $map[$id]['messages'][]=$pair[$sender];
    return array_values($map);
}
function conversation(string $id,string $userId): array {
    foreach(conversations($userId) as $c) if($c['id']===$id) return $c;
    fail(404,'This conversation is no longer available.');
}
function checklist(string $id): array {
    return array_map(fn($r)=>['id'=>(string)$r['id'],'label'=>$r['label'],'done'=>(bool)$r['is_completed']],query('SELECT id,label,is_completed FROM checklist_items WHERE user_id=? ORDER BY sort_order,id',[$id])->fetchAll());
}
function notices(?array $user,bool $guest=false): array {
    if($guest||!$user) $rows=query("SELECT n.*,NULL AS read_at FROM notifications n WHERE recipient_user_id IS NULL AND audience IN ('all','guest') AND kind='notification' ORDER BY n.id DESC")->fetchAll();
    else $rows=query("SELECT n.*,r.read_at FROM notifications n LEFT JOIN notification_reads r ON r.notification_id=n.id AND r.user_id=? WHERE n.recipient_user_id=? OR (n.recipient_user_id IS NULL AND n.audience IN ('all',?)) ORDER BY n.id DESC",[$user['id'],$user['id'],$user['role']])->fetchAll();
    return array_map(fn($r)=>['id'=>(string)$r['id'],'title'=>$r['title_en'],'body'=>$r['body_en'],'titleTl'=>$r['title_tl'],'bodyTl'=>$r['body_tl'],'read'=>$r['read_at']!==null,'kind'=>$r['kind'],'actionTab'=>$r['action_tab'],'threadId'=>$r['support_thread_id']?(string)$r['support_thread_id']:null,'createdAt'=>timestamp($r['created_at'])],$rows);
}
function content_data(): array {
    return ['laws'=>query('SELECT t.slug,t.source_urls,x.* FROM law_topics t JOIN law_translations x ON x.law_topic_id=t.id WHERE t.is_published=1 ORDER BY t.sort_order,t.id')->fetchAll(),
        'contacts'=>query('SELECT slug,contact_type,name,address,phone,website_url FROM office_contacts WHERE is_active=1 ORDER BY sort_order,id')->fetchAll()];
}
function support_data(array $u,?string $selected=null): array {
    $sql="SELECT t.*,u.name,u.email,m.body,m.sender_role,m.created_at AS message_time FROM support_threads t JOIN users u ON u.id=t.user_id LEFT JOIN support_messages m ON m.id=(SELECT MAX(z.id) FROM support_messages z WHERE z.thread_id=t.id)";
    $rows=query($sql.($u['role']==='admin'?'':' WHERE t.user_id=?').' ORDER BY t.updated_at DESC,t.id DESC',$u['role']==='admin'?[]:[$u['id']])->fetchAll();
    $threads=[];
    foreach($rows as $r) {
        $id=(string)$r['id'];$messages=[];
        if($u['role']==='user'||$selected===$id) {
            $messages=array_map(fn($m)=>['id'=>(string)$m['id'],'text'=>$m['body'],'sender'=>$m['sender_role'],'createdAt'=>timestamp($m['created_at'])],query('SELECT * FROM support_messages WHERE thread_id=? ORDER BY id',[$id])->fetchAll());
        } elseif($r['body']!==null) $messages=[['text'=>$r['body'],'sender'=>$r['sender_role'],'createdAt'=>timestamp($r['message_time'])]];
        $threads[]=['id'=>$id,'userId'=>$r['user_id'],'name'=>$r['name'],'email'=>$r['email'],'updatedAt'=>timestamp($r['updated_at']),'messages'=>$messages];
    }
    if($selected!==null&&!array_filter($threads,fn($t)=>$t['id']===$selected)) fail(404,'Support conversation not found.');
    return $threads;
}
const CONCERNS=['online_harassment'=>'Online harassment','account_access'=>'Account access concern','online_fraud'=>'Online fraud inquiry','identity_theft'=>'Identity theft','other'=>'Other'];
const CASE_STATUSES=['for_review'=>'For review','in_progress'=>'In progress','referred'=>'Referred','completed'=>'Completed'];
function case_row(array $r): array {
    return ['id'=>$r['reference'],'dbId'=>(string)$r['id'],'revision'=>(int)$r['revision'],'name'=>$r['visitor_name']??'','phone'=>$r['contact_number']??'','type'=>CONCERNS[$r['concern_type']],'date'=>$r['visit_date']??'','staff'=>$r['assigned_staff']??'','status'=>CASE_STATUSES[$r['status']],'notes'=>$r['factual_notes']??'','legacy'=>(bool)$r['is_legacy'],'createdAt'=>timestamp($r['created_at'])];
}
function cases_data(string $search='',int $offset=0): array {
    $where='';$args=[];
    if($search!=='') { $where=" WHERE reference LIKE ? OR visitor_name LIKE ? OR contact_number LIKE ? OR visit_date LIKE ? OR assigned_staff LIKE ? OR REPLACE(concern_type,'_',' ') LIKE ? OR REPLACE(status,'_',' ') LIKE ?";$args=array_fill(0,7,'%'.addcslashes($search,'\\%_').'%'); }
    $count=(int)query('SELECT COUNT(*) FROM case_records'.$where,$args)->fetchColumn();
    $rows=query('SELECT * FROM case_records'.$where.' ORDER BY id DESC LIMIT 50 OFFSET '.max(0,$offset),$args)->fetchAll();
    return ['records'=>array_map('case_row',$rows),'total'=>$count,'offset'=>$offset,'hasMore'=>$offset+count($rows)<$count];
}
function dashboard(): array {
    $today=(new DateTimeImmutable('now',new DateTimeZone('Asia/Manila')))->format('Y-m-d');
    $r=query("SELECT COUNT(*) AS total,COALESCE(SUM(status NOT IN ('completed','referred')),0) AS open,COALESCE(SUM(visit_date=?),0) AS today FROM case_records",[$today])->fetch();
    return array_map('intval',$r);
}
function report_data(string $range,string $anchor): array {
    if(!in_array($range,['week','month','year'],true)) fail(422,'Choose a valid report period.');
    $day=DateTimeImmutable::createFromFormat('!Y-m-d',$anchor,new DateTimeZone('Asia/Manila'));
    if(!$day||$day->format('Y-m-d')!==$anchor) fail(422,'Choose a valid report date.');
    $start=match($range) {'week'=>$day->modify('-'.((int)$day->format('N')-1).' days'),'month'=>$day->modify('first day of this month'),'year'=>$day->setDate((int)$day->format('Y'),1,1)};
    $end=$start->modify(match($range){'week'=>'+7 days','month'=>'+1 month','year'=>'+1 year'});
    $format=$range==='year'?'%Y-%m':'%Y-%m-%d';
    $counts=query("SELECT DATE_FORMAT(visit_date,'{$format}') AS bucket,COUNT(*) AS total,SUM(status IN ('completed','referred')) AS completed FROM case_records WHERE visit_date>=? AND visit_date<? GROUP BY bucket",[$start->format('Y-m-d'),$end->format('Y-m-d')])->fetchAll();
    $map=[];$total=0;$completed=0;
    foreach($counts as $c) { $map[$c['bucket']]=(int)$c['total'];$total+=(int)$c['total'];$completed+=(int)$c['completed']; }
    $buckets=[];
    for($cursor=$start;$cursor<$end;$cursor=$cursor->modify($range==='year'?'+1 month':'+1 day')) {
        $key=$cursor->format($range==='year'?'Y-m':'Y-m-d');$buckets[]=['key'=>$key,'count'=>$map[$key]??0];
    }
    return ['range'=>$range,'anchor'=>$anchor,'start'=>$start->format('Y-m-d'),'end'=>$end->modify('-1 day')->format('Y-m-d'),'buckets'=>$buckets,'total'=>$total,'completed'=>$completed,'pending'=>$total-$completed];
}
function user_directory(string $role='user'): array {
    return array_map(fn($r)=>['id'=>$r['id'],'name'=>$r['name'],'email'=>$r['email'],'phone'=>$r['phone']??'','status'=>$r['status'],'adminNumber'=>$r['admin_number']??null,'threadId'=>$r['thread_id']?(string)$r['thread_id']:null],query("SELECT u.id,u.name,u.email,u.phone,u.status,u.admin_number,t.id AS thread_id FROM users u LEFT JOIN support_threads t ON t.user_id=u.id WHERE u.role=? ORDER BY u.name,u.id",[$role])->fetchAll());
}
