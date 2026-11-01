const $ = (id) => document.getElementById(id);
const fileInput = $('fileInput'), dropzone = $('dropzone');
let selectedImage = null, convertedUrl = null, apkFile = null;

function showNotice(el, message, kind='info') {
  el.textContent = message;
  el.classList.remove('hidden');
  el.style.borderColor = kind === 'error' ? '#9d4444' : '';
  el.style.color = kind === 'error' ? '#ffb1b1' : '';
}
function hideNotice(el) { el.classList.add('hidden'); }
function prettySize(bytes) {
  if (bytes < 1024) return bytes + ' Б';
  if (bytes < 1024*1024) return (bytes/1024).toFixed(1) + ' КБ';
  return (bytes/1024/1024).toFixed(2) + ' МБ';
}
function setImage(file) {
  hideNotice($('notice')); $('resultCard').classList.add('hidden');
  if (!file) return;
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  if (!['png','jpg','jpeg','webp'].includes(ext) || !file.type.startsWith('image/')) {
    showNotice($('notice'), 'Этот формат пока не поддерживается быстрым конвертером. Сейчас доступны PNG, JPG и WEBP.', 'error'); return;
  }
  if (file.size > 20*1024*1024) { showNotice($('notice'), 'Файл больше 20 МБ. Выбери изображение меньшего размера.', 'error'); return; }
  selectedImage = file;
  $('selectedFile').classList.remove('hidden'); $('fileName').textContent = file.name; $('fileSize').textContent = prettySize(file.size); $('fileType').textContent = ext.toUpperCase(); $('sourceFormat').value = ext.toUpperCase(); $('convertBtn').disabled = false;
  $('dropzone').style.display = 'none';
}
function clearImage() {
  selectedImage = null; fileInput.value = ''; $('selectedFile').classList.add('hidden'); $('dropzone').style.display = ''; $('convertBtn').disabled = true; $('resultCard').classList.add('hidden');
  if (convertedUrl) URL.revokeObjectURL(convertedUrl); convertedUrl = null;
}
$('browseBtn').addEventListener('click', e=>{e.stopPropagation();fileInput.click()});
dropzone.addEventListener('click', ()=>fileInput.click());
dropzone.addEventListener('keydown', e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();fileInput.click()}});
fileInput.addEventListener('change', ()=>setImage(fileInput.files[0]));
['dragenter','dragover'].forEach(evt=>dropzone.addEventListener(evt,e=>{e.preventDefault();dropzone.classList.add('dragging')}));
['dragleave','drop'].forEach(evt=>dropzone.addEventListener(evt,e=>{e.preventDefault();dropzone.classList.remove('dragging')}));
dropzone.addEventListener('drop', e=>setImage(e.dataTransfer.files[0]));
$('removeFile').addEventListener('click',clearImage);

