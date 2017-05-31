const deepEqual = require('deep-equal');
const chai = require('chai');
const expect = chai.expect;
const Drive = require('../kernel/drive.js');
const DrivePerm = Drive.DrivePerm;
const DriveNodeFactory = Drive.DriveNodeFactory;
const DriveNodeDirectory = Drive.DriveNodeDirectory;

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
		expect(drivePerm.setPerm.bind(drivePerm, 888)).to.throw();
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
	it('create() should return the correct instance class', function(){
		let types = ['file', 'directory', 'binary', 'link'];
		let classes = []
		for (var i = types.length - 1; i >= 0; i--) {
			let type = types[i];
			let node = DriveNodeFactory.create(type, null, '', {});
			expect(node.constructor.name.toLowerCase()).to.include(type);
		}
	});

	it('create() should forward arguments to type constructors', function(){
		let file = DriveNodeFactory.create('file', null, 'testFile', {
			perm: 232,
			own_user: 2,
			own_group: 3
		});
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
		expect(main.addChild.bind(main, badChild)).to.throw();
	});

	it('addChild(child) should throw when child with the same name already exist', function(){
		expect(main.addChild.bind(main, subInserted)).to.throw();
	});

	it('rmChild(name) should delete a child', function(){
		main.rmChild('subInserted', false);
		expect(main.indexOfChild('subInserted')).to.be.equal(-1);
	});

	it('rmChild(name) should throw when deleting a non-existing child', function(){
		main.rmChild('subInserted', false);
		expect(main.rmChild.bind(main, 'subInserted', false)).to.throw();
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
		expect(main.walkTo.bind(sub, "/doesnt-exist")).to.throw();
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

//TODO : To complete
