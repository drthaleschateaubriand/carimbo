const fs=require('fs');const {minify}=require('terser');
(async()=>{
 const src=fs.readFileSync('carimbar-grok.js','utf8');
 const r=await minify(src,{compress:{passes:2},mangle:true,format:{comments:false},ecma:2017});
 const min='/* CARIMBAR - versao Grok */'+r.code;
 fs.writeFileSync('carimbar-grok.min.js',min);
 const url='javascript:'+encodeURIComponent(r.code).replace(/'/g,'%27');
 fs.writeFileSync('carimbar-grok-favorito.txt',url);
 const esc=s=>s.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
 const html='<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Instalar CARIMBAR Grok v2</title><body style="font-family:Arial;padding:20px;max-width:640px"><h2>CARIMBAR Grok v2 (versão corrigida, sem carregar nada de fora)</h2><p>Esta é a versão Grok. A barra mostra um pequeno rótulo "Grok v2" para você saber qual versão está usando. A versão original continua separada.</p><p>No computador: arraste o botão abaixo para a barra de favoritos.</p><p><a href="'+esc(url)+'" style="background:#2ecc71;color:#06321a;padding:12px 20px;border-radius:8px;font-weight:bold;text-decoration:none">CARIMBAR Grok v2</a></p><p>No celular: copie o texto abaixo, crie um favorito qualquer (nome sugerido: CARIMBAR Grok v2) e cole este texto no endereço dele.</p><textarea style="width:100%;height:160px" readonly onclick="this.select()">'+esc(url)+'</textarea><p style="color:#666;font-size:13px">Se a barra da versão original já estiver aberta na página, feche-a (X) antes de acionar a versão Grok.</p></body>\n';
 fs.writeFileSync('carimbar-grok-instalar.html',html);
 console.log({min:min.length,url:url.length});
})();
