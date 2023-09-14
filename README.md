# Extract HTML code from HTML documents (showsource)

This library enables to extract HTML code from the current HTML document, and to add it to the current document in the form of source code.

The library is useful for showing the source code of the current HTML document, and its origin was to ease the creation of web pages for examples of HTML and CSS fragments. My problem was that I wanted to show the example and the code that generated it, but I did not want to maintain two separate code-fragments. This library solves this problem by extracting the HTML code from an element from the current document and adding it to the document in the form of source code.

## Use case

The idea is that if we include the following code in the HTML document:

```html
<div class="example" data-showsource>
    <h2>Simple example</h2>
    <p><span class="fw-bold">hint:</span> add the <span class="fw-bold">data-showsource</span> attribute to the element that we want to extract the html content and to add the result after it.</p>
    <p>the default behavior is to hide the root element (in this case, <span class="fw-bold">data-showsource</span>)</p>
    <div class="d-flex">
        <img src="https://picsum.photos/400/200" class="mx-auto">
    </div>
</div>
```

The result will be as shown in the image below: we'll have a block with a title, the texts, and the image. By including the attribute `data-showsource`, in the envelope (i.e. the _example_ `div`), we'll have the source code of the block after it.

![Simple example](img/example.png)

Once generated, we can use the library [highlightjs](https://highlightjs.org/) to highlight the source code (but this library does not require it).

## Usage

The library is available in the form of a CDN, so we can include it in our HTML document as follows:

```html
<script src="https://cdn.jsdelivr.net/gh/dealfonso/showsource@1/dist/showsource.min.js"></script>
```

The library will discover any element with the `data-showsource` attribute and will add the source code of the element after it.

### Declarative

The library can be used in a declarative way, by adding the `data-showsource` attribute to the element that we want to extract the HTML content and to add the result after it. A simple example is shown below:

```html
<div class="example" data-showsource>
    <h2>Simple example</h2>
    <div class="d-flex">
        <img src="https://picsum.photos/400/200" class="mx-auto">
    </div>
</div>
```

### Javascript API

It is also possible to use the library from Javascript. So, we can use it to extract the HTML code from an element in a beautiful format (i.e. with indentation and line breaks). Then we can use the result to show it in a dialog, or to add it to the document in a different way.

The library will be available in the global variable `showsource` with the following methods:
- `showsource.extract(el, userOptions = {}, indent = "")` - returns a list of strings with the HTML source code of the element `el` and its children. The `userOptions` parameter is optional and allows to customize the behavior of the function. The `indent` parameter is optional and is used to indent the source code.

- `showsource.init()` - discovers any element with the `data-showsource` attribute and adds the source code of the element after it. The function returns the list of elements that have been processed.

    This method is called automatically when the library is loaded, but it can be called again if we add new elements with the `data-showsource` attribute.

An example of usage is shown below:

```javascript
// get the element that we want to extract the html content
const el = document.querySelector(".example");
let lines = showsource.extract(el);

// add the source code to the document
el.insertAdjacentHTML("afterend", `<pre><code>${lines.join("\n")}</code></pre>`);
```

### Options

The `showsource.extract` method accepts an optional `userOptions` parameter that allows to customize the behavior of the function. The following options are available:

```javascript
{
// The indentation to be used (the spaces at the beginning of the line)
indentation: "  ",
// Hide this element (does not affect to its children); data-showsource-hide or data-showsource-hide="true" to hide the element
hide: false,
// Hide these elements (i.e. the tag)  (does not affect to its children). The syntax is as in querySelector; data-showsource-hide-selector="h1,h2,h3,h4,h5,h6,p" to hide the child elements that match these selectors
hideSelector: null,
// Add to hide list (not overwrite the list) (*) created to be used in the declarative version in the data-showsource-hide-elements-add; has no sense in the programmatic version (not inherited)
hideSelectorAdd: null,
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
// Number of characters to break the line of the tag; data-showsource-tag-line-break="80" to break the tag in a new line if the tag is longer than 80 characters
tagLineBreak: null,
// Max attributes number of consecutive attributes that may appear in a line; data-showsource-max-attributes-per-line="3" to break the attributes in a new line if there are more than 3 attributes in a row
maxAttributesPerLine: null,
// Space separated regular expressions that make that one attribute whose start matches any of them is rendered in a single line (i.e. no other attribute is rendered in the same line); e.g. if the value is data-* then all the attributes starting with data- will be rendered in a single line
separateElements: null, 
}
```

The options can also be used in the declarative way, by adding the `data-showsource-*` attributes to the element that we want to extract the HTML content and to add the result after it.

The possible options are:
- `data-showsource-indentation` is the indentation to be used (the spaces at the beginning of the line), that will be accumulated when rendering the children. The default value is two spaces, so that the source corresponding to the children of the element will have two extra spaces at the beginning. The value is inheritable to the children.
- `data-showsource-hide` instructs the library to hide the render of the current element (i.e. the tag) itself, but not its children. The children will be rendered at the level of the current element. The default value is `false`.
- `data-showsource-hide-selector` instructs the library to hide the render of the elements that match the selector (including the current element). The syntax is the same than using `document.querySelector`. The default value is `null`.
- `data-showsource-hide-selector-add` is a list to be added to the list of selectors to hide. The syntax is the same than using `document.querySelector`. The default value is `null`. It has no sense in the programmatic version (not inherited).
- `data-showsource-skip` instructs the library to skip the element, along with its children. The default value is `false`.
- `data-showsource-skip-selector` instructs the library to skip the elements that match the selector, along with its children. The syntax is the same than using `document.querySelector`. The default value is `null`.
- `data-showsource-skip-selector-add` is a list to be added to the list of selectors to skip. The syntax is the same than using `document.querySelector`. The default value is `null`. It has no sense in the programmatic version (not inherited).
- `data-showsource-skip-children` instruct the library to the children of the element, but not the element itself. The default value is `false`.
- `data-showsource-hide-plugin` instructs the library to hide the attributes related to this plugin (i.e. the `data-showsource-*` attributes). The default value is `true`. This attribute is inheritable to the children.
- `data-showsource-remove-attributes` is a space separated list of the attributes to be hidden from the element. The default value is `null`.
- `data-showsource-class` is a space separated list of classes to add to the main container div. The default value is `showsource`.
- `data-showsource-tag-line-break` is the number of characters to break the line of the tag. The default value is `null` (i.e. deactivated). This attribute is inheritable to the children.
- `data-showsource-max-attributes-per-line` is the max number of consecutive attributes that may appear in a line. The default value is `null` (i.e. deactivated). This attribute is inheritable to the children.
- `data-showsource-separate-elements` is a space separated list of regular expressions that makes that one attribute that starts matching any of them is rendered in a single line with no other attribute in the same line; e.g. if the value is `data-*` then all the attributes starting with `data-` will be rendered in a single line. The default value is `null` (i.e. deactivated). This attribute is inheritable to the children.

### Default options

The default options can be changed by modifying the `showsource.defaults` object. For example, to change the default indentation to four spaces, we can do the following after including the library:

```javascript
showsource.defaults.indentation = "    ";
```

To skip the elements that only add text, when using comments while showing how to use a library, we can do the following:

```javascript
showsource.defaults.skipSelector = "h1,h2,h3,h4,h5,h6,p";
```