var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// node_modules/.pnpm/zeptomatch@2.0.2/node_modules/zeptomatch/dist/index.js
var index_exports = {};
__export(index_exports, {
  default: () => index_default
});
module.exports = __toCommonJS(index_exports);

// node_modules/.pnpm/grammex@3.1.12/node_modules/grammex/dist/utils.js
var isArray = (value) => {
  return Array.isArray(value);
};
var isFunction = (value) => {
  return typeof value === "function";
};
var isFunctionNullary = (value) => {
  return value.length === 0;
};
var isFunctionStrictlyNullaryOrUnary = (() => {
  const { toString } = Function.prototype;
  const re = /(?:^\(\s*(?:[^,.()]|\.(?!\.\.))*\s*\)\s*=>|^\s*[a-zA-Z$_][a-zA-Z0-9$_]*\s*=>)/;
  return (value) => {
    return (value.length === 0 || value.length === 1) && re.test(toString.call(value));
  };
})();
var isNumber = (value) => {
  return typeof value === "number";
};
var isObject = (value) => {
  return typeof value === "object" && value !== null;
};
var isRegExp = (value) => {
  return value instanceof RegExp;
};
var isRegExpCapturing = /* @__PURE__ */ (() => {
  const sourceRe = /\\\(|\((?!\?(?::|=|!|<=|<!))/;
  return (re) => {
    return sourceRe.test(re.source);
  };
})();
var isRegExpStatic = /* @__PURE__ */ (() => {
  const sourceRe = /^[a-zA-Z0-9_-]+$/;
  return (re) => {
    return sourceRe.test(re.source) && !re.flags.includes("i");
  };
})();
var isString = (value) => {
  return typeof value === "string";
};
var isUndefined = (value) => {
  return value === void 0;
};
var memoize = (fn) => {
  const cache = /* @__PURE__ */ new Map();
  return (arg) => {
    const cached = cache.get(arg);
    if (cached !== void 0)
      return cached;
    const value = fn(arg);
    cache.set(arg, value);
    return value;
  };
};

// node_modules/.pnpm/grammex@3.1.12/node_modules/grammex/dist/index.js
var parse = (input, rule, options = {}) => {
  const state = { cache: {}, input, index: 0, indexBacktrackMax: 0, options, output: [] };
  const matched = resolve(rule)(state);
  const indexMax = Math.max(state.index, state.indexBacktrackMax);
  if (matched && state.index === input.length) {
    return state.output;
  } else {
    throw new Error(`Failed to parse at index ${indexMax}`);
  }
};
var match = (target, handler) => {
  if (isArray(target)) {
    return chars(target, handler);
  } else if (isString(target)) {
    return string(target, handler);
  } else {
    return regex(target, handler);
  }
};
var chars = (target, handler) => {
  const charCodes = {};
  for (const char of target) {
    if (char.length !== 1)
      throw new Error(`Invalid character: "${char}"`);
    const charCode = char.charCodeAt(0);
    charCodes[charCode] = true;
  }
  return (state) => {
    const input = state.input;
    let indexStart = state.index;
    let indexEnd = indexStart;
    while (indexEnd < input.length) {
      const charCode = input.charCodeAt(indexEnd);
      if (!(charCode in charCodes))
        break;
      indexEnd += 1;
    }
    if (indexEnd > indexStart) {
      if (!isUndefined(handler) && !state.options.silent) {
        const target2 = input.slice(indexStart, indexEnd);
        const output = isFunction(handler) ? handler(target2, input, `${indexStart}`) : handler;
        if (!isUndefined(output)) {
          state.output.push(output);
        }
      }
      state.index = indexEnd;
    }
    return true;
  };
};
var regex = (target, handler) => {
  if (isRegExpStatic(target)) {
    return string(target.source, handler);
  } else {
    const source = target.source;
    const flags = target.flags.replace(/y|$/, "y");
    const re = new RegExp(source, flags);
    if (isRegExpCapturing(target) && isFunction(handler) && !isFunctionStrictlyNullaryOrUnary(handler)) {
      return regexCapturing(re, handler);
    } else {
      return regexNonCapturing(re, handler);
    }
  }
};
var regexCapturing = (re, handler) => {
  return (state) => {
    const indexStart = state.index;
    const input = state.input;
    re.lastIndex = indexStart;
    const match2 = re.exec(input);
    if (match2) {
      const indexEnd = re.lastIndex;
      if (!state.options.silent) {
        const output = handler(...match2, input, `${indexStart}`);
        if (!isUndefined(output)) {
          state.output.push(output);
        }
      }
      state.index = indexEnd;
      return true;
    } else {
      return false;
    }
  };
};
var regexNonCapturing = (re, handler) => {
  return (state) => {
    const indexStart = state.index;
    const input = state.input;
    re.lastIndex = indexStart;
    const matched = re.test(input);
    if (matched) {
      const indexEnd = re.lastIndex;
      if (!isUndefined(handler) && !state.options.silent) {
        const output = isFunction(handler) ? handler(input.slice(indexStart, indexEnd), input, `${indexStart}`) : handler;
        if (!isUndefined(output)) {
          state.output.push(output);
        }
      }
      state.index = indexEnd;
      return true;
    } else {
      return false;
    }
  };
};
var string = (target, handler) => {
  return (state) => {
    const indexStart = state.index;
    const input = state.input;
    const matched = input.startsWith(target, indexStart);
    if (matched) {
      if (!isUndefined(handler) && !state.options.silent) {
        const output = isFunction(handler) ? handler(target, input, `${indexStart}`) : handler;
        if (!isUndefined(output)) {
          state.output.push(output);
        }
      }
      state.index += target.length;
      return true;
    } else {
      return false;
    }
  };
};
var repeat = (rule, min, max, handler) => {
  const erule = resolve(rule);
  const isBacktrackable = min > 1;
  return memoizable(handleable(backtrackable((state) => {
    let repetitions = 0;
    while (repetitions < max) {
      const index = state.index;
      const matched = erule(state);
      if (!matched)
        break;
      repetitions += 1;
      if (state.index === index)
        break;
    }
    return repetitions >= min;
  }, isBacktrackable), handler));
};
var optional = (rule, handler) => {
  return repeat(rule, 0, 1, handler);
};
var star = (rule, handler) => {
  return repeat(rule, 0, Infinity, handler);
};
var and = (rules, handler) => {
  const erules = rules.map(resolve);
  return memoizable(handleable(backtrackable((state) => {
    for (let i = 0, l = erules.length; i < l; i++) {
      if (!erules[i](state))
        return false;
    }
    return true;
  }), handler));
};
var or = (rules, handler) => {
  const erules = rules.map(resolve);
  return memoizable(handleable((state) => {
    for (let i = 0, l = erules.length; i < l; i++) {
      if (erules[i](state))
        return true;
    }
    return false;
  }, handler));
};
var backtrackable = (rule, enabled = true, force = false) => {
  const erule = resolve(rule);
  if (!enabled)
    return erule;
  return (state) => {
    const index = state.index;
    const length = state.output.length;
    const matched = erule(state);
    if (!matched && !force) {
      state.indexBacktrackMax = Math.max(state.indexBacktrackMax, state.index);
    }
    if (!matched || force) {
      state.index = index;
      if (state.output.length !== length) {
        state.output.length = length;
      }
    }
    return matched;
  };
};
var handleable = (rule, handler) => {
  const erule = resolve(rule);
  if (!handler)
    return erule;
  return (state) => {
    if (state.options.silent)
      return erule(state);
    const length = state.output.length;
    const matched = erule(state);
    if (matched) {
      const outputs = state.output.splice(length, Infinity);
      const output = handler(outputs);
      if (!isUndefined(output)) {
        state.output.push(output);
      }
      return true;
    } else {
      return false;
    }
  };
};
var memoizable = /* @__PURE__ */ (() => {
  let RULE_ID = 0;
  return (rule) => {
    const erule = resolve(rule);
    const ruleId = RULE_ID += 1;
    return (state) => {
      var _a;
      if (state.options.memoization === false)
        return erule(state);
      const indexStart = state.index;
      const cache = (_a = state.cache)[ruleId] || (_a[ruleId] = { indexMax: -1, queue: [] });
      const cacheQueue = cache.queue;
      const isPotentiallyCached = indexStart <= cache.indexMax;
      if (isPotentiallyCached) {
        const cacheStore = cache.store || (cache.store = /* @__PURE__ */ new Map());
        if (cacheQueue.length) {
          for (let i = 0, l = cacheQueue.length; i < l; i += 2) {
            const key = cacheQueue[i * 2];
            const value = cacheQueue[i * 2 + 1];
            cacheStore.set(key, value);
          }
          cacheQueue.length = 0;
        }
        const cached = cacheStore.get(indexStart);
        if (cached === false) {
          return false;
        } else if (isNumber(cached)) {
          state.index = cached;
          return true;
        } else if (cached) {
          state.index = cached.index;
          if (cached.output?.length) {
            state.output.push(...cached.output);
          }
          return true;
        }
      }
      const lengthStart = state.output.length;
      const matched = erule(state);
      cache.indexMax = Math.max(cache.indexMax, indexStart);
      if (matched) {
        const indexEnd = state.index;
        const lengthEnd = state.output.length;
        if (lengthEnd > lengthStart) {
          const output = state.output.slice(lengthStart, lengthEnd);
          cacheQueue.push(indexStart, { index: indexEnd, output });
        } else {
          cacheQueue.push(indexStart, indexEnd);
        }
        return true;
      } else {
        cacheQueue.push(indexStart, false);
        return false;
      }
    };
  };
})();
var lazy = (getter) => {
  let erule;
  return (state) => {
    erule || (erule = resolve(getter()));
    return erule(state);
  };
};
var resolve = memoize((rule) => {
  if (isFunction(rule)) {
    if (isFunctionNullary(rule)) {
      return lazy(rule);
    } else {
      return rule;
    }
  }
  if (isString(rule) || isRegExp(rule)) {
    return match(rule);
  }
  if (isArray(rule)) {
    return and(rule);
  }
  if (isObject(rule)) {
    return or(Object.values(rule));
  }
  throw new Error("Invalid rule");
});

// node_modules/.pnpm/zeptomatch@2.0.2/node_modules/zeptomatch/dist/utils.js
var identity = (value) => {
  return value;
};
var makeParser = (grammar) => {
  return (input) => {
    return parse(input, grammar, { memoization: false }).join("");
  };
};
var memoize2 = (fn) => {
  const cache = {};
  return (arg) => {
    return cache[arg] ?? (cache[arg] = fn(arg));
  };
};

// node_modules/.pnpm/zeptomatch@2.0.2/node_modules/zeptomatch/dist/range.js
var ALPHABET = "abcdefghijklmnopqrstuvwxyz";
var int2alpha = (int) => {
  let alpha = "";
  while (int > 0) {
    const reminder = (int - 1) % 26;
    alpha = ALPHABET[reminder] + alpha;
    int = Math.floor((int - 1) / 26);
  }
  return alpha;
};
var alpha2int = (str) => {
  let int = 0;
  for (let i = 0, l = str.length; i < l; i++) {
    int = int * 26 + ALPHABET.indexOf(str[i]) + 1;
  }
  return int;
};
var makeRangeInt = (start, end) => {
  if (end < start)
    return makeRangeInt(end, start);
  const range = [];
  while (start <= end) {
    range.push(start++);
  }
  return range;
};
var makeRangePaddedInt = (start, end, paddingLength) => {
  return makeRangeInt(start, end).map((int) => String(int).padStart(paddingLength, "0"));
};
var makeRangeAlpha = (start, end) => {
  return makeRangeInt(alpha2int(start), alpha2int(end)).map(int2alpha);
};

// node_modules/.pnpm/zeptomatch@2.0.2/node_modules/zeptomatch/dist/convert/grammar.js
var Escaped = match(/\\./, identity);
var Escape = match(/[$.*+?^(){}[\]\|]/, (char) => `\\${char}`);
var Slash = match(/[\\/]/, "[\\\\/]");
var Passthrough = match(/./, identity);
var NegationOdd = match(/^(?:!!)*!(.*)$/, (_, glob) => `(?!^${parser_default(glob)}$).*?`);
var NegationEven = match(/^(!!)+/, "");
var Negation = or([NegationOdd, NegationEven]);
var StarStarBetween = match(/\/(\*\*\/)+/, "(?:[\\\\/].+[\\\\/]|[\\\\/])");
var StarStarStart = match(/^(\*\*\/)+/, "(?:^|.*[\\\\/])");
var StarStarEnd = match(/\/(\*\*)$/, "(?:[\\\\/].*|$)");
var StarStarNone = match(/\*\*/, ".*");
var StarStar = or([StarStarBetween, StarStarStart, StarStarEnd, StarStarNone]);
var StarDouble = match(/\*\/(?!\*\*\/|\*$)/, "[^\\\\/]*[\\\\/]");
var StarSingle = match(/\*/, "[^\\\\/]*");
var Star = or([StarDouble, StarSingle]);
var Question = match("?", "[^\\\\/]");
var ClassOpen = match("[", identity);
var ClassClose = match("]", identity);
var ClassNegation = match(/[!^]/, "^\\\\/");
var ClassRange = match(/[a-z]-[a-z]|[0-9]-[0-9]/i, identity);
var ClassEscape = match(/[$.*+?^(){}[\|]/, (char) => `\\${char}`);
var ClassPassthrough = match(/[^\]]/, identity);
var ClassValue = or([Escaped, ClassEscape, ClassRange, ClassPassthrough]);
var Class = and([ClassOpen, optional(ClassNegation), star(ClassValue), ClassClose]);
var RangeOpen = match("{", "(?:");
var RangeClose = match("}", ")");
var RangeNumeric = match(/(\d+)\.\.(\d+)/, (_, $1, $2) => makeRangePaddedInt(+$1, +$2, Math.min($1.length, $2.length)).join("|"));
var RangeAlphaLower = match(/([a-z]+)\.\.([a-z]+)/, (_, $1, $2) => makeRangeAlpha($1, $2).join("|"));
var RangeAlphaUpper = match(/([A-Z]+)\.\.([A-Z]+)/, (_, $1, $2) => makeRangeAlpha($1.toLowerCase(), $2.toLowerCase()).join("|").toUpperCase());
var RangeValue = or([RangeNumeric, RangeAlphaLower, RangeAlphaUpper]);
var Range = and([RangeOpen, RangeValue, RangeClose]);
var BracesOpen = match("{", "(?:");
var BracesClose = match("}", ")");
var BracesComma = match(",", "|");
var BracesEscape = match(/[$.*+?^(){[\]\|]/, (char) => `\\${char}`);
var BracesPassthrough = match(/[^}]/, identity);
var BracesNested = lazy(() => Braces);
var BracesValue = or([StarStar, Star, Question, Class, Range, BracesNested, Escaped, BracesEscape, BracesComma, BracesPassthrough]);
var Braces = and([BracesOpen, star(BracesValue), BracesClose]);
var Grammar = star(or([Negation, StarStar, Star, Question, Class, Range, Braces, Escaped, Escape, Slash, Passthrough]));
var grammar_default = Grammar;

// node_modules/.pnpm/zeptomatch@2.0.2/node_modules/zeptomatch/dist/convert/parser.js
var parser = makeParser(grammar_default);
var parser_default = parser;

// node_modules/.pnpm/zeptomatch@2.0.2/node_modules/zeptomatch/dist/normalize/grammar.js
var Escaped2 = match(/\\./, identity);
var Passthrough2 = match(/./, identity);
var StarStarStar = match(/\*\*\*+/, "*");
var StarStarNoLeft = match(/([^/{[(!])\*\*/, (_, $1) => `${$1}*`);
var StarStarNoRight = match(/(^|.)\*\*(?=[^*/)\]}])/, (_, $1) => `${$1}*`);
var Grammar2 = star(or([Escaped2, StarStarStar, StarStarNoLeft, StarStarNoRight, Passthrough2]));
var grammar_default2 = Grammar2;

// node_modules/.pnpm/zeptomatch@2.0.2/node_modules/zeptomatch/dist/normalize/parser.js
var parser2 = makeParser(grammar_default2);
var parser_default2 = parser2;

// node_modules/.pnpm/zeptomatch@2.0.2/node_modules/zeptomatch/dist/index.js
var zeptomatch = (glob, path) => {
  if (Array.isArray(glob)) {
    const res = glob.map(zeptomatch.compile);
    const isMatch = res.some((re) => re.test(path));
    return isMatch;
  } else {
    const re = zeptomatch.compile(glob);
    const isMatch = re.test(path);
    return isMatch;
  }
};
zeptomatch.compile = memoize2((glob) => {
  return new RegExp(`^${parser_default(parser_default2(glob))}[\\\\/]?$`, "s");
});
var index_default = zeptomatch;
