// ==================================================
// 🛒 CARGA DE PRODUCTOS — FUNCIONA EN TODAS LAS SECCIONES
// Mantiene TODO tu diseño — sin romper nada
// ==================================================
document.addEventListener('DOMContentLoaded', async () => {
  const ruta = window.location.pathname;
  
  // Determinar qué mostrar según la página
  let filtroCategoria = null;
  let modoEspecial = null;

  if (ruta === '/' || ruta.endsWith('/index.html') || ruta.endsWith('/')) {
    modoEspecial = 'inicio';
  } 
  else if (ruta.includes('/ofertas.html')) {
    modoEspecial = 'ofertas';
  }
  else if (ruta.includes('/novedades.html')) {
    modoEspecial = 'novedades';
  }
  else if (ruta.includes('/mas-vendidos.html')) {
    modoEspecial = 'mas-vendidos';
  }
  else {
    filtroCategoria = obtenerCategoriaDesdeRuta(ruta);
  }

  await cargarYMostrar(filtroCategoria, modoEspecial);
});

// ==================================================
// 📋 Mapeo EXACTO: nombre del archivo → categoría BD
// ==================================================
function obtenerCategoriaDesdeRuta(ruta) {
  const nombreArchivo = ruta.split('/').pop().toLowerCase();
  
  const mapeo = {
    'celulares.html': 'Celulares y Smartphones',
    'telefonia.html': 'Telefonía y Accesorios',
    'cables.html': 'Cables y Cargadores',
    'pendrives.html': 'Pendrives y Almacenamiento',
    'pesca.html': 'Artículos de Pesca',
    'tabaqueria.html': 'Tabaquería',
    'relojes.html': 'Relojes',
    'camping.html': 'Artículos de Camping',
    'termos y mates.html': 'Termos y Mates',
    'termos-y-mates.html': 'Termos y Mates',
    'gafas.html': 'Gafas y Lentes',
    'sahumerios.html': 'Sahumerios',
    'aromatizantes.html': 'Aromatizantes',
    'automotor.html': 'Automotor'
  };

  for (const [archivo, categoria] of Object.entries(mapeo)) {
    if (nombreArchivo === archivo) return categoria;
  }
  console.log('⚠️ No se encontró categoría para:', nombreArchivo);
  return null;
}

// ==================================================
// 📦 Cargar desde la base de datos
// ==================================================
async function cargarYMostrar(filtroCategoria, modoEspecial) {
  const contenedor = buscarContenedorProductos();
  if (!contenedor) {
    console.log('⚠️ No se encontró el contenedor de productos');
    return;
  }

  try {
    // ✅ Funciona en local Y en Render — sin escribir la URL a mano
    const API_URL = `${window.location.origin}/api`;
    let url = `${API_URL}/productos`;

    if (modoEspecial === 'ofertas') {
      url += '?en_oferta=true';
    } else if (filtroCategoria) {
      url += `?categoria=${encodeURIComponent(filtroCategoria)}`;
    }

    const respuesta = await fetch(url);
    if (!respuesta.ok) throw new Error('Error al cargar productos');
    
    let productos = await respuesta.json();

    // Lógica de modos especiales
    if (modoEspecial === 'inicio') {
      productos = productos.slice(0, 8);
    } else if (modoEspecial === 'ofertas') {
      productos = productos.slice(0, 12);
    } else if (modoEspecial === 'novedades') {
      productos = productos.slice(-8).reverse();
    } else if (modoEspecial === 'mas-vendidos') {
      productos = productos.slice(0, 12);
    }

    // Sin productos
    if (productos.length === 0) {
      contenedor.innerHTML = `
        <p style="grid-column:1/-1; text-align:center; color:#888; padding:40px; font-size:1rem;">
          🛒 Próximamente productos en esta sección
        </p>
      `;
      const contador = document.getElementById('contador-productos');
      if (contador) contador.textContent = '0 productos';
      return;
    }

    // ✅ Dibujar tarjetas
    contenedor.innerHTML = productos.map(crearTarjeta).join('');

    // Actualizar contador
    const contador = document.getElementById('contador-productos');
    if (contador) contador.textContent = `${productos.length} productos`;

  } catch (error) {
    console.error('❌ Error:', error);
    contenedor.innerHTML = `
      <p style="grid-column:1/-1; text-align:center; color:#888; padding:40px;">
        ⏳ Conectando con la tienda... Asegurate de tener el servidor activo
      </p>
    `;
  }
}

