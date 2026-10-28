import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {act,create} from 'react-test-renderer';
import ThreadList from '@/components/ThreadList';
import TaskDetail from '@/components/TaskDetailClient';
import TaskListCard from '@/components/TaskListCardStable';

const store=new Map();
globalThis.localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)};
globalThis.window={localStorage,location:{search:''},addEventListener(){},removeEventListener(){},dispatchEvent(){}};
globalThis.document={documentElement:{dataset:{}},addEventListener(){},removeEventListener(){}};
globalThis.CustomEvent=class {constructor(type,init){this.type=type;this.detail=init?.detail;}};
globalThis.requestAnimationFrame=fn=>{fn();return 1;};
globalThis.cancelAnimationFrame=()=>{};
const text=node=>typeof node==='string'?node:(node?.children||[]).map(text).join('');
const first={id:'original',name:'Original first',signup_order:1,categories:['A'],created_at:'2026-10-28T08:00:00.000900Z'};
const later=Array.from({length:4},(_,i)=>({id:`late-${i}`,name:`Later ${i}`,signup_order:i+2,categories:['B'],created_at:'2026-10-28T08:00:00.000100Z'}));
// Late arriving requests carry earlier timestamps; their position in a SELECT
// is not the number assigned when the original participant joined.
const reordered=[...later,first];
function visibleNumber(root,name){
  const nameNode=root.findAllByType('span').find(n=>text(n)===name);
  assert.ok(nameNode,`Missing ${name}`);
  return text(nameNode.parent.findAllByType('span')[0]);
}

test('public signup keeps admission order after late arrivals and renaming; cancellation advances positions',async()=>{
  let rendered;
  const props={myIds:[],categories:['A','B']};
  await act(async()=>{rendered=create(<ThreadList {...props} signups={[first]}/>);});
  try {
    assert.equal(visibleNumber(rendered.root,first.name),'1');
    await act(async()=>rendered.update(<ThreadList {...props} signups={reordered}/>));
    assert.equal(visibleNumber(rendered.root,first.name),'1');
    const names=rendered.root.findAllByType('span').map(text).filter(s=>s===first.name||s.startsWith('Later '));
    assert.deepEqual(names,[first.name,...later.map(s=>s.name)]);
    await act(async()=>rendered.root.findAllByType('button').find(n=>text(n).trim().startsWith('A')).props.onClick());
    assert.equal(visibleNumber(rendered.root,first.name),'1');
    await act(async()=>rendered.update(<ThreadList {...props} signups={[{...first,name:'Renamed'},later[3]]}/>));
    assert.equal(visibleNumber(rendered.root,'Renamed'),'1');
    await act(async()=>rendered.root.findAllByType('button').find(n=>text(n).startsWith('全部')).props.onClick());
    assert.equal(visibleNumber(rendered.root,later[3].name),'2');
  } finally {await act(async()=>rendered.unmount());}
});

test('organizer card and filtered search derive positions from admission order, including filtered search',async()=>{
  const task={id:'task',title:'Number test',task_mode:'normal',categories:['A','B'],start_date:'2000-01-01',end_date:'2099-01-01'};
  let rendered;
  await act(async()=>{rendered=create(<TaskListCard task={task} signups={reordered}/>);});
  try {
    const expand=rendered.root.findAllByType('button').find(n=>text(n).includes('Number test'));
    await act(async()=>expand.props.onClick());
    assert.equal(visibleNumber(rendered.root,first.name),'1');
    const search=rendered.root.findAllByType('input').find(n=>n.props.placeholder?.includes('搜尋'));
    assert.ok(search);
    await act(async()=>search.props.onChange({target:{value:'Original'}}));
    assert.equal(visibleNumber(rendered.root,first.name),'1');
  } finally {await act(async()=>rendered.unmount());}
});

test('1505 participants keep contiguous positions across lazy loading and advance after cancellation',async()=>{
  const all=Array.from({length:1505},(_,i)=>({id:`row-${i+1}`,name:`Guest ${i+1}`,signup_order:i+1,categories:i>=1500?['Tail']:['Other'],created_at:'2026-10-28T08:00:00.000000Z'}));
  let loadMore;
  globalThis.IntersectionObserver=class {constructor(fn,options){if(options.rootMargin)loadMore=fn;} observe(){} disconnect(){}};
  let rendered;
  await act(async()=>{rendered=create(<ThreadList signups={[...all].reverse()} myIds={[]} categories={['Tail','Other']}/>,{createNodeMock:()=>({})});});
  try {
    const positions=()=>rendered.root.findAllByType('span').filter(n=>n.props['data-signup-position']).map(n=>Number(text(n)));
    assert.deepEqual(positions(),Array.from({length:30},(_,i)=>i+1));
    for(let i=0;i<3;i++) await act(async()=>{loadMore([{isIntersecting:true}]);await new Promise(resolve=>setTimeout(resolve,220));});
    assert.deepEqual(positions(),Array.from({length:120},(_,i)=>i+1));
    assert.equal(visibleNumber(rendered.root,'Guest 1'),'1');
    await act(async()=>rendered.root.findAllByType('button').find(n=>text(n).startsWith('Tail')).props.onClick());
    assert.deepEqual(positions(),[1501,1502,1503,1504,1505]);
    await act(async()=>rendered.update(<ThreadList signups={all.slice(5)} myIds={[]} categories={['Tail','Other']}/>));
    assert.deepEqual(positions(),[1496,1497,1498,1499,1500]);
  } finally {await act(async()=>rendered.unmount());delete globalThis.IntersectionObserver;}
});

