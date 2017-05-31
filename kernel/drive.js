Number.prototype.toZeroPrefixed=function(n){
  let num = this.toString().split('.')[0];
  for(let i=num.length;i<n;i++){num='0'+num;}
  return num;
};
String.prototype.toZeroPrefixed=Number.prototype.toZeroPrefixed;

/**
 * Manage prmissions of a FS node
 */
class DrivePerm {
  /**
   * Create a DrivePerm
   * @param  {integer} perm int between 0 and 777 like unix permissions
   * @return {DrivePerm} Object ready to work
   */
  constructor(perm) {
    this._perm=0;
    this.setPerm(perm);
  }

  /**
   * Define permissions from [0-777] or a DrivePerm@toObject
   * @param {integer} perm int between 0 and 777 like unix permissions
   */
  setPerm(perm){
    if(typeof perm === 'number'||typeof perm === 'string'){
      perm = Number(perm);
      if(perm>777||perm<0)throw new Error('DrivePerm.perm need to be an integer between 0 and 777');
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

      this._perm=Number(
        Number('0b'+p0).toString()+
        Number('0b'+p1).toString()+
        Number('0b'+p2).toString()
      );
    }else{
      throw new Error('DrivePerm.perm need to be an integer or a JSObject');
    }
  }

  /**
   * Get the binary string representation of the permissions
   * @return {string} Binary representation of the permissions
   */
  toBin(){
    let perm = this._perm.toZeroPrefixed(3);
    let binperm = '';
    for(let i=0;i<3;i++){
      binperm+=Number(perm.charAt(i)).toString(2).toZeroPrefixed(3);
    }
    return binperm;
  }

  /**
   * Get the object representation of the permissions
   * @return {object} object representation of the permissions : perm.[user|group|other].[r|w|x]
   */
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

  /**
   * Get the string representation of the permissions
   * @return {string} String representation of the permissions : rwxrwxrwx
   */
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

/**
 * Base of DriveNode used in the FS (abstract)
 */
class DriveNode{
  /**
   * Initialize a node (but dont do it for a simple DriveNode)
   * @param  {DriveNode}  parent          parent node like a folder
   * @param  {string}     name            Name of the node like the filename
   * @param  {integer}    [perm=777]      the perm that will be set to DrivePerm
   * @param  {integer}    [own_user=1]    the id of the user that own the node
   * @param  {integer}    [own_group=1]   the id of the group that own the node
   * @return {DriveNode}                  the instantiated object
   */
  constructor(parent,name,{perm=777,own_user=1,own_group=1}){
    this.parent=null;
    this.setParent(parent);
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

  /**
   * Get the fullPath of the node
   * @return {string} path of the node like '/path/to/node'
   */
  get path(){
    let currentNode=this;
    let name='';
    while(currentNode.parent!=null){
      name=currentNode.name+'/'+name;
      currentNode=currentNode.parent;
    }
    return '/'+name;
  }

  /**
   * Get the depth of the node (root is 0)
   * @return {integer} depth of the node
   */
  get depth(){
    let depth=0;
    let currentNode=this;
    while(currentNode.parent!=null){
      currentNode=currentNode.parent;
      depth++;
    }
    return depth
  }

  /**
   * Set parent node
   * @param {DriveNodeDirectory} node The parent node
   */
  setParent(node){
    if(node!=null){
      this.parent=node;
      this.parent.addChild(this);
    }
  }

  /**
   * Get the root node (usefull sometimes)
   * @return {DriveNodeDirectory} the root node of the fs
   */
  get rootNode(){
    let currentNode=this;
    while(currentNode.parent!=null){
      currentNode=currentNode.parent;
    }
    return currentNode;
  }

  /**
   * Change the modified date to now
   */
  touch(){
    this.modified=new Date();
  }

  /**
   * implemented to prevent error when walking in the tree
   * @param  {string} name the name of the children you are looking for
   * @return {integer}     always return -2
   */
  indexOfChild(name){return -2;}
}
/**
 * TYPE of DriveNode possible [-,d,l,b,0]
 */
DriveNode.TYPE={
  FILE:'-',
  DIRECTORY:'d',
  LINK:'l',
  BINARY:'b',
  UNDEFINED:'0'
}

/**
 * Child of DriveNode that is used like a folder
 */
class DriveNodeDirectory extends DriveNode{
  /**
   * Instantiate a nodeDirectory (folder)
   * @param  {DriveNode}  parent          parent node (folder)
   * @param  {string}     name            Name of the node like the filename
   * @param  {integer}    [perm=777]      the perm that will be set to DrivePerm
   * @param  {integer}    [own_user=1]    the id of the user that own the node
   * @param  {integer}    [own_group=1]   the id of the group that own the node
   * @param  {array}      [children=[]]   array of nodes that are his children
   * @return {DriveNode}                  the instantiated object
   */
  constructor(father,name,{perm=777,own_user=1,own_group=1,children=[]}){
    super(father,name,{perm,own_user,own_group});
    this.type=this.constructor.TYPE.DIRECTORY;
    this.children=children;
  }

