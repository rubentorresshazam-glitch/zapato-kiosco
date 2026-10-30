// ==============================================
// 🛒 ZAPATO KIOSCO — FUNCIONES GLOBALES UNIFICADAS
// Conectado a base de datos — funciona en local Y en internet
// ==============================================

// ✅ Ruta automática — funciona en cualquier dominio
const API_URL = `${window.location.origin}/api`;

// ✅ CARRITO — clave unificada para no perder nada
const CLAVE_CARRITO = "carritoZapatoKiosco";
let carrito = JSON.parse(localStorage.getItem(CLAVE_CARRITO)) || [];

// ==============================================
// ✅ AGREGAR AL CARRITO — centralizado
// ==============================================
function agregarAlCarrito(producto) {
  // Normalizar todos los campos
  const item = {
    id: producto.id,
    nombre: producto.nombre,
    precio: producto.precio_oferta || producto.precio, // toma oferta automáticamente
    imagen: producto.imagen || producto.imagen_url || '',
    cantidad: producto.cantidad || 1
  };

  const existe = carrito.find(i => i.id === item.id);
  if (existe) {
    existe.cantidad += item.cantidad;
  } else {
    carrito.push(item);
  }

  guardarCarrito();
  actualizarContadorCarrito();
  mostrarNotificacion(`✅ ${item.nombre} agregado`);
}

function guardarCarrito() {
  localStorage.setItem(CLAVE_CARRITO, JSON.stringify(carrito));
  // Compatibilidad con otras claves
  localStorage.setItem("carrito", JSON.stringify(carrito));
}

function actualizarContadorCarrito() {
  const total = carrito.reduce((suma, item) => suma + item.cantidad, 0);

  // Todos los contadores que existan
  const selectores = ["#contador-carrito", "#headerCartCount", ".cart-count"];
  selectores.forEach(sel => {
    const el = document.querySelector(sel);
    if (el) {
      el.textContent = total;
      el.style.display = total > 0 ? "flex" : "none";
    }
  });
}

function mostrarNotificacion(mensaje) {
  const aviso = document.createElement("div");
  aviso.style.cssText = `
    position: fixed; top: 20px; right: 20px; z-index: 99999;
    background: #00a650; color: white; padding: 14px 24px;
    border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    font-weight: 600; transform: translateX(120%); transition: transform 0.3s ease;
  `;
  aviso.textContent = mensaje;
  document.body.appendChild(aviso);
  
  setTimeout(() => aviso.style.transform = "translateX(0)", 10);
  setTimeout(() => {
    aviso.style.transform = "translateX(120%)";
    setTimeout(() => aviso.remove(), 300);
  }, 2500);
}

// ==============================================
// ✅ IR A DETALLE DE PRODUCTO
// ==============================================
function verDetalles(id) {
  window.location.href = `producto-detalle.html?id=${id}`;
}

// ==============================================
// ✅ CARGAR DETALLE — desde la base de datos
// ==============================================
async function cargarDetalleProducto() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (!id) {
    mostrarErrorDetalle("No se especificó el producto");
    return;
  }

  try {
    const respuesta = await fetch(`${API_URL}/productos/${id}`);
    if (!respuesta.ok) throw new Error("Producto no encontrado");

    const p = await respuesta.json();

    // 📋 Llenar todos los campos
    const el = (id) => document.getElementById(id);
    
    if (el("titulo-producto")) el("titulo-producto").textContent = p.nombre;
    if (el("nombre-producto")) el("nombre-producto").textContent = p.nombre;
    
    const precioFinal = p.precio_oferta && p.precio_oferta > 0 ? p.precio_oferta : p.precio;
    if (el("precio-producto")) el("precio-producto").textContent = `$ ${precioFinal.toLocaleString("es-AR")}`;

    // Categoría con enlace
    const enlacesCat = {
      'Celulares y Smartphones': 'celulares.html',
      'Telefonía y Accesorios': 'telefonia.html',
      'Cables y Cargadores': 'cables.html',
      'Pendrives y Almacenamiento': 'pendrives.html',
      'Artículos de Pesca': 'pesca.html',
      'Tabaquería': 'tabaqueria.html',
      'Relojes': 'relojes.html',
      'Artículos de Camping': 'camping.html',
      'Termos y Mates': 'termos-y-mates.html',
      'Gafas y Lentes': 'gafas.html',
      'Sahumerios': 'sahumerios.html',
      'Aromatizantes': 'aromatizantes.html',
      'Automotor': 'automotor.html'
    };
    
    const catLink = el("categoria-link");
    if (catLink) {
      catLink.textContent = p.categoria;
      catLink.href = enlacesCat[p.categoria] || '../index.html';
    }

    // Imagen principal — usa la primera de la galería si no hay imagen_url
    const imgPrincipal = p.imagen_url || (p.imagenes && p.imagenes[0]) || '../assets/img/logos/favicon.png';
    if (el("imagen-principal")) el("imagen-principal").src = imgPrincipal;

    // Descripciones
    if (el("descripcion-corta")) el("descripcion-corta").textContent = p.descripcion_corta || '';
    if (el("descripcion-larga")) el("descripcion-larga").innerHTML = `<p>${p.descripcion_larga || ''}</p>`;

    // Stock
    const stockEl = el("estado-stock");
    const hayStock = (p.stock || 0) > 0;
    if (stockEl) {
      stockEl.innerHTML = hayStock
        ? `<i class="fa-solid fa-check-circle"></i> En stock (${p.stock})`
        : `<i class="fa-solid fa-times-circle"></i> Sin stock`;
      stockEl.className = hayStock ? "stock-info" : "stock-info sin-stock";
    }

    // Características
    const listaCar = el("lista-caracteristicas");
    if (listaCar) {
      const caracteristicas = p.caracteristicas || [];
      listaCar.innerHTML = caracteristicas.length > 0
        ? caracteristicas.map(c => `<li><i class="fa-solid fa-check"></i> ${c}</li>`).join("")
        : '<li><i class="fa-solid fa-check"></i> Producto de calidad seleccionado</li>';
    }

    // 🛒 Botón Agregar desde detalle
    const btnAgregar = el("btn-agregar-detalle");
    if (btnAgregar) {
      btnAgregar.onclick = () => {
        const cantInput = el("cantidad");
        const cant = cantInput ? Math.max(1, parseInt(cantInput.value) || 1) : 1;
        agregarAlCarrito({
          id: p.id,
          nombre: p.nombre,
          precio: precioFinal,
          imagen: imgPrincipal,
          cantidad: cant
        });
      };
    }

  } catch (error) {
    console.error("❌ Error detalle:", error);
    mostrarErrorDetalle(error.message);
  }
}

