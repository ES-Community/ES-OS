const core = require('./kernel/core.js'); 
const Test = require('./packages/test.js');

const os = new core({
    ip: "10.0.0.0"
});

os.use(new Test());
os.stdout.pipe(process.stdout);
os.start();

setImmediate(async function() {
    try {
        const sessID = await os.send({
            event: 'connect'
        });
        const sess = await os.login(sessID,"root","root");
        await os.send({
            event: 'get_info'
        });
        sess.disconnect();
    }
    catch(Err) {
        console.log(Err);
    }
    finally {
        process.exit();
    }
});