// ⚠️ NO declarar API_URL acá — ya existe en funciones-globales.js
// Usamos la que ya está definida globalmente

document.addEventListener('DOMContentLoaded', async () => {
    // Obtener ID desde la URL
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    if (!id) {
        mostrarError('No se especificó el producto');
        return;
    }

    await cargarProducto(id);
    configurarCantidad();
    configurarMiniaturas();
});

// Cargar producto desde la base de datos
async function cargarProducto(idProducto) {
    try {
        console.log('🔍 Cargando producto ID:', idProducto);
        
        const respuesta = await fetch(`${API_URL}/productos/${idProducto}`);
        if (!respuesta.ok) throw new Error('Producto no encontrado');
        
        const producto = await respuesta.json();
        console.log('✅ Producto cargado:', producto);
        
        // Ocultar cargando
        const contenedor = document.getElementById('contenido-producto');
        contenedor.innerHTML = '';
        
        // Llenar migas de pan
        document.getElementById('miga-nombre').textContent = producto.nombre || 'Producto';
        
        // Renderizar el producto con el formato completo
        renderizarProducto(producto);
        
    } catch (error) {
        console.error('❌ Error al cargar producto:', error);
        mostrarError('No se pudo cargar el producto');
    }
}

// Renderizar todo el contenido del producto
function renderizarProducto(producto) {
    const contenedor = document.getElementById('contenido-producto');
    
    // Imagen principal
    const imagenPrincipal = producto.imagen_url || producto.imagen || '../assets/img/placeholder-producto.png';
    
    // Galería de imágenes (usamos la principal + adicionales si existen)
    const imagenes = [imagenPrincipal];
    if (producto.imagenes_adicionales && Array.isArray(producto.imagenes_adicionales)) {
        imagenes.push(...producto.imagenes_adicionales);
    }

    contenedor.innerHTML = `
        <div class="producto-imagenes-col">
            <div class="miniaturas-lista">
                ${imagenes.map((img, i) => `
                    <div class="miniatura ${i === 0 ? 'activa' : ''}" data-img="${img}">
                        <img src="${img}" alt="Imagen ${i+1}">
                    </div>
                `).join('')}
            </div>
            <div class="imagen-principal-caja">
                <img src="${imagenPrincipal}" alt="${producto.nombre}" class="imagen-principal" id="imagen-grande">
            </div>
        </div>

        <div class="producto-info-col">
            ${producto.es_destacado ? '<span class="etiqueta-mas-vendido"><i class="fa-solid fa-fire"></i> Más vendido</span>' : ''}
            
            <h1 class="producto-nombre">${producto.nombre}</h1>
            <p class="producto-subtitulo">${producto.descripcion_corta || ''}</p>

            <div class="valoracion">
                <div class="estrellas">
                    <i class="fa-solid fa-star"></i>
                    <i class="fa-solid fa-star"></i>
                    <i class="fa-solid fa-star"></i>
                    <i class="fa-solid fa-star"></i>
                    <i class="fa-solid fa-star-half-stroke"></i>
                </div>
                <span class="puntuacion">4.8</span>
                <span class="cantidad-opiniones">(0 opiniones)</span>
            </div>

            <div class="precio-bloque">
                <span class="precio-actual">$ ${Number(producto.precio).toLocaleString('es-AR')}</span>
            </div>

            <p class="cuotas-info">en 6 cuotas sin interés</p>
            <p class="envio-info"><i class="fa-solid fa-truck-fast"></i> Envío gratis a todo el país</p>

            <!-- Talles -->
            <div class="opcion-grupo">
                <p class="opcion-titulo">Talle:</p>
                <div class="talles-lista" id="talles-disponibles">
                    ${(producto.talles || [38,39,40,41,42,43,44]).map(talle => `
                        <button class="talle-btn" data-talle="${talle}">${talle}</button>
                    `).join('')}
                </div>
            </div>

            <!-- Cantidad -->
            <div class="opcion-grupo">
                <p class="opcion-titulo">Cantidad:</p>
                <div class="cantidad-control">
                    <button class="cantidad-btn menos" id="btn-menos">-</button>
                    <input type="number" value="1" min="1" max="10" class="cantidad-input" id="cantidad-input">
                    <button class="cantidad-btn mas" id="btn-mas">+</button>
                </div>
            </div>

            <!-- Botones -->
            <div class="botones-accion">
                <button class="btn-agregar" id="btn-agregar-carrito" data-id="${producto.id}">
                    <i class="fa-solid fa-cart-plus"></i> Agregar al carrito
                </button>
                <button class="btn-comprar">
                    <i class="fa-solid fa-bolt"></i> Comprar ahora
                </button>
            </div>

            <!-- Beneficios -->
            <div class="beneficios-lista">
                <div class="beneficio">
                    <i class="fa-solid fa-shield-halved"></i>
                    <span>Compra protegida<br><small>Tus datos seguros</small></span>
                </div>
                <div class="beneficio">
                    <i class="fa-solid fa-rotate-left"></i>
                    <span>Devolución gratis<br><small>Si no te convence</small></span>
                </div>
                <div class="beneficio">
                    <i class="fa-solid fa-check-circle"></i>
                    <span>Garantía oficial<br><small>Producto original</small></span>
                </div>
                <div class="beneficio">
                    <i class="fa-solid fa-credit-card"></i>
                    <span>Métodos de pago<br><small>Tarjeta, débito y más</small></span>
                </div>
            </div>
        </div>
    `;

    // Llenar descripción
    document.getElementById('texto-descripcion').innerHTML = producto.descripcion || 'Sin descripción disponible';
    
    // Seleccionar primer talle automáticamente
    const primerTalle = document.querySelector('.talle-btn');
    if (primerTalle) primerTalle.classList.add('activa');

    // Asignar eventos
    asignarEventos(producto);
}

