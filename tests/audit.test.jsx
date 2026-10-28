import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {act,create} from 'react-test-renderer';
import {POST as signup} from '@/app/api/signups/route';
import {PUT as editSignup} from '@/app/api/signups/[id]/route';
import {PATCH as checkin} from '@/app/api/signups/[id]/checkin/route';
import ThreadList from '@/components/ThreadList';
import QueueTaskDetailClient from '@/components/QueueTaskDetailClient';

const json=(body,status=200,headers={})=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json',...headers}});
const active={id:'task-1',title:'Event',categories:[],start_date:'2000-01-01',end_date:'2099-01-01',task_mode:'normal',quantity_unit:null,notify_enabled:false};
function api(task=active,{readError=false}={}) {
  const writes=[];
  globalThis.fetch=async(input,init={})=>{
    const url=new URL(typeof input==='string'?input:input.url,'https://example.com');
    if(url.pathname==='/rest/v1/tasks') return json(task);
    if(url.pathname==='/rest/v1/signups') {
      if(init.method==='POST'||init.method==='PATCH') {const row=JSON.parse(init.body);writes.push(row);return json({...row,id:'signup-1'});}
      if(url.searchParams.has('id')) return json({owner_token:'owner',task_id:'task-1',name:'Original',quantity:1,categories:['A'],category_quantities:{A:1},note:''});
      if(readError) return json({message:'database unavailable'},503);
      if(init.method==='HEAD') return new Response(null,{headers:{'content-range':'*/0'}});
      return json([]);
    }
    throw Error(`Unexpected ${url}`);
  };
  return writes;
}
const request=(body,method='POST')=>new Request('https://example.com/api/signups',{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
const base={task_id:'task-1',name:'Guest',owner_token:'owner'};

test('registration rejects whitespace, future and closed tasks before writing',async()=>{
  for(const [task,body] of [[active,{...base,name:'   '}],[{...active,start_date:'2099-01-01'},base],[{...active,end_date:'2000-01-01'},base]]) {
    const writes=api(task);
    const response=await signup(request(body));
    assert.equal(response.status,400);assert.equal(writes.length,0);
  }
});
test('failed capacity and duplicate reads never admit a registration',async()=>{
  for(const task of [active,{...active,max_signups:5}]) {
    const writes=api(task,{readError:true});
    const response=await signup(request(base));
    assert.notEqual(response.status,200);assert.equal(writes.length,0);
  }
});
test('editing enforces name, required/single categories and integer quantities',async()=>{
  const task={...active,categories:['A','B','__relay_category_single__','__relay_category_single__'],quantity_unit:'份'};
  for(const patch of [{name:' ',categories:['A'],category_quantities:{A:1}},{name:'Guest',categories:[]},{name:'Guest',categories:['A','B'],category_quantities:{A:1,B:1}},{name:'Guest',categories:['A'],category_quantities:{A:1.5}}]) {
    const writes=api(task);const response=await editSignup(request({...patch,owner_token:'owner'},'PUT'),{params:{id:'signup-1'}});
    assert.equal(response.status,400);assert.equal(writes.length,0);
  }
  const writes=api(task);
  const response=await editSignup(request({name:' Guest ',categories:['A'],category_quantities:{A:2,B:100},owner_token:'owner'},'PUT'),{params:{id:'signup-1'}});
  assert.equal(response.status,200);assert.equal(writes[0].quantity,2);assert.deepEqual(writes[0].category_quantities,{A:2});assert.equal(writes[0].name,'Guest');
});
test('check-in requires a boolean rather than coercing the string false to true',async()=>{
  const writes=api();const response=await checkin(request({owner_token:'owner',checked_in:'false'},'PATCH'),{params:{id:'signup-1'}});
  assert.equal(response.status,400);assert.equal(writes.length,0);
});
const store=new Map();
globalThis.localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)};
let tick;
globalThis.window={localStorage,location:{search:''},addEventListener(){},removeEventListener(){},setTimeout,clearTimeout,setInterval:fn=>{tick=fn;return 1;},clearInterval(){}};
globalThis.document={documentElement:{dataset:{}},querySelector:()=>null};
globalThis.requestAnimationFrame=fn=>{fn();return 1;};
globalThis.cancelAnimationFrame=()=>{};
const text=node=>typeof node==='string'?node:(node?.children||[]).map(text).join('');
const btn=(root,label)=>root.findAllByType('button').find(n=>text(n).trim()===label);
test('failed signup edits retain draft and allow retry, including network errors',async()=>{
  for(const onUpdate of [async()=>false,async()=>{throw Error('offline');}]) {
    let rendered;
    await act(async()=>{rendered=create(<ThreadList signups={[{id:'one',name:'Original',categories:[],created_at:new Date().toISOString()}]} myIds={['one']} categories={[]} onUpdate={onUpdate}/>);});
    try {
      await act(async()=>btn(rendered.root,'編輯').props.onClick());
      await act(async()=>rendered.root.findAllByType('input')[0].props.onChange({target:{value:'My draft'}}));
      await act(async()=>btn(rendered.root,'儲存').props.onClick());
      assert.equal(rendered.root.findAllByType('input')[0]?.props.value,'My draft');
      assert.equal(btn(rendered.root,'儲存').props.disabled,false);
    } finally {await act(async()=>rendered.unmount());}
  }
});
test('queue initial failure never invents zero; retry works and stale responses cannot overwrite',async()=>{
  const pending=[];
  globalThis.fetch=()=>new Promise(resolve=>pending.push(resolve));
  let rendered;
  await act(async()=>{rendered=create(<QueueTaskDetailClient initialTask={{...active,task_mode:'queue'}}/>);});
  try {
    assert.ok(!text(rendered.toJSON()).includes('目前 0 位等待中'));
    await act(async()=>pending.shift()(json({error:'offline'},500)));
    assert.ok(!text(rendered.toJSON()).includes('目前 0 位等待中'));
    assert.ok(btn(rendered.root,'重試'));
    await act(async()=>{btn(rendered.root,'重試').props.onClick();});
    await act(async()=>pending.shift()(json({waiting_count:5,my_signups:[]})));
    assert.ok(text(rendered.toJSON()).includes('目前 5 位等待中'));
    await act(async()=>{tick();tick();});
    const older=pending.shift(),newer=pending.shift();
    await act(async()=>newer(json({waiting_count:7,my_signups:[]})));
    await act(async()=>older(json({waiting_count:2,my_signups:[]})));
    assert.ok(text(rendered.toJSON()).includes('目前 7 位等待中'));
    await act(async()=>{tick();});
    await act(async()=>pending.shift()(json({error:'offline'},500)));
    assert.ok(text(rendered.toJSON()).includes('目前 7 位等待中'));
    assert.ok(text(rendered.toJSON()).includes('尚未同步'));
  } finally {await act(async()=>rendered.unmount());}
});

