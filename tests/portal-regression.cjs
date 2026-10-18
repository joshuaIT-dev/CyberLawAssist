const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../assets/js/portal.js'), 'utf8');
const languageSource = fs.readFileSync(path.join(__dirname, '../assets/js/portal-language.js'), 'utf8');

function mount(role, memory = new Map()) {
  let html = '', mounted = false, blocked = false, prints = 0, mobileLinks = [], exported = null;
  const events = {}, documentEvents = {}, windowEvents = {}, input = { value: '', focus() {}, setAttribute() {} }, error = { textContent: '' };
  const menuClasses = new Set(), moreButton = { attributes: {}, setAttribute(key,value) { this.attributes[key] = value; } };
  const morePanel = { classList: { remove: name => menuClasses.delete(name), toggle: name => { if (menuClasses.has(name)) { menuClasses.delete(name); return false; } menuClasses.add(name); return true; } } };
  const topics = { open: false, querySelector: () => input };
  const dialog = { open: false, innerHTML: '', showModal() { this.open = true; }, close() { this.open = false; }, querySelector: () => input, querySelectorAll: () => [] };
  const root = { set innerHTML(value) { html = value; } };
  const app = {
    set innerHTML(value) {
      mounted = true; html = value;
      const nav = value.match(/<nav class="portal-nav">([\s\S]*?)<\/nav>/)?.[1] || '';
      mobileLinks = [...nav.matchAll(/data-tab="([^"]+)"/g)].map(m => ({ dataset: { tab: m[1] }, style: { setProperty(key, value) { this[key] = value; } } }));
    },
    addEventListener: (name, handler) => events[name] = handler,
    querySelector: selector => selector === '.chat-topics' ? topics : selector === '[data-action="more"]' ? moreButton : selector === '.portal-main' ? { appendChild() {} } : selector.includes('textarea') ? input : null,
    querySelectorAll: () => []
  };
  const document = {
    body: { dataset: { role, tab: 'chatbot' } },
    documentElement: {}, activeElement: input,
    getElementById: id => ({ 'portal-app': app, content: mounted ? root : null, 'history-dialog': dialog, 'history-error': error, 'support-error': error, 'intake-message': error, 'mobile-tabs-menu': morePanel })[id] || null,
    querySelector: selector => selector === '.portal-nav' ? { querySelectorAll: () => mobileLinks, appendChild() {} } : null,
    querySelectorAll: () => [],
    createElement: () => ({ dataset: {}, innerHTML: '', setAttribute() {}, click() { if (exported) exported.filename = this.download; } }),
    addEventListener: (name, handler) => documentEvents[name] = handler,
    createTreeWalker: () => ({ nextNode: () => null })
  };
  const storage = {
    getItem: key => memory.get(key) ?? null,
    setItem: (key, value) => { if (blocked) throw new Error('Storage full'); memory.set(key, value); },
    removeItem: key => memory.delete(key)
  };
  class FormData {
    constructor(form) { this.values = form.values; }
    get(key) { return this.values[key] ?? null; }
  }
  const window = { addEventListener: (name,handler) => windowEvents[name] = handler, print() { prints++; } };
  const fetch = async () => ({ ok: true, json: async () => ({ answer: 'Local NLP answer', language: 'en', topic: null, sources: [], suggestions: [] }) });
  const context = vm.createContext({ document, window, fetch, AbortController, setTimeout, clearTimeout, localStorage: storage, sessionStorage: storage, location: new URL('http://localhost/CyberLawAssist/pages/' + role + '-chatbot.html'), history: { pushState() {} }, URLSearchParams, FormData, NodeFilter: { SHOW_TEXT: 4 }, Blob: class { constructor(parts) { this.content = parts.join(''); } }, URL: { createObjectURL(blob) { exported = { content: blob.content }; return 'blob:report'; }, revokeObjectURL() {} } });
  vm.runInContext(languageSource, context); vm.runInContext(source, context);
  const click = (selector, dataset) => {
    const event = { target: { closest: key => key === selector || (key === '#mobile-tabs-menu, [data-action="more"]' && dataset.action === 'more') ? { dataset, setAttribute: (key,value) => moreButton.setAttribute(key,value) } : null }, preventDefault() {} };
    events.click(event); documentEvents.click(event);
  };
  const action = (action, id) => click('[data-action]', { action, id });
  const tab = tab => click('a[data-tab], button[data-tab]', { tab });
  const submit = (form, values, extra = {}) => {
    const node = { dataset: { form, ...extra }, values, querySelector: () => input };
    return events.submit({ target: { closest: () => node }, preventDefault() {} });
  };
  return { action, tab, submit, dialog, error, topics, input, memory,
    html: () => html,
    state: () => JSON.parse(memory.get('cla-' + role + '-chat-state')),
    send: message => submit('chat', { message }),
    suggest: prompt => click('[data-prompt]', { prompt }),
    block: value => { blocked = value; },
    chooseThread: id => click('[data-support-thread]', { supportThread: id }),
    openCase: id => click('[data-case]', { case: id }),
    openUserConversation: id => click('[data-user-thread]', { userThread: id }),
    change: (selector, value) => events.change({ target: { closest: key => key === selector ? { value } : null } }),
    exported: () => exported,
    syncSupport: () => windowEvents.storage({ key: 'cla-support-threads' }),
    outside: () => documentEvents.click({ target: { closest: () => null } }),
    insideMore: () => documentEvents.click({ target: { closest: () => ({}) } }),
    moreOpen: () => menuClasses.has('open'),
    language: () => document.documentElement.lang,
    translated: (value,lang) => window.CyberLawLanguage.text(value,lang),
    escape: () => { events.keydown({ key: 'Escape' }); documentEvents.keydown({ key: 'Escape' }); },
    mobileTabs: () => mobileLinks.filter(a => a.dataset.mobileVisible === 'true').sort((a,b) => Number(a.style['--mobile-order']) - Number(b.style['--mobile-order'])).map(a => a.dataset.tab).concat('more'),
    prints: () => prints
  };
}

