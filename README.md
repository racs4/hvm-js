HVM on JavaScript
=================

[HVM](https://github.com/kindelia/hvm) is now available as a JavaScript library!

To use it, first install with `npm`:

```
npm i --save hvm-js
```

Then, import it:

```javascript
// On Node.js
var hvm = require("hvm-js");

// On the browser
import * as hvm from "hvm-js";
```

Then, create a runtime from an HVM source code:

```javascript
// Instantiates an HVM runtime given a source code
var rt = await hvm.runtime(`
  (U60.sum 0) = 0
  (U60.sum n) = (+ n (U60.sum (- n 1)))
`);
```

Finally, evaluate expressions to normal form with `rt.eval`:

```
console.log(rt.eval("(U60.sum 10000000)"));
```

You can also handle HVM's memory directly:

```javascript
// Allocates an expression without reducing it
let loc = rt.alloc_code("(U60.sum 10)");

// Reduces it to weak head normal form:
rt.reduce(loc);

// If the result is a number, print its value:
let term = rt.at(loc);
if (rt.get_tag(term) == rt.NUM) {
  console.log("Result is Num(" + rt.get_val(term) + ")");
}
```

This allows you to reduce a term lazily, layer by layer. This is useful, for
example, to implement IO actions and FFI with your app.
