const core = require('./kernel/core.js'); 
const terminal = require('./lib/terminal.js');

const systems = new Map();

const os = new core({
    ip: "10.0.0.0"
});
const tty = new terminal();

os.on('connection',() => {
    console.log('New session created!');
    tty.pause();
});

tty.on('network_package',async function(pkg) {
    if(systems.has(pkg.destination) === true) {
        try {
            const destination = pkg.destination;
            delete pkg.destination;
            const bool = await systems.get(destination).send_package(pkg);
        }
        catch(Err) {
            console.log(Err);
        }
    }
    else {
        console.log('No systems destination found for '+pkg.destination);
    }
});

// Start systems & User-terminal!
os.start();
systems.set(os.ip,os);
tty.run();