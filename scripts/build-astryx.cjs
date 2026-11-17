const {copyFileSync,mkdirSync}=require('node:fs');
mkdirSync('assets/css',{recursive:true});
copyFileSync(require.resolve('@astryxdesign/core/astryx.css'),'assets/css/astryx-core.css');
