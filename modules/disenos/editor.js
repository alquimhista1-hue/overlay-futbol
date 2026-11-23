(() => {
  const W = 1200, H = 1400, PHOTO_H = 875, TOP_BAND = 258, WORD_LIMIT = 20;
  const $ = id => document.getElementById(id);
  const canvas = $('preview'), ctx = canvas.getContext('2d');
  const slots = Array.from({length: 2}, () => ({image: null, x: 50, y: 50, zoom: 100, revision: 0}));
  const controls = [];
  let frameReady = false, footerTop = H;
  const frame = new Image(), logo = new Image();
  const templates = [['classic','Clásica'],['top','Titular arriba']];
  let templateIndex=0, cropEnabled=false;
  const touchDevice=matchMedia('(pointer:coarse), (hover:none)');
  let photoTop = 0, photoHeight = PHOTO_H, titleFits = true;
  const fonts = {1:'700 1px "Oswald"', 2:'700 1px "Fira Sans Condensed"'};
  let fontIndex = 2, fontRevision = 0, fontReady = false;
  function chooseFont(index) {
    fontIndex = index;
    const revision = ++fontRevision;
    fontReady = false;
    document.querySelectorAll('[data-font]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.font) === index)));
    render();
    document.fonts.load(fonts[index], 'Titular español: áéíóúüñ ¿¡').then(() => {
      if (revision !== fontRevision) return;
      fontReady = true;
      render();
    }).catch(() => { if (revision === fontRevision) status('No se pudo cargar la tipografía. Recarga el editor.'); });
  }
  document.querySelectorAll('[data-font]').forEach(button => button.onclick = () => { chooseFont(Number(button.dataset.font)); });
  const status = message => { $('status').textContent = message; };

  function drawPhoto(context, slot, left, width, height, top = 0) {
    const image = slot.image;
    const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight) * slot.zoom / 100;
    const w = image.naturalWidth * scale, h = image.naturalHeight * scale;
    context.save();
    context.beginPath();
    context.rect(left, top, width, height);
    context.clip();
    context.drawImage(image, left - (w - width) * slot.x / 100, top - (h - height) * slot.y / 100, w, h);
    context.restore();
  }

  function wrap(text, limit) {
    const lines = [];
    let line = '';
    for (const word of text.split(/\s+/).filter(Boolean)) {
      const next = line ? line + ' ' + word : word;
      if (ctx.measureText(next).width <= limit) { line = next; continue; }
      if (line) lines.push(line);
      line = '';
      for (const letter of word) {
        if (line && ctx.measureText(line + letter).width > limit) { lines.push(line); line = ''; }
        line += letter;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  function balanceLines(text, limit) {
    const lines = wrap(text, limit);
    if (lines.length < 2) return lines;
    const width = line => ctx.measureText(line).width;
    const last = lines.at(-1), previous = lines.at(-2);
    const widest = Math.max(...lines.map(width));
    // A long final word can already make a good centered line.
    if (width(last) >= widest * .40) return lines;
    const words = previous.split(' ');
    if (text.split(/\s+/).some(word => width(word) > limit)) return lines;
    let best = null, gap = Math.abs(width(previous) - width(last));
    for (let move = 1; move <= 2 && words.length - move >= 2; move++) {
      const upper = words.slice(0, -move).join(' ');
      const lower = words.slice(-move).join(' ') + ' ' + last;
      const up = width(upper), down = width(lower);
      if (down > limit || up < widest * .50) continue;
      const difference = Math.abs(up - down);
      if (difference < gap) { gap = difference; best = [upper, lower]; }
    }
    return best ? [...lines.slice(0, -2), ...best] : lines;
  }

  function fitText(value, width, maxHeight, maxSize, font, maxLines=Infinity) {
    if (!value) return {lines:[], step:0, ascent:0, height:0, font:''};
    for (let size=maxSize; size>0; size--) {
      ctx.font=font(size);
      const lines=balanceLines(value,width);
      if(lines.length>maxLines) continue;
      const metrics=lines.map(line=>ctx.measureText(line));
      const ascent=Math.max(...metrics.map(m=>m.actualBoundingBoxAscent));
      const descent=Math.max(...metrics.map(m=>m.actualBoundingBoxDescent));
      const step=Math.max(Math.ceil(size*1.12),ascent+descent+4);
      const height=ascent+descent+(lines.length-1)*step;
      if (height<=maxHeight) return {lines,step,ascent,height,font:ctx.font};
    }
    return {lines:[],height:0,font:''};
  }
  function paintText(layout, x, top, align, color) {
    if (!layout.lines.length) return;
    ctx.font=layout.font; ctx.textBaseline='alphabetic'; ctx.textAlign=align;
    ctx.fillStyle=color;
    layout.lines.forEach((line,i)=>ctx.fillText(line,x,top+layout.ascent+i*layout.step));
  }
  function paintLogo(x,y){
    if(!logo.complete || !logo.naturalWidth)return;
    // The OBS asset is transparent outside the logo; use only its logo region.
    ctx.drawImage(logo,1056,56,184,120,x,y,168,110);
  }
  function renderTop(headline, loaded, width) {
    ctx.fillStyle='#fff';ctx.fillRect(0,0,W,H);
    const text=headline.toLocaleUpperCase('es');
    const margin=76;
    const title=fitText(text,W-2*margin,TOP_BAND-64,64,size=>fonts[fontIndex].replace("1px",size+"px")+", sans-serif",3);
    titleFits=!text || !!title.lines.length;
    photoTop=TOP_BAND; photoHeight=H-photoTop;
    ctx.fillStyle='#e7edf5';ctx.fillRect(0,photoTop,W,photoHeight);
    loaded.forEach((slot,i)=>drawPhoto(ctx,slot,i*width,width,photoHeight,photoTop));
    paintText(title,margin,(TOP_BAND-title.height)/2,'left','#111');
    paintLogo(W-220,photoTop+34);
  }

  function render() {
    const loaded = slots.filter(slot => slot.image);
    const width = W / Math.max(1, loaded.length);
    const headline = $('headline').value.trim(), template = templates[templateIndex][0];
    photoTop = 0; photoHeight = PHOTO_H; titleFits = true;
    const wordCount = headline ? headline.split(/\s+/).length : 0;
    const withinLimit = wordCount <= WORD_LIMIT;
    if (template === 'classic') {
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#e7edf5'; ctx.fillRect(0, 0, W, PHOTO_H);
      loaded.forEach((slot, i) => drawPhoto(ctx, slot, i * width, width, PHOTO_H));
      const gray = ctx.createLinearGradient(0, PHOTO_H, 0, H); gray.addColorStop(0, '#e4e7eb'); gray.addColorStop(1, '#f9fafb'); ctx.fillStyle = gray; ctx.fillRect(0, PHOTO_H, W, H - PHOTO_H); ctx.fillStyle = '#122238'; ctx.fillRect(0, PHOTO_H, W, 8);
      if (headline) {
        // Export margins are measured in canvas pixels, not interface spacing.
        const top = PHOTO_H + 52;
        const textWidth = W - 2 * 120;
        const bottom = Math.max(top + 1, footerTop - 48);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';
        for (let size = 94; size >= 1; size--) {
          ctx.font = fonts[fontIndex].replace("1px", size + "px") + ", sans-serif";
          const lines = balanceLines(headline, textWidth);
          const metrics = lines.map(line => ctx.measureText(line));
          const above = Math.max(...metrics.map(m => m.actualBoundingBoxAscent));
          const below = Math.max(...metrics.map(m => m.actualBoundingBoxDescent));
          const step = Math.max(Math.ceil(size * 1.10), above + below + 4);
          const height = above + below + (lines.length - 1) * step;
          if (height > bottom - top) continue;
          const first = top + (bottom - top - height) / 2 + above;
          lines.forEach((line, i) => ctx.fillText(line, W / 2, first + i * step));
          break;
        }
      }
      if (frameReady) ctx.drawImage(frame, 0, 0, W, H);
    } else {
      renderTop(headline, loaded, width);
    }
    $('touchArea').style.setProperty('--photo-top', photoTop/H*100+'%');
    $('touchArea').style.setProperty('--photo-height', photoHeight/H*100+'%');
    slots.forEach((slot, i) => {
      controls[i].remove.hidden = !slot.image;
      controls[i].card.hidden = !slot.image;
      if (controls[i].thumbnailImage !== slot.image) {
        controls[i].thumbnailImage = slot.image;
        if (slot.image) {
          const thumbnail = document.createElement('canvas');
          thumbnail.width = 160; thumbnail.height = 120;
          thumbnail.getContext('2d').drawImage(slot.image, 0, 0, 160, 120);
          controls[i].thumbnail.src = thumbnail.toDataURL('image/jpeg', 0.8);
        } else controls[i].thumbnail.removeAttribute('src');
      }
    });
    $('templateName').textContent = templates[templateIndex][1];
    if(!loaded.length)cropEnabled=false;
    $('cropToggle').hidden = !loaded.length || !touchDevice.matches;
    $('cropToggle').setAttribute('aria-pressed',String(cropEnabled));
    $('cropToggle').textContent = cropEnabled ? 'Terminar encuadre' : 'Encuadrar foto';
    $('touchArea').hidden = !loaded.length || (touchDevice.matches && !cropEnabled);
    const message = !withinLimit ? 'Acorta el titular. Máximo 20 palabras.' :
      !titleFits ? 'Acorta el titular para que quepa.' : '';
    const limit = $('titleLimit');
    if (limit.textContent !== message) limit.textContent = message;
    limit.hidden = !message;
    $('headline').setAttribute('aria-invalid', String(!withinLimit || !titleFits));
    $('download').disabled = !loaded.length || !headline || (template === "classic" && !frameReady) || !withinLimit || !titleFits || !fontReady;
  }

  function decode(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file), image = new Image();
      image.onload = () => { URL.revokeObjectURL(url); resolve(image); };
      image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Imagen no compatible')); };
      image.src = url;
    });
  }

  function resetCrop(i) {
    Object.assign(slots[i], {x: 50, y: 50, zoom: 100});

  }
  function removePhoto(i) {
    slots[i].revision++;
    slots[i].image = null;
    if (controls[i].file) controls[i].file.value = '';
    resetCrop(i);
  }

  slots.forEach((slot, i) => {
    const card = document.createElement('article');
    card.className = 'photo-card';
    card.hidden = true;
    card.innerHTML = '<img class="photo-thumbnail" alt="Foto '+(i+1)+'"><div class="photo-actions"><label class="upload">Cambiar<input type="file" accept="image/*" aria-label="Cambiar foto '+(i+1)+'"></label><button type="button" class="remove">Quitar</button></div>';
    $('photos').append(card);
    const file=card.querySelector('input'), remove=card.querySelector('.remove');
    controls.push({card,file,remove,thumbnail:card.querySelector('img')});
    file.addEventListener('change', () => {
      const selected=file.files[0];file.value='';
      if(selected) loadPhotos([selected],i);
    });
    remove.onclick=()=>{removePhoto(i);status('');render();};
  });

  async function loadPhotos(files, target) {
    const selected=Array.from(files);
    if(selected.length>2){status('Selecciona un máximo de dos fotos.');return;}
    if(!selected.length)return;
    const indices=target===undefined?selected.map((_,i)=>i):[target];
    const revisions=indices.map(i=>++slots[i].revision);
    // A batch replaces the complete selection, including pending image loads.
    if(target===undefined && selected.length===1) removePhoto(1);
    try {
      const images=await Promise.all(selected.map(decode));
      images.forEach((image,j)=>{
        const i=indices[j];
        if(slots[i].revision!==revisions[j])return;
        slots[i].image=image;resetCrop(i);
      });
      clearGesture();status('');render();
    } catch {
      status('No se pudieron abrir las fotos. Prueba con JPG, PNG o WebP.');
    }
  }
  $('photoUpload').addEventListener('change',event=>{
    const files=Array.from(event.target.files);event.target.value='';
    loadPhotos(files);
  });
  const touch = $('touchArea'), pointers = new Map();
  let gesture = null;
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  function point(event) {
    const r = touch.getBoundingClientRect();
    return {x: (event.clientX - r.left) * W / r.width, y: (event.clientY - r.top) * photoHeight / r.height};
  }
  function center() {
    const [a,b] = pointers.values();
    return b ? {x:(a.x+b.x)/2,y:(a.y+b.y)/2,d:Math.hypot(a.x-b.x,a.y-b.y)} : {...a,d:0};
  }
  function geometry(slot, width) {
    const base = Math.max(width/slot.image.naturalWidth, photoHeight/slot.image.naturalHeight)/100;
    return {w:slot.image.naturalWidth*base, h:slot.image.naturalHeight*base};
  }
  function photoAt(p) {
    const loaded = slots.map((slot,i) => slot.image ? i : -1).filter(i => i >= 0);
    const width = W / loaded.length, cell = clamp(Math.floor(p.x / width), 0, loaded.length - 1);
    return {i:loaded[cell], left:cell*width, width};
  }
  function anchor({i, left, width}, c) {
    const slot = slots[i], {w,h} = geometry(slot,width);
    return {i,left,width,d:c.d,zoom:slot.zoom, x:(c.x-left+(w*slot.zoom-width)*slot.x/100)/(w*slot.zoom), y:(c.y+(h*slot.zoom-photoHeight)*slot.y/100)/(h*slot.zoom)};
  }
  function position({i,left,width,x,y}, c, zoom) {
    const slot = slots[i], g = geometry(slot,width);
    slot.zoom = clamp(zoom,100,300);
    const w=g.w*slot.zoom, h=g.h*slot.zoom;
    if (w-width > .001) slot.x = clamp((x*w-c.x+left)/(w-width)*100,0,100);
    if (h-photoHeight > .001) slot.y = clamp((y*h-c.y)/(h-photoHeight)*100,0,100);
    render();
  }
  touch.addEventListener('wheel', event => {
    if (gesture || !slots.some(slot => slot.image) || !event.deltaY) return;
    event.preventDefault();
    const p = point(event), photo = anchor(photoAt(p),p);
    const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 120 : 1);
    position(photo,p,photo.zoom * Math.exp(clamp(-delta * .002,-.25,.25)));
    scheduleCropLock();
  }, {passive:false});
  touch.onpointerdown = event => {
    if ((event.pointerType === 'touch' && touchDevice.matches && !cropEnabled) || pointers.size >= 2 || (event.pointerType === 'mouse' && event.button !== 0)) return;
    if (!slots.some(slot => slot.image)) return;
    const p = point(event);
    pointers.set(event.pointerId,p);
    scheduleCropLock();
    touch.setPointerCapture(event.pointerId);
    gesture = anchor(gesture || photoAt(p), center());
  };
  touch.onpointermove = event => {
    if (!gesture || !pointers.has(event.pointerId)) return;
    pointers.set(event.pointerId,point(event));
    const c = center();
    position(gesture, c, gesture.d > 0 ? gesture.zoom*c.d/gesture.d : gesture.zoom);
  };
  touch.onpointerup = touch.onpointercancel = touch.onlostpointercapture = event => {
    if (!pointers.delete(event.pointerId)) return;
    if (pointers.size && gesture) gesture = anchor(gesture,center()); else { gesture=null; }
    scheduleCropLock();
  };

  let cropTimeout;
  function scheduleCropLock() {
    clearTimeout(cropTimeout);
    if (!cropEnabled || pointers.size) return;
    cropTimeout = setTimeout(() => {
      cropEnabled = false;
      render();
    }, 2000);
  }

  function clearGesture(){gesture=null;pointers.clear();}
  function stepTemplate(delta){
    clearGesture();
    templateIndex=(templateIndex+delta+templates.length)%templates.length;
    scheduleCropLock();
    render();
  }
  $('templatePrev').onclick=()=>stepTemplate(-1);
  $('templateNext').onclick=()=>stepTemplate(1);
  $('cropToggle').onclick=()=>{clearGesture();cropEnabled=!cropEnabled;render();scheduleCropLock();};
  touchDevice.addEventListener('change',()=>{clearGesture();cropEnabled=false;render();scheduleCropLock();});
  const headlineInput = $('headline');
  function fitHeadlineInput() {
    headlineInput.style.height = '';
    headlineInput.style.fontSize = '';
    const baseSize = parseFloat(getComputedStyle(headlineInput).fontSize);
    for (let size = baseSize; size > 12 && headlineInput.scrollHeight > headlineInput.clientHeight; size--) {
      headlineInput.style.fontSize = Math.max(12, size - 1) + 'px';
    }
    const overflow = headlineInput.scrollHeight - headlineInput.clientHeight;
    if (overflow > 0) headlineInput.style.height = headlineInput.offsetHeight + overflow + 'px';
    headlineInput.scrollTop = 0;
  }

  function updateHeadline(event) {
    if (event.isComposing) return;
    const words = [...headlineInput.value.matchAll(/\S+/g)];
    if (words.length > WORD_LIMIT) {
      const caret = headlineInput.selectionStart;
      headlineInput.value = headlineInput.value.slice(0, words[WORD_LIMIT].index).trimEnd();
      headlineInput.setSelectionRange(caret, caret);
    }
    fitHeadlineInput();
    render();
  }

  headlineInput.addEventListener('input', updateHeadline);
  headlineInput.addEventListener('compositionend', updateHeadline);
  window.addEventListener('resize', fitHeadlineInput);
  $('newDesign').onclick = () => { $('resetDialog').returnValue = ''; $('resetDialog').showModal(); };
  $('resetDialog').addEventListener('close', () => {
    if ($('resetDialog').returnValue !== 'reset') return;
    removePhoto(0); removePhoto(1); clearGesture(); templateIndex=0; cropEnabled=false; headlineInput.value = ''; fitHeadlineInput(); chooseFont(2); headlineInput.focus();
  });
  $('resetDialog').addEventListener('cancel', () => { $('resetDialog').returnValue = ''; });
  let lastDownloadStamp='', downloadNumber=0;
  function downloadName() {
    const date=new Date(), pad=value=>String(value).padStart(2,'0');
    const stamp=[pad(date.getDate()),pad(date.getMonth()+1),date.getFullYear()].join('-')+'_'+[date.getHours(),date.getMinutes(),date.getSeconds()].map(pad).join('-');
    const key='cdn-design-download-'+stamp;
    downloadNumber=stamp===lastDownloadStamp?downloadNumber:0;
    try {downloadNumber=Math.max(downloadNumber,Number(localStorage.getItem(key))||0);} catch {}
    downloadNumber++;
    try {if(lastDownloadStamp && lastDownloadStamp!==stamp)localStorage.removeItem('cdn-design-download-'+lastDownloadStamp);localStorage.setItem(key,String(downloadNumber));} catch {}
    lastDownloadStamp=stamp;
    return 'CDN-'+stamp+(downloadNumber>1?'-'+downloadNumber:'')+'.jpg';
  }
  $('download').onclick = () => {
    render();
    if ($('download').disabled) return;
    canvas.toBlob(blob => {
      if (!blob) { status('No se pudo generar el JPG. Intenta de nuevo.'); return; }
      const link = document.createElement('a'), url = URL.createObjectURL(blob);
      link.href = url; link.download = downloadName();
      document.body.append(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    }, 'image/jpeg', 0.95);
  };
  frame.onload = () => {
    const probe = document.createElement('canvas');
    probe.width = 120; probe.height = H;
    const scan = probe.getContext('2d', {willReadFrequently:true});
    scan.drawImage(frame,0,0,120,H);
    const rgba = scan.getImageData(0,PHOTO_H,120,H-PHOTO_H).data;
    // Find the first wide, opaque footer stripe, even if the PNG is replaced.
    for (let row = 48; row < H-PHOTO_H; row++) {
      let covered = 0;
      for (let x = 7; x < 113; x++) if (rgba[(row*120+x)*4+3] > 96) covered++;
      if (covered >= 72) { footerTop = PHOTO_H+row; break; }
    }
    frameReady = true; render();
  };
  frame.onerror = () => status('No se pudo cargar el marco del diseño.');
  logo.onload = render; logo.src = '../transmision/assets/images/logos/logo.png';
  frame.src = './marco.png?v=16';
  chooseFont(2);
})();
