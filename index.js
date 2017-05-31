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
        var sessID = await os.send({
            event: 'connect'
        });
    }
    catch(Err) {
        console.log(Err);
    }

    try {
        var sess = await os.login(sessID,"root","root");
    }
    catch(Err) {
        console.log('Failed to log!');
    }

    os.setPrefix("test");
    await os.send({
        event: 'get_info'
    });
    sess.disconnect();

    process.exit();
});