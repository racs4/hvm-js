import boot_hvm from "./hvm.js";
import * as hvm_nodejs from "hvm-nodejs";

import readline from "readline";

export default function init_hvm(code) {
  var rt = boot_hvm(() => {}, hvm_nodejs)(code);
  rt.do_input = do_input;
  rt.do_output = do_output;
  return rt;
}

async function do_input() {
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  });
  return new Promise((resolve, reject) => {
    rl.question("", function (inp) {
      rl.close();
      resolve(inp);
    });
  });
}

async function do_output(txt) {
  process.stdout.write(txt);
  return 0n;
}
