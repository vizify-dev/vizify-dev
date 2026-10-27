export const SCRIPT_SOURCE = String.raw`(function(){
  var t=document.querySelector('table'); if(!t||!t.tBodies[0]) return;
  var body=t.tBodies[0], orig=[].slice.call(body.rows), asc=true;
  var heads=[].map.call(t.querySelectorAll('thead th'),function(h){return h.textContent.trim();});
  var di;

  function idx(name){return heads.findIndex(function(h){return h.toLowerCase()===name;});}
  function slug(s){return s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');}
  function hue(s){var h=0;for(var i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))%360;return h;}

  // Saves original text (for search/sort), then adds status pills + owner avatars.
  function enhanceTable(){
    di=idx('due');
    orig.forEach(function(r){
      [].forEach.call(r.cells,function(c){c.setAttribute('data-v',c.textContent.trim());});
    });
    var si=idx('status'), oi=idx('owner');
    orig.forEach(function(r){
      var c,v;
      if(si>-1&&(c=r.cells[si])&&(v=c.getAttribute('data-v'))){
        var p=document.createElement('span');
        p.className='status-pill '+slug(v); p.textContent=v;
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

  function num(s){var v=parseFloat(String(s).replace(/[,$%\s]/g,''));return isNaN(v)?null:v;}
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
})();`;
