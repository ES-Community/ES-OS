const core = require('./kernel/core.js'); 

const os = new core({
    ip: "10.0.0.0"
});

os.stdout.pipe(process.stdout);
os.start();

setImmediate(async function() {
    try {
        const sessID = await os.send({
            event: 'connect'
        });
        const sess = await os.login(sessID,"root","root");
        sess.disconnect();
    }
    catch(Err) {
        console.log(Err);
    }
});