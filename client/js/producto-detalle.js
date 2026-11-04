const API_URL = '/api';

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (!id) return;

    try {
        const res = await fetch(`${API_URL}/productos`);
        const todos = await res.json();
        const prod = todos.find(p => String(p.id) === String(id));
        
        if (!prod) {
            document.querySelector('.detalle-contenedor').innerHTML = `
                <div style="grid-column:1/-1;text-align:center;padding:3rem;color:red;">
                    <h3>Producto no encontrado</h3>
                    <a href="../index.html" style="color:#FFCC00;">Volver a la tienda</a>
                </div>`;
            return;
        }

        mostrar(prod);
        actualizarContadorCarrito();

    } catch (e) {
        console.error('Error:', e);
    }
});

function mostrar(p) {
    // IMAGEN
    let rutaImg = '../assets/img/logos/favicon.png';
    if (p.imagen_url && p.imagen_url !== '') {
        rutaImg = p.imagen_url.startsWith('http') || p.imagen_url.startsWith('/')
            ? p.imagen_url : '../' + p.imagen_url;
    } else if (p.imagenes && p.imagenes !== '[]' && p.imagenes !== '') {
        let primera = p.imagenes;
        try { const arr = JSON.parse(p.imagenes); primera = Array.isArray(arr) ? arr[0] : arr; } catch {}
        if (primera) rutaImg = primera.startsWith('http') || primera.startsWith('/') ? primera : '../' + primera;
    }

    // PRECIOS
    const tieneOferta = p.precio_oferta > 0;
    const precioFinal = tieneOferta ? p.precio_oferta : p.precio;

    // DATOS PARA CARRITO
    window.productoActual = {
        id: p.id,
        nombre: p.nombre || 'Producto',
        precio: precioFinal,
        imagen: rutaImg,
        categoria: p.categoria || ''
    };

    // RENDER
    document.querySelector('.detalle-contenedor').innerHTML = `
        <div class="columna-imagenes">
            <div class="imagen-principal-contenedor">
                <img src="${rutaImg}" alt="${p.nombre}" class="imagen-principal"
                     onerror="this.src='../assets/img/logos/favicon.png'">
            </div>
        </div>

        <div class="columna-info">
            <h1 class="nombre-producto">${p.nombre || 'Sin nombre'}</h1>
            <p class="categoria-producto">${p.categoria || 'Sin categoría'}</p>

            <div class="contenedor-precios">
                ${tieneOferta ? `<span class="precio-viejo">$${Number(p.precio).toLocaleString('es-AR')}</span>` : ''}
                <span class="${tieneOferta ? 'precio-oferta' : 'precio-actual'}">$${Number(precioFinal).toLocaleString('es-AR')}</span>
            </div>

            ${p.en_oferta == 1 ? '<span class="etiqueta-oferta">🔥 En oferta</span>' : ''}

            ${p.descripcion_corta ? `<p class="descripcion-corta">${p.descripcion_corta}</p>` : ''}
            ${p.descripcion_larga ? `<div class="descripcion-larga">${p.descripcion_larga}</div>` : ''}

            <div class="bloque-cantidad">
                <label>Cantidad:</label>
                <div class="control-cantidad">
                    <button id="btnMenos">−</button>
                    <input type="number" id="cantidad" value="1" min="1">
                    <button id="btnMas">+</button>
                </div>
            </div>

            <div class="botones-accion" style="display:flex;gap:1rem;flex-wrap:wrap;margin-top:1rem;">
                <button id="btnAgregarCarrito" class="btn-agregar-carrito" style="flex:1;min-width:180px;">
                    <i class="fa-solid fa-cart-plus"></i> Agregar al Carrito
                </button>
                <button id="btnComprarAhora" class="btn-comprar-ahora" style="flex:1;min-width:180px;background:#000;color:#fff;">
                    <i class="fa-solid fa-bolt"></i> Comprar Ahora
                </button>
            </div>

            <div class="disponibilidad" style="margin-top:1rem;">
                ${p.activo == 1 
                    ? '<span class="disponible">✅ Disponible</span>' 
                    : '<span class="no-disponible">❌ No disponible</span>'}
            </div>
        </div>
    `;

    // Miga de pan
    const miga = document.getElementById('miga-nombre');
    if (miga) miga.textContent = p.nombre || 'Producto';

    // BOTÓN MENOS
    document.getElementById('btnMenos').onclick = () => {
        const v = parseInt(document.getElementById('cantidad').value);
        if (v > 1) document.getElementById('cantidad').value = v - 1;
    };

    // BOTÓN MÁS
    document.getElementById('btnMas').onclick = () => {
        document.getElementById('cantidad').value = parseInt(document.getElementById('cantidad').value) + 1;
    };

    // AGREGAR AL CARRITO
    document.getElementById('btnAgregarCarrito').onclick = () => {
        const cant = parseInt(document.getElementById('cantidad').value);
        const item = { ...window.productoActual, cantidad: cant };
        
        if (typeof agregarAlCarrito === 'function') {
            agregarAlCarrito(item);
        } else {
            let carrito = JSON.parse(localStorage.getItem('carritoZapatoKiosco') || '[]');
            const existe = carrito.find(i => i.id === item.id);
            existe ? existe.cantidad += cant : carrito.push(item);
            localStorage.setItem('carritoZapatoKiosco', JSON.stringify(carrito));
        }
        alert('✅ Agregado al carrito');
        actualizarContadorCarrito();
    };

    // COMPRAR AHORA
    document.getElementById('btnComprarAhora').onclick = () => {
        const cant = parseInt(document.getElementById('cantidad').value);
        const item = { ...window.productoActual, cantidad: cant };
        
        if (typeof agregarAlCarrito === 'function') {
            agregarAlCarrito(item);
        } else {
            let carrito = JSON.parse(localStorage.getItem('carritoZapatoKiosco') || '[]');
            const existe = carrito.find(i => i.id === item.id);
            existe ? existe.cantidad += cant : carrito.push(item);
            localStorage.setItem('carritoZapatoKiosco', JSON.stringify(carrito));
        }
        window.location.href = '../carrito.html';
    };
}

function actualizarContadorCarrito() {
    const carrito = JSON.parse(localStorage.getItem('carritoZapatoKiosco') || '[]');
    const total = carrito.reduce((sum, i) => sum + i.cantidad, 0);
    const contador = document.getElementById('contador-carrito');
    if (contador) contador.textContent = total;
}
