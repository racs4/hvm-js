import boot_hvm from "./hvm.js";
import init, * as hvm from "hvm-web";

export default function init_hvm(code) {
  var rt = boot_hvm(init, hvm_web)(code);
  rt.do_input = do_input;
  rt.do_output = do_output;
  return rt;
}

async function do_input() {
  return prompt("Input:");
}

async function do_output(txt) {
  console.log(txt);
  return 0n;
}
