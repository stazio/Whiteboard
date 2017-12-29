let expect = require('chai').expect;
let WebSocket = require('ws');
let server = require('../server');
let fs = require('fs');
let ws;

beforeEach(function() {
    let port = Math.floor(1000 + (Math.random() * 1000));
    let ssl = server.initialize(port, 0);
    if (ssl)
        ws = new WebSocket("wss://localhost:" + port);
    else
        ws =new WebSocket("ws://localhost:" + port);
});

it ('connect', function(done){
    ws.on('open', done);
});

it ('compare room message', function(done) {
    ws.once('message', function(data) {
        var json = JSON.parse(data);
        expect(json).to.be.an('object').and.to.have.property('type');
        expect(json.type).to.equal('room');
        expect(json.paths).to.deep.equal(JSON.parse(fs.readFileSync('config/storage.json', 'utf-8')));
        done();
    });
});

describe('Once Connected', function() {
    beforeEach(function(done) {
        ws.once('message', function(data){
            let json = JSON.parse(data);
            expect(json).to.be.an('object').and.to.have.property('type');
            expect(json.type).to.equal('room');
            expect(json.paths).to.deep.equal(JSON.parse(fs.readFileSync('config/storage.json', 'utf-8')));
            done();
        });
    });

    it ('request new room', function(done) {
        ws.on('message', function(data) {
            let json=  JSON.parse(data);
            expect(json).to.be.an('object').and.to.have.property('type');
            if (json.type === 'room') {
                expect(json.type).to.equal('room');
                expect(json.paths).to.deep.equal(JSON.parse(fs.readFileSync('config/storage.json', 'utf-8')));
                done();
            }
        });
        ws.send(JSON.stringify({
            "type" : "request_room"
        }));
    });

    it ('send a new path, check new room', function(done) {
        ws.send(JSON.stringify({
            "type" : "path",
            "path" : "black;1"
        }));
        ws.once('message', function(data) {
            let json=  JSON.parse(data);
            expect(json).to.be.an('object').and.to.have.property('type');
            expect(json.type).to.equal('path_response');
            expect(json).to.have.property('path_id');
            let fileData = JSON.parse(fs.readFileSync('config/storage.json', 'utf-8'));
            fileData[json.path_id] = ["black;1"];

            ws.send(JSON.stringify({
                "type" : "request_room"
            }));
            ws.once('message', function(data) {
                json=  JSON.parse(data);
                expect(json).to.be.an('object').and.to.have.property('type');
                expect(json.type).to.equal('room');
                expect(json.paths).to.deep.equal(fileData);
                done();
            });

        });
    });

    it ('clear the room', function() {
        ws.send(JSON.stringify({
            "type" : "clear"
        }));
        ws.once('message', function(data) {
            let json = JSON.parse(data);
            expect(json).to.be.an('object').and.to.have.property('type');
            expect(json.type).to.equal('clear');

            ws.send(JSON.stringify({
                "type" : "request_room"
            }));
            ws.once('message', function(data) {
                json=  JSON.parse(data);
                expect(json).to.be.an('object').and.to.have.property('type');
                expect(json.type).to.equal('room');
                expect(json.paths).to.deep.equal({});
                done();
            });
        });
    })
});