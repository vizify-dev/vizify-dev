export const INTERACTIVE_SCRIPT = String.raw`(function(){
  var table=document.querySelector("table"); if(!table||!table.tBodies[0]) return;
  var tbody=table.tBodies[0], rows=Array.from(tbody.rows), heads=Array.from(table.tHead.rows[0].cells);
  var PAGE=10, page=1, sortCol=-1, dir=0;

  var text=function(r,c){return r.cells[c].textContent.trim();};

  // Highlight values that repeat within a column (case-insensitive).
  heads.forEach(function(_,c){
    var count={};
    rows.forEach(function(r){var v=text(r,c).toLowerCase(); if(v) count[v]=(count[v]||0)+1;});
    rows.forEach(function(r){var v=text(r,c).toLowerCase(); if(v&&count[v]>1) r.cells[c].classList.add("cssv-dup");});
  });

  // Sort arrows in each header: click cycles asc -> desc -> original order.
  heads.forEach(function(th,c){
    var s=document.createElement("span"); s.className="cssv-sort"; s.setAttribute("aria-hidden","true");
    s.innerHTML='<i class="up">\u25B2</i><i class="down">\u25BC</i>';
    th.appendChild(s); th.tabIndex=0; th.setAttribute("aria-sort","none");
    var go=function(){
      if(sortCol===c){dir=dir===1?-1:dir===-1?0:1;} else {sortCol=c;dir=1;}
      if(dir===0) sortCol=-1;
      heads.forEach(function(h,i){h.setAttribute("aria-sort",i===sortCol?(dir===1?"ascending":"descending"):"none");});
      page=1; render();
    };
    th.addEventListener("click",go);
    th.addEventListener("keydown",function(e){if(e.key==="Enter"||e.key===" "){e.preventDefault();go();}});
  });

  var pager=document.createElement("div"); pager.className="cssv-pager"; table.after(pager);

  function sorted(){
    if(dir===0) return rows.slice();
    return rows.slice().sort(function(a,b){
      var x=text(a,sortCol), y=text(b,sortCol), nx=parseFloat(x), ny=parseFloat(y);
      var cmp=(!isNaN(nx)&&!isNaN(ny)&&isFinite(x)&&isFinite(y))?nx-ny:x.localeCompare(y,undefined,{numeric:true,sensitivity:"base"});
      return cmp*dir;
    });
  }

  function render(){
    var all=sorted(), pages=Math.max(1,Math.ceil(all.length/PAGE));
    page=Math.min(page,pages);
    tbody.replaceChildren.apply(tbody,all.slice((page-1)*PAGE,page*PAGE));
    pager.hidden=all.length<=PAGE;
    pager.innerHTML="";
    var info=document.createElement("span");
    info.textContent="Page "+page+" of "+pages+" \u00B7 "+all.length+" rows";
    var nav=document.createElement("div");
    var btn=function(label,p,disabled,on){
      var b=document.createElement("button"); b.type="button"; b.textContent=label; b.disabled=disabled;
      if(on) b.className="on";
      b.onclick=function(){page=p;render();}; nav.appendChild(b);
    };
    btn("Prev",page-1,page===1);
    for(var p=1;p<=pages;p++){ if(p===1||p===pages||Math.abs(p-page)<=1) btn(String(p),p,false,p===page); else if(Math.abs(p-page)===2){var d=document.createElement("span");d.textContent="\u2026";nav.appendChild(d);} }
    btn("Next",page+1,page===pages);
    pager.append(info,nav);
  }
  render();
})();`;