test('image sharing failure really downloads; cancellation never downloads',async()=>{
  const {default:Panel}=await import('@/components/TaskShareImagePanel');
  const oldDocument=globalThis.document,oldNavigator=Object.getOwnPropertyDescriptor(globalThis,'navigator');
  let downloads=0;
  globalThis.Image=class {set src(value){this.onload();}};
  globalThis.document={...oldDocument,body:{appendChild(){}},createElement:tag=>tag==='canvas'?{getContext:()=>({drawImage(){}}),toBlob:fn=>fn(new Blob(['png'],{type:'image/png'}))}:{click(){downloads++;},remove(){}}};
  try {
    store.set('relay_home_language','en');
    for(const kind of ['NotAllowedError','AbortError']) {
      Object.defineProperty(globalThis,'navigator',{configurable:true,value:{userAgent:'Desktop',canShare:()=>true,share:async()=>{throw Object.assign(new Error('share failed'),{name:kind});}}});
      let rendered,toasts=[];downloads=0;
      await act(async()=>{rendered=create(<Panel task={active} url="https://example.com/tasks/task-1" onToast={t=>toasts.push(t)}/>);});
      try {
        assert.equal(rendered.root.findAllByType('button').length,1);
        await act(async()=>btn(rendered.root,'Share / Save Image').props.onClick());
        assert.equal(downloads,kind==='AbortError'?0:1);
        if(kind!=='AbortError') assert.deepEqual(toasts,['Downloading image']);
      } finally {await act(async()=>rendered.unmount());}
    }
  } finally {globalThis.document=oldDocument;if(oldNavigator)Object.defineProperty(globalThis,'navigator',oldNavigator);}
});

