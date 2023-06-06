const readline = require('readline');
const https = require('https');
const fs = require('fs');

if(process.argv[2].trim().length == 0) {
    console.log('Usage CLI arguments: <baseUrl for the config server> <service name> <environment>' )
}

const configBaseUrl = process.argv[2];
const serviceName = process.argv[3];
const environment = process.argv[4];

const configUrl = configBaseUrl + '/' + serviceName + '/' + environment

console.log('👀 Config url : ' + configUrl);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

https.get(configUrl, res => {
    let data = '';

    let configJsonString = {}

    res.on('data', chunk => {
        data += chunk.toString();
    });

    res.on('end', async ()=> {
        console.log('Configs found! 😎 😍')
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

        const writeStream = fs.createWriteStream('application.yml', 'utf8');

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

            let yamlLineValue = String(configJsonString[key]);

            if(yamlLineValue.indexOf("{cipher}") >= 0) {
                yamlLine += ": " + await decryptValue(yamlLineValue) + "\n";
            } else {
                yamlLine += ": " + configJsonString[key] + "\n";
            }

            writeStream.write(yamlLine);

            previousKeyArray = currentKeyArray;
            yamlLine = "";
        }

        writeStream.end();
        writeStream.on('finish', () => {
            console.log('👌 Config file has been written successfully. Check the root folder 🥳 ');
            rl.close();
        });

        writeStream.on('error', (err) => {
            console.error('😢 An error occurred writing to the config file: 🤦‍♂️', err);
            rl.close();
        });
    });
}).on('error', err => {
    console.log('😢 Config get error! 🤦‍♂️ ', err);
    rl.close();
});


const decryptValue = (cipherValue) => {
    let sendData = cipherValue.substring(8);
    let decrypted = '';

    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'text/plain',
            'Content-Length': sendData.length
        }
    }

    return new Promise((resolve, reject) => {
        const req = https.request(configBaseUrl + "/decrypt", options, (res) => {
            res.on('data', chunk => {
                decrypted += chunk.toString();
            })
            res.on('end', () => {
                console.log('Decrypting...🙄...😁...🙄...');
                resolve(decrypted);
            })
        })

        req.on('error', (err) => {
            console.error('👽 Error! 🤦‍♂️ ', err);
            reject(e);
        });

        req.write(sendData);
        req.end();
    });
}