function assignInterface(target,interface) {
    if(target == void 0) {
        target = {};
    }
    const tInterface        = Object.assign({},interface);
    Object.assign(tInterface,target);
    return tInterface;
}

function generateUUID() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}

module.exports = {
    assignInterface,
    generateUUID
}