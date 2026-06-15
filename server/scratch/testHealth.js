const prisma = require('../dist/config/database').default;
const { getWhatsAppConfig, verifyConnection } = require('../dist/services/whatsapp/whatsapp.service');
const { getQueueStatus } = require('../dist/services/whatsapp/queue.service');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function main() {
  console.log('Testing health check steps manually:');
  
  console.log('1. getWhatsAppConfig()...');
  const config = await getWhatsAppConfig();
  console.log('Config loaded successfully:', JSON.stringify(config, null, 2));

  console.log('2. prisma.$queryRaw...');
  const dbTest = await prisma.$queryRaw`SELECT 1`.catch(err => {
    console.error('dbTest failed:', err);
    return null;
  });
  console.log('Database test result:', dbTest);

  console.log('3. verifyConnection()...');
  const metaTest = await verifyConnection();
  console.log('Meta test result:', metaTest);

  console.log('4. getQueueStatus()...');
  const queue = getQueueStatus();
  console.log('Queue status:', queue);
}

main()
  .catch(e => {
    console.error('Fatal crash:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
