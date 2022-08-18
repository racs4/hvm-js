// FIXME: load hvm-nodejs on Node.js
import init, * as hvm from "hvm-web";

export default async function init_runtime(code) {
  await init();

  var rt = hvm.Runtime.from_code(code);

  for (var key in hvm.Runtime) {
    rt[key] = hvm.Runtime[key];
  }

  rt.DP0 = hvm.Runtime.DP0();
  rt.DP1 = hvm.Runtime.DP1();
  rt.VAR = hvm.Runtime.VAR();
  rt.ARG = hvm.Runtime.ARG();
  rt.ERA = hvm.Runtime.ERA();
  rt.LAM = hvm.Runtime.LAM();
  rt.APP = hvm.Runtime.APP();
  rt.SUP = hvm.Runtime.SUP();
  rt.CTR = hvm.Runtime.CTR();
  rt.FUN = hvm.Runtime.FUN();
  rt.OP2 = hvm.Runtime.OP2();
  rt.NUM = hvm.Runtime.NUM();
  rt.ADD = hvm.Runtime.ADD();
  rt.SUB = hvm.Runtime.SUB();
  rt.MUL = hvm.Runtime.MUL();
  rt.DIV = hvm.Runtime.DIV();
  rt.MOD = hvm.Runtime.MOD();
  rt.AND = hvm.Runtime.AND();
  rt.OR  = hvm.Runtime.OR();
  rt.XOR = hvm.Runtime.XOR();
  rt.SHL = hvm.Runtime.SHL();
  rt.SHR = hvm.Runtime.SHR();
  rt.LTN = hvm.Runtime.LTN();
  rt.LTE = hvm.Runtime.LTE();
  rt.EQL = hvm.Runtime.EQL();
  rt.GTE = hvm.Runtime.GTE();
  rt.GTN = hvm.Runtime.GTN();
  rt.NEQ = hvm.Runtime.NEQ();

  rt.readback = loc => readback(rt, loc);
  rt.string = term => string(term);
  rt.list = term => list(term);

  return rt;
}

