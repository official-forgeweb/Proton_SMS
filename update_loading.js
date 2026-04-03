const fs = require('fs');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = dir + '/' + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if(file.endsWith('page.tsx') && !file.includes('login') && !file.includes('admin/teachers/page.tsx')) {
         results.push(file);
      }
    }
  });
  return results;
}

const files = walk('./frontend/src/app');
let changedCount = 0;

const skeletonHTML = `{isLoading ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', width: '100%', padding: '0px' }}>
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="animate-fade-in glass-panel" style={{ height: '140px', borderRadius: '16px', animationDelay: \`\${i * 100}ms\`, border: '1px solid rgba(226, 232, 240, 0.8)', background: '#F8F9FD' }} />
                            ))}
                        </div>
                    ) : `;

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  let originalContent = content;
  
  let i = 0;
  
  while ((i = content.indexOf('{isLoading ? (', i)) !== -1) {
    let openCount = 0;
    let endIdx = -1;
    let startParenIdx = content.indexOf('(', i);
    
    for (let j = startParenIdx; j < content.length; j++) {
      if (content[j] === '(') openCount++;
      if (content[j] === ')') {
        openCount--;
        if (openCount === 0) {
          let colonIdx = content.indexOf(':', j);
          if (colonIdx !== -1 && colonIdx < j + 30) {
             endIdx = colonIdx + 1;
             break;
          }
        }
      }
    }
    
    if (endIdx !== -1) {
       let loadingBlock = content.substring(i, endIdx);
       if (loadingBlock.includes('spinner') || loadingBlock.includes('Loading') || loadingBlock.includes('spin ') || loadingBlock.includes('Fetching')) {
          content = content.substring(0, i) + skeletonHTML + content.substring(endIdx);
       }
    }
    i += '{isLoading ? ('.length;
  }
  
  // also find `{isLoading ? "Loading..." : ` instances
  content = content.replace(/\{isLoading\s*\?\s*['"]Loading\.\.\.['"]\s*:\s*/g, skeletonHTML);
  content = content.replace(/\{isLoading\s*\?\s*['"]Fetching.*?['"]\s*:\s*/g, skeletonHTML);

  if (content !== originalContent) {
     fs.writeFileSync(f, content, 'utf8');
     changedCount++;
     console.log('Fixed block in: ' + f);
  }
});
console.log('Total files fixed: ' + changedCount);
