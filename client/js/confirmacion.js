document.addEventListener('DOMContentLoaded', function() {
    // Verificar sesión
    const usuario = JSON.parse(localStorage.getItem('usuarioActual'));
    if (!usuario) {
        alert('⚠️ Debés iniciar sesión');
        window.location.href = 'iniciar-sesion.html';
        return;
    }

    // Obtener último pedido
    const historial = JSON.parse(localStorage.getItem('historialPedidos')) || [];
    if (historial.length === 0) {
        document.querySelector('.confirmacion-compra').innerHTML = `
            <h2>No encontramos tu pedido</h2>
            <p>Volvé a la tienda para ver tus productos.</p>
            <div class="btn-group">
                <a href="../index.html" class="btn-siguiente">Ir a la tienda</a>
            </div>
        `;
        return;
    }

    // Tomar el último pedido realizado
    const pedido = historial[historial.length - 1];

    // Cargar datos en la página
    document.getElementById('pedido_numero').textContent = pedido.id;
    document.getElementById('pedido_fecha').textContent = pedido.fecha;
    document.getElementById('pedido_metodo').textContent = pedido.pago.metodo;
    document.getElementById('pedido_total').textContent = `$ ${pedido.total.toLocaleString('es-AR')}`;
    document.getElementById('pedido_direccion').textContent = pedido.direccion;
    document.getElementById('pedido_costo_envio').textContent = `$ ${pedido.envio.costo.toLocaleString('es-AR')}`;
    document.getElementById('pedido_estado').textContent = pedido.estado;
});