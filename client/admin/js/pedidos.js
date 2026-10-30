// ==========================================
// 📋 GESTIÓN DE PEDIDOS — Datos reales de la BD
// ==========================================
const API_URL = '/api';
let todosLosPedidos = [];

document.addEventListener('DOMContentLoaded', async () => {
    console.log('📋 Cargando gestión de pedidos...');
    
    // Cargar pedidos
    await cargarPedidos();
    
    // Conectar buscador
    document.getElementById('buscadorPedido').addEventListener('input', aplicarFiltros);
    document.getElementById('filtroEstado').addEventListener('change', aplicarFiltros);
});

// Cargar desde la base de datos
async function cargarPedidos() {
    try {
        const respuesta = await fetch(`${API_URL}/admin/pedidos`);
        if (!respuesta.ok) throw new Error('Error al cargar');
        
        todosLosPedidos = await respuesta.json();
        console.log(`✅ ${todosLosPedidos.length} pedidos cargados`);
        
        aplicarFiltros();
        actualizarResumen();
        
    } catch (error) {
        console.error('❌ Error:', error);
        document.getElementById('listaPedidos').innerHTML = `
            <tr>
                <td colspan="8" style="text-align:center; padding:2rem; color:#d63030;">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                    <p>No se pudieron cargar los pedidos</p>
                </td>
            </tr>
        `;
    }
}

// Filtrar y renderizar
function aplicarFiltros() {
    const buscador = document.getElementById('buscadorPedido').value.toLowerCase();
    const filtroEstado = document.getElementById('filtroEstado').value;
    
    let filtrados = todosLosPedidos;
    
    // Por estado
    if (filtroEstado !== 'todos') {
        filtrados = filtrados.filter(p => 
            (p.estado || 'recibido').toLowerCase() === filtroEstado.toLowerCase()
        );
    }
    
    // Por búsqueda
    if (buscador) {
        filtrados = filtrados.filter(p =>
            String(p.id).includes(buscador) ||
            (p.nombre_cliente || '').toLowerCase().includes(buscador) ||
            (p.telefono || '').includes(buscador)
        );
    }
    
    renderizarTabla(filtrados);
}

