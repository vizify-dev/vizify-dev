const BAR = `
<style>
.vz-bar{display:flex;align-items:center;gap:8px;margin-bottom:16px;font:14px system-ui,sans-serif}
.vz-title{font:600 26px Georgia,serif;margin-right:auto;white-space:nowrap}
.vz-title:empty{display:none}
.vz-search{flex:1;min-width:0;display:flex;align-items:center;gap:8px;height:36px;padding:0 10px;border:1px solid #e2e7f0;border-radius:8px;background:#fff;color:#5f6a7f}
.vz-search input{flex:1;min-width:0;height:100%;border:0;outline:0;padding:0;background:transparent;font:inherit;color:#1f2837}
.vz-search kbd{font:11px system-ui,sans-serif;color:#5f6a7f;border:1px solid #e2e7f0;border-radius:6px;padding:2px 6px}
.vz-bar select,.vz-bar button{height:36px;border:1px solid #e2e7f0;border-radius:8px;padding:0 12px;font:inherit;background:#fff;color:#1f2837}
.vz-bar button{cursor:pointer;width:36px;padding:0}
.vz-count{color:#5f6a7f;font-size:12px;white-space:nowrap}
tr[hidden]{display:none!important}
</style>
<div class="vz-bar">
  <span class="vz-title" id="vz-title"></span>
  <label class="vz-search">
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5 14 14"/></svg>
    <input id="vz-q" type="search" placeholder="Search…" aria-label="Search table">
    <kbd>⌘K</kbd>
  </label>
  <select id="vz-col" aria-label="Sort by"><option value="">Sort by…</option></select>
  <button id="vz-dir" type="button" aria-label="Toggle sort direction">↑</button>
  <span class="vz-count" id="vz-n"></span>
</div>`;

const SCRIPT = `
<script>
(function(){
  var t=document.querySelector('table'); if(!t||!t.tBodies[0]) return;
  var body=t.tBodies[0], orig=[].slice.call(body.rows), asc=true;
  var heads=[].map.call(t.querySelectorAll('thead th'),function(h){return h.textContent.trim();});

  function idx(name){return heads.findIndex(function(h){return h.toLowerCase()===name;});}
  function slug(s){return s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');}
  function hue(s){var h=0;for(var i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))%360;return h;}

  // Saves original text (for search/sort), then adds status pills + owner avatars.
  function enhanceTable(){
    orig.forEach(function(r){
      [].forEach.call(r.cells,function(c){c.setAttribute('data-v',c.textContent.trim());});
    });
    var si=idx('status'), oi=idx('owner'), di=idx('due');;
    orig.forEach(function(r){
      var c,v;
      if(si>-1&&(c=r.cells[si])&&(v=c.getAttribute('data-v'))){
        var p=document.createElement('span');
        p.className='status-pill '+slug(v); p.textContent=v;
        var si=idx('status'), oi=idx('owner'), di=idx('due');
        c.textContent=''; c.appendChild(p);
      }
      if(oi>-1&&(c=r.cells[oi])&&(v=c.getAttribute('data-v'))){
        var w=document.createElement('div'); w.className='owner-cell';
        var a=document.createElement('div'); a.className='avatar '+slug(v);
        a.textContent=v.charAt(0).toUpperCase(); a.setAttribute('aria-hidden','true');
        if(['sam','priya','lee'].indexOf(slug(v))<0) a.style.background='hsl('+hue(v)+',55%,45%)';
        var s=document.createElement('span'); s.textContent=v;
        w.appendChild(a); w.appendChild(s); c.textContent=''; c.appendChild(w);
      }
    });
  }
    

  enhanceTable(); // must run before search/sort so data-v exists

  var q=document.getElementById('vz-q'), col=document.getElementById('vz-col'),
      dir=document.getElementById('vz-dir'), n=document.getElementById('vz-n');
      var ttl=getComputedStyle(document.documentElement).getPropertyValue('--vz-title').trim().replace(/^["']|["']$/g,'');
var tEl=document.getElementById('vz-title'); tEl.textContent=tEl.getAttribute('data-t')||ttl;
document.addEventListener('keydown',function(e){if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();q.focus();}});
  heads.forEach(function(h,i){col.add(new Option(h,i));});

  function num(s){var v=parseFloat(String(s).replace(/[,$%\\s]/g,''));return isNaN(v)?null:v;}
  function cell(r,i){var c=r.cells[i];return c?(c.getAttribute('data-v')||''):'';}

  function sort(){
    var i=col.value, rows=orig.slice();
    if(i!==''){
      rows.sort(function(a,b){
        var x=cell(a,i),y=cell(b,i),nx=num(x),ny=num(y);
        var r=(nx!==null&&ny!==null)?nx-ny:x.localeCompare(y,undefined,{numeric:true,sensitivity:'base'});
        return asc?r:-r;
      });
    }
    rows.forEach(function(r){body.appendChild(r);});
  }
  function filter(){
    var s=q.value.toLowerCase(),c=0;
    orig.forEach(function(r){
      var txt=[].map.call(r.cells,function(x){return x.getAttribute('data-v')||'';}).join(' ').toLowerCase();
      var ok=txt.indexOf(s)>-1; r.hidden=!ok; if(ok)c++;
    });
    n.textContent=c+' / '+orig.length;
  }
  q.oninput=filter; col.onchange=sort;
  dir.onclick=function(){asc=!asc;dir.textContent=asc?'↑':'↓';sort();};
  filter();
  if(di>-1) orig.forEach(function(r){if(r.cells[di]) r.cells[di].classList.add('col-due');});
})();
</script>`;

/** Inject toolbar after <body> and script before </body>. */
export function withTools(html: string, title?: string): string {
  const attr = (title ?? "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  return html
    .replace(/<body[^>]*>/i, (m) => m + BAR.replace('id="vz-title"', `id="vz-title" data-t="${attr}"`))
    .replace(/<\/body>/i, () => SCRIPT + "</body>");
}