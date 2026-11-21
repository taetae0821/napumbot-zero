/* npm install --no-save jsdom@26.1.0, then node tools/test.cjs */
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {JSDOM}=require(process.env.NAPUM_TEST_MODULES?path.join(process.env.NAPUM_TEST_MODULES,'jsdom'):'jsdom');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
let timers=new Map(),nextTimer=0,drawnText=[],faults=[];
const dom=new JSDOM(html,{runScripts:'dangerously',url:'https://napumbot.test/',pretendToBeVisual:true,beforeParse(w){
 w.matchMedia=()=>({matches:false});w.scrollTo=()=>{};
 w.HTMLElement.prototype.scrollIntoView=function(){};
 w.setTimeout=(fn)=>{const id=++nextTimer;timers.set(id,fn);return id;};
 w.clearTimeout=id=>timers.delete(id);
 w.HTMLCanvasElement.prototype.getContext=function(){return{fillRect(){},fillText(t){drawnText.push(t);},measureText(t){return{width:Array.from(t).length*29};}};};w.HTMLCanvasElement.prototype.toDataURL=()=> 'data:image/png;base64,TEST';
 w.addEventListener('error',e=>faults.push(e.message));
}});
const w=dom.window,d=w.document,N=w.NAPUM,S=N.S;
S.opt.sound=false;
let checks=0;
function eq(a,b,msg){assert.deepEqual(JSON.parse(JSON.stringify(a)),JSON.parse(JSON.stringify(b)),msg);checks++;}
function ok(v,msg){assert.ok(v,msg);checks++;}
function click(a,extra=''){const el=d.querySelector(`[data-a="${a}"]${extra}`);assert.ok(el,`Missing control ${a}${extra} on ${S.screen}`);ok(!el.disabled,`${a} disabled`);el.click();}
function setPicks(scores){S.picks=N.ROUNDS[S.round].items.map((it,i)=>it.cards.find(c=>c.s===scores[i]).id);}
function settle(){click('skip');eq(S.screen,'result');}
function send(scores){setPicks(scores);N.go('review');click('order');settle();}
ok(N,'Game initialized');eq(N.ROUNDS.length,3);eq(Object.keys(N.BY_ID).length,45);
for(const r of N.ROUNDS){for(const it of r.items)eq(it.cards.map(c=>c.s).sort(),[0,1,2]);for(let n=0;n<243;n++){let v=n;const p=r.items.map(it=>{const c=it.cards[v%3];v=Math.floor(v/3);return c;});const e=N.evaluate(p),score=p.reduce((s,c)=>s+c.s,0),critical=p.filter(c=>c.crit&&c.s<2),issues=p.filter(c=>c.s<2);eq(e.score,score);eq(e.stars,critical.length?1:score===10?3:score>=6?2:1);eq(e.leadId,(critical[0]||issues.find(c=>c.s===0)||issues[0]||{}).id||null);}}
ok(!/https?:\/\//.test(html.replace(/<a href="https:[^"]+"/g,'').replace(/https:\/\/napumbot.test/g,'')),'No remote asset dependencies');
click('start');eq(S.screen,'intro');eq(S.seen,[]);click('first');click('write');
eq(d.querySelector('[data-a="next"]').disabled,true,'Cannot advance without choosing');
for(let i=0;i<5;i++){click('pick','[data-c="0"]');if(i<4)click('next');}
ok(N.allPicked());const originalOrder=JSON.stringify(S.order);click('review');click('edit','[data-i="2"]');eq(S.step,2);eq(JSON.stringify(S.order),originalOrder);eq(d.querySelectorAll('.choice[aria-pressed="true"]').length,1);
N.go('review');click('order');const attempt=S.attempt;const staleTimer=[...timers.values()][0];settle();eq(S.best[0].score,10);eq(S.best[0].stars,3);staleTimer();eq(S.best[0].score,10);eq(S.phase,'result');N.finish(attempt);eq(S.seen,[]);
click('fix');eq(S.picks.filter(Boolean).length,5);eq(JSON.stringify(S.order),originalOrder);send([0,2,2,2,2]);eq(S.best[0].score,10);eq(N.resultData().stars,1);eq(S.seen,['r1_s1_0']);
click('scene','[data-i="1"]');ok(d.getElementById('result-scene').textContent.includes('다른 항목도 확인'),'Partial success clearly scoped');ok(!d.getElementById('result-scene').textContent.includes('이번에는 현장에 꼭 맞게'),'No full success line for partial success');
click('next-round');eq(S.round,1);eq(S.screen,'brief');click('write');send([2,2,0,2,2]);eq(N.resultData().stars,2);eq(N.resultData().score,8);click('fix');send([2,2,2,2,2]);eq(S.best[1].score,10);ok(S.seen.includes('r2_s3_0'));
click('next-round');eq(S.round,2);click('write');send([2,2,2,2,2]);click('next-round');eq(S.screen,'end');eq(S.best.map(b=>b.stars),[3,3,3]);
drawnText=[];click('share');eq(S.screen,'share');ok(d.querySelector('.share-img'));ok(drawnText.includes('최고 기록 전 라운드 만점'));ok(S.shareAlt.includes('학교')&&S.shareAlt.includes('별 3개'));click('close-share');
click('replay','[data-r="0"]');ok(S.fromEnd);click('write');send([1,2,2,2,2]);eq(S.best[0].score,10);click('next-round');eq(S.screen,'end');
// Every card can render its own result, and all illustration trees are valid XML.
const parser=new w.DOMParser();
for(const c of Object.values(N.BY_ID)){N.newRound(c.r);setPicks([2,2,2,2,2]);S.picks[c.i]=c.id;N.order();N.finish(S.attempt);S.shown=c.i;N.render({scroll:false});ok(d.querySelectorAll('.result-row').length===5);const svg=N.sceneArt(c.r,c.s===2?'condition':c.id,{caption:c.o});ok(!svg.includes('NaN'),'SVG numeric values valid');ok(!parser.parseFromString(svg,'image/svg+xml').querySelector('parsererror'),`SVG valid for ${c.id}`);}
for(const key of ['hero','intro','delivery','normal','condition']){const svg=N.sceneArt(0,key);ok(!parser.parseFromString(svg,'image/svg+xml').querySelector('parsererror'),key);}
N.resetSession();eq(S.seen,[]);eq(S.best,[null,null,null]);eq(S.screen,'start');
click('help');ok(d.querySelector('[role="dialog"]'));const modalFirst=d.querySelector('.modal button');ok(d.activeElement===modalFirst);d.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));ok(!d.querySelector('[role="dialog"]'));
click('big');ok(d.documentElement.classList.contains('big'));eq(d.activeElement.dataset.a,'big','Setting retains focus');click('calm');ok(d.documentElement.classList.contains('calm'));click('sound');eq(d.activeElement.dataset.a,'sound');
N.newRound(0);setPicks([2,2,2,2,2]);N.order();const cancelled=[...timers.values()][0];N.resetSession();cancelled();eq(S.screen,'start','Cancelled timer cannot resurrect results');
eq(faults,[],'No JavaScript errors');
console.log(`PASS: ${checks} checks; 729 score combinations; full three-mission flow; retries, snapshots, 45 result scenes, SVG validation and share-card drawing. Canvas is stubbed; browser layout and downloads require manual verification.`);
dom.window.close();
