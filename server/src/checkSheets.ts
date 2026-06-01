async function checkCertificates() {
  console.log('🔍 [Cert Check] Querying active certificates for service account...');
  const email = 'proton@proton-498103.iam.gserviceaccount.com';
  const url = `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(email)}`;
  
  try {
    const res = await fetch(url);
    const data = await res.json() as any;
    console.log('Active Key IDs in Google Console:', Object.keys(data));
    
    const targetKeyId = '13337d07b05f4d04581f472ec9cd9e2943911104';
    const exists = targetKeyId in data;
    console.log(`Does target key ID "${targetKeyId}" exist in Google?`, exists ? '✅ YES!' : '❌ NO!');
  } catch (err: any) {
    console.error('Failed to fetch certificates:', err.message);
  }
}

checkCertificates();
