// ==========================================
// 🛒 CHECKOUT — Datos → Mercado Pago → Confirmación
// ==========================================

const API_URL = '/api';
let carrito = [];

document.addEventListener('DOMContentLoaded', () => {
  // Cargar carrito desde el almacenamiento
  carrito = JSON.parse(localStorage.getItem('carrito') || '[]');

  // Si no hay productos, volver al carrito
  if (carrito.length === 0) {
    window.location.href = 'carrito.html';
    return;
  }

  // Mostrar resumen
  cargarResumen();

  // Ocultar carga, mostrar formulario
  setTimeout(() => {
    document.getElementById('pantalla-carga').classList.remove('active');
    document.getElementById('paso-datos').classList.add('active');
  }, 400);

  // Conectar el formulario
  document.getElementById('form-envio').addEventListener('submit', irAPagar);
});

// ==========================================
// 📋 Resumen de productos
// ==========================================
function cargarResumen() {
  const contenedor = document.getElementById('lista-resumen');
  let total = 0;

  contenedor.innerHTML = carrito.map(item => {
    const subtotal = item.precio * item.cantidad;
    total += subtotal;
    return `
      <div class="fila-resumen">
        <span>${item.nombre} × ${item.cantidad}</span>
        <span>$${subtotal.toLocaleString('es-AR')}</span>
      </div>
    `;
  }).join('');

  document.getElementById('res-total').textContent = `$${total.toLocaleString('es-AR')}`;
}

// ==========================================
// 💳 Enviar a Mercado Pago
// ==========================================
async function irAPagar(e) {
  e.preventDefault();

  // Obtener TODOS los datos del formulario
  const nombre = document.getElementById('comprador_nombre').value.trim();
  const telefono = document.getElementById('comprador_telefono').value.trim();
  const direccion = document.getElementById('envio_direccion').value.trim();
  const email = document.getElementById('comprador_email').value.trim() || 'sin-email@correo.com';
  const observaciones = document.getElementById('observaciones').value.trim();

  // Validar campos obligatorios
  if (!nombre) return alert('⚠️ Escribí tu nombre y apellido');
  if (!telefono) return alert('⚠️ Escribí tu teléfono');
  if (!direccion) return alert('⚠️ Escribí tu dirección completa');

  const total = carrito.reduce((suma, item) => suma + item.precio * item.cantidad, 0);

  try {
    // 1️⃣ Registrar el pedido en la base de datos
    const resPedido = await fetch(`${API_URL}/pedidos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cliente: nombre,
        telefono: telefono,
        direccion: direccion,
        observaciones: observaciones,
        items: carrito,
        metodo_pago: 'Mercado Pago',
        monto_total: total
      })
    });

    if (!resPedido.ok) throw new Error('No se pudo registrar tu pedido');
    const datosPedido = await resPedido.json();
    console.log('✅ Pedido registrado N°:', datosPedido.pedido_id);

    // 2️⃣ Crear el enlace de pago en Mercado Pago
    const resPago = await fetch(`${API_URL}/crear-pago`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: carrito.map(i => ({
          id: i.id,
          nombre: i.nombre,
          cantidad: i.cantidad,
          precio: i.precio
        })),
        nombre: nombre,
        telefono: telefono,
        direccion: direccion,
        email: email
      })
    });

    if (!resPago.ok) throw new Error('No se pudo conectar con Mercado Pago');
    const datosPago = await resPago.json();

    // 3️⃣ Vaciar el carrito y llevar a pagar
    localStorage.removeItem('carrito');
    window.location.href = datosPago.url_pago;

  } catch (error) {
    console.error('❌ Error:', error);
    alert('❌ ' + error.message);
  }
}