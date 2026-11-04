// ==========================================
// 📄 DETALLE DE PRODUCTO — Completo y listo
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

// Cargar producto desde la base de datos
async function cargarProducto(idProducto) {
    try {
        const respuesta = await fetch(`${API_URL}/productos`);
        if (!respuesta.ok) throw new Error('No se pudo conectar con el servidor');

        const productos = await respuesta.json();
        const producto = productos.find(p => p.id == idProducto);

        if (!producto) {
            mostrarError('Producto no encontrado');
            return;
        }

        mostrarProducto(producto);

    } catch (error) {
        console.error('Error:', error);
        mostrarError('No se pudo cargar el producto');
    }
}

// Mostrar en pantalla
function mostrarProducto(p) {
    document.title = `${p.nombre} | Zapato Kiosco`;

    // Imágenes
    let imagenes = [];
    try {
        if (p.imagenes && p.imagenes !== '[]' && p.imagenes !== '') {
            imagenes = JSON.parse(p.imagenes);
            if (!Array.isArray(imagenes)) imagenes = [];
        }
    } catch {
        imagenes = [];
    }

    const imgPrincipal = imagenes.length > 0 
        ? imagenes[0] 
        : 'assets/img/logos/favicon.png';

    const galeria = imagenes.length > 1
        ? imagenes.map((url, i) => `
            <img src="${url}" alt="" class="miniatura ${i === 0 ? 'activa' : ''}" 
                 onclick="cambiarImagen('${url}', this)">
          `).join('')
        : '';

    // Precios
    const tieneOferta = p.precio_oferta && p.precio_oferta > 0;
    const precioFinal = tieneOferta ? p.precio_oferta : p.precio;

    // Guardar para carrito
    window.productoActual = {
        id: p.id,
        nombre: p.nombre,
        precio: precioFinal,
        imagen: imgPrincipal,
        categoria: p.categoria
    };

    // Renderizar
    const contenedor = document.querySelector('.detalle-contenedor');
    contenedor.innerHTML = `
        <div class="columna-imagenes">
            <div class="imagen-principal-contenedor">
                <img src="${imgPrincipal}" alt="${p.nombre}" id="imagenPrincipal" class="imagen-principal"
                     onerror="this.src='assets/img/logos/favicon.png'">
            </div>
            ${imagenes.length > 1 ? `<div class="galeria-miniaturas">${galeria}</div>` : ''}
        </div>

        <div class="columna-info">
            <h1 class="nombre-producto">${p.nombre}</h1>
            <p class="categoria-producto">${p.categoria || 'Sin categoría'}</p>

            <div class="contenedor-precios">
                ${tieneOferta
                    ? `<span class="precio-viejo">$${Number(p.precio).toLocaleString('es-AR')}</span>
                       <span class="precio-oferta">$${Number(p.precio_oferta).toLocaleString('es-AR')}</span>`
                    : `<span class="precio-actual">$${Number(p.precio).toLocaleString('es-AR')}</span>`
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

    configurarCantidad();
    conectarBotonCarrito();
}

// Control de cantidad
function configurarCantidad() {
    const btnMenos = document.getElementById('btnMenos');
    const btnMas = document.getElementById('btnMas');
    const input = document.getElementById('cantidad');

    if (!btnMenos || !btnMas || !input) return;

    btnMenos.addEventListener('click', () => {
        if (parseInt(input.value) > 1) input.value = parseInt(input.value) - 1;
    });
    btnMas.addEventListener('click', () => {
        input.value = parseInt(input.value) + 1;
    });
    input.addEventListener('change', () => {
        if (parseInt(input.value) < 1) input.value = 1;
    });
}

// Agregar al carrito
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
            existe ? existe.cantidad += cantidad : carrito.push(item);
            localStorage.setItem('carritoZapatoKiosco', JSON.stringify(carrito));
            alert('✅ Agregado al carrito');
        }
    });
}

// Cambiar imagen desde galería
function cambiarImagen(url, elemento) {
    const principal = document.getElementById('imagenPrincipal');
    if (principal) principal.src = url;
    document.querySelectorAll('.miniatura').forEach(img => img.classList.remove('activa'));
    elemento.classList.add('activa');
}

// Mostrar error
function mostrarError(mensaje) {
    const contenedor = document.querySelector('.detalle-contenedor');
    if (contenedor) {
        contenedor.innerHTML = `
            <div style="grid-column: 1/-1; text-align:center; padding:3rem; color:#d63030;">
                <i class="fa-solid fa-triangle-exclamation" style="font-size:2.5rem;"></i>
                <h3>${mensaje}</h3>
                <a href="index.html" style="display:inline-block; margin-top:1rem; padding:0.7rem 1.5rem; background:#FFCC00; color:black; border-radius:8px; text-decoration:none; font-weight:600;">
                    Volver a la Tienda
                </a>
            </div>
        `;
    }
}