function mostrarErrorDetalle(mensaje = "El producto no existe") {
  const contenedor = document.querySelector(".product-detail");
  if (contenedor) {
    contenedor.innerHTML = `
      <div class="error-producto" style="text-align:center; padding:60px 20px;">
        <h2>😕 Producto no encontrado</h2>
        <p>${mensaje}</p>
        <a href="../index.html" class="btn-volver" style="display:inline-block; margin-top:20px;">Volver al inicio</a>
      </div>`;
  }
}

// ==============================================
// ✅ CONTROLES DE CANTIDAD
// ==============================================
function configurarCantidad() {
  const restar = document.querySelector(".btn-cantidad.restar");
  const sumar = document.querySelector(".btn-cantidad.sumar");
  const input = document.getElementById("cantidad");

  if (restar && sumar && input) {
    restar.onclick = () => input.value = Math.max(1, parseInt(input.value) - 1);
    sumar.onclick = () => input.value = Math.min(10, parseInt(input.value) + 1);
  }
}

// ==============================================
// ✅ INICIO GENERAL
// ==============================================
document.addEventListener("DOMContentLoaded", () => {
  // Recuperar carrito
  carrito = JSON.parse(localStorage.getItem(CLAVE_CARRITO)) || 
            JSON.parse(localStorage.getItem("carrito")) || [];
  actualizarContadorCarrito();

  // 📄 Página de detalle
  if (window.location.pathname.includes("producto-detalle.html")) {
    cargarDetalleProducto();
    configurarCantidad();
  }

  // 🎯 Botones VER DETALLE desde tarjetas
  document.querySelectorAll(".btn-ver, .product-image a, .product-card a").forEach(btn => {
    const tarjeta = btn.closest(".product-card");
    if (tarjeta && tarjeta.dataset.id) {
      btn.onclick = (e) => {
        e.preventDefault();
        verDetalles(parseInt(tarjeta.dataset.id));
      };
    }
  });

  // 🛒 Botones AGREGAR AL CARRITO desde tarjetas
  document.querySelectorAll(".agregar-carrito, .product-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const tarjeta = btn.closest(".product-card");
      if (!tarjeta) return;

      // Tomar datos de la tarjeta
      const id = parseInt(tarjeta.dataset.id);
      const nombre = tarjeta.querySelector(".product-title")?.textContent || "Producto";
      
      // Leer precio (detecta oferta)
      const precioEl = tarjeta.querySelector(".price-current, .product-price-block span:first-child");
      let precio = 0;
      if (precioEl) {
        precio = parseFloat(precioEl.textContent.replace(/[^0-9,]/g, '').replace(',', '.')) || 0;
      }

      // Tomar imagen
      const imgEl = tarjeta.querySelector("img");
      const imagen = imgEl ? imgEl.src : '';

      agregarAlCarrito({ id, nombre, precio, imagen, cantidad: 1 });
    });
  });
});