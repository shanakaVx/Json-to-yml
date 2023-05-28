const readline = require('readline');
const https = require('https');
const fs = require('fs');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

rl.question('Please enter the config URL: ', (configUrl) => {
    https.get(configUrl, res => {
        let data = '';

        let configJsonString = {}

        res.on('data', chunk => {
            data += chunk.toString();
        });

        res.on('end', ()=> {
            const configs = JSON.parse(data);
            for(const propertySource of configs.propertySources) {
                const singleSource = propertySource.source;
                configJsonString = {...configJsonString, ...singleSource}
            }
            const sortedKeys = Object.keys(configJsonString).sort();

            let previousKeyArray = [];
            let currentKeyArray = [];
            const indent = "  ";
            let yamlLine = "";

            const writeStream = fs.createWriteStream('configs.yml', 'utf8');

            let isKeysDifferent = false;
            
            for(const key of sortedKeys) {
                currentKeyArray = key.split(".");

                currentKeyArray.forEach((yamlKey, index) => {
                    if(!isKeysDifferent && previousKeyArray[index] === yamlKey) {
                        return;
                    }
                    isKeysDifferent = true;
                    yamlLine += indent.repeat(index) + yamlKey;
                    if(index < currentKeyArray.length - 1) {
                        yamlLine += ":\n";
                    }
                });

                isKeysDifferent = false;

                yamlLine += ": " + configJsonString[key] + "\n";
                writeStream.write(yamlLine);

                previousKeyArray = currentKeyArray;
                yamlLine = "";
            }

            writeStream.end();
            writeStream.on('finish', () => {
                console.log('File has been written successfully.');
                rl.close();
            });

            writeStream.on('error', (err) => {
                console.error('An error occurred writing to file:', err);
                rl.close();
            });
        });
    }).on('error', err => {
        console.log(err);
        rl.close();
    });
});