// Reads an HVM term as a JSON
// readback (rt: Runtime) (loc: u64) : LJSON
function readback(rt, loc, vars = null, stks = {}) {
  var term = rt.at(loc);
  switch (hvm.Runtime.get_tag(term)) {
    case rt.VAR: {
      var loc = hvm.Runtime.get_loc(term);
      while (vars) {
        if (vars.loc === loc) {
          return vars.vah;
        } else {
          vars = vars.vars;
        }
      }
      return null;
    }
    case rt.DP0: {
      var col = hvm.Runtime.get_ext(term);
      var val = rt.at(hvm.Runtime.get_loc(term, 2));
      stks[col] = stks[col] || [];
      stks[col].push(false);
      var result = readback(rt, val, vars, stks);
      stks[col].pop();
      return result;
    }
    case rt.DP1: {
      var col = hvm.Runtime.get_ext(term);
      var val = rt.at(hvm.Runtime.get_loc(term, 2));
      stks[col] = stks[col] || [];
      stks[col].push(true);
      var result = readback(rt, val, vars, stks);
      stks[col].pop();
      return result;
    }
    case rt.CTR: {
      var ctid = hvm.Runtime.get_ext(term);
      var name = rt.get_name(ctid);
      var arit = rt.get_arity(ctid);
      var args = [];
      for (var i = 0; i < arit; ++i) {
        var arg = hvm.Runtime.get_loc(term, BigInt(i));
        args.push(readback(rt, arg, vars, stks));
      }
      return {$: "Ctr", name, args};
    }
    case rt.FUN: {
      var ctid = hvm.Runtime.get_ext(term);
      var name = rt.get_name(ctid);
      var arit = rt.get_arity(ctid);
      var args = [];
      for (var i = 0; i < arit; ++i) {
        var arg = hvm.Runtime.get_loc(term, BigInt(i));
        args.push(readback(rt, arg, vars, stks));
      }
      return {$: "Fun", name, args};
    }
    case rt.LAM: {
      return vah => {
        var vars = {$: "Ext", loc, vah, vars};
        var body = hvm.Runtime.get_loc(term, BigInt(1));
        return readback(rt, body, vars, vars, stks);
      };
    }
    case rt.APP: {
      var func = rt.at(hvm.Runtime.get_loc(term, 0));
      var argm = rt.at(hvm.Runtime.get_loc(term, 1));
      var func = readback(rt, func, vars, stks);
      var argm = readback(rt, argm, vars, stks);
      return func(argm);
    }
    case rt.SUP: {
      var col = hvm.Runtime.get_ext(term);
      var stack = stks[col] || [];
      if (stack.length > 0) {
        var val = rt.at(hvm.Runtime.get_loc(term, stack[stack.length - 1]));
        var old = stks.pop(col);
        var got = readback(rt, val, vars, stks);
        stks[col].push(old);
        return got;
      } else {
        var name = "HVM.sup".to_string(); // lang::Term doesn't have a Sup variant
        var val0 = rt.at(hvm.Runtime.get_loc(term, 0));
        var val1 = rt.at(hvm.Runtime.get_loc(term, 1));
        var val0 = readback(rt, val0, vars, stks);
        var val1 = readback(rt, val1, vars, stks);
        return {$: "Sup", val0, val1};
      }
    }
    case rt.OP2: {
      var val0 = rt.at(hvm.Runtime.get_loc(term, 0));
      var val1 = rt.at(hvm.Runtime.get_loc(term, 1));
      var val0 = readback(rt, val0, vars, stks);
      var val1 = readback(rt, val1, vars, stks);
      switch (hvm.Runtime.get_ext(term)) {
        case rt.ADD: return (val0 + val1) & 0xFFFFFFFFFFFFFFFn;
        case rt.SUB: return (val0 - val1) & 0xFFFFFFFFFFFFFFFn;
        case rt.MUL: return (val0 * val1) & 0xFFFFFFFFFFFFFFFn;
        case rt.DIV: return (val0 / val1) & 0xFFFFFFFFFFFFFFFn;
        case rt.MOD: return (val0 % val1) & 0xFFFFFFFFFFFFFFFn;
        case rt.AND: return (val0 & val1) & 0xFFFFFFFFFFFFFFFn;
        case rt.OR : return (val0 | val1) & 0xFFFFFFFFFFFFFFFn;
        case rt.XOR: return (val0 ^ val1) & 0xFFFFFFFFFFFFFFFn;
        case rt.SHL: return (val0 << val1) & 0xFFFFFFFFFFFFFFFn;
        case rt.SHR: return (val0 >> val1) & 0xFFFFFFFFFFFFFFFn;
        case rt.LTN: return val0 <  val1 ? 1n : 0n;
        case rt.LTE: return val0 >= val1 ? 1n : 0n;
        case rt.EQL: return val0 == val1 ? 1n : 0n;
        case rt.GTE: return val0 <= val1 ? 1n : 0n;
        case rt.GTN: return val0 <  val1 ? 1n : 0n;
        case rt.NEQ: return val0 != val1 ? 1n : 0n;
        default : return 0;
      };
    }
    case rt.NUM: {
      var numb = hvm.Runtime.get_val(term);
      return numb;
    }
    default: {
      return null;
    }
  }
}

// string (term: LJSON) : Option String
function string(term) {
  var text = "";
  while (1) {
    if (term.$ === "Ctr") {
      if (term.name === "String.cons" && term.args.length === 2) {
        text = text + String.fromCharCode(Number(term.args[0]));
        term = term.args[1];
        continue;
      }
      if (term.name === "String.nil" && term.args.length === 0) {
        return text;
      }
    }
  }
  return null;
}

// list (term: LJSON) : Option (List LJSON)
function list(term) {
  var list = [];
  while (1) {
    if (term.$ === "Ctr") {
      if (term.name === "List.cons" && term.args.length === 2) {
        list.push(term.args[0]);
        term = term.args[1];
        continue;
      }
      if (term.name === "List.nil" && term.args.length === 0) {
        return list;
      }
    }
  }
  return null;
}
