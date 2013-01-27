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
    var tagName = /^[a-z]+/i.exec(expression);
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
        .replace(/\:.*$/, '')
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
    var text = /\:.*$/i.exec(expression);
    if ( text ) {
        return text[0].substr(1);
    }
};

function handleExpression(expression){
    var firstNode = parseFirstNode(expression);
    var trimmed = trimExpression(firstNode);
    var childNodeExpression = expression.substr(firstNode.length).replace(/^\s*>\s*/, '');
    var childNodeHtml;
    if ( !/^\s*$/.test(childNodeExpression) ) {
        childNodeHtml = handleExpression(childNodeExpression);
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

function getElementHtml(data){

    var html = [];
    
    if ( data.tagName ) {

        html.push('<' + data.tagName);

        if ( data.id ) {
            html.push(' id="' + data.id + '"');
        }
        if ( data.classNames && data.classNames.length ) {
            html.push(' class="' + data.classNames.join(' ') + '"');
        }
        if ( data.attributes && data.attributes.length ) {
            data.attributes.forEach(function(attribute){
                html.push(' ' + attribute.name);
                if ( attribute.value ) {
                    html.push('="' + attribute.value + '"');
                }
            });
        }
        
        html.push('>');

        if ( !isEmptyTag(data.tagName) ) {
            if ( data.innerText ) {
                html.push(escapeText(data.innerText));
            }
            html.push(( data.children || '' ) + '</' + data.tagName + '>');
        }
    }
    else if ( data.innerText ) {
        html.push(escapeText(data.innerText));
    }
    
    return html.join('');
};

function trimExpression(expression){
    return expression
        .replace(/\:.*$/, '')
        .replace(/\[.*\]/, '');
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

