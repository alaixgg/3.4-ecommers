const MONEDA = 'COP';
const LOCALE = 'es-CO';
const TAX_RATE = 0.19;
const DESCUENTO = 0;

const productos = [
  { id: 1, nombre: "Velón MoonSun (aroma cítrico)", precio: 25000, categoria: "Hogar", img: "https://source.unsplash.com/400x400/?candle,handmade" },
  { id: 2, nombre: "Sticker pack Lun4res (set x6)", precio: 12000, categoria: "Accesorios", img: "https://source.unsplash.com/400x400/?stickers,art" },
  { id: 3, nombre: "Soporte celular SleekTech", precio: 45000, categoria: "Tecnología", img: "https://source.unsplash.com/400x400/?phone,stand" },
  { id: 4, nombre: "Collar minimal Montresor", precio: 68000, categoria: "Joyería", img: "https://source.unsplash.com/400x400/?necklace" },
  { id: 5, nombre: "Camita LaFurrHouse (mascotas)", precio: 78000, categoria: "Mascotas", img: "https://source.unsplash.com/400x400/?pet,bed" },
  { id: 6, nombre: "Café artesanal LaMelena 250g", precio: 32000, categoria: "Hogar", img: "https://source.unsplash.com/400x400/?coffee,bag" },
  { id: 7, nombre: "Tarjeta regalo CanaShop", precio: 50000, categoria: "Accesorios", img: "https://source.unsplash.com/400x400/?gift,card" },
  { id: 8, nombre: "Llavero artesanal Tadeísta", precio: 9000, categoria: "Accesorios", img: "https://source.unsplash.com/400x400/?keychain,handmade" }
];

const el = {
  contProds: document.getElementById('productos'),
  lista: document.getElementById('lista-carrito'),
  subtotal: document.getElementById('subtotal-text'),
  impuestos: document.getElementById('impuestos-text'),
  descuento: document.getElementById('descuento-text'),
  total: document.getElementById('total-text'),
  cantidad: document.getElementById('cantidad-carrito'),
  select: document.getElementById('categoria'),
  buscar: document.getElementById('buscar'),
  btnVaciar: document.getElementById('btn-vaciar'),
  btnFinal: document.getElementById('btn-finalizar'),
  paypal: document.getElementById('paypal-button-container')
};

const money = new Intl.NumberFormat(LOCALE, { style: 'currency', currency: MONEDA, maximumFractionDigits: 0 });
let carrito = new Map();

/* Render productos */
function renderProductos(lista){
  el.contProds.innerHTML = '';
  lista.forEach(p=>{
    const card = document.createElement('div');
    card.className = 'producto';
    card.innerHTML = `
      <img src="${p.img}" alt="${p.nombre}">
      <h3>${p.nombre}</h3>
      <p class="precio">${money.format(p.precio)}</p>
      <button class="button" data-add="${p.id}">Agregar al carrito</button>
    `;
    el.contProds.appendChild(card);
  });
}

/* Carrito funciones */
function add(id){
  const prod = productos.find(x=>x.id===id);
  if(!prod) return;
  const item = carrito.get(id);
  if(item) item.cantidad++; else carrito.set(id,{...prod,cantidad:1});
  persist(); pintarCarrito();
}
function dec(id){
  const item = carrito.get(id);
  if(!item) return;
  item.cantidad--;
  if(item.cantidad<=0) carrito.delete(id);
  persist(); pintarCarrito();
}
function del(id){
  carrito.delete(id);
  persist(); pintarCarrito();
}

/* Totales */
function totales(){
  const subtotal = [...carrito.values()].reduce((a,i)=>a+i.precio*i.cantidad,0);
  const desc = Math.min(DESCUENTO, subtotal);
  const base = subtotal - desc;
  const impuestos = Math.round(base*TAX_RATE);
  const total = base + impuestos;
  const cantidad = [...carrito.values()].reduce((a,i)=>a+i.cantidad,0);
  return {subtotal,desc,impuestos,total,cantidad};
}
function pintarCarrito(){
  el.lista.innerHTML='';
  if(carrito.size===0){el.lista.innerHTML='<li>Carrito vacío.</li>';mostrarPayPal(0);return;}
  carrito.forEach(it=>{
    const li=document.createElement('li');
    li.innerHTML=`
      <div>${it.nombre} x${it.cantidad}</div>
      <div class="cart-actions">
        <button data-dec="${it.id}">-</button>
        <button data-inc="${it.id}">+</button>
        <button class="remove" data-del="${it.id}">x</button>
      </div>`;
    el.lista.appendChild(li);
  });
  const {subtotal,desc,impuestos,total,cantidad}=totales();
  el.subtotal.textContent=money.format(subtotal);
  el.descuento.textContent=money.format(desc);
  el.impuestos.textContent=money.format(impuestos);
  el.total.textContent=money.format(total);
  el.cantidad.textContent=cantidad;
  mostrarPayPal(total);
}

/* Persistencia */
function persist(){localStorage.setItem('carrito',JSON.stringify([...carrito]));}
function load(){
  const data=localStorage.getItem('carrito');
  if(data) carrito=new Map(JSON.parse(data));
}

/* Filtros */
function filtrar(){
  const cat=el.select.value;
  const q=el.buscar.value.toLowerCase();
  let lista=productos;
  if(cat!=='todos') lista=lista.filter(p=>p.categoria===cat);
  if(q) lista=lista.filter(p=>p.nombre.toLowerCase().includes(q));
  renderProductos(lista);
}

/* Eventos */
document.addEventListener('click',e=>{
  const addBtn=e.target.closest('[data-add]'); if(addBtn) return add(+addBtn.dataset.add);
  const inc=e.target.closest('[data-inc]'); if(inc) return add(+inc.dataset.inc);
  const decb=e.target.closest('[data-dec]'); if(decb) return dec(+decb.dataset.dec);
  const delb=e.target.closest('[data-del]'); if(delb) return del(+delb.dataset.del);
});

el.btnVaciar.addEventListener('click',()=>{
  if(confirm('¿Vaciar carrito?')){carrito.clear();persist();pintarCarrito();alert('Carrito vaciado');}
});

el.btnFinal.addEventListener('click',()=>{
  if(carrito.size===0)return alert('Agrega productos primero');
  const {total}=totales();
  alert(`Compra finalizada. Total ${money.format(total)}.\nGracias por apoyar a los emprendimientos tadeístas.`);
  carrito.clear();persist();pintarCarrito();
});

el.select.addEventListener('change',filtrar);
el.buscar.addEventListener('input',filtrar);

/* PayPal */
function mostrarPayPal(total){
  const cont=el.paypal;
  cont.innerHTML='';
  cont.style.display=total>0?'block':'none';
  if(total>0 && window.paypal){
    paypal.Buttons({
      createOrder:(data,actions)=>actions.order.create({purchase_units:[{amount:{value:total.toFixed(0),currency_code:MONEDA}}]}),
      onApprove:(data,actions)=>actions.order.capture().then(()=>{alert('Pago aprobado');carrito.clear();persist();pintarCarrito();})
    }).render('#paypal-button-container');
  }
}

/* Init */
load();
renderProductos(productos);
pintarCarrito();
