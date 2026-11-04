// ==========================================
// 📦 GESTIÓN DE PRODUCTOS — Móvil + Compu + App
// Sube imágenes, edita, elimina y funciona en todos lados
// ==========================================

const API_URL = '/api';

document.addEventListener('DOMContentLoaded', async () => {
  console.log('📦 Cargando gestión de productos...');
  
  // Cargar lista
  await cargarListaProductos();
  
  // Conectar formulario
  const form = document.getElementById('formProducto');
  if (form) {
    form.addEventListener('submit', guardarProducto);
  }
  
  // Previsualización de imágenes al seleccionar
  const inputImagenes = document.getElementById('imagenes');
  if (inputImagenes) {
    inputImagenes.addEventListener('change', previsualizarImagenes);
  }
});

// ==========================================
// 📋 CARGAR LISTA DE PRODUCTOS
// ==========================================
async function cargarListaProductos() {
  const lista = document.getElementById('listaProductos');
  
  // ✅ Verificar que el contenedor exista
  if (!lista) {
    console.error('❌ No se encontró el contenedor #listaProductos en el HTML');
    return;
  }

  try {
    const respuesta = await fetch(`${API_URL}/productos`);
    if (!respuesta.ok) throw new Error('No se pudieron cargar los productos');
    
    const productos = await respuesta.json();
    
    if (!productos || productos.length === 0) {
      lista.innerHTML = `
        <tr>
          <td colspan="8" style="text-align:center; padding:2.5rem; color:#888;">
            <i class="fa-solid fa-box-open" style="font-size:2rem; color:#ddd; margin-bottom:1rem;"></i>
            <p>Todavía no hay productos cargados</p>
            <p style="font-size:0.9rem;">Completá el formulario de abajo para agregar el primero</p>
          </td>
        </tr>
      `;
      return;
    }
    
    // Renderizar tabla
    lista.innerHTML = productos.map(p => {
      let tieneImagenes = false;
      let primeraImagen = '';
      
      try {
        if (p.imagenes && p.imagenes !== '[]' && p.imagenes !== '') {
          const arr = JSON.parse(p.imagenes);
          if (Array.isArray(arr) && arr.length > 0) {
            tieneImagenes = true;
            primeraImagen = arr[0];
          }
        }
      } catch (e) {
        tieneImagenes = false;
      }
      
      const precioOferta = p.precio_oferta && p.precio_oferta > 0 ? 
        `<span style="color:#28a745;">$${Number(p.precio_oferta).toLocaleString('es-AR')}</span>` : 
        '<span style="color:#999;">—</span>';
      
      return `
        <tr>
          <td><strong>#${String(p.id).padStart(4, '0')}</strong></td>
          <td>
            <div style="display:flex; align-items:center; gap:0.5rem;">
              ${tieneImagenes ? 
                `<img src="${primeraImagen}" alt="${p.nombre}" style="width:40px; height:40px; object-fit:cover; border-radius:4px;" onerror="this.style.display='none'">` : 
                '<div style="width:40px; height:40px; background:#eee; border-radius:4px; display:flex; align-items:center; justify-content:center; color:#aaa;"><i class="fa-solid fa-image"></i></div>'
              }
              <span>${p.nombre}</span>
            </div>
          </td>
          <td>${p.categoria || 'Sin categoría'}</td>
          <td>$${Number(p.precio).toLocaleString('es-AR')}</td>
          <td>${precioOferta}</td>
          <td>${p.en_oferta == 1 ? '<span style="color:#ff9900; font-weight:bold;">🔥 En oferta</span>' : '—'}</td>
          <td>${p.activo == 1 ? 
            '<span style="color:green; font-weight:bold;"><i class="fa-solid fa-check-circle"></i> Activo</span>' : 
            '<span style="color:#999;">Inactivo</span>'
          }</td>
          <td style="white-space:nowrap;">
            <button class="btn-ver" title="Editar" onclick="editarProducto(${p.id})" style="padding:0.4rem 0.6rem; margin:0 0.1rem; border:none; background:#ffcc00; border-radius:4px; cursor:pointer;">
              <i class="fa-solid fa-pen"></i>
            </button>
            <button class="btn-eliminar" title="Eliminar" onclick="eliminarProducto(${p.id})" style="padding:0.4rem 0.6rem; margin:0 0.1rem; border:none; background:#d32f2f; color:white; border-radius:4px; cursor:pointer;">
              <i class="fa-solid fa-trash"></i>
            </button>
          </td>
        </tr>
      `;
    }).join('');
    
  } catch (error) {
    console.error('❌ Error cargando productos:', error);
    lista.innerHTML = `
      <tr>
        <td colspan="8" style="text-align:center; padding:2rem; color:#d63030;">
          <i class="fa-solid fa-triangle-exclamation" style="font-size:1.5rem;"></i>
          <p>No se pudieron cargar los productos</p>
          <p style="font-size:0.9rem;">Verificá que el servidor esté encendido</p>
        </td>
      </tr>
    `;
  }
}

