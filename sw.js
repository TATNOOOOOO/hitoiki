const V='hitoiki-v3',A=['./','index.html','style.css','app.js','icon.svg','icon-192.png','manifest.webmanifest'];
self.addEventListener('install',e=>e.waitUntil(caches.open(V).then(c=>c.addAll(A))));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(fetch(e.request).then(x=>{if(x.ok&&x.status===200){const y=x.clone();caches.open(V).then(c=>c.put(e.request,y))}return x}).catch(()=>caches.match(e.request)))});
self.addEventListener('notificationclick',e=>{e.notification.close();e.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(l=>l.length?l[0].focus():clients.openWindow('./')))});
