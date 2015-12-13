#! /usr/bin/env node
/**
* Provides commandline interface
*
* @module hi
* @submodule index
*/
var fs = require('fs')
var path = require('path')
var language_detect = require('language-detect')
var highlight = require('./lib/hi')

// Parse Arguments
var argv = require('minimist')(process.argv.slice(2), {
	boolean: true,
	string: ['in', 'out', 'i', 'o'],
	alias: {
		input: ['in', 'i'],
		output: ['out', 'o'],
	}
});

// Processing Arguments
var language
var in_fullpath
var in_filename
var out_filename
var in_stream
var out_stream

// Input
if (argv.input)
{
	in_fullpath = path.resolve(argv.input)
	if (fs.existsSync(in_fullpath))
	{
		in_filename = argv.input
		in_stream = fs.createReadStream(in_fullpath)
	}
	else
	{
		throw new Error('input file was not found: ' + argv.input)
	}
}
else
{
	in_stream = process.stdin
}

// Output
if (argv.output)
{
	out_filename = argv.output
	out_stream = fs.createWriteStream(out_filename)
}
else
{
	out_stream = process.stdout
}

// Pipe or Interactive
if (process.stdin.isTTY)
{

}
else
{

}

// Identify Syntax (Try sync detection first)
if (in_filename)
{
	language = language_detect.sync(in_fullpath) 
}

if (!language)
{
	throw new Error('language could not be detected')
	// Not ready. Streams cannot be re-opened, must pipe to a
	// transformation stream or use a small buffer at the beginning 
	// to detect language before continuing.
	function done (err, language) 
	{
		if (err) throw err 
		highlight(in_stream, out_stream, language)
	}
	var languages = {}
	var shebang = ''
	var firstChunk = true
	var hasSheBang = false 
	var shebangDetected	
	in_stream.on('error', done)
	in_stream.on('data', function in_data (data) {
		var chunk = data.toString()
		if (firstChunk)
		{
			chunk = chunk.replace(/^ +/, '')
			if (chunk.length > 1)
			{
				firstChunk = false
				if (chunk.substr(0, 2) === '#!')
				{
					hasSheBang = true
				}
			}
		}

		if (hasSheBang)
		{
			shebang += chunk
			if (/\r?\n/.test(shebang)) 
			{
				hasShebang = false
				shebangDetected = language_detect.shebang(shebang)

				if (shebangDetected) 
				{
					return stream.close();
				}
			}
		}

		var classified = exports.classify(chunk);
		if (classified) 
		{
			(languages[classified]++ || (languages[classified] = 1))
		}
	})
	in_stream.on('close', function in_close () {
		if (shebangDetected) {
			return done(null, shebangDetected)
		}

		// No languages were detected in the entire file.
		if (!Object.keys(languages).length) 
		{
			return done()
		}

		// Get the most popular language from language detection.
		var popular = Object.keys(languages).reduce(function (highest, language) {
			return languages[highest] > languages[language] ? highest : language
		})

		done(null, popular)
	})
}
else
{
	highlight(in_stream, out_stream, language)
}