// ==========================================
// 💾 GUARDAR PRODUCTO (NUEVO O EDITAR)
// ==========================================
async function guardarProducto(e) {
  e.preventDefault();
  
  const id = document.getElementById('productoId').value;
  const inputImagenes = document.getElementById('imagenes');
  let imagenesGuardadas = [];
  
  // Si hay imágenes ya guardadas (edición), las mantenemos
  const imagenesExistentes = document.getElementById('imagenes_guardadas')?.value;
  if (imagenesExistentes) {
    try {
      imagenesGuardadas = JSON.parse(imagenesExistentes);
      if (!Array.isArray(imagenesGuardadas)) imagenesGuardadas = [];
    } catch {
      imagenesGuardadas = [];
    }
  }
  
  // Subir nuevas imágenes si las hay
  if (inputImagenes && inputImagenes.files.length > 0) {
    for (let i = 0; i < inputImagenes.files.length; i++) {
      const archivo = inputImagenes.files[i];
      const formData = new FormData();
      formData.append('imagen', archivo);
      
      try {
        const respuesta = await fetch(`${API_URL}/subir-imagen`, {
          method: 'POST',
          body: formData
        });
        
        if (respuesta.ok) {
          const datos = await respuesta.json();
          if (datos.url) imagenesGuardadas.push(datos.url);
        }
      } catch (err) {
        console.warn('No se pudo subir imagen:', err);
      }
    }
  }
  
  // Armar datos del producto
  const datos = {
    nombre: document.getElementById('nombre').value.trim(),
    categoria: document.getElementById('categoria').value.trim(),
    precio: parseFloat(document.getElementById('precio').value),
    precio_oferta: parseFloat(document.getElementById('precio_oferta').value) || 0,
    en_oferta: document.getElementById('en_oferta').checked ? 1 : 0,
    descripcion_corta: document.getElementById('descripcion_corta')?.value?.trim() || '',
    descripcion_larga: document.getElementById('descripcion_larga')?.value?.trim() || '',
    stock: parseInt(document.getElementById('stock').value) || 0,
    activo: document.getElementById('activo').checked ? 1 : 0,
    imagenes: JSON.stringify(imagenesGuardadas)
  };
  
  // Validación básica
  if (!datos.nombre) {
    alert('⚠️ Escribí el nombre del producto');
    return;
  }
  if (!datos.precio || datos.precio <= 0) {
    alert('⚠️ El precio debe ser mayor a 0');
    return;
  }
  
  try {
    const url = id ? `${API_URL}/productos/${id}` : `${API_URL}/productos`;
    const metodo = id ? 'PUT' : 'POST';
    
    const respuesta = await fetch(url, {
      method: metodo,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });
    
    if (!respuesta.ok) {
      const error = await respuesta.json();
      throw new Error(error.error || 'Error al guardar');
    }
    
    alert(id ? '✅ Producto actualizado' : '✅ Producto cargado correctamente');
    
    // Limpiar formulario
    e.target.reset();
    document.getElementById('productoId').value = '';
    const contenedor = document.getElementById('previsualizacion-imagenes');
    if (contenedor) contenedor.innerHTML = '';
    const campoGuardadas = document.getElementById('imagenes_guardadas');
    if (campoGuardadas) campoGuardadas.value = '';
    
    // Volver a cargar la lista
    await cargarListaProductos();
    
  } catch (error) {
    alert('❌ ' + error.message);
  }
}

