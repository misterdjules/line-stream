var Stream = require('stream');
var util   = require('util');
var debug  = require('debug')('line-stream');

function LineStream() {
	this.lines = [];

	this.constructor.super_.call(this);

	// Setting objectMode to true to be able to push
	// empty strings when encountering an empty line
	this._readableState.objectMode = true;
}

util.inherits(LineStream, Stream.Transform);

LineStream.prototype._transform = function _transform(chunk, encoding, cb) {
	if (!encoding || encoding === 'buffer') {
		encoding = 'utf8';
	}

	var decodedChunk = chunk.toString(encoding);
	debug('decodedChunk: ', decodedChunk);

	// Use the end of the previous chunk as the beginning of the current chunk,
	// in the likely event that the two chunks' boundary are in the middle of a line.
	if (this.lines.length > 0) {
		var latestDecodedLineOfPreviousChunk = this.lines.pop();
		decodedChunk = latestDecodedLineOfPreviousChunk + decodedChunk;
	}

	var newLines = decodedChunk.split(/\r\n|\n|\r/);
	debug('newLines:', util.inspect(newLines));

	this.lines.push.apply(this.lines, newLines);

	// Do not push the latest line until we receive
	while (this.lines.length > 1) {
		nextLine = this.lines.shift();
		debug('Pushing line: [%s]', nextLine);
		if (!this.push(nextLine)) {
			debug('Failed to push: ', nextLine);
			// Stream needs to be drained before pushing again,
			// so just leave it alone for now.
			break;
		} else {
			debug('Successfully pushed: ', nextLine);
		}
	}

	cb();
}

LineStream.prototype._flush = function _flush(cb) {
	while (this.lines.length > 1) {
		nextLine = lines.shift();
		this.push(nextLine);
	}

	cb();
}

module.exports = LineStream;