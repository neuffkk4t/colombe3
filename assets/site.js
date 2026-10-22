(function(){
  var $=function(id){return document.getElementById(id)};

  // Galerie horizontale
  var rail=$('rail');
  function step(d){var s=rail.querySelector('.slide');rail.scrollBy({left:d*(s.offsetWidth+14),behavior:'smooth'})}
  $('prev').addEventListener('click',function(){step(-1)});
  $('next').addEventListener('click',function(){step(1)});

  // Vidéos : lues directement dans la page une fois le site en ligne
  var embed=true;
  document.querySelectorAll('.video[data-yt]').forEach(function(a){
    a.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();a.click()}});
    a.addEventListener('click',function(e){
      if(a.querySelector('iframe'))return;
      var f=document.createElement('iframe');
      f.src='https://www.youtube-nocookie.com/embed/'+a.dataset.yt+'?autoplay=1&rel=0&playsinline=1';
      f.title='Vidéo de la Cité Colombe III';
      f.allow='autoplay; encrypted-media; picture-in-picture; fullscreen';
      f.setAttribute('allowfullscreen','');
      f.style.cssText='position:absolute;inset:0;width:100%;height:100%;border:0';
      a.replaceChildren(f);a.style.cursor='default';
    });
  });

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
      $('s-prix').textContent=nf(P);
      $('s-list').innerHTML=L.map(function(x){return '<li><span>'+x[0]+'</span><b>'+nf(x[1])+'</b></li>'}).join('');
      $('s-now').textContent=nf(now);
      $('simval').value='Gamme '+names[P]+' ('+nf(P)+'), '+(m==='ech'?'paiement échelonné':'prêt bancaire')+', à prévoir pour démarrer : '+nf(now);
    }
    box.addEventListener('change',calc);calc();
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
      err.hidden=false;btn.disabled=false;btn.textContent='Envoyer ma demande';
    }
  });
})();