// Configurar cambio de imagen al hacer clic en miniaturas
function configurarMiniaturas() {
    document.addEventListener('click', (e) => {
        if (e.target.closest('.miniatura')) {
            const miniatura = e.target.closest('.miniatura');
            const imagenSrc = miniatura.dataset.img;
            
            // Quitar activa de todas
            document.querySelectorAll('.miniatura').forEach(m => m.classList.remove('activa'));
            // Poner activa a la clickeada
            miniatura.classList.add('activa');
            // Cambiar imagen principal
            const imagenGrande = document.getElementById('imagen-grande');
            if (imagenGrande) imagenGrande.src = imagenSrc;
        }
    });
}

// Configurar contador de cantidad
function configurarCantidad() {
    document.addEventListener('click', (e) => {
        const input = document.getElementById('cantidad-input');
        if (!input) return;

        if (e.target.id === 'btn-menos' && input.value > 1) {
            input.value = parseInt(input.value) - 1;
        }
        if (e.target.id === 'btn-mas' && input.value < 10) {
            input.value = parseInt(input.value) + 1;
        }
    });
}

// Asignar eventos a botones
function asignarEventos(producto) {
    // Selección de talle
    document.querySelectorAll('.talle-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.talle-btn').forEach(b => b.classList.remove('activa'));
            btn.classList.add('activa');
        });
    });

    // Agregar al carrito
    const btnAgregar = document.getElementById('btn-agregar-carrito');
    if (btnAgregar) {
        btnAgregar.addEventListener('click', () => {
            const talleActivo = document.querySelector('.talle-btn.activa');
            const talle = talleActivo ? talleActivo.dataset.talle : 'Único';
            const cantidad = parseInt(document.getElementById('cantidad-input')?.value || 1);

            // Usar la función global de funciones-globales.js
            if (typeof agregarAlCarrito === 'function') {
                agregarAlCarrito({
                    id: producto.id,
                    nombre: producto.nombre,
                    precio: producto.precio,
                    imagen: producto.imagen_url || producto.imagen,
                    talle: talle,
                    cantidad: cantidad
                });
                // Confirmación visual
                btnAgregar.innerHTML = '<i class="fa-solid fa-check"></i> ¡Agregado!';
                btnAgregar.style.background = '#f7c600';
                btnAgregar.style.color = '#000';
                setTimeout(() => {
                    btnAgregar.innerHTML = '<i class="fa-solid fa-cart-plus"></i> Agregar al carrito';
                    btnAgregar.style.background = '';
                    btnAgregar.style.color = '';
                }, 2000);
            }
        });
    }
}

// Mostrar error
function mostrarError(mensaje) {
    const contenedor = document.getElementById('contenido-producto');
    if (contenedor) {
        contenedor.innerHTML = `
            <div class="cargando" style="grid-column:1/-1; text-align:center; padding:4rem;">
                <i class="fa-solid fa-circle-exclamation fa-3x" style="color:#f7c600; margin-bottom:1rem;"></i>
                <p style="font-size:1.1rem;">${mensaje}</p>
                <a href="index.html" style="display:inline-block; margin-top:1rem; color:#f7c600; font-weight:600;">← Volver al inicio</a>
            </div>
        `;
    }
}
