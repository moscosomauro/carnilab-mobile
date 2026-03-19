// Run with: node scripts/generate_vapid_keys.js
import webpush from 'web-push';

// VAPID keys should be generated only once.
const vapidKeys = webpush.generateVAPIDKeys();

console.log('=======================================');
console.log('          NUEVAS LLAVES VAPID         ');
console.log('=======================================');
console.log('');
console.log('Llave Pública (Public Key):');
console.log(vapidKeys.publicKey);
console.log('');
console.log('Llave Privada (Private Key):');
console.log(vapidKeys.privateKey);
console.log('');
console.log('=======================================');
console.log('INSTRUCCIONES:');
console.log('1. Copia la "Llave Pública" y pégala en -> src/components/usePushNotifications.ts (variable PUBLIC_VAPID_KEY)');
console.log('2. Copia la "Llave Privada" y guárdala en las Variables de Entorno de tu Supabase (Edge Functions)');
