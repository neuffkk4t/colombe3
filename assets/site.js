(function(){
  var $=function(id){return document.getElementById(id)};

  // Galerie horizontale
  var rail=$('rail');
  function step(d){var s=rail.querySelector('.slide');rail.scrollBy({left:d*(s.offsetWidth+14),behavior:'smooth'})}
  $('prev').addEventListener('click',function(){step(-1)});
  $('next').addEventListener('click',function(){step(1)});

  // Vidéos : lecteur YouTube dans la page. Une seule vidéo à la fois, et pause quand on s'en éloigne.
  var frames=[].slice.call(document.querySelectorAll('.video iframe'));
  function pauseVid(f){try{f.contentWindow.postMessage(JSON.stringify({event:'command',func:'pauseVideo',args:[]}),'*')}catch(e){}}
  frames.forEach(function(f){
    f.addEventListener('load',function(){try{f.contentWindow.postMessage(JSON.stringify({event:'listening',id:1,channel:'widget'}),'*')}catch(e){}});
    if('IntersectionObserver' in window){
      new IntersectionObserver(function(en){en.forEach(function(x){if(x.intersectionRatio<0.3)pauseVid(f)})},{threshold:[0,0.3,1]}).observe(f);
    }
  });
  window.addEventListener('message',function(e){
    if(!/youtube(-nocookie)?\.com$/.test(e.origin.replace(/^https?:\/\//,'')))return;
    var d;try{d=typeof e.data==='string'?JSON.parse(e.data):e.data}catch(x){return}
    if(!d)return;
    var st=d.event==='onStateChange'?d.info:(d.info&&d.info.playerState);
    if(st===1)frames.forEach(function(f){if(f.contentWindow!==e.source)pauseVid(f)});
  });
  document.addEventListener('visibilitychange',function(){if(document.hidden)frames.forEach(pauseVid)});

  // Mouvement : parallaxe au défilement, hero qui s'agrandit, inclinaison à la souris
  var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(!reduce){
    var grow=[].slice.call(document.querySelectorAll('[data-grow]'));
    var par=[].slice.call(document.querySelectorAll('.par img'));
    var ticking=false;
    var update=function(){
      ticking=false;var vh=window.innerHeight;
      grow.forEach(function(el){
        var r=el.getBoundingClientRect();
        var p=Math.min(1,Math.max(0,(vh-r.top)/(vh*.8)));
        el.style.transform='scale('+(.86+.14*p).toFixed(4)+')';
        el.style.setProperty('--r',(34-16*p).toFixed(1)+'px');
      });
      par.forEach(function(img){
        var r=img.parentElement.getBoundingClientRect();
        if(r.bottom<-120||r.top>vh+120)return;
        var c=(r.top+r.height/2-vh/2)/vh;
        img.style.transform='translate3d(0,'+(c*-40).toFixed(1)+'px,0) scale(1.15)';
      });
    };
    var onScroll=function(){if(!ticking){ticking=true;requestAnimationFrame(update)}};
    window.addEventListener('scroll',onScroll,{passive:true});
    window.addEventListener('resize',onScroll);
    update();

    if(matchMedia('(hover:hover) and (pointer:fine)').matches){
      document.querySelectorAll('.tilt').forEach(function(el){
        el.addEventListener('pointermove',function(e){
          var r=el.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;
          el.style.transform='perspective(900px) rotateY('+(x*10).toFixed(2)+'deg) rotateX('+(-y*10).toFixed(2)+'deg) scale(1.03)';
          el.style.setProperty('--mx',((x+.5)*100).toFixed(1)+'%');el.style.setProperty('--my',((y+.5)*100).toFixed(1)+'%');
        });
        el.addEventListener('pointerleave',function(){el.style.transform=''});
      });
      var hero=document.querySelector('.hero'),layers=hero.querySelectorAll('[data-depth]');
      hero.addEventListener('pointermove',function(e){
        var r=hero.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;
        layers.forEach(function(l){var d=parseFloat(l.dataset.depth);l.style.translate=(-x*d).toFixed(1)+'px '+(-y*d*.6).toFixed(1)+'px'});
      });
      hero.addEventListener('pointerleave',function(){layers.forEach(function(l){l.style.translate=''})});
    }
    // Apparition des titres, cartes et listes au défilement (seulement ce qui est sous l'écran au chargement)
    var vh0=window.innerHeight;
    var singles=['.sec .eyebrow','.sec .h2','.sec .lead','.plans h3','.plans > p','.imagine h2','.vcta','.sim','.sched','.metiers','.about .logo'];
    var groups=['.tiles > li','.stats > .stat','.feat > li','.plan-grid > *','.pts > li','.tiers > *','.steps > *','.sched .bar','.pay-notes > div','.timeline > .tl','.trio > *'];
    var io=('IntersectionObserver' in window)?new IntersectionObserver(function(en){
      // L'animation se rejoue à chaque retour : entrée = visible, sortie complète de l'écran = prêt à rejouer
      en.forEach(function(x){
        var t=x.target;
        if(x.isIntersecting&&x.intersectionRatio>=0.12){if(!t.classList.contains('in')){t.classList.add('in');if(t._cnt)t._cnt()}}
        else if(!x.isIntersecting){t.classList.remove('in');if(t._rst)t._rst()}
      });
    },{threshold:[0,0.12],rootMargin:'0px 0px -6% 0px'}):null;
    function arm(el,d){
      if(!io||el.closest('.tilt,.par,.story,.hero'))return;
      var r=el.getBoundingClientRect();
      if(r.top<vh0*0.92)return;
      el.classList.add('rv');if(d)el.style.setProperty('--d',d+'s');io.observe(el);
    }
    singles.forEach(function(q){document.querySelectorAll(q).forEach(function(el){arm(el,0)})});
    groups.forEach(function(q){
      var last=null,k=0;
      document.querySelectorAll(q).forEach(function(el){
        var p=el.parentElement;if(p!==last){last=p;k=0}
        arm(el,Math.min(k*0.09,0.45));k++;
      });
    });
    // Chiffres qui comptent de zéro à leur valeur
    document.querySelectorAll('.stat b').forEach(function(b){
      var t=b.textContent,m=t.match(/^(\d[\d\s\u00a0]*)(.*)$/);
      if(!m||/[\/]/.test(m[2])||!io)return;
      var r=b.getBoundingClientRect();if(r.top<vh0*0.92)return;
      var n=parseInt(m[1].replace(/\D/g,''),10),suf=m[2],big=n>=1000;
      var fmt=function(v){var x=String(v);return big?x.replace(/\B(?=(\d{3})+(?!\d))/g,'\u00a0'):x};
      b.textContent=fmt(0)+suf;
      b._rst=function(){b.textContent=fmt(0)+suf};
      b._cnt=function(){
        var t0=performance.now(),dur=1400;
        (function f(now){var p=Math.min(1,(now-t0)/dur),e=1-Math.pow(1-p,3);b.textContent=fmt(Math.round(n*e))+suf;if(p<1)requestAnimationFrame(f);else b.textContent=t}) (t0);
      };
      io.observe(b);
    });

  }


  // Histoire épinglée : image et texte changent au défilement
  (function(){
    var st=document.querySelector('.story');if(!st)return;
    if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    var fr=[].slice.call(st.querySelectorAll('.frame')),cp=[].slice.call(st.querySelectorAll('.cap')),dots=[].slice.call(st.querySelectorAll('.dots li')),n=fr.length,tk=false;
    function run(){
      tk=false;var r=st.getBoundingClientRect(),vh=window.innerHeight;
      var p=Math.min(.9999,Math.max(0,-r.top/(r.height-vh))),x=p*n,i=Math.floor(x),f=x-i,T=.8;
      fr.forEach(function(el,k){
        var o=0,sc=1.1;
        if(k===i){o=1;sc=1.1-.1*f}
        else if(k===i+1&&f>T){o=(f-T)/(1-T);sc=1.1}
        el.style.opacity=o.toFixed(3);el.firstElementChild.style.transform='scale('+sc.toFixed(4)+')';
        var c=cp[k],co=0,cy=0;
        if(k===i){co=f<T?1:1-(f-T)/(1-T);cy=f<T?0:-24*(f-T)/(1-T);if(i===0&&f<.04)co=1}
        else if(k===i+1&&f>T){co=(f-T)/(1-T);cy=24*(1-co)}
        c.style.opacity=co.toFixed(3);c.style.transform='translate3d(0,'+cy.toFixed(1)+'px,0)';
      });
      dots.forEach(function(d,k){d.classList.toggle('on',k===i)});
    }
    function on(){if(!tk){tk=true;requestAnimationFrame(run)}}
    addEventListener('scroll',on,{passive:true});addEventListener('resize',on);run();
  })();

  // Simulateur d'achat
  (function(){
    var box=document.getElementById('simulateur');if(!box)return;
    var nf=function(n){return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g,'\u202f')+'\u00a0FCFA'};
    var names={75000000:'Standard',90000000:'Premium',110000000:'Majestic'};
    var steps=[['Apport, sous 15 jours',.2],['Superstructure',.3],['Hors d\'eau',.2],['Hors d\'air',.2],['Finitions intérieures',.05],['Remise des clés',.05]];
    function calc(){
      var P=+box.querySelector('[name=g]:checked').value,m=box.querySelector('[name=m]:checked').value,L=[],now,txt;
      var fr=400000;
      if(m==='ech'){
        steps.forEach(function(t){L.push([t[0]+' ('+Math.round(t[1]*100)+'\u00a0%)',P*t[1]])});
        now=fr+P*.2;
      }else{
        L.push(['Apport, sous 15 jours (20\u00a0%)',P*.2]);
        L.push(['Complément avant la procédure (10\u00a0%)',P*.1]);
        L.push(['Prêt bancaire (70\u00a0%)',P*.7]);
        now=fr+P*.2;
      }
      L.unshift(['Frais de dossier, à l\'ouverture',fr]);
      $('s-list').innerHTML=L.map(function(x){return '<li><span>'+x[0]+'</span><b data-to="'+x[1]+'">'+nf(x[1])+'</b></li>'}).join('');
      $('s-prix').dataset.to=P;$('s-now').dataset.to=now;
      $('s-prix').textContent=nf(P);$('s-now').textContent=nf(now);
      count();
      $('simval').value='Gamme '+names[P]+' ('+nf(P)+'), '+(m==='ech'?'paiement échelonné':'prêt bancaire')+', à prévoir pour démarrer : '+nf(now);
    }
    var seen={},anim=!matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Les montants comptent jusqu'à leur valeur : au changement de choix (depuis l'ancienne valeur) et à chaque arrivée sur le simulateur (depuis zéro)
    function count(from0){
      if(!anim)return;
      var els=[].slice.call(box.querySelectorAll('[data-to]')),t0=performance.now(),dur=from0?1200:650;
      var starts=els.map(function(el,i){var k=el.id||('l'+i);return from0?0:(seen[k]||0)});
      els.forEach(function(el,i){seen[el.id||('l'+i)]=+el.dataset.to});
      (function f(now){
        var p=Math.min(1,(now-t0)/dur),e=1-Math.pow(1-p,3);
        els.forEach(function(el,i){var to=+el.dataset.to;el.textContent=nf(starts[i]+(to-starts[i])*(p<1?e:1))});
        if(p<1)requestAnimationFrame(f);
      })(t0);
    }
    box.addEventListener('change',function(){calc()});calc();
    if(anim&&'IntersectionObserver' in window){
      var r0=box.getBoundingClientRect();
      new IntersectionObserver(function(en){en.forEach(function(x){
        if(x.isIntersecting&&x.intersectionRatio>=0.25){count(true)}
        else if(!x.isIntersecting){box.querySelectorAll('[data-to]').forEach(function(el){el.textContent=nf(0)})}
      })},{threshold:[0,0.25]}).observe(box);
    }
  })();

  // Réglage : adresse qui reçoit les demandes une fois la page en ligne
  // (web app Google Apps Script qui écrit chaque demande dans la feuille de leads).
  // Laissée vide (aperçu), la page affiche la confirmation sans transmettre la demande.
  var CFG=window.COLOMBE3||{};
  var LEAD_ENDPOINT=CFG.LEAD_ENDPOINT||"";
  var WA_NUMBER=CFG.WHATSAPP||"2250767989898";

  var form=$('lead');
  function setErr(id,msg,input){$(id).textContent=msg||'';if(input){if(msg)input.setAttribute('aria-invalid','true');else input.removeAttribute('aria-invalid')}}
  function track(){
    var o={};
    try{var p=new URLSearchParams(location.search);['utm_source','utm_medium','utm_campaign','offre'].forEach(function(k){if(p.get(k))o[k]=p.get(k)})}catch(e){}
    return o;
  }
  function validate(){
    var ok=true,nom=$('nom'),tel=$('tel'),mail=$('mail');
    if(!nom.value.trim()){setErr('e-nom','Indiquez votre nom et prénom.',nom);ok=false}else setErr('e-nom','',nom);
    if(tel.value.replace(/\D/g,'').length<8){setErr('e-tel','Indiquez un numéro de téléphone valide.',tel);ok=false}else setErr('e-tel','',tel);
    if(mail.value&&!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail.value)){setErr('e-mail','Cette adresse e-mail semble incorrecte.',mail);ok=false}else setErr('e-mail','',mail);
    var c=$('consent');
    if(!c.checked){setErr('e-consent','Cochez cette case pour que nous puissions vous contacter.',c);ok=false}else setErr('e-consent','',c);
    return ok;
  }
  async function save(data){
    if(!LEAD_ENDPOINT)return 'demo';
    // Apps Script répond par une redirection : la réponse est opaque, l'envoi est considéré réussi sans erreur réseau.
    await fetch(LEAD_ENDPOINT,{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(data)});
    return 'sent';
  }
  function waLink(d){
    var t='Bonjour, je suis '+d.nom+'. Je souhaite des informations sur un F4 à la Cité Colombe III'+(d.budget?' (budget : '+d.budget+')':'')+'.';
    return 'https://wa.me/'+WA_NUMBER+'?text='+encodeURIComponent(t);
  }
  form.addEventListener('submit',async function(ev){
    ev.preventDefault();
    var err=$('formerr');err.hidden=true;
    if(form.site.value)return; // champ piège
    if(!validate()){var bad=form.querySelector('[aria-invalid="true"]');if(bad)bad.focus();return}
    var fd=new FormData(form),data={};
    fd.forEach(function(v,k){if(k!=='site')data[k]=String(v).trim()});
    data.horodateur=new Date().toISOString();
    data.page='Cité Colombe III';
    Object.assign(data,track());
    var btn=$('send');btn.disabled=true;btn.textContent='Envoi en cours…';
    try{
      var res=await save(data);
      try{sessionStorage.setItem('c3nom',(data.nom||'').split(/\s+/)[0])}catch(e){}
      location.href='merci.html';
    }catch(e){
      err.innerHTML="L'envoi a échoué. Réessayez, ou <a href=\""+waLink(data)+"\" target=\"_blank\" rel=\"noopener\">écrivez-nous sur WhatsApp</a> ou appelez le (+225) 07 67 98 98 98.";
      err.hidden=false;btn.disabled=false;btn.textContent='Je confirme ma demande';
    }
  });
})();
