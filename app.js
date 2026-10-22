'use strict';
const {scenarios,economics}=LongxingModel;
const strategies={forward:{name:'期现正套',modes:['real','rise','give','loss'],steps:['看报价','算基差','买货卖期','基差变化','卖货平仓','核算收益']},reverse:{name:'期现反套',modes:['reverse','reverseGive','reverseLoss'],steps:['看报价','算基差','卖货买期','基差变化','补货平仓','核算收益']}};
let strategy='forward',mode='real',step=0;
const $=id=>document.getElementById(id);
const n=x=>String(Number(x.toFixed(2))).replace('-','−');
const signed=x=>(x>0?'+':'')+n(x);
const tone=x=>x<0?'negative':'positive';
function basisEquation(s,f,label){
  return '<div class="formula-title">基差 = 现货价格 − 期货价格</div><div class="basis-equation"><div class="term"><label>现货价格</label><strong>'+n(s)+'</strong><small>元 / 吨</small></div><span class="operator" aria-label="减">−</span><div class="term future"><label>期货价格</label><strong>'+n(f)+'</strong><small>元 / 吨</small></div></div><div class="basis-answer"><span class="operator" aria-label="等于">=</span><label>'+label+'</label><strong>'+n(s-f)+'</strong><em>元/吨</em></div>';
}
function equation(a,op,b,result,la,lb){
  return '<div class="profit-equation"><div class="operand"><strong>'+n(a)+'</strong><small>'+la+'</small></div><span class="operator">'+op+'</span><div class="operand"><strong>'+n(b)+'</strong><small>'+lb+'</small></div><span class="operator">=</span><div class="operand answer"><strong class="'+tone(result)+'">'+signed(result)+'</strong><small>元 / 吨</small></div></div>';
}
function basisProfit(m,e){
  const reverse=m.strategy==='reverse';
  return equation(reverse?e.b0:e.b1,'−',reverse?e.b1:e.b0,e.gross,reverse?'建仓基差':'离场基差',reverse?'离场基差':'建仓基差');
}
function legs(m,e){
  const r=m.strategy==='reverse';
  return '<div class="leg-list">'+leg(r?'现货轮换差额':'现货盈亏',r?'先卖价 − 后买回价':'后卖价 − 先买价',r?m.s0:m.s1,r?m.s1:m.s0,e.spot)+leg('期货盈亏',r?'后卖出平仓价 − 先买入开仓价':'先卖出开仓价 − 后买入平仓价',r?m.f1:m.f0,r?m.f0:m.f1,e.futures)+'</div>';
}
function leg(label,rule,a,b,result){
  return '<div class="leg"><label>'+label+'</label><div class="leg-rule">'+rule+'</div><div class="leg-equation">'+n(a)+' − '+n(b)+' = <b class="'+tone(result)+'">'+signed(result)+'</b></div></div>';
}
function market(label,kind,price,detail){
  return '<div class="market '+kind+'"><div class="market-label">'+label+'<small>'+detail+'</small></div><div class="price">'+n(price)+'<em>元 / 吨</em></div><p>建仓时的报价</p></div>';
}
function trade(label,kind,action,price,from,to,note){
  return '<div class="trade '+kind+'"><label>'+label+'</label><h3>'+action+'</h3><div class="trade-price">'+n(price)+' <small>元 / 吨</small></div><div class="flow"><span>'+from+'</span><b>→</b><span>'+to+'</span></div><p>'+note+'</p></div>';
}
function render(){
  const m=scenarios[mode],e=economics(m),r=strategy==='reverse',s=strategies[strategy];
  $('modes').dataset.count=s.modes.length;
  $('modes').innerHTML=s.modes.map(key=>'<button data-mode="'+key+'" aria-pressed="'+(key===mode)+'">'+scenarios[key].name+'</button>').join('');
  document.querySelectorAll('[data-strategy]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.strategy===strategy)));
  $('steps').innerHTML=s.steps.map((name,i)=>'<button data-step="'+i+'" class="'+(i===step?'active':i<step?'done':'')+'" aria-label="第'+(i+1)+'步：'+name+'" '+(i===step?'aria-current="step"':'')+'><span class="num">'+(i+1)+'</span><span>'+name+'</span></button>').join('');
  $('sceneLabel').textContent=s.name+' · '+m.source;
  $('stepCount').textContent=(step+1)+' / 6';
  const trend=e.change>0?'走强':e.change<0?'走弱':'不变';
  const outcome=e.gross>0?'浮盈':e.gross<0?'浮亏':'盈亏平衡';
  const titles=['一批钢材，两个市场报价','看清这道减法，就是基差',r?'卖出现货，同时买入期货':'买入现货，同时卖出期货','过一段时间，基差'+trend,r?'买回现货，期货卖出平仓':'卖出现货，期货买入平仓','两种算法，算出同一笔收益'];
  const descriptions=[
    m.intro,
    '两种策略都用同一个定义：现货减期货。'+(e.b0>0?'本例现货比期货贵，建仓基差为正。':'基差保留正负号，不能取绝对值。'),
    r?'以现有可卖库存为前提，卖出现货并建立等量期货多头。以后需补回同量同质库存。':mode==='real'?'从采购的16,000吨中，拿5,000吨做等量卖出期货套保。货在仓库，合约在期货账户。':'现货买进来，期货卖出开仓。两个市场按相同数量配对，后续分别结束。',
    '现货价格变动 '+signed(m.s1-m.s0)+'，期货价格变动 '+signed(m.f1-m.f0)+' 元/吨。基差由 '+n(e.b0)+' 变为 '+n(e.b1)+'，'+s.name+'组合此时'+outcome+'。',
    r?'现货买回，恢复原来的库存数量；卖出同一合约平仓，结束期货多头。':'现货卖给下游客户；买入同一合约平仓，结束期货空头。两件事分别完成。',
    '先分别算两笔交易，再用基差验证。下列均为毛收益，尚未扣成本。'+(r?'现货项按“卖出现有库存后买回”的轮换现金差计算。':'')
  ];
  $('title').textContent=titles[step];$('description').textContent=descriptions[step];
  let html='',tip='';
  if(step===0){
    html='<div class="markets">'+market('现货市场','spot',m.s0,'实物钢材')+market('期货市场','future',m.f0,mode==='real'||mode==='give'||mode==='loss'?'01合约':'对应合约')+'</div><div class="next-hint">下一步：<b>'+n(m.s0)+' − '+n(m.f0)+' = ?</b></div>';
    tip=r?'反套先卖现货、买期货，目标是基差数值下降。':'正套先买现货、卖期货，目标是基差数值上升。';
  }else if(step===1){
    html=basisEquation(m.s0,m.f0,'建仓基差');
    tip='这里的 '+n(e.b0)+' 元/吨是两个报价的差，不是已经赚到的钱。';
  }else if(step===2){
    html='<div class="trade-grid">'+(r?
      trade('现货这边','spot','卖出现有库存',m.s0,'隆兴库存','下游客户','现在卖出钢材，之后再采购补回。<strong>先有可履约的库存或货源。</strong>')+
      trade('期货这边','future','买入开仓 · 持有多头',m.f0,'先买合约','以后卖出平仓','“多头”就是先买期货合约。<strong>期货涨了有利，跌了不利。</strong>'):
      trade('现货这边','spot','采购钢材 · 持有库存',m.s0,'上游供应商','隆兴库存','钢材买入后，库存仍由隆兴持有，等待后续销售。')+
      trade('期货这边','future','卖出开仓 · 持有空头',m.f0,'先卖合约','以后买入平仓','“空头”就是先卖期货合约。<strong>期货跌了有利，涨了不利。</strong>'))+'</div>';
    html+='<div class="plain-note"><b>'+(r?'多头也不等于现在拿到了钢材。':'空头不等于已经把库存钢材卖给了客户。')+'</b> 期货开仓交易的是合约，需要保证金；平仓用反向合约交易结束持仓，不是交付或买回实物。</div><div class="mini-formula">建仓基差：<b>'+n(m.s0)+' − '+n(m.f0)+' = '+n(e.b0)+'</b> 元/吨</div>';
    tip=r?'卖现货 ＋ 买期货：期货多头对冲未来补货涨价的一部分风险，仍承担基差与履约风险。':'买现货 ＋ 卖期货：期货空头对冲库存跌价的一部分风险，仍承担基差风险。';
  }else if(step===3){
    html='<div class="mini-formula">建仓时：<b>'+n(m.s0)+' − '+n(m.f0)+' = '+n(e.b0)+'</b></div>'+basisEquation(m.s1,m.f1,'当前基差')+'<div class="basis-track"><div><label>建仓</label><strong>'+n(e.b0)+'</strong></div><span>→</span><div><label>当前 · '+trend+'</label><strong>'+n(e.b1)+'</strong></div></div><div class="floating"><h3>如果现在同时退出，组合毛收益</h3>'+basisProfit(m,e)+'<p>此处“离场基差”按当前报价假设，尚未完成销售与平仓。</p></div>';
    tip=(r?'反套看“建仓 − 离场”：':'正套看“离场 − 建仓”：')+(e.gross>=0?'本情景'+trend+'带来每吨'+n(e.gross)+'元毛收益。':'基差方向不利，每吨毛亏'+n(-e.gross)+'元。')+' 下一步实际退出。';
  }else if(step===4){
    html='<div class="trade-grid">'+(r?
      trade('现货这边','spot','买回钢材 · 恢复库存',m.s1,'上游供应商','隆兴库存','先卖 '+n(m.s0)+'，后买回 '+n(m.s1)+'。轮换差额 '+signed(e.spot)+' 元/吨。')+
      trade('期货这边','future','卖出平仓 · 多头归零',m.f1,'卖出同一合约','结束多头','先买 '+n(m.f0)+'，后卖 '+n(m.f1)+'。期货盈亏 '+signed(e.futures)+' 元/吨。'):
      trade('现货这边','spot','销售钢材 · 交付客户',m.s1,'隆兴库存','下游客户','先买 '+n(m.s0)+'，后卖 '+n(m.s1)+'。现货盈亏 '+signed(e.spot)+' 元/吨。')+
      trade('期货这边','future','买入平仓 · 空头归零',m.f1,'买入同一合约','结束空头','先卖 '+n(m.f0)+'，后买 '+n(m.f1)+'。期货盈亏 '+signed(e.futures)+' 元/吨。'))+'</div><div class="mini-formula">离场基差：<b>'+n(m.s1)+' − '+n(m.f1)+' = '+n(e.b1)+'</b> 元/吨</div>';
    tip='先卖后买：先卖价减后买价；先买后卖：后卖价减先买价。下一步把两笔盈亏相加。';
  }else{
    html='<section class="method"><h3><span class="method-tag">算法一</span>现货盈亏 ＋ 期货盈亏</h3>'+legs(m,e)+equation(e.spot,e.futures>=0?'＋':'−',Math.abs(e.futures),e.gross,r?'现货轮换差额':'现货盈亏',e.futures<0?'期货亏损':'期货盈利')+'</section><section class="method"><h3><span class="method-tag">算法二</span>'+ (r?'建仓基差 − 离场基差':'离场基差 − 建仓基差')+'</h3>'+basisProfit(m,e)+'</section><p class="equality-note">两笔盈亏之和 = '+(r?'建仓基差 − 离场基差':'离场基差 − 建仓基差')+'，两种算法相等。</p>';
    html+='<div class="result"><div><label>'+s.name+' · 每吨毛'+(e.gross<0?'亏损':'收益')+'</label><strong>'+signed(e.gross)+' <em>元/吨</em></strong><p>尚未扣成本'+(mode==='real'?'，未考虑合作分成':'')+'</p></div><div>'+(m.quantity?'<div class="amount-eq">'+n(e.gross)+' × 5,000 = '+(e.gross*5000).toLocaleString('zh-CN')+' 元</div><p>合计'+(e.gross<0?'毛亏':'毛赚')+n(Math.abs(e.gross*5000/10000))+'万元</p>':'<p>PPT教学示例按每吨演示</p><p>总收益 = 每吨收益 × 实际数量</p>')+'</div></div>';
    tip=mode==='give'?'26 − 10 − 10 = 6元/吨。其他成本低于6元/吨时，净收益才为正。':mode==='reverseGive'?'130 − 10 − 10 = 110元/吨。其他成本低于110元/吨时，净收益才为正。':r?'反套希望基差走弱。现货轮换差额不包含原库存历史成本对应的会计利润。':mode==='rise'?'现货、期货都涨，正套也能盈利：现货多赚210，期货亏130，合计80元/吨。':'判断收益要把两笔合起来看。净收益还要继续减去资金、仓储、运输、手续费等成本。';
  }
  $('visual').innerHTML=html;$('takeaway').textContent=tip;$('prev').disabled=step===0;
  $('next').innerHTML=(step===5?'再讲一遍':'下一步')+' <span aria-hidden="true">'+(step===5?'↺':'→')+'</span>';
  updateCost();
  for(const id of ['narrative','visual']){$(id).classList.remove('animate');void $(id).offsetWidth;$(id).classList.add('animate')}
}
function updateCost(){
  const input=$('cost'),cost=Number(input.value),m=scenarios[mode];
  $('costScenario').textContent=strategies[strategy].name+' · '+m.name;
  $('netTotalBox').hidden=m.quantity==null;
  if(input.value===''||!Number.isFinite(cost)||cost<0||cost>10000){input.setCustomValidity('请输入0至10000之间的成本');$('costHint').textContent='请输入0至10000之间的有效成本。';$('netTon').textContent='—';$('netTotal').textContent='—';return}
  input.setCustomValidity('');const e=economics(m,cost);
  $('netTon').textContent=signed(e.net)+' 元';$('netTotal').textContent=e.total==null?'—':signed(e.total/10000)+' 万元';
  $('netTon').className=$('netTotal').className=tone(e.net);
  $('costHint').textContent=n(e.gross)+' − '+n(cost)+' = '+n(e.net)+'元/吨。'+(e.net>0?'扣成本后盈利。':e.net===0?'恰好盈亏平衡。':'扣成本后亏损。')+(cost===0?'默认成本为0，不代表实际没有成本。':'');
}
function go(next,top=false){step=next;render();if(top)window.scrollTo({top:0,behavior:'instant'});else document.querySelector('.stage').scrollIntoView({block:'start',behavior:'instant'})}
$('next').onclick=()=>go((step+1)%6);$('prev').onclick=()=>go(Math.max(0,step-1));$('replay').onclick=()=>go(0);
$('steps').onclick=e=>{const b=e.target.closest('[data-step]');if(b)go(+b.dataset.step)};
$('modes').onclick=e=>{const b=e.target.closest('[data-mode]');if(b){mode=b.dataset.mode;go(0,true)}};
document.querySelectorAll('[data-strategy]').forEach(b=>b.onclick=()=>{strategy=b.dataset.strategy;mode=strategies[strategy].modes[0];go(0,true)});
$('cost').oninput=updateCost;
function openDialog(id){$(id).showModal()}
$('help').onclick=()=>openDialog('helpDialog');$('economics').onclick=()=>openDialog('infoDialog');
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>b.closest('dialog').close());
document.querySelectorAll('dialog').forEach(d=>d.onclick=e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close()}});
$('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen()}catch{openDialog('helpDialog')}};
document.addEventListener('fullscreenchange',()=>{$('fullscreen').textContent=document.fullscreenElement?'退出全屏':'全屏'});
document.addEventListener('keydown',e=>{if(document.querySelector('dialog[open]')||/INPUT|BUTTON|SUMMARY|TEXTAREA/.test(e.target.tagName))return;if(e.key==='ArrowRight'){e.preventDefault();$('next').click()}if(e.key==='ArrowLeft'){e.preventDefault();$('prev').click()}});
let installPrompt;window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;$('installApp').hidden=false});
$('installApp').onclick=async()=>{if(installPrompt){await installPrompt.prompt();installPrompt=null;$('installApp').hidden=true}};
let offlineReady=false;function status(message){$('offlineStatus').textContent=message;$('offlineDetail').textContent=message}
function cacheStatus(){if(location.protocol==='file:'){status('独立文件 · 可离线打开');return}if(!('serviceWorker' in navigator)){status('本浏览器暂不支持离线保存');return}const worker=navigator.serviceWorker.controller;if(!worker){status('正在准备离线版…');return}worker.postMessage({type:'CACHE_STATUS'})}
$('offlineCheck').onclick=cacheStatus;
if(location.protocol!=='file:'&&'serviceWorker' in navigator){
  const alreadyControlled=!!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('message',e=>{if(e.data?.type==='CACHE_STATUS'){offlineReady=!!e.data.ready;status(offlineReady?(navigator.onLine?'已备好离线版':'离线讲解中'):'离线保存未完成，请联网重新打开')}});
  navigator.serviceWorker.addEventListener('controllerchange',()=>{if(alreadyControlled)location.reload();else cacheStatus()});
  navigator.serviceWorker.register('sw.js').then(()=>navigator.serviceWorker.ready).then(cacheStatus).catch(()=>status('离线保存未完成 · 当前可联网使用'));
}else cacheStatus();
window.addEventListener('offline',()=>status(offlineReady?'离线讲解中':'当前页面可继续讲解'));window.addEventListener('online',cacheStatus);render();
