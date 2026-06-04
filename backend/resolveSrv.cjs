const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const target = 'cluster0.9juuxfn.mongodb.net';
const srvTarget = '_mongodb._tcp.' + target;

console.log('Resolving TXT for', target);
dns.resolveTxt(target, (err, txtRecords) => {
    if (err) console.error('TXT Error:', err.message);
    else console.log('TXT Records:', txtRecords);

    console.log('\nResolving SRV for', srvTarget);
    dns.resolveSrv(srvTarget, (err, srvRecords) => {
        if (err) console.error('SRV Error:', err.message);
        else {
            console.log('SRV Records:');
            srvRecords.forEach(record => {
                console.log(`- ${record.name}:${record.port}`);
            });

            if (srvRecords.length > 0) {
                const hosts = srvRecords.map(r => `${r.name}:${r.port}`).join(',');
                let authSource = 'admin';
                let replicaSet = 'atlas-xxxxxx-shard-0'; // Will need TXT record or default for Atlas

                let replicaSetMatch = null;
                if (txtRecords && txtRecords[0]) {
                    const txt = txtRecords[0].join('');
                    const match = txt.match(/authSource=([^&]+)/);
                    if (match) authSource = match[1];
                    const repMatch = txt.match(/replicaSet=([^&]+)/);
                    if (repMatch) replicaSetMatch = repMatch[1];
                }

                console.log('\n--- Direct Connection String Template ---');
                let rsParam = replicaSetMatch ? `&replicaSet=${replicaSetMatch}` : '';
                console.log(`mongodb://teashop12:devjeet123_@${hosts}/swadistchai?ssl=true${rsParam}&authSource=${authSource}&retryWrites=true&w=majority&appName=Cluster0`);
            }
        }
    });
});
