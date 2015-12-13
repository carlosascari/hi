# [hi](https://github.com/carlosascari/hi)

Syntax highlighting from your terminal.

## Installation

`npm i carlosascari/hi -g`

## Usage

Output highlighted text to console.

```
hi -in package.json
```

Pipe highlighted text. `less` utility removes color escape codes by default unless you add the `-R` flag.
```
hi -in package.json | less -R
```

**IMPORTANT** As of now, piping **into** the highlighter is unavailable. It will be. The reason can be found in `index.js` line #77. Basically the detection of the language needs access to the stream as well as the highlighter (you can't open a stream twice). It will look like this:
```
cat some_file.py | hi | less -r
```

### Language Detection

Currently [https://www.npmjs.com/package/language-detect](language-detect) is used to detect the language via a shebang string or filename extension if possible, or using a Bayesian [https://github.com/tj/node-language-classifier](Classifier) with a few languages supported:

* Ruby
* Python
* JavaScript
* Objective-C
* HTML
* CSS
* Shellscript
* C/C++
* Coffee-Script

Specifying the language manually or forcing a particular Syntax Brush, is currently unavailable, however it will be implemented.

### Syntax Highlighting Support

Highlighting is done using the open source [http://alexgorbatchev.com/SyntaxHighlighter/manual/configuration/](SyntaxHighlighter) by alexgorbatchev. You can find the core files and individual language *Brushes* in the `lib/scripts` folder. 

**Notice** If new Brushes are added or modified, you can copy the `scripts` folder from alexgorbatchev's repo and overwrite the existing folder. Simply patch references to the **XRegExp** from local paths to `require('xregexp')` since it is included as a dependancy here.

Currently the following languages can be highlighted:

* AppleScript
* AS3
* Bash
* Cold Fusion
* C/C++
* C#
* CSS
* Delphi
* Erlang
* Groovy
* Java
* JavaFX
* JavaScript/JSON/JScript
* Perl
* PHP
* Plain Text
* PowerShell
* Python
* Ruby
* SASS
* Scala
* SQL
* Visual Basic
* XML

### Color Support

See the [https://github.com/chalk/chalk](chalk) repo for more information

### Licence

The MIT License