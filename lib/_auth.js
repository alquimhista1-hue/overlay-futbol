const crypto=require('crypto');
const COOKIE='rm_session';
function users(){return[[process.env.ADMIN_USER_1,process.env.ADMIN_PASSWORD_1],[process.env.ADMIN_USER_2,process.env.ADMIN_PASSWORD_2]].filter(item=>item[0]&&item[1])}
function safeEqual(a,b){const left=Buffer.from(String(a));const right=Buffer.from(String(b));return left.length===right.length&&crypto.timingSafeEqual(left,right)}
function secret(){if(!process.env.SESSION_SECRET)throw new Error('Falta SESSION_SECRET.');return process.env.SESSION_SECRET}
function sign(value){return crypto.createHmac('sha256',secret()).update(value).digest('base64url')}
function issue(user,profile,persistent){const payload=Buffer.from(JSON.stringify({user,...(profile?{uid:profile.id,version:profile.version_sesion}:{}),...(persistent?{sid:persistent.sid,key:persistent.key}:{}),exp:Date.now()+(persistent?180*86400000:8*3600000)})).toString('base64url');return `${payload}.${sign(payload)}`}
function parseCookies(req){return Object.fromEntries(String(req.headers.cookie||'').split(';').map(item=>item.trim().split('=').map(decodeURIComponent)).filter(item=>item.length===2))}
function verify(req){try{const token=parseCookies(req)[COOKIE];if(!token)return null;const[payload,signature]=token.split('.');if(!payload||!safeEqual(sign(payload),signature))return null;const data=JSON.parse(Buffer.from(payload,'base64url').toString('utf8'));return data.exp>Date.now()?data:null}catch{return null}}
function authenticate(user,password){return users().some(item=>safeEqual(item[0],user)&&safeEqual(item[1],password))}
function cookie(token,maxAge=28800){const expires=new Date(Date.now()+maxAge*1000).toUTCString();return `${COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}; Expires=${expires}`}
function legacyVersion(user){const entry=users().find(item=>safeEqual(item[0],user));return entry?sign(JSON.stringify(entry)):null}
module.exports={authenticate,issue,verify,cookie,legacyVersion};