$('convertBtn').addEventListener('click',()=>{
  if(!selectedImage)return;
  const target=$('targetFormat').value;
  const reader=new FileReader();
  reader.onerror=()=>showNotice($('notice'),'Не удалось прочитать файл. Попробуй другое изображение.','error');
  reader.onload=()=>{
    const image=new Image();
    image.onerror=()=>showNotice($('notice'),'Изображение повреждено или не поддерживается.','error');
    image.onload=()=>{
      const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;
      const ctx=canvas.getContext('2d');
      if(target==='image/jpeg'){ctx.fillStyle='#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height)}
      ctx.drawImage(image,0,0);
      canvas.toBlob(blob=>{
        if(!blob){showNotice($('notice'),'Не удалось преобразовать изображение.','error');return}
        if(convertedUrl)URL.revokeObjectURL(convertedUrl);
        convertedUrl=URL.createObjectURL(blob);
        const ext=target==='image/jpeg'?'jpg':target.split('/')[1];
        const outName=selectedImage.name.replace(/\.[^.]+$/,'')+'.'+ext;
        $('downloadBtn').href=convertedUrl;$('downloadBtn').download=outName;
        $('resultInfo').textContent=`${outName} · ${image.naturalWidth} × ${image.naturalHeight} · ${prettySize(blob.size)}`;
        $('resultCard').classList.remove('hidden');hideNotice($('notice'));
      },target,.92);
    };image.src=reader.result;
  };reader.readAsDataURL(selectedImage);
});

const toolDetails={
 image:['Конвертер изображений','Преобразуй изображение в другой формат прямо в браузере.','image/png,image/jpeg,image/webp','PNG, JPG или WEBP · до 20 МБ'],
 html:['HTML → APK','Подготовь HTML-сайт к превращению в Android-приложение.','.html,.htm,.zip','HTML или ZIP · сборка APK требует сервер'],
 document:['Конвертер документов','Инструменты для документов появятся в следующих версиях.','.pdf,.txt,.doc,.docx','PDF, TXT, DOCX — скоро'],
 archive:['Работа с архивами','Загрузи ZIP с файлами сайта для проверки структуры.','.zip','ZIP-архивы сайтов'],
 audio:['Конвертер аудио','Конвертация аудиоформатов появится в следующих версиях.','.mp3,.wav,.ogg','MP3, WAV — скоро'],
 video:['Конвертер видео','Конвертация видео появится в следующих версиях.','.mp4,.webm,.mov','MP4, WEBM — скоро']
};
document.querySelectorAll('.tool-card').forEach(card=>card.addEventListener('click',()=>{
 document.querySelectorAll('.tool-card').forEach(c=>c.classList.remove('active'));card.classList.add('active');
 const key=card.dataset.tool, d=toolDetails[key];$('converterTitle').textContent=d[0];$('converterHint').textContent=d[1];$('acceptedTypes').textContent=d[3];
 if(key==='image'){$('imageControls').classList.remove('hidden');$('dropzone').style.display='';$('dropzone').querySelector('h3').textContent='Перетащи файл сюда';fileInput.accept=d[2];$('browseBtn').textContent='выбери на устройстве';}
 else {$('imageControls').classList.add('hidden');clearImage();$('dropzone').style.display='';$('dropzone').querySelector('h3').textContent=key==='html'?'Выбери HTML или ZIP-файл':'Этот инструмент скоро появится';$('browseBtn').textContent='выбери файл';}
 $('converter').scrollIntoView({behavior:'smooth',block:'start'});
 if(key!=='image')showNotice($('notice'),key==='html'?'Для настоящей сборки APK необходимо подключить отдельный сервер с Android SDK. Настройка проекта доступна ниже.':'Этот тип конвертации добавим в следующих версиях.');
}));

function handleApkFile(file){
 hideNotice($('apkNotice'));if(!file)return;
 const ext=(file.name.split('.').pop()||'').toLowerCase();
 if(!['html','htm','zip'].includes(ext)){showNotice($('apkNotice'),'Выбери HTML-файл (.html) или ZIP-архив (.zip).','error');return}
 if(file.size>50*1024*1024){showNotice($('apkNotice'),'Максимальный размер файла — 50 МБ.','error');return}
 apkFile=file;$('apkFileName').textContent=file.name;$('apkFileHint').textContent=prettySize(file.size)+' · файл выбран';
}
$('apkBrowse').addEventListener('click',()=>$('apkInput').click());
$('apkDrop').addEventListener('click',e=>{if(!e.target.closest('button'))$('apkInput').click()});
$('apkInput').addEventListener('change',()=>handleApkFile($('apkInput').files[0]));
$('apkDrop').addEventListener('dragover',e=>{e.preventDefault();$('apkDrop').classList.add('dragging')});
$('apkDrop').addEventListener('dragleave',()=> $('apkDrop').classList.remove('dragging'));
$('apkDrop').addEventListener('drop',e=>{e.preventDefault();$('apkDrop').classList.remove('dragging');handleApkFile(e.dataTransfer.files[0])});
$('packageLock').addEventListener('click',()=>openModal('Собственный идентификатор — PRO','В Converter PRO можно будет указать собственный идентификатор приложения. Сейчас используется com.fosterstudio.app.'));
$('iconOption').addEventListener('click',()=>openModal('Своя иконка — PRO','Загрузка собственной иконки будет доступна с подпиской Converter PRO за 75 ₽/месяц.'));
$('buildBtn').addEventListener('click', async ()=>{
 hideNotice($('apkNotice'));
 if(!apkFile){showNotice($('apkNotice'),'Сначала выбери HTML-файл или ZIP-архив сайта.','error');return}
 const name=$('appName').value.trim(),version=$('appVersion').value.trim();
 if(!name){showNotice($('apkNotice'),'Укажи название приложения.','error');return}
 if(!/^\d+(\.\d+){1,2}$/.test(version)){showNotice($('apkNotice'),'Версия должна быть в формате 1.0 или 1.0.0.','error');return}
 if(!currentUser){showNotice($('apkNotice'),'Войди или зарегистрируйся, чтобы проверять проект на сервере.','error');showAuth();return}
 const form=new FormData();form.append('project',apkFile);
 $('buildBtn').disabled=true;$('buildBtn').textContent='Проверяем…';
 try{
  const response=await fetch('validate-project.php',{method:'POST',body:form,credentials:'same-origin'});
  const data=await response.json();if(!response.ok||!data.ok)throw new Error(data.error||'Не удалось проверить проект.');
  showNotice($('apkNotice'),data.message+' Название: «'+name+'», версия '+version+'.');
 }catch(err){showNotice($('apkNotice'),err.message,'error')}
 finally{$('buildBtn').disabled=false;$('buildBtn').innerHTML='Проверить проект <span>→</span>'}
});
function openModal(title,text){$('modalTitle').textContent=title;$('modalText').textContent=text;$('modal').classList.remove('hidden')}
function closeModal(){$('modal').classList.add('hidden')}
$('modalClose').addEventListener('click',closeModal);$('modalOk').addEventListener('click',closeModal);$('modal').addEventListener('click',e=>{if(e.target===$('modal'))closeModal()});
$('proBtn').addEventListener('click',()=>openModal('Converter PRO — 75 ₽/месяц','Платёжная система пока не подключена. Сейчас готовим интерфейс и функциональность, затем добавим безопасную оплату и серверную проверку подписки.'));
$('subscribeBtn').addEventListener('click',()=>openModal('Подписка скоро появится','Converter PRO будет стоить 75 ₽ в месяц. Оплата станет доступна после подключения платёжной системы.'));

$('mobileMenu').addEventListener('click',()=>document.querySelector('.nav').classList.toggle('open'));
document.querySelectorAll('.nav a').forEach(a=>a.addEventListener('click',()=>document.querySelector('.nav').classList.remove('open')));

// Registration/login powered by api.php. Works when deployed on PHP hosting.
let authMode='login',currentUser=null;
function setAuthMode(mode){authMode=mode;document.querySelectorAll('.auth-tab').forEach(t=>t.classList.toggle('active',t.dataset.authMode===mode));$('authHeading').textContent=mode==='register'?'Создать аккаунт':'Вход в аккаунт';$('authSubmit').textContent=mode==='register'?'Зарегистрироваться':'Войти';$('authNameWrap').classList.toggle('hidden',mode!=='register');$('authPassword').autocomplete=mode==='register'?'new-password':'current-password';$('authNotice').classList.add('hidden')}
function showAuth(){$('authModal').classList.remove('hidden');setAuthMode('login')}
async function apiRequest(action,payload={}){const r=await fetch('api.php?action='+encodeURIComponent(action),{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},credentials:'same-origin',body:JSON.stringify(payload)});let d;try{d=await r.json()}catch(_){throw new Error('Сервер вернул некорректный ответ. Проверь поддержку PHP.')}if(!r.ok||!d.ok)throw new Error(d.error||'Не удалось выполнить запрос.');return d}
function renderUser(user){currentUser=user||null;if(user){$('accountBtn').classList.add('hidden');$('accountChip').classList.remove('hidden');$('accountDisplay').textContent=user.name||user.email}else{$('accountBtn').classList.remove('hidden');$('accountChip').classList.add('hidden')}}
async function checkSession(){try{const r=await fetch('api.php?action=me',{credentials:'same-origin',headers:{'Accept':'application/json'}});const d=await r.json();if(d.ok)renderUser(d.user||null)}catch(_){}}
$('accountBtn').addEventListener('click',showAuth);$('authClose').addEventListener('click',()=>$('authModal').classList.add('hidden'));$('authModal').addEventListener('click',e=>{if(e.target===$('authModal'))$('authModal').classList.add('hidden')});
document.querySelectorAll('.auth-tab').forEach(t=>t.addEventListener('click',()=>setAuthMode(t.dataset.authMode)));
$('authForm').addEventListener('submit',async e=>{e.preventDefault();const payload={email:$('authEmail').value.trim(),password:$('authPassword').value};if(authMode==='register')payload.name=$('authName').value.trim();$('authSubmit').disabled=true;$('authSubmit').textContent='Подождите…';try{const d=await apiRequest(authMode,payload);renderUser(d.user);$('authModal').classList.add('hidden');$('authForm').reset();openModal(authMode==='register'?'Аккаунт создан':'Вы вошли',authMode==='register'?'Регистрация прошла успешно.':'Вы успешно вошли в аккаунт.')}catch(err){showNotice($('authNotice'),err.message,'error')}finally{$('authSubmit').disabled=false;$('authSubmit').textContent=authMode==='register'?'Зарегистрироваться':'Войти'}});
$('logoutBtn').addEventListener('click',async()=>{try{await apiRequest('logout');renderUser(null);openModal('Вы вышли','Сессия завершена.')}catch(err){openModal('Не удалось выйти',err.message)}});
checkSession();
