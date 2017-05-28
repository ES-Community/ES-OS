const IUserConstructor = {
    login: "root",
    read: 1,
    write: 1
}

class User {

    constructor(options) {
        Object.assign(this,IUserConstructor,options);
        if(this.password == undefined) {
            throw new Error("Invalid user password!");
        }
    }

    isEqual(login,password) {
        return this.login === login && this.password === password;
    }

}

module.exports = User;