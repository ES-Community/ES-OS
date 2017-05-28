Number.prototype.toZeroPrefixed=function(n){
  let num = this.toString().split('.')[0];
  for(let i=num.length;i<n;i++){num='0'+num;}
  return num;
};
String.prototype.toZeroPrefixed=Number.prototype.toZeroPrefixed;

class DrivePerm {
  constructor(perm) {
    this._perm=0;
    this.perm=perm;
  }
  set perm(perm){
    if(typeof perm === 'number'||typeof perm === 'string'){
      perm = Number(perm);
      if(perm>777||perm<0)perm =777;
      this._perm=perm;
    }
    else if (typeof perm === 'object'){
      let p0=perm.user.r?'1':'0';
      p0+=perm.user.w?'1':'0';
      p0+=perm.user.x?'1':'0';
      let p1=perm.group.r?'1':'0';
      p1+=perm.group.w?'1':'0';
      p1+=perm.group.x?'1':'0';
      let p2=perm.other.r?'1':'0';
      p2+=perm.other.w?'1':'0';
      p2+=perm.other.x?'1':'0';
      this._perm=Number(Number('0b'+p0).toString()+Number('0b'+p1).toString()+Number('0b'+p2).toString());
    }else{
      throw new Error('DrivePerm.perm need to be an integer or a JSObject');
    }
  }
  toBin(){
    let perm = this._perm.toZeroPrefixed(3);
    let binperm = '';
    for(let i=0;i<3;i++){binperm+=Number(perm.charAt(i)).toString(2).toZeroPrefixed(3);}
    return binperm;
  }
  toObject(){
    const perm = this.toBin();
    return {
      user:{
        r:perm.charAt(0)==='1',
        w:perm.charAt(1)==='1',
        x:perm.charAt(2)==='1'
      },
      group:{
        r:perm.charAt(3)==='1',
        w:perm.charAt(4)==='1',
        x:perm.charAt(5)==='1'
      },
      other:{
        r:perm.charAt(6)==='1',
        w:perm.charAt(7)==='1',
        x:perm.charAt(8)==='1'
      }
    }
  }
  toString(){
    const obj = this.toObject();
    let res = '';
    res+=obj.user.r?'r':'-';
    res+=obj.user.w?'w':'-';
    res+=obj.user.x?'x':'-';
    res+=obj.group.r?'r':'-';
    res+=obj.group.w?'w':'-';
    res+=obj.group.x?'x':'-';
    res+=obj.other.r?'r':'-';
    res+=obj.other.w?'w':'-';
    res+=obj.other.x?'x':'-';
    return res;
  }
}

class DriveNode{
  constructor(parent,name,{perm=777,own_user=1,own_group=1}){
    this.parent=parent;
    this.type=this.constructor.TYPE.UNDEFINED;
    this.perm=new DrivePerm(perm);
    this.own={
      user:own_user,
      group:own_group
    }
    this.created=new Date();
    this.modified=new Date();
    this.name=name;
  }
  get path(){
    let currentNode=this;
    let name='';
    while(currentNode.parent!=null){
      name=currentNode.name+'/'+name;
      currentNode=currentNode.parent;
    }
    return '/'+name;
  }
  get depth(){
    let depth=0;
    let currentNode=this;
    while(currentNode.parent!=null){
      currentNode=currentNode.parent;
      depth++;
    }
    return depth
  }
  get rootNode(){
    let currentNode=this;
    while(currentNode.parent!=null){
      currentNode=currentNode.parent;
    }
    return currentNode;
  }
  indexOfChild(name){return -2;}
}
DriveNode.TYPE={
  FILE:'-',
  DIRECTORY:'d',
  LINK:'l',
  BINARY:'b',
  UNDEFINED:'0'
}

