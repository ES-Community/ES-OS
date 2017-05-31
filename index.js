const core = require('./kernel/core.js'); 
const Test = require('./packages/test.js');

const os = new core();

os.stdout.pipe(process.stdout);
os.createSocketServer(3000);
os.start();