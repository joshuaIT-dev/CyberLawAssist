<?php
declare(strict_types=1);
require __DIR__.'/bootstrap.php';
$d=input();$action=$d['action']??$_GET['action']??'me';
if($action==='me') {
    $u=current_user(false);
    respond(200,['ok'=>true,'user'=>$u?public_user($u):null,'csrf'=>$_SESSION['csrf']]);
}
post();
if($action==='logout') {
    if(isset($_SERVER['HTTP_X_CLA_ACCOUNT'])&&($_SERVER['HTTP_X_CLA_ACCOUNT']!==(current_user(false)['id']??null))) fail(401,'The signed-in account changed. Please reopen your workspace.');
    $_SESSION=[];$p=session_get_cookie_params();
    setcookie(session_name(),'', ['expires'=>time()-3600,'path'=>$p['path'],'secure'=>$p['secure'],'httponly'=>true,'samesite'=>'Lax']);
    session_destroy();respond(200,['ok'=>true,'message'=>'You are signed out.']);
}
if($action==='register') {
    if(current_user(false)) fail(409,'Log out before creating another account.');
    $u=create_account($d,'user');sign_in($u);
    respond(201,['ok'=>true,'message'=>'Your account is ready.','user'=>public_user($u),'csrf'=>$_SESSION['csrf']]);
}
if(in_array($action,['login','admin_login'],true)) {
    if(current_user(false)) fail(409,'You are already signed in. Log out before using another account.');
    $adminLogin=$action==='admin_login';
    $identifier=$adminLogin?strtoupper(text($d,'admin_number',40,true)):strtolower(text($d,'email',254,true));
    $password=$d['password']??'';
    if(!is_string($password)||strlen($password)>1024) fail(422,'Check your password.');
    $u=$adminLogin?query("SELECT * FROM users WHERE admin_number=? AND role='admin'",[$identifier])->fetch():query('SELECT * FROM users WHERE email=?',[$identifier])->fetch();
    $attempts=(int)($_SESSION['login_attempts']??0);
    if(($_SESSION['login_window']??0)<time()-300) { $_SESSION['login_attempts']=0;$_SESSION['login_window']=time();$attempts=0; }
    if($attempts>=15) fail(429,'Too many sign-in attempts. Please wait five minutes.');
    if($u&&$u['login_locked_until']&&strtotime($u['login_locked_until'].' UTC')>time()) fail(429,'Too many sign-in attempts. Please wait fifteen minutes.');
    if(!$u||$u['status']!=='active'||!password_verify($password,$u['password_hash'])) {
        $_SESSION['login_attempts']=$attempts+1;
        if($u) query('UPDATE users SET login_failures=login_failures+1,login_locked_until=IF(login_failures>=5,DATE_ADD(UTC_TIMESTAMP(),INTERVAL 15 MINUTE),NULL) WHERE id=?',[$u['id']]);
        fail(401,$adminLogin?'Admin number or password is incorrect.':'Email or password is incorrect.');
    }
    query('UPDATE users SET login_failures=0,login_locked_until=NULL WHERE id=?',[$u['id']]);
    if(password_needs_rehash($u['password_hash'],PASSWORD_DEFAULT)) query('UPDATE users SET password_hash=? WHERE id=?',[password_hash($password,PASSWORD_DEFAULT),$u['id']]);
    $_SESSION['login_attempts']=0;sign_in($u,!empty($d['remember']));
    respond(200,['ok'=>true,'message'=>'You are signed in.','user'=>public_user($u),'csrf'=>$_SESSION['csrf']]);
}
fail(400,'Unknown account action.');