test('API and CSV/TXT share one complete snapshot, using compact positions after gaps in admission order',async()=>{
  const {GET:getList}=await import('@/app/api/signups/route');
  const {GET:getExport}=await import('@/app/api/tasks/[id]/export/route');
  const {createExportTicket}=await import('@/lib/exportTicket');
  const task={id:'task-1',title:'Event',task_mode:'normal',categories:[]};
  const list=[first,{...later[3],signup_order:5}];
  let reads=0;
  const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}});
  globalThis.fetch=async(input,init={})=>{
    const url=new URL(typeof input==='string'?input:input.url);
    if(url.pathname==='/rest/v1/tasks')return json(task);
    assert.equal(url.pathname,'/rest/v1/rpc/signup_list_snapshot');
    assert.deepEqual(JSON.parse(init.body),{p_task_ids:['task-1']});
    reads++;return json(list);
  };
  const response=await getList(new Request('https://example.com/api/signups?task_id=task-1'));
  assert.equal(response.status,200);assert.equal(reads,1);assert.deepEqual((await response.json()).signups,list);
  for(const format of ['csv','txt']) {
    const ticket=createExportTicket('task-1',format,'en','test-service');
    const exported=await getExport(new Request(`https://example.com/api/tasks/task-1/export?ticket=${ticket}`),{params:{id:'task-1'}});
    assert.equal(exported.status,200);
    const content=await exported.text();
    assert.ok(content.includes(format==='csv'?'1,Original first':'1. Original first'));
    assert.ok(content.includes(format==='csv'?'2,Later 3':'2. Later 3'));
    assert.ok(!content.includes(format==='csv'?'5,Later 3':'5. Later 3'));
  }
  assert.equal(reads,3);
});

test('a slow response from a previous task cannot replace the current participant list',async()=>{
  const json=data=>new Response(JSON.stringify(data),{headers:{'Content-Type':'application/json'}});
  let resolveOld;
  globalThis.fetch=async(input)=>{
    const url=new URL(typeof input==='string'?input:input.url,'https://example.com');
    if(url.pathname==='/rest/v1/tasks') {
      const id=url.searchParams.get('id').slice(3);
      return json({id,title:id,task_mode:'normal',categories:[],start_date:'2000-01-01',end_date:'2099-01-01'});
    }
    if(url.pathname==='/api/signups') {
      if(url.searchParams.get('task_id')==='old-task')return new Promise(resolve=>{resolveOld=resolve;});
      return json({signups:[{...first,name:'Current task participant'}]});
    }
    throw Error('Unexpected request');
  };
  globalThis.testTaskId='old-task';let rendered;
  await act(async()=>{rendered=create(<TaskDetail/>);await new Promise(resolve=>setTimeout(resolve,10));});
  try {
    assert.ok(resolveOld);
    globalThis.testTaskId='new-task';
    await act(async()=>{rendered.update(<TaskDetail/>);await new Promise(resolve=>setTimeout(resolve,550));});
    assert.ok(text(rendered.toJSON()).includes('Current task participant'));
    await act(async()=>resolveOld(json({signups:[{...first,name:'Old task participant'}]})));
    assert.ok(text(rendered.toJSON()).includes('Current task participant'));
    assert.ok(!text(rendered.toJSON()).includes('Old task participant'));
  } finally {await act(async()=>rendered.unmount());delete globalThis.testTaskId;}
});

test('organizer queue position stays 1 when leaving processing mode or reopening the card',async()=>{
  const task={id:'queue-task',title:'Queue test',task_mode:'queue',categories:[],start_date:'2000-01-01',end_date:'2099-01-01'};
  const rows=[first,...later].map(s=>({...s,checked_in:false}));
  globalThis.fetch=async()=>new Response(JSON.stringify({ok:true}),{headers:{'Content-Type':'application/json'}});
  let rendered;
  await act(async()=>{rendered=create(<TaskListCard task={task} signups={rows}/>);});
  const click=async(label)=>act(async()=>{rendered.root.findAllByType('button').find(n=>text(n).trim()===label).props.onClick({stopPropagation(){}});});
  const expand=async()=>act(async()=>{rendered.root.findAllByType('button').find(n=>text(n).includes('Queue test')).props.onClick({stopPropagation(){}});});
  try {
    await expand();await click('開始處理名單');
    for(let i=0;i<4;i++)await click('完成下一位');
    assert.equal(visibleNumber(rendered.root,later[3].name),'1');
    await click('完成');
    assert.equal(visibleNumber(rendered.root,later[3].name),'1');
    await expand();await expand();
    assert.equal(visibleNumber(rendered.root,later[3].name),'1');
    await click('開始處理名單');
    assert.equal(visibleNumber(rendered.root,later[3].name),'1');
  } finally {await act(async()=>rendered.unmount());}
});
