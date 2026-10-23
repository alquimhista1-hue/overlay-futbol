window.addEventListener('storage',e=>{if(e.key===LOCAL_CACHE_KEY){const cached=loadLocalCache();if(cached){state=cached;updateUI();if(state.isRunning)startTimerLocal();else stopTimerLocal()}}});
