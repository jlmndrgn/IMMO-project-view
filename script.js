const STORAGE_KEY='immoUserScenariosV3';
const COLOR_OPTIONS=[{value:'co',label:'Blue'},{value:'pr',label:'Green'},{value:'ct',label:'Gray'},{value:'ig',label:'Dark Gray'},{value:'pi',label:'Orange'},{value:'go',label:'Red'},{value:'custom',label:'Purple'}];

const MONTHS_BASE=[
  {key:'month.jan',value:'jan',weeks:4},{key:'month.feb',value:'feb',weeks:4},{key:'month.mar',value:'mar',weeks:5},
  {key:'month.apr',value:'apr',weeks:4},{key:'month.may',value:'may',weeks:4},{key:'month.jun',value:'jun',weeks:5},
  {key:'month.jul',value:'jul',weeks:4},{key:'month.aug',value:'aug',weeks:4},{key:'month.sep',value:'sep',weeks:5},
  {key:'month.oct',value:'oct',weeks:4},{key:'month.nov',value:'nov',weeks:4},{key:'month.dec',value:'dec',weeks:5}
];
const YEAR_WEEKS=MONTHS_BASE.reduce((a,m)=>a+m.weeks,0);

const LOCALES={
  fi:{'month.jan':'Tam','month.feb':'Hel','month.mar':'Maa','month.apr':'Huh','month.may':'Tou','month.jun':'Kes','month.jul':'Hei','month.aug':'Elo','month.sep':'Syy','month.oct':'Lok','month.nov':'Mar','month.dec':'Jou'},
  en:{'month.jan':'Jan','month.feb':'Feb','month.mar':'Mar','month.apr':'Apr','month.may':'May','month.jun':'Jun','month.jul':'Jul','month.aug':'Aug','month.sep':'Sep','month.oct':'Oct','month.nov':'Nov','month.dec':'Dec'}
};

const DEFAULT_SCENARIOS={
  "Default":{"data":{"projects":[{"id":"p1","name":"OK1","start":36,"rows":[{"id":"r1","name":"Yhteiskehittäminen","d":4,"gap":2,"cls":"co"},{"id":"r2","name":"Tuotanto","d":6,"gap":5,"cls":"pr"},{"id":"r3","name":"Sisällön testaus","d":2,"gap":1,"cls":"ct"},{"id":"r4","name":"Integraatiotestaus","d":1,"gap":1,"cls":"ig"},{"id":"r5","name":"Pilotointi","d":6,"gap":0,"cls":"pi"}]},{"id":"p2","name":"OK2","start":40,"rows":[{"id":"r1","name":"Yhteiskehittäminen","d":6,"gap":3,"cls":"co"},{"id":"r2","name":"Tuotanto","d":8,"gap":6,"cls":"pr"},{"id":"r3","name":"Sisällön testaus","d":2,"gap":1,"cls":"ct"},{"id":"r4","name":"Integraatiotestaus","d":1,"gap":1,"cls":"ig"},{"id":"r5","name":"Pilotointi","d":6,"gap":0,"cls":"pi"}]},{"id":"p3","name":"OK3","start":50,"rows":[{"id":"r1","name":"Yhteiskehittäminen","d":6,"gap":3,"cls":"co"},{"id":"r2","name":"Tuotanto","d":12,"gap":10,"cls":"pr"},{"id":"r3","name":"Sisällön testaus","d":3,"gap":2,"cls":"ct"},{"id":"r4","name":"Integraatiotestaus","d":2,"gap":2,"cls":"ig"},{"id":"r5","name":"Pilotointi","d":6,"gap":0,"cls":"pi"}]}]},"offWeeksInput":"42,52,1,8","events":{"p1-r1|36":1,"p1-r5|49":1,"p2-r2|43":1},"calendarStartMonth":"aug","locale":"fi"}
};

let calendarStartMonth='aug',locale='fi',months=[],weeks=[];
let state=JSON.parse(JSON.stringify(DEFAULT_SCENARIOS.Default.data)),offWeeks=new Set(),isViewMode=true,userScenarios={},events={},projectCounter=100,rowCounter=1000;

