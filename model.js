(function(root) {
  'use strict';
  const scenarios = {
    real: {strategy:'forward',name:'2022真实案例',s0:3960,s1:3816,f0:3886,f1:3716,quantity:5000,source:'PPT 第14–15页 · 隆兴真实业务',intro:'2022年采购1.6万吨，其中5,000吨参与期现正套。其余11,000吨不计入本次测算。'},
    rise: {strategy:'forward',name:'同涨也能赚',s0:3890,s1:4100,f0:3820,f1:3950,quantity:null,source:'PPT 第13、16页 · 教学示例',intro:'现货和期货都上涨，也可能盈利。关键在于现货相对期货更强，基差从70走强到150。'},
    give: {strategy:'forward',name:'贵买10 · 便宜卖10',s0:3970,s1:3806,f0:3886,f1:3716,quantity:5000,source:'基于真实案例的教学假设 · 双向让利',intro:'比原案例贵10元采购、便宜10元销售，期货成交价不变。20元让利将每吨毛收益从26元压缩到6元。'},
    loss: {strategy:'forward',name:'亏损情景',s0:3960,s1:3756,f0:3886,f1:3716,quantity:5000,source:'教学假设 · 正套遇到基差走弱',intro:'建仓动作相同，但退出时基差走弱。正套同样可能亏损。'},
    reverse: {strategy:'reverse',name:'PPT反套示例',s0:4050,s1:3900,f0:3800,f1:3780,quantity:null,source:'PPT 第13、17页 · 教学示例',intro:'卖出现有库存，同时买入期货。之后补回同量同质库存，并卖出期货平仓。按每吨演示，不套用真实案例的5,000吨。'},
    reverseGive: {strategy:'reverse',name:'双向让利',s0:4040,s1:3910,f0:3800,f1:3780,quantity:null,source:'基于PPT反套示例的教学假设',intro:'先卖现货时便宜10元，后买回现货时贵10元，期货价格不变。每吨毛收益由130元减至110元。'},
    reverseLoss: {strategy:'reverse',name:'亏损情景',s0:4050,s1:4100,f0:3800,f1:3780,quantity:null,source:'教学假设 · 反套遇到基差走强',intro:'先卖现货、买期货，但随后现货涨、期货跌，基差从250走强到320。反套出现亏损。'}
  };
  function economics(m,cost=0) {
    const direction=m.strategy==='reverse'?-1:1;
    const spot=direction*(m.s1-m.s0), futures=direction*(m.f0-m.f1);
    const b0=m.s0-m.f0,b1=m.s1-m.f1,gross=spot+futures;
    return {spot,futures,b0,b1,change:b1-b0,gross,basisProfit:direction*(b1-b0),net:gross-cost,total:m.quantity==null?null:(gross-cost)*m.quantity};
  }
  const api={scenarios,economics};
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
  root.LongxingModel=api;
})(typeof globalThis!=='undefined'?globalThis:this);
