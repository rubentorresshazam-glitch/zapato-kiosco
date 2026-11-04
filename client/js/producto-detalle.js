// ==========================================
// 📄 DETALLE DE PRODUCTO — Imágenes + Descripción al 100%
// ==========================================

const API_URL = '/api';

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    if (!id) {
        mostrarError('No se especificó el producto');
        return;
    }

    await cargarProducto(id);
});

// ==========================================
// 📦 CARGAR PRODUCTO DESDE LA BASE DE DATOS
// ==========================================
async function cargarProducto(idProducto) {
    try {
        console.log('🔍 Buscando producto ID:', idProducto);
        
        const respuesta = await fetch(`${API_URL}/productos`);
        if (!respuesta.ok) throw new Error('No se pudo conectar con el servidor');

        const productos = await respuesta.json();
        console.log('✅ Productos recibidos:', productos.length);

        const producto = productos.find(p => String(p.id) === String(idProducto));

        if (!producto) {
            mostrarError('Producto no encontrado');
            return;
        }

        console.log('✅ Producto encontrado:', producto);
        mostrarProducto(producto);

    } catch (error) {
        console.error('❌ Error:', error);
        mostrarError('No se pudo cargar el producto');
    }
}

// ==========================================
// 🖼️ MOSTRAR TODO EN PANTALLA
// ==========================================
function mostrarProducto(p) {
    document.title = `${p.nombre} | Zapato Kiosco`;

    // ========== IMÁGENES ==========
    let imagenes = [];
    
    // Intentar leer imágenes en distintos formatos
    if (p.imagenes && p.imagenes !== '' && p.imagenes !== '[]') {
        try {
            imagenes = JSON.parse(p.imagenes);
            if (!Array.isArray(imagenes)) {
                imagenes = [imagenes];
            }
        } catch (e) {
            // Si no es JSON, tratar como ruta única
            imagenes = [p.imagenes];
        }
    }
    // Respaldo: campo imagen_url
    if (imagenes.length === 0 && p.imagen_url) {
        imagenes = Array.isArray(p.imagen_url) ? p.imagen_url : [p.imagen_url];
    }

    // Limpiar rutas duplicadas
    imagenes = imagenes.map(img => {
        if (!img) return null;
        // Si ya empieza con http o / dejarlo igual
        if (img.startsWith('http') || img.startsWith('/')) return img;
        // Si empieza con assets/ agregar barra
        if (img.startsWith('assets/')) return '/' + img;
        return img;
    }).filter(img => img); // Sacar nulos

    // Imagen por defecto
    const imgPorDefecto = '/assets/img/logos/favicon.png';
    const imgPrincipal = imagenes.length > 0 ? imagenes[0] : imgPorDefecto;

    // Galería de miniaturas
    let galeria = '';
    if (imagenes.length > 1) {
        galeria = imagenes.map((url, i) => `
            <img src="${url}" alt="" class="miniatura ${i === 0 ? 'activa' : ''}" 
                 onclick="cambiarImagen('${url}', this)">
        `).join('');
    }

    // ========== PRECIOS ==========
    const tieneOferta = p.precio_oferta && Number(p.precio_oferta) > 0;
    const precioFinal = tieneOferta ? Number(p.precio_oferta) : Number(p.precio);

    // ========== GUARDAR PARA CARRITO ==========
    window.productoActual = {
        id: p.id,
        nombre: p.nombre,
        precio: precioFinal,
        imagen: imgPrincipal,
        categoria: p.categoria || ''
    };

    // ========== RENDERIZAR TODO ==========
    const contenedor = document.querySelector('.detalle-contenedor');
    if (!contenedor) return;

    contenedor.innerHTML = `
        <div class="columna-imagenes">
            <div class="imagen-principal-contenedor">
                <img src="${imgPrincipal}" alt="${p.nombre}" id="imagenPrincipal" class="imagen-principal"
                     onerror="this.src='${imgPorDefecto}'">
            </div>
            ${imagenes.length > 1 ? `<div class="galeria-miniaturas">${galeria}</div>` : ''}
        </div>

        <div class="columna-info">
            <h1 class="nombre-producto">${p.nombre || 'Sin nombre'}</h1>
            <p class="categoria-producto">${p.categoria || 'Sin categoría'}</p>

            <div class="contenedor-precios">
                ${tieneOferta
                    ? `<span class="precio-viejo">$${Number(p.precio).toLocaleString('es-AR')}</span>
                       <span class="precio-oferta">$${precioFinal.toLocaleString('es-AR')}</span>`
                    : `<span class="precio-actual">$${precioFinal.toLocaleString('es-AR')}</span>`
                }
            </div>

            ${p.en_oferta == 1 ? '<span class="etiqueta-oferta">🔥 En oferta</span>' : ''}

            ${p.descripcion_corta ? `<p class="descripcion-corta">${p.descripcion_corta}</p>` : ''}
            
            ${p.descripcion_larga ? `<div class="descripcion-larga">${p.descripcion_larga}</div>` : ''}

            <div class="bloque-cantidad">
                <label>Cantidad:</label>
                <div class="control-cantidad">
                    <button type="button" id="btnMenos">−</button>
                    <input type="number" id="cantidad" value="1" min="1" max="99">
                    <button type="button" id="btnMas">+</button>
                </div>
            </div>

            <button id="btnAgregarCarrito" class="btn-agregar-carrito">
                <i class="fa-solid fa-cart-plus"></i> Agregar al Carrito
            </button>

            <div class="disponibilidad">
                ${p.activo == 1
                    ? '<span class="disponible"><i class="fa-solid fa-check-circle"></i> Disponible</span>'
                    : '<span class="no-disponible"><i class="fa-solid fa-xmark-circle"></i> No disponible</span>'
                }
            </div>
        </div>
    `;

    // Reconectar eventos
    configurarCantidad();
    conectarBotonCarrito();
}