const deepCopy=o=>JSON.parse(JSON.stringify(o));
const nextWeek=w=>w===YEAR_WEEKS?1:w+1;
const prevWeek=w=>w===1?YEAR_WEEKS:w-1;
const addWeeks=(w,n)=>{let r=w;if(n>=0){for(let i=0;i<n;i++)r=nextWeek(r);}else{for(let i=0;i<Math.abs(n);i++)r=prevWeek(r);}return r;};
const endWeek=(s,l)=>l<=0?s:addWeeks(s,l-1);
const weeksInclusive=(s,e)=>{let c=1,cur=s;while(cur!==e){cur=nextWeek(cur);c++;if(c>YEAR_WEEKS)break;}return c;};
const spansWeek=(s,l,w)=>{let cur=s;for(let i=0;i<l;i++){if(cur===w)return true;cur=nextWeek(cur);}return false;};
const randInt=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const t=(k)=>((LOCALES[locale]&&LOCALES[locale][k])||k);

function buildMonths(startValue){
  const idx=MONTHS_BASE.findIndex(m=>m.value===startValue);
  const start=idx>=0?idx:7;
  const ordered=[...MONTHS_BASE.slice(start),...MONTHS_BASE.slice(0,start)];
  return ordered.map(m=>({key:m.key,name:t(m.key),weeks:m.weeks,value:m.value}));
}
function getMonthStartOffset(startValue){
  const idx=MONTHS_BASE.findIndex(m=>m.value===startValue);
  if(idx<0)return 0;
  let offset=0;
  for(let i=0;i<idx;i++)offset+=MONTHS_BASE[i].weeks;
  return offset;
}
function buildWeeksFromMonths(startValue){
  const offset=getMonthStartOffset(startValue);
  const out=[];
  for(let i=0;i<YEAR_WEEKS;i++)out.push(((offset+i)%YEAR_WEEKS)+1);
  return out;
}
function refreshMonthControls(){
  const sel=document.getElementById('calendarStartMonth');
  sel.innerHTML=MONTHS_BASE.map(m=>'<option value="'+m.value+'">'+t(m.key)+'</option>').join('');
  sel.value=calendarStartMonth;
}
function applyCalendarSettings(){
  months=buildMonths(calendarStartMonth);
  weeks=buildWeeksFromMonths(calendarStartMonth);
  refreshMonthControls();
  document.getElementById('localeSelect').value=locale;
}
function parseOffWeeks(txt){
  const set=new Set();
  txt.split(',').map(s=>s.trim()).filter(Boolean).forEach(p=>{
    if(p.includes('-')){
      const[a,b]=p.split('-').map(x=>parseInt(x,10));
      if(!isNaN(a)&&!isNaN(b))for(let i=Math.min(a,b);i<=Math.max(a,b);i++)if(i>=1&&i<=YEAR_WEEKS)set.add(i);
    }else{
      const n=parseInt(p,10); if(!isNaN(n)&&n>=1&&n<=YEAR_WEEKS)set.add(n);
    }
  });
  return set;
}
function weekBg(i){let a=0,alt=false;for(const m of months){for(let k=0;k<m.weeks;k++){a++;if(a===i)return alt?'k2':'k1';}alt=!alt;}return'k1';}
function isMonthEnd(i){let a=0;for(const m of months){a+=m.weeks;if(a===i)return true;}return false;}
const eventKey=(r,w)=>r+'|'+w;
function toggleEvent(r,w){const k=eventKey(r,w);if(events[k])delete events[k];else events[k]=1;render();}
function computeProjectRows(p){let s=Math.max(1,Math.min(YEAR_WEEKS,Number(p.start)||1));return p.rows.map(r=>{const rs=s;s=addWeeks(rs,Number(r.gap)||0);return {...r,s:rs,d:Number(r.d)||0};});}

