/**
* Provides Syntax Highlighter function
*
* @module hi
*/
var fs = require('fs')
var path = require('path')
var htmlparser = require('htmlparser2')
var brushMap = {}

// Force chalk module to always output color
process.argv.push('--color')
var chalk = require('chalk')

/**
* @param BRUSH_FOLDER
* @type String
* @final
*/
const BRUSH_FOLDER = path.join(__dirname, './scripts')

// -----------------------------------------------------------------------------

// Loads Brushes and map them by common aliases
fs.readdirSync(BRUSH_FOLDER)
.forEach(function brush_loader (filename) {
	if (!filename.match(/shBrush\w+\.js/)) return
	var language = require(path.join(BRUSH_FOLDER, filename))
	language.Brush.aliases
	.forEach(function alias_mapping(alias) {
		var alias = alias.toLowerCase()
		brushMap[alias] = language
	})
})

// -----------------------------------------------------------------------------

/**
* Resolves a language name or identifier into a known language string.
* Since languages like javascript can be named: js, JS, jscript, javscript, 
* JavaScript, etc. This method normalizes the language, and it's variants such
* as JSON into `javascript` so the syntaxhilighter can determined which brush to
* use.
*
* @method resolve_language
* @param [language] {String}
* @return String
*/
function resolve_language (language) 
{
	return language.toString().toLowerCase()		
}

/**
* Depending on the language string provided, the input stream will be pumped
* read and hilighted chunk by chunk and passed to the output stream as it is
* parsed.
*
* @method Highlight
* @param in_stream {ReadableStream}
* @param out_stream {WriteableStream}
* @param [language] {String}
*/
function Highlight (in_stream, out_stream, language) 
{
	var langHighlighter
	var langBrush
	var language = resolve_language(language)
	var hilightedHTML
	var buffer = ''

	switch(language)
	{
		case 'json':
		case 'javascript':
		langHighlighter = brushMap['js']
		langBrush = new langHighlighter.Brush()

		// For list of all available options, see:
		// http://alexgorbatchev.com/SyntaxHighlighter/manual/configuration/
		langBrush.init({
			toolbar: false, 
			'first-line': 1,
			'auto-links':false
		})
		break;
		default:
	}

	in_stream
	.on('data', function(data) {buffer += data})
	.on('end', function(data) {
		if (data) buffer += data
		highlightedHtml = langBrush.getHtml(buffer)
		process_hilight_html(highlightedHtml)
		out_stream.write('\n')
	})

	// -------------------------------------------------------------------------

	function process_hilight_html(html)
	{
		var buffer = {}, lines = [], current_line = 0 

		// console.log(html)
		var parser = new htmlparser.Parser({
			onopentag: function (name, attribs) 
			{
				if (name === 'div')
				{
					var classList = attribs.class.split(' ')
					current_line = +classList[1].substr(6)
					lines[current_line] = ''
				}
				else if (name === 'code')
				{
					buffer.name = 'code'
					buffer.class = attribs.class.split(' ')
					var className = buffer.class + ''
					switch(className)
					{
						case 'plain':
						buffer.type = 'plain'
						break
						case 'string':
						buffer.type = 'string'
						break
						case 'keyword':
						buffer.type = 'keyword'
						break
						case 'comments':
						buffer.type = 'comments'
						break
						default:
						buffer.type = 'spaces'
					}
				}
				else
				{
					// console.log(attribs)
					throw new Error('unsuported tagname: ' + name)
				}
			},
			ontext: function (text) 
			{
				buffer.text = text.replace(/&nbsp;/g, ' ')
			},
			onclosetag: function (name) 
			{
				if (name === 'div')
				{
					current_line = -1
				}
				else if (name === 'code')
				{
					var text = buffer.text
					switch(buffer.type)
					{
						case 'plain':
						text = chalk.bold.white(text)
						break
						case 'keyword':
							switch(text)
							{
								case 'if':
								case 'else':
								case 'switch':
								case 'case':
								case 'default':
								text = chalk.bold.red(text)
								break
								case 'true':
								case 'false':
								case 'null':
								case 'undefined':
								text = chalk.magenta(text)
								default:
								text = chalk.bold.blue(text)
							}
							text = text + ' '
						break
						case 'string':
						text = chalk.bold.green(text)
						break
						case 'comments':
						text = chalk.bold.gray(text)
						break
						case 'spaces':
						break
					}

					lines[current_line] += text
					buffer = {}
				}
				else
				{
					// console.log(buffer)
					throw new Error('unsuported tagname: ' + name)
				}
			},
			onerror: function (err) 
			{
				console.log('onerror', err)
			},
			onreset: function () 
			{
				throw new Error('not implemented')
			},
			onend: function () 
			{
				lines.shift()
				out_stream.write(lines.join('\n'))
			},
		}, {decodeEntities: false, xmlMode: false, lowerCaseTags: false})
		
		parser.write(html)
		parser.end()
	}
}

module.exports = Highlight