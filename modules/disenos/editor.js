(() => {
  const W = 1200, H = 1400, PHOTO_H = 875, TOP_BAND = 258, WORD_LIMIT = 20;
  const $ = id => document.getElementById(id);
  const canvas = $('preview'), ctx = canvas.getContext('2d');
  const slots = Array.from({length: 3}, () => ({image: null, x: 50, y: 50, zoom: 100, revision: 0}));
  const controls = [];
  let frameReady = false, footerTop = H;
  const frame = new Image(), logo = new Image();
  const templates = [['classic','Clásica'],['top','Titular arriba'],['collage','Collage circular'],['split','Mitades destacadas'],['triple','Triple con círculo']];
  let templateIndex=0, cropEnabled=false;
  let lowerAccent=Math.floor(Math.random()*3);
  let collageAccent=Math.floor(Math.random()*3);
  const circle={image:null,x:910,y:690,size:380,zoom:100,revision:0};
  let circleDrag=null;
  const isCollage=()=>templates[templateIndex][0]==='collage';
  const isSplit=()=>templates[templateIndex][0]==='split';
  const isTriple=()=>templates[templateIndex][0]==='triple';
  const hasCircle=()=>isCollage() || isSplit() || isTriple();
  const hasTextBlocks=()=>isSplit() || isTriple();
  const circleLayouts={triple:{x:260,y:380,size:380},collage:{x:910,y:690,size:380},split:{x:290,y:1070,size:440}};
  const touchDevice=matchMedia('(pointer:coarse), (hover:none)');
  let photoTop = 0, photoHeight = PHOTO_H, titleFits = true;
  const fonts = {1:'700 1px "Oswald"', 2:'700 1px "Fira Sans Condensed"', 3:'800 1px "Barlow Condensed"'};
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
    photoTop=TOP_BAND; photoHeight=H-photoTop-110;
    ctx.fillStyle='#e7edf5';ctx.fillRect(0,photoTop,W,photoHeight);
    loaded.forEach((slot,i)=>drawPhoto(ctx,slot,i*width,width,photoHeight,photoTop));
    paintText(title,margin,(TOP_BAND-title.height)/2,'left','#111');
    paintLogo(W-220,photoTop+34);
  }

  function paintCircle() {
    if(circle.image){
      const radius=circle.size/2;
      ctx.save();ctx.beginPath();ctx.arc(circle.x,circle.y,radius,0,Math.PI*2);ctx.clip();
      drawPhoto(ctx,{image:circle.image,x:50,y:50,zoom:circle.zoom},circle.x-radius,circle.size,circle.size,circle.y-radius);
      ctx.restore();
      ctx.beginPath();ctx.arc(circle.x,circle.y,radius,0,Math.PI*2);ctx.strokeStyle='#fff';ctx.lineWidth=10;ctx.stroke();
    }
  }

  function headlinePhrases(value) {
    const text=value.trim().toLocaleUpperCase('es');
    if(!text)return [];
    const connectors=new Set('A AL DE DEL LA LAS EL LOS UN UNA UNOS UNAS EN CON SIN POR PARA Y E O U NI QUE SI SU SUS MI MIS'.split(' '));
    const isConnector=word=>connectors.has(word.replace(/[.,:;!?¡¿“”"]/g,''));
    const manual=text.split(/\n+/).map(line=>line.trim().replace(/\s+/g,' ')).filter(Boolean);
    if(manual.length>1){
      for(let i=0;i<manual.length-1;i++){
        const words=manual[i].split(' '), carry=[];
        while(words.length && isConnector(words.at(-1)))carry.unshift(words.pop());
        manual[i]=words.join(' ');
        if(carry.length)manual[i+1]=carry.join(' ')+' '+manual[i+1];
      }
      if(manual.length>1 && manual.at(-1).split(' ').every(isConnector)){
        manual[manual.length-2]+=' '+manual.pop();
      }
      return manual.filter(Boolean);
    }
    const words=text.split(/\s+/);
    const lineCount=Math.min(5,Math.max(1,Math.ceil(words.length/3)));
    const target=words.length/lineCount;
    const memo=new Map();
    function distribute(start,remaining) {
      if(!remaining)return start===words.length?{cost:0,lines:[]}:null;
      const key=start+':'+remaining;
      if(memo.has(key))return memo.get(key);
      let best=null;
      for(let end=start+1;end<=words.length-(remaining-1);end++){
        const group=words.slice(start,end), length=group.length;
        if(group.every(isConnector) || (end<words.length && isConnector(group.at(-1))))continue;
        const rest=distribute(end,remaining-1);
        if(!rest)continue;
        const cost=rest.cost+(length-target)**2+(length===1?2:0);
        if(!best || cost<best.cost)best={cost,lines:[group.join(' '),...rest.lines]};
      }
      memo.set(key,best);return best;
    }
    return distribute(0,lineCount)?.lines || [text];
  }

  function renderSplit(headline,loaded,width) {
    photoTop=0;photoHeight=H;
    ctx.fillStyle='#132743';ctx.fillRect(0,0,W,H);
    loaded.forEach((slot,i)=>drawPhoto(ctx,slot,i*width,width,H));
    const topShade=ctx.createLinearGradient(0,0,0,600);
    topShade.addColorStop(0,'rgba(3,21,62,.92)');topShade.addColorStop(1,'rgba(3,21,62,0)');
    ctx.fillStyle=topShade;ctx.fillRect(0,0,W,600);
    const bottomShade=ctx.createLinearGradient(0,850,0,H);
    bottomShade.addColorStop(0,'rgba(3,21,62,0)');bottomShade.addColorStop(1,'rgba(3,21,62,.96)');
    ctx.fillStyle=bottomShade;ctx.fillRect(0,850,W,H-850);
    paintCircle();
    paintEqualWidthBlock(headline,W/2,150,700,370);
    paintEqualWidthBlock($('bottomHeadline').value,900,1020,480,270);
    paintLogo(38,24);
  }

  function paintEqualWidthBlock(value,x,top,width,height,randomAccent=false,alignBottom=false) {
    const phrases=headlinePhrases(value);
    if(!phrases.length)return;
    const font=size=>fonts[fontIndex].replace('1px',size+'px')+', sans-serif';
    const sizes=phrases.map(line=>{
      ctx.font=font(100);
      return Math.min(1000,100*width/Math.max(1,ctx.measureText(line).width));
    });
    const accentIndex=[0,Math.floor(phrases.length/2),phrases.length-1][collageAccent];
    for(let factor=1;factor>=.01;factor-=.01){
      const rows=phrases.map((line,index)=>{
        const size=sizes[index]*factor;
        ctx.font=font(size);
        const metrics=ctx.measureText(line),cap=ctx.measureText('H');
        return {line,font:ctx.font,ascent:metrics.actualBoundingBoxAscent,descent:metrics.actualBoundingBoxDescent,cap:cap.actualBoundingBoxAscent};
      });
      // Accents rise above the cap height without changing the spacing of the letter bodies.
      const gap=6;
      let cursor=0;
      rows.forEach(row=>{row.baseline=cursor+row.cap;cursor+=row.cap+gap;});
      const inkTop=Math.min(...rows.map(row=>row.baseline-row.ascent));
      const inkBottom=Math.max(...rows.map(row=>row.baseline+row.descent));
      const total=inkBottom-inkTop;
      if(total>height || sizes.some(size=>size*factor>160))continue;
      ctx.save();ctx.shadowColor='rgba(0,0,0,.98)';ctx.shadowBlur=18;ctx.shadowOffsetX=2;ctx.shadowOffsetY=6;
      const offset=alignBottom?top+height-inkBottom:top+(height-total)/2-inkTop;
      rows.forEach((row,index)=>{
        ctx.font=row.font;ctx.textAlign='center';ctx.textBaseline='alphabetic';
        ctx.fillStyle=(randomAccent?index===accentIndex:index%2)?'#f6ba38':'#fff';
        const baseline=offset+row.baseline;
        ctx.shadowBlur=30;ctx.strokeStyle='rgba(0,0,0,.72)';ctx.lineWidth=2;ctx.lineJoin='round';
        ctx.strokeText(row.line,x,baseline);
        ctx.shadowBlur=18;
        ctx.fillText(row.line,x,baseline);
      });
      ctx.restore();return;
    }
  }

  function paintTripleCaption(value) {
    const words=value.trim().toLocaleUpperCase('es').split(/\s+/).filter(Boolean);
    if(!words.length)return;
    const width=960,height=220,gap=6;
    const font=size=>'800 '+size+'px "Barlow Condensed", sans-serif';
    const multiplier=index=>index===lowerAccent?1.15:1;
    const connectorEnding=line=>/\b(A|AL|DE|DEL|LA|LAS|EL|LOS|UN|UNA|EN|CON|SIN|POR|PARA|Y|O|QUE|SU|SUS)$/.test(line.replace(/[“”"]/g,''));
    ctx.font=font(100);
    let phrases=words;
    if(words.length>=3){
      let best=-Infinity;
      for(let first=1;first<words.length-1;first++){
        for(let second=first+1;second<words.length;second++){
          const candidate=[words.slice(0,first).join(' '),words.slice(first,second).join(' '),words.slice(second).join(' ')];
          const widths=candidate.map((line,index)=>ctx.measureText(line).width*multiplier(index));
          const maximum=Math.max(...widths),minimum=Math.min(...widths);
          const score=width/maximum*(.7+.3*minimum/maximum)-(connectorEnding(candidate[0])||connectorEnding(candidate[1])?.5:0);
          if(score>best){best=score;phrases=candidate;}
        }
      }
    }
    for(let size=120;size>=1;size--){
      const rows=phrases.map((line,index)=>{
        ctx.font=font(size*multiplier(index));
        const metrics=ctx.measureText(line),cap=ctx.measureText('H');
        return {line,font:ctx.font,width:metrics.width,ascent:metrics.actualBoundingBoxAscent,descent:metrics.actualBoundingBoxDescent,cap:cap.actualBoundingBoxAscent};
      });
      let cursor=0;
      rows.forEach(row=>{row.baseline=cursor+row.cap;cursor+=row.cap+gap;});
      const inkTop=Math.min(...rows.map(row=>row.baseline-row.ascent));
      const inkBottom=Math.max(...rows.map(row=>row.baseline+row.descent));
      const total=inkBottom-inkTop;
      if(total>height || rows.some(row=>row.width>width))continue;
      ctx.save();ctx.textAlign='center';ctx.textBaseline='alphabetic';
      ctx.shadowColor='rgba(0,0,0,.98)';ctx.shadowOffsetX=2;ctx.shadowOffsetY=6;
      rows.forEach((row,index)=>{
        const baseline=1250-inkBottom+row.baseline;
        ctx.font=row.font;ctx.fillStyle=index===lowerAccent?'#f6ba38':'#fff';
        ctx.shadowBlur=30;ctx.strokeStyle='rgba(0,0,0,.72)';ctx.lineWidth=2;ctx.lineJoin='round';
        ctx.strokeText(row.line,W/2,baseline);
        ctx.shadowBlur=18;ctx.fillText(row.line,W/2,baseline);
      });
      ctx.restore();return;
    }
  }

  function renderTriple(headline) {
    photoTop=0;photoHeight=H;
    ctx.fillStyle='#132743';ctx.fillRect(0,0,W,H);
    const regions=[{left:0,top:0,width:W,height:690},{left:0,top:690,width:W/2,height:600},{left:W/2,top:690,width:W/2,height:600}];
    regions.forEach((region,index)=>{
      if(slots[index].image)drawPhoto(ctx,slots[index],region.left,region.width,region.height,region.top);
    });
    const shade=ctx.createLinearGradient(0,900,0,1290);
    shade.addColorStop(0,'rgba(3,21,62,0)');shade.addColorStop(1,'rgba(3,21,62,.97)');
    ctx.fillStyle=shade;ctx.fillRect(0,900,W,390);
    paintCircle();
    paintEqualWidthBlock(headline,600,340,760,300,false,true);
    paintTripleCaption($('bottomHeadline').value);
    paintLogo(38,24);
  }

  function renderCollage(headline, loaded) {
    photoTop=0;photoHeight=H;
    ctx.fillStyle='#132743';ctx.fillRect(0,0,W,H);
    const height=H/Math.max(1,loaded.length);
    loaded.forEach((slot,i)=>drawPhoto(ctx,slot,0,W,height,i*height));
    const shade=ctx.createLinearGradient(0,930,0,H);
    shade.addColorStop(0,'rgba(3,21,62,0)');shade.addColorStop(.45,'rgba(3,21,62,.88)');shade.addColorStop(1,'#03153e');
    ctx.fillStyle=shade;ctx.fillRect(0,930,W,H-930);
    paintCircle();
    paintEqualWidthBlock(headline,W/2,970,W-152,290,true);
    paintLogo(38,34);
  }

  function render() {
    const loaded = slots.slice(0,isTriple()?3:2).filter(slot => slot.image);
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
    } else if (template==='triple') {
      renderTriple(headline);
    } else if (template==='split') {
      renderSplit(headline,loaded,width);
    } else if (template==='collage') {
      renderCollage(headline,loaded);
    } else {
      renderTop(headline, loaded, width);
    }
    // All templates share the existing PNG's lower branding strip.
    if(template!=='classic' && frameReady)ctx.drawImage(frame,0,H-110,W,110,0,H-110,W,110);
    $('touchArea').style.setProperty('--photo-top', photoTop/H*100+'%');
    $('touchArea').style.setProperty('--photo-height', photoHeight/H*100+'%');
    slots.forEach((slot, i) => {
      controls[i].remove.hidden = !slot.image;
      controls[i].card.hidden = !slot.image || (i===2 && !isTriple());
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
    $('circleOptions').hidden=!hasCircle();
    $('splitTextOptions').hidden=!hasTextBlocks();
    $('splitHelp').textContent=isTriple()?'Texto inferior en tres líneas automáticas. Una línea destaca un 15 % más grande.':'Frases automáticas ajustadas al mismo ancho. Usa Enter para indicar tus propias frases.';
    $('photoUpload').setAttribute('aria-label',isTriple()?'Seleccionar hasta tres fotos':'Seleccionar una o dos fotos');
    $('headline').setAttribute('aria-label',hasTextBlocks()?'Texto superior':'Titular');
    $('circleAdjust').hidden=!circle.image;
    const handle=$('circleHandle');
    handle.hidden=!hasCircle() || !circle.image;
    handle.style.left=circle.x/W*100+'%';handle.style.top=circle.y/H*100+'%';
    handle.style.width=circle.size/W*100+'%';handle.style.height=circle.size/H*100+'%';
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
    $('download').disabled = !loaded.length || !headline || !frameReady || !withinLimit || !titleFits || !fontReady;
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
    const maximum=isTriple()?3:2;
    if(selected.length>maximum){status('Selecciona un máximo de '+maximum+' fotos.');return;}
    if(!selected.length)return;
    const indices=target===undefined?selected.map((_,i)=>i):[target];
    const revisions=indices.map(i=>++slots[i].revision);
    // A batch replaces the complete selection, including pending image loads.
    if(target===undefined)for(let i=selected.length;i<slots.length;i++)removePhoto(i);
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
  $('circleUpload').addEventListener('change',async event=>{
    const file=event.target.files[0];event.target.value='';
    if(!file)return;
    const revision=++circle.revision;
    try{
      const image=await decode(file);
      if(revision!==circle.revision)return;
      circle.image=image;circle.zoom=100;$('circleZoom').value=100;status('');render();
    }catch{if(revision===circle.revision)status('No se pudo abrir la foto del círculo.');}
  });
  function clampCircle() {
    const radius=circle.size/2+5;
    circle.x=Math.min(W-radius,Math.max(radius,circle.x));
    circle.y=Math.min(H-110-radius,Math.max(radius,circle.y));
  }
  $('circleSize').oninput=event=>{circle.size=Number(event.target.value);clampCircle();render();};
  $('circleZoom').oninput=event=>{circle.zoom=Number(event.target.value);render();};
  $('removeCircle').onclick=()=>{circle.revision++;circle.image=null;circleDrag=null;render();};
  const circleHandle=$('circleHandle');
  circleHandle.onpointerdown=event=>{
    if(circleDrag || (event.pointerType==='mouse' && event.button!==0))return;
    const bounds=canvas.getBoundingClientRect();
    circleDrag={id:event.pointerId,x:event.clientX,y:event.clientY,cx:circle.x,cy:circle.y,scaleX:W/bounds.width,scaleY:H/bounds.height};
    circleHandle.setPointerCapture(event.pointerId);
  };
  circleHandle.onpointermove=event=>{
    if(!circleDrag || circleDrag.id!==event.pointerId)return;
    circle.x=circleDrag.cx+(event.clientX-circleDrag.x)*circleDrag.scaleX;
    circle.y=circleDrag.cy+(event.clientY-circleDrag.y)*circleDrag.scaleY;
    clampCircle();render();
  };
  circleHandle.onpointerup=circleHandle.onpointercancel=circleHandle.onlostpointercapture=()=>{circleDrag=null;};
  circleHandle.onkeydown=event=>{
    const moves={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};
    if(!moves[event.key])return;
    event.preventDefault();
    const [x,y]=moves[event.key], step=event.shiftKey?30:10;
    circle.x+=x*step;circle.y+=y*step;clampCircle();render();
  };
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
  function geometry(slot, width, height=photoHeight) {
    const base = Math.max(width/slot.image.naturalWidth, height/slot.image.naturalHeight)/100;
    return {w:slot.image.naturalWidth*base, h:slot.image.naturalHeight*base};
  }
  function photoAt(p) {
    const loaded = slots.slice(0,isTriple()?3:2).map((slot,i) => slot.image ? i : -1).filter(i => i >= 0);
    if(isTriple()){
      const index=p.y<690?0:(p.x<W/2?1:2);
      if(!slots[index].image){
        const fallback=loaded[0];
        return fallback===0?{i:0,left:0,top:0,width:W,height:690}:{i:fallback,left:fallback===1?0:W/2,top:690,width:W/2,height:600};
      }
      return index===0?{i:0,left:0,top:0,width:W,height:690}:{i:index,left:index===1?0:W/2,top:690,width:W/2,height:600};
    }
    if(isCollage()){
      const height=H/loaded.length, cell=clamp(Math.floor(p.y/height),0,loaded.length-1);
      return {i:loaded[cell],left:0,top:cell*height,width:W,height};
    }
    const width = W / loaded.length, cell = clamp(Math.floor(p.x / width), 0, loaded.length - 1);
    return {i:loaded[cell], left:cell*width, width};
  }
  function anchor({i, left, width, top=0, height=photoHeight}, c) {
    const slot = slots[i], {w,h} = geometry(slot,width,height);
    return {i,left,width,top,height,d:c.d,zoom:slot.zoom, x:(c.x-left+(w*slot.zoom-width)*slot.x/100)/(w*slot.zoom), y:(c.y-top+(h*slot.zoom-height)*slot.y/100)/(h*slot.zoom)};
  }
  function position({i,left,width,top,height,x,y}, c, zoom) {
    const slot = slots[i], g = geometry(slot,width,height);
    slot.zoom = clamp(zoom,100,300);
    const w=g.w*slot.zoom, h=g.h*slot.zoom;
    if (w-width > .001) slot.x = clamp((x*w-c.x+left)/(w-width)*100,0,100);
    if (h-height > .001) slot.y = clamp((y*h-c.y+top)/(h-height)*100,0,100);
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
    clearGesture();circleDrag=null;
    const previous=templates[templateIndex][0];
    if(hasCircle())circleLayouts[previous]={x:circle.x,y:circle.y,size:circle.size};
    templateIndex=(templateIndex+delta+templates.length)%templates.length;
    if(isTriple())lowerAccent=(lowerAccent+1+Math.floor(Math.random()*2))%3;
    if(isCollage())collageAccent=(collageAccent+1+Math.floor(Math.random()*2))%3;
    if(hasCircle()){
      Object.assign(circle,circleLayouts[templates[templateIndex][0]]);
      $('circleSize').value=circle.size;
    }
    scheduleCropLock();
    chooseFont(hasTextBlocks()?3:2);
  }
  $('templatePrev').onclick=()=>stepTemplate(-1);
  $('templateNext').onclick=()=>stepTemplate(1);
  $('cropToggle').onclick=()=>{clearGesture();cropEnabled=!cropEnabled;render();scheduleCropLock();};
  touchDevice.addEventListener('change',()=>{clearGesture();cropEnabled=false;render();scheduleCropLock();});
  const headlineInput = $('headline');
  function fitHeadlineInput(input=headlineInput) {
    input.style.height = '';
    input.style.fontSize = '';
    const baseSize = parseFloat(getComputedStyle(input).fontSize);
    for (let size = baseSize; size > 12 && input.scrollHeight > input.clientHeight; size--) {
      input.style.fontSize = Math.max(12, size - 1) + 'px';
    }
    const overflow = input.scrollHeight - input.clientHeight;
    if (overflow > 0) input.style.height = input.offsetHeight + overflow + 'px';
    input.scrollTop = 0;
  }

  function updateHeadline(event) {
    if (event.isComposing) return;
    const input=event.target;
    const words = [...input.value.matchAll(/\S+/g)];
    if (words.length > WORD_LIMIT) {
      const caret = input.selectionStart;
      input.value = input.value.slice(0, words[WORD_LIMIT].index).trimEnd();
      input.setSelectionRange(caret, caret);
    }
    fitHeadlineInput(input);
    render();
  }

  headlineInput.addEventListener('input', updateHeadline);
  headlineInput.addEventListener('compositionend', updateHeadline);
  $('bottomHeadline').addEventListener('input',updateHeadline);
  $('bottomHeadline').addEventListener('compositionend',updateHeadline);
  window.addEventListener('resize',()=>{fitHeadlineInput();fitHeadlineInput($('bottomHeadline'));});
  $('newDesign').onclick = () => { $('resetDialog').returnValue = ''; $('resetDialog').showModal(); };
  $('resetDialog').addEventListener('close', () => {
    if ($('resetDialog').returnValue !== 'reset') return;
    removePhoto(0); removePhoto(1); removePhoto(2); circle.revision++;Object.assign(circle,{image:null,x:910,y:690,size:380,zoom:100});circleDrag=null;$('circleSize').value=380;$('circleZoom').value=100; clearGesture(); templateIndex=0; lowerAccent=Math.floor(Math.random()*3); collageAccent=Math.floor(Math.random()*3); cropEnabled=false; headlineInput.value = ''; $('bottomHeadline').value=''; circleLayouts.triple={x:260,y:380,size:380};circleLayouts.collage={x:910,y:690,size:380};circleLayouts.split={x:290,y:1070,size:440}; fitHeadlineInput();fitHeadlineInput($('bottomHeadline')); chooseFont(2); headlineInput.focus();
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
