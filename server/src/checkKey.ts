import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const key = process.env.GOOGLE_PRIVATE_KEY || '';

try {
  console.log('🔄 Attempting to parse private key via crypto.createPrivateKey()...');
  const privateKey = crypto.createPrivateKey(key);
  console.log('✅ Key parsed successfully!');
  console.log('Key Details:');
  console.log('Type:', privateKey.type);
  console.log('Asymmetric Key Type:', privateKey.asymmetricKeyType);
} catch (err: any) {
  console.error('❌ Failed to parse private key:', err.message);
}

try {
  const cleanedKey = key.replace(/\\n/g, '\n');
  console.log('\n🔄 Attempting to parse cleaned key via crypto.createPrivateKey()...');
  const privateKey = crypto.createPrivateKey(cleanedKey);
  console.log('✅ Cleaned key parsed successfully!');
  console.log('Key Details:');
  console.log('Type:', privateKey.type);
  console.log('Asymmetric Key Type:', privateKey.asymmetricKeyType);
} catch (err: any) {
  console.error('❌ Failed to parse cleaned key:', err.message);
}