// ==========================================
// 🔢 CONTROL DE CANTIDAD
// ==========================================
function configurarCantidad() {
    const btnMenos = document.getElementById('btnMenos');
    const btnMas = document.getElementById('btnMas');
    const input = document.getElementById('cantidad');

    if (!btnMenos || !btnMas || !input) return;

    btnMenos.addEventListener('click', () => {
        const valor = parseInt(input.value);
        if (valor > 1) input.value = valor - 1;
    });
    btnMas.addEventListener('click', () => {
        input.value = parseInt(input.value) + 1;
    });
    input.addEventListener('change', () => {
        if (parseInt(input.value) < 1) input.value = 1;
    });
}

// ==========================================
// 🛒 AGREGAR AL CARRITO
// ==========================================
function conectarBotonCarrito() {
    const btn = document.getElementById('btnAgregarCarrito');
    if (!btn || !window.productoActual) return;

    btn.addEventListener('click', () => {
        const cantidad = parseInt(document.getElementById('cantidad')?.value || 1);
        const item = { ...window.productoActual, cantidad };

        if (typeof agregarAlCarrito === 'function') {
            agregarAlCarrito(item);
        } else {
            let carrito = JSON.parse(localStorage.getItem('carritoZapatoKiosco')) || [];
            const existe = carrito.find(i => i.id === item.id);
            if (existe) {
                existe.cantidad += cantidad;
            } else {
                carrito.push(item);
            }
            localStorage.setItem('carritoZapatoKiosco', JSON.stringify(carrito));
            alert('✅ Agregado al carrito');
        }
    });
}

// ==========================================
// 🖼️ CAMBIAR IMAGEN DESDE GALERÍA
// ==========================================
function cambiarImagen(url, elemento) {
    const principal = document.getElementById('imagenPrincipal');
    if (principal) principal.src = url;
    document.querySelectorAll('.miniatura').forEach(img => img.classList.remove('activa'));
    elemento.classList.add('activa');
}

// ==========================================
// ❌ MOSTRAR ERROR
// ==========================================
function mostrarError(mensaje) {
    const contenedor = document.querySelector('.detalle-contenedor');
    if (contenedor) {
        contenedor.innerHTML = `
            <div style="grid-column: 1/-1; text-align:center; padding:3rem; color:#d63030;">
                <i class="fa-solid fa-triangle-exclamation" style="font-size:2.5rem;"></i>
                <h3>${mensaje}</h3>
                <a href="../index.html" style="display:inline-block; margin-top:1rem; padding:0.7rem 1.5rem; background:#FFCC00; color:black; border-radius:8px; text-decoration:none; font-weight:600;">
                    Volver a la Tienda
                </a>
            </div>
        `;
    }
    console.error('❌', mensaje);
}
