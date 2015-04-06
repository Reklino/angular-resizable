# angular-resizable
A   directive for creating resizable containers.

## Why?
All other resizable directive concepts I came across include layout logic in the directive. I wanted a directive that only handled the resize logic. This way, the layout logic is quarantined to the CSS.

## Usage

1. `bower install angular-resizable`
2. Include `angluar-resizable.js` in your project.
3. Include `angluar-resizable.css` in your project as well (this provides default styling for the resize handles).
4. Then include the module in your app: `angular.module('app', ['resizable'])`
5. Use it: `<section resizable r-directions="['bottom', 'right']" r-flex="true">`

Include any sides you want to be resizable in an array inside `r-directions`. Accepts 'top','right','bottom', and 'left'

## Options

Attribute | Default | Accepts | Description
--- | --- | --- | ---
r-directions | ['right'] | ['top', 'right', 'bottom', 'left',] | Determines which sides of the element are resizable.
r-flex | false | boolean | Set as true if you are using flexbox.[See the example](http://codepen.io/Reklino/pen/raRaXq).

## Liscense

MIT