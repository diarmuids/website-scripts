// Last updated: 2026-09-12 15:55:20

(()=>{
  let d=document,h=d.documentElement,b='[data-testid="dashboard-options-menu"]';
  addEventListener('keydown',e=>{
    let plain=!e.shiftKey&&!e.altKey&&!e.ctrlKey&&!e.metaKey,
        shift=e.shiftKey&&!e.altKey&&!e.ctrlKey&&!e.metaKey,
        alt=e.altKey&&!e.shiftKey&&!e.ctrlKey&&!e.metaKey;
    if(e.key.toLowerCase()!='v'||(!plain&&!shift&&!alt)||e.target.closest('input,textarea,select,[contenteditable="true"]'))return;
    e.preventDefault();
    let m=d.querySelector(b);
    if(!m)return;
    h.classList.add('o');
    if(m.ariaExpanded!='true')m.click();
    let tries=0,find=()=>{
      let id=m.getAttribute('aria-controls'),p=id&&d.getElementById(id);
      if(!p||!p.querySelector('[data-testid="graph-interval"],[data-testid="current-graph-interval"]')){
        if(++tries<30)return requestAnimationFrame(find);
        h.classList.remove('o');return;
      }
      let x=[...p.querySelectorAll('[data-testid="graph-interval"],[data-testid="current-graph-interval"]')],
          i=x.findIndex(v=>v.getAttribute('aria-pressed')=='true'||v.dataset.selected=='true'),
          n=x[(i+1)%x.length];
      if(n){
        n.click();
        let t=d.querySelector('#ogt')||Object.assign(d.body.appendChild(d.createElement('div')),{id:'ogt'});
        t.textContent='Graph interval: '+n.textContent.trim();
        t.style.opacity=1;t.style.transform='translateY(0)';
        clearTimeout(window.ogtt);
        window.ogtt=setTimeout(()=>{t.style.opacity=0;t.style.transform='translateY(-6px)'},900);
      }
      m.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));
      d.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));
      m.blur();
      setTimeout(()=>h.classList.remove('o'),120);
    };
    requestAnimationFrame(find);
  });
})();
