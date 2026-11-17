(() => {
  const W = 1200, H = 1400, PHOTO_H = 875, TOP_BAND = 258, TOP_WORD_LIMIT = 22;
  const $ = id => document.getElementById(id);
  const canvas = $('preview'), ctx = canvas.getContext('2d');
  const slots = Array.from({length: 2}, () => ({image: null, x: 50, y: 50, zoom: 100, revision: 0}));
  const controls = [];
  let frameReady = false, footerTop = H;
  const frame = new Image(), logo = new Image();
  const templates = [['classic','Clásica'],['top','Titular arriba']];
  let templateIndex=0, cropEnabled=false;
  const touchDevice=matchMedia('(pointer:coarse), (hover:none)');
  let photoTop = 0, photoHeight = PHOTO_H, topFits = true;
  const fonts = {1:'700 1px "Oswald"', 2:'700 1px "Fira Sans Condensed"'};
  let fontIndex = 1, fontRevision = 0, fontReady = false;
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
    }).catch(() => { if (revision === fontRevision) status('No se pudo cargar esa tipografía. Prueba otra opción.'); });
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
    const text=headline.toLocaleUpperCase('es'), words=text.split(/\s+/).filter(Boolean);
    const title=fitText(text,W-64,TOP_BAND-56,54,size=>'900 '+size+'px "Arial Black", system-ui, sans-serif',3);
    topFits=words.length<=TOP_WORD_LIMIT && (!text || !!title.lines.length);
    photoTop=TOP_BAND; photoHeight=H-photoTop;
    ctx.fillStyle='#e7edf5';ctx.fillRect(0,photoTop,W,photoHeight);
    loaded.forEach((slot,i)=>drawPhoto(ctx,slot,i*width,width,photoHeight,photoTop));
    paintText(title,32,(TOP_BAND-title.height)/2,'left','#111');
    const limit=$('titleLimit');
    const note='15 a '+TOP_WORD_LIMIT+' palabras';
    const message=topFits ? note : 'Máximo '+TOP_WORD_LIMIT+' palabras.';
    if(limit.textContent!==message)limit.textContent=message;
    $('headline').setAttribute('aria-invalid',String(!topFits));
    paintLogo(W-220,photoTop+34);
  }

  function render() {
    const loaded = slots.filter(slot => slot.image);
    const width = W / Math.max(1, loaded.length);
    const headline = $('headline').value.trim(), template = templates[templateIndex][0];
    photoTop = 0; photoHeight = PHOTO_H; topFits = true;
    if(template !== 'top'){ $('titleLimit').textContent=''; $('headline').removeAttribute('aria-invalid'); }
    if (template === 'classic') {
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#e7edf5'; ctx.fillRect(0, 0, W, PHOTO_H);
      loaded.forEach((slot, i) => drawPhoto(ctx, slot, i * width, width, PHOTO_H));
      const gray = ctx.createLinearGradient(0, PHOTO_H, 0, H); gray.addColorStop(0, '#e4e7eb'); gray.addColorStop(1, '#f9fafb'); ctx.fillStyle = gray; ctx.fillRect(0, PHOTO_H, W, H - PHOTO_H); ctx.fillStyle = '#122238'; ctx.fillRect(0, PHOTO_H, W, 8);
      if (headline) {
        // Export margins are measured in canvas pixels, not interface spacing.
        const top = PHOTO_H + 52;
        const textWidth = W - 2 * 112;
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
    document.querySelectorAll('[data-font]').forEach(button => { button.disabled = template === 'top'; });
    $('touchArea').style.setProperty('--photo-top', photoTop/H*100+'%');
    $('touchArea').style.setProperty('--photo-height', photoHeight/H*100+'%');
    slots.forEach((slot, i) => {
      controls[i].remove.hidden = !slot.image;
      controls[i].caption.textContent = slot.image ? 'Cambiar foto' : 'Elegir foto';
    });
    $('templateName').textContent = templates[templateIndex][1];
    if(!loaded.length)cropEnabled=false;
    $('cropToggle').hidden = !loaded.length || !touchDevice.matches;
    $('cropToggle').setAttribute('aria-pressed',String(cropEnabled));
    $('cropToggle').textContent = cropEnabled ? 'Terminar encuadre' : 'Encuadrar foto';
    $('touchArea').hidden = !loaded.length || (touchDevice.matches && !cropEnabled);
    $('download').disabled = !loaded.length || !headline || (template === "classic" && !frameReady) || !topFits || (template !== 'top' && !fontReady);
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
    controls[i].file.value = '';
    resetCrop(i);
  }

  slots.forEach((slot, i) => {
    const card = document.createElement('article');
    card.className = 'photo-card';
    card.innerHTML = `<h2>Foto ${i+1}</h2>
      <div class="photo-actions"><label class="upload"><span>Elegir foto</span><input type="file" accept="image/*" aria-label="Elegir foto ${i+1}"></label><button type="button" class="remove" hidden>Quitar</button></div>`;
    $('photos').append(card);
    const file = card.querySelector('input'), remove = card.querySelector('.remove');
    controls.push({file, remove, caption: card.querySelector('.upload span')});
    file.addEventListener('change', async () => {
      const selected = file.files[0];
      if (!selected) return;
      const revision = ++slot.revision;
      file.value = '';
      try {
        const image = await decode(selected);
        if (revision !== slot.revision) return;
        slot.image = image; resetCrop(i); status(''); render();
      } catch {
        if (revision === slot.revision) status('No se pudo abrir la foto. Prueba con JPG, PNG o WebP.');
      }
    });
    remove.onclick = () => { removePhoto(i); status(''); render(); };
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
  }, {passive:false});
  touch.onpointerdown = event => {
    if ((event.pointerType === 'touch' && touchDevice.matches && !cropEnabled) || pointers.size >= 2 || (event.pointerType === 'mouse' && event.button !== 0)) return;
    if (!slots.some(slot => slot.image)) return;
    const p = point(event);
    pointers.set(event.pointerId,p);
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
  };

  function clearGesture(){gesture=null;pointers.clear();}
  function stepTemplate(delta){
    clearGesture();
    templateIndex=(templateIndex+delta+templates.length)%templates.length;
    render();
  }
  $('templatePrev').onclick=()=>stepTemplate(-1);
  $('templateNext').onclick=()=>stepTemplate(1);
  $('cropToggle').onclick=()=>{clearGesture();cropEnabled=!cropEnabled;render();};
  touchDevice.addEventListener('change',()=>{clearGesture();cropEnabled=false;render();});
  $('headline').addEventListener('input', () => {

    render();
  });
  $('newDesign').onclick = () => { $('resetDialog').returnValue = ''; $('resetDialog').showModal(); };
  $('resetDialog').addEventListener('close', () => {
    if ($('resetDialog').returnValue !== 'reset') return;
    removePhoto(0); removePhoto(1); clearGesture(); templateIndex=0; cropEnabled=false; $('headline').value = ''; chooseFont(1); $('headline').focus();
  });
  $('resetDialog').addEventListener('cancel', () => { $('resetDialog').returnValue = ''; });
  $('download').onclick = () => {
    render();
    canvas.toBlob(blob => {
      if (!blob) { status('No se pudo generar el PNG. Intenta de nuevo.'); return; }
      const link = document.createElement('a'), url = URL.createObjectURL(blob);
      link.href = url; link.download = 'CDN-noticia-1200x1400.png';
      document.body.append(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    }, 'image/png');
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
  chooseFont(1);
})();
