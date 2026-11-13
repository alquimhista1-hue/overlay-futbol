(() => {
  const W = 1200, H = 1400, PHOTO_H = 875;
  const $ = id => document.getElementById(id);
  const canvas = $('preview'), ctx = canvas.getContext('2d');
  const slots = Array.from({length: 2}, () => ({image: null, x: 50, y: 50, zoom: 100, revision: 0}));
  const controls = [];
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
    slots.forEach((slot, i) => {
      const {crop, adjust, remove, side} = controls[i];
      crop.hidden = adjust.hidden = remove.hidden = !slot.image;
      side.textContent = slot.image ? (loaded.length === 1 ? 'Ancho completo' : i === 0 ? 'Mitad izquierda' : 'Mitad derecha') : (i === 0 ? 'Principal' : 'Opcional');
      if (!slot.image) return;
      crop.width = 320; crop.height = Math.round(320 * PHOTO_H / width);
      drawPhoto(crop.getContext('2d'), slot, 0, crop.width, crop.height);
    });
    $('download').disabled = !loaded.length || !headline;
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
    for (const key of ['x', 'y', 'zoom']) controls[i].card.querySelector('[data-key="' + key + '"]').value = slots[i][key];
  }
  function removePhoto(i) {
    slots[i].revision++;
    slots[i].image = null;
    controls[i].file.value = '';
    controls[i].adjust.open = false;
    resetCrop(i);
  }

  slots.forEach((slot, i) => {
    const card = document.createElement('article');
    card.className = 'photo-card';
    card.innerHTML = `<h2>Foto ${i + 1} <small class="hint"></small></h2>
      <canvas class="crop" aria-label="Encuadre de foto ${i + 1}" hidden></canvas>
      <div class="photo-actions"><label class="upload"><span>Elegir foto</span><input type="file" accept="image/*" aria-label="Elegir foto ${i + 1}"></label><button type="button" class="remove" hidden>Quitar</button></div>
      <details hidden><summary>Ajustar encuadre</summary><label>Ampliación<input data-key="zoom" type="range" min="100" max="300" value="100"></label><label>Posición horizontal<input data-key="x" type="range" min="0" max="100" value="50"></label><label>Posición vertical<input data-key="y" type="range" min="0" max="100" value="50"></label><button type="button" class="reset-crop">Centrar y restablecer</button></details>`;
    $('photos').append(card);
    const file = card.querySelector('input[type=file]'), remove = card.querySelector('.remove');
    controls.push({card, file, remove, crop: card.querySelector('.crop'), adjust: card.querySelector('details'), side: card.querySelector('small')});
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
    card.querySelector('.reset-crop').onclick = () => { resetCrop(i); render(); };
    card.querySelectorAll('[data-key]').forEach(input => input.addEventListener('input', () => {
      slot[input.dataset.key] = Number(input.value); render();
    }));
  });

  function tab(name) {
    $('config').hidden = name !== 'config';
    $('previewPanel').hidden = name !== 'preview';
    document.querySelectorAll('[data-tab]').forEach(button => {
      const selected = button.dataset.tab === name;
      button.classList.toggle('active', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    status(name === 'preview' && (!slots.some(slot => slot.image) || !$('headline').value.trim()) ? 'Agrega al menos una foto y un titular para descargar el diseño.' : '');
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
  $('newDesign').onclick = () => $('resetDialog').showModal();
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
  render();
})();
