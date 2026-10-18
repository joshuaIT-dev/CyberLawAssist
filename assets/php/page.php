<?php
declare(strict_types=1);

function page_not_found(): never {
    http_response_code(404);
    header('Content-Type: text/html; charset=utf-8');
    header('Cache-Control: no-store');
    readfile(dirname(__DIR__,2).'/extra/404.html');
    exit;
}
$path=rawurldecode((string)parse_url($_SERVER['REQUEST_URI']??'',PHP_URL_PATH));
$page=strtolower(basename($path));
if(!preg_match('/\A(?:(guest|user|admin)(?:-[a-z0-9-]+)?|login|signup|setup)\.html\z/D',$page,$match)) {
    page_not_found();
}
$file=dirname(__DIR__,2).'/pages/'.$page;
if(!is_file($file)) page_not_found();
$base=rtrim(str_replace('\\','/',dirname($path,2)),'/');
$claCookiePath=$base.'/';
require __DIR__.'/bootstrap.php';

$user=current_user(false);
$workspace=$page==='admin-login.html'?'':($match[1]??'');
$destination=null;
if($page==='setup.html') $destination=$user?$user['role'].'.html':'signup.html';
elseif($workspace!=='') {
    if($user&&$workspace!==$user['role']) $destination=$user['role'].'.html';
    elseif(!$user&&$workspace!=='guest') $destination=$workspace==='admin'?'admin-login.html':'login.html';
} elseif($user) $destination=$user['role'].'.html';

session_write_close();
if($destination!==null) { header('Location: '.$base.'/pages/'.$destination,true,302);exit; }
if(!in_array($_SERVER['REQUEST_METHOD'],['GET','HEAD'],true)) { http_response_code(405);header('Allow: GET, HEAD');exit; }
header('Content-Type: text/html; charset=utf-8');
if($_SERVER['REQUEST_METHOD']!=='HEAD') readfile($file);
