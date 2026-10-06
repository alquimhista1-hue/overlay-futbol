let adCycleStart=Date.now(),lastSlot=-1;
function renderSponsorCycle(){
  const elapsed=Date.now()-adCycleStart,cycle=600000,slot=Math.floor((elapsed%cycle)/10000);
  const active=SponsorStore.items.filter(item=>item.active).slice(0,60);
  if(slot>=active.length){sponsorContainer.classList.remove('active');lastSlot=-1;return;}
  const item=active[slot],url=SponsorStore.url(item);
  if(lastSlot!==slot||sponsorImage.src!==url){sponsorContainer.classList.remove('active');sponsorImage.onload=()=>sponsorContainer.classList.add('active');sponsorImage.onerror=()=>sponsorContainer.classList.remove('active');sponsorImage.src=url;sponsorImage.alt=item.name;lastSlot=slot;}
}
SponsorStore.subscribe(()=>{lastSlot=-1;renderSponsorCycle()});
SponsorStore.load().catch(()=>{});setInterval(()=>SponsorStore.load().catch(()=>{}),5000);
renderSponsorCycle();setInterval(renderSponsorCycle,250);