  /**
   * Get index of child that has this name
   * @param  {string} name the name of the children you are looking for
   * @return {integer}     index of the child or -1 if not found
   */
  indexOfChild(name){
    return this.children.map(e=>e.name).indexOf(name);
  }

  /**
   * Get the child that has this name (throw error if not found)
   * @param  {string} name the name of the children you are looking for
   * @return {DriveNode}   The node you are looking for
   */
  getChild(name){
    let index = this.indexOfChild(name);
    if(index === -1)
      throw new Error(`"${this.path}" hasn't child named "${name}"`);
    return this.children[index];
  }

  /**
   * Add a child to the node
   * @param {DriveNode} driveNode Node to add
   */
  addChild(driveNode){
    if(!(driveNode instanceof DriveNode))
      throw new Error(`cannot add child who is not a DriveNode instance`);
    if(driveNode.name && driveNode.name.indexOf('/')!==-1)
      throw new Error(`"/" is not allowed on file name`);
    if(this.indexOfChild(driveNode.name)!==-1)
      throw new Error(`"${driveNode.name}" already exist on "${this.path}"`);
    this.children.push(driveNode);
    driveNode.parent=this;
  }

  /**
   * Remove and get the child of this node
   * @param  {string}  name          the name of the children you are looking for
   * @param  {Boolean} [force=false] if children of selected node is not empty, throw error unless force is set to true
   * @return {DriveNode}             the node that is removed from this node
   */
  rmChild(name,force=false){
    let child = this.getChild(name);
    if(child.children!==undefined&&child.children.length>0&&!force)
      throw new Error(`"${child.path}" is not empty, cannot delete`);
    return this.children.splice(this.indexOfChild(name),1);
  }

  /**
   * Used like a cd command but get a DriveNode
   * @param  {string} path path to the DriveNode that you are looking for
   * @return {DriveNode}   Node that you are looking for
   */
  walkTo(path){
    let currentNode = (path.charAt(0)==='/')?this.rootNode:this;
    let pathArray=path.split('/');
    if(pathArray[pathArray.length-1]==='')
      pathArray.splice(pathArray.length-1,1);
    for(let i=0;i<pathArray.length;i++){
      const pelem = pathArray[i];
      if(pelem===''||pelem==='.')
        continue;
      if(pelem==='..'){
        currentNode=currentNode.parent||currentNode;
        continue;
      }
      let index = currentNode.indexOfChild(pelem);
      if(index===-1) {
        throw new Error(`cannot find "${path}" from "${this.path}"`);
      }else if(index===-2 && pathArray.length-1!==i){
        throw new Error(`"${pelem}" is not a directory on "${path}" from "${this.path}"`);
      } else {
        currentNode=currentNode.children[index];
      }
    }
    return currentNode;
  }

  /**
   * Execute something for each node children recursivly
   * @param  {Function} cb callback to execute : node => {do domething}
   */
  forEach(cb){
    cb(this);
    if(this.children.length > 0){
      this.children.forEach(function(child){
        child.forEach(cb);
      });
    }
    // (function next(node){
    //   cb(node);
    //   node.children.forEach(next);
    // })(this)
  }
}

/**
 * Child of DriveNode that is used like a text file
 */
class DriveNodeFile extends DriveNode {
  /**
   * Instantiate a NodeFile (string)
   * @param  {DriveNode}  parent          parent node (folder)
   * @param  {string}     name            Name of the node like the filename
   * @param  {integer}    [perm=777]      the perm that will be set to DrivePerm
   * @param  {integer}    [own_user=1]    the id of the user that own the node
   * @param  {integer}    [own_group=1]   the id of the group that own the node
   * @param  {string}     [content='']    content of the file
   * @return {DriveNode}                  the instantiated object
   */
  constructor(father,name,{perm=777,own_user=1,own_group=1,content=''}){
    super(father,name,{perm,own_user,own_group});
    this.type=this.constructor.TYPE.FILE;
    this.content=content;
  }

  /**
   * Change the content of the file
   * @param  {string} text the text to set in the content
   */
  write(text){
    this.content=text;
  }

  /**
   * get the full content of the file
   * @return {string} content of the file
   */
  read(){
    return this.content;
  }

  /**
   * append text to the content
   * @param  {string} text text to append to the content
   */
  append(text){
    this.content += text;
  }

