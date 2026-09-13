let token=localStorage.getItem('jhn_admin_token')||'',products=[],orders=[];const $=id=>document.getElementById(id),money=n=>Number(n||0).toLocaleString('en-US');
async function api(url,opt={}){opt.headers={...(opt.headers||{}),Authorization:'Bearer '+token,'Content-Type':'application/json'};const r=await fetch(url,opt);if(r.status===401){logout();throw Error('Unauthorized')}return r.json()}
async function login(){const r=await fetch('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:$('password').value})});if(!r.ok)return alert('Wrong password');const d=await r.json();token=d.token;localStorage.setItem('jhn_admin_token',token);show();load()}
function logout(){localStorage.removeItem('jhn_admin_token');token='';$('app').hidden=true;$('login').hidden=false}
async function load(){const s=await api('/api/store');products=s.products;const o=await api('/api/admin/orders');orders=o;renderOrders();renderProducts();$('ordersCount').textContent=orders.length;$('newCount').textContent=orders.filter(x=>x.status==='New').length;$('productsCount').textContent=products.length;$('sales').textContent='৳'+money(orders.filter(x=>x.status==='Delivered').reduce((a,x)=>a+x.total,0));$('whatsapp').value=s.settings.whatsapp||'';$('dhaka').value=s.settings.dhaka||0;$('outside').value=s.settings.outside||0;$('storePhone').value=s.settings.storePhone||''}
function show(){$('login').hidden=true;$('app').hidden=false}
function renderOrders(){$('ordersList').innerHTML=orders.map(o=>`<article class="order"><div><b>${o.id}</b> — ${o.name} — ${o.phone}</div><p>${o.items.map(i=>`${i.name} (${i.size}/${i.color}) ×${i.qty}`).join('<br>')}</p><p>${o.address} • ${o.area} • ৳${money(o.total)}</p><select onchange="status('${o.id}',this.value)">${['New','Confirmed','Packed','Shipped','Delivered','Cancelled'].map(s=>`<option ${s===o.status?'selected':''}>${s}</option>`).join('')}</select></article>`).join('')||'<p>No orders yet.</p>'}
async function status(id,status){await api('/api/admin/orders/'+id,{method:'PATCH',body:JSON.stringify({status})});load()}
function renderProducts(){$('productList').innerHTML=products.map(p=>`<article class="product"><img src="${p.img}"><div><b>${p.name}</b><p>৳${money(p.price)} • ${p.cat}</p><button onclick="edit('${p.id}')">Edit</button> <button onclick="del('${p.id}')">Delete</button></div></article>`).join('')}
function edit(id){const p=products.find(x=>x.id===id);$('pid').value=p.id;$('pname').value=p.name;$('pprice').value=p.price;$('pcat').value=p.cat;$('pimg').value=p.img;$('ptag').value=p.tag||'';$('productModal').hidden=false}
async function del(id){if(!confirm('Delete this product?'))return;await api('/api/admin/products/'+id,{method:'DELETE'});load()}
$('loginBtn').onclick=login;$('logout').onclick=logout;$('newProduct').onclick=()=>{$('pid').value='';$('productForm').reset();$('productModal').hidden=false};$('close').onclick=()=>$('productModal').hidden=true;
$('productForm').onsubmit=async e=>{e.preventDefault();const b={name:$('pname').value,price:Number($('pprice').value),cat:$('pcat').value,img:$('pimg').value,tag:$('ptag').value};if($('pid').value)await api('/api/admin/products/'+$('pid').value,{method:'PUT',body:JSON.stringify(b)});else await api('/api/admin/products',{method:'POST',body:JSON.stringify(b)});$('productModal').hidden=true;load()};
$('settingsForm').onsubmit=async e=>{e.preventDefault();await api('/api/admin/settings',{method:'PUT',body:JSON.stringify({whatsapp:$('whatsapp').value,dhaka:Number($('dhaka').value),outside:Number($('outside').value),storePhone:$('storePhone').value})});alert('Settings saved');load()};
document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>{document.querySelectorAll('.panel').forEach(x=>x.hidden=true);$(b.dataset.tab).hidden=false});if(token){show();load()}

// V7 stock/sale helpers
function v7NormalizeProducts(){
  const ps=JSON.parse(localStorage.getItem('jhn_products')||'[]');
  ps.forEach(p=>{if(p.stock==null)p.stock=0;if(!p.colors)p.colors=['Black','White'];if(!p.sizes)p.sizes=['M','L','XL'];});
  localStorage.setItem('jhn_products',JSON.stringify(ps));
}
v7NormalizeProducts();
