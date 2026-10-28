import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { create, act } from "react-test-renderer";
import { mergeTaskCategories, mergeTaskNote, visibleCategories, visibleNote, noteWithBanner, toggleCategorySelection } from "@/lib/taskConfig";
import { buildShareSvg } from "@/lib/shareImage";
import { buildLocalizedFlexMessage } from "@/lib/localizedShare";
import { createExportTicket, readExportTicket } from "@/lib/exportTicket";
import { stableSupabaseFetch } from "@/lib/stableSupabaseFetch";
import { SIGNUP_FIELDS } from "@/lib/signupFields";
import { GET as getSignups } from "@/app/api/signups/route";
import { GET as getExport, POST as authorizeExport } from "@/app/api/tasks/[id]/export/route";
import EditTaskPage from "@/app/my-tasks/[id]/edit/page";
import CreateTaskPage from "@/app/(organizer)/create/page";
import OrganizerContext from "@/lib/OrganizerContext";
import OrganizerShell from "@/components/OrganizerShell";
import ProxySignupFields from "@/components/ProxySignupFields";
import ThreadList from "@/components/ThreadList";
import ActualOnboardingTour from "../components/OnboardingTour";
import { CREATE_TOUR_STEPS, SHARE_TOUR_STEPS } from "@/lib/onboardingSteps";

const single = "__relay_category_single__";
const multiple = "__relay_category_multiple__";
const task = { id: "task-1", title: "Test Event", description: "Details", creator_id: "organizer", creator_name: "Organizer", task_mode: "normal", categories: ["A", "B", single, single], start_date: "2026-10-28", end_date: "2099-10-29", note: "Visible note\n__relay_banner_url__:https://example.com/banner.png\n__relay_native_share_enabled__" };
const store = new Map();
globalThis.localStorage = globalThis.sessionStorage = { getItem: key => store.get(key) || null, setItem: (key,value) => store.set(key,value), removeItem: key => store.delete(key) };
globalThis.window = { location: { origin: "https://example.com", search: "", href: "https://example.com/create" }, addEventListener(){}, removeEventListener(){}, history:{pushState(){}}, localStorage, setTimeout, clearTimeout };
globalThis.document = { documentElement: { dataset: {} }, querySelector:()=>null, querySelectorAll:()=>[], body:{} };
globalThis.requestAnimationFrame = callback => { callback(); return 1; };
globalThis.cancelAnimationFrame = () => {};
globalThis.ResizeObserver = class { observe(){} disconnect(){} };
globalThis.testProfile = {userId:"organizer", accessToken:"organizer", displayName:"Organizer"};

const json = (data,status=200,headers={}) => new Response(JSON.stringify(data),{status,headers:{"Content-Type":"application/json",...headers}});
function fakeApi(selectedTask=task) {
  const calls=[];
  globalThis.fetch=async(input,init={})=>{
    const url=new URL(typeof input==='string'?input:input.url,"https://example.com");
    const method=init.method || 'GET';
    const headers=new Headers(init.headers);
    calls.push({url,method,body:init.body ? JSON.parse(init.body) : null});
    if(url.hostname==='api.line.me') {
      if(url.pathname.endsWith('/verify')) return url.searchParams.get('access_token')==='bad' ? json({},401) : json({client_id:'test-channel'});
      return json({userId:headers.get('authorization')==='Bearer outsider'?'outsider':'organizer'});
    }
    if(url.pathname==='/api/tasks' || url.pathname==='/api/tasks/task-1') return json({task:selectedTask});
    if(url.pathname==='/rest/v1/tasks') return json(selectedTask);
    if(url.pathname==='/rest/v1/signups') {
      if(method==='HEAD') return new Response(null,{headers:{'content-range':'0-2/3'}});
      const raw={id:'signup-1',task_id:'task-1',name:'Participant',categories:['A'],note:'Note',created_at:'2026-10-28T00:00:00.000000Z',owner_token:'private-credential'};
      const fields=url.searchParams.get('select')?.split(',')||[];
      const row=Object.fromEntries(Object.entries(raw).filter(([key])=>fields.includes(key)||fields.includes('*')));
      return json([row]);
    }
    throw new Error(`Unexpected network request: ${url.pathname}`);
  };
  return calls;
}
const text = node => typeof node==='string' ? node : (node?.children||[]).map(text).join('');
const button = (root,label) => root.findAllByType('button').find(node=>text(node)===label);

test('editing preserves duplicate Required markers and hidden note metadata',()=>{
  for(const marker of [single,multiple]) {
    const original=['A',marker,marker];
    assert.deepEqual(mergeTaskCategories(['B'],original),['B',marker,marker]);
    assert.deepEqual(mergeTaskCategories([],original),[]);
  }
  assert.equal(visibleNote(task.note),'Visible note');
  assert.deepEqual(visibleCategories(task.categories),['A','B']);
  assert.equal(mergeTaskNote('Changed',task.note),task.note.replace('Visible note','Changed'));
  assert.ok(!noteWithBanner(task.note,'').includes('__relay_banner_url__'));
  assert.deepEqual(toggleCategorySelection(['A'],'B','single'),['B']);
  assert.deepEqual(toggleCategorySelection(['A'],'B','multiple'),['A','B']);
});

