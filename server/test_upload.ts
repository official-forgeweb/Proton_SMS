import crypto from 'crypto';
import fs from 'fs';

const cloudName = 'dsk80td7v';
const apiKey = '681879111689688';
const apiSecret = '3i0uFI4lageoI2y-43BYc8P8p0g';

const testUpload = async () => {
    try {
        const timestamp = Math.round(new Date().getTime() / 1000);
        const folder = 'proton_study_materials';
        
        const stringToSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
        const signature = crypto.createHash('sha1').update(stringToSign).digest('hex');

        fs.writeFileSync('test.pdf', '%PDF-1.4\n1 0 obj <</Type/Catalog/Pages 2 0 R>> endobj\n2 0 obj <</Type/Pages/Kids [3 0 R]/Count 1>> endobj\n3 0 obj <</Type/Page/Parent 2 0 R/MediaBox [0 0 612 792]/Contents 4 0 R/Resources <<>> >> endobj\n4 0 obj <</Length 21>> stream\nBT /F1 12 Tf 0 0 Td (Hello World) Tj ET\nendstream endobj\nxref\n0 5\n0000000000 65535 f\n0000000009 00000 n\n0000000056 00000 n\n0000000111 00000 n\n0000000213 00000 n\ntrailer <</Size 5/Root 1 0 R>>\nstartxref\n285\n%%EOF');

        const formData = new FormData();
        const fileContent = fs.readFileSync('test.pdf');
        formData.append('file', new Blob([fileContent], { type: 'application/pdf' }), 'test.pdf');
        formData.append('api_key', apiKey);
        formData.append('timestamp', timestamp.toString());
        formData.append('signature', signature);
        formData.append('folder', folder);

        const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;
        
        console.log('Posting to', cloudinaryUrl);
        const res = await fetch(cloudinaryUrl, { method: 'POST', body: formData });
        
        const data = await res.json();
        console.log('Response:', res.status, data);
    } catch (e: any) {
        console.error('Error:', e.message);
    }
};

testUpload();
