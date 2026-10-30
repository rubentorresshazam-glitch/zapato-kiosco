// ==========================================
// 📄 DETALLE DE PRODUCTO — CONECTADO A BD + LISTO PARA RENDER
// ==========================================

// ✅ Ruta relativa = funciona en local y en Render automáticamente
const API_URL = `${window.location.origin}/api`;

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
});

// ==========================================
// 📦 Cargar producto desde la base de datos
// ==========================================
async function cargarProducto(idProducto) {
    try {
        console.log('🔍 Cargando producto ID:', idProducto);
        
        const respuesta = await fetch(`${API_URL}/productos/${idProducto}`);
        
        if (!respuesta.ok) {
            if (respuesta.status === 404) {
                throw new Error('Producto no encontrado');
            }
            throw new Error('Error al cargar');
        }

        const producto = await respuesta.json();
        console.log('✅ Producto cargado:', producto);
        mostrarProducto(producto);

    } catch (error) {
        console.error('❌ Error al cargar:', error);
        mostrarError(error.message || 'No se pudo cargar el producto');
    }
}

// ==========================================
// 🎨 Mostrar todos los datos en la página
// ==========================================
function mostrarProducto(p) {
    // Título de la página
    const tituloPag = document.getElementById('titulo-pagina');
    if (tituloPag) tituloPag.textContent = `${p.nombre} | Zapato Kiosco`;

    // Migas de pan
    const migaNombre = document.getElementById('nombre-producto-miga');
    const enlaceCat = document.getElementById('enlace-categoria');
    
    if (migaNombre) migaNombre.textContent = p.nombre;
    if (enlaceCat && p.categoria) {
        enlaceCat.textContent = p.categoria;
        enlaceCat.href = obtenerEnlaceCategoria(p.categoria);
    }

    // Nombre y descripción
    const elemNombre = document.getElementById('nombre-producto');
    const elemDesc = document.getElementById('descripcion-larga');
    
    if (elemNombre) elemNombre.textContent = p.nombre;
    
    const textoDescripcion = p.descripcion_larga || p.descripcion || p.descripcion_corta || 'Sin descripción disponible';
    if (elemDesc) elemDesc.textContent = textoDescripcion;

    // Precios — detectar oferta
    const precioActual = p.en_oferta && p.precio_oferta ? p.precio_oferta : p.precio;
    
    const elemPrecioActual = document.getElementById('precio-actual');
    const elemPrecioAntes = document.getElementById('precio-antes');
    const elemDescuento = document.getElementById('etiqueta-descuento');
    
    if (elemPrecioActual) elemPrecioActual.textContent = `$${formatearNumero(precioActual)}`;

    if (p.en_oferta && p.precio_oferta && p.precio_oferta < p.precio) {
        if (elemPrecioAntes) {
            elemPrecioAntes.textContent = `$${formatearNumero(p.precio)}`;
            elemPrecioAntes.style.display = 'block';
        }
        const descuento = Math.round((1 - p.precio_oferta / p.precio) * 100);
        if (elemDescuento) {
            elemDescuento.textContent = `-${descuento}%`;
            elemDescuento.style.display = 'inline-block';
        }
    } else {
        if (elemPrecioAntes) elemPrecioAntes.style.display = 'none';
        if (elemDescuento) elemDescuento.style.display = 'none';
    }

    // Imagen principal — galería o imagen única
    const imgPrincipal = document.getElementById('imagen-principal');
    let imagenActiva = '../assets/img/logos/favicon.png'; // Imagen por defecto
    
    if (p.imagen_url && p.imagen_url !== '') {
        imagenActiva = p.imagen_url;
    } else if (p.imagenes && Array.isArray(p.imagenes) && p.imagenes.length > 0) {
        imagenActiva = p.imagenes[0];
    }
    
    if (imgPrincipal) {
        imgPrincipal.src = imagenActiva;
        imgPrincipal.alt = p.nombre;
    }

    // Miniaturas de la galería
    const contenedorMini = document.getElementById('contenedor-miniaturas');
    if (contenedorMini) {
        contenedorMini.innerHTML = '';
        
        let listaImagenes = [];
        if (p.imagen_url && p.imagen_url !== '') listaImagenes.push(p.imagen_url);
        if (p.imagenes && Array.isArray(p.imagenes)) {
            p.imagenes.forEach(img => {
                if (img && !listaImagenes.includes(img)) listaImagenes.push(img);
            });
        }
        
        listaImagenes.forEach((imgSrc, indice) => {
            const mini = document.createElement('img');
            mini.src = imgSrc;
            mini.alt = `Vista ${indice + 1}`;
            if (indice === 0) mini.classList.add('activa');
            mini.onclick = () => {
                if (imgPrincipal) imgPrincipal.src = imgSrc;
                document.querySelectorAll('#contenedor-miniaturas img').forEach(m => m.classList.remove('activa'));
                mini.classList.add('activa');
            };
            contenedorMini.appendChild(mini);
        });
    }

    // Estado de stock
    const disp = document.getElementById('disponibilidad');
    const btnAgregar = document.getElementById('btn-agregar');
    const btnComprar = document.getElementById('btn-comprar');
    
    const hayStock = p.stock === undefined || p.stock === null || p.stock > 0;
    
    if (disp) {
        if (hayStock) {
            disp.innerHTML = '<i class="fa-solid fa-circle-check"></i> <span>Disponible</span>';
            disp.classList.remove('sin-stock');
        } else {
            disp.innerHTML = '<i class="fa-solid fa-circle-xmark"></i> <span>Sin stock</span>';
            disp.classList.add('sin-stock');
        }
    }
    
    if (btnAgregar) btnAgregar.disabled = !hayStock;
    if (btnComprar) btnComprar.disabled = !hayStock;

    // Datos del producto para los botones
    const datosProducto = {
        id: p.id,
        nombre: p.nombre,
        precio: precioActual,
        imagen: imagenActiva,
        categoria: p.categoria
    };

    // Conectar botones
    if (btnAgregar) {
        btnAgregar.onclick = () => agregarAlCarrito(datosProducto);
    }
    if (btnComprar) {
        btnComprar.onclick = () => comprarAhora(datosProducto);
    }
}

