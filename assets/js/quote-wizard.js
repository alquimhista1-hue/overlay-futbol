/* Cotización guiada: conserva el mismo estado y los mismos formatos de exportación. */
window.setupQuoteWizard=function(api){
 const $=id=>document.getElementById(id),editor=$('editor'),grid=editor.querySelector('.editor-grid'),cards=[...grid.children];
 let step=0,serviceIndex=0,pageIndex=0;
 const names=['Cliente','Servicios','Páginas','Resumen'];
 const steps=document.createElement('nav');steps.className='quote-steps';steps.setAttribute('aria-label','Pasos de la cotización');
 steps.innerHTML=names.map((name,i)=>`<button type="button" data-step="${i}"><span>${i+1}</span><small>${name}</small></button>`).join('');
 editor.prepend(steps);
 const prefix=$('recipientPrefix').closest('.field');cards[0].append(prefix);cards[0].insertBefore(prefix,cards[0].querySelector('.field'));
 $('recipientPrefix').setAttribute('list','recipientOptions');const options=document.createElement('datalist');options.id='recipientOptions';options.innerHTML=['Señores','Señor','Señora','Señorita'].map(x=>`<option value="${x}">`).join('');prefix.append(options);
 cards[0].querySelector('h2').textContent='¿A quién va dirigida?';$('clientName').placeholder='Nombre del cliente o empresa';
 cards[1].querySelector('.section-subtext').textContent='Completa un servicio a la vez.';
 const serviceNav=document.createElement('div');serviceNav.className='item-pager';serviceNav.innerHTML='<button type="button" id="serviceBack" aria-label="Servicio anterior">‹</button><select id="serviceSelect" aria-label="Elegir servicio"></select><button type="button" id="serviceForward" aria-label="Servicio siguiente">›</button>';
 $('servicesEditor').before(serviceNav);
 const total=document.createElement('div');total.className='quote-total';total.innerHTML='<span>Total de la cotización</span><strong id="wizardTotal"></strong>';cards[1].append(total);
 const pageNav=document.createElement('div');pageNav.className='item-pager';pageNav.innerHTML='<button type="button" id="pageBack" aria-label="Página anterior">‹</button><select id="pageSelect" aria-label="Elegir página de imágenes"></select><button type="button" id="pageForward" aria-label="Página siguiente">›</button>';
 $('vehicleImageControls').before(pageNav);cards[2].querySelector('.switch-copy small').textContent='Actívalo si esta cotización incluye perifoneo.';
 const summary=document.createElement('div');summary.className='card quote-summary';summary.id='wizardSummary';grid.append(summary);
 cards[3].hidden=true;
 const footer=document.createElement('div');footer.className='wizard-footer';footer.innerHTML='<button type="button" class="btn secondary" id="wizardPrevious">Anterior</button><span id="wizardCount"></span><button type="button" class="btn orange" id="wizardNext">Siguiente</button>';
 editor.append(footer);$('saveStrip').hidden=true;$('saveQuoteBottom').parentElement.hidden=true;
 const save=$('saveChanges'),reset=$('resetAll');save.textContent='Guardar cotización';summary.append(save,reset);
 const money=n=>'Q '+Number(n||0).toLocaleString('es-GT',{minimumFractionDigits:2,maximumFractionDigits:2});
 function updateTotals(){const state=api.getState();$('wizardTotal').textContent=money(state.services.reduce((n,s)=>n+Number(s.price||0),0));}
 function renderServices(){const rows=[...$('servicesEditor').children];serviceIndex=Math.min(serviceIndex,Math.max(0,rows.length-1));rows.forEach((r,i)=>r.hidden=i!==serviceIndex);$('serviceSelect').replaceChildren(...rows.map((r,i)=>new Option('Servicio '+(i+1),String(i))));$('serviceSelect').value=String(serviceIndex);$('serviceBack').disabled=serviceIndex===0;$('serviceForward').disabled=serviceIndex>=rows.length-1;updateTotals();}
 function renderPages(){const enabled=$('vehicleEnabled').checked;cards[2].classList.toggle('vehicle-off',!enabled);const rows=[...$('customPagesEditor').children],choices=[...(enabled?[{label:'Perifoneo',node:$('vehicleImageControls')}]:[]),...rows.map((node,i)=>({label:'Página adicional '+(i+1),node}))];pageIndex=Math.min(pageIndex,Math.max(0,choices.length-1));rows.forEach(r=>r.hidden=true);$('vehicleImageControls').hidden=true;if(choices[pageIndex])choices[pageIndex].node.hidden=false;pageNav.hidden=choices.length<2;$('pageSelect').replaceChildren(...choices.map((p,i)=>new Option(p.label,String(i))));$('pageSelect').value=String(pageIndex);$('pageBack').disabled=pageIndex===0;$('pageForward').disabled=pageIndex>=choices.length-1;}
 function renderSummary(){const state=api.getState();summary.replaceChildren();const title=document.createElement('h2');title.textContent='Revisa tu cotización';summary.append(title);const dl=document.createElement('dl');const rows=[['Destinatario',[state.form.recipientPrefix,state.form.clientName].filter(Boolean).join(' ')],...state.services.map((s,i)=>['Servicio '+(i+1),[s.highlight,s.description].filter(Boolean).join(' · ')+' — '+money(s.price)]),['Total',money(state.services.reduce((n,s)=>n+Number(s.price||0),0))],['Perifoneo',state.vehicle.enabled?'Incluido':'No incluido'],['Páginas adicionales',String(state.customPages.filter(p=>p.images.some(Boolean)).length)]];for(const [label,value] of rows){const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=value;dl.append(dt,dd)}summary.append(dl,save,reset);}
 function valid(){if(step===0&&!$('clientName').value.trim()){$('clientName').reportValidity();$('clientName').focus();return false}if(step===1){const invalid=[...$('servicesEditor').querySelectorAll('input[type="number"]')].find(input=>!input.validity.valid);if(invalid){serviceIndex=+invalid.dataset.index;renderServices();invalid.reportValidity();return false}}return true;}
 $('clientName').required=true;
 function show(next){step=Math.max(0,Math.min(3,next));[...cards.slice(0,3),summary].forEach((card,i)=>card.hidden=i!==step);steps.querySelectorAll('button').forEach((button,i)=>{button.classList.toggle('current',i===step);button.classList.toggle('complete',i<step);button.setAttribute('aria-current',i===step?'step':'false');button.querySelector('span').textContent=i<step?'✓':i+1});$('wizardPrevious').disabled=step===0;$('wizardCount').textContent=(step+1)+' de 4';$('wizardNext').textContent=step===3?'Ver hoja':'Siguiente';if(step===3)renderSummary();renderServices();renderPages();editor.dataset.step=String(step);}
 $('wizardPrevious').onclick=()=>show(step-1);$('wizardNext').onclick=()=>{if(!valid())return;if(step===3){api.setTab('preview');return}show(step+1)};
 steps.querySelectorAll('button').forEach(button=>button.onclick=()=>{const target=+button.dataset.step;if(target<=step||valid())show(target<=step?target:Math.min(target,step+1))});
 $('serviceSelect').onchange=e=>{serviceIndex=+e.target.value;renderServices()};$('serviceBack').onclick=()=>{serviceIndex--;renderServices()};$('serviceForward').onclick=()=>{serviceIndex++;renderServices()};
 $('addService').addEventListener('click',()=>{serviceIndex=api.getState().services.length-1;renderServices()});
 $('pageSelect').onchange=e=>{pageIndex=+e.target.value;renderPages()};$('pageBack').onclick=()=>{pageIndex--;renderPages()};$('pageForward').onclick=()=>{pageIndex++;renderPages()};$('addPage').addEventListener('click',()=>{pageIndex=api.getState().customPages.length;renderPages()});
 editor.addEventListener('input',updateTotals);$('vehicleEnabled').addEventListener('change',renderPages);
 new MutationObserver(renderServices).observe($('servicesEditor'),{childList:true});new MutationObserver(renderPages).observe($('customPagesEditor'),{childList:true});
 window.resetQuoteWizard=()=>{serviceIndex=0;pageIndex=0;show(0)};
 const syncMode=()=>document.body.classList.toggle('wizard-mode',editor.classList.contains('active'));
 new MutationObserver(syncMode).observe(editor,{attributes:true,attributeFilter:['class']});syncMode();show(0);
};
