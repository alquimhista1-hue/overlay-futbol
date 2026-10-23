// Maps a username/phone to a stable internal Supabase Auth identifier.
// The .invalid domain is reserved and is never used to send email.
(() => {
 function normalize(raw){const value=String(raw||'').normalize('NFKC').trim().toLowerCase();if(/^[+\d\s().-]+$/.test(value)&&/\d/.test(value)){const digits=value.replace(/\D/g,'');if(digits.length<8||digits.length>15)throw Error('Escribe un teléfono de 8 a 15 dígitos.');return {key:'phone:'+digits,label:digits};}if(!/^[a-z0-9][a-z0-9._-]{2,39}$/.test(value))throw Error('Usa un usuario de 3 a 40 caracteres: letras sin tildes, números, punto, guion o guion bajo.');return {key:'user:'+value,label:value};}
 async function email(raw){const identity=normalize(raw);const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(identity.key));const token=Array.from(new Uint8Array(hash),byte=>byte.toString(16).padStart(2,'0')).join('');return {email:token+'@users.cdn-studio.invalid',label:identity.label};}
 window.StudioIdentity={normalize,email};
})();