// ==========================================
// ✏️ EDITAR PRODUCTO
// ==========================================
async function editarProducto(id) {
  try {
    const respuesta = await fetch(`${API_URL}/productos`);
    const productos = await respuesta.json();
    const producto = productos.find(p => p.id === id);
    
    if (!producto) {
      alert('Producto no encontrado');
      return;
    }
    
    // Llenar formulario
    document.getElementById('productoId').value = producto.id;
    document.getElementById('nombre').value = producto.nombre || '';
    document.getElementById('categoria').value = producto.categoria || '';
    document.getElementById('precio').value = producto.precio || '';
    document.getElementById('precio_oferta').value = producto.precio_oferta || '';
    document.getElementById('en_oferta').checked = producto.en_oferta == 1;
    document.getElementById('descripcion_corta').value = producto.descripcion_corta || '';
    document.getElementById('descripcion_larga').value = producto.descripcion_larga || '';
    document.getElementById('stock').value = producto.stock || 0;
    document.getElementById('activo').checked = producto.activo == 1;
    
    // Cargar imágenes existentes
    let imagenes = [];
    try {
      if (producto.imagenes && producto.imagenes !== '[]' && producto.imagenes !== '') {
        const parsed = JSON.parse(producto.imagenes);
        if (Array.isArray(parsed)) imagenes = parsed;
      }
    } catch {}
    
    // Campo oculto para mantener imágenes
    let campoImagenes = document.getElementById('imagenes_guardadas');
    if (!campoImagenes) {
      campoImagenes = document.createElement('input');
      campoImagenes.type = 'hidden';
      campoImagenes.id = 'imagenes_guardadas';
      campoImagenes.name = 'imagenes_guardadas';
      document.getElementById('formProducto').appendChild(campoImagenes);
    }
    campoImagenes.value = JSON.stringify(imagenes);
    
    // Mostrar previsualización
    const contenedor = document.getElementById('previsualizacion-imagenes');
    if (contenedor) {
      if (imagenes.length > 0) {
        contenedor.innerHTML = '<p style="font-weight:bold; margin-bottom:0.5rem;">Imágenes cargadas:</p>' +
          imagenes.map(url => `
            <div style="display:inline-block; margin:0.3rem; position:relative;">
              <img src="${url}" style="width:80px; height:80px; object-fit:cover; border-radius:4px; border:2px solid #ddd;" onerror="this.parentElement.style.display='none'">
            </div>
          `).join('');
      } else {
        contenedor.innerHTML = '';
      }
    }
    
    // Subir al formulario
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
  } catch (error) {
    alert('❌ No se pudo cargar el producto: ' + error.message);
  }
}

// ==========================================
// 🗑️ ELIMINAR PRODUCTO
// ==========================================
async function eliminarProducto(id) {
  if (!confirm('¿Eliminar este producto?\nEsta acción no se puede deshacer.')) return;
  
  try {
    const respuesta = await fetch(`${API_URL}/productos/${id}`, {
      method: 'DELETE'
    });
    
    if (!respuesta.ok) throw new Error('No se pudo eliminar');
    
    alert('✅ Producto eliminado');
    await cargarListaProductos();
    
  } catch (error) {
    alert('❌ ' + error.message);
  }
}

// ==========================================
// 🖼️ PREVISUALIZAR IMÁGENES SELECCIONADAS
// ==========================================
function previsualizarImagenes() {
  const input = document.getElementById('imagenes');
  const contenedor = document.getElementById('previsualizacion-imagenes');
  if (!contenedor || !input) return;
  
  contenedor.innerHTML = '';
  
  if (input.files.length === 0) return;
  
  contenedor.innerHTML = '<p style="font-weight:bold; margin-bottom:0.5rem;">Nuevas imágenes:</p>';
  
  for (let i = 0; i < input.files.length; i++) {
    const archivo = input.files[i];
    if (!archivo.type.startsWith('image/')) continue;
    
    const lector = new FileReader();
    lector.onload = function(e) {
      contenedor.innerHTML += `
        <div style="display:inline-block; margin:0.3rem;">
          <img src="${e.target.result}" style="width:80px; height:80px; object-fit:cover; border-radius:4px; border:2px solid #28a745;">
        </div>
      `;
    };
    lector.readAsDataURL(archivo);
  }
}
