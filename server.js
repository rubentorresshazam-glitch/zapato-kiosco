const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { MercadoPagoConfig, Preference } = require('mercadopago');

const app = express();

// ==============================================
// ⚙️ CONFIGURACIÓN
// ==============================================
const PUERTO = process.env.PORT || 3000;
const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN || 'PONÉ_TU_TOKEN_AQUI';
const DOMINIO = process.env.DOMINIO || 'http://localhost:3000';
const client = new MercadoPagoConfig({ accessToken: MP_ACCESS_TOKEN });

// ==============================================
// 📂 BASE DE DATOS
// ==============================================
const carpetaBD = path.join(__dirname, 'base_datos');
if (!fs.existsSync(carpetaBD)) fs.mkdirSync(carpetaBD, { recursive: true });
const dbPath = path.join(carpetaBD, 'zapato_kiosco.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error('❌ Error BD:', err.message);
  else crearTablas();
});

function crearTablas() {
  db.run(`
    CREATE TABLE IF NOT EXISTS productos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      descripcion TEXT,
      descripcion_corta TEXT,
      descripcion_larga TEXT,
      categoria TEXT NOT NULL DEFAULT 'General',
      precio REAL NOT NULL CHECK(precio > 0),
      precio_oferta REAL,
      en_oferta INTEGER DEFAULT 0,
      stock INTEGER NOT NULL DEFAULT 0 CHECK(stock >= 0),
      unidad TEXT DEFAULT 'unidad',
      caracteristicas TEXT,
      imagen_url TEXT,
      imagenes TEXT DEFAULT '[]',
      activo INTEGER DEFAULT 1,
      creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS pedidos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre_cliente TEXT NOT NULL,
      telefono TEXT NOT NULL,
      direccion TEXT NOT NULL,
      observaciones TEXT,
      monto_total REAL NOT NULL,
      metodo_pago TEXT NOT NULL,
      estado TEXT DEFAULT 'recibido',
      fecha DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS detalle_pedido (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pedido_id INTEGER,
      producto_id INTEGER,
      nombre_producto TEXT NOT NULL,
      cantidad INTEGER NOT NULL,
      precio_unitario REAL NOT NULL,
      subtotal REAL NOT NULL
    )
  `);

  console.log('✅ Tablas listas');
}

// ==============================================
// ⚙️ MIDDLEWARE
// ==============================================
app.use(express.json({ limit: '10mb' }));
app.use(express.static(__dirname));

// ==============================================
// 🖼️ SUBIDA DE IMÁGENES
// ==============================================
const carpetaImagenes = path.join(__dirname, 'assets', 'productos');
if (!fs.existsSync(carpetaImagenes)) fs.mkdirSync(carpetaImagenes, { recursive: true });

const almacenamiento = multer.diskStorage({
  destination: (req, file, cb) => cb(null, carpetaImagenes),
  filename: (req, file, cb) => {
    const nombreLimpio = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
    cb(null, nombreLimpio);
  }
});

const subirImagen = multer({
  storage: almacenamiento,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const permitido = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (permitido.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Solo se aceptan imágenes (.jpg, .png, .webp)'));
  }
});

app.use('/productos-img', express.static(carpetaImagenes));

app.post('/api/subir-imagen', subirImagen.single('imagen'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se recibió imagen' });
  res.json({ url: '/productos-img/' + req.file.filename, nombre: req.file.filename });
});

// ==============================================
// 📦 PRODUCTOS
// ==============================================
app.get('/api/productos', (req, res) => {
  let sql = 'SELECT * FROM productos WHERE activo = 1';
  const params = [];
  if (req.query.categoria) { sql += ' AND categoria = ?'; params.push(req.query.categoria); }
  if (req.query.en_oferta === 'true') sql += ' AND en_oferta = 1';
  sql += ' ORDER BY categoria, nombre';

  db.all(sql, params, (err, filas) => {
    if (err) return res.status(500).json({ error: err.message });
    const productos = filas.map(p => ({
      ...p,
      descripcion_larga: p.descripcion_larga || p.descripcion || '',
      caracteristicas: p.caracteristicas ? JSON.parse(p.caracteristicas) : [],
      imagenes: p.imagenes ? JSON.parse(p.imagenes) : []
    }));
    res.json(productos);
  });
});

app.get('/api/productos/:id', (req, res) => {
  db.get('SELECT * FROM productos WHERE id = ?', [req.params.id], (err, fila) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!fila) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json({
      ...fila,
      descripcion_larga: fila.descripcion_larga || fila.descripcion || '',
      caracteristicas: fila.caracteristicas ? JSON.parse(fila.caracteristicas) : [],
      imagenes: fila.imagenes ? JSON.parse(fila.imagenes) : []
    });
  });
});

app.post(['/api/productos', '/api/admin/productos'], (req, res) => {
  const { nombre, descripcion, descripcion_corta, descripcion_larga, categoria, precio, precio_oferta, en_oferta, stock, unidad, caracteristicas, imagen_url, imagenes } = req.body;
  if (!nombre || !precio) return res.status(400).json({ error: 'Nombre y precio son obligatorios' });

  const caracteristicasJSON = caracteristicas ? JSON.stringify(caracteristicas) : null;
  const imagenesJSON = imagenes ? JSON.stringify(imagenes) : '[]';
  const esOferta = precio_oferta && precio_oferta > 0 ? 1 : (en_oferta ? 1 : 0);
  const imagenPrincipal = imagen_url || (imagenes && imagenes.length > 0 ? imagenes[0] : null);

  db.run(`
    INSERT INTO productos 
    (nombre, descripcion, descripcion_corta, descripcion_larga, categoria, precio, precio_oferta, en_oferta, stock, unidad, caracteristicas, imagen_url, imagenes, activo)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `, [nombre, descripcion || '', descripcion_corta || '', descripcion_larga || '', categoria || 'General', precio, precio_oferta || null, esOferta, stock || 0, unidad || 'unidad', caracteristicasJSON, imagenPrincipal, imagenesJSON], function(err) {
    if (err) return res.status(400).json({ error: err.message });
    res.status(201).json({ mensaje: '✅ Producto guardado', id: this.lastID });
  });
});

