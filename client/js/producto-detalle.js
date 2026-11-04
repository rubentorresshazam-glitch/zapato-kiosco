// ==========================================
// DETALLE DE PRODUCTO — 100% Funcional
// Conectado: Carrito → Checkout
// ==========================================

const API_URL = '/api';

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    if (!id) {
        mostrarError('No se especificó el producto');
        return;
    }

    console.log('🔍 Cargando producto ID:', id);

    try {
        const res = await fetch(`${API_URL}/productos`);
        if (!res.ok) throw new Error('Error del servidor');
        
        const productos = await res.json();
        console.log('✅ Productos recibidos:', productos.length);

        const producto = productos.find(p => String(p.id) === String(id));
        
        if (!producto) {
            mostrarError('Producto no encontrado');
            console.log('❌ No coincide ningún ID con:', id);
            return;
        }

        console.log('✅ Producto listo:', producto);
        renderizarProducto(producto);
        actualizarContadorCarrito();

    } catch (error) {
        console.error('❌ Error:', error);
        mostrarError('No se pudo conectar con el servidor');
    }
});

// ==========================================
// ARMAR RUTA DE IMAGEN
// ==========================================
function obtenerRutaImagen(p) {
    const imagenPorDefecto = '../assets/img/logos/favicon.png';
    
    if (p.imagen_url && p.imagen_url.trim() !== '') {
        return p.imagen_url.startsWith('http') || p.imagen_url.startsWith('/')
            ? p.imagen_url
            : '../' + p.imagen_url;
    }
    
    if (p.imagenes && p.imagenes !== '' && p.imagenes !== '[]') {
        let primera = p.imagenes;
        try {
            const arr = JSON.parse(p.imagenes);
            primera = Array.isArray(arr) ? arr[0] : arr;
        } catch {}
        
        if (primera && primera.trim() !== '') {
            return primera.startsWith('http') || primera.startsWith('/')
                ? primera
                : '../' + primera;
        }
    }
    
    return imagenPorDefecto;
}

// ==========================================
// DIBUJAR TODO EN PANTALLA
// ==========================================
function renderizarProducto(p) {
    const rutaImagen = obtenerRutaImagen(p);
    const tieneOferta = p.precio_oferta && Number(p.precio_oferta) > 0;
    const precioFinal = tieneOferta ? Number(p.precio_oferta) : Number(p.precio);

    // Guardar para carrito
    window.productoActual = {
        id: p.id,
        nombre: p.nombre || 'Producto',
        precio: precioFinal,
        imagen: rutaImagen,
        categoria: p.categoria || ''
    };

    // Actualizar miga de pan
    const miga = document.getElementById('miga-nombre');
    if (miga) miga.textContent = p.nombre || 'Producto';

    // HTML
    const contenedor = document.getElementById('contenido-producto');
    contenedor.innerHTML = `
        <div class="columna-imagenes">
            <div class="imagen-principal-caja">
                <img src="${rutaImagen}" 
                     alt="${p.nombre}" 
                     class="imagen-principal"
                     onerror="this.src='../assets/img/logos/favicon.png'">
            </div>
        </div>

        <div class="columna-info">
            <p class="categoria">${p.categoria || 'Sin categoría'}</p>
            <h1 class="nombre-producto">${p.nombre || 'Sin nombre'}</h1>

            <div class="caja-precios">
                ${tieneOferta 
                    ? `<span class="precio-anterior">$${Number(p.precio).toLocaleString('es-AR')}</span>
                       <span class="precio-oferta">$${precioFinal.toLocaleString('es-AR')}</span>`
                    : `<span class="precio-actual">$${precioFinal.toLocaleString('es-AR')}</span>`
                }
            </div>

            ${p.en_oferta == 1 ? '<span class="etiqueta-oferta">🔥 En Oferta</span>' : ''}

            ${p.descripcion_corta ? `<p class="descripcion-corta">${p.descripcion_corta}</p>` : ''}
            ${p.descripcion_larga ? `<div class="descripcion-larga">${p.descripcion_larga}</div>` : ''}

            <div class="caja-cantidad">
                <label>Cantidad:</label>
                <div class="control-cantidad">
                    <button type="button" id="btnMenos">−</button>
                    <input type="number" id="cantidad" value="1" min="1">
                    <button type="button" id="btnMas">+</button>
                </div>
            </div>

            <div class="contenedor-botones">
                <button id="btnAgregarCarrito" class="btn-agregar">
                    <i class="fa-solid fa-cart-plus"></i> Agregar al Carrito
                </button>
                <button id="btnComprarAhora" class="btn-comprar">
                    <i class="fa-solid fa-bolt"></i> Comprar Ahora
                </button>
            </div>

            <div class="disponibilidad">
                ${p.activo == 1
                    ? '<span class="disponible"><i class="fa-solid fa-check-circle"></i> Disponible para compra</span>'
                    : '<span class="no-disponible"><i class="fa-solid fa-xmark-circle"></i> No disponible</span>'
                }
            </div>
        </div>
    `;

    // Conectar eventos
    conectarBotones();
}

