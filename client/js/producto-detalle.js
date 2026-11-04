const API_URL = '/api';

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (!id) {
        console.log('❌ No hay ID en la URL');
        return;
    }

    console.log('🔍 Buscando producto ID:', id);

    try {
        const res = await fetch(`${API_URL}/productos`);
        if (!res.ok) throw new Error('Error al conectar');
        
        const todos = await res.json();
        console.log('✅ Productos recibidos:', todos.length);
        
        const prod = todos.find(p => String(p.id) === String(id));
        if (!prod) {
            console.log('❌ Producto no encontrado');
            document.querySelector('.detalle-contenedor').innerHTML = `
                <div style="text-align:center; padding:3rem;">
                    <p style="color:red; font-size:1.2rem;">Producto no encontrado</p>
                    <a href="../index.html" style="color:#FFCC00;">Volver a la tienda</a>
                </div>
            `;
            return;
        }

        console.log('✅ Producto cargado:', prod);
        mostrar(prod);

    } catch (e) {
        console.error('❌ Error:', e);
    }
});

function mostrar(p) {
    // ========== IMAGEN — leer correctamente ==========
    let rutaImg = '../assets/img/logos/favicon.png'; // Imagen por defecto

    // Opción 1: campo imagen_url
    if (p.imagen_url && p.imagen_url !== '') {
        rutaImg = p.imagen_url.startsWith('http') || p.imagen_url.startsWith('/')
            ? p.imagen_url
            : '../' + p.imagen_url;
    }
    // Opción 2: campo imagenes (JSON o texto)
    else if (p.imagenes && p.imagenes !== '' && p.imagenes !== '[]') {
        let primera = '';
        try {
            const arr = JSON.parse(p.imagenes);
            primera = Array.isArray(arr) ? arr[0] : arr;
        } catch {
            primera = p.imagenes;
        }
        if (primera) {
            rutaImg = primera.startsWith('http') || primera.startsWith('/')
                ? primera
                : '../' + primera;
        }
    }

    console.log('🖼️ Ruta imagen final:', rutaImg);

    // ========== PRECIOS ==========
    const tieneOferta = p.precio_oferta > 0;
    const precioFinal = tieneOferta ? p.precio_oferta : p.precio;

    // ========== Guardar para carrito ==========
    window.productoActual = {
        id: p.id,
        nombre: p.nombre,
        precio: precioFinal,
        imagen: rutaImg,
        categoria: p.categoria
    };

    // ========== DIBUJAR TODO ==========
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
                ${tieneOferta 
                    ? `<span class="precio-viejo">$${Number(p.precio).toLocaleString('es-AR')}</span>
                       <span class="precio-oferta">$${Number(precioFinal).toLocaleString('es-AR')}</span>`
                    : `<span class="precio-actual">$${Number(precioFinal).toLocaleString('es-AR')}</span>`
                }
            </div>

            ${p.en_oferta == 1 ? '<span class="etiqueta-oferta">🔥 En oferta</span>' : ''}

            ${p.descripcion_corta ? `<p class="descripcion-corta">${p.descripcion_corta}</p>` : ''}
            ${p.descripcion_larga ? `<div class="descripcion-larga">${p.descripcion_larga}</div>` : ''}

            <div class="bloque-cantidad">
                <label>Cantidad:</label>
                <div class="control-cantidad">
                    <button type="button" id="btnMenos">−</button>
                    <input type="number" id="cantidad" value="1" min="1">
                    <button type="button" id="btnMas">+</button>
                </div>
            </div>

            <button id="btnAgregar" class="btn-agregar-carrito">
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

    // Actualizar miga de pan
    const miga = document.getElementById('miga-nombre');
    if (miga) miga.textContent = p.nombre || 'Producto';

    // Conectar botones
    document.getElementById('btnMenos').addEventListener('click', () => {
        const v = parseInt(document.getElementById('cantidad').value);
        if (v > 1) document.getElementById('cantidad').value = v - 1;
    });

    document.getElementById('btnMas').addEventListener('click', () => {
        document.getElementById('cantidad').value = parseInt(document.getElementById('cantidad').value) + 1;
    });

    document.getElementById('btnAgregar').addEventListener('click', () => {
        const cant = parseInt(document.getElementById('cantidad').value);
        const item = { ...window.productoActual, cantidad: cant };

        if (typeof agregarAlCarrito === 'function') {
            agregarAlCarrito(item);
        } else {
            let carrito = JSON.parse(localStorage.getItem('carritoZapatoKiosco') || '[]');
            const existe = carrito.find(i => i.id === item.id);
            existe ? existe.cantidad += cant : carrito.push(item);
            localStorage.setItem('carritoZapatoKiosco', JSON.stringify(carrito));
            alert('✅ Agregado al carrito');
        }
    });
}
