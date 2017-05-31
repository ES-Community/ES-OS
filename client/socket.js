const net = require('net');

const sockClient = net.connect({port: 3000},() => {
    const pkg = {
        event: 'connect'
    }
    sockClient.write(JSON.stringify(pkg));
});

sockClient.on('data',buf => {
    try {
        console.log(buf.toString());
        var pkg = JSON.parse(buf.toString());
    }
    catch(Err) {
        console.log(Err);
        return;
    }

    if(pkg.event === 'connect') {
        const sessID = pkg.data.sessID;
        console.log(`Authentification received with sessID => ${sessID}`);
        sockClient.write(JSON.stringify({
            event: 'auth', 
            data: {
                sessID,
                user: 'root',
                password: 'root'
            }
        }));
    }
    else if(pkg.event === 'stdout') {
        console.log(pkg.data);
    }
});

sockClient.on('error', err => {
    // Silent;
});