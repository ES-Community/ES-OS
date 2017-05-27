const core = require('./kernel/core.js'); 

const os = new core({
    ip: "10.0.0.0"
});

os.start();

setImmediate(async function() {
    try {
        await os.send({
            event: 'connect'
        });
    }
    catch(Err) {
        console.log(Err);
    }
});