  /**
   * prepend text to the content
   * @param  {string} text text to prepend to the content
   */
  prepend(text){
    this.content = text+this.content;
  }
}

/**
 * Child of DriveNode that is used like a binary file (not ready to use...)
 */
class DriveNodeBinary extends DriveNode {
  /**
   * Instantiate a NodeFile (binary)
   * @param  {DriveNode}  parent          parent node (folder)
   * @param  {string}     name            Name of the node like the filename
   * @param  {integer}    [perm=777]      the perm that will be set to DrivePerm
   * @param  {integer}    [own_user=1]    the id of the user that own the node
   * @param  {integer}    [own_group=1]   the id of the group that own the node
   * @param  {undefined}  [content='']    content of the file
   * @return {DriveNode}                  the instantiated object
   */
  constructor(father,name,{perm=777,own_user=1,own_group=1,content=''}){
    super(father,name,{perm,own_user,own_group});
    this.type=this.constructor.TYPE.FILE;
    this._content=new Buffer();
    this.setContent(content);
  }

  /**
   * Get content in a Buffer
   * @return {Buffer} the content of the file
   */
  getContent(){
    return this._content;
  }

  /**
   * setContent from a buffer or what the fuck you want if buffer can parse it
   * @param {Buffer} binary content of the file
   */
  setContent(binary){
    if(binary instanceof Buffer){
      this._content = binary;
    }else{
      this._content = new Buffer(binary);
    }
  }
}

/**
 * Child of DriveNode that is used like link
 */
class DriveNodeLink extends DriveNode{
  /**
   * Instantiate a NodeLink
   * @param  {DriveNode}  parent          parent node (folder)
   * @param  {string}     name            Name of the node like the filename
   * @param  {integer}    [perm=777]      the perm that will be set to DrivePerm
   * @param  {integer}    [own_user=1]    the id of the user that own the node
   * @param  {integer}    [own_group=1]   the id of the group that own the node
   * @param  {string}     [link='']       the path of the linked file
   * @return {DriveNode}                  the instantiated object
   */
  constructor(father,name,{perm=777,own_user=1,own_group=1,link=''}){
    super(father,name,{perm,own_user,own_group});
    this.type=this.constructor.TYPE.FILE;
    this.link=link;
  }

  /**
   * get the node that is linked
   * @return {DriveNode} the linked node
   */
  get linked(){
    return this.rootNode.walkTo(this.link);
  }
}

/**
 * Factory to create DriveNode[file|directory|binary|link]
 */
class DriveNodeFactory {
  /**
   * Create a Drive Node
   * @param  {string}             type      type of Node [file|directory|binary|link]
   * @param  {DriveNodeDirectory} father    the parent node
   * @param  {string}             name      the name of the new node
   * @param  {object}             [opt={}]  refer to the drive node constructor of the type
   * @return {DriveNode}                    the node created
   */
  static create(type,father,name,opt={}){
    return this.classes[type](father,name,opt);
  }
}
DriveNodeFactory.classes={
  file:(...args)=>(new DriveNodeFile(...args)),
  directory:(...args)=>(new DriveNodeDirectory(...args)),
  binary:(...args)=>(new DriveNodeBinary(...args)),
  link:(...args)=>(new DriveNodeLink(...args))
}

/**
 * Data container for the FS
 */
class Drive {
  constructor() {
    this.root=DriveNodeDirectory(null,'');
  }
  addTo(path,...args){
    // TODO : j'ai la flemme la tout de suite (28.05.2017 22:24)
    this.root.walkTo()
  }
}

/**
 * Controller to do simple things in the FS
 */
class DriveController {
  /**
   * Define on what drive u want to work
   * @param  {Drive} drive drive to work with
   */
  constructor(drive) {
    this.drive=drive;
    this.cwd=drive.root;
  }

  /**
   * get the path of current working directory
   * @return {string} path of the current working directory
   */
  get pwd(){
    return this.cwd.path;
  }

  /**
   * change th current working directory
   * @param  {string} path path to the directory you want to go
   */
  cd(path){
    let node = this.cwd.walkTo(path);
    if(node.type !== DriveNode.TYPE.DIRECTORY)
      throw new Error(`${path} is not a directory`)
    this.cwd = node;
  }

  /**
   * list file in the directory
   * @param  {string}  [path='.']      path to directory
   * @param  {boolean} [getnode=false] true if you want nodes and not string
   * @return {array}                   array of children
   */
  ls(path='.',getnode=false){
    const nd = this.cwd.walkTo(path);
    let res = [];
    if(nd.type !== DriveNode.TYPE.DIRECTORY){
      res = [nd];
    }else{
      res = nd.children;
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
  DriveController,
  DriveNodeFactory
};

// TODO : serialisation de DriveNode[xxx], Drive, DriveController
// TODO : déserialisation de DriveNode[xxx], Drive, DriveController
// TODO : creation de node simplifiée pour le Drive ou DriveController a choisir
// TODO : suppression de node simplifiée
// TODO : ajout de lien symbolique ou hard.
// TODO : Test unitaire pour chacune des fonctionnalités
// TODO : debug this shit.
