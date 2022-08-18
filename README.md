HVM on JavaScript
=================

[HVM](https://github.com/kindelia/hvm) is now available as a JavaScript library!

Installing
----------


Usage
-----

1. Install

    ```bash
    npm i --save hvm-js
    ```

2. Import

    ```javascript
    // On Node.js
    var hvm = require("hvm-js");

    // On the browser
    import * as hvm from "hvm-js";
    ```

3. Instantiate a runtime

    ```javascript
    // Instantiates an HVM runtime given a source code
    var rt = await hvm.runtime(`
      (U60.sum 0) = 0
      (U60.sum n) = (+ n (U60.sum (- n 1)))
    `);
    ```

4. Evaluate expressions

    ```javascript
    console.log(rt.eval("(U60.sum 10000000)"));
    ```

5. Advanced: weak normal form

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
