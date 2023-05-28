const https = require('https');
const fs = require('fs');

https.get('https://dev3-socket-configservice.interop-svc.dev-prsn.com/socket-partner-service/dev3', res => {
    let data = '';

    res.on('data', chunk => {
        data += chunk;
    });

    res.on('end', () => {

    });
}).on('error', err => {
    console.log(err);
});
