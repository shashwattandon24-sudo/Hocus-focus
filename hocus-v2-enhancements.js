
/* Hocus Focus 2.0: offline-first planning, focus and task editing. */
let hfTab='today',hfSearch='',hfFilter='all',hfEditing=null,hfFocusTask=null,hfFocusSeconds=1500,hfFocusEnd=0,hfFocusRunning=false,hfFocusPreset=25,hfPlanDate='',hfFocusTicker=null;
const hfToday=()=>{let d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const hfDate=d=>{let x=new Date(d);return x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0')};
const hfOpen=()=>S.items.filter(i=>!i.done);
const hfIsDue=i=>i.due?hfDate(i.due)<=hfToday():false;
const hfPriority=i=>i.priority==='high'?0:i.priority==='low'?2:1;
const hfSorted=a=>a.slice().sort((x,y)=>(hfPriority(x)-hfPriority(y))||(x.due&&y.due?new Date(x.due)-new Date(y.due):x.due?-1:y.due?1:new Date(x.createdAt)-new Date(y.createdAt)));
const hfDay=i=>i.planDate||(i.due?hfDate(i.due):'');
const hfWhen=i=>i.due?formatWhen(i.due,!!i.hasTime):i.planDate?(i.planDate===hfToday()?'Today':i.planDate):'Anytime';
const hfStats=()=>{try{return JSON.parse(localStorage.getItem('hf_focus_history')||'[]')}catch(e){return []}};
const hfSave=()=>{store.set('items',S.items);arm();render()};
if(!localStorage.getItem('hf_v2_ready')){S.settings.instant=false;store.set('settings',S.settings);localStorage.setItem('hf_v2_ready','1')}

const hfCSS=[
'.hp{padding:calc(env(safe-area-inset-top) + 18px) 20px 120px;min-height:100%;}',
'.hh{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:19px;}',
'.hbrand{font:600 17px Quicksand,system-ui,sans-serif;letter-spacing:-.6px}.hbrand b{color:#FFB51F}',
'.hsub{color:#888A98;font-size:12px}.h1{font:600 31px/1.12 Quicksand,system-ui,sans-serif;letter-spacing:-1.4px;margin:0 0 8px!important}',
'.hmuted{color:#9496A3;font-size:13px;line-height:1.45}.hsec{display:flex;justify-content:space-between;align-items:center;margin:22px 0 10px}',
'.hsec strong{font:600 16px Quicksand,system-ui,sans-serif}.hsec small{color:#9293A1;font-size:12px}',
'.hhero{background:#FFB51F;color:#18130B;padding:20px;border-radius:25px;margin-top:16px;box-shadow:0 10px 30px rgba(255,181,31,.12)}',
'.hhero small{font-size:12px;opacity:.7;font-weight:700;letter-spacing:.5px}.hhero strong{display:block;font:600 24px/1.2 Quicksand,system-ui,sans-serif;margin:10px 0 8px;word-break:break-word}',
'.hhero p{font-size:13px;opacity:.72;margin-bottom:13px!important}.hhero .hheroActions{display:flex;gap:10px}',
'.hhero button{background:#15161B!important;color:#FFC849!important;border-radius:999px;padding:11px 14px!important;font-size:13px!important;font-weight:800!important}',
'.hhero button.hlight{background:#FFF2C8!important;color:#191713!important}',
'.hcard{background:#191A22;border:1px solid #282A34;border-radius:19px;padding:14px;margin-bottom:9px}',
'.htask{display:flex;align-items:flex-start;gap:10px}.hcheck{width:27px;height:27px;border:1.5px solid #535460!important;border-radius:50%;flex-shrink:0;font-size:15px!important;color:#FFB51F!important;display:grid;place-items:center}',
'.hcheck.done{border-color:#FFB51F!important;background:#FFB51F!important;color:#16171B!important}',
'.hmain{flex:1;min-width:0;text-align:left!important}.hmain b{display:block;font-size:15px;font-weight:700;line-height:1.3;overflow-wrap:anywhere}',
'.hmain small{display:block;margin-top:5px;font-size:11px;color:#9394A1;line-height:1.35}.hstar{font-size:19px!important;color:#565762!important;min-width:24px}',
'.hstar.on{color:#FFB51F!important}.hchips{display:flex;flex-wrap:wrap;gap:6px}.hchip{display:inline-block;background:#262832;color:#E4E4EA;border-radius:100px;font-size:11px;padding:6px 10px}',
'.hchip.am{background:#3B2C10;color:#FFC96E}.hchip.red{background:#381C20;color:#FF9B99}.hchip.green{background:#153527;color:#88DBAA}',
'.hquick{display:flex;align-items:center;background:#1B1C24;border:1px solid #3A3B46;border-radius:18px;padding:5px 5px 5px 14px;gap:6px;margin-top:15px}',
'.hquick input{background:transparent;color:#fff;border:0;outline:0;flex:1;width:0;min-width:0;font:15px Nunito,sans-serif;padding:9px 0}',
'.hquick button,.hprimary{background:#FFB51F!important;color:#1A1204!important;border-radius:14px!important;padding:12px 15px!important;font-size:15px!important;font-weight:900!important}',
'.hempty{text-align:center;padding:24px 16px;background:#181920;border:1px dashed #383943;border-radius:19px;color:#9698A3;font-size:13px;line-height:1.6}',
'.hn{position:absolute;left:10px;right:10px;bottom:calc(env(safe-area-inset-bottom) + 12px);padding:7px 3px;background:#1A1B23;border:1px solid #2C2D38;border-radius:23px;display:grid;grid-template-columns:1fr 1fr 1.15fr 1fr 1fr;gap:0;z-index:3;box-shadow:0 9px 30px rgba(0,0,0,.5)}',
'.hn button{color:#989AA5!important;font-size:11px!important;display:flex;align-items:center;gap:4px;flex-direction:column;padding:4px 0!important}',
'.hn button b{font-size:21px;font-weight:500;line-height:1}.hn button.sel{color:#FFB51F!important}',
'.hn .hmic{background:#FFB51F!important;color:#18120C!important;border-radius:16px;margin:0 3px;font-size:12px!important}',
'.hbar{height:8px;border-radius:99px;background:#30313D;margin:12px 0 9px;overflow:hidden}.hbar span{height:100%;display:block;background:#FFB51F;border-radius:99px}',
'.hrow{display:flex;align-items:center;gap:9px}.hrow>*{flex:1;min-width:0}',
'.hfield{display:block;color:#A5A6B2;font-size:12px;margin:10px 0 5px}',
'.hin,.hsel,.hta{width:100%;background:#20212A;border:1px solid #393A46;border-radius:13px;color:#F7F7FA;padding:12px;font:14px Nunito,system-ui,sans-serif;outline:0;color-scheme:dark}',
'.hta{min-height:66px;resize:vertical}.hmodal{position:absolute;inset:0;z-index:16;background:rgba(0,0,0,.75);display:flex;align-items:flex-end}',
'.hmodalBox{background:#171820;border-radius:28px 28px 0 0;padding:15px 20px calc(env(safe-area-inset-bottom) + 22px);max-height:92%;width:100%;overflow-y:auto;border-top:1px solid #3A3B43}',
'.hmodalTitle{font:600 23px Quicksand,system-ui,sans-serif;margin-bottom:15px}.hbtn2{padding:12px!important;border-radius:13px!important;background:#282A36!important;color:#F4F4F5!important;font-size:13px!important}',
'.hbtnDanger{color:#FF8B83!important}.hfilter{display:flex;gap:7px;overflow:auto;padding:2px 0 12px;scrollbar-width:none}',
'.hfilter button{padding:8px 12px!important;border-radius:100px;background:#21232C!important;color:#9C9EAA!important;white-space:nowrap;font-size:12px!important}',
'.hfilter button.sel{background:#FFB51F!important;color:#191612!important}',
'.hfocusRing{width:228px;height:228px;display:flex;align-items:center;justify-content:center;flex-direction:column;margin:30px auto 21px;border-radius:50%;border:9px solid #F7B526;box-shadow:0 0 0 15px #26251D,0 0 50px rgba(255,181,31,.09)}',
'.hfocusRing strong{font:600 52px Quicksand,system-ui,sans-serif;letter-spacing:-2px}.hfocusRing small{color:#B9B8B1;font-size:12px}',
'.hchoices{display:flex;flex-wrap:wrap;justify-content:center;gap:8px}.hchoices button{background:#252630!important;border-radius:50px;padding:9px 14px!important;font-size:13px!important;color:#D3D3DD!important}',
'.hchoices button.sel{background:#FFB51F!important;color:#241800!important}',
'.hstatGrid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.hstatBox{background:#1B1C24;border:1px solid #2F303A;padding:17px;border-radius:18px}',
'.hstatBox b{font:600 27px Quicksand,system-ui,sans-serif;color:#FFB51F;display:block}.hstatBox small{color:#9FA0AC}',
'.hday{display:grid;grid-template-columns:repeat(7,1fr);gap:5px;align-items:end;height:92px;margin-top:10px}.hday div{background:#242630;border-radius:7px 7px 3px 3px;min-height:7px}',
'.hday div.on{background:#FFB51F}.hdaylegend{display:grid;grid-template-columns:repeat(7,1fr);gap:5px;text-align:center;font-size:10px;color:#9495A3;margin-top:5px}',
'.hsubstep{display:flex;align-items:center;gap:8px;margin:6px 0;font-size:14px}.hsubstep input{accent-color:#FFB51F}',
'.hsmallBtn{font-size:12px!important;color:#FFB51F!important;padding:6px!important}',
'.hlink{color:#FFC15E!important;font-weight:700!important;font-size:13px!important}'
].join('');
const hfStyle=document.createElement('style');hfStyle.id='hocus-v2';hfStyle.textContent=hfCSS;document.head.appendChild(hfStyle);
const hfIcon=(name)=>({today:'⌂',inbox:'☰',plan:'▦',focus:'◉',more:'◷'})[name]||'•';
const hfNav=()=>'<div class="hn">'+['today','inbox','voice','plan','focus'].map(t=>t==='voice'?'<button class="hmic" data-a="capture" aria-label="Capture with microphone"><b>🎙</b>Voice</button>':'<button data-a="hfTab" data-tab="'+t+'" class="'+(hfTab===t?'sel':'')+'"><b>'+hfIcon(t)+'</b>'+t.charAt(0).toUpperCase()+t.slice(1)+'</button>').join('')+'</div>';
const hfHead=()=>'<div class="hh"><div><span class="hbrand">hocus <b>focus.</b></span><div class="hsub">Your brain, minus the noise</div></div><button data-a="hfTab" data-tab="more" style="color:#FFB51F;font-size:13px;font-weight:800">Insights ⚙</button></div>';
const hfQuick=()=>'<div class="hquick"><input id="hfQuick" placeholder="Write it. Get it out of your head." aria-label="Quick-add a task" autocomplete="off"><button data-a="hfAdd" aria-label="Add task">＋</button></div>';
const hfRow=(i)=>'<div class="hcard htask"><button class="hcheck'+(i.done?' done':'')+'" data-a="'+(i.done?'hfReopen':'done')+'" data-id="'+esc(i.id)+'" aria-label="Mark complete">'+(i.done?'✓':'')+'</button><button class="hmain" data-a="hfEdit" data-id="'+esc(i.id)+'"><b style="'+(i.done?'opacity:.55;text-decoration:line-through':'')+'">'+esc(i.title)+'</b><small>'+esc(hfWhen(i))+(i.project?' · '+esc(i.project):'')+(i.repeat?' · ↻ '+esc(i.repeat):'')+(i.steps?.length?' · '+i.steps.filter(s=>s.done).length+'/'+i.steps.length+' steps':'')+'</small></button><button class="hstar '+(i.priority==='high'?'on':'')+'" data-a="hfStar" data-id="'+esc(i.id)+'" title="Priority" aria-label="Toggle priority">★</button></div>';
const hfTodayPanel=()=>{
const today=hfToday(),open=hfOpen(),due=hfSorted(open.filter(i=>hfIsDue(i)||i.planDate===today)),top=hfSorted(due.length?due:open).slice(0,3),lead=top[0],done=S.items.filter(i=>i.done&&i.doneAt&&hfDate(i.doneAt)===today).length,total=done+due.length;
return '<h1 class="h1">One thing<br><span class="am">at a time.</span></h1><p class="hmuted">'+esc(S.profile.name)+', this is your space. No giant to-do list.</p>'
+(lead?'<div class="hhero"><small>YOUR NEXT MOVE</small><strong>'+esc(lead.title)+'</strong><p>'+(lead.priority==='high'?'★ High priority · ':'')+esc(hfWhen(lead))+'</p><div class="hheroActions"><button data-a="hfStartTask" data-id="'+esc(lead.id)+'">▶ Focus on this</button><button class="hlight" data-a="done" data-id="'+esc(lead.id)+'">✓ Done</button></div></div>':'<div class="hhero"><small>ALL CLEAR</small><strong>Start with a tiny step.</strong><p>Capture anything on your mind below.</p></div>')
+hfQuick()+'<div class="hsec"><strong>Your top three</strong><small>Only 3 at a time</small></div>'+(top.length?top.map(hfRow).join(''):'<div class="hempty">Nothing pending. Add one small task to begin.</div>')
+'<div class="hsec"><strong>Today at a glance</strong><small>'+done+' completed</small></div><div class="hcard"><div class="hrow"><span class="hmuted">Progress today</span><strong style="text-align:right;color:#FFB51F">'+done+'/'+Math.max(total,done)+'</strong></div><div class="hbar"><span style="width:'+(total?Math.round(done/total*100):0)+'%"></span></div><button class="hlink" data-a="hfTab" data-tab="plan">View your schedule →</button></div>'
};
const hfInboxPanel=()=>{
const open=hfOpen().filter(i=>(hfFilter==='all'||i.type===hfFilter)&&(i.title+' '+(i.project||'')).toLowerCase().includes(hfSearch.toLowerCase()));
return '<h1 class="h1">Brain <span class="am">dump.</span></h1><p class="hmuted">Everything captured. Search, edit, or prioritize.</p>'+hfQuick()
+'<input class="hin" id="hfSearch" style="margin:13px 0" value="'+esc(hfSearch)+'" placeholder="⌕ Search everything" aria-label="Search tasks">'
+'<div class="hfilter">'+['all','task','reminder','event','shopping','idea','note','waiting'].map(t=>'<button data-a="hfFilter" data-type="'+t+'" class="'+(hfFilter===t?'sel':'')+'">'+(t==='all'?'All':t.charAt(0).toUpperCase()+t.slice(1))+'</button>').join('')+'</div>'
+'<div class="hsec"><strong>'+open.length+' open</strong><button class="hlink" data-a="hfShowDone">View completed</button></div>'
+(open.length?hfSorted(open).map(hfRow).join(''):'<div class="hempty">Nothing matches. Add a task or change the filter.</div>')
};
const hfPlanPanel=()=>{
const d=hfPlanDate||hfToday(),items=hfSorted(hfOpen().filter(i=>hfDay(i)===d)),overdue=hfSorted(hfOpen().filter(i=>i.due&&hfDate(i.due)<hfToday()&&hfDay(i)!==d));
const later=hfSorted(hfOpen().filter(i=>hfDay(i)>d)).slice(0,12);
return '<h1 class="h1">Make room for <span class="am">today.</span></h1><p class="hmuted">Move work to the right day. Nothing disappears.</p>'
+'<label class="hfield" for="hfPlanDate">Choose a day</label><input class="hin" type="date" id="hfPlanDate" value="'+d+'"><div class="hchoices" style="margin:12px 0 6px"><button data-a="hfPlanDay" data-days="0">Today</button><button data-a="hfPlanDay" data-days="1">Tomorrow</button><button data-a="hfPlanDay" data-days="7">Next week</button></div>'
+'<div class="hsec"><strong>On this day</strong><small>'+items.length+' tasks</small></div>'
+(items.length?items.map(hfRow).join(''):'<div class="hempty">No tasks planned for this day. Add one from Inbox by editing its date.</div>')
+(overdue.length?'<div class="hsec"><strong style="color:#FF9F96">Overdue</strong><small>Move or complete</small></div>'+overdue.map(hfRow).join(''):'')
+(later.length?'<div class="hsec"><strong>Coming up</strong></div>'+later.map(hfRow).join(''):'')
};
const hfFocusPanel=()=>{
let options=hfSorted(hfOpen().filter(i=>['task','reminder','event'].includes(i.type)));
return '<h1 class="h1">Just <span class="am">begin.</span></h1><p class="hmuted">No multitasking. One task, one timer.</p>'
+'<div class="hfocusRing"><strong id="hfClock">'+hfClock()+'</strong><small id="hfClockLabel">'+(hfFocusRunning?'Focusing':'Ready when you are')+'</small></div>'
+'<div class="hchoices">'+[5,15,25,45].map(n=>'<button class="'+(hfFocusPreset===n?'sel':'')+'" data-a="hfPreset" data-min="'+n+'">'+n+' min</button>').join('')+'</div>'
+'<label class="hfield" for="hfFocusTask">What are you working on?</label><select class="hsel" id="hfFocusTask"><option value="">Just focusing</option>'+options.map(i=>'<option value="'+esc(i.id)+'" '+(hfFocusTask===i.id?'selected':'')+'>'+esc(i.title)+'</option>').join('')+'</select>'
+'<div class="hrow" style="margin-top:16px"><button class="hprimary" data-a="hfToggleFocus">'+(hfFocusRunning?'Pause':'▶ Start focus')+'</button><button class="hbtn2" data-a="hfResetFocus">Reset</button></div>'
+'<p class="hmuted" style="text-align:center;margin-top:20px">When the timer ends, your focus session is logged automatically.</p>'
};
const hfMorePanel=()=>{
const done=S.items.filter(i=>i.done).length,total=S.items.length,history=hfStats(),minutes=history.reduce((n,i)=>n+(i.minutes||0),0),days=Array.from({length:7},(_,x)=>{const d=new Date();d.setDate(d.getDate()-6+x);return hfDate(d)}),
counts=days.map(day=>S.items.filter(i=>i.doneAt&&hfDate(i.doneAt)===day).length);
return '<h1 class="h1">Small steps.<br><span class="am">Real progress.</span></h1><p class="hmuted">Trends, not guilt. Every completed task counts.</p>'
+'<div class="hstatGrid" style="margin-top:20px"><div class="hstatBox"><b>'+done+'</b><small>Tasks completed</small></div><div class="hstatBox"><b>'+total+'</b><small>Thoughts captured</small></div><div class="hstatBox"><b>'+history.length+'</b><small>Focus sessions</small></div><div class="hstatBox"><b>'+minutes+'</b><small>Minutes focused</small></div></div>'
+'<div class="hsec"><strong>Last seven days</strong></div><div class="hcard"><div class="hday">'+counts.map(n=>'<div class="'+(n?'on':'')+'" style="height:'+Math.max(7,Math.min(100,n*24))+'%"></div>').join('')+'</div><div class="hdaylegend">'+days.map(d=>'<span>'+new Date(d+'T12:00:00').toLocaleDateString('en',{weekday:'short'}).slice(0,1)+'</span>').join('')+'</div><p class="hmuted" style="margin-top:12px!important">Completed tasks each day</p></div>'
+'<div class="hsec"><strong>Tools</strong></div><div class="hcard"><button class="hlink" data-a="hfBackup">Backup or restore my tasks →</button></div><div class="hcard"><button class="hlink" data-a="profile">Voice, notifications and profile settings →</button></div>'
+'<p class="hmuted" style="margin-top:14px">Your data stays on this device unless you copy a backup. No account required.</p>'
};
function vEnhanced(){return '<div class="sc"><div class="hp">'+hfHead()+(hfTab==='today'?hfTodayPanel():hfTab==='inbox'?hfInboxPanel():hfTab==='plan'?hfPlanPanel():hfTab==='focus'?hfFocusPanel():hfMorePanel())+'</div></div>'+hfNav()}
function hfClock(){const m=Math.floor(Math.max(0,hfFocusSeconds)/60),s=Math.max(0,hfFocusSeconds)%60;return String(m).padStart(2,'0')+':'+String(s).padStart(2,'0')}
function hfTick(){
if(hfFocusRunning){hfFocusSeconds=Math.max(0,Math.ceil((hfFocusEnd-Date.now())/1000));if(hfFocusSeconds===0){
hfFocusRunning=false;let h=hfStats();h.push({at:new Date().toISOString(),minutes:hfFocusPreset,taskId:hfFocusTask||null});localStorage.setItem('hf_focus_history',JSON.stringify(h.slice(-1000)));
try{if(window.HFNative)window.HFNative.notifyNow('Focus complete','Good work. Take a short break.')}catch(e){}
toast('Focus session complete. Take a break!');buzz([50,80,50]);if(hfTab==='focus')render();
}}
const d=document.getElementById('hfClock');if(d)d.textContent=hfClock();const l=document.getElementById('hfClockLabel');if(l)l.textContent=hfFocusRunning?'Focusing':(hfFocusSeconds===hfFocusPreset*60?'Ready when you are':'Paused');
}
hfFocusTicker=setInterval(hfTick,1000);
function hfAdd(){const el=document.getElementById('hfQuick');if(!el)return;let raw=el.value.trim();if(!raw)return;let it=parseCapture(raw);if(!it.length)it=[{id:uid(),title:raw,type:'task',due:null,hasTime:false,done:false,createdAt:new Date().toISOString()}];S.items.unshift(...it);hfSave();buzz(14);toast('Captured '+it.length+' task'+(it.length===1?'':'s'))}
function hfModal(html){document.getElementById('hfModal')?.remove();app.insertAdjacentHTML('beforeend','<div class="hmodal" id="hfModal"><div class="hmodalBox">'+html+'</div></div>')}
function hfClose(){document.getElementById('hfModal')?.remove();hfEditing=null}
function hfEdit(id){
let i=S.items.find(x=>x.id===id);if(!i)return;hfEditing=id;
let dt=i.due?new Date(i.due):null,date=i.planDate||(dt?hfDate(dt):''),time=dt&&i.hasTime?String(dt.getHours()).padStart(2,'0')+':'+String(dt.getMinutes()).padStart(2,'0'):'';
hfModal('<div class="hrow"><span class="hmodalTitle">Edit task</span><button class="hbtn2" data-a="hfClose" style="flex:0 0 auto">✕</button></div>'
+'<label class="hfield" for="hfTitle">Task</label><input class="hin" id="hfTitle" value="'+esc(i.title)+'">'
+'<div class="hrow"><div><label class="hfield" for="hfType">Type</label><select class="hsel" id="hfType">'+TYPES.map(t=>'<option value="'+t+'" '+(t===i.type?'selected':'')+'>'+t.charAt(0).toUpperCase()+t.slice(1)+'</option>').join('')+'</select></div>'
+'<div><label class="hfield" for="hfPriority">Priority</label><select class="hsel" id="hfPriority">'+['normal','high','low'].map(t=>'<option value="'+t+'" '+(t===(i.priority||'normal')?'selected':'')+'>'+t.charAt(0).toUpperCase()+t.slice(1)+'</option>').join('')+'</select></div></div>'
+'<div class="hrow"><div><label class="hfield" for="hfDate">Planned date</label><input type="date" class="hin" id="hfDate" value="'+esc(date)+'"></div><div><label class="hfield" for="hfTime">Reminder time</label><input type="time" class="hin" id="hfTime" value="'+esc(time)+'"></div></div>'
+'<div class="hrow"><div><label class="hfield" for="hfRepeat">Repeat</label><select class="hsel" id="hfRepeat">'+['none','daily','weekdays','weekly','monthly'].map(t=>'<option value="'+t+'" '+(t===(i.repeat||'none')?'selected':'')+'>'+t.charAt(0).toUpperCase()+t.slice(1)+'</option>').join('')+'</select></div><div><label class="hfield" for="hfProject">Project / area</label><input class="hin" id="hfProject" placeholder="Work, Health…" value="'+esc(i.project||'')+'"></div></div>'
+'<label class="hfield" for="hfNotes">Notes</label><textarea id="hfNotes" class="hta" placeholder="Extra details, links, first steps…">'+esc(i.notes||'')+'</textarea>'
+'<label class="hfield">Break it into tiny steps</label><div id="hfSteps">'+(i.steps||[]).map((s,j)=>'<div class="hsubstep"><input type="checkbox" '+(s.done?'checked':'')+' data-sub="'+j+'"><input class="hin" style="padding:8px" data-subtext="'+j+'" value="'+esc(s.title)+'"><button data-a="hfRemoveStep" data-index="'+j+'">✕</button></div>').join('')+'</div>'
+'<div class="hrow"><input class="hin" id="hfNewStep" placeholder="Add a small step"><button class="hbtn2" style="flex:0 0 auto" data-a="hfAddStep">＋</button></div>'
+'<div class="hrow" style="margin-top:18px"><button class="hprimary" data-a="hfSaveTask">Save changes</button><button class="hbtn2 hbtnDanger" data-a="hfDeleteTask">Delete</button></div>'
+(i.done?'<button class="hsmallBtn" data-a="hfReopen" data-id="'+esc(i.id)+'">Reopen completed task</button>':'')
);
}
function hfSyncSteps(){
let i=S.items.find(x=>x.id===hfEditing);if(!i)return;
const wrap=document.getElementById('hfSteps');if(!wrap)return;
i.steps=Array.from(wrap.querySelectorAll('[data-subtext]')).map((el,j)=>({title:el.value.trim(),done:wrap.querySelector('[data-sub="'+j+'"]')?.checked||false})).filter(s=>s.title);
}
function hfSaveTask(){
let i=S.items.find(x=>x.id===hfEditing);if(!i)return;
const get=id=>document.getElementById(id)?.value||'';
const title=get('hfTitle').trim();if(!title){toast('Task needs a title');return}
i.title=title;i.type=get('hfType');i.priority=get('hfPriority');i.repeat=get('hfRepeat')==='none'?'':get('hfRepeat');i.project=get('hfProject').trim();i.notes=get('hfNotes').trim();
i.planDate=get('hfDate')||null;let date=get('hfDate'),time=get('hfTime');i.due=date?new Date(date+'T'+(time||'09:00')+':00').toISOString():null;i.hasTime=!!(date&&time);
hfSyncSteps();hfClose();hfSave();toast('Updated')}
function hfNextRepeat(it){
if(!it.repeat)return;
let base=it.due?new Date(it.due):new Date();
if(base.getTime()<Date.now())base=new Date();
if(it.repeat==='daily')base.setDate(base.getDate()+1);
if(it.repeat==='weekdays'){do{base.setDate(base.getDate()+1)}while([0,6].includes(base.getDay()))}
if(it.repeat==='weekly')base.setDate(base.getDate()+7);
if(it.repeat==='monthly')base.setMonth(base.getMonth()+1);
let next={...it,id:uid(),done:false,doneAt:null,snoozedUntil:null,steps:(it.steps||[]).map(s=>({...s,done:false})),createdAt:new Date().toISOString(),due:base.toISOString(),planDate:hfDate(base)};
S.items.unshift(next)}
function hfBackup(){
const payload=JSON.stringify({version:2,exportedAt:new Date().toISOString(),profile:S.profile,items:S.items,settings:S.settings,wins:S.wins,focusHistory:hfStats()});
hfModal('<div class="hrow"><span class="hmodalTitle">Backup / restore</span><button class="hbtn2" style="flex:0 0 auto" data-a="hfClose">✕</button></div><p class="hmuted">Copy this text into a safe note. To restore, paste a backup into the box and tap Restore.</p><textarea class="hta" style="min-height:190px;margin:12px 0" id="hfBackupText">'+esc(payload)+'</textarea><div class="hrow"><button class="hprimary" data-a="hfCopyBackup">Copy backup</button><button class="hbtn2" data-a="hfRestoreBackup">Restore pasted backup</button></div>')}
function hfClick(e,b,a,id){
if(a==='hfTab'){hfTab=b.dataset.tab;render();return true}
if(a==='hfAdd'){hfAdd();return true}
if(a==='hfEdit'){hfEdit(id);return true}
if(a==='hfClose'){hfClose();return true}
if(a==='hfStar'){let it=S.items.find(i=>i.id===id);if(it){it.priority=it.priority==='high'?'normal':'high';hfSave()}return true}
if(a==='hfReopen'){let it=S.items.find(i=>i.id===id);if(it){it.done=false;it.doneAt=null;hfClose();hfSave()}return true}
if(a==='hfFilter'){hfFilter=b.dataset.type;render();return true}
if(a==='hfShowDone'){hfModal('<div class="hrow"><span class="hmodalTitle">Completed</span><button class="hbtn2" data-a="hfClose">✕</button></div>'+S.items.filter(i=>i.done).slice(0,100).map(hfRow).join(''));return true}
if(a==='hfPlanDay'){let d=new Date();d.setDate(d.getDate()+Number(b.dataset.days));hfPlanDate=hfDate(d);render();return true}
if(a==='hfStartTask'){hfFocusTask=id;hfTab='focus';render();return true}
if(a==='hfPreset'){if(!hfFocusRunning){hfFocusPreset=Number(b.dataset.min);hfFocusSeconds=hfFocusPreset*60;render()}return true}
if(a==='hfToggleFocus'){if(hfFocusRunning){hfFocusSeconds=Math.max(0,Math.ceil((hfFocusEnd-Date.now())/1000));hfFocusRunning=false}else{if(hfFocusSeconds<=0)hfFocusSeconds=hfFocusPreset*60;hfFocusEnd=Date.now()+hfFocusSeconds*1000;hfFocusRunning=true}render();return true}
if(a==='hfResetFocus'){hfFocusRunning=false;hfFocusSeconds=hfFocusPreset*60;render();return true}
if(a==='hfSaveTask'){hfSaveTask();return true}
if(a==='hfAddStep'){const field=document.getElementById('hfNewStep'),value=field.value.trim();if(!value)return true;hfSyncSteps();const it=S.items.find(i=>i.id===hfEditing);if(it){it.steps=it.steps||[];it.steps.push({title:value,done:false});hfEdit(it.id)}return true}
if(a==='hfRemoveStep'){hfSyncSteps();const it=S.items.find(i=>i.id===hfEditing);if(it){it.steps.splice(Number(b.dataset.index),1);hfEdit(it.id)}return true}
if(a==='hfDeleteTask'){const taskId=hfEditing;hfClose();del(taskId);return true}
if(a==='hfBackup'){hfBackup();return true}
if(a==='hfCopyBackup'){let ta=document.getElementById('hfBackupText');ta.focus();ta.select();try{document.execCommand('copy');toast('Backup copied')}catch(e){toast('Select and copy the backup text')}return true}
if(a==='hfRestoreBackup'){try{let d=JSON.parse(document.getElementById('hfBackupText').value);if(!Array.isArray(d.items)||d.items.length>50000)throw Error();S.items=d.items;store.set('items',S.items);if(d.focusHistory&&Array.isArray(d.focusHistory))localStorage.setItem('hf_focus_history',JSON.stringify(d.focusHistory));hfClose();hfSave();toast('Backup restored')}catch(e){toast('Invalid backup text')}return true}
return false}
app.addEventListener('keydown',e=>{if(e.target.id==='hfQuick'&&e.key==='Enter'){e.preventDefault();hfAdd()}});
app.addEventListener('input',e=>{if(e.target.id==='hfSearch'){hfSearch=e.target.value;let p=e.target.selectionStart;render();let n=document.getElementById('hfSearch');if(n){n.focus();n.setSelectionRange(p,p)}}});
app.addEventListener('change',e=>{if(e.target.id==='hfPlanDate'){hfPlanDate=e.target.value;render()}if(e.target.id==='hfFocusTask')hfFocusTask=e.target.value});
