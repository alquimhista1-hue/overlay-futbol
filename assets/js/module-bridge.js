(() => {
 const studio=window.parent!==window?window.parent.Studio:null;
 if(!studio?.session){location.replace('../../index.html');return;}
 window.STUDIO_OWNER=studio.userId;
 window.StudioBridge={studio,get profile(){return studio.profile},documentId:new URLSearchParams(location.search).get('doc'),kind:location.pathname.includes('/cotizaciones/')?'quotation':'design',async load(){if(!this.documentId)return null;return studio.readDocument(this.documentId)},async save(title,payload){this.documentId=await studio.saveDocument(this.documentId,this.kind,title,payload);history.replaceState(null,'','?doc='+encodeURIComponent(this.documentId));return this.documentId;}};
})();
