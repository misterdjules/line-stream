var LineStream = require('../index.js');
var fs         = require('fs');
var path       = require ('path');
var assert     = require('assert');
var util       = require('util');
var async      = require('async');
var debug      = require('debug')('line-stream:test');

var mockFileContent = ['Foo', 'Bar', '', 'Baz', ''];
var mockFilePath = path.join(__dirname, 'test.txt');
var mockFileStream = fs.createWriteStream(mockFilePath);

async.series([
    function createMockFile(done) {
        async.eachSeries(mockFileContent, function (line, callback) {
            mockFileStream.write(line + '\n', callback);
        }, function (err) {
            done(err);
        });
    },
    function testLineStreamReader(done) {
        var testStream = fs.createReadStream(mockFilePath);
        var lineStream = new LineStream;
        var lineIndex = 0;

        lineStream.on('end', function () {
            debug('Got end on lineStream!');
            done();
        })

        lineStream.on('readable', function () {
            debug('Got readable on lineStream!');
            var chunk;
            while ((chunk = lineStream.read()) !== null) {
                debug('chunk:', chunk);
                assert(chunk === mockFileContent[lineIndex],
                       util.format("%s === %s for line index", chunk, mockFileContent[lineIndex], lineIndex));
                ++lineIndex;
            }
        });

        testStream.pipe(lineStream);
    },
    function cleanup(done) {
        fs.unlink(mockFilePath, done);
    }], function (err, results) {
        if (!err) {
            console.log('Test completed successfully!');
        }
    });