// ==========================================
// CONECTAR TODOS LOS BOTONES
// ==========================================
function conectarBotones() {
    // Cantidad - Menos
    document.getElementById('btnMenos').addEventListener('click', () => {
        const input = document.getElementById('cantidad');
        const valor = parseInt(input.value);
        if (valor > 1) input.value = valor - 1;
    });

    // Cantidad - Más
    document.getElementById('btnMas').addEventListener('click', () => {
        const input = document.getElementById('cantidad');
        input.value = parseInt(input.value) + 1;
    });

    // AGREGAR AL CARRITO
    document.getElementById('btnAgregarCarrito').addEventListener('click', () => {
        const cantidad = parseInt(document.getElementById('cantidad').value);
        const item = { ...window.productoActual, cantidad };

        if (typeof agregarAlCarrito === 'function') {
            agregarAlCarrito(item);
        } else {
            let carrito = JSON.parse(localStorage.getItem('carritoZapatoKiosco') || '[]');
            const existe = carrito.find(i => i.id === item.id);
            existe ? existe.cantidad += cantidad : carrito.push(item);
            localStorage.setItem('carritoZapatoKiosco', JSON.stringify(carrito));
        }

        alert('✅ Agregado al carrito');
        actualizarContadorCarrito();
    });

    // COMPRAR AHORA → va directo a checkout
    document.getElementById('btnComprarAhora').addEventListener('click', () => {
        const cantidad = parseInt(document.getElementById('cantidad').value);
        const item = { ...window.productoActual, cantidad };

        if (typeof agregarAlCarrito === 'function') {
            agregarAlCarrito(item);
        } else {
            let carrito = JSON.parse(localStorage.getItem('carritoZapatoKiosco') || '[]');
            const existe = carrito.find(i => i.id === item.id);
            existe ? existe.cantidad += cantidad : carrito.push(item);
            localStorage.setItem('carritoZapatoKiosco', JSON.stringify(carrito));
        }

        window.location.href = '../checkout.html';
    });
}

// ==========================================
// CONTADOR DEL CARRITO
// ==========================================
function actualizarContadorCarrito() {
    const carrito = JSON.parse(localStorage.getItem('carritoZapatoKiosco') || '[]');
    const total = carrito.reduce((s, item) => s + item.cantidad, 0);
    const contador = document.getElementById('contador-carrito');
    if (contador) contador.textContent = total;
}

// ==========================================
// MOSTRAR MENSAJE DE ERROR
// ==========================================
function mostrarError(mensaje) {
    const contenedor = document.getElementById('contenido-producto');
    if (contenedor) {
        contenedor.innerHTML = `
            <div style="grid-column:1/-1;text-align:center;padding:4rem 2rem;">
                <i class="fa-solid fa-triangle-exclamation" style="font-size:2.5rem;color:#FFCC00;"></i>
                <h3 style="margin:1rem 0;color:#333;">${mensaje}</h3>
                <a href="../index.html" style="display:inline-block;margin-top:1rem;padding:0.8rem 2rem;background:#FFCC00;color:#000;font-weight:700;border-radius:8px;text-decoration:none;">
                    Volver a la tienda
                </a>
            </div>
        `;
    }
}