app.put('/api/productos/:id', (req, res) => {
  const { nombre, descripcion, descripcion_corta, descripcion_larga, categoria, precio, precio_oferta, en_oferta, stock, unidad, caracteristicas, imagen_url, imagenes, activo } = req.body;
  const caracteristicasJSON = caracteristicas ? JSON.stringify(caracteristicas) : null;
  const imagenesJSON = imagenes ? JSON.stringify(imagenes) : '[]';
  const esOferta = precio_oferta && precio_oferta > 0 ? 1 : (en_oferta ? 1 : 0);
  const imagenPrincipal = imagen_url || (imagenes && imagenes.length > 0 ? imagenes[0] : null);

  db.run(`
    UPDATE productos SET
      nombre = ?, descripcion = ?, descripcion_corta = ?, descripcion_larga = ?,
      categoria = ?, precio = ?, precio_oferta = ?, en_oferta = ?, stock = ?, unidad = ?,
      caracteristicas = ?, imagen_url = ?, imagenes = ?, activo = ?
    WHERE id = ?
  `, [nombre, descripcion || '', descripcion_corta || '', descripcion_larga || '', categoria || 'General', precio, precio_oferta || null, esOferta, stock || 0, unidad || 'unidad', caracteristicasJSON, imagenPrincipal, imagenesJSON, activo ?? 1, req.params.id], function(err) {
    if (err) return res.status(400).json({ error: err.message });
    res.json({ mensaje: '✅ Producto actualizado' });
  });
});

app.delete('/api/productos/:id', (req, res) => {
  db.run('UPDATE productos SET activo = 0 WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(400).json({ error: err.message });
    res.json({ mensaje: '✅ Producto eliminado' });
  });
});

// ==============================================
// 💳 MERCADO PAGO — REDIRIGE A TU CONFIRMACIÓN
// ==============================================
app.post('/api/crear-pago', async (req, res) => {
  try {
    const { items, nombre, telefono, direccion } = req.body;
    const preference = new Preference(client);

    const resultado = await preference.create({
      body: {
        items: items.map(i => ({
          title: i.nombre,
          quantity: i.cantidad,
          unit_price: i.precio,
          currency_id: 'ARS'
        })),
        payer: {
          name: nombre,
          phone: { number: telefono },
          address: { street_name: direccion }
        },
        back_urls: {
          success: `${DOMINIO}/mi-cuenta/confirmacion.html`,
          failure: `${DOMINIO}/mi-cuenta/checkout.html`
        },
        auto_return: 'approved'
      }
    });

    res.json({ url_pago: resultado.init_point, id_preferencia: resultado.id });
  } catch (err) {
    console.error('❌ Error Mercado Pago:', err);
    res.status(500).json({ error: err.message });
  }
});

// ==============================================
// 🛒 PEDIDOS
// ==============================================
app.post('/api/pedidos', (req, res) => {
  const { cliente, direccion, telefono, observaciones, items, metodo_pago, monto_total } = req.body;
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    db.run(`
      INSERT INTO pedidos (nombre_cliente, direccion, telefono, observaciones, monto_total, metodo_pago)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [cliente, direccion, telefono, observaciones || '', monto_total, metodo_pago], function(err) {
      if (err) { db.run('ROLLBACK'); return res.status(500).json({ error: err.message }); }
      const pedidoId = this.lastID;
      let completados = 0;
      const totalItems = items.length;
      
      if (totalItems === 0) {
        db.run('COMMIT');
        return res.status(201).json({ mensaje: '✅ Pedido registrado', pedido_id: pedidoId });
      }
      
      items.forEach(item => {
        db.run(`
          INSERT INTO detalle_pedido (pedido_id, producto_id, nombre_producto, cantidad, precio_unitario, subtotal)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [pedidoId, item.id, item.nombre, item.cantidad, item.precio, item.cantidad * item.precio], () => {
          completados++;
          if (completados === totalItems) {
            db.run('COMMIT');
            res.status(201).json({ mensaje: '✅ Pedido registrado', pedido_id: pedidoId });
          }
        });
      });
    });
  });
});

app.get('/api/admin/pedidos', (req, res) => {
  db.all('SELECT * FROM pedidos ORDER BY fecha DESC LIMIT 50', [], (err, filas) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(filas);
  });
});

app.patch('/api/admin/pedidos/:id/estado', (req, res) => {
  db.run('UPDATE pedidos SET estado = ? WHERE id = ?', [req.body.estado, req.params.id], function(err) {
    if (err) return res.status(400).json({ error: err.message });
    res.json({ mensaje: '✅ Estado actualizado' });
  });
});

// ==============================================
// 🚀 INICIAR
// ==============================================
app.listen(PUERTO, () => {
  console.log('\n=========================================');
  console.log('   🛒 ZAPATO KIOSCO — FLUJO COMPLETO ✅');
  console.log('=========================================');
  console.log(`📍 Puerto: ${PUERTO}`);
  console.log(`🗄️  Base de datos: Conectada`);
  console.log(`🔄 Flujo: Carrito → checkout → MP → confirmacion.html`);
  console.log('=========================================\n');
});