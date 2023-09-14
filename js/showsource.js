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
    // The indentation to be used (the spaces at the beginning of the line)
    indentation: "  ",
    // Hide this element (does not affect to its children); data-showsource-hide or data-showsource-hide="true" to hide the element
    hide: false,
    // Hide these elements (i.e. the tag) itself (does not affect to its children). The syntax is as in querySelector; data-showsource-hide-selector="h1,h2,h3,h4,h5,h6,p" to hide the child elements that match these selectors
    hideSelector: null,
    // Add to hide list (not overwrite the list) (*) created to be used in the declarative version in the data-showsource-hide-elements-add; has no sense in the programmatic version (not inherited)
    hideSelectorAdd: null,
    // Skip the current element, along with its children; data-showsource-skip or data-showsource-skip="true" to skip the element (not inherited)
    skip: false,
    // Skip these elements (along with its children). The syntax is as in querySelector; data-showsource-skip-selector="h1,h2,h3,h4,h5,h6,p" to skip the element that match these selectors
    skipSelector: null,
    // Add to skipSelector list (not overwrite the list) (*) created to be used in the declarative version in the data-showsource-skip-selector-add; has no sense in the programmatic version (not inherited)
    skipSelectorAdd: null,
    // Skip the children of the element, but not the element itself; data-showsource-skip-children="true" or simply data-showsource-skip-children to skip the children
    skipChildren: false,
    // Hide the attributes related to this plugin; data-showsource-hide-plugin="true" or simply data-showsource-hide-plugin to hide the attributes related to this plugin
    hidePlugin: true,
    // The attributes to be removed from the element; data-showsource-remove-attributes="class style" to remove these attributes from the element
    removeAttributes: null,
    // The class attribute to add to the main container div; data-showsource-class="showsource myclass" to add the classes "showsource" and "myclass" to the main container div
    class: "showsource",
    // Tag length limit; data-showsource-tag-line-break="80" to break the tag in a new line if the tag is longer than 80 characters
    tagLineBreak: null,
    // Max attributes in a row; data-showsource-max-attributes-per-line="3" to break the attributes in a new line if there are more than 3 attributes in a row
    maxAttributesPerLine: null,
    // Separate these elements in a new line; data-showsource-separate-elements="div p" to separate the elements that match each regex in a new line (space separated)
    separateElements: null,
};

/**
 * Obtains the definition of an HTML element, and returns it as a string in a beautiful format
 * @param {*} element, the element to be beautified
 * @param {*} indent, the indentation to be used (the spaces at the beginning of the line)
 * @returns 
 */
function extractCode(el, userOptions = {}, indent = "") {

    let elOptions = {};
    if (el.dataset.showsourceIndentation !== undefined) {
        elOptions.indentation = el.dataset.showsourceIndentation;
    }

    if (el.dataset.showsourceSkipSelector !== undefined) {
        elOptions.skipSelector = el.dataset.showsourceSkipSelector;
    }

    if (el.dataset.showsourceSkipSelectorAdd !== undefined) {
        elOptions.skipSelectorAdd = el.dataset.showsourceSkipSelectorAdd;
    }

    if (el.dataset.showsourceHide !== undefined) {
        elOptions.hide = el.dataset.showsourceHide.toLowerCase() != "false";
    }

    if (el.dataset.showsourceHideSelector !== undefined) {
        elOptions.hideSelector = el.dataset.showsourceHideSelector;
    }

    if (el.dataset.showsourceHideSelectorAdd !== undefined) {
        elOptions.hideSelectorAdd = el.dataset.showsourceHideSelectorAdd;
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

    if (typeof options.skipSelector === "string") {
        // We'll remove the elements that the user wants to remove
        let elementsSkip = options.skipSelector.split(",").filter(e => e.trim() !== "").join(",");
        if (elementsSkip.trim() != "") {
            if (el.matches(elementsSkip)) {
                return [];
            }
        }
    }

    if (typeof options.skipSelectorAdd === "string") {
        if ((options.skipSelector === undefined) || (options.skipSelector === null)) {
            options.skipSelector = options.skipSelectorAdd;
        }
        else {
            options.skipSelector += ", " + options.skipSelectorAdd;
        }
    }

    if (typeof options.hideSelectorAdd === "string") {
        if ((options.hideSelector === undefined) || (options.hideSelector === null)) {
            options.hideSelector = options.hideSelectorAdd;
        } else {
            options.hideSelector += "," + options.hideSelectorAdd;
        }
    }

    // The inherited options will be passed to the children
    let childOptions = Object.assign({}, userOptions, {
        indentation: options.indentation,
        hidePlugin: options.hidePlugin,
        tagLineBreak: options.tagLineBreak,
        maxAttributesPerLine: options.maxAttributesPerLine,
        separateElements: options.separateElements,
        skipSelector: options.skipSelector,
        hideSelector: options.hideSelector,
    });

    let beautifulElement = [];

    if (! options.hide) {
        if (typeof options.hideSelector === "string") {
            // We'll remove the elements that the user wants to remove
            let elementsHide = options.hideSelector.split(",").filter( x => x.trim() !== "").join(",");
            if (elementsHide.trim() != "") {
                options.hide = el.matches(elementsHide);
            }
        }
    }

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
                beautifulElement.push(indent + "</" + el.tagName.toLowerCase() + ">");
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
                    let beautifulChild = extractCode(child, childOptions, indent + (options.hide?"":options.indentation));
                    beautifulElement = beautifulElement.concat(beautifulChild);
                }
            }
        }
        if (!options.hide) {
            beautifulElement.push(indent + "</" + el.tagName.toLowerCase() + ">");
        }
    }

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
        code.textContent = extractCode(el).join("\n");
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
    extract: extractCode,
    init: init,
    version: "1.2.0"
}