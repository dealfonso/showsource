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

(function(window, document) {
    "use strict";
    let defaultOptions = {
        indentation: "  ",
        remove: "h1 h2 h3 h4 h5 h6 p",
        hide: false,
        skip: false,
        skipChildren: false,
        hidePlugin: true,
        removeAttributes: null,
        class: "showsource",
        tagLengthLimit: 100,
        maxAttributesInRow: 3,
        separateElements: "data-*"
    };
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
        let options = Object.assign({}, defaultOptions, elOptions, userOptions);
        if (options.skip) {
            return [];
        }
        el = el.cloneNode(true);
        let childOptions = Object.assign({}, userOptions, {
            indentation: options.indentation,
            hidePlugin: options.hidePlugin
        });
        if (typeof options.remove === "string") {
            let elementsRemove = options.remove.split(" ").join(",");
            if (elementsRemove.trim() != "") {
                el.querySelectorAll(elementsRemove).forEach(function(e) {
                    e.remove();
                });
            }
        }
        let beautifulElement = [];
        if (!options.hide) {
            beautifulElement.push(indent + "<" + el.tagName.toLowerCase());
            let removeAttributes = [];
            if (typeof options.removeAttributes === "string") {
                removeAttributes = options.removeAttributes.split(" ");
            }
            let separateRegex = [];
            if (typeof options.separateElements === "string") {
                let separateElements = options.separateElements.split(" ");
                for (let separateElement of separateElements) {
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
                if (attributesInRow >= options.maxAttributesInRow) {
                    beautifulElement.push(" " + indent + attributeString);
                    attributesInRow = 1;
                    continue;
                }
                if (attributeString.length + beautifulElement[beautifulElement.length - 1].length > options.tagLengthLimit) {
                    beautifulElement.push(" " + indent + attributeString);
                    attributesInRow = 1;
                    continue;
                }
                beautifulElement[beautifulElement.length - 1] += " " + attributeString;
                attributesInRow++;
            }
        }
        if (el.children.length == 0 && !options.hide) {
            let selfClosingTags = [ "area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr" ];
            if (selfClosingTags.includes(el.tagName.toLowerCase())) {
                beautifulElement[beautifulElement.length - 1] += ">" + el.innerHTML.trim();
            } else {
                let literalTags = [ "script", "style" ];
                if (literalTags.includes(el.tagName.toLowerCase())) {
                    beautifulElement[beautifulElement.length - 1] += ">";
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
                    if (beautifulElement.length > 1) {
                        beautifulElement[beautifulElement.length - 1] += ">" + el.innerHTML.trim();
                        beautifulElement.push(indent + "</" + el.tagName.toLowerCase() + ">");
                    } else {
                        beautifulElement[beautifulElement.length - 1] += ">" + el.innerHTML.trim() + "</" + el.tagName.toLowerCase() + ">";
                    }
                }
            }
        } else {
            if (!options.hide) {
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
                        let beautifulChild = beautify(child, childOptions, indent + (options.hide ? "" : options.indentation));
                        beautifulElement = beautifulElement.concat(beautifulChild);
                    }
                }
            }
            if (!options.hide) {
                beautifulElement.push(indent + "</" + el.tagName.toLowerCase() + ">");
            }
        }
        el.remove();
        return beautifulElement;
    }
    function init() {
        document.querySelectorAll("div[data-showsource]").forEach(function(el) {
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
            classString.split(" ").forEach(function(c) {
                container.classList.add(c);
            });
            el.parentNode.insertBefore(container, el.nextSibling);
        });
    }
    if (document.addEventListener) {
        document.addEventListener("DOMContentLoaded", function() {
            init();
        });
    }
    window.showsource = {
        beautify: beautify,
        init: init,
        version: "1.1.0"
    };
})(window, document);
