const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname,'../assets/js/site.js'),'utf8');

async function login(user,memory,blocked=false) {
 let submitHandler, redirected = false;
 const message = { textContent:'', classList:{ remove(){},toggle(){},add(){} } }, button = { disabled:false };
 const form = { dataset:{ successUrl:'user.html' }, querySelector:selector=>selector==='.form-message'?message:button, addEventListener:(event,handler)=>{ submitHandler=handler; } };
 const window = { location:{href:''}, setTimeout(callback){ redirected=true;callback(); } };
 vm.runInNewContext(source,{
  window,
  document:{ body:{dataset:{authUrl:'auth.php'}},querySelector:()=>null,querySelectorAll:selector=>selector==='[data-auth-form]'?[form]:[] },
  fetch:async()=>({json:async()=>({ok:true,message:'Signed in',user})}),
  FormData:class {},
  localStorage:{getItem:key=>memory.get(key)||null,setItem:(key,value)=>{if(blocked)throw new Error('Storage unavailable');memory.set(key,value);}}
 });
 await submitHandler({preventDefault(){}});
 assert(redirected && !button.disabled && message.textContent==='Signed in','Preview caching must not interfere with login');
}

(async()=>{
 const memory=new Map(),ana={id:'ana',name:'Ana',email:'ana@example.test',phone:'111',role:'user',password:'never cache',password_hash:'never cache this either'};
 await login(ana,memory);
 let directory=JSON.parse(memory.get('cla-user-directory'));
 assert.equal(directory.length,1);assert.equal(directory[0].email,ana.email);
 assert(!memory.get('cla-user-directory').includes('password'));
 assert(!memory.get('cla-user-profile').includes('password'));
 memory.set('cla-user-profile',JSON.stringify({name:'Updated Ana',email:ana.email,phone:'999'}));
 await login(ana,memory);
 assert.equal(JSON.parse(memory.get('cla-user-directory'))[0].phone,'999','Returning login must keep locally edited contact details');
 await login({id:'ben',name:'Ben',email:'ben@example.test',phone:'222',role:'user'},memory);
 directory=JSON.parse(memory.get('cla-user-directory'));
 assert.equal(directory.length,2);assert.equal(directory.find(u=>u.email===ana.email).name,'Updated Ana');
 const before=memory.get('cla-user-directory');
 await login({id:'office',name:'Office administrator',email:'admin@example.test',role:'admin'},memory);
 assert.equal(memory.get('cla-user-directory'),before,'Office administrators must not appear as registered users');
 await login(ana,memory,true);
 console.log('Successful sign-in preview directory, safe public fields, profile edits, multiple users, and storage failure passed');
})().catch(error=>{console.error(error);process.exitCode=1;});
