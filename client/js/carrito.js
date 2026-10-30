// ==========================================
// 🛒 CARRITO DE COMPRAS — Funcional completo
// ==========================================

let carrito = [];

// Cargar al iniciar
document.addEventListener('DOMContentLoaded', () => {
    cargarCarrito();
    renderizarCarrito();
    actualizarContadorHeader();
});

// Leer desde localStorage
function cargarCarrito() {
    const guardado = localStorage.getItem('carrito');
    carrito = guardado ? JSON.parse(guardado) : [];
}

// Guardar en localStorage
function guardarCarrito() {
    localStorage.setItem('carrito', JSON.stringify(carrito));
    actualizarContadorHeader();
}

// ✅ Función para agregar producto (la usan desde producto-detalle.js)
function agregarAlCarrito(producto) {
    const existe = carrito.find(item => item.id === producto.id);
    
    if (existe) {
        existe.cantidad += producto.cantidad || 1;
    } else {
        carrito.push({
            ...producto,
            cantidad: producto.cantidad || 1
        });
    }
    
    guardarCarrito();
    renderizarCarrito();
}

// Mostrar todo en pantalla
function renderizarCarrito() {
    const contenedor = document.getElementById('carrito-lista');
    const subtotalElem = document.getElementById('subtotal');
    const totalElem = document.getElementById('total');
    const btnPagar = document.getElementById('btn-pagar');

    if (!contenedor) return;

    // Carrito vacío
    if (carrito.length === 0) {
        contenedor.innerHTML = `
            <div class="carrito-vacio">
                <i class="fa-solid fa-cart-shopping"></i>
                <h2>Tu carrito está vacío</h2>
                <p>Agregá productos para empezar tu compra</p>
                <a href="../index.html" class="btn-volver-tienda">Ver productos</a>
            </div>
        `;
        if (subtotalElem) subtotalElem.textContent = '$0';
        if (totalElem) totalElem.textContent = '$0';
        if (btnPagar) btnPagar.disabled = true;
        return;
    }

    // Llenar productos
    contenedor.innerHTML = carrito.map(item => `
        <div class="item-carrito">
            <img src="${item.imagen || '../assets/img/productos/default.jpg'}" alt="${item.nombre}" class="item-imagen">
            <div class="item-datos">
                <h4>${item.nombre}</h4>
                <p class="item-precio">$${formatearNumero(item.precio)}</p>
                <div class="item-cantidad">
                    <button class="btn-menos" data-id="${item.id}">−</button>
                    <span class="cantidad-num">${item.cantidad}</span>
                    <button class="btn-mas" data-id="${item.id}">+</button>
                </div>
            </div>
            <button class="btn-eliminar" data-id="${item.id}">
                <i class="fa-solid fa-trash"></i>
            </button>
        </div>
    `).join('');

    // Calcular totales
    const subtotal = carrito.reduce((s, i) => s + (i.precio * i.cantidad), 0);
    
    if (subtotalElem) subtotalElem.textContent = `$${formatearNumero(subtotal)}`;
    if (totalElem) totalElem.textContent = `$${formatearNumero(subtotal)}`;
    if (btnPagar) btnPagar.disabled = false;

    // Conectar botones
    conectarBotones();
}

// Acciones de los botones
function conectarBotones() {
    // Menos cantidad
    document.querySelectorAll('.btn-menos').forEach(btn => {
        btn.onclick = () => {
            const id = parseInt(btn.dataset.id);
            const item = carrito.find(i => i.id === id);
            if (item) {
                item.cantidad--;
                if (item.cantidad <= 0) {
                    carrito = carrito.filter(i => i.id !== id);
                }
                guardarCarrito();
                renderizarCarrito();
            }
        };
    });

    // Más cantidad
    document.querySelectorAll('.btn-mas').forEach(btn => {
        btn.onclick = () => {
            const id = parseInt(btn.dataset.id);
            const item = carrito.find(i => i.id === id);
            if (item) {
                item.cantidad++;
                guardarCarrito();
                renderizarCarrito();
            }
        };
    });

    // Eliminar
    document.querySelectorAll('.btn-eliminar').forEach(btn => {
        btn.onclick = () => {
            const id = parseInt(btn.dataset.id);
            carrito = carrito.filter(i => i.id !== id);
            guardarCarrito();
            renderizarCarrito();
        };
    });

    // Ir a pagar
    const btnPagar = document.getElementById('btn-pagar');
    if (btnPagar) {
        btnPagar.onclick = () => {
            if (carrito.length > 0) {
                window.location.href = 'checkout.html';
            }
        };
    }
}

// Contador en el encabezado
function actualizarContadorHeader() {
    const total = carrito.reduce((sum, item) => sum + item.cantidad, 0);
    const contador = document.getElementById('headerCartCount');
    if (contador) contador.textContent = total;
}

// Formato de precio
function formatearNumero(n) {
    return Number(n).toLocaleString('es-AR');
}

// Exponer función para que la use producto-detalle.js
window.agregarAlCarrito = agregarAlCarrito;