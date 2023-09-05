/**
    MIT License

    Copyright (c) 2023 Carlos de Alfonso (https://github.com/dealfonso)

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE.
*/

'use strict';

let defaultOptions = {
    // The indentation to be used (the spaces at the beginning of the line) (inheritable)
    indentation: "  ",
    // Remove the children of these types of elements
    remove: "h1 h2 h3 h4 h5 h6 p",
    // Hide the element (i.e. the tag) itself, but not its children
    hide: false,
    // Skip the element, along with its children
    skip: false,
    // Skip the children of the element, but not the element itself
    skipChildren: false,
    // Hide the attributes related to this plugin (inheritable)
    hidePlugin: true,
    // The attributes to be removed from the element
    removeAttributes: null,
    // The class attribute to add to the main container div
    class: "showsource",
    // Tag length limit
    tagLineBreak: null,
    // Max attributes in a row
    maxAttributesPerLine: null,
    // Separate these elements in a new line
    separateElements: null,
};

/**
 * Obtains the definition of an HTML element, and returns it as a string in a beautiful format
 * @param {*} element, the element to be beautified
 * @param {*} indent, the indentation to be used (the spaces at the beginning of the line)
 * @returns 
 */
function beautify(el, userOptions = {}, indent = "") {

    let elOptions = {};
    if (el.dataset.showsourceIndentation !== undefined) {
        elOptions.indentation = el.dataset.showsourceIndentation;
    }

    if (el.dataset.showsourceRemove !== undefined) {
        elOptions.remove = el.dataset.showsourceRemove;
    }

    if (el.dataset.showsourceHide !== undefined) {
        elOptions.hide = el.dataset.showsourceHide.toLowerCase() != "false";
    }

    if (el.dataset.showsourceSkip !== undefined) {
        elOptions.skip = el.dataset.showsourceSkip.toLowerCase() != "false";
    }

    if (el.dataset.showsourceSkipChildren !== undefined) {
        elOptions.skipChildren = el.dataset.showsourceSkipChildren.toLowerCase() != "false";
    }

    if (el.dataset.showsourceHidePlugin !== undefined) {
        elOptions.hidePlugin = el.dataset.showsourceHidePlugin.toLowerCase() != "false";
    }

    if (el.dataset.showsourceTagLineBreak != undefined) {
        elOptions.tagLineBreak = parseInt(el.dataset.showsourceTagLineBreak);
    }

    if (el.dataset.showsourceMaxAttributesPerLine != undefined) {
        elOptions.maxAttributesPerLine = parseInt(el.dataset.showsourceMaxAttributesPerLine);
    }

    if (el.dataset.showsourceSeparateElements != undefined) {
        elOptions.separateElements = el.dataset.showsourceSeparateElements;
    }

    let options = Object.assign({}, defaultOptions, window.showsource.defaults, elOptions, userOptions);

    if (options.skip) {
        return [];
    }

    // We are cloning the element, so that we can remove it from the DOM, without affecting the original element
    el = el.cloneNode(true);

    // The inherited options will be passed to the children
    let childOptions = Object.assign({}, userOptions, {
        indentation: options.indentation,
        hidePlugin: options.hidePlugin,
        tagLineBreak: options.tagLineBreak,
        maxAttributesPerLine: options.maxAttributesPerLine,
        separateElements: options.separateElements
    });

    if (typeof options.remove === "string") {
        // We'll remove the elements that the user wants to remove
        let elementsRemove = options.remove.split(" ").join(",");
        if (elementsRemove.trim() != "") {
            el.querySelectorAll(elementsRemove).forEach(function (e) {
                e.remove();
            });
        }
    }

    let beautifulElement = [];

    if (!options.hide) {
        beautifulElement.push(indent + "<" + el.tagName.toLowerCase());
        // We'll add the attributes to the tag, but after each "data-" attribute, we'll add a new line
        let removeAttributes = [];
        if (typeof options.removeAttributes === "string") {
            removeAttributes = options.removeAttributes.split(" ");
        }

        let separateRegex = [];
        if (typeof options.separateElements === "string") {
            let separateElements = options.separateElements.split(" ");
            for (let separateElement of separateElements) {
                // Convert the element to a regular expression
                separateElement = separateElement.replace(/\*/g, ".*");
                separateRegex.push(new RegExp(separateElement));
            }
        }

        let attributesInRow = 0;
        let separatingRegex = null;
        for (let attribute of el.attributes) {
            if (attribute.name.startsWith("data-showsource")) {
                if (options.hidePlugin) {
                    continue;
                }
            }
            if (removeAttributes.includes(attribute.name)) {
                continue;
            }

            let attributeString = `${attribute.name}="${attribute.value}"`;

            let matchRegex = null;
            if (separateRegex.length > 0) {
                for (let regex of separateRegex) {
                    if (regex.test(attribute.name)) {
                        matchRegex = regex;
                        break;
                    }
                }
            }

            if (matchRegex !== null) {
                // Have to separate the element
                beautifulElement.push(" " + indent + attributeString);
                attributesInRow = 1;
                separatingRegex = matchRegex;
                continue;
            }

            if (separatingRegex !== null) {
                beautifulElement.push(" " + indent + attributeString);
                attributesInRow = 1;
                separatingRegex = null;
                continue;
            }

            if ((options.maxAttributesPerLine !== null) && (attributesInRow >= options.maxAttributesPerLine)) {
                beautifulElement.push(" " + indent + attributeString);
                attributesInRow = 1;
                continue;
            } 

            if ((options.tagLineBreak !== null) && ((attributeString.length + beautifulElement[beautifulElement.length - 1].length)> options.tagLineBreak)) {
                beautifulElement.push(" " + indent + attributeString);
                attributesInRow = 1;
                continue;
            } 
            beautifulElement[beautifulElement.length - 1] += " " + attributeString;
            attributesInRow++;
        }
    }

    // We are checking if the element has children (different from text nodes; that is why we are using child here, and not childNodes)
    if ((el.children.length == 0) && (!options.hide)) {
        let selfClosingTags = ["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"];
        if (selfClosingTags.includes(el.tagName.toLowerCase())) {
            // If it is a self-closing tag, we'll not add the closing tag (i.e. </...>)
            beautifulElement[beautifulElement.length - 1] += ">" + el.innerHTML.trim();
        } else {
            let literalTags = [ "script", "style" ];
            if (literalTags.includes(el.tagName.toLowerCase())) {
                beautifulElement[beautifulElement.length - 1] += ">";

                // Remove blank lines from the beginning and the end
                let lines = el.innerHTML.split("\n");
                while (lines.length > 0 && lines[0].trim() == "") {
                    lines.shift();
                }
                while (lines.length > 0 && lines[lines.length - 1].trim() == "") {
                    lines.pop();
                }
                beautifulElement.push(lines.join("\n"));
                beautifulElement.push("</" + el.tagName.toLowerCase() + ">");
            } else {
                // If we have separated the tag in multiple lines, we'll add the closing tag in a new line; otherwise, we'll add it in the same line
                if (beautifulElement.length > 1) {
                    beautifulElement[beautifulElement.length - 1] += ">" + el.innerHTML.trim()
                    beautifulElement.push(indent + "</" + el.tagName.toLowerCase() + ">");
                } else {
                    beautifulElement[beautifulElement.length - 1] += ">" + el.innerHTML.trim() + "</" + el.tagName.toLowerCase() + ">";
                }
            }
        }
    } else {
        if (!options.hide) {
            // If the element has children, we'll add the beautiful definition of the children
            beautifulElement[beautifulElement.length - 1] += ">";
        }
        if (!options.skipChildren) {
            for (let child of el.childNodes) {
                if (child.nodeType == Node.TEXT_NODE) {
                    let text = child.textContent.trim();
                    if (text !== "") {
                        beautifulElement.push(indent + options.indentation + text);
                    }
                } else {
                    let beautifulChild = beautify(child, childOptions, indent + (options.hide?"":options.indentation));
                    beautifulElement = beautifulElement.concat(beautifulChild);
                }
            }
        }
        if (!options.hide) {
            beautifulElement.push(indent + "</" + el.tagName.toLowerCase() + ">");
        }
    }

    // Remove the cloned element from the DOM
    el.remove();
    return beautifulElement;
}

function init() {
    document.querySelectorAll("div[data-showsource]").forEach(function (el) {

        let classString = defaultOptions.class;
        if (el.dataset.showsourceClass !== undefined) {
            if (typeof el.dataset.showsourceClass === "string") {
                classString = el.dataset.showsourceClass;
            } else {
                console.error("The value of the data-showsource-class attribute must be a string");
            }
        }

        let container = document.createElement("div");
        let pre = document.createElement("pre");
        let code = document.createElement("code");
        code.textContent = beautify(el).join("\n");
        pre.appendChild(code);
        container.appendChild(pre);

        classString.split(" ").forEach(function (c) {
            container.classList.add(c);
        });

        el.parentNode.insertBefore(container, el.nextSibling);
    });
}

if (document.addEventListener) {
    document.addEventListener("DOMContentLoaded", function () {
        init();
    });
}

window.showsource = {
    defaults: Object.assign({}, defaultOptions),
    beautify: beautify,
    init: init,
    version: "1.1.1"
}