test('zh/en image and Flex retain metadata filtering, QR URL language and single-line dates',async()=>{
  for(const language of ['en','zh']) {
    store.set('relay_home_language',language);
    const url=`https://example.com/tasks/task-1?lang=${language}`;
    const svg=await buildShareSvg(task,url,3,language);
    assert.ok(!svg.includes('__relay_'));
    if(language==='en') assert.ok(!/[\u3400-\u9fff]/.test(svg));
    else assert.ok(svg.includes('接龍報名小助手'));
    const flex=buildLocalizedFlexMessage(task,url);
    const date=flex.contents.body.contents.find(item=>item.type==='text'&&item.text.startsWith('🗓'));
    assert.equal(date.wrap,false);assert.equal(date.maxLines,1);assert.equal(date.adjustMode,'shrink-to-fit');
    if(language==='en') assert.ok(flex.contents.footer.contents.every(item=>new URL(item.action.uri).searchParams.get('lang')==='en'));
    assert.ok(!JSON.stringify(flex).includes('__relay_'));
  }
});

test('ordering adds id tie-breaker once and preserves existing explicit order',async()=>{
  let captured;
  globalThis.fetch=async(input)=>{captured=String(input);return json([]);};
  await stableSupabaseFetch('https://test.supabase.co/rest/v1/signups?order=created_at.asc');
  assert.equal(new URL(captured).searchParams.get('order'),'created_at.asc,id.asc');
  await stableSupabaseFetch(captured);
  assert.equal(new URL(captured).searchParams.get('order'),'created_at.asc,id.asc');
});

test('list API keeps credentials private and rejects anonymous/other-organizer queue access',async()=>{
  fakeApi();
  let response=await getSignups(new Request('https://example.com/api/signups?task_id=task-1'));
  assert.equal(response.status,200); assert.ok(!JSON.stringify(await response.json()).includes('private-credential'));
  assert.ok(!SIGNUP_FIELDS.includes('owner_token'));
  fakeApi({...task,task_mode:'queue'});
  for(const token of [null,'outsider','bad']) {
    response=await getSignups(new Request('https://example.com/api/signups?task_id=task-1',{headers:token?{Authorization:`Bearer ${token}`}:{}}));
    assert.equal(response.status,403);
  }
  response=await getSignups(new Request('https://example.com/api/signups?task_id=task-1',{headers:{Authorization:'Bearer organizer'}}));
  assert.equal(response.status,200);
  response=await getSignups(new Request('https://example.com/api/signups?task_id=task-1&count=1'));
  assert.deepEqual(await response.json(),{count:3});
});

test('export requires ownership; signed links are task-scoped, tamper-proof and expire',async()=>{
  const ticket=createExportTicket('task-1','csv','en','test-service',1000);
  assert.equal(readExportTicket(ticket,'task-1','test-service',2000).language,'en');
  for(const [token,id,key,now] of [[ticket,'task-2','test-service',2000],[ticket+'x','task-1','test-service',2000],[ticket,'task-1','other',2000],[ticket,'task-1','test-service',122000]]) assert.equal(readExportTicket(token,id,key,now),null);
  fakeApi();
  const params={params:{id:'task-1'}};
  assert.equal((await getExport(new Request('https://example.com/api/tasks/task-1/export'),params)).status,403);
  const authorize=token=>authorizeExport(new Request('https://example.com/api/tasks/task-1/export',{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({format:'csv',language:'en'})}),params);
  assert.equal((await authorize('outsider')).status,403);
  const response=await authorize('organizer');assert.equal(response.status,200);
  const {url}=await response.json();
  const exported=await getExport(new Request('https://example.com'+url),params);
  assert.equal(exported.status,200);
  assert.ok((await exported.text()).includes('No.,Name,Category,Notes,Signup time'));
});

test('native Edit form never exposes markers and preserves Required/banner when saving',async()=>{
  store.set('relay_home_language','zh'); const calls=fakeApi();let rendered;
  await act(async()=>{rendered=create(<EditTaskPage/>); await new Promise(resolve=>setTimeout(resolve,10));});
  assert.ok(!JSON.stringify(rendered.toJSON()).includes('__relay_'));
  const input=rendered.root.findAllByType('input').find(node=>node.props.value==='Test Event');
  await act(async()=>input.props.onChange({target:{value:'Renamed'}}));
  await act(async()=>button(rendered.root,'儲存變更').props.onClick());
  const saved=calls.find(call=>call.url.pathname==='/api/tasks/task-1').body;
  assert.deepEqual(saved.categories,task.categories);assert.equal(saved.note,task.note);
  await act(async()=>rendered.unmount());
});