// ==================================================
// 🔍 Encontrar dónde poner los productos
// ==================================================
function buscarContenedorProductos() {
  const selectores = [
    '#contenedor-productos',
    '.products-grid',
    '.grid-productos',
    '.lista-productos',
    'main .grid'
  ];
  for (const sel of selectores) {
    const el = document.querySelector(sel);
    if (el) return el;
  }
  return null;
}

// ==================================================
// 🎨 Tarjeta de producto — TU DISEÑO INTACTO
// ==================================================
function crearTarjeta(p) {
  // Imagen principal o primera de la galería
  const imagenSrc = p.imagen_url || (p.imagenes && p.imagenes[0]) || null;
  const imagen = imagenSrc 
    ? `<img src="${imagenSrc}" alt="${p.nombre}" loading="lazy">`
    : `<div style="height:150px; background:#f3f4f6; display:flex; align-items:center; justify-content:center; font-size:2.5rem; color:#9ca3af;">📦</div>`;

  const etiquetaOferta = p.en_oferta 
    ? '<span class="etiqueta-oferta">OFERTA</span>' 
    : '';

  // Precio: oferta o normal
  const precioMostrar = p.precio_oferta && p.precio_oferta > 0
    ? `<span style="color:red; font-weight:bold;">$${p.precio_oferta.toLocaleString('es-AR')}</span>
       <span style="text-decoration:line-through; color:#999; font-size:0.8rem;">$${p.precio.toLocaleString('es-AR')}</span>`
    : `<span class="price-current">$${p.precio.toLocaleString('es-AR')}</span>`;

  // Precio que va al carrito
  const precioFinal = p.precio_oferta && p.precio_oferta > 0 ? p.precio_oferta : p.precio;

  return `
    <article class="product-card" data-categoria="${p.categoria}">
      ${etiquetaOferta}
      <a href="producto-detalle.html?id=${p.id}" class="product-image">
        ${imagen}
      </a>
      <div class="product-info">
        <a href="producto-detalle.html?id=${p.id}">
          <h3 class="product-title">${p.nombre}</h3>
        </a>
        <p style="font-size:0.85rem; color:#6b7280; margin:4px 0;">${p.categoria}</p>
        <div class="product-price-block">
          ${precioMostrar}
        </div>
        <p style="font-size:0.8rem; color:#6b7280; margin:4px 0 10px;">Stock: ${p.stock || 0} ${p.unidad || 'unidad'}</p>
        <button class="product-btn" data-id="${p.id}">
          <i class="fa-solid fa-cart-plus"></i>
          <span>Agregar al carrito</span>
        </button>
      </div>
    </article>
  `;
}

// ==================================================
// 🛒 Agregar al carrito — SIN errores de comillas
// ==================================================
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.product-btn');
  if (!btn) return;

  const tarjeta = btn.closest('.product-card');
  if (!tarjeta) return;

  const id = parseInt(btn.dataset.id);
  const nombre = tarjeta.querySelector('.product-title')?.textContent || 'Producto';
  const precioTexto = tarjeta.querySelector('.price-current')?.textContent || '';
  const precioOfertaTexto = tarjeta.querySelector('.product-price-block span:first-child')?.textContent || '';
  
  // Extraer número del precio
  let precio = 0;
  if (precioOfertaTexto && precioOfertaTexto.includes('$')) {
    precio = parseFloat(precioOfertaTexto.replace(/[^0-9,]/g, '').replace(',', '.')) || 0;
  } else if (precioTexto.includes('$')) {
    precio = parseFloat(precioTexto.replace(/[^0-9,]/g, '').replace(',', '.')) || 0;
  }

  const enlaceImg = tarjeta.querySelector('.product-image img');
  const imagen = enlaceImg ? enlaceImg.src : '';

  agregarAlCarrito({ id, nombre, precio, imagen, cantidad: 1 });
});

// Función global del carrito
function agregarAlCarrito(producto) {
  let carrito = JSON.parse(localStorage.getItem('carrito') || '[]');
  
  const existe = carrito.find(item => item.id === producto.id);
  if (existe) {
    existe.cantidad += 1;
  } else {
    carrito.push(producto);
  }

  localStorage.setItem('carrito', JSON.stringify(carrito));
  
  // ✅ Mensaje bonito
  const notificacion = document.createElement('div');
  notificacion.style.cssText = `
    position: fixed; top: 20px; right: 20px; background: #00a650; color: white;
    padding: 15px 25px; border-radius: 8px; z-index: 9999; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    font-weight: 600; animation: aparecer 0.3s ease;
  `;
  notificacion.innerHTML = '✅ Agregado al carrito';
  document.body.appendChild(notificacion);
  setTimeout(() => notificacion.remove(), 2500);
}