(async () => {
for (const role of ['guest', 'user', 'admin']) {
  const app = mount(role);
  app.action('more'); assert(app.moreOpen(), 'More must open');
  app.insideMore(); assert(app.moreOpen(), 'Tapping inside More must keep it open');
  app.outside(); assert(!app.moreOpen(), 'Tapping outside More must close it');
  assert.deepEqual(app.mobileTabs(), role === 'guest' ? ['decision','history','chatbot','law','more'] : role === 'user' ? ['decision','checklist','support','history','more'] : ['dashboard','cases','support','reports','more'], 'Mobile navigation must have five items with the correct center tab');
  if (role === 'admin') {
    app.tab('support'); assert(app.html().includes('<h1>Live support</h1>'));
    assert(fs.existsSync(path.join(__dirname, '../pages/admin-support.html')));
    app.tab('chatbot');
  }
  await app.send('First concern');
  const first = app.state().activeId;
  app.action('new-chat');
  assert.equal(app.state().conversations.length, 1, 'New chat must retain history');
  assert.equal(app.state().activeId, null, 'Empty new chat must remain empty after refresh');
  await app.send('Second concern');
  const second = app.state().activeId;
  assert.notEqual(first, second);
  assert.equal(app.state().conversations.length, 2);
  const reloaded = mount(role, app.memory);
  assert(reloaded.html().includes('Second concern'), 'Active conversation must survive refresh');
  reloaded.tab('history');
  reloaded.action('open', first);
  assert(reloaded.html().includes('First concern'));
  assert(!reloaded.html().includes('Second concern'), 'Open must select one conversation');
  await reloaded.send('Follow-up');
  assert.equal(reloaded.state().conversations.find(c => c.id === first).messages.length, 4);
  reloaded.tab('history');
  reloaded.action('rename', first);
  assert(reloaded.dialog.open);
  reloaded.submit('history-change', { value: '   ' }, { mode: 'rename', id: first });
  assert(reloaded.dialog.open && reloaded.error.textContent, 'Blank names must show an in-page error');
  reloaded.submit('history-change', { value: 'Renamed <conversation>' }, { mode: 'rename', id: first });
  assert(!reloaded.dialog.open);
  assert(reloaded.html().includes('Renamed &lt;conversation&gt;'), 'Titles must be escaped');
  reloaded.action('pin', first);
  assert(reloaded.state().conversations.find(c => c.id === first).pin);
  reloaded.action('delete', second);
  assert(reloaded.dialog.open && reloaded.state().conversations.length === 2, 'Opening delete must not remove anything');
  reloaded.submit('history-change', { value: 'wrong' }, { mode: 'delete', id: second });
  assert(reloaded.dialog.open && reloaded.state().conversations.length === 2, 'Incorrect confirmation must not delete');
  reloaded.action('close-history-dialog');
  assert(!reloaded.dialog.open && reloaded.state().conversations.length === 2, 'Cancel must keep the conversation');
  reloaded.action('delete', second);
  reloaded.submit('history-change', { value: 'DELETE' }, { mode: 'delete', id: second });
  assert.equal(reloaded.state().conversations.length, 1);
  assert.equal(reloaded.state().activeId, first, 'Deleting another conversation must preserve the active one');
  reloaded.tab('chatbot');
  reloaded.topics.open = true;
  reloaded.suggest('What is RA 10175?');
  assert.equal(reloaded.input.value, 'What is RA 10175?');
  assert(!reloaded.topics.open);
  assert.equal(reloaded.state().conversations[0].messages.length, 4, 'Selecting a topic must allow editing before sending');
  reloaded.topics.open = true; reloaded.escape(); assert(!reloaded.topics.open);
  if (role !== 'guest') {
    reloaded.tab('checklist');
    assert(reloaded.html().includes('panel checklist-print'));
    reloaded.action('print'); assert.equal(reloaded.prints(), 1);
  }
  console.log(role + ': conversation saving, refresh, reopen, edit, pin, validated deletion, and topics passed');
}

const legacy = [{ text: 'Existing question', mine: true, title: 'Previous chat' }, { text: 'Existing response', mine: false }];
const memory = new Map([['cla-guest-chat', JSON.stringify(legacy)]]);
const migrated = mount('guest', memory);
assert.deepEqual(migrated.state().conversations[0].messages, legacy);
assert(!memory.has('cla-guest-chat'), 'Old storage is removed only after migration succeeds');
migrated.block(true); await migrated.send('Unsaved follow-up');
assert(migrated.html().includes('Unsaved follow-up') && migrated.html().includes('could not be saved'), 'Storage failure must retain messages and show an in-page warning');
migrated.block(false); migrated.action('retry-save');
assert.equal(migrated.state().conversations[0].messages.length, 4);
migrated.tab('history');
const id = migrated.state().activeId;
migrated.action('delete', id); migrated.block(true);
migrated.submit('history-change', { value: 'DELETE' }, { mode: 'delete', id });
assert(migrated.dialog.open && migrated.error.textContent.includes('Could not save'));
assert.equal(migrated.state().conversations.length, 1, 'A failed deletion must retain saved data');
migrated.block(false);
migrated.submit('history-change', { value: 'DELETE' }, { mode: 'delete', id });
assert.equal(mount('guest', memory).state().conversations.length, 0, 'Deleted legacy chats must not return on refresh');
console.log('Legacy migration, save failure, retry, and failed deletion recovery passed');

const shared = new Map();
shared.set('cla-user-profile', JSON.stringify({ name: 'Ana Reyes', email: 'ana@example.test' }));
const ana = mount('user', shared); ana.tab('support'); ana.submit('support', { message: 'Question from Ana' });
shared.set('cla-user-profile', JSON.stringify({ name: 'Ben Cruz', email: 'ben@example.test' }));
const ben = mount('user', shared); ben.tab('support'); ben.submit('support', { message: 'Question from Ben' });
const readThreads = () => JSON.parse(shared.get('cla-support-threads'));
assert.equal(readThreads().length, 2, 'Users must have separate support conversations');
assert.equal(readThreads()[0].messages.length, 1, 'Support must not invent a staff reply');
const staff = mount('admin', shared); staff.tab('support');
assert(staff.html().includes('Ana Reyes') && staff.html().includes('Ben Cruz'));
assert(staff.html().includes('Select a conversation'));
staff.submit('support', { message: 'No recipient' });
assert.equal(readThreads()[0].messages.length, 1, 'Admin cannot send without selecting a user');
const anaThread = readThreads().find(t => t.userId === 'ana@example.test');
staff.chooseThread(anaThread.id);
assert(staff.html().includes('Question from Ana'));
staff.submit('support', { message: 'Office reply for Ana' });
assert.equal(readThreads().find(t => t.id === anaThread.id).messages.at(-1).sender, 'admin');
assert.equal(readThreads().find(t => t.userId === 'ben@example.test').messages.length, 1, 'Replies must only reach the selected user');
shared.set('cla-user-profile', JSON.stringify({ name: 'Ana Reyes', email: 'ana@example.test' }));
const anaAgain = mount('user', shared); anaAgain.tab('support');
assert(anaAgain.html().includes('Office reply for Ana') && !anaAgain.html().includes('Question from Ben'));
staff.input.value = 'Staff draft'; anaAgain.submit('support', { message: 'Follow-up from Ana' }); staff.syncSupport();
assert(staff.html().includes('Follow-up from Ana'));
assert.equal(staff.input.value, 'Staff draft', 'Incoming messages must not erase a reply draft');
anaAgain.input.value = 'Unsent draft'; anaAgain.block(true); anaAgain.submit('support', { message: 'Unsent draft' });
assert(anaAgain.error.textContent.includes('Could not save'));
assert.equal(anaAgain.input.value, 'Unsent draft');
assert(!readThreads().some(t => t.messages.some(m => m.text === 'Unsent draft')));
const guestSupport = mount('guest', shared), countBeforeGuest = readThreads().length;
guestSupport.submit('support', { message: 'Guest message' }); assert.equal(readThreads().length, countBeforeGuest);
console.log('User selection, targeted admin replies, user visibility, draft retention, and support validation passed');

for (const role of ['guest','user','admin']) {
  const app = mount(role); app.tab('language');
  assert(app.html().includes('value="Tagalog"'));
  app.submit('language', { language: 'Tagalog' }); assert.equal(app.language(), 'tl');
  assert.equal(app.translated('Live support', 'Tagalog'), 'Tulong online');
  assert.equal(mount(role, app.memory).language(), 'tl', 'Language preference must survive refresh');
  app.submit('language', { language: 'English' }); assert.equal(app.language(), 'en');
  app.action('more'); app.escape(); assert(!app.moreOpen(), 'Escape must close More');
}

const normalNode = { nodeValue: 'Live support', parentElement: { closest: () => false } };
const messageNode = { nodeValue: 'Do not translate my message', parentElement: { closest: () => true } };
const placeholder = { values: { placeholder: 'Search conversations' }, hasAttribute(key) { return key in this.values; }, getAttribute(key) { return this.values[key]; }, setAttribute(key,value) { this.values[key] = value; } };
const root = { querySelectorAll: () => [placeholder] }, languageWindow = {};
vm.runInNewContext(languageSource, { window: languageWindow, NodeFilter: { SHOW_TEXT: 4 }, document: { createTreeWalker: () => { const nodes = [normalNode,messageNode]; return { nextNode: () => nodes.shift() }; } } });
languageWindow.CyberLawLanguage.apply(root, 'Tagalog');
assert.equal(normalNode.nodeValue, 'Tulong online');
assert.equal(placeholder.values.placeholder, 'Maghanap ng pag-uusap');
assert.equal(messageNode.nodeValue, 'Do not translate my message');
languageWindow.CyberLawLanguage.apply(root, 'English');
assert.equal(normalNode.nodeValue, 'Live support'); assert.equal(placeholder.values.placeholder, 'Search conversations');
console.log('English/Tagalog persistence, reversible UI translation, original message text, and More dismissal passed');

const intakeApp = mount('admin'); intakeApp.tab('intake');
const intake = { name: 'Nora Santos', phone: '09123456789', type: 'Online harassment', date: '2024-02-29', staff: 'Assigned staff', status: 'For review', notes: 'Detailed notes\n<script>not markup</script>' };
intakeApp.submit('intake', intake);
let savedCases = JSON.parse(intakeApp.memory.get('cla-admin-cases'));
const firstIntake = savedCases[0];
for (const [key,value] of Object.entries(intake)) assert.equal(firstIntake[key], value, 'Intake field must persist: ' + key);
assert(intakeApp.html().includes('<h1>Case records</h1>') && intakeApp.html().includes('Intake details'), 'Saving intake must open its case record');
assert(intakeApp.html().includes('&lt;script&gt;not markup&lt;/script&gt;'), 'Notes must render as text');
assert(savedCases.some(c => c.legacy && c.id === 'PAO-2026-014'), 'Existing summary records must be retained');
intakeApp.submit('intake', { ...intake, name: 'Second visitor' });
savedCases = JSON.parse(intakeApp.memory.get('cla-admin-cases'));
assert.equal(new Set(savedCases.map(c => c.id)).size, savedCases.length, 'Intake references must be unique');
const intakeReload = mount('admin', intakeApp.memory); intakeReload.openCase(firstIntake.id);
assert(intakeReload.html().includes('Nora Santos') && intakeReload.html().includes('09123456789'));
const savedBeforeFailure = intakeApp.memory.get('cla-admin-cases');
intakeReload.tab('intake'); intakeReload.block(true); intakeReload.submit('intake', intake);
assert.equal(intakeApp.memory.get('cla-admin-cases'), savedBeforeFailure);
assert(intakeReload.error.textContent.includes('Could not save'));
intakeReload.block(false); intakeReload.submit('intake', { ...intake, date: '2024-02-30' });
assert.equal(intakeApp.memory.get('cla-admin-cases'), savedBeforeFailure, 'Invalid dates must not create records');
console.log('Full intake storage, detail viewing, unique references, old records, invalid dates, and save failures passed');

const reportMemory = new Map([['cla-admin-cases',JSON.stringify([
  ['PAO-OLD-1','Old undated record','Completed'],
  { id:'A',date:'2024-02-01',type:'Other',status:'Completed' },
  { id:'B',date:'2024-02-29',type:'Other',status:'For review' },
  { id:'C',date:'2024-03-01',type:'Other',status:'Referred' },
  { id:'D',date:'2023-02-28',type:'Other',status:'In progress' }
])]]);
const reports = mount('admin',reportMemory);
const buckets = () => [...reports.html().matchAll(/class="report-bar" data-period="([^"]+)" data-count="(\d+)"/g)].map(m => ({ key:m[1], count:Number(m[2]) }));
reports.tab('reports');
for (const [date,days] of [['2023-02-15',28],['2024-02-15',29],['2024-04-15',30],['2024-07-15',31],['1900-02-15',28],['2000-02-15',29]]) {
  reports.change('[data-report-date]',date); reports.change('[data-range]','month');
  assert.equal(buckets().length,days,'Calendar days for ' + date);
}
reports.change('[data-report-date]','2024-02-15');
assert.equal(buckets().reduce((sum,b) => sum+b.count,0),2,'Only dated February visits should count');
assert.equal(buckets().find(b => b.key === '2024-02-29').count,1);
reports.action('export');
assert(reports.exported().content.includes('"2024-02-29","1"'));
assert.equal(reports.exported().content.split('\r\n').length,38,'CSV must contain the same 29 daily buckets plus metadata');
reports.change('[data-report-date]','2024-03-01'); reports.change('[data-range]','week');
assert.equal(buckets().length,7); assert.equal(buckets()[0].key,'2024-02-26'); assert.equal(buckets().at(-1).key,'2024-03-03');
assert.equal(buckets().reduce((sum,b) => sum+b.count,0),2);
reports.change('[data-report-date]','2024-12-31');
assert.equal(buckets()[0].key,'2024-12-30'); assert.equal(buckets().at(-1).key,'2025-01-05');
reports.change('[data-range]','year');
assert.equal(buckets().length,12); assert.equal(buckets()[0].key,'2024-01'); assert.equal(buckets().at(-1).key,'2024-12');
assert.equal(buckets()[1].count,2); assert.equal(buckets()[2].count,1);
assert.equal(buckets().reduce((sum,b) => sum+b.count,0),3,'Undated and other-year records must not count');
reports.action('export'); assert(reports.exported().content.includes('"2024-02","2"'));
console.log('Seven-day weeks, 28/29/30/31-day months, leap years, year boundaries, monthly years, and matching CSV passed');

shared.set('cla-user-directory',JSON.stringify([{ id:'registered-user', name:'Cached registered user', email:'cached@example.test', phone:'123', role:'user' },{ id:'admin',name:'Excluded admin account',role:'admin' }]));
staff.tab('users');
assert(staff.html().includes('<h1>Users</h1>') && staff.html().includes('Cached registered user'));
assert(staff.html().includes('Ana Reyes') && staff.html().includes('Ben Cruz'));
assert(!staff.html().includes('Excluded admin account'));
staff.openUserConversation(anaThread.id); assert(staff.html().includes('<h1>Live support</h1>') && staff.html().includes('Follow-up from Ana'));
assert(fs.existsSync(path.join(__dirname,'../pages/admin-users.html')));
console.log('Admin user directory, profile/support merging, and opening a selected user conversation passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