class DriveNodeDirectory extends DriveNode{
  constructor(father,name,{perm=777,own_user=1,own_group=1,children=[]}){
    super(father,name,{perm,own_user,own_group});
    this.type=this.constructor.TYPE.DIRECTORY;
    this.children=children;
  }
  indexOfChild(name){
    return this.children.map(e=>e.name).indexOf(name);
  }
  addChild(driveNode){
    if(!(driveNode instanceof DriveNode))
      throw new Error(`cannot add child who is not a DriveNode instance`);
    if(driveNode.name.indexOf('/')!==-1)
      throw new Error(`"/" is not allowed on file name`);
    if(this.indexOfChild(driveNode.name)!==-1)
      throw new Error(`"${driveNode.name}" already exist on "${this.path}"`);
    this.children.push(driveNode);
  }
  rmChild(name,force=false){
    let index = this.indexOfChild(name);
    if(index === -1)
      throw new Error(`"${this.path}" hasn't child named "${name}", cannot delete`);
    let child = this.children[index];
    if(child.children!==undefined&&child.children.length>0&&!force)
      throw new Error(`"${child.path}" is not empty, cannot delete`);
    return this.children.splice(index,1);
  }
  walkTo(path){
    let currentNode = (path.charAt(0)==='/')?this.rootNode:this;
    let pathArray=path.split('/');
    for(let i=0;i<pathArray.length;i++){
      const pelem = pathArray[i];
      if(pelem===''||pelem==='.')
        continue;
      if(pelem==='..'){
        currentNode=currentNode.father||currentNode;
        continue;
      }
      let index = currentNode.indexOfChild(pelem);
      if(index===-1) {
        throw new Error(`cannot find "${path}" from "${this.path}"`);
      }else if(index===-2){
        throw new Error(`"${pelem}" is not a directory on "${path}" from "${this.path}"`);
      } else {
        currentNode=currentNode.children[index];
      }
    }
    return currentNode;
  }
  forEach(cb){
    (function next(node){
      cb(node);
      node.children.forEach(next);
    })(this)
  }
}

class DriveNodeFile extends DriveNode {
  constructor(father,name,{perm=777,own_user=1,own_group=1,content=''}){
    super(father,name,{perm,own_user,own_group});
    this.type=this.constructor.TYPE.FILE;
    this.content=content;
  }
  write(text){
    this.content=text;
  }
  read(){
    return this.content;
  }
  append(text){
    this.content+=text;
  }
  prepend(text){
    this.content=text+=this.content;
  }
}

class DriveNodeBinary extends DriveNode {
  constructor(father,name,{perm=777,own_user=1,own_group=1,content=''}){
    super(father,name,{perm,own_user,own_group});
    this.type=this.constructor.TYPE.FILE;
    this._content='';
    this.setContent(content);
  }
  getContent(){
    return new Buffer(this._content,'base64');
  }
  setContent(binary){
    if(binary instanceof Buffer){
      this._content = binary.toString('base64');
    }else{
      this._content = new Buffer(binary).toString('base64');
    }
  }
}

class DriveNodeLink extends DriveNode{
  constructor(father,name,{perm=777,own_user=1,own_group=1,link=''}){
    super(father,name,{perm,own_user,own_group});
    this.type=this.constructor.TYPE.FILE;
    this.link=link;
  }
  get linked(){
    return this.rootNode.walkTo(this.link);
  }
}

class DriveNodeFactory {
  static create(type,father,name,opt){
    return this.constructor.classes[type](father,name,opt);
  }
}
DriveNodeFactory.classes={
  file:(...args)=>(new DriveNodeFile(...args)),
  directory:(...args)=>(new DriveNodeDirectory(...args)),
  binary:(...args)=>(new DriveNodeBinary(...args)),
  link:(...args)=>(new DriveNodeLink(...args))
}

class Drive {
  constructor() {
    this.root=DriveNodeDirectory(null,'');
  }
  addTo(path,...args){
    // TODO : j'ai la flemme la tout de suite (28.05.2017 22:24)
    this.root.walkTo()
  }
}
class DriveController {
  constructor(drive) {
    this.drive=drive;
    this.cwd=drive.root;
  }
  get pwd(){
    return this.cwd.path;
  }
  cd(path){
    this.cwd = this.cwd.walkTo(path);
  }
  ls(path='.',getnode=false){
    const nd = this.cwd.walkTo(path);
    let res = [];
    if(nd.type !== DriveNode.TYPE.DIRECTORY){
      res = [nd];
    }else{
      res nd.children;
    }
    if(getnode) return res;
    else return res.map(e=>e.name);
  }
}
module.exports = {
  Drive,
  DrivePerm,
  DriveNode,
  DriveNodeDirectory,
  DriveNodeFile,
  DriveNodeBinary,
  DriveNodeLink,
  DriveController
};

// TODO : serialisation de DriveNode[xxx], Drive, DriveController
// TODO : déserialisation de DriveNode[xxx], Drive, DriveController
// TODO : creation de node simplifiée pour le Drive ou DriveController a choisir
// TODO : suppression de node simplifiée
// TODO : Test unitaire pour chacune des fonctionnalités
// TODO : debug this shit.
