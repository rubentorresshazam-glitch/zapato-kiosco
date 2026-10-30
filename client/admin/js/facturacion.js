// ======================================
// GESTIÓN DE FACTURACIÓN - FORMATO COMPROBANTE
// ======================================

document.addEventListener('DOMContentLoaded', () => {
    // Cargar datos de ejemplo o desde pedido seleccionado
    const parametros = new URLSearchParams(window.location.search);
    const idPedido = parametros.get('id');
    
    if (idPedido) {
        cargarDatosPedido(idPedido);
    } else {
        cargarFacturaVacia();
    }
});

// Cargar datos desde un pedido (conectado a pedidos)
function cargarDatosPedido(idPedido) {
    const pedidos = JSON.parse(localStorage.getItem('pedidos_tienda')) || [];
    const pedido = pedidos.find(p => p.id == idPedido);
    
    if (!pedido) {
        alert('Pedido no encontrado');
        return;
    }

    // Datos generales
    document.getElementById('nroFactura').textContent = `0001-${String(pedido.id).padStart(8, '0')}`;
    document.getElementById('fechaFactura').textContent = pedido.fecha;
    document.getElementById('clienteNombre').textContent = pedido.cliente || 'Consumidor Final';
    document.getElementById('clienteDocumento').textContent = pedido.documento || '---';
    document.getElementById('clienteDireccion').textContent = pedido.direccion || '---';
    document.getElementById('clienteTelefono').textContent = pedido.telefono || '---';

    // Productos
    const cuerpo = document.getElementById('listaProductosFactura');
    cuerpo.innerHTML = '';
    let subtotal = 0;

    pedido.items.forEach(item => {
        const importe = item.cantidad * item.precio;
        subtotal += importe;
        
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td>${item.cantidad}</td>
            <td>${item.nombre}</td>
            <td>$ ${item.precio.toLocaleString('es-AR')}</td>
            <td>$ ${importe.toLocaleString('es-AR')}</td>
        `;
        cuerpo.appendChild(fila);
    });

    // Calcular totales
    const iva = subtotal * 0.21;
    const total = subtotal + iva;
    
    document.getElementById('subtotalFactura').textContent = `$ ${subtotal.toLocaleString('es-AR')}`;
    document.getElementById('ivaFactura').textContent = `$ ${iva.toLocaleString('es-AR')}`;
    document.getElementById('totalFactura').textContent = `$ ${total.toLocaleString('es-AR')}`;
}

// Factura vacía de ejemplo
function cargarFacturaVacia() {
    const hoy = new Date().toLocaleDateString('es-AR');
    document.getElementById('fechaFactura').textContent = hoy;
    document.getElementById('nroFactura').textContent = '0001-00000001';
    document.getElementById('listaProductosFactura').innerHTML = `
        <tr>
            <td colspan="4" class="texto-centro">Seleccioná un pedido para generar su factura</td>
        </tr>
    `;
}

// Función imprimir
function imprimirFactura() {
    window.print();
}