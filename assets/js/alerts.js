(() => {
  const inside = parent !== window;
  const selectors = {
    '/modules/transmision/': '#notice, #manualMessage, #manualControlMessage',
    '/modules/disenos/': '#status',
    '/modules/cotizaciones/': '#previewStatus',
  };
  const selector = Object.entries(selectors).find(([path]) => location.pathname.includes(path))?.[1];
  if (inside && selector) {
    document.documentElement.dataset.studioEmbedded = '';
    const last = new WeakMap();
    const observer = new MutationObserver(() => {
      document.querySelectorAll(selector).forEach(node => {
        const message = node.textContent.trim(), previous = last.get(node);
        last.set(node, message);
        if (!message || message === previous || !node.getClientRects().length) return;
        parent.postMessage({type:'studio:alert', message:message.slice(0,400)}, location.origin);
      });
    });
    observer.observe(document.body,{childList:true,characterData:true,subtree:true});

    // A module's iframe can be taller than the actual screen.
    function centerDialogs() {
      const dialogs = document.querySelectorAll('dialog[open]');
      if (!dialogs.length) return;
      const frame = window.frameElement, viewport = parent.visualViewport;
      if (!frame) return;
      const rect = frame.getBoundingClientRect();
      const top = Math.max(0,(viewport?.offsetTop || 0)-rect.top);
      const bottom = Math.min(rect.height,(viewport?.offsetTop || 0)+(viewport?.height || parent.innerHeight)-rect.top);
      if (bottom <= top) return;
      document.documentElement.style.setProperty('--studio-dialog-center', (top+bottom)/2+'px');
      document.documentElement.style.setProperty('--studio-dialog-height', Math.max(0,bottom-top-24)+'px');
    }
    const dialogsObserver = new MutationObserver(centerDialogs);
    dialogsObserver.observe(document.body,{attributes:true,attributeFilter:['open'],subtree:true});
    parent.addEventListener('scroll',centerDialogs,{passive:true});
    parent.addEventListener('resize',centerDialogs);
    parent.visualViewport?.addEventListener('resize',centerDialogs);
    parent.visualViewport?.addEventListener('scroll',centerDialogs);
    window.addEventListener('pagehide',() => {
      parent.removeEventListener('scroll',centerDialogs);
      parent.removeEventListener('resize',centerDialogs);
      parent.visualViewport?.removeEventListener('resize',centerDialogs);
      parent.visualViewport?.removeEventListener('scroll',centerDialogs);
    },{once:true});
  } else if (!inside) {
    const toast = document.createElement('output');
    toast.id = 'studioAlert';
    toast.setAttribute('role','status');
    toast.setAttribute('aria-atomic','true');
    document.body.append(toast);
    let timer, lastMessage = '', lastTime = 0;
    function show(message) {
      if (message === lastMessage && Date.now()-lastTime<2200) return;
      lastMessage=message; lastTime=Date.now();
      const viewport=window.visualViewport;
      toast.style.setProperty('--alert-y', (viewport ? viewport.offsetTop+viewport.height/2 : innerHeight/2)+'px');
      toast.textContent=message;
      toast.dataset.visible='true';
      clearTimeout(timer);
      timer=setTimeout(() => { toast.removeAttribute('data-visible'); toast.textContent=''; },3200);
    }
    function recenter() {
      if (!toast.dataset.visible) return;
      const viewport=window.visualViewport;
      toast.style.setProperty('--alert-y',(viewport ? viewport.offsetTop+viewport.height/2 : innerHeight/2)+'px');
    }
    window.addEventListener('resize',recenter);
    visualViewport?.addEventListener('resize',recenter);
    visualViewport?.addEventListener('scroll',recenter);
    window.addEventListener('message',event => {
      if (event.origin!==location.origin || event.data?.type!=='studio:alert' || typeof event.data.message!=='string') return;
      const source=[...document.querySelectorAll('#frames iframe:not([hidden])')].find(frame => frame.contentWindow===event.source);
      if (!source || !source.getClientRects().length) return;
      const message=event.data.message.trim().slice(0,400);
      if (message) show(message);
    });
  }
})();
