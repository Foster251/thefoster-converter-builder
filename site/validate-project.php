<?php
declare(strict_types=1);
session_start();header('Content-Type: application/json; charset=utf-8');header('X-Content-Type-Options: nosniff');
function out(int $c,array $d):void{http_response_code($c);echo json_encode($d,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);exit;}
if($_SERVER['REQUEST_METHOD']!=='POST')out(405,['ok'=>false,'error'=>'Разрешена только POST-загрузка.']);
if(empty($_SESSION['user_id']))out(401,['ok'=>false,'error'=>'Войди в аккаунт, чтобы проверить проект.']);
if(empty($_FILES['project'])||$_FILES['project']['error']!==UPLOAD_ERR_OK)out(400,['ok'=>false,'error'=>'Файл не загружен или произошла ошибка загрузки.']);
$f=$_FILES['project'];if($f['size']>50*1024*1024)out(413,['ok'=>false,'error'=>'Максимальный размер — 50 МБ.']);$ext=strtolower(pathinfo($f['name'],PATHINFO_EXTENSION));
if($ext==='html'||$ext==='htm'){$c=file_get_contents($f['tmp_name']);if($c===false||(!preg_match('/<html[\\s>]/i',$c)&&!preg_match('/<body[\\s>]/i',$c)))out(422,['ok'=>false,'error'=>'В файле не найден HTML-документ.']);out(200,['ok'=>true,'message'=>'HTML-файл проверен. Настоящая сборка APK требует Android build worker.']);}
if($ext!=='zip')out(422,['ok'=>false,'error'=>'Поддерживаются только HTML и ZIP.']);if(!class_exists('ZipArchive'))out(501,['ok'=>false,'error'=>'На хостинге не включено расширение ZipArchive.']);
$z=new ZipArchive();if($z->open($f['tmp_name'])!==true)out(422,['ok'=>false,'error'=>'Не удалось открыть ZIP-архив.']);$found=false;$total=0;$entries=0;
for($i=0;$i<$z->numFiles;$i++){$s=$z->statIndex($i);if(!$s)continue;$n=str_replace('\\\\','/',$s['name']);if(strpos($n,'../')!==false||substr($n,0,1)==='/'||preg_match('/^[A-Za-z]:/',$n)){$z->close();out(422,['ok'=>false,'error'=>'Архив содержит небезопасный путь.']);}$total+=(int)$s['size'];$entries++;if(strtolower(basename($n))==='index.html')$found=true;if($entries>5000||$total>209715200){$z->close();out(413,['ok'=>false,'error'=>'Слишком много файлов или слишком большой распакованный размер.']);}}
$z->close();if(!$found)out(422,['ok'=>false,'error'=>'В архиве не найден index.html.']);out(200,['ok'=>true,'message'=>'ZIP проверен: index.html найден. Для APK всё ещё нужен сервер сборки Android.','entries'=>$entries]);