test('native Create form submits Single + Required without fetch interception',async()=>{
  store.set('relay_home_language','zh');const calls=fakeApi();const fetchBefore=globalThis.fetch;let rendered;
  await act(async()=>{rendered=create(<OrganizerContext.Provider value={testProfile}><CreateTaskPage/></OrganizerContext.Provider>);});
  const change=async(node,value)=>act(async()=>node.props.onChange({target:{value}}));
  await change(rendered.root.findByProps({placeholder:'例如：週日爬山健行、週五團購水果'}),'New Task');
  await act(async()=>rendered.root.findByProps({'data-tour':'advanced'}).findAllByType('button')[0].props.onClick());
  await change(rendered.root.findByProps({placeholder:'自訂類別，例如：早上場'}),'A');
  await act(async()=>button(rendered.root,'新增').props.onClick());
  await act(async()=>button(rendered.root,'單選').props.onClick());
  await act(async()=>button(rendered.root,'必須選').props.onClick());
  await act(async()=>button(rendered.root,'儲存任務').props.onClick());
  assert.equal(globalThis.fetch,fetchBefore);
  assert.deepEqual(calls.find(call=>call.url.pathname==='/api/tasks').body.categories,['A',single,single]);
  await act(async()=>rendered.unmount());
});

test('English organizer sign-in and native proxy selection work without Chinese DOM selectors',async()=>{
  store.set('relay_home_language','en');testProfile=null;let rendered;
  await act(async()=>{rendered=create(<OrganizerShell/>);});
  assert.ok(text(rendered.toJSON()).includes('Sign in with LINE before creating a task'));
  assert.ok(!text(rendered.toJSON()).includes('建立任務前'));
  await act(async()=>rendered.unmount());testProfile={userId:'organizer',accessToken:'organizer'};
  let entries=[{name:'Guest',categories:['A']}];
  await act(async()=>{rendered=create(<ProxySignupFields categories={['A','B']} entries={entries} mode="single" required onChange={value=>{entries=value;}}/>);});
  await act(async()=>button(rendered.root,'B').props.onClick());
  assert.deepEqual(entries[0].categories,['B']);
  assert.ok(!/[\u3400-\u9fff]/.test(text(rendered.toJSON())));
  await act(async()=>rendered.unmount());
});

test('editing a signup keeps Single selection and blocks an empty Required category',async()=>{
  let saved,rendered;
  const signup={id:'one',name:'Participant',categories:['A'],created_at:'2026-10-28T00:00:00Z'};
  await act(async()=>{rendered=create(<ThreadList signups={[signup]} myIds={['one']} categories={['A','B']} categoryMode="single" categoryRequired onUpdate={async(id,value)=>{saved=value;}}/>);});
  await act(async()=>rendered.root.findAllByType('button').find(node=>text(node).trim()==='編輯').props.onClick());
  await act(async()=>button(rendered.root,'B').props.onClick());
  await act(async()=>button(rendered.root,'儲存').props.onClick());
  assert.deepEqual(saved.categories,['B']);
  await act(async()=>rendered.root.findAllByType('button').find(node=>text(node).trim()==='編輯').props.onClick());
  await act(async()=>button(rendered.root,'A').props.onClick());
  assert.equal(button(rendered.root,'儲存').props.disabled,true);
  await act(async()=>rendered.unmount());
});

test('all eight create tutorial steps and the share tutorial render complete native zh/en copy',async()=>{
  const originalDocument=globalThis.document;
  const target={parentElement:null,getBoundingClientRect:()=>({top:150,left:20,width:340,height:80,bottom:230})};
  globalThis.document={...originalDocument,querySelector:()=>target,addEventListener(){},removeEventListener(){}};
  window.innerHeight=900;
  try {
    for(const steps of [CREATE_TOUR_STEPS,SHARE_TOUR_STEPS]) for(const language of ['en','zh']) {
      // An incoming share link must override a different saved language.
      store.set('relay_home_language',language==='en'?'zh':'en');
      window.location.search=`?lang=${language}`;
      let rendered,finished=0,skipped=0;
      const finishLabel={zh:'知道了，開始填寫',en:'Got it, Start Filling'};
      await act(async()=>{rendered=create(<ActualOnboardingTour steps={steps} finishLabel={finishLabel} onFinish={()=>finished++} onSkip={()=>skipped++}/>);});
      for(let i=0;i<steps.length;i++) {
        const output=text(rendered.toJSON());
        assert.ok(output.includes(steps[i].title[language]));
        assert.ok(output.includes(steps[i].text[language]));
        if(language==='en') assert.ok(!/[\u3400-\u9fff]/.test(output),`Chinese leaked in step ${i+1}`);
        assert.equal(rendered.root.findByProps({'data-onboarding-tour':'true'}).props['data-no-auto-i18n'],'true');
        if(i===0) await act(async()=>button(rendered.root,language==='en'?'Skip Tutorial':'略過教學').props.onClick());
        await act(async()=>button(rendered.root,i===steps.length-1?finishLabel[language]:language==='en'?'Next':'下一步').props.onClick());
      }
      assert.equal(finished,1);assert.equal(skipped,1);
      await act(async()=>rendered.unmount());
    }
  } finally { globalThis.document=originalDocument;window.location.search=''; }
});