// Mostrar en tabla
function renderizarTabla(pedidos) {
    const cuerpo = document.getElementById('listaPedidos');
    
    if (pedidos.length === 0) {
        cuerpo.innerHTML = `
            <tr>
                <td colspan="8" style="text-align:center; padding:2rem; color:#888;">
                    <i class="fa-solid fa-inbox" style="font-size:2rem; color:#ddd;"></i>
                    <p>No se encontraron pedidos</p>
                </td>
            </tr>
        `;
        return;
    }
    
    cuerpo.innerHTML = pedidos.map(p => {
        // Formatear fecha
        const fecha = p.fecha ? new Date(p.fecha) : new Date();
        const fechaStr = fecha.toLocaleDateString('es-AR') + ' ' + 
                         fecha.toLocaleTimeString('es-AR', {hour:'2-digit', minute:'2-digit'});
        
        // Clase de estado
        const estadoActual = (p.estado || 'recibido').toLowerCase();
        const claseEstado = {
            'recibido': 'pendiente',
            'pendiente': 'pendiente',
            'confirmado': 'confirmado',
            'enviado': 'enviado',
            'entregado': 'entregado',
            'pagado': 'confirmado',
            'cancelado': 'cancelado'
        }[estadoActual] || 'pendiente';
        
        const textoEstado = p.estado ? p.estado.charAt(0).toUpperCase() + p.estado.slice(1) : 'Pendiente';
        
        return `
            <tr>
                <td><strong>#${String(p.id).padStart(5, '0')}</strong></td>
                <td>${fechaStr}</td>
                <td>${p.nombre_cliente || '—'}</td>
                <td>${p.telefono || '—'}</td>
                <td>${(p.direccion || '—').substring(0, 25)}${(p.direccion || '').length > 25 ? '...' : ''}</td>
                <td><strong>$${(p.monto_total || 0).toLocaleString('es-AR')}</strong></td>
                <td><span class="estado ${claseEstado}">${textoEstado}</span></td>
                <td>
                    <button class="btn-ver" title="Ver detalle" onclick="verDetalle(${p.id})">
                        <i class="fa-solid fa-eye"></i>
                    </button>
                    <button class="btn-editar-estado" title="Cambiar estado" onclick="cambiarEstado(${p.id}, '${estadoActual}')">
                        <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Tarjetas de resumen
function actualizarResumen() {
    const hoy = new Date().toISOString().split('T')[0];
    
    document.getElementById('cantPendientes').textContent = 
        todosLosPedidos.filter(p => ['recibido', 'pendiente'].includes((p.estado || 'recibido').toLowerCase())).length;
    
    document.getElementById('cantConfirmados').textContent = 
        todosLosPedidos.filter(p => ['confirmado', 'pagado'].includes((p.estado || '').toLowerCase())).length;
    
    document.getElementById('cantEntregados').textContent = 
        todosLosPedidos.filter(p => p.estado === 'entregado').length;
    
    const totalDia = todosLosPedidos
        .filter(p => p.fecha && p.fecha.startsWith(hoy) && p.estado !== 'cancelado')
        .reduce((sum, p) => sum + (p.monto_total || 0), 0);
    document.getElementById('totalDia').textContent = `$${totalDia.toLocaleString('es-AR')}`;
}

// Ver detalle del pedido
async function verDetalle(id) {
    const pedido = todosLosPedidos.find(p => p.id === id);
    if (!pedido) return;
    
    document.getElementById('nroPedidoModal').textContent = String(id).padStart(5, '0');
    
    // Cargar detalle de productos
    let detalleHTML = `
        <div class="info-cliente">
            <p><strong>Cliente:</strong> ${pedido.nombre_cliente || 'Sin nombre'}</p>
            <p><strong>Teléfono:</strong> ${pedido.telefono || '—'}</p>
            <p><strong>Dirección:</strong> ${pedido.direccion || '—'}</p>
            <p><strong>Observaciones:</strong> ${pedido.observaciones || 'Ninguna'}</p>
            <p><strong>Método de pago:</strong> ${pedido.metodo_pago || 'No especificado'}</p>
            <p><strong>Fecha:</strong> ${pedido.fecha ? new Date(pedido.fecha).toLocaleString('es-AR') : '—'}</p>
        </div>
        <hr style="margin: 1rem 0; border:none; border-top:1px solid #eee;">
        <p><strong>Total:</strong> <span style="font-size:1.2rem; color:#2D3033;">$${(pedido.monto_total || 0).toLocaleString('es-AR')}</span></p>
        <p style="margin-top:1rem;"><strong>Cambiar estado:</strong></p>
        <select id="nuevoEstado" style="padding:0.5rem; border-radius:6px; border:1px solid #ddd; width:100%;">
            <option value="recibido" ${pedido.estado === 'recibido' ? 'selected' : ''}>Pendiente / Recibido</option>
            <option value="confirmado" ${pedido.estado === 'confirmado' ? 'selected' : ''}>Confirmado</option>
            <option value="enviado" ${pedido.estado === 'enviado' ? 'selected' : ''}>Enviado</option>
            <option value="entregado" ${pedido.estado === 'entregado' ? 'selected' : ''}>Entregado</option>
            <option value="cancelado" ${pedido.estado === 'cancelado' ? 'selected' : ''}>Cancelado</option>
        </select>
        <button class="btn-primario" style="margin-top:1rem; width:100%;" onclick="guardarEstado(${id})">
            <i class="fa-solid fa-check"></i> Guardar Estado
        </button>
    `;
    
    document.getElementById('detallePedidoModal').innerHTML = detalleHTML;
    document.getElementById('modalDetalle').style.display = 'flex';
}

// Cambiar estado
async function guardarEstado(idPedido) {
    const nuevoEstado = document.getElementById('nuevoEstado').value;
    
    try {
        const respuesta = await fetch(`${API_URL}/admin/pedidos/${idPedido}/estado`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado: nuevoEstado })
        });
        
        if (!respuesta.ok) throw new Error('Error al actualizar');
        
        cerrarModal();
        await cargarPedidos(); // Recargar todo
        alert('✅ Estado actualizado');
        
    } catch (error) {
        alert('❌ No se pudo actualizar: ' + error.message);
    }
}

function cambiarEstado(id, estadoActual) {
    verDetalle(id);
}

function cerrarModal() {
    document.getElementById('modalDetalle').style.display = 'none';
}

// Cerrar modal al hacer clic fuera
window.onclick = function(e) {
    const modal = document.getElementById('modalDetalle');
    if (e.target === modal) cerrarModal();
};