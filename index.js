// FIXME: load hvm-nodejs on Node.js
import init, * as hvm from "hvm-web";

export default async function init_runtime(code) {
  await init();

  var rt = hvm.Runtime.from_code(code);

  for (var key in hvm.Runtime) {
    rt[key] = hvm.Runtime[key];
  }

  rt.readback = loc => readback(rt, loc);
  rt.string = term => string(term);
  rt.list = term => list(term);

  rt.DP0 = rt.Runtime.DP0();
  rt.DP1 = rt.Runtime.DP1();
  rt.VAR = rt.Runtime.VAR();
  rt.ARG = rt.Runtime.ARG();
  rt.ERA = rt.Runtime.ERA();
  rt.LAM = rt.Runtime.LAM();
  rt.APP = rt.Runtime.APP();
  rt.SUP = rt.Runtime.SUP();
  rt.CTR = rt.Runtime.CTR();
  rt.FUN = rt.Runtime.FUN();
  rt.OP2 = rt.Runtime.OP2();
  rt.NUM = rt.Runtime.NUM();
  rt.ADD = rt.Runtime.ADD();
  rt.SUB = rt.Runtime.SUB();
  rt.MUL = rt.Runtime.MUL();
  rt.DIV = rt.Runtime.DIV();
  rt.MOD = rt.Runtime.MOD();
  rt.AND = rt.Runtime.AND();
  rt.OR  = rt.Runtime.OR();
  rt.XOR = rt.Runtime.XOR();
  rt.SHL = rt.Runtime.SHL();
  rt.SHR = rt.Runtime.SHR();
  rt.LTN = rt.Runtime.LTN();
  rt.LTE = rt.Runtime.LTE();
  rt.EQL = rt.Runtime.EQL();
  rt.GTE = rt.Runtime.GTE();
  rt.GTN = rt.Runtime.GTN();
  rt.NEQ = rt.Runtime.NEQ();

  return rt;
}

// Reads an HVM term as a JSON
// readback (rt: Runtime) (loc: u64) : LJSON
function readback(rt, loc, vars = null, stks = {}) {
  var term = rt.at(loc);
  switch (hvm.Runtime.get_tag(term)) {
    case VAR: {
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
    case DP0: {
      var col = hvm.Runtime.get_ext(term);
      var val = rt.at(hvm.Runtime.get_loc(term, 2));
      stks[col] = stks[col] || [];
      stks[col].push(false);
      var result = readback(rt, val, vars, stks);
      stks[col].pop();
      return result;
    }
    case DP1: {
      var col = hvm.Runtime.get_ext(term);
      var val = rt.at(hvm.Runtime.get_loc(term, 2));
      stks[col] = stks[col] || [];
      stks[col].push(true);
      var result = readback(rt, val, vars, stks);
      stks[col].pop();
      return result;
    }
    case CTR: {
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
    case FUN: {
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
    case LAM: {
      return vah => {
        var vars = {$: "Ext", loc, vah, vars};
        var body = hvm.Runtime.get_loc(term, BigInt(1));
        return readback(rt, body, vars, vars, stks);
      };
    }
    case APP: {
      var func = rt.at(hvm.Runtime.get_loc(term, 0));
      var argm = rt.at(hvm.Runtime.get_loc(term, 1));
      var func = readback(rt, func, vars, stks);
      var argm = readback(rt, argm, vars, stks);
      return func(argm);
    }
    case SUP: {
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
    case OP2: {
      var val0 = rt.at(hvm.Runtime.get_loc(term, 0));
      var val1 = rt.at(hvm.Runtime.get_loc(term, 1));
      var val0 = readback(rt, val0, vars, stks);
      var val1 = readback(rt, val1, vars, stks);
      switch (hvm.Runtime.get_ext(term)) {
        case ADD: return (val0 + val1) & 0xFFFFFFFFFFFFFFFn;
        case SUB: return (val0 - val1) & 0xFFFFFFFFFFFFFFFn;
        case MUL: return (val0 * val1) & 0xFFFFFFFFFFFFFFFn;
        case DIV: return (val0 / val1) & 0xFFFFFFFFFFFFFFFn;
        case MOD: return (val0 % val1) & 0xFFFFFFFFFFFFFFFn;
        case AND: return (val0 & val1) & 0xFFFFFFFFFFFFFFFn;
        case OR : return (val0 | val1) & 0xFFFFFFFFFFFFFFFn;
        case XOR: return (val0 ^ val1) & 0xFFFFFFFFFFFFFFFn;
        case SHL: return (val0 << val1) & 0xFFFFFFFFFFFFFFFn;
        case SHR: return (val0 >> val1) & 0xFFFFFFFFFFFFFFFn;
        case LTN: return val0 <  val1 ? 1n : 0n;
        case LTE: return val0 >= val1 ? 1n : 0n;
        case EQL: return val0 == val1 ? 1n : 0n;
        case GTE: return val0 <= val1 ? 1n : 0n;
        case GTN: return val0 <  val1 ? 1n : 0n;
        case NEQ: return val0 != val1 ? 1n : 0n;
        default : return 0;
      };
    }
    case NUM: {
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
