const express=require('express');
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const app=express();
const PORT=process.env.PORT||3000;
const ADMIN_PASSWORD=process.env.ADMIN_PASSWORD||'1234';
const DB=path.join(__dirname,'data','db.json');
const sessions=new Set();
app.use(express.json({limit:'1mb'}));
app.use(express.static(path.join(__dirname,'public')));
function readDB(){return JSON.parse(fs.readFileSync(DB,'utf8'));}
function writeDB(db){fs.writeFileSync(DB,JSON.stringify(db,null,2));}
function auth(req,res,next){const token=(req.headers.authorization||'').replace(/^Bearer\s+/,'');if(!token||!sessions.has(token))return res.status(401).json({error:'Unauthorized'});next();}
app.post('/api/login',(req,res)=>{if(String(req.body.password||'')!==ADMIN_PASSWORD)return res.status(401).json({error:'Wrong password'});const token=crypto.randomBytes(24).toString('hex');sessions.add(token);res.json({token});});
app.post('/api/logout',auth,(req,res)=>{const token=(req.headers.authorization||'').replace(/^Bearer\s+/,'');sessions.delete(token);res.json({ok:true});});
app.get('/api/store',(req,res)=>{const db=readDB();res.json({settings:db.settings,products:db.products});});
app.post('/api/orders',(req,res)=>{const b=req.body||{};if(!b.name||!b.phone||!b.address||!Array.isArray(b.items)||!b.items.length)return res.status(400).json({error:'Missing order details'});const db=readDB();const order={id:'JHN-'+Date.now().toString().slice(-8),createdAt:new Date().toISOString(),name:String(b.name).slice(0,100),phone:String(b.phone).slice(0,30),area:b.area==='outside'?'Outside Dhaka':'Inside Dhaka',address:String(b.address).slice(0,500),items:b.items.map(x=>({name:String(x.name),size:String(x.size),color:String(x.color),qty:Number(x.qty),price:Number(x.price)})),subtotal:Number(b.subtotal)||0,delivery:Number(b.delivery)||0,total:Number(b.total)||0,payment:'Cash on Delivery',status:'New'};db.orders.unshift(order);writeDB(db);res.status(201).json({order});});
app.get('/api/admin/orders',auth,(req,res)=>res.json(readDB().orders));
app.patch('/api/admin/orders/:id',auth,(req,res)=>{const db=readDB();const o=db.orders.find(x=>x.id===req.params.id);if(!o)return res.status(404).json({error:'Order not found'});if(req.body.status)o.status=String(req.body.status);writeDB(db);res.json(o);});
app.post('/api/admin/products',auth,(req,res)=>{const db=readDB();const b=req.body;if(!b.name||b.price===undefined||!b.img)return res.status(400).json({error:'Name, price and image are required'});const p={id:'p-'+crypto.randomBytes(5).toString('hex'),name:String(b.name),price:Number(b.price),img:String(b.img),tag:String(b.tag||'NEW'),cat:String(b.cat||'shirt')};db.products.push(p);writeDB(db);res.status(201).json(p);});
app.put('/api/admin/products/:id',auth,(req,res)=>{const db=readDB();const p=db.products.find(x=>x.id===req.params.id);if(!p)return res.status(404).json({error:'Product not found'});Object.assign(p,{name:String(req.body.name??p.name),price:Number(req.body.price??p.price),img:String(req.body.img??p.img),tag:String(req.body.tag??p.tag),cat:String(req.body.cat??p.cat)});writeDB(db);res.json(p);});
app.delete('/api/admin/products/:id',auth,(req,res)=>{const db=readDB();const before=db.products.length;db.products=db.products.filter(x=>x.id!==req.params.id);if(db.products.length===before)return res.status(404).json({error:'Product not found'});writeDB(db);res.json({ok:true});});
app.put('/api/admin/settings',auth,(req,res)=>{const db=readDB();db.settings={...db.settings,...req.body};db.settings.dhaka=Number(db.settings.dhaka)||0;db.settings.outside=Number(db.settings.outside)||0;writeDB(db);res.json(db.settings);});
app.get('*',(req,res)=>res.sendFile(path.join(__dirname,'public','index.html')));
app.listen(PORT,()=>console.log(`JHN WEAR V6 running on port ${PORT}`));
