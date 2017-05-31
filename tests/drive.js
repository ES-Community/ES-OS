const deepEqual = require('deep-equal');
const chai = require('chai');
const expect = chai.expect;
const Drive = require('../kernel/drive.js');
const DrivePerm = Drive.DrivePerm;
const DriveNodeFactory = Drive.DriveNodeFactory;
const DriveNodeDirectory = Drive.DriveNodeDirectory;
const DriveNodeFile = Drive.DriveNodeFile;
const DriveNodeBinary = Drive.DriveNodeBinary;
const DriveNodeLink = Drive.DriveNodeLink;

describe('DrivePerm', function(){
	let permDummy421 = {
		user : {
			r: true,
			w: false,
			x: false
		},
		group : {
			r: false,
			w: true,
			x: false
		},
		other : {
			r: false,
			w: false,
			x: true
		}
	};
	let permDummy632 = {
		user : {
			r: true,
			w: true,
			x: false
		},
		group : {
			r: false,
			w: true,
			x: true
		},
		other : {
			r: false,
			w: true,
			x: false
		}
	};
	it('setPerm(perm) should set the correct permission (object perm)', function(){
		let drivePerm = new DrivePerm(permDummy421);
		expect(drivePerm._perm).to.be.equal(421);
		drivePerm.setPerm(permDummy632);
		expect(drivePerm._perm).to.be.equal(632);
	});

	it('setPerm(perm) should throw an exception when perms are not in correct format (like 888)', function(){
		let drivePerm = new DrivePerm(permDummy421);
		expect(drivePerm.setPerm.call(drivePerm, 888)).to.be.an.instanceof(Error);
	});

	it('toBin() should return the binary format of permissions', function(){
		let drivePerm = new DrivePerm(652);
		expect(drivePerm.toBin()).to.equal("110101010");
	});

	it('toObject() should return the object format', function(){
		let drivePerm = new DrivePerm(permDummy632);
		expect(drivePerm.toObject()).to.be.deep.equal(permDummy632);
	});

	it('toString() should return the UNIX string format', function(){
		let drivePerm = new DrivePerm(permDummy421);
		expect(drivePerm.toString()).to.be.equal("r---w---x");
		let drivePerm2 = new DrivePerm(permDummy632);
		expect(drivePerm2.toString()).to.be.equal("rw--wx-w-");
	});
});

describe('DriveNodeFactory', function(){

	let file = DriveNodeFactory.create('file', null, 'testFile', {
		perm: 232,
		own_user: 2,
		own_group: 3
	});

	it('create() should return the correct instance class', function(){
		let types = ['file', 'directory', 'binary', 'link'];
		let classes = []
		for (var i = types.length - 1; i >= 0; i--) {
			let type = types[i];
			//Trick to bypass the Error in DriveNodeLink
			let node = DriveNodeFactory.create(type, null, '', {link : file});
			expect(node.constructor.name.toLowerCase()).to.include(type);
		}
	});

	it('create() should forward arguments to type constructors', function(){
		expect(file.perm._perm).to.be.equal(232);
	});
});

