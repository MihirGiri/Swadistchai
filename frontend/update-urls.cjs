const fs = require('fs');
const path = require('path');

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js') || fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let originalContent = content;

            // Pattern: match "https://tealeafluxe.onrender.com/api/..." or 'https://tealeafluxe.onrender.com/api/...' or `https://tealeafluxe.onrender.com/api/...`
            const regex = /["'`]https:\/\/tealeafluxe\.onrender\.com\/api([^"'`]*)["'`]/g;
            content = content.replace(regex, (match, p1) => {
                return `\`\${import.meta.env.VITE_API_URL || "https://tealeafluxe.onrender.com/api"}${p1}\``;
            });

            if (content !== originalContent) {
                fs.writeFileSync(fullPath, content);
                console.log('Updated: ' + fullPath);
            }
        }
    }
}

processDir('src');
