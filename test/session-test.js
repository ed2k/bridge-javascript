'use strict';

var Session = require('../').Session;
var Competition = require('../').Competition;
var Hand = require('../').Hand;
var seat = require('../').seat;
var expect = require('chai').expect;
var fs = require('fs');

describe('Session', function() {

    it('should be part of a competition', function() {
        var session = new Session();
        expect(session).to.have.property('competition')
            .that.is.instanceof(Competition);
    });

    it('should have a site', function() {
        var session = new Session();
        expect(session).to.have.property('site')
            .that.is.a('string');
    });

    it('should have a date', function() {
        var session = new Session();
        expect(session).to.have.property('date')
            .that.is.a('string');
    });

    it('should have boards', function() {
        var session = new Session();
        expect(session).to.have.property('boards')
            .that.is.instanceof(Array);
    });

    it('should have games', function() {
        var session = new Session();
        expect(session).to.have.property('games')
            .that.is.instanceof(Array);
    });

    // Only available on platforms that supports streaming.
    if (Object.getOwnPropertyNames(fs).length !== 0) {
        describe('import PBN', function() {

        it('should return a new Session', function(done) {
            var stream = fs.createReadStream('./test/sample/Schiphol.pbn');
            Session.importPbn(stream, function(err, session) {
                expect(session).is.instanceof(Session);
                done();
            });
        });

        it('should return an Error', function(done) {
            Session.importPbn('[Session test]', function(err) { // test should be in quotes
                expect(err).is.instanceof(Error);
                done();
            });
        });

        it('should process mandatory tags', function(done) {
            var stream = fs.createReadStream('./test/sample/Schiphol.pbn');
            Session.importPbn(stream, function(err, session) {
                expect(session.competition).to.have.property('name', 'International Amsterdam Airport Schiphol Bridgetournament');
                expect(session).to.have.property('site', 'Amsterdam, The Netherlands NLD');
                expect(session).to.have.property('date', '1995.06.10');

                expect(session).to.have.property('boards').of.length(1);
                expect(session.boards[0]).to.have.property('dealer', seat.north);
                expect(session.boards[0]).to.have.property('vulnerability', 'Nil');
                expect(session.boards[0]).to.have.property('hands');
                expect(session.boards[0].hands).to.have.property(seat.north);
                expect(session.boards[0].hands).to.have.property(seat.south);
                expect(session.boards[0].hands).to.have.property(seat.east);
                expect(session.boards[0].hands).to.have.property(seat.west);
                expect(session.boards[0].hands[seat.north].cards.toString()).to.equal('6H,3H,AD,KD,QD,9D,8D,7D,AC,9C,7C,3C,2C');
                expect(session.boards[0].hands[seat.west].cards.toString()).to.equal('KS,QS,TS,2S,AH,TH,JD,6D,5D,4D,2D,8C,5C');

                expect(session).to.have.property('games').of.length(1);
                expect(session.games[0].auction).to.have.property('dealer', seat.north);
                expect(session.games[0].players).to.have.property(seat.north, 'Westra');
                expect(session.games[0].players).to.have.property(seat.south, 'Leufkens');
                expect(session.games[0].players).to.have.property(seat.east, 'Kalish');
                expect(session.games[0].players).to.have.property(seat.west, 'Podgor');
                expect(session.games[0].contract.toString()).to.equal('5HX by S');
                // TODO: Scoring
                // TODO: Result
                done();
            });
        });

        it('should process board records only', function(done) {
            var stream = fs.createReadStream('./test/sample/Hand_Trophy_Pairs.pbn');
            Session.importPbn(stream, function(err, session) {
                expect(session.competition).to.have.property('name', '160816TuE');
                expect(session).to.have.property('site', '');
                expect(session).to.have.property('date', '2016.08.16');
                expect(session).to.have.property('boards').of.length(26);
                expect(session).to.have.property('games').of.length(0);
                expect(session.boards[23-1]).to.have.property('dealer', seat.south);
                expect(session.boards[23-1]).to.have.property('vulnerability', 'All');
                // TODO: Deal
                // TODO: Scoring
                done();
            });
        });

        it('should ignore tags with value "?"', function(done) {
            var stream = fs.createReadStream('./test/sample/kgb.pbn');
            Session.importPbn(stream, function(err, session) {
                expect(session.competition).to.have.property('name', '');
                expect(session).to.have.property('site', '');
                expect(session).to.have.property('date', '');
                expect(session).to.have.property('boards').of.length(99);
                expect(session).to.have.property('games').of.length(0);
                done();
            });
        });

        it('should process Auction section', function(done) {
            var stream = fs.createReadStream('./test/sample/Schiphol.pbn');
            Session.importPbn(stream, function(err, session) {
                expect(session).to.have.property('games').of.length(1);
                var auction = session.games[0].auction;
                expect(auction).to.have.property('dealer', seat.north);
                expect(auction.isClosed()).to.equal(true);
                expect(auction.contract().toString()).to.equal('5HX by S');
                done();
            });
        });

        it('should process Play section', function(done) {
            var stream = fs.createReadStream('./test/sample/Schiphol.pbn');
            Session.importPbn(stream, function(err, session) {
                expect(session).to.have.property('games').of.length(1);
                expect(session.games[0]).to.have.property('tricks').of.length(7);
                var tricks = session.games[0].tricks;
                expect(tricks[0].leader().symbol).to.equal('W');
                expect(tricks[1].leader().symbol).to.equal('N');
                done();
            });
        });

    });
    }

    it('should generate boards', function() {
        var session = Session.generateBoards(16);
        expect(session)
            .to.have.property('boards')
            .that.has.length(16);
        
        for (var i = 0; i < 16; ++i) {
            var board = session.boards[i];
            expect(board.hands).has.property(seat.north).and.instanceOf(Hand).and.has.property('cards').and.has.lengthOf(13);
            expect(board.hands).has.property(seat.south).and.instanceOf(Hand).and.has.property('cards').and.has.lengthOf(13);
            expect(board.hands).has.property(seat.east).and.instanceOf(Hand).and.has.property('cards').and.has.lengthOf(13);
            expect(board.hands).has.property(seat.west).and.instanceOf(Hand).and.has.property('cards').and.has.lengthOf(13);
        }
    });
    
});
