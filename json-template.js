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

function getElementHtml(data){

    var output = [];
    
    if ( data.tagName ) {

        output.push('<' + data.tagName);

        if ( data.id ) {
            output.push(' id="' + data.id + '"');
        }
        if ( data.classNames && data.classNames.length ) {
            output.push(' class="' + data.classNames.join(' ') + '"');
        }
        if ( data.attributes && data.attributes.length ) {
            data.attributes.forEach(function(attribute){
                output.push(' ' + attribute.name);
                if ( attribute.value ) {
                    output.push('="' + attribute.value + '"');
                }
            });
        }
        
        output.push('>');

        if ( !isEmptyTag(data.tagName) ) {
            if ( data.innerText ) {
                output.push(escapeText(data.innerText));
            }
            output.push(( data.children || '' ) + '</' + data.tagName + '>');
        }
    }
    else if ( data.innerText ) {
        output.push(escapeText(data.innerText));
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

    return getElementHtml({
        id: parseId(trimmed),
        tagName: parseTagName(trimmed),
        classNames: parseClassNames(trimmed),
        attributes: parseAttributes(firstNode),
        innerText: parseInnerText(firstNode),
        children: childNodeHtml
    });
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
