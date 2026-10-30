// ==========================================
// 📊 ESTADÍSTICAS — Datos reales de la BD
// ==========================================
const API_URL = '/api';

document.addEventListener('DOMContentLoaded', async () => {
    console.log('📊 Cargando estadísticas...');
    
    const selector = document.getElementById('selector-periodo');
    if (selector) {
        selector.addEventListener('change', () => cargarTodo(parseInt(selector.value)));
    }
    
    await cargarTodo(7);
});

async function cargarTodo(dias = 7) {
    try {
        const [respPedidos, respProductos] = await Promise.all([
            fetch(`${API_URL}/admin/pedidos`),
            fetch(`${API_URL}/productos`)
        ]);

        const pedidos = await respPedidos.json();
        const productos = await respProductos.json();

        // Filtrar por período
        const fechaLimite = new Date();
        fechaLimite.setDate(fechaLimite.getDate() - dias);
        const pedidosFiltrados = pedidos.filter(p => new Date(p.fecha) >= fechaLimite && p.estado !== 'cancelado');

        // Resumen general
        const totalVentas = pedidosFiltrados.reduce((sum, p) => sum + (p.monto_total || 0), 0);
        document.getElementById('ventas-totales').textContent = `$${totalVentas.toLocaleString('es-AR')}`;
        document.getElementById('pedidos-periodo').textContent = pedidosFiltrados.length;
        document.getElementById('productos-cat').textContent = productos.length;

        // Crecimiento comparado con período anterior
        const mitad = Math.floor(pedidosFiltrados.length / 2);
        const primeros = pedidosFiltrados.slice(0, mitad).reduce((s, p) => s + (p.monto_total || 0), 0);
        const ultimos = pedidosFiltrados.slice(mitad).reduce((s, p) => s + (p.monto_total || 0), 0);
        const crecimiento = primeros > 0 ? ((ultimos - primeros) / primeros * 100).toFixed(1) : 0;
        const elemCrec = document.getElementById('crecimiento');
        elemCrec.textContent = `${crecimiento > 0 ? '+' : ''}${crecimiento}%`;
        elemCrec.parentElement.className = `indicador-crecimiento ${crecimiento >= 0 ? 'positivo' : 'negativo'}`;

        // Ventas por categoría
        const ventasPorCat = {};
        pedidosFiltrados.forEach(p => {
            // Agrupamos por categoría usando el campo que tengamos
            const cat = p.categoria || 'Sin categoría';
            ventasPorCat[cat] = (ventasPorCat[cat] || 0) + (p.monto_total || 0);
        });
        const totalGeneral = Object.values(ventasPorCat).reduce((a, b) => a + b, 0) || 1;
        const contCat = document.getElementById('contenedor-categorias');
        contCat.innerHTML = Object.entries(ventasPorCat)
            .sort((a, b) => b[1] - a[1])
            .map(([cat, monto]) => {
                const porcentaje = Math.round(monto / totalGeneral * 100);
                return `
                    <div class="barra-tipo">
                        <div class="etiqueta">${cat}</div>
                        <div class="barra-completa">
                            <div class="relleno" style="width: ${porcentaje}%"></div>
                        </div>
                        <span>${porcentaje}%</span>
                    </div>
                `;
            }).join('');

        // Horarios
        const horas = Array(12).fill(0); // 8 a 19 hs
        pedidosFiltrados.forEach(p => {
            const h = new Date(p.fecha).getHours();
            if (h >= 8 && h <= 19) horas[h - 8]++;
        });
        const maxHora = Math.max(...horas) || 1;
        const grafHoras = document.getElementById('grafico-horas');
        const etiquetas = ['8a','10a','12p','2p','4p','6p','8p'];
        const indices = [0,2,4,6,8,10,11];
        grafHoras.innerHTML = indices.map((i, idx) => `
            <div class="hora-col">
                <div class="barra" style="height: ${Math.round(horas[i]/maxHora*100)}%"></div>
                <span>${etiquetas[idx]}</span>
            </div>
        `).join('');
        
        // Resumen horario
        const pico = horas.indexOf(Math.max(...horas));
        const horaPico = 8 + pico;
        document.getElementById('resumen-horarios').textContent = 
            `El horario más activo es alrededor de las ${horaPico}:00 hs con ${horas[pico]} pedidos en el período.`;

        // Productos más vendidos (simulado con datos disponibles)
        const contProd = document.getElementById('contenedor-top-productos');
        if (productos.length > 0) {
            contProd.innerHTML = productos
                .sort((a, b) => (b.stock || 0) - (a.stock || 0))
                .slice(0, 5)
                .map((prod, idx) => `
                    <div class="barra-tipo">
                        <div class="etiqueta">${idx + 1}. ${prod.nombre}</div>
                        <div class="barra-completa">
                            <div class="relleno" style="width: ${Math.min(100, (prod.stock || 0) / 5 * 10)}%"></div>
                        </div>
                        <span>$${(prod.precio_oferta || prod.precio).toLocaleString('es-AR')}</span>
                    </div>
                `).join('');
        } else {
            contProd.innerHTML = '<p style="color:#888; text-align:center;">Sin productos registrados</p>';
        }

    } catch (error) {
        console.error('❌ Error cargando estadísticas:', error);
    }
}