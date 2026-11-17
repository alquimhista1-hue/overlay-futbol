(() => {
  const W = 1200, H = 1400, PHOTO_H = 875;
  const $ = id => document.getElementById(id);
  const canvas = $('preview'), ctx = canvas.getContext('2d');
  const slots = Array.from({length: 2}, () => ({image: null, x: 50, y: 50, zoom: 100, revision: 0}));
  const controls = [];
  let frameReady = false, footerTop = H;
  const frame = new Image();
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
  document.querySelectorAll('[data-font]').forEach(button => button.onclick = () => { chooseFont(Number(button.dataset.font)); saveDraft(); });
  const status = message => { $('status').textContent = message; };

  function drawPhoto(context, slot, left, width, height) {
    const image = slot.image;
    const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight) * slot.zoom / 100;
    const w = image.naturalWidth * scale, h = image.naturalHeight * scale;
    context.save();
    context.beginPath();
    context.rect(left, 0, width, height);
    context.clip();
    context.drawImage(image, left - (w - width) * slot.x / 100, -(h - height) * slot.y / 100, w, h);
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

  function render() {
    const loaded = slots.filter(slot => slot.image);
    const width = W / Math.max(1, loaded.length);
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#e7edf5'; ctx.fillRect(0, 0, W, PHOTO_H);
    loaded.forEach((slot, i) => drawPhoto(ctx, slot, i * width, width, PHOTO_H));
    const gray = ctx.createLinearGradient(0, PHOTO_H, 0, H); gray.addColorStop(0, '#e4e7eb'); gray.addColorStop(1, '#f9fafb'); ctx.fillStyle = gray; ctx.fillRect(0, PHOTO_H, W, H - PHOTO_H); ctx.fillStyle = '#122238'; ctx.fillRect(0, PHOTO_H, W, 8);
    const headline = $('headline').value.trim();
    if (headline) {
      const top = PHOTO_H + 28;
      const bottom = Math.max(top + 1, footerTop - 24);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      for (let size = 94; size >= 1; size--) {
        ctx.font = fonts[fontIndex].replace("1px", size + "px") + ", sans-serif";
        const lines = $('manualLines').checked
          ? headline.split('\n').flatMap(line => wrap(line, W - 140))
          : balanceLines(headline, W - 140);
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
    slots.forEach((slot, i) => {
      controls[i].remove.hidden = !slot.image;
      controls[i].caption.textContent = slot.image ? 'Cambiar foto' : 'Elegir foto';
    });
    $('touchArea').hidden = !loaded.length;
    $('download').disabled = !loaded.length || !headline || !frameReady || !fontReady;
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
    slots[i].image = null; slots[i].file = null;
    controls[i].file.value = '';
    resetCrop(i);
  }

  slots.forEach((slot, i) => {
    const card = document.createElement('article');
    card.className = 'photo-card';
    card.innerHTML = `<h2>Foto ${i+1} ${i ? '<small class="hint">Opcional</small>' : ''}</h2>
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
        slot.image = image; slot.file = selected; resetCrop(i); status(''); render(); saveDraft();
      } catch {
        if (revision === slot.revision) status('No se pudo abrir la foto. Prueba con JPG, PNG o WebP.');
      }
    });
    remove.onclick = () => { removePhoto(i); status(''); render(); saveDraft(); };
  });
  const touch = $('touchArea'), pointers = new Map();
  let gesture = null;
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  function point(event) {
    const r = touch.getBoundingClientRect();
    return {x: (event.clientX - r.left) * W / r.width, y: (event.clientY - r.top) * PHOTO_H / r.height};
  }
  function center() {
    const [a,b] = pointers.values();
    return b ? {x:(a.x+b.x)/2,y:(a.y+b.y)/2,d:Math.hypot(a.x-b.x,a.y-b.y)} : {...a,d:0};
  }
  function geometry(slot, width) {
    const base = Math.max(width/slot.image.naturalWidth, PHOTO_H/slot.image.naturalHeight)/100;
    return {w:slot.image.naturalWidth*base, h:slot.image.naturalHeight*base};
  }
  function photoAt(p) {
    const loaded = slots.map((slot,i) => slot.image ? i : -1).filter(i => i >= 0);
    const width = W / loaded.length, cell = clamp(Math.floor(p.x / width), 0, loaded.length - 1);
    return {i:loaded[cell], left:cell*width, width};
  }
  function anchor({i, left, width}, c) {
    const slot = slots[i], {w,h} = geometry(slot,width);
    return {i,left,width,d:c.d,zoom:slot.zoom, x:(c.x-left+(w*slot.zoom-width)*slot.x/100)/(w*slot.zoom), y:(c.y+(h*slot.zoom-PHOTO_H)*slot.y/100)/(h*slot.zoom)};
  }
  function position({i,left,width,x,y}, c, zoom) {
    const slot = slots[i], g = geometry(slot,width);
    slot.zoom = clamp(zoom,100,300);
    const w=g.w*slot.zoom, h=g.h*slot.zoom;
    if (w-width > .001) slot.x = clamp((x*w-c.x+left)/(w-width)*100,0,100);
    if (h-PHOTO_H > .001) slot.y = clamp((y*h-c.y)/(h-PHOTO_H)*100,0,100);
    render();
  }
  touch.addEventListener('wheel', event => {
    if (gesture || !slots.some(slot => slot.image) || !event.deltaY) return;
    event.preventDefault();
    const p = point(event), photo = anchor(photoAt(p),p);
    const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 120 : 1);
    position(photo,p,photo.zoom * Math.exp(clamp(-delta * .002,-.25,.25))); saveDraft();
  }, {passive:false});
  touch.onpointerdown = event => {
    if (pointers.size >= 2 || (event.pointerType === 'mouse' && event.button !== 0)) return;
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
    if (pointers.size && gesture) gesture = anchor(gesture,center()); else { gesture=null; saveDraft(); }
  };

  $('headline').addEventListener('input', () => {
    $('count').textContent = $('headline').value.length + ' / 220';
    render(); saveDraft();
  });
  $('manualLines').onchange = () => { $('lineHint').hidden = !$('manualLines').checked; render(); saveDraft(); };
  $('newDesign').onclick = () => { $('resetDialog').returnValue = ''; $('resetDialog').showModal(); };
  $('resetDialog').addEventListener('close', () => {
    if ($('resetDialog').returnValue !== 'reset') return;
    removePhoto(0); removePhoto(1); $('headline').value = ''; $('count').textContent = '0 / 220'; $('manualLines').checked = false; $('lineHint').hidden = true; chooseFont(1); saveDraft(); $('headline').focus();
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
  const draftKey = window.STUDIO_OWNER || 'device';
  const db = new Promise((resolve,reject) => {
    try {
      const request = indexedDB.open('cdn-studio-designs',1);
      request.onupgradeneeded = () => request.result.createObjectStore('drafts');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    } catch(error) { reject(error); }
  });
  let draftRevision = 0, restoring = true;
  $('newDesign').disabled = true;
  function draftRequest(mode, action) {
    return db.then(database => new Promise((resolve,reject) => {
      const tx = database.transaction('drafts',mode);
      const request = action(tx.objectStore('drafts'));
      tx.oncomplete = () => resolve(request.result);
      tx.onabort = tx.onerror = () => reject(tx.error || request.error);
    }));
  }
  function saveDraft() {
    if (restoring) return;
    const revision = ++draftRevision;
    const draft = {headline:$('headline').value, manual:$('manualLines').checked, fontIndex,
      photos:slots.map(({file,x,y,zoom}) => ({file,x,y,zoom}))};
    $('draftStatus').textContent = 'Guardando…';
    draftRequest('readwrite', store => draft.headline || draft.photos.some(photo => photo.file)
      ? store.put(draft,draftKey) : store.delete(draftKey))
      .then(() => { if (revision === draftRevision) $('draftStatus').textContent = 'Borrador al día en este dispositivo'; })
      .catch(() => { if (revision === draftRevision) $('draftStatus').textContent = 'No se pudo guardar el borrador'; });
  }
  async function restoreDraft() {
    try {
      const draft = await draftRequest('readonly', store => store.get(draftKey));
      if (!draft) { $('draftStatus').textContent = 'Guardado automático en este dispositivo'; return; }
      $('headline').value = draft.headline || '';
      $('count').textContent = $('headline').value.length + ' / 220';
      $('manualLines').checked = !!draft.manual;
      $('lineHint').hidden = !$('manualLines').checked;
      const restored = await Promise.allSettled(slots.map(async (slot,i) => {
        const photo = draft.photos?.[i];
        if (photo?.file) Object.assign(slot,photo,{image:await decode(photo.file)});
      }));
      chooseFont(fonts[draft.fontIndex] ? draft.fontIndex : 1);
      $('draftStatus').textContent = restored.some(item => item.status === 'rejected')
        ? 'Borrador recuperado; falta una foto' : 'Borrador recuperado';
    } catch {
      $('draftStatus').textContent = 'Borrador local no disponible';
    } finally {
      restoring = false; $('config').inert = false; $('newDesign').disabled = false; render();
    }
  }

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
  frame.src = './marco.png?v=16';
  chooseFont(1);
  restoreDraft();
})();