function loadUserScenarios(){try{userScenarios=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');}catch(e){userScenarios={};}}
function persistUserScenarios(){localStorage.setItem(STORAGE_KEY,JSON.stringify(userScenarios));}
function getAllScenarios(){return {...DEFAULT_SCENARIOS,...userScenarios};}
function refreshScenarioDropdown(selName=''){const sel=document.getElementById('scenarioSelect');const names=Object.keys(getAllScenarios()).sort((a,b)=>a.localeCompare(b));sel.innerHTML='<option value="">(Select scenario)</option>'+names.map(n=>'<option value="'+n+'">'+n+'</option>').join('');if(selName&&getAllScenarios()[selName])sel.value=selName;}
function getSnapshot(){return{data:deepCopy(state),offWeeksInput:document.getElementById('offWeeksInput').value,events:deepCopy(events),calendarStartMonth,locale};}
function applySnapshot(s){if(!s||!s.data)return;state=deepCopy(s.data);calendarStartMonth=s.calendarStartMonth||'aug';locale=s.locale||'fi';applyCalendarSettings();document.getElementById('offWeeksInput').value=s.offWeeksInput||'';offWeeks=parseOffWeeks(s.offWeeksInput||'');events=s.events?deepCopy(s.events):{};render();}
function saveNamedScenario(){const n=document.getElementById('configName').value.trim();if(!n)return;userScenarios[n]=getSnapshot();persistUserScenarios();refreshScenarioDropdown(n);}
function loadSelectedScenario(){const n=document.getElementById('scenarioSelect').value,a=getAllScenarios();if(n&&a[n]){applySnapshot(a[n]);document.getElementById('configName').value=n;}}
function overwriteSelectedScenario(){const n=document.getElementById('scenarioSelect').value;if(!n)return;userScenarios[n]=getSnapshot();persistUserScenarios();refreshScenarioDropdown(n);}
function deleteSelectedScenario(){const n=document.getElementById('scenarioSelect').value;if(!n||DEFAULT_SCENARIOS[n]||!userScenarios[n])return;delete userScenarios[n];persistUserScenarios();refreshScenarioDropdown('');}
function setProjectStart(pi,v){state.projects[pi].start=Math.max(1,Math.min(YEAR_WEEKS,Number(v)||1));render();}
function setProjectName(pi,v){state.projects[pi].name=v||('Project '+(pi+1));render();}
function setRowName(pi,ri,v){state.projects[pi].rows[ri].name=v||('Row '+(ri+1));render();}
function setRowDur(pi,ri,v){state.projects[pi].rows[ri].d=Math.max(0,Number(v)||0);render();}
function setRowGap(pi,ri,v){state.projects[pi].rows[ri].gap=Math.max(0,Number(v)||0);render();}
function setRowClass(pi,ri,v){state.projects[pi].rows[ri].cls=v||'custom';render();}
function addProject(){const id='p'+(++projectCounter);state.projects.push({id,name:'Project '+state.projects.length,start:1,rows:[{id:'r'+(++rowCounter),name:'New row',d:4,gap:1,cls:'custom'}]});render();}
function removeProject(pi){if(state.projects.length<=1)return;const p=state.projects[pi];if(!confirm('Remove project "'+p.name+'"? This cannot be undone.'))return;const pref=p.id+'-';Object.keys(events).forEach(k=>{if(k.startsWith(pref))delete events[k];});state.projects.splice(pi,1);render();}
function addRow(pi){state.projects[pi].rows.push({id:'r'+(++rowCounter),name:'New row',d:4,gap:1,cls:'custom'});render();}
function removeRow(pi,ri){const p=state.projects[pi];if(p.rows.length<=1)return;const rowId=p.id+'-'+p.rows[ri].id;Object.keys(events).forEach(k=>{if(k.startsWith(rowId+'|'))delete events[k];});p.rows.splice(ri,1);render();}
function colorOptions(sel){return COLOR_OPTIONS.map(o=>'<option value="'+o.value+'"'+(o.value===sel?' selected':'')+'>'+o.label+'</option>').join('');}

function generateScenario(){
  state.projects=[...state.projects].sort((a,b)=>a.start-b.start);
  let nextStart=randInt(1,5);
  state.projects.forEach((p,pi)=>{
    p.start=nextStart;
    const byName=k=>p.rows.find(r=>r.name.toLowerCase().includes(k));
    const yh=byName('yhteis'),tuot=byName('tuot'),sis=byName('sisäll'),integ=byName('integra'),pil=byName('pilot');
    if(yh){yh.d=randInt(3,7);yh.gap=randInt(0,2);}
    if(tuot){tuot.d=randInt(7,13);tuot.gap=Math.max(1,randInt(1,3));}
    if(sis){sis.d=randInt(1,4);}
    if(integ){integ.d=randInt(1,3);}
    if(pil){pil.d=randInt(4,8);pil.gap=randInt(1,2);}
    if(tuot&&sis){
      const preTuotGap=(yh?yh.gap:0);
      const sisTarget=Math.max(1,Math.floor(tuot.d*randInt(70,80)/100));
      sis.gap=Math.max(1,(preTuotGap+sisTarget)-tuot.gap);
    }
    if(tuot&&sis&&integ){
      const preTuotGap=(yh?yh.gap:0);
      const integTarget=Math.max(Math.floor(tuot.d*randInt(80,95)/100),Math.floor(tuot.d*0.8));
      integ.gap=Math.max(0,(preTuotGap+integTarget)-(tuot.gap+sis.gap));
    }
    nextStart=Math.min(YEAR_WEEKS,addWeeks(p.start,randInt(3,6)));
    if(pi>0 && weeksInclusive(state.projects[pi-1].start,p.start)<3) p.start=addWeeks(state.projects[pi-1].start,3);
  });
  events={}; render();
}

function render(){
  let h='<div class="grid"><div></div>';
  months.forEach(m=>h+='<div class="'+(m.value==='oct'||m.value==='mar'?'m2':'m1')+'" style="grid-column:span '+m.weeks+'">'+m.name+'</div>');
  h+='</div><div class="grid"><div></div>';
  for(let i=0;i<weeks.length;i++){const w=weeks[i];h+='<div class="'+weekBg(i+1)+(isMonthEnd(i+1)?' month':'')+(offWeeks.has(w)?' off':'')+'" style="text-align:center;font-size:11px">'+w+'</div>';}
  h+='</div>';

  state.projects.forEach((p,pi)=>{
    const rows=computeProjectRows(p);
    h+='<div class="grid"><div class="rowlbl"><b class="project-label-view">'+p.name+'</b><span class="edit-inline"><b>Project</b> <input class="project-name-input" data-bind="pname" data-pi="'+pi+'" value="'+p.name+'"> start <input data-bind="pstart" data-pi="'+pi+'" value="'+p.start+'"> <button class="smallbtn edit-inline" data-act="addRow" data-pi="'+pi+'">+ row</button> <button class="smallbtn edit-inline" data-act="removeProject" data-pi="'+pi+'">- project</button></span></div>';
    for(let i=0;i<weeks.length;i++){let cls=weekBg(i+1);if(offWeeks.has(weeks[i]))cls='off';h+='<div class="cell '+cls+(isMonthEnd(i+1)?' month':'')+'"></div>';}
    h+='</div>';
    h+='<div class="grid meta-head"><div class="rowlbl"><span class="row-title">Row</span><span class="edit-inline">duration</span><span class="edit-inline">shift</span><span class="edit-inline">color</span><span class="edit-inline">action</span></div>';
    for(let i=0;i<weeks.length;i++)h+='<div class="cell '+weekBg(i+1)+(isMonthEnd(i+1)?' month':'')+'"></div>';
    h+='</div>';
    rows.forEach((r,ri)=>{
      const rowId=p.id+'-'+r.id;
      h+='<div class="grid"><div class="rowlbl"><span class="row-label-view">'+r.name+'</span><input class="row-name-input" data-bind="rname" data-pi="'+pi+'" data-ri="'+ri+'" value="'+r.name+'"> <span class="edit-inline"><input data-bind="rd" data-pi="'+pi+'" data-ri="'+ri+'" value="'+r.d+'"> <input data-bind="rg" data-pi="'+pi+'" data-ri="'+ri+'" value="'+r.gap+'"> <select class="color-select" data-bind="rc" data-pi="'+pi+'" data-ri="'+ri+'">'+colorOptions(r.cls)+'</select> <button class="smallbtn" data-act="removeRow" data-pi="'+pi+'" data-ri="'+ri+'">- row</button></span></div>';
      for(let i=0;i<weeks.length;i++){const w=weeks[i],inPhase=spansWeek(r.s,r.d,w);let cls=weekBg(i+1),click='';if(offWeeks.has(w))cls='off';if(inPhase){cls=r.cls||'custom';click=' clickable';}h+='<div class="cell'+click+' '+cls+(isMonthEnd(i+1)?' month':'')+'"'+(inPhase?' data-rowid="'+rowId+'" data-week="'+w+'"':'')+'>'+(inPhase&&events[eventKey(rowId,w)]?'<div class="dot"></div>':'')+'</div>';}
      h+='</div>';
    });
    const first=rows[0],last=rows[rows.length-1],st=first?first.s:1,en=last?endWeek(last.s,last.d):st,total=weeksInclusive(st,en);
    h+='<div class="grid"><div class="summary">'+p.name+': valmis vk '+en+' (kesto '+total+' vk, alkaen vk '+st+')</div></div>';
  });

  document.getElementById('chart').innerHTML=h;
  document.querySelectorAll('input[data-bind="pstart"]').forEach(i=>i.addEventListener('change',e=>setProjectStart(Number(e.target.dataset.pi),e.target.value)));
  document.querySelectorAll('input[data-bind="pname"]').forEach(i=>i.addEventListener('change',e=>setProjectName(Number(e.target.dataset.pi),e.target.value)));
  document.querySelectorAll('input[data-bind="rname"]').forEach(i=>i.addEventListener('change',e=>setRowName(Number(e.target.dataset.pi),Number(e.target.dataset.ri),e.target.value)));
  document.querySelectorAll('input[data-bind="rd"]').forEach(i=>i.addEventListener('change',e=>setRowDur(Number(e.target.dataset.pi),Number(e.target.dataset.ri),e.target.value)));
  document.querySelectorAll('input[data-bind="rg"]').forEach(i=>i.addEventListener('change',e=>setRowGap(Number(e.target.dataset.pi),Number(e.target.dataset.ri),e.target.value)));
  document.querySelectorAll('select[data-bind="rc"]').forEach(i=>i.addEventListener('change',e=>setRowClass(Number(e.target.dataset.pi),Number(e.target.dataset.ri),e.target.value)));
  document.querySelectorAll('[data-act="addRow"]').forEach(b=>b.addEventListener('click',()=>addRow(Number(b.dataset.pi))));
  document.querySelectorAll('[data-act="removeProject"]').forEach(b=>b.addEventListener('click',()=>removeProject(Number(b.dataset.pi))));
  document.querySelectorAll('[data-act="removeRow"]').forEach(b=>b.addEventListener('click',()=>removeRow(Number(b.dataset.pi),Number(b.dataset.ri))));
  document.querySelectorAll('.cell.clickable').forEach(c=>c.addEventListener('click',()=>toggleEvent(c.dataset.rowid,Number(c.dataset.week))));
}
function applyMode(){document.body.classList.toggle('view-mode',isViewMode);document.getElementById('toggleMode').textContent=isViewMode?'Switch to Edit mode':'Switch to View mode';}
document.getElementById('toggleMode').addEventListener('click',()=>{isViewMode=!isViewMode;applyMode();});
document.getElementById('calendarStartMonth').addEventListener('change',e=>{calendarStartMonth=e.target.value;applyCalendarSettings();render();});
document.getElementById('localeSelect').addEventListener('change',e=>{locale=e.target.value;applyCalendarSettings();render();});
document.getElementById('applyOffWeeks').addEventListener('click',()=>{offWeeks=parseOffWeeks(document.getElementById('offWeeksInput').value);render();});
document.getElementById('saveConfig').addEventListener('click',saveNamedScenario);
document.getElementById('loadScenario').addEventListener('click',loadSelectedScenario);
document.getElementById('overwriteScenario').addEventListener('click',overwriteSelectedScenario);
document.getElementById('deleteScenario').addEventListener('click',deleteSelectedScenario);
document.getElementById('addProjectBtn').addEventListener('click',addProject);
document.getElementById('generateBtn').addEventListener('click',generateScenario);

offWeeks=parseOffWeeks(document.getElementById('offWeeksInput').value);
applyCalendarSettings();
loadUserScenarios();refreshScenarioDropdown();applyMode();render();