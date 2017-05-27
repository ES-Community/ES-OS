'use strict';

const readline = require('readline');
const emitter = require('events');

class Terminal extends emitter {

    constructor() {
        super();
        console.log('System terminal created!');
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    getInput(strHeader) {
        return new Promise((resolve,reject) => {
            this.rl.question(strHeader, (stdout) => {
                resolve(stdout);
            });
        });
    }

}   

module.exports = Terminal;