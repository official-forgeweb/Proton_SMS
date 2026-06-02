"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = __importDefault(require("crypto"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.join(__dirname, '..', '.env') });
const key = process.env.GOOGLE_PRIVATE_KEY || '';
try {
    console.log('🔄 Attempting to parse private key via crypto.createPrivateKey()...');
    const privateKey = crypto_1.default.createPrivateKey(key);
    console.log('✅ Key parsed successfully!');
    console.log('Key Details:');
    console.log('Type:', privateKey.type);
    console.log('Asymmetric Key Type:', privateKey.asymmetricKeyType);
}
catch (err) {
    console.error('❌ Failed to parse private key:', err.message);
}
try {
    const cleanedKey = key.replace(/\\n/g, '\n');
    console.log('\n🔄 Attempting to parse cleaned key via crypto.createPrivateKey()...');
    const privateKey = crypto_1.default.createPrivateKey(cleanedKey);
    console.log('✅ Cleaned key parsed successfully!');
    console.log('Key Details:');
    console.log('Type:', privateKey.type);
    console.log('Asymmetric Key Type:', privateKey.asymmetricKeyType);
}
catch (err) {
    console.error('❌ Failed to parse cleaned key:', err.message);
}
//# sourceMappingURL=checkKey.js.map