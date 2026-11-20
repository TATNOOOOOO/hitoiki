'use strict';
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])),$=s=>document.querySelector(s),f2=n=>String(n).padStart(2,'0');
const KEY='hitoiki.v1',RC=565.5,FONTS={g:'"Yu Gothic","YuGothic","游ゴシック体","游ゴシック","Hiragino Sans",sans-serif',m:'"Yu Mincho","Hiragino Mincho ProN","Noto Serif JP",serif',r:'"Hiragino Maru Gothic ProN","Yu Gothic",sans-serif'};
const DEF=()=>({cfg:{focus:25,rest:5,goal:30,hands:false,sfx:true,notif:false,ac:'',bg:'',fg:'',ff:'g'},tasks:[],log:{}});
let D=DEF();try{const s=JSON.parse(localStorage.getItem(KEY)||'{}');D={...D,...s,cfg:{...D.cfg,...s.cfg}};if(D.cfg.ff==='u')D.cfg.ff='g'}catch(e){}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(D))}catch(e){}},C=()=>D.cfg;
let R,M=null,P=null,A=false,AT='t',FS=false,lastMode='',mode='p',cal=new Date(),selDay='',ambOn=false,ambK='rain',amb=null;
const today=()=>{const d=new Date();return d.getFullYear()+'-'+f2(d.getMonth()+1)+'-'+f2(d.getDate())};
const fmt=s=>{s=Math.max(0,Math.floor(s));const h=Math.floor(s/3600),m=Math.floor(s%3600/60);return(h?h+':'+f2(m):f2(m))+':'+f2(s%60)};
const dur=s=>{s=Math.round(s);return Math.floor(s/60)+'分'+s%60+'秒'};
function reset(){R={run:false,last:0,ph:'f',rem:C().focus*60,cyc:1,cdone:0,el:0,total:0,study:0,reached:false}}
reset();selDay=today();
/* sound */
let ctx;const AC=()=>ctx||(ctx=new(window.AudioContext||window.webkitAudioContext)());
const SFX={start:'start.mp3',tap:'tap.mp3',goal:'goal.mp3',confirm:'confirm.mp3'},TN={start:[[660,.07],[880,.09]],tap:[[520,.06]],goal:[[660,.15],[880,.15],[1100,.25]],confirm:[[440,.12],[330,.16]]};
function sfx(n){if(!C().sfx)return;const a=new Audio('sounds/'+SFX[n]);a.play().catch(()=>{try{synth(n)}catch(e){}})}
function synth(n){const c=AC();let t=c.currentTime;for(const[f,d]of TN[n]){const o=c.createOscillator(),g=c.createGain();o.frequency.value=f;g.gain.setValueAtTime(.2,t);g.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(g).connect(c.destination);o.start(t);o.stop(t+d);t+=d*.9}}
const AMB={bird:'鳥',city:'街',morning:'朝',rain:'雨',room1:'部屋1',room2:'部屋2',wave:'波'};
function ambStop(){if(amb){amb.stop();amb=null}}
function ambPlay(k){ambStop();const a=new Audio('sounds/ambient/'+k+'.mp3');a.loop=true;a.volume=.6;const me={stop(){a.pause();a.src=''}};amb=me;a.play().catch(()=>{if(amb===me)try{amb=synthAmb(k)}catch(e){}})}
function synthAmb(k){const c=AC(),n=c.sampleRate*2,b=c.createBuffer(1,n,c.sampleRate),d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1;const s=c.createBufferSource();s.buffer=b;s.loop=true;const fl=c.createBiquadFilter(),g=c.createGain(),rain=k==='rain',wave=k==='wave';fl.type=rain?'highpass':'lowpass';fl.frequency.value=rain?1500:wave?500:300;g.gain.value=rain?.1:.2;let l;if(wave){l=c.createOscillator();l.frequency.value=.12;const lg=c.createGain();lg.gain.value=.15;l.connect(lg).connect(g.gain);l.start()}s.connect(fl).connect(g).connect(c.destination);s.start();return{stop(){s.stop();l&&l.stop();g.disconnect()}}}
function ambTog(){ambOn=!ambOn;ambOn?ambPlay(ambK):ambStop();const e=$('#ambsel');if(e)e.hidden=!ambOn}
function ambSet(k){ambK=k;if(ambOn)ambPlay(k)}
function yt(){const v=$('#yu').value.trim();let id='',l='';try{const u=new URL(v);l=u.searchParams.get('list')||'';id=u.searchParams.get('v')||(u.hostname==='youtu.be'?u.pathname.slice(1):'')}catch(e){}
if(!l&&!id){alertM('リンクを読み取れません','YouTubeの動画またはプレイリストのURLを入れてください。');return}
const q=encodeURIComponent,src=l?'https://www.youtube-nocookie.com/embed/videoseries?list='+q(l)+'&autoplay=1&loop=1':'https://www.youtube-nocookie.com/embed/'+q(id)+'?autoplay=1&loop=1&playlist='+q(id);
$('#ytbox').innerHTML='<iframe src="'+src+'" allow="autoplay; encrypted-media" title="BGM"></iframe><button onclick="$(\'#ytbox\').innerHTML=\'\'">×</button>'}
/* engine */
const cur=()=>D.tasks.find(t=>!t.done);
function tick(){if(!R.run)return;const n=Date.now(),dt=Math.min((n-R.last)/1000,86400);R.last=n;R.total+=dt;
if(mode==='p'){if(R.ph==='f')R.study+=dt;R.rem-=dt;if(R.rem<=0)phEnd()}
else if(mode==='c'){R.el+=dt;R.study+=dt;if(!R.reached&&R.el>=C().goal*60){R.reached=true;sfx('goal');notify('目標時間に到達しました');if(!C().hands)alertM('目標時間に到達しました','ここから先は、超過時間として数えます。')}}
else{R.study+=dt;const t=cur();if(t)t.sec=(t.sec||0)+dt}
paint()}
function phEnd(){sfx('goal');const hf=C().hands,carry=hf?R.rem:0;let msg;
if(R.ph==='f'){R.cdone++;R.ph='r';R.rem=C().rest*60+carry;msg='集中が終わりました。休憩に進みます。'}else{R.ph='f';R.cyc++;R.rem=C().focus*60+carry;msg='休憩が終わりました。次の集中に進みます。'}
notify(msg);if(!hf){R.run=false;alertM(msg,'',()=>{R.run=true;R.last=Date.now()},'進む')}else render()}
setInterval(tick,250);try{const w=new Worker(URL.createObjectURL(new Blob(['setInterval(()=>postMessage(0),1000)'])));w.onmessage=tick}catch(e){}document.addEventListener('visibilitychange',tick);
/* actions */
function toggle(){if(mode==='g'&&!cur()){A=true;render();return}R.run=!R.run;R.last=Date.now();sfx(R.run?'start':'tap');render()}
function discard(){D.tasks.forEach(t=>{t.sec=0;t.done=false});reset()}
function rst(){if(R.total<1)return;confirmM('最初からやり直しますか？','進捗がリセットされます。',()=>{discard();render()},'やり直す')}
function setMode(m){if(m===mode)return;const go=()=>{mode=m;discard();render()};if(R.run||R.total>0)confirmM('モードを切り替えますか？','タイマーがリセットされ、これまでの進捗は失われます。',go,'切り替える');else{sfx('tap');go()}}
function finish(){R.run=false;sfx('goal');const rows=[['合計学習時間',dur(R.study)]];
if(mode==='p')rows.push(['サイクル数',R.cdone+'回']);
if(mode==='c')rows.push(['ゴールからの経過時間',dur(Math.max(0,R.el-C().goal*60))]);
if(mode==='g'){const dn=D.tasks.filter(t=>t.done);rows.push(['完了した課題',dn.length+'件']);dn.forEach(t=>rows.push(['　'+esc(t.n+(t.s?' '+t.s:'')),dur(t.sec)]))}
M={t:'おつかれさま',rows,btns:[['記録して閉じる',commit,1]]};render()}
function commit(){if(R.study>=1){const k=today();D.log[k]=(D.log[k]||0)+Math.round(R.study)}if(mode==='g')D.tasks=D.tasks.filter(t=>!t.done);D.tasks.forEach(t=>t.sec=0);reset();save()}
function done(){const t=cur();if(!t)return;t.done=true;save();if(!cur())finish();else{sfx('goal');render()}}
function tapDone(){if(R.run)done()}
function toEnd(){const t=cur();if(!t)return;D.tasks.splice(D.tasks.indexOf(t),1);D.tasks.push(t);save();render()}
function smartRanges(){const a=Math.floor(+$('#pa').value),b=Math.floor(+$('#pb').value),s=Math.max(1,Math.floor(+$('#ps').value)||1);if(!a||!b||b<a)return[];const n=Math.max(1,Math.floor((b-a+1)/s)),r=[];for(let i=0;i<n;i++){const st=a+i*s;r.push([st,i===n-1?b:st+s-1])}return r}
function smartInfo(){const r=smartRanges();$('#si').textContent=r.length?r.length+'個の課題に分割。端数は最後の課題にまとめます。':'ページ範囲を入力してください。'}
function addTab(k){AT=k;document.querySelectorAll('.tabs.sm button').forEach((b,i)=>b.classList.toggle('on','tsk'[i]===k));['t','s','k'].forEach(x=>{$('#pn-'+x).hidden=x!==k})}
function addSubmit(){const out=[];
if(AT==='t'){const n=$('#tn').value.trim();if(n)out.push({n,s:''})}
else if(AT==='s'){const n=$('#sn').value.trim();if(n)$('#sl').value.split('\n').map(x=>x.trim()).filter(Boolean).forEach(l=>out.push({n,s:l}))}
else{const n=$('#wn').value.trim();if(n)smartRanges().forEach(([a,b])=>out.push({n,s:'p. '+a+(b>a?' – '+b:'')}))}
if(!out.length)return;out.forEach(o=>D.tasks.push({n:o.n,s:o.s,done:false,sec:0}));A=false;save();render()}
function mv(i,d){const j=i+d;if(j<0||j>=D.tasks.length)return;[D.tasks[i],D.tasks[j]]=[D.tasks[j],D.tasks[i]];save();render()}
function del(i){D.tasks.splice(i,1);save();render()}
function clearQ(){confirmM('勉強キューを全消去しますか？','課題がすべて削除されます。',()=>{D.tasks=[];save();render()},'全消去')}
function setC(k,v){C()[k]=v;save();if(!R.run&&R.total===0)reset();theme();render()}
function setP(f,r){C().focus=f;C().rest=r;save();if(!R.run&&R.total===0)reset();render()}
function setN(k,v){C()[k]=Math.max(1,Math.round(+v)||C()[k]);save();if(!R.run&&R.total===0)reset();render()}
function tg(k,v){C()[k]=v;save()}
function fsT(){FS=!FS;if(FS)document.documentElement.requestFullscreen&&document.documentElement.requestFullscreen().catch(()=>{});else if(document.fullscreenElement)document.exitFullscreen();render()}
document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement&&FS){FS=false;render()}});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&FS){FS=false;render()}});
document.addEventListener('click',e=>{const b=e.target.closest('button');if(b&&!b.hasAttribute('data-ns'))sfx('tap')},true);document.addEventListener('change',e=>{if(e.target.matches('select,input[type=checkbox],input[type=file],input[type=color]'))sfx('tap')});
function setCol(k,v){C()[k]=v;save();theme()}
function resetCol(){['ac','bg','fg'].forEach(k=>C()[k]='');save();theme();render()}
async function font(i){const f=i.files[0];if(!f)return;try{const ff=new FontFace('hfont',await f.arrayBuffer());await ff.load();document.fonts.add(ff);C().ff='u';theme();render()}catch(e){alertM('フォントを読み込めませんでした','TTF・OTF・WOFFのファイルを選んでください。')}}
function wipe(){confirmM('すべてのデータを消去しますか？','課題・学習記録・設定がこの端末から削除されます。',()=>{try{localStorage.removeItem(KEY)}catch(e){}D=DEF();reset();theme();P=null;render()},'すべて消去')}
function theme(){const s=document.documentElement.style,c=C();['ac','bg','fg'].forEach(k=>s.setProperty('--'+k,c[k]));s.setProperty('--ff',c.ff==='u'?'"hfont",'+FONTS.g:FONTS[c.ff])}
/* notify */
const NP=()=>'Notification' in window?Notification.permission:'unsupported';
function showN(b){const o={body:b,tag:'hitoiki',renotify:true,icon:'icon-192.png'},fb=()=>{try{new Notification('ひといき',o)}catch(e){}};try{const g=navigator.serviceWorker&&navigator.serviceWorker.getRegistration?navigator.serviceWorker.getRegistration():Promise.resolve();g.then(r=>r&&r.showNotification?r.showNotification('ひといき',o):fb()).catch(fb)}catch(e){fb()}}
function notify(b){if(!C().notif||NP()!=='granted')return;if(document.visibilityState==='visible'&&document.hasFocus())return;showN(b)}
async function notifTog(el){if(!el.checked){tg('notif',false);return}if(NP()==='unsupported'){el.checked=false;alertM('この環境では通知を使えません','ブラウザが通知に対応していないか、対応していない画面で開いています。');return}if(NP()==='default'){try{await Notification.requestPermission()}catch(e){}}const p=NP();
if(p==='granted'){tg('notif',true);showN('通知をオンにしました。節目になると、ここに届きます。')}else{el.checked=false;tg('notif',false);alertM('通知が許可されていません','ブラウザやOSの設定で、このサイトの通知を許可してください。')}}
/* modal */
function alertM(t,b,fn,ok){M={t,b:b||'',btns:[[ok||'OK',fn,1]]};render()}
function confirmM(t,b,yes,l){sfx('confirm');M={t,b,btns:[['キャンセル'],[l||'はい',yes,1]]};render()}
function closeM(i){const f=M.btns[i][1];M=null;if(f)f();render()}
/* view */
const P_={play:'<polygon points="6 3 20 12 6 21 6 3"/>',pause:'<rect x="14" y="4" width="4" height="16" rx="1"/><rect x="6" y="4" width="4" height="16" rx="1"/>',square:'<rect x="4" y="4" width="16" height="16" rx="2"/>',reset:'<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',skip:'<polygon points="5 4 15 12 5 20 5 4"/><path d="M19 5v14"/>',plus:'<path d="M5 12h14M12 5v14"/>',trash:'<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',up:'<path d="m18 15-6-6-6 6"/>',down:'<path d="m6 9 6 6 6-6"/>',x:'<path d="M18 6 6 18M6 6l12 12"/>',max:'<path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3"/>',min:'<path d="M8 3v3a2 2 0 0 1-2 2H3M21 8h-3a2 2 0 0 1-2-2V3M3 16h3a2 2 0 0 1 2 2v3M16 21v-3a2 2 0 0 1 2-2h3"/>',cal:'<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',set:'<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',head:'<path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"/>',vol:'<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/>',book:'<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',check:'<path d="M20 6 9 17l-5-5"/>',timer:'<path d="M10 2h4"/><path d="M12 14l3-3"/><circle cx="12" cy="14" r="8"/>',glass:'<path d="M5 22h14M5 2h14"/><path d="M17 22v-4.2a2 2 0 0 0-.6-1.4L12 12l-4.4 4.4a2 2 0 0 0-.6 1.4V22"/><path d="M7 2v4.2a2 2 0 0 0 .6 1.4L12 12l4.4-4.4A2 2 0 0 0 17 6.2V2"/>',list:'<path d="m3 17 2 2 4-4M3 7l2 2 4-4M13 6h8M13 12h8M13 18h8"/>',cup:'<path d="M10 2v2M14 2v2M6 2v2"/><path d="M16 8H4a1 1 0 0 0-1 1v8a4 4 0 0 0 4 4h6a4 4 0 0 0 4-4V9a1 1 0 0 0-1-1z"/><path d="M17 12h2a2 2 0 0 1 0 4h-2"/>',music:'<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',bell:'<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',drag:'<circle cx="9" cy="6" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="18" r="1"/>',prev:'<path d="m15 18-6-6 6-6"/>',next:'<path d="m9 18 6-6-6-6"/>'};
const ic=(n,s=20)=>'<svg class="i" width="'+s+'" height="'+s+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+P_[n]+'</svg>';
function prog(){if(mode==='p')return 1-R.rem/((R.ph==='f'?C().focus:C().rest)*60);if(mode==='c')return Math.min(1,R.el/(C().goal*60));const n=D.tasks.length;return n?D.tasks.filter(t=>t.done).length/n:0}
function big(){if(mode==='p')return fmt(R.rem);if(mode==='c')return fmt(R.el);return fmt(R.total)}
function st1(){if(mode==='p')return['現在のサイクル',f2(R.cyc)];return['目標達成率',Math.min(100,Math.floor(R.el/(C().goal*60)*100))+'%']}
function paint(){const e=$('#big');if(e){e.textContent=big();$('#tot').textContent=fmt(R.total);$('#st1').textContent=st1()[1];$('#ring').style.strokeDashoffset=(1-Math.max(0,Math.min(1,prog())))*RC;const o=$('#over');if(o)o.textContent=mode==='c'&&R.reached?'目標超過 +'+fmt(R.el-C().goal*60):''}
const g=$('#gt');if(g){g.textContent=fmt(R.total);const t=cur(),s=$('#ts');if(t&&s)s.textContent=fmt(t.sec||0)}}
const row=(a,b)=>'<div class="row"><span>'+a+'</span><b>'+b+'</b></div>';
const sw=(on,fn)=>'<label class="sw"><input type="checkbox" '+(on?'checked':'')+' onchange="'+fn+'"><i></i></label>';
const num=(k,l)=>'<label class="f">'+l+'<input type="number" min="1" step="1" value="'+C()[k]+'" onchange="setN(\''+k+'\',this.value)"></label>';
const pre=(arr,fn,on)=>'<div class="pre">'+arr.map(a=>'<button class="'+(on(a)?'on':'')+'" onclick="'+fn(a)+'">'+a[2]+'</button>').join('')+'</div>';
const head=(e,d)=>'<div class="mh"><div><small>'+e+'</small><p>'+d+'</p></div><button class="ib" title="全画面表示" onclick="fsT()">'+ic(FS?'min':'max')+'</button></div>';
const ctl=x=>'<div class="ctl"><button class="ib" title="やり直す" data-ns onclick="rst()">'+ic('reset')+'</button><button class="go" data-ns onclick="toggle()">'+ic(R.run?'pause':'play')+(R.run?'一時停止':'はじめる')+'</button><button class="fin" data-ns onclick="finish()">'+ic('square',16)+'終了</button>'+(x||'')+'</div>';
function timerCard(){const p=mode==='p',c=C();const lab=p?(R.ph==='f'?'集中時間':'休憩時間'):'時間を積み重ねる',sub=p?(R.ph==='f'?c.focus:c.rest)+'分の'+(R.ph==='f'?'集中':'休憩'):'目標 '+c.goal+'分';
return'<section class="card'+(FS?' fs':'')+'">'+head(p?'FOCUS & REST':'ONE MORE MINUTE',p?'集中と休憩に、心地よいリズムを。':'積み重ねた時間が、自信になる。')+'<div class="lab"><i class="dot"></i>'+lab+'</div><div class="ringw'+(R.run?' run':'')+'"><svg viewBox="0 0 200 200"><circle class="bg" cx="100" cy="100" r="90"/><circle id="ring" class="fg" cx="100" cy="100" r="90" stroke-dasharray="'+RC+'" transform="rotate(-90 100 100)"/></svg><div class="ct"><b id="big"></b><span>'+sub+'</span><em id="over"></em></div></div>'+ctl()+'<div class="stats"><div><small>'+st1()[0]+'</small><b id="st1"></b></div><div><small>開始からの稼働時間<br>（一時停止を除く）</small><b id="tot"></b></div></div></section>'}
function goalCard(){const t=cur(),n=D.tasks.length,dn=D.tasks.filter(x=>x.done).length;let body;
if(!t)body='<div class="dlg">'+'<div class="bk">'+ic('book',34)+'</div><small>A LITTLE STEP, EVERY DAY</small><h4>今日の課題を追加しよう</h4><p>宿題も、ワークブックも。ひとつずつ。</p><button class="sub" style="margin-top:16px" onclick="A=true;render()">'+ic('plus',16)+'課題を追加する</button></div>';
else body='<div class="dlg'+(R.run?' live':'')+'" onclick="tapDone()"><div class="bk">'+ic('book',34)+'</div><small>TASK '+f2(dn+1)+' / '+f2(n)+'</small><h4>'+esc(t.n)+'</h4>'+(t.s?'<p>'+esc(t.s)+'</p>':'')+'<div class="tp">'+(R.run?ic('check',16)+'このエリアをタップして完了':'「はじめる」で開始します')+'</div></div><div class="cap">この課題の学習時間 <span id="ts">00:00</span></div>';
return'<section class="card'+(FS?' fs':'')+'">'+head('YOUR STUDY QUEUE','ひとつずつ進めて、今日のゴールへ。')+'<div class="gh"><span><i class="dot"></i>現在の課題</span><span class="t">'+ic('timer',16)+'<b id="gt">00:00</b></span></div>'+body+'<div class="pg" style="margin-top:12px"><span>全体の進捗</span><b>'+dn+' / '+n+' 完了</b></div><div class="bar"><i style="width:'+(n?dn/n*100:0)+'%"></i></div>'+ctl('<button class="ib" title="この課題を最後へ" onclick="toEnd()">'+ic('skip')+'</button>')+'<button class="lnk" onclick="toEnd()">'+ic('skip',14)+'この課題を最後へ</button></section>'}
function queue(){const ci=D.tasks.findIndex(t=>!t.done);return'<div class="card"><div class="qh"><h3>学習キュー <em>'+D.tasks.length+'</em></h3><button class="ib" style="border:0;background:none" title="課題を追加" onclick="A=true;render()">'+ic('plus')+'</button></div><p class="mut">プレイリストのように、ひとつずつ。</p><button class="add" onclick="A=true;render()">'+ic('plus',16)+'課題を追加する</button>'
+(D.tasks.length?'<ul class="q">'+D.tasks.map((t,i)=>'<li class="'+(i===ci?'now':'')+(t.done?' d':'')+'"><span class="no">'+(i===ci?ic('play',14):f2(i+1))+'</span><div class="tx"><b>'+esc(t.n)+'</b>'+(t.s?'<span>'+esc(t.s)+'</span>':'')+'</div>'+(t.done?'<span class="mut">'+ic('check',16)+'</span>':'<button title="上へ" onclick="mv('+i+',-1)">'+ic('up',18)+'</button><button title="下へ" onclick="mv('+i+',1)">'+ic('down',18)+'</button>')+'<button title="削除" onclick="del('+i+')">'+ic('trash',18)+'</button></li>').join('')+'</ul>':'<div class="mut" style="text-align:center;padding:24px 0">まだ課題がありません。<br>宿題の分割やページ範囲も追加できます。</div>')
+'<div class="hint">'+ic('drag',16)+'矢印で順番を変更できます。</div><button class="clr" data-ns onclick="clearQ()">'+ic('trash',16)+'勉強キューを全消去</button></div>'}
function rhythm(){const c=C();let h='<div class="card"><h3>'+ic('set',18)+'自分のリズムで</h3><p class="mut">時間は、あなたに合わせて。</p>';
if(mode==='p')h+='<div class="two">'+num('focus','集中時間（分）')+num('rest','休憩時間（分）')+'</div>'+pre([[25,5,'25 / 5'],[45,10,'45 / 10'],[50,10,'50 / 10']],a=>'setP('+a[0]+','+a[1]+')',a=>c.focus===a[0]&&c.rest===a[1]);
else h+=num('goal','目標時間（分）')+pre([[15,0,'15分'],[30,0,'30分'],[60,0,'60分']],a=>'setN(\'goal\','+a[0]+')',a=>c.goal===a[0]);
return h+'<div class="sr"><span>'+ic('head',20)+'<span style="display:block">ハンズフリー<small>確認なしで、次へ進む</small></span></span>'+sw(c.hands,'tg(\'hands\',this.checked)')+'</div></div>'}
function sound(){const c=C();return(mode!=='g'?'<div class="note">'+ic('cup',22)+'<h3 style="margin-top:8px">休むことも、勉強のうち。</h3><p>区切りが来たら、肩の力を抜いて。次の集中のために、ひといき。</p></div>':'')
+'<div class="card"><div class="sr"><span>'+ic('vol',20)+'<span style="display:block">区切りの効果音<small>終わりを、やさしい音で</small></span></span>'+sw(c.sfx,'tg(\'sfx\',this.checked)')+'</div><div class="sr"><span>'+ic('bell',20)+'<span style="display:block">通知<small>画面を離れている間、節目で知らせる</small></span></span><label class="sw"><input type="checkbox" '+(c.notif?'checked':'')+' onchange="notifTog(this)"><i></i></label></div>'+(c.notif&&NP()!=='granted'?'<p class="mut" style="margin:0 0 8px;color:var(--dg)">ブラウザ側で通知が許可されていません。ブラウザの設定で、このサイトの通知を許可してください。</p>':'')+'<p class="mut" style="margin:0 0 8px">iPhoneは、ホーム画面に追加したアプリから開いた場合のみ使えます。アプリを閉じている間は届かない場合があります。</p><div class="sr"><span>'+ic('head',20)+'環境音・BGM</span>'+sw(ambOn,'ambTog()')+'</div><select id="ambsel" class="f" style="width:100%;padding:12px;border:1px solid var(--ln);border-radius:12px;background:var(--bg)" '+(ambOn?'':'hidden')+' onchange="ambSet(this.value)">'+Object.entries(AMB).map(([k,v])=>'<option value="'+k+'" '+(k===ambK?'selected':'')+'>'+v+'</option>').join('')+'</select><div class="sr"><input id="yu" placeholder="YouTubeのリンクでBGMを聴く" style="flex:1;min-width:0;padding:11px;border:1px solid var(--ln);border-radius:12px;background:var(--bg);outline:0"><button class="sub" onclick="yt()">'+ic('music',16)+'再生</button></div></div>'}
function calHTML(){const y=cal.getFullYear(),m=cal.getMonth(),off=(new Date(y,m,1).getDay()+6)%7,days=new Date(y,m+1,0).getDate(),key=d=>d.getFullYear()+'-'+f2(d.getMonth()+1)+'-'+f2(d.getDate());
let h='<div class="cal-h"><button onclick="calGo(-1)">'+ic('prev')+'</button><b>'+y+'年'+(m+1)+'月</b><button onclick="calGo(1)">'+ic('next')+'</button></div><div class="cal">'+[...'月火水木金土日'].map(x=>'<i>'+x+'</i>').join('');
for(let i=0;i<off;i++)h+='<span></span>';
for(let d=1;d<=days;d++){const k=y+'-'+f2(m+1)+'-'+f2(d),v=D.log[k];h+='<button class="'+(k===today()?'td ':'')+(k===selDay?'sel':'')+'" onclick="selD(\''+k+'\')">'+d+'<small>'+(v?Math.round(v/60)+'分':'')+'</small></button>'}
const sd=new Date(selDay+'T00:00:00'),ws=new Date(sd);ws.setDate(sd.getDate()-(sd.getDay()+6)%7);let wk=0;for(let i=0;i<7;i++){const d=new Date(ws);d.setDate(ws.getDate()+i);wk+=D.log[key(d)]||0}
return h+'</div>'+row(selDay+' の学習',dur(D.log[selDay]||0))+row('その週（月〜日）',dur(wk))+row('これまでの合計',(Object.values(D.log).reduce((a,b)=>a+b,0)/3600).toFixed(1)+'時間')}
const calGo=n=>{cal=new Date(cal.getFullYear(),cal.getMonth()+n,1);render()},selD=k=>{selDay=k;render()};
function setHTML(){const c=C();return'<button class="x" onclick="P=null;render()">'+ic('x',18)+'</button><h2>表示と設定</h2><p class="mut">読みやすさも、自分好みに。</p><label class="f">フォント<select onchange="setC(\'ff\',this.value)">'+[['g','游ゴシック（標準）'],['m','游明朝'],['r','ヒラギノ丸ゴ']].map(([k,l])=>'<option value="'+k+'" '+(c.ff===k?'selected':'')+'>'+l+'</option>').join('')+(c.ff==='u'?'<option value="u" selected>読み込んだフォント</option>':'')+'</select></label><div class="prev">今日も、ひとつずつ。<b>25:00</b></div><label class="f">フォントファイルを読み込む（TTF / OTF / WOFF）<input type="file" accept=".ttf,.otf,.woff,.woff2" onchange="font(this)"></label><p class="mut">読み込んだフォントは、ページを開き直すと標準に戻ります。</p><div class="cols">'+[['ac','アクセント','#f4d56e'],['bg','背景','#f8f7f3'],['fg','文字','#33342e']].map(([k,l,d])=>'<label class="f">'+l+'<input type="color" value="'+(c[k]||d)+'" oninput="setCol(\''+k+'\',this.value)"></label>').join('')+'</div><button class="sub" onclick="resetCol()">'+ic('reset',16)+'標準の色に戻す</button><div class="row" style="margin-top:20px"><b>端末内のデータ管理</b></div><p class="mut" style="margin-bottom:12px">課題・学習記録・設定はこの端末に保存します。他の端末とは同期しません。</p><button class="sub dg" data-ns onclick="wipe()">'+ic('trash',16)+'すべてのデータを消去</button>'}
function addHTML(){const t=(k,l)=>'<button class="'+(AT===k?'on':'')+'" onclick="addTab(\''+k+'\')">'+l+'</button>',hd=k=>AT===k?'':' hidden';
return'<button class="x" onclick="A=false;render()">'+ic('x',18)+'</button><h2>学習キューに追加</h2><div class="tabs sm">'+t('t','課題')+t('s','Split')+t('k','SmartSplit')+'</div>'
+'<div id="pn-t"'+hd('t')+'><label class="f">課題名<input id="tn" placeholder="例：英語の宿題"></label></div>'
+'<div id="pn-s"'+hd('s')+'><label class="f">課題名<input id="sn" placeholder="例：英語の宿題"></label><label class="f">分割ラベル（1行につき1つ）<textarea id="sl" placeholder="単語を覚える&#10;問題を解く&#10;答え合わせ"></textarea></label></div>'
+'<div id="pn-k"'+hd('k')+'><label class="f">ワークブック名<input id="wn" placeholder="例：数学ワーク"></label><div class="cols"><label class="f">開始ページ<input id="pa" type="number" min="1" oninput="smartInfo()"></label><label class="f">終了ページ<input id="pb" type="number" min="1" oninput="smartInfo()"></label><label class="f">何ページずつ<input id="ps" type="number" min="1" value="5" oninput="smartInfo()"></label></div><p class="mut" id="si">ページ範囲を入力してください。</p></div>'
+'<div class="mb"><button class="go" style="width:100%" onclick="addSubmit()">'+ic('plus',18)+'キューに追加する</button></div>'}
function render(){const fresh=!$('.ov'),chg=lastMode!==mode;lastMode=mode;const d=new Date().toLocaleDateString('ja-JP',{month:'long',day:'numeric',weekday:'short'}),y=$('#yu')?$('#yu').value:'';
const tab=(k,i,l)=>'<button class="'+(mode===k?'on':'')+'" data-ns onclick="setMode(\''+k+'\')">'+ic(i,18)+l+'</button>';
let h='<div class="wrap"><header class="top"><div class="brand"><img src="data:image/svg+xml,'+encodeURIComponent(LOGO)+'" alt=""><div><b>ひといき</b><small>STUDY AT YOUR PACE</small></div></div><div class="tools"><span class="date">'+ic('cal',16)+'<span>'+d+'</span></span><button class="ib" title="学習カレンダー" onclick="P=\'cal\';render()">'+ic('cal')+'</button><button class="ib" title="表示と設定" onclick="P=\'set\';render()">'+ic('set')+'</button></div></header>'
+'<div class="hero"><h2>今日も、ひとつずつ。</h2><p class="mut">急がなくていい。自分のペースで、はじめよう。</p></div><div class="tabs">'+tab('p','timer','ポモドーロ')+tab('c','glass','カウントアップ')+tab('g','list','ゴール')+'</div>'
+'<div class="grid'+(chg?' in':'')+'"><div>'+(mode==='g'?goalCard():timerCard())+'</div><div class="col">'+(mode==='g'?queue():rhythm())+sound()+'</div></div><div class="foot">この端末に自動保存</div></div>';
if(P)h+='<div class="ov" onclick="if(event.target===this){P=null;render()}"><div class="md">'+(P==='cal'?'<button class="x" onclick="P=null;render()">'+ic('x',18)+'</button><h2>学習カレンダー</h2><p class="mut">「終了」または課題全完了で確定した学習だけを記録します。</p>'+calHTML():setHTML())+'</div></div>';
if(A)h+='<div class="ov" onclick="if(event.target===this){A=false;render()}"><div class="md">'+addHTML()+'</div></div>';
if(M)h+='<div class="ov"><div class="md"><h2>'+M.t+'</h2>'+(M.b?'<p>'+M.b+'</p>':'')+(M.rows?M.rows.map(r=>row(r[0],r[1])).join(''):'')+'<div class="mb">'+M.btns.map((b,i)=>'<button class="'+(b[2]?'go':'sub')+'" style="min-width:0" onclick="closeM('+i+')">'+b[0]+'</button>').join('')+'</div></div></div>';
$('#app').innerHTML=h;if(y&&$('#yu'))$('#yu').value=y;if(fresh)document.querySelectorAll('.ov,.md').forEach(e=>e.classList.add('in'));paint()}
const LOGO='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="24" fill="#f4d56e"/><path d="M32 22h36M32 78h36M36 22v12c0 9 14 12 14 16s-14 7-14 16v12M64 22v12c0 9-14 12-14 16s14 7 14 16v12" fill="none" stroke="#33342e" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
theme();render();
try{if('serviceWorker' in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('sw.js').catch(()=>{})}catch(e){}