test('task title/date validation rejects blank titles and reversed or invalid calendar dates',async()=>{
  const {validateTaskDatesAndTitle}=await import('@/lib/taskValidation');
  for(const patch of [{title:' '},{start_date:'2099-02-01',end_date:'2099-01-01'},{start_date:'2099-02-30'},{end_date:'invalid'}]) assert.throws(()=>validateTaskDatesAndTitle({...active,...patch}));
  assert.doesNotThrow(()=>validateTaskDatesAndTitle(active));
});

test('queue API uses one snapshot and reports RPC failure instead of empty state',async()=>{
  const {POST:queueStatus}=await import('@/app/api/queue-status/route');
  const snapshot={waiting_count:1005,completed_count:0,queue_number:1005,people_ahead:1004,my_signups:[]};
  for(const fail of [false,true]) {
    globalThis.fetch=async(input,init)=>{
      const url=new URL(typeof input==='string'?input:input.url);
      if(url.pathname==='/rest/v1/tasks')return json({...active,task_mode:'queue'});
      assert.equal(url.pathname,'/rest/v1/rpc/queue_status_snapshot');
      assert.deepEqual(JSON.parse(init.body),{p_task_id:'task-1',p_owner_token:'owner'});
      return fail?json({message:'failed'},400):json(snapshot);
    };
    const response=await queueStatus(request({task_id:'task-1',owner_token:'owner'}));
    assert.equal(response.status,fail?400:200);
    if(!fail)assert.deepEqual(await response.json(),snapshot);
  }
});

test('large lists load every ordered page; a later page error never yields partial export data',async()=>{
  const {readAllRows}=await import('@/lib/readAllRows');
  const input=Array.from({length:1005},(_,id)=>({id}));
  const pages=[];
  const result=await readAllRows(()=>({range:async(start,end)=>{pages.push([start,end]);return {data:input.slice(start,end+1)};}}));
  assert.equal(result.length,1005);assert.equal(result[1004].id,1004);assert.equal(pages.length,3);
  await assert.rejects(readAllRows(()=>({range:async(start,end)=>start?{error:Error('offline')}:{data:input.slice(start,end+1)}})),/offline/);
});

test('native English queue states and success message contain no Chinese UI copy',async()=>{
  const {default:Confetti}=await import('@/components/ConfettiSuccess');
  store.set('relay_home_language','en');
  for(const own of [null,{id:'one',name:'Guest',created_at:new Date().toISOString(),checked_in:false},{id:'one',name:'Guest',created_at:new Date().toISOString(),checked_in:true}]) {
    globalThis.fetch=async()=>json({waiting_count:5,queue_number:own?5:0,people_ahead:own?4:0,my_signups:own?[own]:[]});
    let rendered;
    await act(async()=>{rendered=create(<QueueTaskDetailClient initialTask={{...active,task_mode:'queue'}}/>);});
    try {
      assert.ok(!/[\u3400-\u9fff]/.test(text(rendered.toJSON())),text(rendered.toJSON()));
      if(own&&!own.checked_in) {
        await act(async()=>btn(rendered.root,'Change Name').props.onClick());
        assert.ok(!/[\u3400-\u9fff]/.test(text(rendered.toJSON())));
        await act(async()=>btn(rendered.root,'Cancel').props.onClick());
        await act(async()=>btn(rendered.root,'Leave Queue').props.onClick());
        assert.ok(!/[\u3400-\u9fff]/.test(text(rendered.toJSON())));
      }
    } finally {await act(async()=>rendered.unmount());}
  }
  let confetti;
  await act(async()=>{confetti=create(<Confetti show message="Joined the queue!"/>);});
  assert.ok(!/[\u3400-\u9fff]/.test(text(confetti.toJSON())));
  await act(async()=>confetti.unmount());
  store.set('relay_home_language','zh');
});

test('queue wait duration keeps minutes/hours even beyond 24 hours',async()=>{
  const {queueWaitDuration}=await import('@/lib/queueWaitDuration');
  const start='2026-01-01T00:00:00Z',time=Date.parse(start);
  for(const [minutes,en] of [[0,'0 min'],[1,'1 min'],[59,'59 min'],[60,'1 hr 0 min'],[1501,'25 hr 1 min']]) assert.equal(queueWaitDuration(start,'en',time+minutes*60000),en);
  assert.equal(queueWaitDuration(start,'zh',time+1501*60000),'已等待 25 小時 1 分鐘');
});
