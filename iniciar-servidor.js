// ==============================================
// 🚀 ZAPATO KIOSCO — MANTENER TODO ENCENDIDO
// Reinicia automáticamente si se corta
// ==============================================

const { spawn } = require('child_process');
const path = require('path');

console.log('\n');
console.log('=========================================');
console.log('   🛒 ZAPATO KIOSCO — SUPERVISOR ACTIVO');
console.log('=========================================\n');

let servidor = null;
let reinicios = 0;
const MAX_REINICIOS = 10;
const TIEMPO_ESPERA = 2000; // 2 segundos

function arrancarServidor() {
  if (reinicios >= MAX_REINICIOS) {
    console.error('❌ Se alcanzó el límite de reinicios. Revisá el servidor.');
    process.exit(1);
  }

  reinicios++;
  
  console.log(`🔄 Encendiendo servidor (intento ${reinicios}/${MAX_REINICIOS})...`);
  
  servidor = spawn('node', ['server.js'], {
    cwd: __dirname,
    stdio: 'inherit',
    shell: false
  });

  servidor.on('exit', (codigo, señal) => {
    console.log(`\n⚠️  Servidor se cerró — Código: ${codigo}, Señal: ${señal}`);
    console.log(`⏳ Volviendo a encender en ${TIEMPO_ESPERA/1000}s...\n`);
    
    setTimeout(arrancarServidor, TIEMPO_ESPERA);
  });

  servidor.on('error', (err) => {
    console.error('❌ Error al arrancar:', err.message);
  });
}

// Manejar cierre manual
process.on('SIGINT', () => {
  console.log('\n🛑 Apagando Zapato Kiosco...');
  if (servidor) servidor.kill();
  process.exit(0);
});

// Iniciar
arrancarServidor();