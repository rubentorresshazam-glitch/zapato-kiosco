// ======================================
// ADMIN.JS - KIOSCO ZAPATO
// ✅ Efecto de escritura + DATOS REALES de la BD
// ======================================

const API_URL = '/api';

document.addEventListener('DOMContentLoaded', async () => {
    // --------------------------
    // 🤖 EFECTO DE ESCRITURA AUTOMÁTICA (ESTILO IA)
    // --------------------------
    const saludoElement = document.querySelector('.saludo-destacado');
    const subtituloElement = document.querySelector('.subtitulo-bienvenida');

    const textoSaludo = "¡HOLA! 👋";
    const textoSubtitulo = "Todo listo para gestionar tu E-commerce";

    const velocidadLetra = 80;
    const velocidadPausa = 1200;

    async function escribirTexto(elemento, texto, velocidad) {
        if (!elemento) return;
        elemento.innerHTML = '';
        
        const cursor = document.createElement('span');
        cursor.className = 'cursor-escribiendo';
        cursor.textContent = '|';
        elemento.appendChild(cursor);

        for (let i = 0; i < texto.length; i++) {
            elemento.removeChild(cursor);
            elemento.innerHTML += texto.charAt(i);
            elemento.appendChild(cursor);
            await new Promise(resolve => setTimeout(resolve, velocidad));
        }

        setTimeout(() => {
            cursor.style.opacity = '0';
            cursor.style.transition = 'opacity 0.5s ease';
            setTimeout(() => cursor.remove(), 500);
        }, 2000);
    }

    async function iniciarSaludoIA() {
        await escribirTexto(saludoElement, textoSaludo, velocidadLetra);
        await new Promise(resolve => setTimeout(resolve, velocidadPausa));
        await escribirTexto(subtituloElement, textoSubtitulo, velocidadLetra - 20);
    }

    // --------------------------
    // ✨ ANIMACIONES DE ENTRADA
    // --------------------------
    function animarEntrada() {
        const tarjetas = document.querySelectorAll('.stat-card');
        const bloqueTabla = document.querySelector('.stat-card:last-child');

        tarjetas.forEach((tarjeta, indice) => {
            tarjeta.style.opacity = '0';
            tarjeta.style.transform = 'translateY(20px)';
            tarjeta.style.transition = `all 0.6s ease ${indice * 0.15}s`;
            setTimeout(() => {
                tarjeta.style.opacity = '1';
                tarjeta.style.transform = 'translateY(0)';
            }, 100);
        });

        if (bloqueTabla) {
            bloqueTabla.style.opacity = '0';
            bloqueTabla.style.transform = 'translateY(20px)';
            bloqueTabla.style.transition = 'all 0.6s ease 0.8s';
            setTimeout(() => {
                bloqueTabla.style.opacity = '1';
                bloqueTabla.style.transform = 'translateY(0)';
            }, 100);
        }
    }

    // --------------------------
    // 📊 CARGAR DATOS REALES DESDE LA BASE DE DATOS
    // --------------------------
    async function cargarEstadisticas() {
        try {
            // Productos activos
            const respProductos = await fetch(`${API_URL}/productos`);
            const productos = await respProductos.json();
            const elemProductos = document.getElementById('productos-activos');
            if (elemProductos) elemProductos.textContent = productos.length;

            // Pedidos
            const respPedidos = await fetch(`${API_URL}/admin/pedidos`);
            const pedidos = await respPedidos.json();
            
            const elemPedidosTotal = document.getElementById('pedidos-total');
            if (elemPedidosTotal) elemPedidosTotal.textContent = pedidos.length;

            const elemContador = document.getElementById('contador-pedidos');
            if (elemContador) elemContador.textContent = pedidos.length;

            // Pedidos pendientes
            const pendientes = pedidos.filter(p => 
                p.estado === 'recibido' || p.estado === 'pendiente'
            ).length;
            const elemPendientes = document.getElementById('pedidos-pendientes');
            if (elemPendientes) elemPendientes.textContent = pendientes;

            // Ventas del día
            const hoy = new Date().toISOString().split('T')[0];
            const ventasHoy = pedidos
                .filter(p => p.fecha && p.fecha.startsWith(hoy) && p.estado !== 'cancelado')
                .reduce((sum, p) => sum + (p.monto_total || 0), 0);
            
            const elemVentas = document.getElementById('ventas-dia');
            if (elemVentas) elemVentas.textContent = `$${ventasHoy.toLocaleString('es-AR')}`;

        } catch (error) {
            console.error('❌ Error al cargar estadísticas:', error);
        }
    }

    // --------------------------
    // 📋 CARGAR ÚLTIMOS PEDIDOS EN TABLA
    // --------------------------
    async function cargarPedidosRecientes() {
        const lista = document.getElementById('lista-ultimos-pedidos');
        if (!lista) return;

        try {
            const respuesta = await fetch(`${API_URL}/admin/pedidos`);
            if (!respuesta.ok) throw new Error('Error al cargar pedidos');
            
            const pedidos = await respuesta.json();

            if (pedidos.length === 0) {
                lista.innerHTML = `
                    <tr>
                        <td colspan="6" style="text-align:center; padding:2rem; color:#888;">
                            <i class="fa-solid fa-inbox" style="font-size:2rem; color:#ddd;"></i>
                            <p>Todavía no hay pedidos registrados</p>
                        </td>
                    </tr>
                `;
                return;
            }

            // Mostrar solo los últimos 5
            const ultimos = pedidos.slice(0, 5);
            
            lista.innerHTML = ultimos.map(p => {
                // Formatear fecha
                const fecha = p.fecha ? new Date(p.fecha) : new Date();
                const fechaStr = fecha.toLocaleDateString('es-AR') + ' - ' + 
                                 fecha.toLocaleTimeString('es-AR', {hour:'2-digit', minute:'2-digit'});
                
                // Clase de estado
                let claseEstado = 'pendiente';
                let textoEstado = p.estado || 'recibido';
                
                if (p.estado === 'pagado' || p.estado === 'entregado') {
                    claseEstado = 'pagado';
                } else if (p.estado === 'enviado') {
                    claseEstado = 'enviado';
                }

                return `
                    <tr>
                        <td>#${String(p.id).padStart(5, '0')}</td>
                        <td>${p.nombre_cliente}</td>
                        <td>${fechaStr}</td>
                        <td>$${(p.monto_total || 0).toLocaleString('es-AR')}</td>
                        <td><span class="estado ${claseEstado}">${textoEstado}</span></td>
                        <td><button class="btn-ver" data-id="${p.id}">Ver</button></td>
                    </tr>
                `;
            }).join('');

            // Conectar botones "Ver"
            document.querySelectorAll('.btn-ver').forEach(btn => {
                btn.onclick = () => {
                    window.location.href = `pedidos.html?id=${btn.dataset.id}`;
                };
            });

        } catch (error) {
            console.error('❌ Error al cargar pedidos:', error);
            lista.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align:center; padding:2rem; color:#d63030;">
                        <i class="fa-solid fa-triangle-exclamation"></i>
                        <p>No se pudieron cargar los pedidos</p>
                    </td>
                </tr>
            `;
        }
    }

    // --------------------------
    // ✨ EFECTOS INTERACTIVOS DEL MENÚ
    // --------------------------
    document.querySelectorAll('.menu-item').forEach(boton => {
        boton.addEventListener('mouseenter', () => {
            if (!boton.classList.contains('active')) boton.style.transform = 'translateX(6px)';
        });
        boton.addEventListener('mouseleave', () => boton.style.transform = 'translateX(0)');
    });

    // --------------------------
    // 🎉 INICIAR TODO
    // --------------------------
    iniciarSaludoIA();
    animarEntrada();
    
    // Cargar datos reales de la BD
    await Promise.all([
        cargarEstadisticas(),
        cargarPedidosRecientes()
    ]);
});