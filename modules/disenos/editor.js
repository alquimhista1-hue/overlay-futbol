(() => {
  const W = 1200, H = 1400, PHOTO_H = 875;
  const $ = id => document.getElementById(id);
  const canvas = $('preview'), ctx = canvas.getContext('2d');
  const slots = Array.from({length: 2}, () => ({image: null, x: 50, y: 50, zoom: 100, revision: 0}));
  const controls = [];
  let selected = -1, frameReady = false;
  const frame = new Image();
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

  function render() {
    const loaded = slots.filter(slot => slot.image);
    const width = W / Math.max(1, loaded.length);
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#e7edf5'; ctx.fillRect(0, 0, W, PHOTO_H);
    loaded.forEach((slot, i) => drawPhoto(ctx, slot, i * width, width, PHOTO_H));
    ctx.fillStyle = '#122238'; ctx.fillRect(0, PHOTO_H, W, 8);
    const headline = $('headline').value.trim();
    if (headline) {
      let size = 79, lines, leading;
      do {
        ctx.font = `700 ${size}px Arial, sans-serif`;
        lines = wrap(headline, W - 156);
        leading = Math.ceil(size * 1.09);
        if (lines.length * leading <= 395) break;
        size--;
      } while (size > 0);
      ctx.textBaseline = 'middle';
      const start = PHOTO_H + 8 + (H - PHOTO_H - 8 - lines.length * leading) / 2 + leading / 2;
      lines.forEach((line, i) => ctx.fillText(line, 78, start + i * leading));
    }
    if (frameReady) ctx.drawImage(frame, 0, 0, W, H);
    slots.forEach((slot, i) => {
      controls[i].remove.hidden = !slot.image;
      controls[i].caption.textContent = slot.image ? 'Cambiar foto' : 'Elegir foto';
      controls[i].cropButton.hidden = !slot.image;
      controls[i].cropButton.textContent = loaded.length === 1 ? 'Ajustar imagen' : 'Ajustar imagen ' + (i + 1);
      controls[i].cropButton.setAttribute('aria-expanded', String(selected === i));
    });
    $('touchArea').hidden = $('cropButtons').hidden = !loaded.length;
    $('cropControls').hidden = selected < 0 || !slots[selected].image;
    if (!$('cropControls').hidden) {
      for (const input of $('cropControls').querySelectorAll('[data-key]')) input.value = slots[selected][input.dataset.key];
    }
    $('download').disabled = !loaded.length || !headline || !frameReady;
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
    if (selected === i) selected = -1;
    resetCrop(i);
  }

  slots.forEach((slot, i) => {
    const card = document.createElement('article');
    card.className = 'photo-card';
    card.innerHTML = `<h2>Foto ${i+1} ${i ? '<small class="hint">Opcional</small>' : ''}</h2>
      <div class="photo-actions"><label class="upload"><span>Elegir foto</span><input type="file" accept="image/*" aria-label="Elegir foto ${i+1}"></label><button type="button" class="remove" hidden>Quitar</button></div>`;
    $('photos').append(card);
    const file = card.querySelector('input'), remove = card.querySelector('.remove');
    const cropButton = document.createElement('button');
    cropButton.type = 'button';
    cropButton.onclick = () => { selected = selected === i ? -1 : i; render(); };
    $('cropButtons').append(cropButton);
    controls.push({file, remove, cropButton, caption: card.querySelector('.upload span')});
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
  for (const input of $('cropControls').querySelectorAll('[data-key]')) {
    input.oninput = () => { if (selected >= 0) { slots[selected][input.dataset.key] = Number(input.value); render(); } };
  }
  $('centerCrop').onclick = () => { if (selected >= 0) { resetCrop(selected); render(); } };

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
  function anchor(i, left, width) {
    const slot = slots[i], c = center(), {w,h} = geometry(slot,width);
    gesture = {i,left,width,d:c.d,zoom:slot.zoom, x:(c.x-left+(w*slot.zoom-width)*slot.x/100)/(w*slot.zoom), y:(c.y+(h*slot.zoom-PHOTO_H)*slot.y/100)/(h*slot.zoom)};
  }
  touch.onpointerdown = event => {
    if (pointers.size >= 2 || (event.pointerType === 'mouse' && event.button !== 0)) return;
    const loaded = slots.map((slot,i)=>slot.image ? i : -1).filter(i=>i>=0);
    if (!loaded.length) return;
    const p = point(event), width = W/loaded.length, cell = clamp(Math.floor(p.x/width),0,loaded.length-1);
    pointers.set(event.pointerId,p);
    touch.setPointerCapture(event.pointerId);
    if (gesture) anchor(gesture.i,gesture.left,gesture.width);
    else anchor(loaded[cell],cell*width,width);
  };
  touch.onpointermove = event => {
    if (!gesture || !pointers.has(event.pointerId)) return;
    pointers.set(event.pointerId,point(event));
    const {i,left,width,d,zoom,x,y} = gesture, slot = slots[i], c = center(), g = geometry(slot,width);
    slot.zoom = clamp(d > 0 ? zoom*c.d/d : zoom,100,300);
    const w=g.w*slot.zoom, h=g.h*slot.zoom;
    if (w-width > .001) slot.x = clamp((x*w-c.x+left)/(w-width)*100,0,100);
    if (h-PHOTO_H > .001) slot.y = clamp((y*h-c.y)/(h-PHOTO_H)*100,0,100);
    render();
  };
  touch.onpointerup = touch.onpointercancel = touch.onlostpointercapture = event => {
    if (!pointers.delete(event.pointerId)) return;
    if (pointers.size && gesture) anchor(gesture.i,gesture.left,gesture.width); else gesture=null;
  };

  function tab(name) {
    $('config').hidden = name !== 'config';
    $('previewPanel').hidden = name !== 'preview';
    document.querySelectorAll('[data-tab]').forEach(button => {
      const selected = button.dataset.tab === name;
      button.classList.toggle('active', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    render();
  }
  document.querySelectorAll('[data-tab]').forEach(button => button.onclick = () => tab(button.dataset.tab));
  $('view').onclick = () => {
    tab('preview');
    if (window.parent !== window) parent.postMessage({type: 'studio:tab-change'}, location.origin);
  };
  $('headline').addEventListener('input', () => {
    $('count').textContent = $('headline').value.length + ' / 220';
    render();
  });
  $('newDesign').onclick = () => { $('resetDialog').returnValue = ''; $('resetDialog').showModal(); };
  $('resetDialog').addEventListener('close', () => {
    if ($('resetDialog').returnValue !== 'reset') return;
    removePhoto(0); removePhoto(1); $('headline').value = ''; $('count').textContent = '0 / 220'; tab('config');
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
  frame.onload = () => { frameReady = true; render(); };
  frame.onerror = () => status('No se pudo cargar el marco del diseño.');
  frame.src = './marco.svg?v=15';
  render();
})();