// ==========================================
// ➕ Control de cantidad
// ==========================================
function configurarCantidad() {
    const input = document.getElementById('cantidad');
    const btnMenos = document.getElementById('btn-menos');
    const btnMas = document.getElementById('btn-mas');
    
    if (btnMenos && input) {
        btnMenos.onclick = () => {
            input.value = Math.max(1, parseInt(input.value) - 1);
        };
    }
    if (btnMas && input) {
        btnMas.onclick = () => {
            input.value = parseInt(input.value) + 1;
        };
    }
}

// ==========================================
// 🛒 Agregar al carrito — USA TU FUNCIÓN GLOBAL
// ==========================================
function agregarAlCarrito(producto) {
    const input = document.getElementById('cantidad');
    const cantidad = input ? parseInt(input.value) || 1 : 1;

    // ✅ Usar la función global de funciones-globales.js
    if (typeof window.agregarAlCarrito === 'function') {
        window.agregarAlCarrito({
            ...producto,
            cantidad: cantidad
        });
    } else {
        // Fallback si no está cargado el archivo global
        console.warn('Función global no encontrada, usando respaldo');
        const carrito = JSON.parse(localStorage.getItem('carritoZapatoKiosco') || '[]');
        const existe = carrito.find(i => i.id === producto.id);
        if (existe) {
            existe.cantidad += cantidad;
        } else {
            carrito.push({ ...producto, cantidad });
        }
        localStorage.setItem('carritoZapatoKiosco', JSON.stringify(carrito));
        localStorage.setItem('carrito', JSON.stringify(carrito));
        alert(`✅ Agregado: ${producto.nombre} ×${cantidad}`);
    }
}

// ==========================================
// 💳 Comprar ahora → directo al checkout
// ==========================================
function comprarAhora(producto) {
    const input = document.getElementById('cantidad');
    const cantidad = input ? parseInt(input.value) || 1 : 1;
    
    agregarAlCarrito({ ...producto, cantidad });
    window.location.href = '../mi-cuenta/checkout.html';
}

// ==========================================
// 🔧 Utilidades
// ==========================================
function formatearNumero(n) {
    return Number(n).toLocaleString('es-AR');
}

function obtenerEnlaceCategoria(nombreCat) {
    const enlaces = {
        'Automotor': 'automotor.html',
        'Aromatizantes': 'aromatizantes.html',
        'Telefonía y Accesorios': 'telefonia.html',
        'Cables y Cargadores': 'cables.html',
        'Artículos de Pesca': 'pesca.html',
        'Relojes': 'relojes.html',
        'Gafas y Lentes': 'gafas.html',
        'Celulares y Smartphones': 'celulares.html',
        'Pendrives y Almacenamiento': 'pendrives.html',
        'Artículos de Camping': 'camping.html',
        'Termos y Mates': 'termos-y-mates.html',
        'Sahumerios': 'sahumerios.html'
    };
    return enlaces[nombreCat] || '../index.html';
}

function mostrarError(mensaje) {
    const contenedor = document.querySelector('.detalle-contenedor');
    if (contenedor) {
        contenedor.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
                <i class="fa-solid fa-triangle-exclamation" style="font-size: 48px; color: #d63030;"></i>
                <h2 style="margin: 20px 0;">${mensaje}</h2>
                <a href="../index.html" style="display: inline-block; padding: 12px 24px; background: #FFCC00; color: #000; border-radius: 8px; font-weight: 600; text-decoration: none; margin-top: 15px;">Volver al inicio</a>
            </div>
        `;
    }
}