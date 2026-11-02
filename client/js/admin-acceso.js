document.addEventListener('DOMContentLoaded', async () => {
  const API = `${window.location.origin}/api`;

  // Elementos
  const iconoCandado = document.getElementById('icono-ingreso');
  const botonPanel = document.getElementById('boton-panel-admin');
  const modal = document.getElementById('modal-contraseña');
  const inputClave = document.getElementById('input-clave');
  const btnEntrar = document.getElementById('btn-entrar-clave');
  const btnCancelar = document.getElementById('btn-cancelar-clave');
  const btnSalir = document.getElementById('btn-salir-admin');

  // Verificar si ya está logueado
  const res = await fetch(`${API}/admin/estado`);
  const { esAdmin } = await res.json();

  // Mostrar lo que corresponde
  if (esAdmin) {
    if (botonPanel) botonPanel.style.display = 'flex';
  } else {
    if (iconoCandado) iconoCandado.style.display = 'block';
  }

  // Abrir formulario
  if (iconoCandado && modal) {
    iconoCandado.onclick = () => {
      modal.style.display = 'flex';
      inputClave.focus();
    };
  }

  // Ingresar con contraseña
  if (btnEntrar && inputClave) {
    btnEntrar.onclick = async () => {
      const clave = inputClave.value.trim();
      if (!clave) return;

      const respuesta = await fetch(`${API}/admin/verificar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: clave })
      });

      const datos = await respuesta.json();
      
      if (datos.ok) {
        modal.style.display = 'none';
        window.location.reload();
      } else {
        alert('❌ Contraseña incorrecta');
      }
    };

    inputClave.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') btnEntrar.click();
    });
  }

  // Cancelar
  if (btnCancelar && modal) {
    btnCancelar.onclick = () => {
      modal.style.display = 'none';
      inputClave.value = '';
    };
  }

  // Cerrar sesión
  if (btnSalir) {
    btnSalir.onclick = async () => {
      if (confirm('¿Cerrar sesión? La próxima vez pedirá la contraseña.')) {
        await fetch(`${API}/admin/salir`, { method: 'POST' });
        window.location.reload();
      }
    };
  }
});