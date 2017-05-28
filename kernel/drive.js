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
  constructor(parent,name,type=this.constructor.TYPE.UNDEFINED,{content='',perm=777,own_user=1,own_group=1}){
    this.parent=parent;
    this.type=type;
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

}
DriveNode.TYPE={
  FILE:'-',
  DIRECTORY:'d',
  LINK:'l',
  BINARY:'b',
  UNDEFINED:'0'
}

class Drive {
  constructor() {
      this.root=DriveNode(null,DriveNode.TYPE.DIRECTORY,777)
  }

}
module.exports = {Drive,DriveNode,DrivePerm};
