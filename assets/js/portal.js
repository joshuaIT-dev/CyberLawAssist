(async () => {
const role=document.body.dataset.role, app=document.getElementById('portal-app');
const accountTabs=role==='guest'?['language']:['profile','settings','language'];
const loginPage=role==='admin'?'admin-login.html':'login.html';
app.innerHTML=window.CLA_LOADING?.page()||'<div class="workspace-loading" role="status">Loading your workspace…</div>';
let boot;
try {
 if(role==='guest'){
  const identity=await CLA.auth('me');
  if(identity.user){location.replace(identity.user.role+'.html');return}
 }
 boot=await CLA.call(role==='guest'?'public':'bootstrap',undefined,role==='guest'?{}:{workspace:role});
}
catch(error) {
 if(error.status===403&&['user','admin'].includes(error.payload?.workspace)){location.replace(error.payload.workspace+'.html');return}
 if(error.status===401){location.replace(loginPage);return}
 app.innerHTML='<div class="workspace-loading"><h1>Could not open the workspace</h1><p></p><button class="button button-blue" onclick="location.reload()">Try again</button></div>';
 app.querySelector('p').textContent=error.message;return;
}
if(role!=='guest'&&boot.user.role!==role){location.replace(boot.user.role+'.html');return}
if(role!=='guest')CLA.bindAccount(boot.user.id);
let serverUser=boot.user||null, serverThreads=boot.threads||[], serverChecks=boot.checklist||[], serverCases=boot.cases?.records||[], caseTotal=boot.cases?.total||0, caseHasMore=boot.cases?.hasMore||false, casePageStart=boot.cases?.offset||0, caseOffset=(boot.cases?.offset||0)+(boot.cases?.records?.length||0), serverDashboard=boot.dashboard||{}, serverUsers=boot.users||[], serverReport=null, serverAlerts=[], caseSearch='', editingCase=null, selectedCase=null;
let serverAdministrators=boot.administrators||[];
const appearanceKey='cla-appearance';
let appearance=(()=>{try{return {...{dark:false,motion:true,textSize:1},...JSON.parse(localStorage.getItem(appearanceKey)||'{}')}}catch{return {dark:false,motion:true,textSize:1}}})();
function applyAppearance(){const scale=Math.min(1.2,Math.max(.9,Number(appearance.textSize)||1));document.body.classList.toggle('cla-dark',!!appearance.dark);document.body.classList.toggle('cla-motion',!!appearance.motion);document.documentElement.style.setProperty('--cla-text-scale',String(scale));const content=document.getElementById('content');if(content){const gutter=innerWidth<=680?28:innerWidth<=900?38:56;content.style.width=Math.max(0,Math.min(1120,content.parentElement.clientWidth-gutter)/scale)+'px'}}
window.addEventListener('resize',applyAppearance,{passive:true});
applyAppearance();
setTimeout(applyAppearance,0);
const contentData={laws:boot.laws||[],contacts:boot.contacts||[]};
let refreshVersion=0, reportVersion=0, searchVersion=0;
function errorNotice(error){
 if(error.status===401){app.replaceChildren();location.replace(loginPage);return}
 let box=document.getElementById('api-error');
 if(!box){box=document.createElement('div');box.id='api-error';box.className='api-feedback error';box.setAttribute('role','alert');document.body.appendChild(box)}
 box.textContent=localize(error.message||'Could not save this change. Please try again.');clearTimeout(errorNotice.timer);errorNotice.timer=setTimeout(()=>box.remove(),8000);
}
function savedNotice(message='Saved to your account.'){
 let box=document.getElementById('api-success');if(!box){box=document.createElement('div');box.id='api-success';box.className='api-feedback';box.setAttribute('role','status');document.body.appendChild(box)}
 box.textContent=localize(message);clearTimeout(savedNotice.timer);savedNotice.timer=setTimeout(()=>box.remove(),3500);
}
const items={
guest:[['chatbot','messages-square','Chatbot'],['decision','git-branch','Decision guide'],['history','history','History'],['law','book-open-text','RA 10175'],['notifications','bell','Notifications'],['about','building-2','About office']],
user:[['chatbot','messages-square','Chatbot'],['decision','git-branch','Decision guide'],['checklist','list-checks','Checklist'],['history','history','History'],['law','book-open-text','RA 10175'],['notifications','bell','Notifications'],['alerts','triangle-alert','Alerts'],['support','headset','Live support'],['about','building-2','About office']],
admin:[['dashboard','layout-dashboard','Dashboard'],['cases','folder-open','Case records'],['users','users-round','Users'],['intake','clipboard-pen-line','Physical intake'],['chatbot','messages-square','Chatbot'],['decision','git-branch','Decision guide'],['checklist','list-checks','Checklist'],['history','history','History'],['law','book-open-text','RA 10175'],['notifications','bell','Notifications'],['alerts','triangle-alert','Alerts'],['support','headset','Live support'],['reports','chart-no-axes-column-increasing','Reports'],['about','building-2','About office']]
};
const rn=role==='admin'?'Administrator':role==='user'?'Registered user':'Guest';
const icon=n=>'<i data-lucide="'+n+'"></i>';
const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const get=(k,d)=>{
 if(role!=='guest')return ({profile:serverUser,language:serverUser?.uiLanguage==='tl'?'Tagalog':'English','chat-language':serverUser?.chatLanguage||'auto',settings:serverUser?.settings,checks:serverChecks.map(x=>[x.label,x.done]),cases:serverCases})[k]??d;
 try{return JSON.parse(localStorage.getItem('cla-guest-'+k))??d}catch{return d}
};
const put=(k,v)=>{if(role==='guest')localStorage.setItem('cla-guest-'+k,JSON.stringify(v))};
const interfaceLanguage=()=>['Tagalog','Filipino'].includes(get('language','English'))?'Tagalog':'English';
const localize=value=>window.CyberLawLanguage?.text(value,interfaceLanguage())||value;
function mountPasswordToggles(root=app){root?.querySelectorAll?.('input[type="password"]').forEach((input,index)=>{if(input.parentElement?.classList.contains('password-control'))return;const label=input.closest('label');if(label)label.classList.add('password-field');const wrap=document.createElement('span');wrap.className='password-control';input.replaceWith(wrap);wrap.append(input);const toggle=document.createElement('button');toggle.type='button';toggle.className='password-toggle';toggle.dataset.action='toggle-password';toggle.dataset.target=input.id||(input.id='password-visible-'+index);toggle.setAttribute('aria-label','Show password');toggle.setAttribute('aria-pressed','false');toggle.textContent='Show';wrap.append(toggle)})}
function resetPasswordVisibility(form){form.querySelectorAll('.password-control input').forEach(input=>input.type='password');form.querySelectorAll('.password-toggle').forEach(button=>{button.textContent='Show';button.setAttribute('aria-label','Show password');button.setAttribute('aria-pressed','false')})}
function applyLanguage(root=app){window.CyberLawLanguage?.apply(root,interfaceLanguage());document.documentElement.lang=interfaceLanguage()==='Tagalog'?'tl':'en';mountPasswordToggles(root)}
let tab=(location.protocol==='file:'&&location.hash.slice(1))||document.body.dataset.tab||new URLSearchParams(location.search).get('tab')||(role==='admin'?'dashboard':'chatbot');
if(!items[role].some(x=>x[0]===tab)&&!accountTabs.includes(tab))tab=role==='admin'?'dashboard':'chatbot';
let chatSaveError='';
const conversationId=()=>Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
let selectedSupportId=null;
let selectedCaseId=null;
let caseDetailVersion=0;
function supportUser(){return serverUser}
function supportThreads(){return serverThreads}
function supportMessages(list){return list.map(m=>'<div class="chat-msg '+(m.sender===role?'mine':'')+'"><span class="chat-avatar">'+icon(m.sender==='admin'?'headset':m.sender==='user'?'user-round':'info')+'</span><div class="chat-bubble">'+esc(m.text)+'<small>'+esc(localize(m.sender==='admin'?'Office staff':m.sender==='user'?'Registered user':'Earlier preview message'))+' · '+esc(new Date(m.createdAt).toLocaleString())+'</small></div></div>').join('')}
function supportPage(){
 let threads,user;
 try{threads=supportThreads();if(role==='user')user=supportUser()}catch{return head('Live support','Conversations with registered users.')+'<div class="notice" role="alert">Could not load saved support conversations. Your saved data has not been changed.</div>'}
 const isAdmin=role==='admin',thread=isAdmin?threads.find(t=>t.id===selectedSupportId):threads.find(t=>t.userId===user?.id);
 const chat=thread||!isAdmin?'<section class="panel chat-panel support-inbox-chat"><div class="chat-heading">'+(isAdmin?'<button class="icon-button support-back" data-action="support-back" aria-label="Back to conversations">'+icon('arrow-left')+'</button>':'')+'<span class="chat-bot-icon">'+icon(isAdmin?'user-round':'headset')+'</span><div><b data-user-content>'+esc(isAdmin?thread.name:'Muntinlupa PAO support')+'</b><small>'+esc(isAdmin?(thread.email||'Registered user conversation'):'Messages with office staff')+'</small></div></div><div class="chat-scroll" id="chat-scroll">'+(thread?.messages.length?supportMessages(thread.messages):'<div class="support-welcome"><h3>How can the office help?</h3><p>Send your question to start a conversation with office staff.</p></div>')+'</div><p id="support-error" class="support-error" role="alert"></p><form class="chat-compose" data-form="support" novalidate><textarea name="message" rows="2" maxlength="4000" placeholder="'+(isAdmin?'Reply to this user…':'Write a message to the office…')+'" aria-label="Message" enterkeyhint="send" title="Enter to send. Shift+Enter for a new line."></textarea><button class="chat-send" aria-label="Send">'+icon('send')+'</button></form></section>':'<section class="panel support-inbox-chat empty-state"><span class="empty-icon">'+icon('messages-square')+'</span><h3>Select a conversation</h3><p>Choose a registered user from the list to read their messages and reply.</p></section>';
 if(!isAdmin)return head('Live support','Send a message to the office and follow their replies.')+'<div class="chat-layout">'+chat+'</div>';
 const sorted=[...threads].sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt)));
 const inbox='<aside class="panel support-inbox-list"><div class="panel-title"><h2>User conversations</h2><span class="tag gray">'+threads.length+'</span></div><input class="form-control" data-support-search placeholder="Search conversations" aria-label="Search conversations"><div class="support-threads">'+(sorted.length?sorted.map(t=>{const last=t.messages[t.messages.length-1];return '<button type="button" class="support-thread '+(t.id===selectedSupportId?'selected':'')+'" data-support-thread="'+esc(t.id)+'" data-support-match="'+esc((t.name+' '+t.email+' '+(last?.text||'')).toLowerCase())+'"><span class="avatar">'+icon('user-round')+'</span><span class="support-thread-copy"><b data-user-content>'+esc(t.name)+'</b><small data-user-content>'+esc(last?.text||'No messages yet')+'</small><span class="tag '+(last?.sender==='user'?'gold':'gray')+'">'+(last?.sender==='user'?'Awaiting reply':'Replied')+'</span></span></button>'}).join(''):'<div class="support-welcome"><h3>No user messages yet</h3><p>Conversations appear here when registered users send a Live support message.</p></div>')+'</div><p class="small muted support-preview-note">Messages are saved securely for the user and office staff.</p></aside>';
 return head('Live support','Choose a user conversation and reply as office staff.')+'<div class="support-inbox '+(thread?'has-selection':'')+'">'+inbox+chat+'</div>'
}
async function sendSupport(text){
 const form=app.querySelector('[data-form="support"]'),error=document.getElementById('support-error');
 if(!text||text.length>4000){if(error)error.textContent=localize('Enter a message from 1 to 4,000 characters.');return}
 if(role==='admin'&&!selectedSupportId){if(error)error.textContent=localize('Select a user conversation before replying.');return}
 if(form.dataset.busy)return;form.dataset.busy='true';
 const button=form.querySelector('button');button.disabled=true;
 if(form.dataset.lastMessage!==text){form.dataset.requestKey=conversationId();form.dataset.lastMessage=text}
 const selected=selectedSupportId;
 try{
  const result=await CLA.call('support_send',{message:text,request_key:form.dataset.requestKey,thread_id:selected});
  applyNotices(result.notices);
  if(tab==='support'&&selectedSupportId===selected){serverThreads=result.threads;render()}else await loadSupport();
 }catch(e){if(error&&error.isConnected)error.textContent=e.message;else errorNotice(e)}
 finally{delete form.dataset.busy;if(button.isConnected)button.disabled=false}
}
// Guest history stays on-device; signed-in history comes from the authenticated API.
let chatState;
if(role==='guest'){
 chatState=get('chat-state',null);
 if(!chatState||!Array.isArray(chatState.conversations)){
  const legacy=get('chat',[]),id=conversationId();
  chatState={activeId:legacy.length?id:null,conversations:legacy.length?[{id,title:legacy.find(m=>m.mine)?.title||legacy.find(m=>m.mine)?.text.slice(0,45)||'Saved conversation',pin:legacy.some(m=>m.pin),updatedAt:new Date().toISOString(),messages:legacy}]:[]};
  if(legacy.length)saveChats();
 }
}else{
 let activeId;try{activeId=localStorage.getItem('cla-active-'+serverUser.id)}catch{}
 const conversations=(boot.conversations||[]).map(c=>({...c,persisted:true}));
 chatState={activeId:conversations.some(c=>c.id===activeId)?activeId:null,conversations};
}
const activeChat=()=>chatState.conversations.find(c=>c.id===chatState.activeId);
const pendingChats=new Set();
const responseLanguage=()=>get('chat-language','auto');
chatState.conversations.forEach(c=>c.messages.forEach(m=>{if(m.delivery==='pending')m.delivery='failed'}));
function saveChats(){
 if(role!=='guest'){try{if(chatState.activeId)localStorage.setItem('cla-active-'+serverUser.id,chatState.activeId);else localStorage.removeItem('cla-active-'+serverUser.id)}catch{}return}
 try{put('chat-state',chatState);localStorage.removeItem('cla-guest-chat');chatSaveError=''}catch{chatSaveError='This conversation could not be saved. Keep this tab open and retry saving before leaving.'}
}
const chatSaveNotice=()=>chatSaveError?'<div class="notice chat-save-error" role="alert">'+icon('triangle-alert')+'<span>'+chatSaveError+'</span><button class="text-link" data-action="retry-save">Retry saving</button></div>':'';
let notices=[];
function applyNotices(rows){
 const guestReads=role==='guest'?get('notice-reads',[]):[];
 const convert=n=>({...n,title:interfaceLanguage()==='Tagalog'?(n.titleTl||n.title):n.title,body:interfaceLanguage()==='Tagalog'?(n.bodyTl||n.body):n.body,read:role==='guest'?guestReads.includes(n.id):n.read});
 notices=rows.filter(n=>n.kind==='notification').map(convert);serverAlerts=rows.filter(n=>n.kind==='alert').map(convert);
}
applyNotices(boot.notices||[]);
const nav=items[role], tabname=k=>(nav.find(x=>x[0]===k)||[])[2]||({profile:'Profile',settings:'Settings',language:'Language'}[k]||'Workspace');
function closeMore(){document.getElementById('mobile-tabs-menu')?.classList.remove('open');app.querySelector('[data-action="more"]')?.setAttribute('aria-expanded','false')}
document.addEventListener('click',e=>{if(!e.target.closest('#mobile-tabs-menu, [data-action="more"]'))closeMore();if(!e.target.closest('#role-menu, [data-action="menu"]'))document.getElementById('role-menu')?.classList.remove('open');const topics=app.querySelector('.chat-topics');if(topics?.open&&!e.target.closest('.chat-topics'))topics.open=false});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeMore();document.getElementById('role-menu')?.classList.remove('open')}});
window.addEventListener('storage',e=>{if(role==='guest'&&e.key==='cla-guest-notice-reads')CLA.call('public').then(r=>{applyNotices(r.notices);if(tab==='notifications')render()}).catch(()=>{})});
const go=k=>{if(!nav.some(x=>x[0]===k)&&!accountTabs.includes(k))return;history.pushState({tab:k},'',location.protocol==='file:'?'#'+k:role+'-'+k+'.html');tab=k;closeMore();document.getElementById('role-menu')?.classList.remove('open');render();loadTab(k).catch(errorNotice)};
const btn=(text,act,ic,cls)=>'<button class="button '+(cls||'button-light')+'" '+(nav.some(x=>x[0]===act)?'data-tab="'+act+'"':'data-action="'+act+'"')+'>'+(ic?icon(ic):'')+text+'</button>';
const head=(title,desc,actions='')=>'<div class="page-head"><div><span class="eyebrow">MUNTINLUPA CITY · '+rn.toUpperCase()+'</span><h1>'+title+'</h1><p>'+desc+'</p></div><div class="page-actions">'+actions+'</div></div>';
const panel=(title,content,cls='')=>'<section class="panel'+(cls?' '+cls:'')+'"><div class="panel-title"><h2>'+title+'</h2></div>'+content+'</section>';
function passwordField(id,name,label,autocomplete,minlength=''){
 return '<label class="password-field"><span class="field-label">'+label+'</span><span class="password-control"><input class="form-control" id="'+id+'" type="password" name="'+name+'" autocomplete="'+autocomplete+'" '+(minlength?'minlength="'+minlength+'"':'')+' required><button type="button" class="password-toggle" data-action="toggle-password" data-target="'+id+'" aria-label="Show password" aria-pressed="false">Show</button></span></label>';
}
function shell(body){
const accountMenu=role==='guest'?'<a href="login.html">'+icon('log-in')+'Log in</a><a href="signup.html">'+icon('user-plus')+'Create account</a><a href="guest-language.html" data-tab="language">'+icon('languages')+'Language</a>':'<a href="'+role+'-profile.html" data-tab="profile">'+icon('user-round')+'Profile</a><a href="'+role+'-settings.html" data-tab="settings">'+icon('settings')+'Settings</a><a href="'+role+'-language.html" data-tab="language">'+icon('languages')+'Language</a><button type="button" data-action="logout">'+icon('log-out')+'Log out</button>';
 const links=nav.map(x=>'<a href="'+role+'-'+x[0]+'.html" data-tab="'+x[0]+'" class="'+(tab===x[0]?'active':'')+'">'+icon(x[1])+'<span>'+x[2]+'</span></a>').join('');
 const unseen=notices.filter(n=>!n.read).length;
 return '<div class="portal-shell"><aside class="portal-sidebar"><a class="portal-brand" href="../index.html"><span class="brand-mark">'+icon('scale')+'</span><span><b>CyberLawAssist</b><small>Muntinlupa City PAO</small></span></a><div class="role-chip">'+icon(role==='admin'?'shield':'user-round')+rn+' workspace</div><nav class="portal-nav">'+links+'</nav><div class="sidebar-bottom"><button class="profile-button" data-action="menu"><span class="avatar">'+(role==='admin'?'AD':role==='user'?'US':'GU')+'</span><span class="profile-copy"><b data-user-content>'+esc(serverUser?.name||'Guest visitor')+'</b><small>Profile, settings & language</small></span>'+icon('chevron-up')+'</button><div class="user-menu" id="role-menu">' + accountMenu + '</div></div></aside><main class="portal-main"><header class="portal-topbar"><div class="mobile-brand"><span class="brand-mark">'+icon('scale')+'</span>CyberLawAssist</div><div class="breadcrumb">Workspace / <b>'+tabname(tab)+'</b></div><div class="top-actions"><button class="icon-button" data-tab="notifications" aria-label="Notifications">'+icon('bell')+(unseen?'<i class="unread-dot"></i>':'')+'</button></div></header><div class="portal-content" id="content">'+body+'<div class="portal-footer">General legal information only · Contact the Muntinlupa City District Office for legal assistance <a href="terms.html">Terms</a><a href="privacy.html">Privacy</a></div></div></main></div>';
}
function greeting(){
 const tagalog=interfaceLanguage()==='Tagalog';
 const intro=tagalog?'Magandang araw! Maaari akong magpaliwanag ng pangkalahatang impormasyon tungkol sa cybercrime at tumulong sa paghahanda ng iyong mga tanong. Ano ang nais mong malaman?':'Hello! I can explain general cyber-law information and help you prepare questions. What would you like to understand?';
 const reminder=role==='guest'||serverUser.settings.privacyMode?(tagalog?' Huwag magbigay ng password o OTP.':' Avoid sharing passwords or OTPs.'):'';
 return '<div class="chat-msg"><span class="chat-avatar">'+icon('scale')+'</span><div class="chat-bubble">'+intro+reminder+'<small>CyberLawAssist</small></div></div>';
}
function messages(arr){return arr.map(m=>{
 const sources=!m.mine&&Array.isArray(m.sources)?m.sources.filter(s=>s&&typeof s.url==='string'&&/^https:\/\//i.test(s.url)):[];
 const references=sources.length?'<details class="chat-sources"><summary>'+esc(localize('Sources'))+'</summary>'+sources.map(s=>'<a href="'+esc(s.url)+'" target="_blank" rel="noopener noreferrer">'+esc(s.title)+'</a>').join('')+'</details>':'';
 const retry=m.mine&&m.delivery==='failed'?'<div class="chat-request-error" role="alert"><span>'+esc(localize('No reply received. Start the local AI server, then retry.'))+'</span><button type="button" class="text-link" data-action="retry-chat" data-message="'+esc(m.id)+'">'+esc(localize('Retry reply'))+'</button></div>':'';
 return '<div class="chat-msg '+(m.mine?'mine':'')+'"><span class="chat-avatar">'+icon(m.mine?'user-round':'scale')+'</span><div class="chat-bubble"><div data-user-content class="chat-message-text">'+esc(m.text)+'</div>'+references+'<small>'+(m.mine?'You':'CyberLawAssist')+' · Just now</small>'+retry+'</div></div>'
 }).join('')}
function chatPage(){
 const lastReply=activeChat()?.messages.filter(m=>!m.mine).at(-1);
 const prompts=lastReply?.suggestions?.length?lastReply.suggestions:['What is RA 10175?','I received a suspicious email asking for my password','How do I report online harassment?'];
 const arr=activeChat()?.messages||[];
 const intro=greeting();
 const topics='<details class="chat-topics"><summary title="Suggested topics">'+icon('lightbulb')+'<span>Suggested topics</span></summary><div class="topics-popup"><div class="topics-popup-heading"><b>Suggested topics</b><button type="button" class="icon-button" data-action="close-topics" aria-label="Close suggested topics">'+icon('x')+'</button></div><p>Choose a topic to add it to your message.</p>'+prompts.map(x=>'<button type="button" data-prompt="'+esc(x)+'">'+icon('arrow-up-right')+'<span>'+esc(x)+'</span></button>').join('')+'</div></details>';
 const waiting=pendingChats.has(activeChat()?.id);
 const languageControl='<label class="chat-language"><span>Reply language</span><select data-chat-language aria-label="Reply language">'+[['auto','Auto detect'],['en','English'],['tl','Tagalog'],['taglish','Taglish']].map(([value,label])=>'<option value="'+value+'" '+(responseLanguage()===value?'selected':'')+'>'+label+'</option>').join('')+'</select></label>';
 return head('Chatbot','Ask a question or choose a suggested topic.',btn('New chat','new-chat','plus','button-blue'))+chatSaveNotice()+'<div class="chat-layout chat-screen"><section class="panel chat-panel"><div class="chat-heading"><span class="chat-bot-icon">'+icon('scale')+'</span><div><b>CyberLawAssist</b><small data-user-content>'+esc(activeChat()?.title||'Public legal information assistant')+'</small></div><span class="chat-status">Local AI</span></div>'+languageControl+'<div class="chat-scroll" id="chat-scroll">'+(arr.length?messages(arr):intro)+(waiting?'<p class="chat-pending" role="status">Finding an answer…</p>':'')+'</div>'+topics+'<form class="chat-compose" data-form="chat" novalidate><textarea name="message" rows="1" maxlength="2000" placeholder="Describe what you need help with…" aria-label="Message" enterkeyhint="send" title="Enter to send. Shift+Enter for a new line."></textarea><button class="chat-send" aria-label="Send" '+(waiting?'disabled':'')+'>'+icon('send')+'</button></form></section></div>';
}
function lawPage(){
 const language=interfaceLanguage()==='Tagalog'?'tl':'en';
 const rows=contentData.laws.filter(x=>x.language===language);
 const sections=rows.map((r,i)=>{
  let urls=[];try{urls=JSON.parse(r.source_urls||'[]').filter(u=>typeof u==='string'&&/^https:\/\//i.test(u))}catch{}
  const extra=[['Legal text',r.legal_text],['Penalties',r.penalties],['Fines',r.fines],['Evidence to preserve',r.evidence_guidance],['Suggested next steps',r.next_steps]].filter(x=>x[1]);
  return '<details class="law-accordion" data-law-entry '+(!i?'open':'')+'><summary><span class="law-ordinal">'+String(i+1).padStart(2,'0')+'</span><span class="law-topic-title" data-user-content>'+esc(r.title)+'</span><span class="law-chevron">'+icon('chevron-down')+'</span></summary><div class="law-accordion-body"><p class="law-summary chat-message-text" data-user-content>'+esc(r.summary)+'</p>'+extra.map(([label,value])=>'<section class="law-detail"><h3>'+icon(label==='Penalties'||label==='Fines'?'scale':label==='Evidence to preserve'?'folder-search':'book-open-text')+esc(localize(label))+'</h3><p class="chat-message-text" data-user-content>'+esc(value)+'</p></section>').join('')+(urls.length?'<div class="law-sources">'+urls.map(u=>'<a class="law-source-link" href="'+esc(u)+'" target="_blank" rel="noopener noreferrer">'+icon('external-link')+esc(localize('Read source'))+'</a>').join('')+'</div>':'')+'</div></details>';
 }).join('');
 return head('Republic Act No. 10175','Browse a plain-language guide to the Cybercrime Prevention Act of 2012.')+'<div class="law-content law-page"><section class="law-hero"><div class="law-hero-copy"><div class="law-hero-label"><span>REPUBLIC ACT</span><b>10175</b></div><div><span class="eyebrow">PHILIPPINE CYBERCRIME LAW · 2012</span><h2>Cybercrime Prevention Act</h2><p>Explore the key topics, plain-language summaries, and source references in this guide.</p></div></div><div class="law-hero-topics"><span>'+icon('book-open-check')+'</span><b>'+rows.length+'</b><small>'+esc(localize('guide topics'))+'</small></div></section><section class="panel law-browser"><div class="law-browser-heading"><div><h2>'+esc(localize('Explore the guide'))+'</h2><p>'+esc(localize('Open a topic to read its summary and related details.'))+'</p></div><span class="law-topic-count" data-law-count>'+rows.length+' '+esc(localize('topics'))+'</span></div><label class="law-search-box">'+icon('search')+'<span class="sr-only">'+esc(localize('Search the law guide'))+'</span><input class="form-control law-search" data-law-search placeholder="Search topics, penalties, or evidence" aria-label="Search the law guide"></label><div class="law-section-list">'+sections+'</div><div class="law-empty-state" data-law-empty hidden><span>'+icon('search-x')+'</span><b>'+esc(localize('No matching topics'))+'</b><small>'+esc(localize('Try another word or clear your search.'))+'</small></div></section><div class="notice law-notice">'+icon('info')+'This guide provides general information, not legal advice. For the full text, open a source link within a topic. Office: (02) 8862 2525.</div></div>';
}
function decisionPage(){
 if(sessionStorage.getItem('cla-decision-version')!=='2'){['cla-step','cla-choice','cla-safety','cla-evidence'].forEach(k=>sessionStorage.removeItem(k));sessionStorage.setItem('cla-decision-version','2')}
 const step=Math.max(1,Math.min(4,+(sessionStorage.getItem('cla-step')||1))),choice=sessionStorage.getItem('cla-choice'),safety=sessionStorage.getItem('cla-safety');
 let evidence=[];try{evidence=JSON.parse(sessionStorage.getItem('cla-evidence')||'[]')}catch{}
 const concerns=[['Online threats or harassment','Messages, posts, or contact that feels threatening or abusive.','message-square-warning'],['Unrecognized account access','Someone may have accessed an account or changed its settings.','key-round'],['Scam, fraud, or impersonation','A suspicious offer, payment request, fake profile, or transaction.','badge-alert'],['Another cyber concern','Something online happened and you are not sure where it fits.','circle-help']];
 const evidenceOptions=['Messages or screenshots','Website or profile links','Dates, times, or account names','Payment or transaction records','I have not saved information yet'];
 const selectedConcern=choice!==null&&concerns[Number(choice)]?concerns[Number(choice)][0]:'Not selected';
 const stages=['Immediate safety','What happened','What to keep','Next steps'];
 const stageRail=stages.map((label,i)=>'<div class="decision-progress-step '+(step===i+1?'active':step>i+1?'done':'')+'" '+(step===i+1?'aria-current="step"':'')+'><span>'+ (step>i+1?icon('check'):String(i+1))+'</span><small>'+label+'</small></div>').join('');
 const progress='<div class="decision-progress"><div class="decision-progress-heading"><b>Step '+step+' of 4</b><span>'+stages[step-1]+'</span></div><div class="decision-progress-track" role="progressbar" aria-label="Guide progress" aria-valuemin="1" aria-valuemax="4" aria-valuenow="'+step+'"><span style="width:'+((step/4)*100)+'%"></span></div><div class="decision-progress-steps">'+stageRail+'</div></div>';
 let stageContent='';
 if(step===1)stageContent='<div class="decision-stage-heading"><span class="decision-stage-icon">'+icon('shield-check')+'</span><div><span class="eyebrow">START HERE</span><h2>Are you safe right now?</h2><p>Your wellbeing comes first. This guide is not monitored and cannot provide emergency help.</p></div></div><div class="decision-safety-note">'+icon('triangle-alert')+'<span><b>If you are in immediate danger</b><small>Move to a safer place if you can, then contact local emergency services or someone you trust.</small></span></div><div class="decision-options">'+[['yes','Yes, I may be in danger','Prioritize getting somewhere safe and reaching a person who can help.','triangle-alert'],['no','I am safe to continue','I can take a moment to organize what happened.','shield-check']].map(([value,title,desc,ic])=>'<button type="button" class="decision-option '+(safety===value?'selected':'')+'" data-safety="'+value+'" aria-pressed="'+(safety===value)+'"><span class="decision-option-icon">'+icon(ic)+'</span><span class="decision-option-copy"><b>'+title+'</b><small>'+desc+'</small></span><span class="decision-option-mark">'+icon('check')+'</span></button>').join('')+'</div>';
 else if(step===2)stageContent='<div class="decision-stage-heading"><span class="decision-stage-icon">'+icon('messages-square')+'</span><div><span class="eyebrow">YOUR SITUATION</span><h2>What happened online?</h2><p>Choose the closest match. You can still continue if you are unsure.</p></div></div><div class="decision-options">'+concerns.map(([title,desc,ic],i)=>'<button type="button" class="decision-option '+(choice===String(i)?'selected':'')+'" data-choice="'+i+'" aria-pressed="'+(choice===String(i))+'"><span class="decision-option-icon">'+icon(ic)+'</span><span class="decision-option-copy"><b>'+title+'</b><small>'+desc+'</small></span><span class="decision-option-mark">'+icon('check')+'</span></button>').join('')+'</div>';
 else if(step===3)stageContent='<div class="decision-stage-heading"><span class="decision-stage-icon">'+icon('folder-open')+'</span><div><span class="eyebrow">KEEP WHAT YOU HAVE</span><h2>What information have you kept?</h2><p>Select any that apply. It is okay to continue without saved information.</p></div></div><div class="decision-options decision-evidence-options">'+evidenceOptions.map((title,i)=>'<button type="button" class="decision-option '+(evidence.includes(String(i))?'selected':'')+'" data-evidence="'+i+'" aria-pressed="'+evidence.includes(String(i))+'"><span class="decision-option-icon">'+icon(['image','link','calendar-clock','receipt-text','circle-help'][i])+'</span><span class="decision-option-copy"><b>'+title+'</b><small>'+(i===4?'Choose this if you have not saved anything yet.':'Keep original files and note when and where they came from.')+'</small></span><span class="decision-option-mark">'+icon('check')+'</span></button>').join('')+'</div><p class="decision-privacy-note">'+icon('lock-keyhole')+' Your selections stay in this browser session. They are not added to an office case record.</p>';
 else {
  const plan=[];
  if(safety==='yes')plan.push(['Put safety first','Move to a safer place if possible. Contact local emergency services or a trusted person who can help now.','shield-alert']);
  else plan.push(['Keep your safety in mind','If the situation becomes unsafe, pause this guide and reach out to local emergency support or someone you trust.','shield-check']);
  if(choice==='1')plan.push(['Secure affected accounts','Use a trusted device to change affected passwords, review recovery details, and turn on available sign-in protections.','key-round']);
  else if(choice==='2')plan.push(['Contact the payment provider','If money or payment details are involved, contact your bank or payment provider promptly using its official contact channel.','credit-card']);
  else plan.push(['Preserve useful information','Keep original messages, links, usernames, dates, and times. Avoid editing or deleting the originals.','folder-open']);
  plan.push(['Talk with a qualified person','Contact the office or a qualified lawyer to discuss your specific circumstances. This guide does not assess your case.','messages-square']);
  const evidenceSummary=evidence.includes('4')?'No information selected yet.':evidence.length?evidence.filter(i=>Number(i)<4).map(i=>evidenceOptions[Number(i)]).join(' · '):'No information selected yet.';
  stageContent='<div class="decision-stage-heading"><span class="decision-stage-icon">'+icon('list-checks')+'</span><div><span class="eyebrow">A STARTING PLAN</span><h2>Your next steps</h2><p>Use these general suggestions as a starting point. Choose what feels appropriate for your situation.</p></div></div>'+(safety==='yes'?'<div class="decision-safety-note urgent">'+icon('triangle-alert')+'<span><b>You said you may be in danger.</b><small>Please prioritize your immediate safety and contact someone who can help now.</small></span></div>':'')+'<div class="decision-summary"><div><span>Situation</span><b>'+esc(selectedConcern)+'</b></div><div><span>Information saved</span><b>'+esc(evidenceSummary)+'</b></div></div><ol class="decision-plan">'+plan.map(([title,desc,ic],i)=>'<li><span class="decision-plan-number">'+(i+1)+'</span><span class="decision-plan-icon">'+icon(ic)+'</span><div><b>'+title+'</b><p>'+desc+'</p></div></li>').join('')+'</ol><div class="decision-contact-card"><span>'+icon('building-2')+'</span><div><b>Muntinlupa City District Office · PAO</b><small>For office assistance, call <a href="tel:+63288622525">(02) 8862 2525</a>.</small></div></div><div class="decision-result-actions"><button class="button button-light" data-tab="law">'+icon('book-open-text')+' Read RA 10175</button><button class="button button-light" data-tab="about">'+icon('map-pin')+' Office details</button></div>';
 }
 const aside='<aside class="decision-side"><section class="decision-side-card"><div class="decision-side-title"><span>'+icon('compass')+'</span><div><b>Your guide</b><small>One step at a time</small></div></div><div class="decision-side-row"><span>Safety</span><b>'+(safety==='yes'?'Needs attention':safety==='no'?'Safe to continue':'Not answered')+'</b></div><div class="decision-side-row"><span>Situation</span><b>'+esc(selectedConcern)+'</b></div><div class="decision-side-row"><span>Information kept</span><b>'+evidence.filter(i=>Number(i)<4).length+' selected</b></div><div class="decision-side-note">'+icon('lock-keyhole')+'<span>Your answers stay in this browser session. You can start again at any time.</span></div><a class="decision-side-contact" href="tel:+63288622525">'+icon('phone')+' Call the office <span>(02) 8862 2525</span></a></section></aside>';
 const nav='<div class="decision-navigation">'+(step>1?'<button class="button button-light" data-action="back">'+icon('arrow-left')+' Back</button>':'<span></span>')+(step<4?'<button class="button button-blue" data-action="next">Continue '+icon('arrow-right')+'</button>':'<button class="button button-light" data-action="reset">'+icon('rotate-ccw')+' Start again</button>')+'</div>';
 return head('Decision guide','A calm, step-by-step way to organize what happened and consider what to do next.')+'<div class="decision-guide"><section class="decision-welcome"><span class="decision-welcome-icon">'+icon('heart-handshake')+'</span><div><b>You do not have to figure everything out at once.</b><p>This guide helps you organize your thoughts. Your answers stay in this browser session.</p></div><span class="decision-time">'+icon('clock-3')+' About 2 minutes</span></section><div class="decision-layout"><main class="decision-main">'+progress+'<section class="panel decision-stage">'+stageContent+nav+'</section></main>'+aside+'</div><p class="decision-disclaimer">'+icon('info')+' General information only. This guide does not provide legal advice, assess a case, or create an attorney-client relationship.</p></div>';
}
function historyPage(){
 const saved=[...chatState.conversations].sort((a,b)=>Number(b.pin)-Number(a.pin)||b.updatedAt.localeCompare(a.updatedAt));
 return head('Chat history','Rename, pin, reopen, or delete a conversation.')+chatSaveNotice()+(saved.length?panel('Saved conversations','<div class="table-wrap"><table class="data-table"><thead><tr><th>Conversation</th><th>State</th><th>Actions</th></tr></thead><tbody>'+saved.map(c=>'<tr><td><b data-user-content>'+esc(c.title)+'</b><small class="history-meta">'+c.messages.length+' '+localize('messages')+' · '+esc(new Date(c.updatedAt).toLocaleString())+'</small></td><td><span class="tag '+(c.pin?'gold':'gray')+'">'+(c.pin?'Pinned':'Saved')+'</span></td><td>'+[['open','message-circle','Open conversation'],['pin',c.pin?'pin-off':'pin',c.pin?'Unpin conversation':'Pin conversation'],['rename','pencil','Rename conversation'],['delete','trash-2','Delete conversation']].map(a=>'<button class="round-action" data-action="'+a[0]+'" data-id="'+esc(c.id)+'" aria-label="'+a[2]+'" title="'+a[2]+'" '+(role!=='guest'&&!c.persisted&&a[0]!=='open'?'disabled':'')+'>'+icon(a[1])+'</button>').join('')+'</td></tr>').join('')+'</tbody></table></div>'):'<div class="empty-state"><span class="empty-icon">'+icon('messages-square')+'</span><h3>No chat history yet</h3><p>Your conversations are saved here when you send a message.</p><button class="button button-blue" data-tab="chatbot">Start chatting</button></div>')+'<dialog id="history-dialog" class="history-dialog" aria-labelledby="history-dialog-title"></dialog>'
}
function checklistPage(){
 const list=get('checks',[['Save relevant messages or posts',false],['Record dates, times, and account names',false],['Secure affected accounts',false],['Write questions for the office',false]]);
 const done=list.filter(x=>x[1]).length,total=list.length,progress=total?Math.round(done/total*100):0;
 const rows=list.map((x,i)=>'<label class="checklist-item '+(x[1]?'is-done':'')+'"><input type="checkbox" data-check="'+i+'" '+(x[1]?'checked':'')+'><span class="checklist-item-copy"><b>'+esc(x[0])+'</b><small>'+(x[1]?'Completed':'To do')+'</small></span><span class="checklist-item-icon">'+icon(x[1]?'circle-check':'circle')+'</span></label>').join('');
 const complete=total>0&&done===total;
 const overview='<section class="checklist-overview"><div class="checklist-overview-top"><span class="checklist-overview-icon">'+icon(complete?'badge-check':'list-checks')+'</span><div><span class="eyebrow">YOUR NEXT STEPS</span><h2>'+ (complete?'You’re ready for your next step':'Prepare at your own pace')+'</h2><p>'+ (complete?'Your checklist is complete. You can export or print it for your records.':'Save useful details before contacting the office. You can update this list as you go.')+'</p></div><div class="checklist-count"><b>'+done+'<small>/ '+total+'</small></b><span>completed</span></div></div><div class="checklist-progress" role="progressbar" aria-label="Checklist progress" aria-valuemin="0" aria-valuemax="'+total+'" aria-valuenow="'+done+'"><span style="width:'+progress+'%"></span></div></section>';
 const listPanel=panel('Preparation steps','<div class="checklist-list">'+(rows||'<div class="checklist-empty">No checklist steps yet. Add one below to get started.</div>')+'</div><form class="checklist-add-form" data-form="add-check"><label class="sr-only" for="checklist-new-item">Add a checklist step</label><input class="form-control" id="checklist-new-item" name="item" placeholder="Add a step, for example: save a message" maxlength="500" required><button class="button button-blue">'+icon('plus')+' Add step</button></form>','checklist-print');
 const supportPanel=panel('Want help with a next step?','<div class="checklist-support-intro"><span class="checklist-support-icon">'+icon('headset')+'</span><p>Send a message to office staff through Live support. Your checklist stays saved to your account.</p></div><button class="button button-light" data-tab="support">'+icon('message-circle')+' Open Live support</button>','checklist-help-card');
 return head('Preparation checklist','A private place to organize details before speaking with the office.',btn('Export Word (.docx)','export-user','download')+btn('Print','print','printer'))+'<div class="checklist-page">'+overview+'<div class="grid-2 checklist-layout">'+listPanel+supportPanel+'</div></div>'
}
function notificationPage(){return head('Notifications','Updates and reminders for your workspace.',btn('Mark all read','read-all','check-check'))+panel('Recent notifications','<span class="tag gray">'+notices.filter(n=>!n.read).length+' unread</span>'+notices.map(n=>'<div class="notification-row '+(!n.read?'unread':'')+'"><span class="notification-icon">'+icon('bell')+'</span><div><b data-user-content>'+esc(n.title)+'</b><p data-user-content>'+esc(n.body)+'</p><time>'+esc(new Date(n.createdAt).toLocaleString())+'</time>'+(n.actionTab?'<button class="text-link" data-action="open-notice" data-id="'+esc(n.id)+'">Open</button>':'')+'</div>'+(!n.read?'<button class="text-link" data-read="'+esc(n.id)+'">Mark read</button>':'')+'</div>').join(''))}
function aboutPage(){
 const offices=contentData.contacts.filter(c=>c.contact_type==='office').map(c=>panel(esc(c.name),(c.address?'<div class="contact-row">'+icon('map-pin')+'<span data-user-content>'+esc(c.address)+'</span></div>':'')+(c.phone?'<div class="contact-row">'+icon('phone')+'<a href="tel:'+esc(c.phone.replace(/[^+0-9]/g,''))+'">'+esc(c.phone)+'</a></div>':'')+(c.website_url&&/^https:\/\//i.test(c.website_url)?'<a class="law-source-link" href="'+esc(c.website_url)+'" target="_blank" rel="noopener noreferrer">Official website</a>':''))).join('');
 const info=panel('About CyberLawAssist','<p class="small muted">Guided legal information, checklists, and ways to organize concerns before contacting the office.</p><div class="notice">'+icon('info')+'This does not replace legal advice or create an attorney-client relationship.</div>');
 const agencies=contentData.contacts.filter(c=>c.contact_type==='agency').map(c=>'<div class="contact-row">'+icon('building-2')+'<span data-user-content>'+esc(c.name)+'</span>'+(/^https:\/\//i.test(c.website_url||'')?'<a class="text-link" href="'+esc(c.website_url)+'" target="_blank" rel="noopener noreferrer">'+esc(localize('Official website'))+'</a>':'')+'</div>').join('');
 return head('About the office',"Muntinlupa City District Office - Public Attorney's Office.")+'<div class="about-layout"><div class="grid-2">'+offices+info+'</div>'+panel('Reporting agencies',agencies)+'</div>';
}
function caseRecords(){return serverCases}
function casesTable(list){return '<div class="table-wrap"><table class="data-table"><thead><tr><th>Reference</th><th>Visitor name</th><th>Concern</th><th>Visit date</th><th>Status</th><th>Actions</th></tr></thead><tbody>'+list.map(c=>'<tr><td><b>'+esc(c.id)+'</b></td><td data-user-content>'+esc(c.name||localize('Not recorded'))+'</td><td>'+esc(c.type)+'</td><td>'+esc(c.date||localize('Not recorded'))+'</td><td><span class="tag">'+esc(c.status)+'</span></td><td><button class="text-link" data-case="'+esc(c.id)+'">View record</button></td></tr>').join('')+'</tbody></table></div>'}
function caseCards(list,compact=false){return list.map(c=>{const status=({'For review':'review','In progress':'progress','Referred':'referred','Completed':'completed'})[c.status]||'review';return '<button type="button" class="case-record-card '+(compact?'compact ':'')+(selectedCaseId===c.id?'selected':'')+'" data-case="'+esc(c.id)+'" aria-pressed="'+(selectedCaseId===c.id)+'" aria-label="Open record '+esc(c.id)+'"><span class="case-record-top"><b>'+esc(c.id)+'</b><span class="case-status '+status+'">'+esc(c.status)+'</span></span><span class="case-record-name" data-user-content>'+esc(c.name||localize('Not recorded'))+'</span><span class="case-record-meta"><span>'+icon('calendar-days')+esc(c.date||localize('No visit date'))+'</span><span>'+icon('folder-open')+esc(c.type)+'</span></span><span class="case-record-open">Open details '+icon('arrow-up-right')+'</span></button>'}).join('')}
function caseDateLabel(value){if(!value)return localize('Date not recorded');const date=new Date(value+'T00:00:00');if(isNaN(date))return value;return date.toLocaleDateString(interfaceLanguage()==='Tagalog'?'fil-PH':'en-PH',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}
function caseDateGroups(list,compact=false){const groups=new Map();[...list].sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))||String(b.id).localeCompare(String(a.id))).forEach(record=>{const key=record.date||'';if(!groups.has(key))groups.set(key,[]);groups.get(key).push(record)});return [...groups].map(([date,records])=>'<section class="case-date-group"><div class="case-date-heading"><span>'+icon('calendar-days')+'</span><div><b>'+esc(caseDateLabel(date))+'</b><small>'+records.length+' '+esc(localize(records.length===1?'record':'records'))+'</small></div></div><div class="case-record-list">'+caseCards(records,compact)+'</div></section>').join('')}
function caseDetails(record){if(!record)return panel('Record details','<div class="case-detail-empty"><span>'+icon('folder-search')+'</span><b>Select a case record</b><p>Choose any record in the list to see its full intake details here.</p></div>','overview-panel case-detail-panel');return panel('Intake details','<div class="case-detail-heading"><div><span class="eyebrow">SELECTED RECORD</span><b>'+esc(record.id)+'</b></div></div><dl class="record-details">'+[['Visitor name',record.name],['Contact number',record.phone],['Concern type',record.type],['Visit date',caseDateLabel(record.date)],['Assigned staff',record.staff],['Status',record.status],['Brief factual notes',record.notes]].map(([label,value])=>'<div><dt>'+label+'</dt><dd data-user-content>'+esc(value||localize('Not recorded'))+'</dd></div>').join('')+'</dl>'+(record.legacy?'<p class="small muted">Older record: only the reference, concern and status were saved.</p>':'')+'<div class="case-detail-actions">'+btn('Edit record','edit-case','pencil','button-blue')+btn('Close details','close-case','x','button-light')+'</div>','overview-panel case-detail-panel')}
function parseReportDate(value){if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return null;const date=new Date(value+'T00:00:00');return !isNaN(date)&&dateKey(date)===value?date:null}
function dateKey(date){return String(date.getFullYear()).padStart(4,'0')+'-'+String(date.getMonth()+1).padStart(2,'0')+'-'+String(date.getDate()).padStart(2,'0')}
async function saveIntake(form,data){
 if(role!=='admin'||form.dataset.busy)return;
 const error=document.getElementById('intake-message'),value=key=>String(data.get(key)||'').trim();
 const record={name:value('name'),phone:value('phone'),type:value('type'),date:value('date'),staff:value('staff'),status:value('status'),notes:value('notes')};
 if(!record.name||!parseReportDate(record.date)){error.textContent='Enter a visitor name and valid visit date.';return}
 const signature=JSON.stringify(record);if(form.dataset.signature!==signature){form.dataset.signature=signature;form.dataset.requestKey=conversationId()}
 if(editingCase){record.id=editingCase.dbId;record.revision=editingCase.revision}else record.request_key=form.dataset.requestKey;
 form.dataset.busy='true';const button=form.querySelector('button[type="submit"]');button.disabled=true;
 try{
  const result=await CLA.call('case_save',record);serverCases=result.cases.records;caseTotal=result.cases.total;caseHasMore=result.cases.hasMore;casePageStart=result.cases.offset||0;caseOffset=casePageStart+result.cases.records.length;serverDashboard=result.dashboard;
  selectedCase=result.record;selectedCaseId=result.record.id;editingCase=null;
  if(tab==='intake')go('cases');savedNotice('Intake record saved.');
 }catch(e){error.textContent=e.message;errorNotice(e)}finally{delete form.dataset.busy;if(button.isConnected)button.disabled=false}
}
function usersPage(){
 return head('Users','Manage registered users, support conversations, and administrator accounts. Your own details and password are under Profile and Settings.',btn('Create administrator','create-admin','user-plus','button-blue'))+panel('Registered users','<input class="form-control" data-search placeholder="Search users" aria-label="Search users">'+(serverUsers.length?'<div class="table-wrap"><table class="data-table"><thead><tr><th>Full name</th><th>Email address</th><th>Phone number</th><th>Status</th><th>Live support</th><th>Account</th></tr></thead><tbody>'+serverUsers.map(u=>'<tr><td data-user-content>'+esc(u.name)+'</td><td data-user-content>'+esc(u.email)+'</td><td data-user-content>'+esc(u.phone||localize('Not recorded'))+'</td><td>'+esc(u.status)+'</td><td>'+(u.threadId?'<button class="text-link" data-user-thread="'+esc(u.threadId)+'">Open conversation</button>':'<span class="muted">No conversation yet</span>')+'</td><td><button class="text-link" data-action="manage-user" data-id="'+esc(u.id)+'">Manage account</button></td></tr>').join('')+'</tbody></table></div>':'<div class="empty-state"><h3>No saved users yet</h3><p>Registered accounts will appear here.</p></div>'),'overview-panel')+panel('Administrators','<div class="table-wrap"><table class="data-table"><thead><tr><th>Admin number</th><th>Full name</th><th>Email address</th><th>Status</th><th>Account</th></tr></thead><tbody>'+serverAdministrators.map(u=>'<tr><td data-user-content>'+esc(u.adminNumber||'')+'</td><td data-user-content>'+esc(u.name)+'</td><td data-user-content>'+esc(u.email)+'</td><td>'+esc(u.status)+'</td><td>'+(u.id===serverUser?.id?'<span class="tag green">Your account</span>':'<button class="text-link" data-action="manage-admin" data-id="'+esc(u.id)+'">Manage account</button>')+'</td></tr>').join('')+'</tbody></table></div>','overview-panel administrators-panel')+'<dialog id="account-dialog" class="history-dialog" aria-labelledby="account-dialog-title"></dialog>';
}
function intakePage(){
 const r=editingCase||{name:'',phone:'',type:'Online harassment',date:dateKey(new Date()),staff:'',status:'For review',notes:''};
 const input=(name,label,max,type='text')=>'<label><span class="field-label">'+label+'</span><input class="form-control" name="'+name+'" maxlength="'+max+'" type="'+type+'" value="'+esc(r[name])+'" '+(['name','date'].includes(name)?'required':'')+'></label>';
 return head(editingCase?'Edit intake record':'Physical intake','Record an in-person visit. Collect only necessary information.')+'<form class="panel" data-form="intake" novalidate><div class="grid-2">'+input('name','Visitor name',120)+input('phone','Contact number',50)+'<label><span class="field-label">Concern type</span><select class="form-control" name="type">'+['Online harassment','Account access concern','Online fraud inquiry','Identity theft','Other'].map(x=>'<option '+(x===r.type?'selected':'')+'>'+x+'</option>').join('')+'</select></label>'+input('date','Visit date',10,'date')+input('staff','Assigned staff',120)+'<label><span class="field-label">Status</span><select class="form-control" name="status">'+['For review','In progress','Referred','Completed'].map(x=>'<option '+(x===r.status?'selected':'')+'>'+x+'</option>').join('')+'</select></label></div><label style="display:block;margin-top:18px"><span class="field-label">Brief factual notes</span><textarea class="form-control" name="notes" rows="4" maxlength="4000" style="width:100%">'+esc(r.notes)+'</textarea></label><p class="small muted" style="margin:18px 0">Intake records are saved in the office database.</p><p id="intake-message" class="intake-error" role="alert"></p><button type="submit" class="button button-blue">Save intake record</button></form>';
}
function openCreateAdminDialog(){
 const dialog=document.getElementById('account-dialog');
 const fields=[['admin_number','Admin number','text',40],['name','Full name','text',120],['email','Email address','email',254],['phone','Phone number (optional)','tel',50],['password','Password','password',null],['confirm-password','Confirm password','password',null]];
 dialog.innerHTML='<form class="create-admin-form" data-form="create-admin"><div class="history-dialog-heading"><h2 id="account-dialog-title">Create administrator</h2><button type="button" class="icon-button" data-action="close-account-dialog" aria-label="Close dialog">'+icon('x')+'</button></div><p>The new account will have access to the Admin workspace.</p>'+fields.map(([name,label,type,max])=>type==='password'?passwordField(name==='password'?'create-admin-password':'create-admin-confirm',name,label,'new-password','8'):'<label><span class="field-label">'+label+'</span><input class="form-control" name="'+name+'" type="'+type+'" '+(max?'maxlength="'+max+'"':'')+' autocomplete="off" '+(name==='phone'?'':'required')+'></label>').join('')+'<p class="form-message" role="alert"></p><div class="history-dialog-actions"><button type="button" class="button button-light" data-action="close-account-dialog">Cancel</button><button type="submit" class="button button-blue">Create administrator</button></div></form>';
 applyLanguage(dialog);dialog.showModal();if(window.lucide)window.lucide.createIcons();
}
function openDeleteUserDialog(user){
 const dialog=document.getElementById('account-dialog');
 dialog.innerHTML='<form class="delete-user-form" data-form="delete-user" data-id="'+esc(user.id)+'" novalidate><div class="history-dialog-heading"><h2 id="account-dialog-title">Delete user account?</h2><button type="button" class="icon-button" data-action="close-account-dialog" aria-label="Close dialog">'+icon('x')+'</button></div><p data-user-content>'+esc(user.name+' - '+user.email)+'</p><p>This permanently removes the account, chat history, checklist, and live support messages. This cannot be undone.</p>'+passwordField('delete-admin-password','current_password','Your administrator password','current-password')+'<label><span class="field-label">Type DELETE to confirm</span><input class="form-control" name="confirmation" autocomplete="off" spellcheck="false" required></label><p class="form-message" role="alert"></p><div class="history-dialog-actions"><button type="button" class="button button-light" data-action="close-account-dialog">Cancel</button><button type="submit" class="button button-danger">Delete account</button></div></form>';
 applyLanguage(dialog);if(!dialog.open)dialog.showModal();if(window.lucide)window.lucide.createIcons();
}
function openAccountDialog(user){
 const dialog=document.getElementById('account-dialog');
 dialog.innerHTML='<form data-form="manage-user" data-id="'+esc(user.id)+'"><div class="history-dialog-heading"><h2 id="account-dialog-title">Manage account</h2><button type="button" class="icon-button" data-action="close-account-dialog" aria-label="Close dialog">'+icon('x')+'</button></div><p data-user-content>'+esc(user.name+' · '+user.email)+'</p><label class="field-label" for="managed-status">Account status</label><select class="form-control" name="status" id="managed-status"><option value="active" '+(user.status==='active'?'selected':'')+'>Active</option><option value="disabled" '+(user.status==='disabled'?'selected':'')+'>Disabled</option></select><button class="button button-blue" type="submit" style="margin-top:14px">Save account status</button><p class="form-message" role="alert"></p></form><hr><form data-form="reset-user-password" data-id="'+esc(user.id)+'"><h3>Change user password</h3><label class="field-label" for="reset-admin-password">Your administrator password</label><input class="form-control" type="password" name="current_password" id="reset-admin-password" autocomplete="current-password" required><label class="field-label" for="new-user-password">New password</label><input class="form-control" type="password" name="password" id="new-user-password" minlength="8" autocomplete="new-password" required><label class="field-label" for="confirm-user-password">Confirm new password</label><input class="form-control" type="password" name="confirm-password" id="confirm-user-password" minlength="8" autocomplete="new-password" required><p class="small muted">Give the new password directly to the account owner. Their existing sessions will be signed out.</p><button class="button button-blue" type="submit">Change password</button><p class="form-message" role="alert"></p></form><div class="account-delete-section"><h3>Delete user account</h3><p class="small muted">Permanently remove this account and its saved activity.</p><button type="button" class="button button-danger" data-action="confirm-delete-user" data-id="'+esc(user.id)+'">Delete account</button></div>';
 applyLanguage(dialog);dialog.showModal();if(window.lucide)window.lucide.createIcons();
}
function openAdminAccountDialog(admin){
 const dialog=document.getElementById('account-dialog');
 dialog.innerHTML='<form data-form="manage-admin" data-id="'+esc(admin.id)+'"><div class="history-dialog-heading"><h2 id="account-dialog-title">Manage administrator</h2><button type="button" class="icon-button" data-action="close-account-dialog" aria-label="Close dialog">'+icon('x')+'</button></div><p data-user-content>'+esc((admin.adminNumber?admin.adminNumber+' · ':'')+admin.name+' · '+admin.email)+'</p><label class="field-label" for="managed-admin-status">Account status</label><select class="form-control" name="status" id="managed-admin-status"><option value="active" '+(admin.status==='active'?'selected':'')+'>Active</option><option value="disabled" '+(admin.status==='disabled'?'selected':'')+'>Disabled</option></select><p class="small muted">You cannot disable your own signed-in account or the last active administrator.</p><button class="button button-blue" type="submit">Save account status</button><p class="form-message" role="alert"></p></form><hr><form data-form="reset-admin-account-password" data-id="'+esc(admin.id)+'"><h3>Reset administrator password</h3>'+passwordField('reset-peer-admin-current','current_password','Your administrator password','current-password')+passwordField('reset-peer-admin-new','password','New password','new-password','8')+passwordField('reset-peer-admin-confirm','confirm-password','Confirm new password','new-password','8')+'<p class="small muted">The administrator will need to sign in again with the new password.</p><button class="button button-blue" type="submit">Reset password</button><p class="form-message" role="alert"></p></form>';
 applyLanguage(dialog);dialog.showModal();if(window.lucide)window.lucide.createIcons();
}
function reportData(){
 if(!serverReport)return null;
 const locale=interfaceLanguage()==='Tagalog'?'fil-PH':'en-PH';
 return {...serverReport,buckets:serverReport.buckets.map(b=>{const d=new Date(b.key+(serverReport.range==='year'?'-01':'')+'T00:00:00');return {...b,label:serverReport.range==='year'?d.toLocaleDateString(locale,{month:'short'}):serverReport.range==='week'?d.toLocaleDateString(locale,{weekday:'short'}):String(d.getDate())}})};
}
function adminPage(){
 const cases=caseRecords();
 if(tab==='dashboard')return head('Office dashboard','A snapshot of office activity.',btn('Case records','cases','folder-open','button-light')+btn('View reports','reports','chart-no-axes-column-increasing','button-blue'))+'<div class="grid-3">'+[['folder-open',serverDashboard.total||0,'Case records'],['clock-3',serverDashboard.open||0,'Open follow-ups'],['calendar-days',serverDashboard.today||0,'Visits today']].map(x=>'<div class="metric-card"><span class="metric-icon">'+icon(x[0])+'</span><div><div class="metric-value">'+x[1]+'</div><div class="metric-label">'+x[2]+'</div></div></div>').join('')+'</div>'+panel('Recent case records',cases.length?'<div class="dashboard-case-groups">'+caseDateGroups(cases.slice(0,10),true)+'</div><button class="button button-light dashboard-view-all" data-tab="cases">View all case records '+icon('arrow-right')+'</button>':'<div class="empty-state"><span class="empty-icon">'+icon('folder-open')+'</span><h3>No intake records yet</h3><p>New records will appear here, grouped by visit date.</p><button class="button button-blue" data-tab="intake">Create intake</button></div>','overview-panel dashboard-recent-cases');
 if(tab==='cases'){const first=caseTotal?casePageStart+1:0,last=casePageStart+cases.length,count=caseTotal?`Showing ${first}–${last} of ${caseTotal} records`:'No records found';const cards=cases.length?caseDateGroups(cases):'<div class="empty-state case-empty"><span class="empty-icon">'+icon('folder-open')+'</span><h3>No intake records found</h3><p>Try another search or create a new physical intake.</p><button class="button button-blue" data-tab="intake">Create intake</button></div>';const pageNumber=Math.floor(casePageStart/10)+1,pageCount=Math.max(1,Math.ceil(caseTotal/10));const pagination=caseTotal>10?'<nav class="case-pagination" aria-label="Case record pages"><button class="button button-light" data-action="cases-page" data-offset="'+Math.max(0,casePageStart-10)+'" '+(casePageStart===0?'disabled':'')+'>'+icon('arrow-left')+' Previous</button><span>Page '+pageNumber+' of '+pageCount+'</span><button class="button button-light" data-action="cases-page" data-offset="'+caseOffset+'" '+(!caseHasMore?'disabled':'')+'>Next '+icon('arrow-right')+'</button></nav>':'';return head('Case records','Browse intake records grouped by visit date. Select a record to view or edit.',btn('New physical intake','intake','plus','button-blue'))+'<div class="cases-workspace"><div class="case-list-column">'+panel('Intake register','<div class="case-browser-tools"><label class="case-search-box">'+icon('search')+'<span class="sr-only">Search case records</span><input class="form-control" data-search placeholder="Search reference, name, concern, or date" aria-label="Search case records"></label><span class="case-result-count" data-case-count>'+count+'</span></div>'+cards+pagination,'overview-panel case-register-panel')+'</div><aside class="case-detail-column">'+caseDetails(selectedCase)+'</aside></div>'}
 if(tab==='users')return usersPage();
 if(tab==='intake')return intakePage();
 return reportsPage()
}
function reportsPage(){
 const report=reportData();if(!report)return head('Reports','Review activity by week, month, or year, then export.')+(window.CLA_LOADING?.section()||'<div class="panel" role="status">Loading report…</div>');const max=Math.max(1,...report.buckets.map(b=>b.count));
 const controls='<div class="report-period-controls"><label><span class="field-label">Period</span><select class="form-control" data-range>'+['week','month','year'].map(range=>'<option value="'+range+'" '+(range===report.range?'selected':'')+'>'+({week:'Week',month:'Month',year:'Year'}[range])+'</option>').join('')+'</select></label><label><span class="field-label">Date in period</span><input class="form-control" type="date" data-report-date value="'+report.anchor+'"></label></div>';
 return head('Reports','Review activity by week, month, or year, then export.',btn('Export Word (.docx)','export','download','button-blue')+controls)+'<div class="grid-3">'+[['folder-open',report.total,'Intakes'],['check-check',report.completed,'Resolved or referred'],['hourglass',report.pending,'Awaiting follow-up']].map(x=>'<div class="metric-card"><span class="metric-icon">'+icon(x[0])+'</span><div><div class="metric-value">'+x[1]+'</div><div class="metric-label">'+x[2]+'</div></div></div>').join('')+'</div>'+panel('Intake activity','<p class="small muted report-period-label">'+esc(report.start)+' — '+esc(report.end)+'</p><div class="report-chart-scroll"><div class="report-bars" style="--report-columns:'+report.buckets.length+'" role="img" aria-label="'+esc(localize('Intake activity')+' '+report.start+' — '+report.end)+'">'+report.buckets.map(b=>'<div class="report-bar" data-period="'+b.key+'" data-count="'+b.count+'" style="height:'+Math.round(b.count/max*100)+'%" title="'+esc(b.key+' · '+b.count+' '+localize('Intakes'))+'"><span>'+esc(b.label)+'</span></div>').join('')+'</div></div>'+(!report.total?'<p class="small muted">No intake records for this period.</p>':'')+'<p class="small muted report-note">Counts use saved visit dates. Records without a visit date are excluded.</p>','overview-panel')
}
function alertsPage(){return head('Alerts','Items that may need attention.')+panel('Office reminders',serverAlerts.length?serverAlerts.map(n=>'<div class="alert-card"><b data-user-content>'+esc(n.title)+'</b><p data-user-content>'+esc(n.body)+'</p></div>').join(''):'<p>No alerts right now.</p>')}
function accountPage(){
 const p=serverUser||{},settings=p.settings||{},lang=interfaceLanguage();
 if(tab==='profile')return head('Personal profile','Manage the contact details shown in your workspace.')+'<form class="panel" data-form="profile" style="max-width:680px"><div class="grid-2">'+[['name','Full name','text'],['email','Email address','email'],['phone','Phone number','tel']].map(([name,label,type])=>'<label><span class="field-label">'+label+'</span><input class="form-control" type="'+type+'" name="'+name+'" value="'+esc(p[name])+'" maxlength="'+(name==='name'?120:name==='email'?254:50)+'" '+(name!=='phone'?'required':'')+'></label>').join('')+'<label><span class="field-label">Account type</span><input class="form-control" value="'+rn+'" disabled></label>'+(role==='admin'?'<label><span class="field-label">Admin number</span><input class="form-control" value="'+esc(p.adminNumber||'')+'" readonly></label>':'')+'</div><label style="display:block;margin-top:18px"><span class="field-label">Current password (required when changing email)</span><input class="form-control" type="password" name="current_password" autocomplete="current-password"></label><p class="form-message" role="alert"></p><button class="button button-blue">'+icon('save')+'Save profile</button></form>';
 if(tab==='settings')return head('Settings','Choose how your workspace looks and update your password.')+'<div class="settings-layout"><form class="panel settings-controls settings-card" data-form="settings"><div class="settings-card-heading"><span class="settings-card-icon">'+icon('sliders-horizontal')+'</span><div><h2>Appearance & privacy</h2><p>Adjust this browser’s workspace display and privacy reminders.</p></div></div><label class="check-row"><input type="checkbox" name="darkMode" '+(appearance.dark?'checked':'')+'><span>Dark mode<small>Use a darker color theme in this browser.</small></span></label><label class="check-row"><input type="checkbox" name="motion" '+(appearance.motion?'checked':'')+'><span>Interface animations<small>Use subtle transitions when opening and changing workspace views.</small></span></label><label class="text-size-control"><span>Text size</span><input type="range" name="textSize" min="0.9" max="1.2" step="0.05" value="'+appearance.textSize+'" aria-label="Text size"><small>Smaller <span>Default</span> Larger</small></label><label class="check-row"><input type="checkbox" name="privacyMode" '+(settings.privacyMode?'checked':'')+'><span>Privacy reminders<small>Remind me not to share passwords or account codes.</small></span></label><p class="form-message" role="alert"></p><button class="button button-blue">Save settings</button></form><form class="panel settings-card settings-password-card" data-form="password"><div class="settings-card-heading"><span class="settings-card-icon">'+icon('key-round')+'</span><div><h2>Change password</h2><p>Confirm your current password and choose a new one.</p></div></div>'+[['current_password','Current password','current-password','settings-current-password'],['password','New password','new-password','settings-new-password'],['confirm-password','Confirm new password','new-password','settings-confirm-password']].map(([name,label,auto,id])=>'<label class="password-field"><span class="field-label">'+label+'</span><span class="password-control"><input class="form-control" id="'+id+'" type="password" name="'+name+'" autocomplete="'+auto+'" required '+(auto==='new-password'?'minlength="8"':'')+'><button type="button" class="password-toggle" data-action="toggle-password" data-target="'+id+'" aria-label="Show password" aria-pressed="false">Show</button></span></label>').join('')+'<p class="form-message" role="alert"></p><button class="button button-blue">Update password</button></form></div>';
 return head('Language','Choose a preferred language for your workspace.')+'<form class="panel" data-form="language" style="max-width:500px"><label class="field-label" for="preferred-language">Preferred language</label><select class="form-control" id="preferred-language" name="language"><option value="English" '+(lang==='English'?'selected':'')+'>English</option><option value="Tagalog" '+(lang==='Tagalog'?'selected':'')+'>Tagalog</option></select><p class="small muted" style="margin-top:10px">'+(role==='guest'?'Your preference is saved in this browser.':'Your preference is saved to your account.')+'</p><p class="form-message" role="alert"></p><button class="button button-blue">Save language</button></form>';
}
function content(){if(tab==='chatbot')return chatPage();if(tab==='support')return supportPage();if(tab==='history')return historyPage();if(tab==='law')return lawPage();if(tab==='decision')return decisionPage();if(tab==='checklist')return checklistPage();if(tab==='notifications')return notificationPage();if(tab==='about')return aboutPage();if(['dashboard','cases','users','intake'].includes(tab))return adminPage();if(tab==='reports')return reportsPage();if(tab==='alerts')return alertsPage();if(accountTabs.includes(tab))return accountPage();return chatPage()}
function refreshChat(id){
 if(tab!=='chatbot'||chatState.activeId!==id)return;
 const input=app.querySelector('[data-form="chat"] textarea'),draft=input?.value||'',focused=input&&document.activeElement===input;
 render();const next=app.querySelector('[data-form="chat"] textarea');if(next){next.value=draft;if(focused)next.focus()}
}
async function requestReply(conversation,message){
 if(pendingChats.has(conversation.id))return;
 const originalId=conversation.id;let displayId=originalId;
 pendingChats.add(originalId);message.delivery='pending';saveChats();refreshChat(originalId);
 const target=()=>chatState.conversations.find(c=>c.id===originalId);
 const adopt=c=>{
  const index=chatState.conversations.findIndex(x=>x.id===originalId);if(index<0)return;
  chatState.conversations[index]={...c,persisted:true};displayId=c.id;
  if(chatState.activeId===originalId)chatState.activeId=c.id;
 };
 try{
  if(role!=='guest'){
   const result=await CLA.call('chat_send',{conversation_id:conversation.persisted?conversation.id:null,request_key:message.id,message:message.text,language:message.language||'auto'});adopt(result.conversation);
  }else{
   const result=await CLA.call('ai',{message:message.text,language:message.language||'auto',context_topic:message.contextTopic||''});
   const current=target();if(!current)return;const index=current.messages.findIndex(m=>m.id===message.id);if(index<0)return;
   current.messages.splice(index+1,0,{text:result.answer,mine:false,language:result.language,kind:result.kind,sources:Array.isArray(result.sources)?result.sources:[],suggestions:Array.isArray(result.suggestions)?result.suggestions.slice(0,3):[],createdAt:new Date().toISOString()});
   current.messages[index].delivery='sent';current.lastTopic=result.topic||message.contextTopic||null;
  }
 }catch(error){
  if(error.payload?.conversation)adopt(error.payload.conversation);
  else{const saved=target()?.messages.find(m=>m.id===message.id);if(saved)saved.delivery='failed'}
  errorNotice(error);
 }finally{
  pendingChats.delete(originalId);const current=chatState.conversations.find(c=>c.id===displayId);
  if(current){current.updatedAt=new Date().toISOString();saveChats();refreshChat(displayId)}
 }
}
async function send(text){
 if(!text||text.length>2000||pendingChats.has(activeChat()?.id))return;
 let conversation=activeChat();
 if(!conversation){conversation={id:conversationId(),title:text.slice(0,45),pin:false,updatedAt:new Date().toISOString(),messages:[]};chatState.conversations.push(conversation);chatState.activeId=conversation.id}
 const message={id:conversationId(),text,mine:true,title:text.slice(0,45),language:responseLanguage(),contextTopic:conversation.lastTopic||null,createdAt:new Date().toISOString()};
 conversation.messages.push(message);
 const input=app.querySelector('[data-form="chat"] textarea');if(input)input.value='';
 await requestReply(conversation,message)
}
function openHistoryDialog(mode,conversation){
 const dialog=document.getElementById('history-dialog'),deleting=mode==='delete';
 dialog.innerHTML='<form data-form="history-change" data-mode="'+mode+'" data-id="'+esc(conversation.id)+'" novalidate><div class="history-dialog-heading"><h2 id="history-dialog-title">'+(deleting?'Delete conversation?':'Rename conversation')+'</h2><button type="button" class="icon-button" data-action="close-history-dialog" aria-label="Close dialog">'+icon('x')+'</button></div><p>'+(deleting?'This removes <b>'+esc(conversation.title)+'</b> and all its messages. This cannot be undone.':'Choose a name so you can find this conversation later.')+'</p><label class="field-label" for="history-input">'+(deleting?'Type DELETE to confirm':'Conversation name')+'</label><input id="history-input" class="form-control" name="value" value="'+(deleting?'':esc(conversation.title))+'" maxlength="120" autocomplete="off" aria-describedby="history-error" required><p class="history-error" id="history-error" role="alert"></p><div class="history-dialog-actions"><button type="button" class="button button-light" data-action="close-history-dialog">Cancel</button><button class="button '+(deleting?'button-danger':'button-blue')+'">'+(deleting?'Delete conversation':'Save name')+'</button></div></form>';
 applyLanguage(dialog);applyLanguage(dialog);dialog.showModal();if(window.lucide)window.lucide.createIcons();dialog.querySelector('input').focus()
}
async function exportChecklist(){await CLA.download('checklist_export',{},'cyberlawassist-checklist.docx')}
async function exportReport(){const range=sessionStorage.getItem('cla-range')||'month',anchor=sessionStorage.getItem('cla-report-date')||dateKey(new Date());await CLA.download('report_export',{range,anchor},'cyberlawassist-'+range+'-report-'+anchor+'.docx')}
app.addEventListener('click',async e=>{
 try{
 const recordLink=e.target.closest('[data-case]');if(recordLink&&role==='admin'){const reference=recordLink.dataset.case,version=++caseDetailVersion;selectedCaseId=reference;selectedCase=null;if(tab!=='cases')go('cases');else render();try{const result=await CLA.call('case_get',undefined,{reference});if(version!==caseDetailVersion)return;selectedCase=result.record;render()}catch(error){if(version===caseDetailVersion){selectedCaseId=null;render();errorNotice(error)}}return}
 const userThread=e.target.closest('[data-user-thread]');if(userThread&&role==='admin'){selectedSupportId=userThread.dataset.userThread;go('support');return}
 const supportThread=e.target.closest('[data-support-thread]');if(supportThread&&role==='admin'){selectedSupportId=supportThread.dataset.supportThread;await loadSupport();return}
 const topics=app.querySelector('.chat-topics');if(topics?.open&&!e.target.closest('.chat-topics'))topics.open=false;
 const a=e.target.closest('a[data-tab], button[data-tab]');if(a){e.preventDefault();if(a.dataset.tab==='intake')editingCase=null;if(a.dataset.tab==='dashboard')caseSearch='';go(a.dataset.tab);return}
 const p=e.target.closest('[data-prompt]');if(p){const input=app.querySelector('[data-form="chat"] textarea');input.value=localize(p.dataset.prompt);app.querySelector('.chat-topics').open=false;input.focus();return}
 const r=e.target.closest('[data-read]');if(r){await markRead(r.dataset.read);render();return}
 const c=e.target.closest('[data-choice]');if(c){sessionStorage.setItem('cla-choice',c.dataset.choice);app.querySelectorAll('[data-choice]').forEach(x=>{x.classList.toggle('selected',x===c);x.setAttribute('aria-pressed',String(x===c))});return}
 const sf=e.target.closest('[data-safety]');if(sf){sessionStorage.setItem('cla-safety',sf.dataset.safety);app.querySelectorAll('[data-safety]').forEach(x=>{x.classList.toggle('selected',x===sf);x.setAttribute('aria-pressed',String(x===sf))});return}
 const ev=e.target.closest('[data-evidence]');if(ev){const selected=new Set(JSON.parse(sessionStorage.getItem('cla-evidence')||'[]')),value=ev.dataset.evidence;if(value==='4'){if(selected.has(value))selected.delete(value);else{selected.clear();selected.add(value)}}else{selected.delete('4');selected.has(value)?selected.delete(value):selected.add(value)}sessionStorage.setItem('cla-evidence',JSON.stringify([...selected]));app.querySelectorAll('[data-evidence]').forEach(x=>{const active=selected.has(x.dataset.evidence);x.classList.toggle('selected',active);x.setAttribute('aria-pressed',String(active))});return}
 const b=e.target.closest('[data-action]');if(!b)return;
 if(b.dataset.action==='toggle-password'){const input=document.getElementById(b.dataset.target);if(input){const visible=input.type==='password';input.type=visible?'text':'password';b.textContent=visible?'Hide':'Show';b.setAttribute('aria-label',visible?'Hide password':'Show password');b.setAttribute('aria-pressed',String(visible))}return}
 const conversation=chatState.conversations.find(c=>c.id===b.dataset.id);
 if(b.dataset.action==='menu')document.getElementById('role-menu').classList.toggle('open');if(b.dataset.action==='logout'){await CLA.auth('logout',{});location.href='../index.html';return}if(b.dataset.action==='more'){const open=document.getElementById('mobile-tabs-menu').classList.toggle('open');b.setAttribute('aria-expanded',String(open))}
 if(b.dataset.action==='close-topics')app.querySelector('.chat-topics').open=false;
 if(b.dataset.action==='support-back'){selectedSupportId=null;render()}
 if(b.dataset.action==='close-case'){caseDetailVersion++;selectedCaseId=null;selectedCase=null;render()}
 if(b.dataset.action==='edit-case'&&selectedCase){editingCase=selectedCase;go('intake')}
 if(b.dataset.action==='confirm-delete-user'&&role==='admin'){const user=serverUsers.find(x=>x.id===b.dataset.id);if(user)openDeleteUserDialog(user)}
 if(b.dataset.action==='create-admin'&&role==='admin')openCreateAdminDialog();
 if(b.dataset.action==='manage-admin'&&role==='admin'){const admin=serverAdministrators.find(x=>x.id===b.dataset.id);if(admin&&admin.id!==serverUser?.id)openAdminAccountDialog(admin)}
 if(b.dataset.action==='manage-user'){const user=serverUsers.find(x=>x.id===b.dataset.id);if(user)openAccountDialog(user)}
 if(b.dataset.action==='close-account-dialog')document.getElementById('account-dialog').close();
 if(b.dataset.action==='cases-page'){b.disabled=true;try{await loadCases(Number(b.dataset.offset))}catch(error){errorNotice(error)}finally{if(b.isConnected)b.disabled=false}}
 if(b.dataset.action==='open-notice'){const notice=notices.find(n=>n.id===b.dataset.id);if(notice){await markRead(notice.id);if(notice.threadId)selectedSupportId=notice.threadId;go(notice.actionTab)}}
 if(b.dataset.action==='retry-save'){saveChats();render()}
 if(b.dataset.action==='retry-chat'){const current=activeChat(),message=current?.messages.find(m=>m.id===b.dataset.message&&m.delivery==='failed');if(message)requestReply(current,message)}
 if(b.dataset.action==='new-chat'){chatState.activeId=null;saveChats();go('chatbot')}
 if(b.dataset.action==='open'&&conversation){chatState.activeId=conversation.id;saveChats();go('chatbot')}
 if(b.dataset.action==='pin'&&conversation){if(role!=='guest')await CLA.call('chat_change',{id:conversation.id,operation:'pin',pin:!conversation.pin});conversation.pin=!conversation.pin;saveChats();render()}
 if(['rename','delete'].includes(b.dataset.action)&&conversation)openHistoryDialog(b.dataset.action,conversation);
 if(b.dataset.action==='close-history-dialog')document.getElementById('history-dialog').close();
 if(b.dataset.action==='read-all'){await markRead();render()}
 if(b.dataset.action==='next'){const s=+(sessionStorage.getItem('cla-step')||1),requiredKey=s===1?'cla-safety':s===2?'cla-choice':null;if(requiredKey&&!sessionStorage.getItem(requiredKey)){errorNotice(new Error(localize('Choose an option to continue.')));return}if(s===3&&!sessionStorage.getItem('cla-evidence'))sessionStorage.setItem('cla-evidence','[]');sessionStorage.setItem('cla-step',String(Math.min(s+1,4)));render()}
 if(b.dataset.action==='back'){sessionStorage.setItem('cla-step',String(Math.max(1,(+(sessionStorage.getItem('cla-step')||1))-1)));render()}
 if(b.dataset.action==='reset'){['cla-step','cla-choice','cla-safety','cla-evidence'].forEach(k=>sessionStorage.removeItem(k));render()}
 if(b.dataset.action==='print')window.print();
 if(b.dataset.action==='export')await exportReport();if(b.dataset.action==='export-user')await exportChecklist();
 }catch(error){errorNotice(error)}
});
app.addEventListener('keydown',e=>{if(e.key==='Escape'){const topics=app.querySelector('.chat-topics');if(topics?.open){topics.open=false;topics.querySelector('summary').focus()}}});
app.addEventListener('keydown',e=>{
 if(e.key!=='Enter'||e.shiftKey||e.ctrlKey||e.altKey||e.metaKey||e.isComposing||e.keyCode===229)return;
 if(e.target.tagName!=='TEXTAREA')return;
 const form=e.target.closest('form[data-form="chat"],form[data-form="support"]');if(!form)return;
 e.preventDefault();
 const button=form.querySelector('.chat-send');
 if(e.repeat||form.dataset.busy||!button||button.disabled||!e.target.value.trim())return;
 form.requestSubmit(button);
});
app.addEventListener('change',async e=>{
 try{
  const language=e.target.closest('[data-chat-language]');if(language&&['auto','en','tl','taglish'].includes(language.value)){if(role==='guest')put('chat-language',language.value);else serverUser=(await CLA.call('preferences',{chatLanguage:language.value})).user}
  const c=e.target.closest('[data-check]');if(c){const item=serverChecks[+c.dataset.check];if(!item)return;c.disabled=true;try{const result=await CLA.call('checklist_save',{id:item.id,done:c.checked});serverChecks=result.checklist;render()}catch(error){c.checked=item.done;c.disabled=false;throw error}}
  const r=e.target.closest('[data-range]');if(r){sessionStorage.setItem('cla-range',r.value);serverReport=null;render();await loadReport()}
  const date=e.target.closest('[data-report-date]');if(date){if(parseReportDate(date.value))sessionStorage.setItem('cla-report-date',date.value);serverReport=null;render();await loadReport()}
 }catch(error){errorNotice(error)}
});
let searchTimer;
app.addEventListener('input',e=>{
 if(e.target.matches('[data-law-search]')){const q=e.target.value.trim().toLowerCase(),items=[...app.querySelectorAll('[data-law-entry]')];let matches=0;items.forEach(x=>{const visible=x.textContent.toLowerCase().includes(q);x.hidden=!visible;if(visible)matches++});const count=app.querySelector('[data-law-count]'),empty=app.querySelector('[data-law-empty]');if(count)count.textContent=q?matches+' of '+items.length+' topics':items.length+' topics';if(empty)empty.hidden=matches>0}
 if(e.target.matches('[data-support-search]')){const q=e.target.value.toLowerCase();app.querySelectorAll('[data-support-thread]').forEach(row=>row.hidden=!row.dataset.supportMatch.includes(q))}
 if(e.target.matches('[data-search]')){
  if(tab==='cases'){caseSearch=e.target.value;clearTimeout(searchTimer);searchTimer=setTimeout(()=>loadCases().catch(errorNotice),250)}
  else{const q=e.target.value.toLowerCase();document.querySelectorAll('.data-table tbody tr').forEach(x=>x.style.display=x.textContent.toLowerCase().includes(q)?'':'none')}
 }
});
app.addEventListener('submit',async e=>{
 const f=e.target.closest('[data-form]');if(!f)return;e.preventDefault();const d=new FormData(f);
 if(f.dataset.form==='history-change'){
  const conversation=chatState.conversations.find(c=>c.id===f.dataset.id),value=String(d.get('value')||'').trim(),deleting=f.dataset.mode==='delete';
  const error=document.getElementById('history-error'),input=f.querySelector('input');
  if(!conversation){error.textContent=localize('This conversation is no longer available.');return}
  if((deleting&&value!=='DELETE')||(!deleting&&(!value||value.length>120))){error.textContent=localize(deleting?'Type DELETE to confirm removal.':'Enter a conversation name from 1 to 120 characters.');input.setAttribute('aria-invalid','true');input.focus();return}
  if(role!=='guest'){try{await CLA.call('chat_change',{id:conversation.id,operation:deleting?'delete':'rename',title:value,confirmation:value})}catch(e){error.textContent=e.message;return}}
  const previous=JSON.stringify(chatState);
  if(deleting){chatState.conversations=chatState.conversations.filter(c=>c.id!==conversation.id);if(chatState.activeId===conversation.id)chatState.activeId=null}else conversation.title=value;
  saveChats();if(chatSaveError){chatState=JSON.parse(previous);error.textContent=localize('Could not save this change. Please try again.');return}
  document.getElementById('history-dialog').close();render();return
 }
 if(f.dataset.form==='support'){await sendSupport(String(d.get('message')||'').trim());return}
 if(f.dataset.form==='chat'){const text=String(d.get('message')||'').trim();if(text)await send(text);return}
 const mode=f.dataset.form;
 if(f.dataset.busy)return;f.dataset.busy='true';const button=f.querySelector('button[type="submit"],button:not([type])');if(button)button.disabled=true;
 try{
  if(mode==='intake'){delete f.dataset.busy;await saveIntake(f,d);return}
  if(mode==='add-check'){
   const label=String(d.get('item')||'').trim();if(!label)throw new Error('Enter a checklist item.');
   if(f.dataset.label!==label){f.dataset.label=label;f.dataset.requestKey=conversationId()}
   serverChecks=(await CLA.call('checklist_save',{label,request_key:f.dataset.requestKey})).checklist;render();return;
  }
  if(mode==='profile')serverUser=(await CLA.call('profile',Object.fromEntries(d))).user;
  if(mode==='settings'){const updated=await CLA.call('preferences',{privacyMode:d.has('privacyMode')});appearance={dark:d.has('darkMode'),motion:d.has('motion'),textSize:Number(d.get('textSize'))||1};localStorage.setItem(appearanceKey,JSON.stringify(appearance));applyAppearance();serverUser=updated.user}
  if(mode==='password'){await CLA.call('password',Object.fromEntries(d));f.reset();resetPasswordVisibility(f);savedNotice('Password changed.');return}
  if(mode==='create-admin'){serverAdministrators=(await CLA.call('admin_create',Object.fromEntries(d))).administrators;document.getElementById('account-dialog').close();render();savedNotice('Administrator account created.');return}
  if(mode==='delete-user'){const result=await CLA.call('user_delete',{...Object.fromEntries(d),id:f.dataset.id});serverUsers=result.users;serverThreads=result.threads;applyNotices(result.notices);if(!serverThreads.some(t=>t.id===selectedSupportId))selectedSupportId=null;document.getElementById('account-dialog').close();render();savedNotice('User account deleted.');return}
  if(mode==='manage-user'){const existing=serverUsers.find(x=>x.id===f.dataset.id);if(existing?.status===String(d.get('status'))){document.getElementById('account-dialog').close();return}serverUsers=(await CLA.call('user_status',{id:f.dataset.id,status:String(d.get('status'))})).users;document.getElementById('account-dialog').close();render();savedNotice();return}
  if(mode==='reset-user-password'){await CLA.call('user_password',{...Object.fromEntries(d),id:f.dataset.id});f.reset();resetPasswordVisibility(f);savedNotice('Password changed.');return}
  if(mode==='manage-admin'){serverAdministrators=(await CLA.call('admin_status',{id:f.dataset.id,status:String(d.get('status'))})).administrators;document.getElementById('account-dialog').close();render();savedNotice('Administrator account updated.');return}
  if(mode==='reset-admin-account-password'){serverAdministrators=(await CLA.call('admin_password',{...Object.fromEntries(d),id:f.dataset.id})).administrators;document.getElementById('account-dialog').close();render();savedNotice('Administrator password reset.');return}
  if(mode==='language'){
   const selected=String(d.get('language'));
   if(role==='guest')put('language',selected);else serverUser=(await CLA.call('preferences',{uiLanguage:selected==='Tagalog'?'tl':'en'})).user;
   const result=await CLA.call(role==='guest'?'public':'notifications');applyNotices(result.notices);
  }
  render();savedNotice();
 }catch(error){const box=f.querySelector('.form-message');if(box)box.textContent=error.message;else errorNotice(error)}
 finally{delete f.dataset.busy;if(button?.isConnected)button.disabled=false}

});
function render(){const root=document.getElementById('content');if(!root)app.innerHTML=shell(content());else{root.innerHTML=content()+'<div class="portal-footer">General legal information only · Contact the Muntinlupa City District Office for legal assistance <a href="terms.html">Terms</a><a href="privacy.html">Privacy</a></div>';const crumb=document.querySelector('.breadcrumb b');if(crumb)crumb.textContent=tabname(tab);document.querySelectorAll('.portal-nav a[data-tab]').forEach(a=>a.classList.toggle('active',a.dataset.tab===tab));document.querySelectorAll('.mobile-tabs-menu a[data-tab]').forEach(a=>a.classList.toggle('active',a.dataset.tab===tab));const bell=document.querySelector('.top-actions button');if(bell){const dot=bell.querySelector('.unread-dot');if(notices.some(n=>!n.read)&&!dot)bell.insertAdjacentHTML('beforeend','<i class="unread-dot"></i>');if(!notices.some(n=>!n.read)&&dot)dot.remove()}}const accountName=app.querySelector('.profile-copy b');if(accountName&&serverUser)accountName.textContent=serverUser.name;if(window.lucide)window.lucide.createIcons();const sc=document.getElementById('chat-scroll');if(sc)sc.scrollTop=sc.scrollHeight;applyLanguage()}
function mountMobile(){
 const box=document.querySelector('.portal-nav');if(!box)return;
 const show=role==='guest'?['decision','history','chatbot','law']:role==='user'?['decision','checklist','support','history']:['dashboard','cases','support','reports'];
 box.querySelectorAll('a[data-tab]').forEach(a=>{a.dataset.mobileVisible=show.includes(a.dataset.tab)?'true':'false';a.style.setProperty('--mobile-order',String(show.indexOf(a.dataset.tab)+1))});
 const more=document.createElement('button');more.className='mobile-more';more.type='button';more.dataset.action='more';more.setAttribute('aria-controls','mobile-tabs-menu');more.setAttribute('aria-expanded','false');more.innerHTML=icon('ellipsis')+'<span>More</span>';box.appendChild(more);
 const panel=document.createElement('div');panel.className='mobile-tabs-menu';panel.id='mobile-tabs-menu';
 panel.innerHTML='<b>All workspace tabs</b>'+nav.map(x=>'<a data-tab="'+x[0]+'" href="'+role+'-'+x[0]+'.html">'+icon(x[1])+x[2]+'</a>').join('')+'<a href="../index.html">'+icon('house')+'Public home</a>';
 if(role==='guest')panel.innerHTML+='<a href="guest-language.html" data-tab="language">'+icon('languages')+'Language</a>';if(role!=='guest')panel.innerHTML+='<a href="'+role+'-profile.html" data-tab="profile">'+icon('user-round')+'Profile</a><a href="'+role+'-settings.html" data-tab="settings">'+icon('settings')+'Settings</a><a href="'+role+'-language.html" data-tab="language">'+icon('languages')+'Language</a><button type="button" data-action="logout">'+icon('log-out')+'Log out</button>';app.querySelector('.portal-main').appendChild(panel);if(window.lucide)window.lucide.createIcons();applyLanguage();
}
window.addEventListener('popstate',()=>{if(location.protocol==='file:'){const next=location.hash.slice(1)||document.body.dataset.tab||(role==='admin'?'dashboard':'chatbot');if(nav.some(x=>x[0]===next)||accountTabs.includes(next))tab=next}else{const slug=location.pathname.split('/').pop().replace(/\.html$/,'');if(slug.startsWith(role+'-')){const next=slug.slice(role.length+1);if(nav.some(x=>x[0]===next)||accountTabs.includes(next))tab=next}else tab=role==='admin'?'dashboard':'chatbot'}render()});
function renderPreservingInput(){
 const supportForm=app.querySelector('[data-form="support"]'),requestKey=supportForm?.dataset.requestKey,lastMessage=supportForm?.dataset.lastMessage;
 const input=app.querySelector('[data-form="chat"] textarea,[data-form="support"] textarea,[data-search]');
 const value=input?.value||'',focus=input&&document.activeElement===input,start=input?.selectionStart,end=input?.selectionEnd;
 render();const next=app.querySelector('[data-form="chat"] textarea,[data-form="support"] textarea,[data-search]');
 const nextForm=app.querySelector('[data-form="support"]');if(nextForm&&requestKey){nextForm.dataset.requestKey=requestKey;nextForm.dataset.lastMessage=lastMessage}
 if(next){next.value=value;if(focus){next.focus();if(typeof next.setSelectionRange==='function')next.setSelectionRange(start,end)}}
}
async function markRead(id){
 if(role==='guest'){
  const reads=new Set(get('notice-reads',[]));(id?[id]:notices.map(n=>n.id)).forEach(x=>reads.add(x));put('notice-reads',[...reads]);notices.forEach(n=>{if(!id||n.id===id)n.read=true});
 }else applyNotices((await CLA.call('notice_read',id?{id}:{})).notices);
}
async function loadSupport(){
 if(role==='guest')return;const selected=selectedSupportId;
 const result=await CLA.call('support',undefined,selected?{thread:selected}:{});
 if(selected!==selectedSupportId)return;applyNotices(result.notices);if(tab==='support'&&app.querySelector('[data-form="support"]')?.dataset.busy)return;const changed=JSON.stringify(serverThreads)!==JSON.stringify(result.threads);serverThreads=result.threads;if(tab==='support'&&changed)renderPreservingInput();
}
async function loadReport(){
 const version=++reportVersion,range=sessionStorage.getItem('cla-range')||'month',anchor=sessionStorage.getItem('cla-report-date')||dateKey(new Date());
 const result=await CLA.call('report',undefined,{range,anchor});if(version!==reportVersion)return;serverReport=result.report;if(tab==='reports')render();
}
async function loadCases(offset=0){
 const version=++searchVersion;
 const requestedOffset=Math.max(0,Number(offset)||0),result=await CLA.call('cases',undefined,{search:caseSearch,offset:requestedOffset});
 if(version!==searchVersion)return;caseTotal=result.cases.total;caseHasMore=result.cases.hasMore;caseOffset=(result.cases.offset||0)+result.cases.records.length;serverDashboard=result.dashboard;
 casePageStart=result.cases.offset||0;serverCases=result.cases.records;
 if(selectedCaseId&&!serverCases.some(r=>r.id===selectedCaseId)){caseDetailVersion++;selectedCaseId=null;selectedCase=null}
 if(['cases','dashboard'].includes(tab)){renderPreservingInput();const input=app.querySelector('[data-search]');if(input)input.value=caseSearch}
}
async function loadTab(key){
 const version=++refreshVersion;
 if(key==='support'){await loadSupport();return}
 if(key==='reports'&&role==='admin'){await loadReport();return}
 if(['cases','dashboard'].includes(key)&&role==='admin'){await loadCases();return}
 if(key==='users'&&role==='admin'){const r=await CLA.call('users');if(version===refreshVersion){serverUsers=r.users;serverAdministrators=r.administrators;render()}return}
 if(key==='history'&&role!=='guest'&&!pendingChats.size){const r=await CLA.call('chats');if(version===refreshVersion){chatState.conversations=r.conversations.map(c=>({...c,persisted:true}));if(!activeChat())chatState.activeId=null;render()}return}
 if(key==='notifications'||key==='alerts'){const r=await CLA.call(role==='guest'?'public':'notifications');if(version===refreshVersion){applyNotices(r.notices);render()}return}
}
render();mountMobile();
await loadTab(tab).catch(errorNotice);
if(role!=='guest'){
 const poll=setInterval(async()=>{
  if(document.hidden)return;
  try{
   if(tab==='support')await loadSupport();
   else{
    const result=await CLA.call('notifications');applyNotices(result.notices);
    if(['notifications','alerts'].includes(tab))render();
    const bell=app.querySelector('.top-actions button');
    if(bell){bell.querySelector('.unread-dot')?.remove();if(notices.some(n=>!n.read))bell.insertAdjacentHTML('beforeend','<i class="unread-dot"></i>')}
   }
  }catch(error){if(error.status===401){clearInterval(poll);errorNotice(error)}}
 },5000);
 window.addEventListener('pagehide',()=>clearInterval(poll),{once:true});
}
window.addEventListener('pageshow',e=>{if(e.persisted)location.reload()});
})();
