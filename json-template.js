window.JSONTemplate = (function(){

	function parseFirstNode(expression){
	    var parts = expression.split(/>/);
	    var trimmed = parts[0];
	    for ( var i = 0, l = parts.length; i < l; i++ ) {
	        var current = parts[i];
	        var next = parts[i+1];
	        if ( /\/$/.test(current) && next ) {
	            trimmed += '>' + next;
	        }
	    }
	    return trimmed;
	};

	function parseTagName(expression){
	    var tagName = /^[a-z0-9]+/i.exec(expression);
	    if ( tagName ) {
	        return tagName[0];
	    }
	};

	function parseId(expression){
	    var id = /#[a-z_\-0-9]+/i.exec(expression);
	    if ( id ) {
	        return id[0].substr(1);
	    }
	};

	function parseClassNames(expression){
	    var classNames = expression.match(/\.[a-z_\-0-9]+/ig);
	    if ( classNames ) {
	        return classNames.map(function(className){
	            return className.substr(1);
	        });
	    };
	};

	function parseAttributes(expression){
	    var attributes = expression
	        .replace(/\:[^\]]+$/, '')
	        .match(/\[[a-z_\-0-9]+\s*=\s*?[^\]]*\]/ig);
	    if ( attributes ) {
	        return attributes.map(function(attribute){
	            var arr = attribute.replace(/^\[(.*)\]$/, '$1').split(/\s*=\s*/);
	            return {
	                name: arr[0],
	                value: arr[1]
	            };
	        });
	    }
	};

	function parseInnerText(expression){
	    var text = /\:[^\]]+$/.exec(expression);
	    if ( text ) {
	        return text[0].substr(1);
	    }
	};

	function getElementHtml(tag, id, classes, attributes, text, children){

	    var output = [];
	    
	    if ( tag ) {

	        output.push('<' + tag);

	        if ( id ) {
	            output.push(' id="' + id + '"');
	        }
	        if ( classes && classes.length ) {
	            output.push(' class="' + classes.join(' ') + '"');
	        }
	        if ( attributes && attributes.length ) {
	            attributes.forEach(function(attribute){
	                output.push(' ' + attribute.name);
	                if ( attribute.value ) {
	                    output.push('="' + attribute.value + '"');
	                }
	            });
	        }
	        
	        output.push('>');

	        if ( !isEmptyTag(tag) ) {
	            if ( text ) {
	                output.push(escapeText(text));
	            }
	            output.push(( children || '' ) + '</' + tag + '>');
	        }
	    }
	    else if ( text ) {
	        output.push(escapeText(text));
	    }

	    return output.join('');
	};

	function escapeText(text){
	    return text
	        .replace(/\/>/, '>')
	        .replace(/</, '&lt;')
	        .replace(/>/, '&gt;');
	};

	function isEmptyTag(tagName){
	    var emptyTags = ['br', 'hr', 'meta', 'link', 'base', 'link', 'meta', 'hr', 'br', 'img', 'embed', 'param', 'area', 'col', 'input'];
	    return emptyTags.indexOf(tagName) > -1;
	};

	function handleExpression(expression, childNodeHtml){
	    var firstNode = parseFirstNode(expression);
	    var trimmed = firstNode
	            .replace(/\:[^\]]+$/, '')
	            .replace(/\[.*\]/, '');

	    if ( !childNodeHtml ) {
	        var childNodeExpression = expression
	                .substr(firstNode.length)
	                .replace(/^\s*>\s*/, '');

	        if ( !/^\s*$/.test(childNodeExpression) ) {
	            childNodeHtml = handleExpression(childNodeExpression);
	        }
	    }

	    return getElementHtml(
			parseTagName(trimmed),
			parseId(trimmed),
			parseClassNames(trimmed),
			parseAttributes(firstNode),
			parseInnerText(firstNode),
			childNodeHtml
	    );
	};

	function handleDOMTree(tree){
	    if ( tree instanceof Array ) {
	        return tree.map(handleDOMTree).join('');
	    }
	    else if ( typeof tree === 'string' ) {
	        return handleExpression(tree);
	    }
	    else if ( tree.el ) {
	        return handleExpression(
	            tree.el,
	            tree.children ? handleDOMTree(tree.children) : null
	        );
	    }
	};

	function HTMLToDOM(html){
		var tempContainer = document.createElement('div');
		tempContainer.innerHTML = html;
		return tempContainer.childNodes;
	};

	function handleCSS(css, params){
		var output = [];
		for ( var selector in css ) {

			var rules = css[selector];
			var rulesCSS = [selector + '{'];

			for ( prop in rules ) {

				var value = undefined;
				
				if ( typeof rules[prop] === 'string' ) {
					value = rules[prop];
				}
				if ( typeof rules[prop] === 'number' ) {
					value = isCSSPropertyWithoutUnit(prop)
						? rules[prop]
						: rules[prop] + 'px';
				}
				if ( value ) {
					rulesCSS.push(prop + ':' + value + ';');
				}
			}
			rulesCSS.push('}');
			output.push(rulesCSS.join(''));
		}
		return output.join('');
	};

	function isCSSPropertyWithoutUnit(prop){
		var propertiesWithoutUnit = ['z-index', 'counter-reset', 'counter-increment', 'column-count'];
		var vendorPrefixes = ['-moz-', '-webkit-', '-khtml-', '-ms-', '-o-'];
		if ( propertiesWithoutUnit.indexOf(prop) > -1 ) {
			return true;
		}
		for ( var i = 0, l = vendorPrefixes.length; i < l; i++ ) {
			var propWithoutPrefix = prop.replace(new RegExp('^' + vendorPrefixes[i], 'i'), '');
			if ( propertiesWithoutUnit.indexOf(propWithoutPrefix) > -1 ) {
				return true;
			}
		}
		return false;
	};

	return function(template){
		return new function(){
			this.template = template;
			this.toHTML = function(){
				return handleDOMTree(this.template);
			};
			this.toCSS = function(){
				return handleCSS(this.template);
			};
			this.toDOM = function(){
				return HTMLToDOM( this.toHTML(this.template) );
			};
		}
	};

}());
