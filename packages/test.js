const Package = require('../kernel/package.js');

class Test extends Package {

    constructor() {
        super("test");
        this.commands.set('get_info',async (core,pkg) => {
            core.stdout.push('get_info triggered \n');
        });
    }

}

module.exports = Test;