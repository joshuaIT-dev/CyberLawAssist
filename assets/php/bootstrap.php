<?php
declare(strict_types=1);
const CLA_POLICY_VERSION='2026-10-18';
ini_set('display_errors','0');
date_default_timezone_set('UTC');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');
class ApiError extends RuntimeException {
    public function __construct(public int $status,string $message) { parent::__construct($message); }
}
function fail(int $status,string $message): never { throw new ApiError($status,$message); }
function respond(int $status,array $payload): never {
    if(session_status()===PHP_SESSION_ACTIVE) session_write_close();
    http_response_code($status);
    echo json_encode($payload,JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE|JSON_INVALID_UTF8_SUBSTITUTE); exit;
}
set_exception_handler(function(Throwable $e): void {
    if(isset($GLOBALS['cla_db'])&&$GLOBALS['cla_db']->inTransaction()) $GLOBALS['cla_db']->rollBack();
    if($e instanceof ApiError) respond($e->status,['ok'=>false,'message'=>$e->getMessage()]);
    error_log('CyberLawAssist: '.get_class($e).' code '.$e->getCode());
    respond(503,['ok'=>false,'message'=>'The service is temporarily unavailable. Check XAMPP MySQL and the local services.']);
});
function config(): array {
    static $config;
    if($config===null) {
        $path=getenv('CYBERLAWASSIST_CONFIG')?:dirname(__DIR__,4).'/cyberlawassist-private/config.php';
        if(!is_file($path)) fail(503,'Database setup is required. Run database/setup.php from the local command line.');
        $config=require $path;
    }
    return $config;
}
function db(): PDO {
    if(!isset($GLOBALS['cla_db'])) {
        $c=config();
        $pdo=new PDO($c['dsn'],$c['user'],$c['password'],[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC,PDO::ATTR_EMULATE_PREPARES=>false]);
        $pdo->exec("SET time_zone = '+00:00'"); $GLOBALS['cla_db']=$pdo;
    }
    return $GLOBALS['cla_db'];
}
function query(string $sql,array $values=[]): PDOStatement { $s=db()->prepare($sql);$s->execute($values);return $s; }
function input(): array {
    if((int)($_SERVER['CONTENT_LENGTH']??0)>262144) fail(413,'This request is too large.');
    if(str_contains($_SERVER['CONTENT_TYPE']??'','application/json')) {
        try { $value=json_decode(file_get_contents('php://input'),true,32,JSON_THROW_ON_ERROR); }
        catch(JsonException) { fail(422,'Send a valid JSON request.'); }
        if(!is_array($value)||($value!==[]&&array_is_list($value))) fail(422,'Send a JSON object.');
        return $value;
    }
    return $_POST;
}
function text(array $d,string $key,int $max,bool $required=false): string {
    $v=$d[$key]??'';if(!is_string($v)) fail(422,'Check the '.$key.' field.');$v=trim($v);
    if(($required&&$v==='')||mb_strlen($v)>$max) fail(422,'Check the '.$key.' field.');return $v;
}
function secret(array $d,string $key): string {
    $v=$d[$key]??null;
    if(!is_string($v)||$v===''||strlen($v)>1024) fail(422,'Enter your current password.');
    return $v;
}
function choice(array $d,string $key,array $allowed,string $default=''): string {
    $v=text($d,$key,80)?:$default;if(!in_array($v,$allowed,true)) fail(422,'Choose a valid '.$key.'.');return $v;
}
function record_id(mixed $id): string {
    if(!is_scalar($id)||!preg_match('/^[1-9][0-9]{0,17}$/D',(string)$id)) fail(422,'Choose a valid record.');return (string)$id;
}
function boolean(array $d,string $key): int { if(!isset($d[$key])||!is_bool($d[$key])) fail(422,'Check the '.$key.' setting.');return $d[$key]?1:0; }
function timestamp(?string $v): ?string { return $v?str_replace(' ','T',$v).'Z':null; }
function default_checklist(string $id): void {
    foreach(['Save relevant messages or posts','Record dates, times, and account names','Secure affected accounts','Write questions for the office'] as $i=>$label)
        query('INSERT INTO checklist_items (user_id,label,sort_order) VALUES (?,?,?)',[$id,$label,$i]);
}
function create_account(array $d,string $role): array {
    if($role==='user'&&(($d['terms_accepted']??'')!=='yes'||($d['policy_version']??'')!==CLA_POLICY_VERSION)) fail(422,'Read and accept the current Terms of Service and acknowledge the Privacy Policy. Refresh registration if the policy version changed.');
    $name=text($d,'name',120,true);$email=strtolower(text($d,'email',254,true));$phone=text($d,'phone',50);
    $password=$d['password']??'';$confirmation=$d['confirm-password']??'';
    if(!filter_var($email,FILTER_VALIDATE_EMAIL)) fail(422,'Enter a valid email address.');
    if(!is_string($password)||mb_strlen($password)<8||trim($password)===''||strlen($password)>72||str_contains($password,"\0")) fail(422,'Choose a password with at least 8 characters. Shorten it if it exceeds the password limit.');
    if($password!==$confirmation) fail(422,'Passwords do not match.');
    $adminNumber=$role==='admin'?strtoupper(text($d,'admin_number',40,true)):null;
    if($adminNumber!==null&&!preg_match('/^[A-Z0-9][A-Z0-9._-]{0,39}$/D',$adminNumber)) fail(422,'Use letters, numbers, dots, underscores, or hyphens for the admin number.');
    db()->beginTransaction();$id=bin2hex(random_bytes(16));
    try { query('INSERT INTO users (id,name,email,phone,password_hash,role,admin_number,policy_version,policy_accepted_at) VALUES (?,?,?,?,?,?,?,?,?)',[$id,$name,$email,$phone?:null,password_hash($password,PASSWORD_DEFAULT),$role,$adminNumber,$role==='user'?CLA_POLICY_VERSION:null,$role==='user'?gmdate('Y-m-d H:i:s'):null]); }
    catch(PDOException $e) { if($e->getCode()==='23000') fail(409,$role==='admin'?'An account with this email or admin number already exists.':'An account with this email already exists.');throw $e; }
    default_checklist($id);db()->commit();
    return query('SELECT * FROM users WHERE id=?',[$id])->fetch();
}
function public_user(array $u): array {
    return ['id'=>$u['id'],'name'=>$u['name'],'email'=>$u['email'],'phone'=>$u['phone']??'','role'=>$u['role'],'adminNumber'=>$u['admin_number']??null,'status'=>$u['status'],'uiLanguage'=>$u['ui_language'],'chatLanguage'=>$u['chat_language'],
        'settings'=>['emailUpdates'=>(bool)$u['email_updates'],'privacyMode'=>(bool)$u['privacy_reminders']],'createdAt'=>timestamp($u['created_at'])];
}
$sessionDir=dirname(__DIR__,4).'/cyberlawassist-private/sessions';
if(!is_dir($sessionDir)&&!mkdir($sessionDir,0700,true)&&!is_dir($sessionDir)) fail(503,'Session storage is unavailable.');
ini_set('session.use_strict_mode','1');ini_set('session.gc_maxlifetime','2592000');
session_save_path($sessionDir);session_name('CLASESSID');
$cookiePath=$claCookiePath??rtrim(str_replace('\\','/',dirname($_SERVER['SCRIPT_NAME'],3)),'/').'/';
session_set_cookie_params(['path'=>$cookiePath,'httponly'=>true,'secure'=>!empty($_SERVER['HTTPS'])&&$_SERVER['HTTPS']!=='off','samesite'=>'Lax']);
session_start();$_SESSION['csrf']??=bin2hex(random_bytes(32));
function csrf(): void {
    $v=$_SERVER['HTTP_X_CSRF_TOKEN']??'';
    if(!is_string($v)||!hash_equals($_SESSION['csrf'],$v)) fail(403,'Your session changed. Refresh the page and try again.');
}
function post(): void { if($_SERVER['REQUEST_METHOD']!=='POST') fail(405,'Use POST for this action.');csrf(); }
function current_user(bool $required=true): ?array {
    $u=null;
    if(isset($_SESSION['user_id'])&&($_SESSION['expires_at']??0)>time()) $u=query('SELECT * FROM users WHERE id=? AND status=?',[$_SESSION['user_id'],'active'])->fetch()?:null;
    if($u&&(int)($_SESSION['session_version']??0)!==(int)$u['session_version']) $u=null;
    if(!$u&&$required) fail(401,'Please log in to continue.');return $u;
}
function admin(): array { $u=current_user();if($u['role']!=='admin') fail(403,'Administrator access is required.');return $u; }
function sign_in(array $u,bool $remember=false): void {
    session_regenerate_id(true);$_SESSION['user_id']=$u['id'];$_SESSION['session_version']=(int)$u['session_version'];$_SESSION['expires_at']=time()+($remember?2592000:43200);$_SESSION['csrf']=bin2hex(random_bytes(32));
    if($remember) { $p=session_get_cookie_params();setcookie(session_name(),session_id(),['expires'=>$_SESSION['expires_at'],'path'=>$p['path'],'secure'=>$p['secure'],'httponly'=>true,'samesite'=>'Lax']); }
}
function local_ai(string $message,string $language,?string $topic): array {
    $ch=curl_init(config()['ai_url']);
    curl_setopt_array($ch,[CURLOPT_POST=>true,CURLOPT_POSTFIELDS=>json_encode(['message'=>$message,'language'=>$language,'context_topic'=>$topic]),CURLOPT_HTTPHEADER=>['Content-Type: application/json'],CURLOPT_RETURNTRANSFER=>true,CURLOPT_CONNECTTIMEOUT=>2,CURLOPT_TIMEOUT=>16,CURLOPT_PROTOCOLS=>CURLPROTO_HTTP]);
    $raw=curl_exec($ch);$status=(int)curl_getinfo($ch,CURLINFO_RESPONSE_CODE);curl_close($ch);
    $result=is_string($raw)?json_decode($raw,true):null;
    if($status!==200||!is_array($result)||!is_string($result['answer']??null)||$result['answer']===''||mb_strlen($result['answer'])>20000) fail(503,'The offline AI is unavailable. Start the AI service and retry your saved question.');
    return $result;
}
