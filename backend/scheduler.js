const cron = require('node-cron');
const { checkExpiredOrders } = require('./jobs/expiredOrderChecker');

// Jalankan setiap 1 jam (0 menit setiap jam)
cron.schedule('0 * * * *', async () => {
  console.log(`[${new Date().toISOString()}] 🔄 Running expired order checker...`);
  try {
    await checkExpiredOrders();
    console.log(`[${new Date().toISOString()}] ✅ Expired order check completed`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ❌ Error:`, error.message);
  }
});

console.log('⏰ Scheduler started - checking expired orders every hour');
console.log('   - Orders older than 24 hours will be auto-refunded');

// Untuk testing manual (opsional)
if (process.argv.includes('--run-now')) {
  console.log('🔄 Running manual check...');
  checkExpiredOrders().then(() => {
    console.log('✅ Manual check completed');
    process.exit(0);
  }).catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
}