describe('DriveNodeDirectory', function(){
	let main = new DriveNodeDirectory(null, '', {perm : 777, own_user : 1, own_group : 1, children : []});
	let sub = new DriveNodeDirectory(main, 'sub', {perm : 755, own_user : 1, own_group : 1, children : []});
	let subInserted = new DriveNodeDirectory(null, 'subInserted', {perm : 755, own_user : 1, own_group : 1, children : []});
	let badChild = new DriveNodeDirectory(null, '/bad', {perm : 755, own_user : 1, own_group : 1, children : []});

	it('main should have one child due to propagation in child constructor', function(){
		expect(main.indexOfChild('sub')).to.not.be.equal(-1);
	});

	it('addChild(child) should add the child to the parent', function(){
		main.addChild(subInserted);
		expect(main.indexOfChild('subInserted')).to.not.be.equal(-1);
	});

	it('addChild(child) should throw when name contains /', function(){
		expect(main.addChild.call(main, badChild)).to.be.an.instanceof(Error);
	});

	it('addChild(child) should throw when child with the same name already exist', function(){
		expect(main.addChild.call(main, subInserted)).to.be.an.instanceof(Error);
	});

	it('rmChild(name) should delete a child', function(){
		main.rmChild('subInserted', false);
		expect(main.indexOfChild('subInserted')).to.be.equal(-1);
	});

	it('rmChild(name) should throw when deleting a non-existing child', function(){
		main.rmChild('subInserted', false);
		expect(main.rmChild.call(main, 'subInserted', false)).to.be.an.instanceof(Error);
		// main.getChild throw an error...
	});

	it('walkTo(name) should return the correct node',function(){
		sub.addChild(subInserted);
		expect(sub.walkTo('/')).to.be.deep.equal(main);
		expect(sub.walkTo('/sub')).to.be.deep.equal(sub);
		expect(sub.walkTo('/sub/subInserted')).to.be.deep.equal(subInserted);
		expect(sub.walkTo('.')).to.be.deep.equal(sub);
		expect(subInserted.walkTo('..')).to.be.deep.equal(sub); //Failing
		expect(sub.walkTo('..')).to.be.deep.equal(main);
		expect(sub.walkTo('./../sub/..')).to.be.deep.equal(main);
		expect(main.walkTo('../../../../../')).to.be.deep.equal(main);
	});

	it('walkTo(name) should throw if the path doesn\'t exist', function(){
		expect(main.walkTo.call(sub, "/doesnt-exist")).to.be.an.instanceof(Error);
	});

	it('forEach(node) shoud iterate on node and associated children', function(){
		main.forEach(function rename(node){
			node.name += "OKTEST";
		});

		expect(main.name).to.include("OKTEST");
		expect(sub.name).to.include("OKTEST");
		expect(subInserted.name).to.include("OKTEST");
	});
});

describe('DriveNodeBinary', function(){
	let buffer = Buffer.from('Hello Mocha');
	let binFromBuffer = new DriveNodeBinary(null, '', {perm:777,own_user:1,own_group:1,content:buffer});
	let binFromString = new DriveNodeBinary(null, '', {perm:777,own_user:1,own_group:1,content:'Some content'});

	it('getContent() should return the same content', function(){
		expect(binFromBuffer.getContent()).to.be.deep.equal(buffer);
		expect(binFromString.getContent().toString()).to.be.equal("Some content");
	});

	it('setContent(buffer) should set the content by reference', function(){
		binFromString.setContent(buffer);
		expect(binFromString.getContent()).to.be.deep.equal(buffer);
	});

	it('setContent(string) should recreate a buffer', function(){
		binFromString.setContent('Hello Mocha');
		expect(Buffer.isBuffer(binFromString._content)).to.be.true;
		expect(binFromString._content).to.be.deep.equal(buffer);
	});
});

describe('DriveNodeFile', function(){
	let main = new DriveNodeDirectory(null, '', {perm : 777, own_user : 1, own_group : 1, children : []});
	let file = new DriveNodeFile(main, 'file', {perm : 777, own_user : 1, own_group : 1, content: 'Hello Mocha!'});

	it('read() should return the file content', function(){
		expect(file.read()).to.be.equal('Hello Mocha!');
	});

	it('write(text) should erase the old content', function(){
		file.write('Bye Mocha');
		expect(file.read()).to.be.equal('Bye Mocha');
	});

	it('append(text) should append to the content', function(){
		file.append(' and thank you');
		expect(file.read()).to.be.equal('Bye Mocha and thank you');
	});

	it('prepend(text) should prepend to the content', function(){
		file.prepend('Hello Mocha! ');
		expect(file.read()).to.be.equal('Hello Mocha! Bye Mocha and thank you');
	});
});

describe('DriveNodeLink', function(){
	let file = new DriveNodeFile(null, 'file', {perm : 777, own_user : 1, own_group : 1, content: 'Hello Mocha!'});
	let link = new DriveNodeLink(null, 'link', {perm : 777, own_user : 1, own_group : 1, link : file});
	
	it('constructor should throw if link is not a NodeDrive', function(){
		let bad = function(){
			new DriveNodeLink(null, 'link', {perm : 777, own_user : 1, own_group : 1, link : 'oops'});
		}

		let good = function(){
			new DriveNodeLink(null, 'link', {perm : 777, own_user : 1, own_group : 1, link : file});
		}
		expect(bad).to.throw();
		expect(good).to.not.throw();

	});

	it('DriveNodeLink should refer to the linked() object', function(){
		expect(link.linked.getContent().toString()).to.be.equal('Hello Mocha!');
	});
});



//TODO : To complete
