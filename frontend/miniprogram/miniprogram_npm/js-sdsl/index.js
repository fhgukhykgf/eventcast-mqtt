module.exports = (function() {
var __MODS__ = {};
var __DEFINE__ = function(modId, func, req) { var m = { exports: {}, _tempexports: {} }; __MODS__[modId] = { status: 0, func: func, req: req, m: m }; };
var __REQUIRE__ = function(modId, source) { if(!__MODS__[modId]) return require(source); if(!__MODS__[modId].status) { var m = __MODS__[modId].m; m._exports = m._tempexports; var desp = Object.getOwnPropertyDescriptor(m, "exports"); if (desp && desp.configurable) Object.defineProperty(m, "exports", { set: function (val) { if(typeof val === "object" && val !== m._exports) { m._exports.__proto__ = val.__proto__; Object.keys(val).forEach(function (k) { m._exports[k] = val[k]; }); } m._tempexports = val }, get: function () { return m._tempexports; } }); __MODS__[modId].status = 1; __MODS__[modId].func(__MODS__[modId].req, m, m.exports); } return __MODS__[modId].m.exports; };
var __REQUIRE_WILDCARD__ = function(obj) { if(obj && obj.__esModule) { return obj; } else { var newObj = {}; if(obj != null) { for(var k in obj) { if (Object.prototype.hasOwnProperty.call(obj, k)) newObj[k] = obj[k]; } } newObj.default = obj; return newObj; } };
var __REQUIRE_DEFAULT__ = function(obj) { return obj && obj.__esModule ? obj.default : obj; };
__DEFINE__(1773805786165, function(require, module, exports) {


Object.defineProperty(exports, "t", {
    value: true
});

Object.defineProperty(exports, "Deque", {
    enumerable: true,
    get: function() {
        return _Deque.default;
    }
});

Object.defineProperty(exports, "HashMap", {
    enumerable: true,
    get: function() {
        return _HashMap.default;
    }
});

Object.defineProperty(exports, "HashSet", {
    enumerable: true,
    get: function() {
        return _HashSet.default;
    }
});

Object.defineProperty(exports, "LinkList", {
    enumerable: true,
    get: function() {
        return _LinkList.default;
    }
});

Object.defineProperty(exports, "OrderedMap", {
    enumerable: true,
    get: function() {
        return _OrderedMap.default;
    }
});

Object.defineProperty(exports, "OrderedSet", {
    enumerable: true,
    get: function() {
        return _OrderedSet.default;
    }
});

Object.defineProperty(exports, "PriorityQueue", {
    enumerable: true,
    get: function() {
        return _PriorityQueue.default;
    }
});

Object.defineProperty(exports, "Queue", {
    enumerable: true,
    get: function() {
        return _Queue.default;
    }
});

Object.defineProperty(exports, "Stack", {
    enumerable: true,
    get: function() {
        return _Stack.default;
    }
});

Object.defineProperty(exports, "Vector", {
    enumerable: true,
    get: function() {
        return _Vector.default;
    }
});

var _Stack = _interopRequireDefault(require("./container/OtherContainer/Stack"));

var _Queue = _interopRequireDefault(require("./container/OtherContainer/Queue"));

var _PriorityQueue = _interopRequireDefault(require("./container/OtherContainer/PriorityQueue"));

var _Vector = _interopRequireDefault(require("./container/SequentialContainer/Vector"));

var _LinkList = _interopRequireDefault(require("./container/SequentialContainer/LinkList"));

var _Deque = _interopRequireDefault(require("./container/SequentialContainer/Deque"));

var _OrderedSet = _interopRequireDefault(require("./container/TreeContainer/OrderedSet"));

var _OrderedMap = _interopRequireDefault(require("./container/TreeContainer/OrderedMap"));

var _HashSet = _interopRequireDefault(require("./container/HashContainer/HashSet"));

var _HashMap = _interopRequireDefault(require("./container/HashContainer/HashMap"));

function _interopRequireDefault(e) {
    return e && e.t ? e : {
        default: e
    };
}
//# sourceMappingURL=index.js.map

}, function(modId) {var map = {"./container/OtherContainer/Stack":1773805786166,"./container/OtherContainer/Queue":1773805786168,"./container/OtherContainer/PriorityQueue":1773805786169,"./container/SequentialContainer/Vector":1773805786170,"./container/SequentialContainer/LinkList":1773805786174,"./container/SequentialContainer/Deque":1773805786175,"./container/TreeContainer/OrderedSet":1773805786176,"./container/TreeContainer/OrderedMap":1773805786180,"./container/HashContainer/HashSet":1773805786181,"./container/HashContainer/HashMap":1773805786184}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1773805786166, function(require, module, exports) {


Object.defineProperty(exports, "t", {
    value: true
});

exports.default = void 0;

var _ContainerBase = require("../ContainerBase");

class Stack extends _ContainerBase.Base {
    constructor(t = []) {
        super();
        this.S = [];
        const s = this;
        t.forEach((function(t) {
            s.push(t);
        }));
    }
    clear() {
        this.i = 0;
        this.S = [];
    }
    push(t) {
        this.S.push(t);
        this.i += 1;
        return this.i;
    }
    pop() {
        if (this.i === 0) return;
        this.i -= 1;
        return this.S.pop();
    }
    top() {
        return this.S[this.i - 1];
    }
}

var _default = Stack;

exports.default = _default;
//# sourceMappingURL=Stack.js.map

}, function(modId) { var map = {"../ContainerBase":1773805786167}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1773805786167, function(require, module, exports) {


Object.defineProperty(exports, "t", {
    value: true
});

exports.ContainerIterator = exports.Container = exports.Base = void 0;

class ContainerIterator {
    constructor(t = 0) {
        this.iteratorType = t;
    }
    equals(t) {
        return this.o === t.o;
    }
}

exports.ContainerIterator = ContainerIterator;

class Base {
    constructor() {
        this.i = 0;
    }
    get length() {
        return this.i;
    }
    size() {
        return this.i;
    }
    empty() {
        return this.i === 0;
    }
}

exports.Base = Base;

class Container extends Base {}

exports.Container = Container;
//# sourceMappingURL=index.js.map

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1773805786168, function(require, module, exports) {


Object.defineProperty(exports, "t", {
    value: true
});

exports.default = void 0;

var _ContainerBase = require("../ContainerBase");

class Queue extends _ContainerBase.Base {
    constructor(t = []) {
        super();
        this.j = 0;
        this.q = [];
        const s = this;
        t.forEach((function(t) {
            s.push(t);
        }));
    }
    clear() {
        this.q = [];
        this.i = this.j = 0;
    }
    push(t) {
        const s = this.q.length;
        if (this.j / s > .5 && this.j + this.i >= s && s > 4096) {
            const s = this.i;
            for (let t = 0; t < s; ++t) {
                this.q[t] = this.q[this.j + t];
            }
            this.j = 0;
            this.q[this.i] = t;
        } else this.q[this.j + this.i] = t;
        return ++this.i;
    }
    pop() {
        if (this.i === 0) return;
        const t = this.q[this.j++];
        this.i -= 1;
        return t;
    }
    front() {
        if (this.i === 0) return;
        return this.q[this.j];
    }
}

var _default = Queue;

exports.default = _default;
//# sourceMappingURL=Queue.js.map

}, function(modId) { var map = {"../ContainerBase":1773805786167}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1773805786169, function(require, module, exports) {


Object.defineProperty(exports, "t", {
    value: true
});

exports.default = void 0;

var _ContainerBase = require("../ContainerBase");

class PriorityQueue extends _ContainerBase.Base {
    constructor(t = [], s = function(t, s) {
        if (t > s) return -1;
        if (t < s) return 1;
        return 0;
    }, i = true) {
        super();
        this.v = s;
        if (Array.isArray(t)) {
            this.C = i ? [ ...t ] : t;
        } else {
            this.C = [];
            const s = this;
            t.forEach((function(t) {
                s.C.push(t);
            }));
        }
        this.i = this.C.length;
        const e = this.i >> 1;
        for (let t = this.i - 1 >> 1; t >= 0; --t) {
            this.k(t, e);
        }
    }
    m(t) {
        const s = this.C[t];
        while (t > 0) {
            const i = t - 1 >> 1;
            const e = this.C[i];
            if (this.v(e, s) <= 0) break;
            this.C[t] = e;
            t = i;
        }
        this.C[t] = s;
    }
    k(t, s) {
        const i = this.C[t];
        while (t < s) {
            let s = t << 1 | 1;
            const e = s + 1;
            let h = this.C[s];
            if (e < this.i && this.v(h, this.C[e]) > 0) {
                s = e;
                h = this.C[e];
            }
            if (this.v(h, i) >= 0) break;
            this.C[t] = h;
            t = s;
        }
        this.C[t] = i;
    }
    clear() {
        this.i = 0;
        this.C.length = 0;
    }
    push(t) {
        this.C.push(t);
        this.m(this.i);
        this.i += 1;
    }
    pop() {
        if (this.i === 0) return;
        const t = this.C[0];
        const s = this.C.pop();
        this.i -= 1;
        if (this.i) {
            this.C[0] = s;
            this.k(0, this.i >> 1);
        }
        return t;
    }
    top() {
        return this.C[0];
    }
    find(t) {
        return this.C.indexOf(t) >= 0;
    }
    remove(t) {
        const s = this.C.indexOf(t);
        if (s < 0) return false;
        if (s === 0) {
            this.pop();
        } else if (s === this.i - 1) {
            this.C.pop();
            this.i -= 1;
        } else {
            this.C.splice(s, 1, this.C.pop());
            this.i -= 1;
            this.m(s);
            this.k(s, this.i >> 1);
        }
        return true;
    }
    updateItem(t) {
        const s = this.C.indexOf(t);
        if (s < 0) return false;
        this.m(s);
        this.k(s, this.i >> 1);
        return true;
    }
    toArray() {
        return [ ...this.C ];
    }
}

var _default = PriorityQueue;

exports.default = _default;
//# sourceMappingURL=PriorityQueue.js.map

}, function(modId) { var map = {"../ContainerBase":1773805786167}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1773805786170, function(require, module, exports) {


Object.defineProperty(exports, "t", {
    value: true
});

exports.default = void 0;

var _Base = _interopRequireDefault(require("./Base"));

var _RandomIterator = require("./Base/RandomIterator");

function _interopRequireDefault(t) {
    return t && t.t ? t : {
        default: t
    };
}

class VectorIterator extends _RandomIterator.RandomIterator {
    constructor(t, r, e) {
        super(t, e);
        this.container = r;
    }
    copy() {
        return new VectorIterator(this.o, this.container, this.iteratorType);
    }
}

class Vector extends _Base.default {
    constructor(t = [], r = true) {
        super();
        if (Array.isArray(t)) {
            this.J = r ? [ ...t ] : t;
            this.i = t.length;
        } else {
            this.J = [];
            const r = this;
            t.forEach((function(t) {
                r.pushBack(t);
            }));
        }
    }
    clear() {
        this.i = 0;
        this.J.length = 0;
    }
    begin() {
        return new VectorIterator(0, this);
    }
    end() {
        return new VectorIterator(this.i, this);
    }
    rBegin() {
        return new VectorIterator(this.i - 1, this, 1);
    }
    rEnd() {
        return new VectorIterator(-1, this, 1);
    }
    front() {
        return this.J[0];
    }
    back() {
        return this.J[this.i - 1];
    }
    getElementByPos(t) {
        if (t < 0 || t > this.i - 1) {
            throw new RangeError;
        }
        return this.J[t];
    }
    eraseElementByPos(t) {
        if (t < 0 || t > this.i - 1) {
            throw new RangeError;
        }
        this.J.splice(t, 1);
        this.i -= 1;
        return this.i;
    }
    eraseElementByValue(t) {
        let r = 0;
        for (let e = 0; e < this.i; ++e) {
            if (this.J[e] !== t) {
                this.J[r++] = this.J[e];
            }
        }
        this.i = this.J.length = r;
        return this.i;
    }
    eraseElementByIterator(t) {
        const r = t.o;
        t = t.next();
        this.eraseElementByPos(r);
        return t;
    }
    pushBack(t) {
        this.J.push(t);
        this.i += 1;
        return this.i;
    }
    popBack() {
        if (this.i === 0) return;
        this.i -= 1;
        return this.J.pop();
    }
    setElementByPos(t, r) {
        if (t < 0 || t > this.i - 1) {
            throw new RangeError;
        }
        this.J[t] = r;
    }
    insert(t, r, e = 1) {
        if (t < 0 || t > this.i) {
            throw new RangeError;
        }
        this.J.splice(t, 0, ...new Array(e).fill(r));
        this.i += e;
        return this.i;
    }
    find(t) {
        for (let r = 0; r < this.i; ++r) {
            if (this.J[r] === t) {
                return new VectorIterator(r, this);
            }
        }
        return this.end();
    }
    reverse() {
        this.J.reverse();
    }
    unique() {
        let t = 1;
        for (let r = 1; r < this.i; ++r) {
            if (this.J[r] !== this.J[r - 1]) {
                this.J[t++] = this.J[r];
            }
        }
        this.i = this.J.length = t;
        return this.i;
    }
    sort(t) {
        this.J.sort(t);
    }
    forEach(t) {
        for (let r = 0; r < this.i; ++r) {
            t(this.J[r], r, this);
        }
    }
    [Symbol.iterator]() {
        return function*() {
            yield* this.J;
        }.bind(this)();
    }
}

var _default = Vector;

exports.default = _default;
//# sourceMappingURL=Vector.js.map

}, function(modId) { var map = {"./Base":1773805786171,"./Base/RandomIterator":1773805786172}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1773805786171, function(require, module, exports) {


Object.defineProperty(exports, "t", {
    value: true
});

exports.default = void 0;

var _ContainerBase = require("../../ContainerBase");

class SequentialContainer extends _ContainerBase.Container {}

var _default = SequentialContainer;

exports.default = _default;
//# sourceMappingURL=index.js.map

}, function(modId) { var map = {"../../ContainerBase":1773805786167}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1773805786172, function(require, module, exports) {


Object.defineProperty(exports, "t", {
    value: true
});

exports.RandomIterator = void 0;

var _ContainerBase = require("../../ContainerBase");

var _throwError = require("../../../utils/throwError");

class RandomIterator extends _ContainerBase.ContainerIterator {
    constructor(t, r) {
        super(r);
        this.o = t;
        if (this.iteratorType === 0) {
            this.pre = function() {
                if (this.o === 0) {
                    (0, _throwError.throwIteratorAccessError)();
                }
                this.o -= 1;
                return this;
            };
            this.next = function() {
                if (this.o === this.container.size()) {
                    (0, _throwError.throwIteratorAccessError)();
                }
                this.o += 1;
                return this;
            };
        } else {
            this.pre = function() {
                if (this.o === this.container.size() - 1) {
                    (0, _throwError.throwIteratorAccessError)();
                }
                this.o += 1;
                return this;
            };
            this.next = function() {
                if (this.o === -1) {
                    (0, _throwError.throwIteratorAccessError)();
                }
                this.o -= 1;
                return this;
            };
        }
    }
    get pointer() {
        return this.container.getElementByPos(this.o);
    }
    set pointer(t) {
        this.container.setElementByPos(this.o, t);
    }
}

exports.RandomIterator = RandomIterator;
//# sourceMappingURL=RandomIterator.js.map

}, function(modId) { var map = {"../../ContainerBase":1773805786167,"../../../utils/throwError":1773805786173}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1773805786173, function(require, module, exports) {


Object.defineProperty(exports, "t", {
    value: true
});

exports.throwIteratorAccessError = throwIteratorAccessError;

function throwIteratorAccessError() {
    throw new RangeError("Iterator access denied!");
}
//# sourceMappingURL=throwError.js.map

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1773805786174, function(require, module, exports) {


Object.defineProperty(exports, "t", {
    value: true
});

exports.default = void 0;

var _Base = _interopRequireDefault(require("./Base"));

var _ContainerBase = require("../ContainerBase");

var _throwError = require("../../utils/throwError");

function _interopRequireDefault(t) {
    return t && t.t ? t : {
        default: t
    };
}

class LinkListIterator extends _ContainerBase.ContainerIterator {
    constructor(t, i, s, r) {
        super(r);
        this.o = t;
        this.h = i;
        this.container = s;
        if (this.iteratorType === 0) {
            this.pre = function() {
                if (this.o.L === this.h) {
                    (0, _throwError.throwIteratorAccessError)();
                }
                this.o = this.o.L;
                return this;
            };
            this.next = function() {
                if (this.o === this.h) {
                    (0, _throwError.throwIteratorAccessError)();
                }
                this.o = this.o.B;
                return this;
            };
        } else {
            this.pre = function() {
                if (this.o.B === this.h) {
                    (0, _throwError.throwIteratorAccessError)();
                }
                this.o = this.o.B;
                return this;
            };
            this.next = function() {
                if (this.o === this.h) {
                    (0, _throwError.throwIteratorAccessError)();
                }
                this.o = this.o.L;
                return this;
            };
        }
    }
    get pointer() {
        if (this.o === this.h) {
            (0, _throwError.throwIteratorAccessError)();
        }
        return this.o.l;
    }
    set pointer(t) {
        if (this.o === this.h) {
            (0, _throwError.throwIteratorAccessError)();
        }
        this.o.l = t;
    }
    copy() {
        return new LinkListIterator(this.o, this.h, this.container, this.iteratorType);
    }
}

class LinkList extends _Base.default {
    constructor(t = []) {
        super();
        this.h = {};
        this.p = this._ = this.h.L = this.h.B = this.h;
        const i = this;
        t.forEach((function(t) {
            i.pushBack(t);
        }));
    }
    V(t) {
        const {L: i, B: s} = t;
        i.B = s;
        s.L = i;
        if (t === this.p) {
            this.p = s;
        }
        if (t === this._) {
            this._ = i;
        }
        this.i -= 1;
    }
    G(t, i) {
        const s = i.B;
        const r = {
            l: t,
            L: i,
            B: s
        };
        i.B = r;
        s.L = r;
        if (i === this.h) {
            this.p = r;
        }
        if (s === this.h) {
            this._ = r;
        }
        this.i += 1;
    }
    clear() {
        this.i = 0;
        this.p = this._ = this.h.L = this.h.B = this.h;
    }
    begin() {
        return new LinkListIterator(this.p, this.h, this);
    }
    end() {
        return new LinkListIterator(this.h, this.h, this);
    }
    rBegin() {
        return new LinkListIterator(this._, this.h, this, 1);
    }
    rEnd() {
        return new LinkListIterator(this.h, this.h, this, 1);
    }
    front() {
        return this.p.l;
    }
    back() {
        return this._.l;
    }
    getElementByPos(t) {
        if (t < 0 || t > this.i - 1) {
            throw new RangeError;
        }
        let i = this.p;
        while (t--) {
            i = i.B;
        }
        return i.l;
    }
    eraseElementByPos(t) {
        if (t < 0 || t > this.i - 1) {
            throw new RangeError;
        }
        let i = this.p;
        while (t--) {
            i = i.B;
        }
        this.V(i);
        return this.i;
    }
    eraseElementByValue(t) {
        let i = this.p;
        while (i !== this.h) {
            if (i.l === t) {
                this.V(i);
            }
            i = i.B;
        }
        return this.i;
    }
    eraseElementByIterator(t) {
        const i = t.o;
        if (i === this.h) {
            (0, _throwError.throwIteratorAccessError)();
        }
        t = t.next();
        this.V(i);
        return t;
    }
    pushBack(t) {
        this.G(t, this._);
        return this.i;
    }
    popBack() {
        if (this.i === 0) return;
        const t = this._.l;
        this.V(this._);
        return t;
    }
    pushFront(t) {
        this.G(t, this.h);
        return this.i;
    }
    popFront() {
        if (this.i === 0) return;
        const t = this.p.l;
        this.V(this.p);
        return t;
    }
    setElementByPos(t, i) {
        if (t < 0 || t > this.i - 1) {
            throw new RangeError;
        }
        let s = this.p;
        while (t--) {
            s = s.B;
        }
        s.l = i;
    }
    insert(t, i, s = 1) {
        if (t < 0 || t > this.i) {
            throw new RangeError;
        }
        if (s <= 0) return this.i;
        if (t === 0) {
            while (s--) this.pushFront(i);
        } else if (t === this.i) {
            while (s--) this.pushBack(i);
        } else {
            let r = this.p;
            for (let i = 1; i < t; ++i) {
                r = r.B;
            }
            const e = r.B;
            this.i += s;
            while (s--) {
                r.B = {
                    l: i,
                    L: r
                };
                r.B.L = r;
                r = r.B;
            }
            r.B = e;
            e.L = r;
        }
        return this.i;
    }
    find(t) {
        let i = this.p;
        while (i !== this.h) {
            if (i.l === t) {
                return new LinkListIterator(i, this.h, this);
            }
            i = i.B;
        }
        return this.end();
    }
    reverse() {
        if (this.i <= 1) return;
        let t = this.p;
        let i = this._;
        let s = 0;
        while (s << 1 < this.i) {
            const r = t.l;
            t.l = i.l;
            i.l = r;
            t = t.B;
            i = i.L;
            s += 1;
        }
    }
    unique() {
        if (this.i <= 1) {
            return this.i;
        }
        let t = this.p;
        while (t !== this.h) {
            let i = t;
            while (i.B !== this.h && i.l === i.B.l) {
                i = i.B;
                this.i -= 1;
            }
            t.B = i.B;
            t.B.L = t;
            t = t.B;
        }
        return this.i;
    }
    sort(t) {
        if (this.i <= 1) return;
        const i = [];
        this.forEach((function(t) {
            i.push(t);
        }));
        i.sort(t);
        let s = this.p;
        i.forEach((function(t) {
            s.l = t;
            s = s.B;
        }));
    }
    merge(t) {
        const i = this;
        if (this.i === 0) {
            t.forEach((function(t) {
                i.pushBack(t);
            }));
        } else {
            let s = this.p;
            t.forEach((function(t) {
                while (s !== i.h && s.l <= t) {
                    s = s.B;
                }
                i.G(t, s.L);
            }));
        }
        return this.i;
    }
    forEach(t) {
        let i = this.p;
        let s = 0;
        while (i !== this.h) {
            t(i.l, s++, this);
            i = i.B;
        }
    }
    [Symbol.iterator]() {
        return function*() {
            if (this.i === 0) return;
            let t = this.p;
            while (t !== this.h) {
                yield t.l;
                t = t.B;
            }
        }.bind(this)();
    }
}

var _default = LinkList;

exports.default = _default;
//# sourceMappingURL=LinkList.js.map

}, function(modId) { var map = {"./Base":1773805786171,"../ContainerBase":1773805786167,"../../utils/throwError":1773805786173}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1773805786175, function(require, module, exports) {


Object.defineProperty(exports, "t", {
    value: true
});

exports.default = void 0;

var _Base = _interopRequireDefault(require("./Base"));

var _RandomIterator = require("./Base/RandomIterator");

function _interopRequireDefault(t) {
    return t && t.t ? t : {
        default: t
    };
}

class DequeIterator extends _RandomIterator.RandomIterator {
    constructor(t, i, s) {
        super(t, s);
        this.container = i;
    }
    copy() {
        return new DequeIterator(this.o, this.container, this.iteratorType);
    }
}

class Deque extends _Base.default {
    constructor(t = [], i = 1 << 12) {
        super();
        this.j = 0;
        this.D = 0;
        this.R = 0;
        this.N = 0;
        this.P = 0;
        this.A = [];
        const s = (() => {
            if (typeof t.length === "number") return t.length;
            if (typeof t.size === "number") return t.size;
            if (typeof t.size === "function") return t.size();
            throw new TypeError("Cannot get the length or size of the container");
        })();
        this.F = i;
        this.P = Math.max(Math.ceil(s / this.F), 1);
        for (let t = 0; t < this.P; ++t) {
            this.A.push(new Array(this.F));
        }
        const h = Math.ceil(s / this.F);
        this.j = this.R = (this.P >> 1) - (h >> 1);
        this.D = this.N = this.F - s % this.F >> 1;
        const e = this;
        t.forEach((function(t) {
            e.pushBack(t);
        }));
    }
    T() {
        const t = [];
        const i = Math.max(this.P >> 1, 1);
        for (let s = 0; s < i; ++s) {
            t[s] = new Array(this.F);
        }
        for (let i = this.j; i < this.P; ++i) {
            t[t.length] = this.A[i];
        }
        for (let i = 0; i < this.R; ++i) {
            t[t.length] = this.A[i];
        }
        t[t.length] = [ ...this.A[this.R] ];
        this.j = i;
        this.R = t.length - 1;
        for (let s = 0; s < i; ++s) {
            t[t.length] = new Array(this.F);
        }
        this.A = t;
        this.P = t.length;
    }
    O(t) {
        const i = this.D + t + 1;
        const s = i % this.F;
        let h = s - 1;
        let e = this.j + (i - s) / this.F;
        if (s === 0) e -= 1;
        e %= this.P;
        if (h < 0) h += this.F;
        return {
            curNodeBucketIndex: e,
            curNodePointerIndex: h
        };
    }
    clear() {
        this.A = [ new Array(this.F) ];
        this.P = 1;
        this.j = this.R = this.i = 0;
        this.D = this.N = this.F >> 1;
    }
    begin() {
        return new DequeIterator(0, this);
    }
    end() {
        return new DequeIterator(this.i, this);
    }
    rBegin() {
        return new DequeIterator(this.i - 1, this, 1);
    }
    rEnd() {
        return new DequeIterator(-1, this, 1);
    }
    front() {
        if (this.i === 0) return;
        return this.A[this.j][this.D];
    }
    back() {
        if (this.i === 0) return;
        return this.A[this.R][this.N];
    }
    pushBack(t) {
        if (this.i) {
            if (this.N < this.F - 1) {
                this.N += 1;
            } else if (this.R < this.P - 1) {
                this.R += 1;
                this.N = 0;
            } else {
                this.R = 0;
                this.N = 0;
            }
            if (this.R === this.j && this.N === this.D) this.T();
        }
        this.i += 1;
        this.A[this.R][this.N] = t;
        return this.i;
    }
    popBack() {
        if (this.i === 0) return;
        const t = this.A[this.R][this.N];
        if (this.i !== 1) {
            if (this.N > 0) {
                this.N -= 1;
            } else if (this.R > 0) {
                this.R -= 1;
                this.N = this.F - 1;
            } else {
                this.R = this.P - 1;
                this.N = this.F - 1;
            }
        }
        this.i -= 1;
        return t;
    }
    pushFront(t) {
        if (this.i) {
            if (this.D > 0) {
                this.D -= 1;
            } else if (this.j > 0) {
                this.j -= 1;
                this.D = this.F - 1;
            } else {
                this.j = this.P - 1;
                this.D = this.F - 1;
            }
            if (this.j === this.R && this.D === this.N) this.T();
        }
        this.i += 1;
        this.A[this.j][this.D] = t;
        return this.i;
    }
    popFront() {
        if (this.i === 0) return;
        const t = this.A[this.j][this.D];
        if (this.i !== 1) {
            if (this.D < this.F - 1) {
                this.D += 1;
            } else if (this.j < this.P - 1) {
                this.j += 1;
                this.D = 0;
            } else {
                this.j = 0;
                this.D = 0;
            }
        }
        this.i -= 1;
        return t;
    }
    getElementByPos(t) {
        if (t < 0 || t > this.i - 1) {
            throw new RangeError;
        }
        const {curNodeBucketIndex: i, curNodePointerIndex: s} = this.O(t);
        return this.A[i][s];
    }
    setElementByPos(t, i) {
        if (t < 0 || t > this.i - 1) {
            throw new RangeError;
        }
        const {curNodeBucketIndex: s, curNodePointerIndex: h} = this.O(t);
        this.A[s][h] = i;
    }
    insert(t, i, s = 1) {
        if (t < 0 || t > this.i) {
            throw new RangeError;
        }
        if (t === 0) {
            while (s--) this.pushFront(i);
        } else if (t === this.i) {
            while (s--) this.pushBack(i);
        } else {
            const h = [];
            for (let i = t; i < this.i; ++i) {
                h.push(this.getElementByPos(i));
            }
            this.cut(t - 1);
            for (let t = 0; t < s; ++t) this.pushBack(i);
            for (let t = 0; t < h.length; ++t) this.pushBack(h[t]);
        }
        return this.i;
    }
    cut(t) {
        if (t < 0) {
            this.clear();
            return 0;
        }
        const {curNodeBucketIndex: i, curNodePointerIndex: s} = this.O(t);
        this.R = i;
        this.N = s;
        this.i = t + 1;
        return this.i;
    }
    eraseElementByPos(t) {
        if (t < 0 || t > this.i - 1) {
            throw new RangeError;
        }
        if (t === 0) this.popFront(); else if (t === this.i - 1) this.popBack(); else {
            const i = [];
            for (let s = t + 1; s < this.i; ++s) {
                i.push(this.getElementByPos(s));
            }
            this.cut(t);
            this.popBack();
            const s = this;
            i.forEach((function(t) {
                s.pushBack(t);
            }));
        }
        return this.i;
    }
    eraseElementByValue(t) {
        if (this.i === 0) return 0;
        const i = [];
        for (let s = 0; s < this.i; ++s) {
            const h = this.getElementByPos(s);
            if (h !== t) i.push(h);
        }
        const s = i.length;
        for (let t = 0; t < s; ++t) this.setElementByPos(t, i[t]);
        return this.cut(s - 1);
    }
    eraseElementByIterator(t) {
        const i = t.o;
        this.eraseElementByPos(i);
        t = t.next();
        return t;
    }
    find(t) {
        for (let i = 0; i < this.i; ++i) {
            if (this.getElementByPos(i) === t) {
                return new DequeIterator(i, this);
            }
        }
        return this.end();
    }
    reverse() {
        let t = 0;
        let i = this.i - 1;
        while (t < i) {
            const s = this.getElementByPos(t);
            this.setElementByPos(t, this.getElementByPos(i));
            this.setElementByPos(i, s);
            t += 1;
            i -= 1;
        }
    }
    unique() {
        if (this.i <= 1) {
            return this.i;
        }
        let t = 1;
        let i = this.getElementByPos(0);
        for (let s = 1; s < this.i; ++s) {
            const h = this.getElementByPos(s);
            if (h !== i) {
                i = h;
                this.setElementByPos(t++, h);
            }
        }
        while (this.i > t) this.popBack();
        return this.i;
    }
    sort(t) {
        const i = [];
        for (let t = 0; t < this.i; ++t) {
            i.push(this.getElementByPos(t));
        }
        i.sort(t);
        for (let t = 0; t < this.i; ++t) this.setElementByPos(t, i[t]);
    }
    shrinkToFit() {
        if (this.i === 0) return;
        const t = [];
        this.forEach((function(i) {
            t.push(i);
        }));
        this.P = Math.max(Math.ceil(this.i / this.F), 1);
        this.i = this.j = this.R = this.D = this.N = 0;
        this.A = [];
        for (let t = 0; t < this.P; ++t) {
            this.A.push(new Array(this.F));
        }
        for (let i = 0; i < t.length; ++i) this.pushBack(t[i]);
    }
    forEach(t) {
        for (let i = 0; i < this.i; ++i) {
            t(this.getElementByPos(i), i, this);
        }
    }
    [Symbol.iterator]() {
        return function*() {
            for (let t = 0; t < this.i; ++t) {
                yield this.getElementByPos(t);
            }
        }.bind(this)();
    }
}

var _default = Deque;

exports.default = _default;
//# sourceMappingURL=Deque.js.map

}, function(modId) { var map = {"./Base":1773805786171,"./Base/RandomIterator":1773805786172}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1773805786176, function(require, module, exports) {


Object.defineProperty(exports, "t", {
    value: true
});

exports.default = void 0;

var _Base = _interopRequireDefault(require("./Base"));

var _TreeIterator = _interopRequireDefault(require("./Base/TreeIterator"));

var _throwError = require("../../utils/throwError");

function _interopRequireDefault(e) {
    return e && e.t ? e : {
        default: e
    };
}

class OrderedSetIterator extends _TreeIterator.default {
    constructor(e, t, r, i) {
        super(e, t, i);
        this.container = r;
    }
    get pointer() {
        if (this.o === this.h) {
            (0, _throwError.throwIteratorAccessError)();
        }
        return this.o.u;
    }
    copy() {
        return new OrderedSetIterator(this.o, this.h, this.container, this.iteratorType);
    }
}

class OrderedSet extends _Base.default {
    constructor(e = [], t, r) {
        super(t, r);
        const i = this;
        e.forEach((function(e) {
            i.insert(e);
        }));
    }
    * K(e) {
        if (e === undefined) return;
        yield* this.K(e.U);
        yield e.u;
        yield* this.K(e.W);
    }
    begin() {
        return new OrderedSetIterator(this.h.U || this.h, this.h, this);
    }
    end() {
        return new OrderedSetIterator(this.h, this.h, this);
    }
    rBegin() {
        return new OrderedSetIterator(this.h.W || this.h, this.h, this, 1);
    }
    rEnd() {
        return new OrderedSetIterator(this.h, this.h, this, 1);
    }
    front() {
        return this.h.U ? this.h.U.u : undefined;
    }
    back() {
        return this.h.W ? this.h.W.u : undefined;
    }
    insert(e, t) {
        return this.M(e, undefined, t);
    }
    find(e) {
        const t = this.I(this.Y, e);
        return new OrderedSetIterator(t, this.h, this);
    }
    lowerBound(e) {
        const t = this.X(this.Y, e);
        return new OrderedSetIterator(t, this.h, this);
    }
    upperBound(e) {
        const t = this.Z(this.Y, e);
        return new OrderedSetIterator(t, this.h, this);
    }
    reverseLowerBound(e) {
        const t = this.$(this.Y, e);
        return new OrderedSetIterator(t, this.h, this);
    }
    reverseUpperBound(e) {
        const t = this.rr(this.Y, e);
        return new OrderedSetIterator(t, this.h, this);
    }
    union(e) {
        const t = this;
        e.forEach((function(e) {
            t.insert(e);
        }));
        return this.i;
    }
    [Symbol.iterator]() {
        return this.K(this.Y);
    }
}

var _default = OrderedSet;

exports.default = _default;
//# sourceMappingURL=OrderedSet.js.map

}, function(modId) { var map = {"./Base":1773805786177,"./Base/TreeIterator":1773805786179,"../../utils/throwError":1773805786173}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1773805786177, function(require, module, exports) {


Object.defineProperty(exports, "t", {
    value: true
});

exports.default = void 0;

var _TreeNode = require("./TreeNode");

var _ContainerBase = require("../../ContainerBase");

var _throwError = require("../../../utils/throwError");

class TreeContainer extends _ContainerBase.Container {
    constructor(e = function(e, t) {
        if (e < t) return -1;
        if (e > t) return 1;
        return 0;
    }, t = false) {
        super();
        this.Y = undefined;
        this.v = e;
        if (t) {
            this.re = _TreeNode.TreeNodeEnableIndex;
            this.M = function(e, t, i) {
                const s = this.ne(e, t, i);
                if (s) {
                    let e = s.tt;
                    while (e !== this.h) {
                        e.rt += 1;
                        e = e.tt;
                    }
                    const t = this.he(s);
                    if (t) {
                        const {parentNode: e, grandParent: i, curNode: s} = t;
                        e.ie();
                        i.ie();
                        s.ie();
                    }
                }
                return this.i;
            };
            this.V = function(e) {
                let t = this.fe(e);
                while (t !== this.h) {
                    t.rt -= 1;
                    t = t.tt;
                }
            };
        } else {
            this.re = _TreeNode.TreeNode;
            this.M = function(e, t, i) {
                const s = this.ne(e, t, i);
                if (s) this.he(s);
                return this.i;
            };
            this.V = this.fe;
        }
        this.h = new this.re;
    }
    X(e, t) {
        let i = this.h;
        while (e) {
            const s = this.v(e.u, t);
            if (s < 0) {
                e = e.W;
            } else if (s > 0) {
                i = e;
                e = e.U;
            } else return e;
        }
        return i;
    }
    Z(e, t) {
        let i = this.h;
        while (e) {
            const s = this.v(e.u, t);
            if (s <= 0) {
                e = e.W;
            } else {
                i = e;
                e = e.U;
            }
        }
        return i;
    }
    $(e, t) {
        let i = this.h;
        while (e) {
            const s = this.v(e.u, t);
            if (s < 0) {
                i = e;
                e = e.W;
            } else if (s > 0) {
                e = e.U;
            } else return e;
        }
        return i;
    }
    rr(e, t) {
        let i = this.h;
        while (e) {
            const s = this.v(e.u, t);
            if (s < 0) {
                i = e;
                e = e.W;
            } else {
                e = e.U;
            }
        }
        return i;
    }
    ue(e) {
        while (true) {
            const t = e.tt;
            if (t === this.h) return;
            if (e.ee === 1) {
                e.ee = 0;
                return;
            }
            if (e === t.U) {
                const i = t.W;
                if (i.ee === 1) {
                    i.ee = 0;
                    t.ee = 1;
                    if (t === this.Y) {
                        this.Y = t.te();
                    } else t.te();
                } else {
                    if (i.W && i.W.ee === 1) {
                        i.ee = t.ee;
                        t.ee = 0;
                        i.W.ee = 0;
                        if (t === this.Y) {
                            this.Y = t.te();
                        } else t.te();
                        return;
                    } else if (i.U && i.U.ee === 1) {
                        i.ee = 1;
                        i.U.ee = 0;
                        i.se();
                    } else {
                        i.ee = 1;
                        e = t;
                    }
                }
            } else {
                const i = t.U;
                if (i.ee === 1) {
                    i.ee = 0;
                    t.ee = 1;
                    if (t === this.Y) {
                        this.Y = t.se();
                    } else t.se();
                } else {
                    if (i.U && i.U.ee === 1) {
                        i.ee = t.ee;
                        t.ee = 0;
                        i.U.ee = 0;
                        if (t === this.Y) {
                            this.Y = t.se();
                        } else t.se();
                        return;
                    } else if (i.W && i.W.ee === 1) {
                        i.ee = 1;
                        i.W.ee = 0;
                        i.te();
                    } else {
                        i.ee = 1;
                        e = t;
                    }
                }
            }
        }
    }
    fe(e) {
        if (this.i === 1) {
            this.clear();
            return this.h;
        }
        let t = e;
        while (t.U || t.W) {
            if (t.W) {
                t = t.W;
                while (t.U) t = t.U;
            } else {
                t = t.U;
            }
            [e.u, t.u] = [ t.u, e.u ];
            [e.l, t.l] = [ t.l, e.l ];
            e = t;
        }
        if (this.h.U === t) {
            this.h.U = t.tt;
        } else if (this.h.W === t) {
            this.h.W = t.tt;
        }
        this.ue(t);
        const i = t.tt;
        if (t === i.U) {
            i.U = undefined;
        } else i.W = undefined;
        this.i -= 1;
        this.Y.ee = 0;
        return i;
    }
    oe(e, t) {
        if (e === undefined) return false;
        const i = this.oe(e.U, t);
        if (i) return true;
        if (t(e)) return true;
        return this.oe(e.W, t);
    }
    he(e) {
        while (true) {
            const t = e.tt;
            if (t.ee === 0) return;
            const i = t.tt;
            if (t === i.U) {
                const s = i.W;
                if (s && s.ee === 1) {
                    s.ee = t.ee = 0;
                    if (i === this.Y) return;
                    i.ee = 1;
                    e = i;
                    continue;
                } else if (e === t.W) {
                    e.ee = 0;
                    if (e.U) e.U.tt = t;
                    if (e.W) e.W.tt = i;
                    t.W = e.U;
                    i.U = e.W;
                    e.U = t;
                    e.W = i;
                    if (i === this.Y) {
                        this.Y = e;
                        this.h.tt = e;
                    } else {
                        const t = i.tt;
                        if (t.U === i) {
                            t.U = e;
                        } else t.W = e;
                    }
                    e.tt = i.tt;
                    t.tt = e;
                    i.tt = e;
                    i.ee = 1;
                    return {
                        parentNode: t,
                        grandParent: i,
                        curNode: e
                    };
                } else {
                    t.ee = 0;
                    if (i === this.Y) {
                        this.Y = i.se();
                    } else i.se();
                    i.ee = 1;
                }
            } else {
                const s = i.U;
                if (s && s.ee === 1) {
                    s.ee = t.ee = 0;
                    if (i === this.Y) return;
                    i.ee = 1;
                    e = i;
                    continue;
                } else if (e === t.U) {
                    e.ee = 0;
                    if (e.U) e.U.tt = i;
                    if (e.W) e.W.tt = t;
                    i.W = e.U;
                    t.U = e.W;
                    e.U = i;
                    e.W = t;
                    if (i === this.Y) {
                        this.Y = e;
                        this.h.tt = e;
                    } else {
                        const t = i.tt;
                        if (t.U === i) {
                            t.U = e;
                        } else t.W = e;
                    }
                    e.tt = i.tt;
                    t.tt = e;
                    i.tt = e;
                    i.ee = 1;
                    return {
                        parentNode: t,
                        grandParent: i,
                        curNode: e
                    };
                } else {
                    t.ee = 0;
                    if (i === this.Y) {
                        this.Y = i.te();
                    } else i.te();
                    i.ee = 1;
                }
            }
            return;
        }
    }
    ne(e, t, i) {
        if (this.Y === undefined) {
            this.i += 1;
            this.Y = new this.re(e, t);
            this.Y.ee = 0;
            this.Y.tt = this.h;
            this.h.tt = this.Y;
            this.h.U = this.Y;
            this.h.W = this.Y;
            return;
        }
        let s;
        const r = this.h.U;
        const n = this.v(r.u, e);
        if (n === 0) {
            r.l = t;
            return;
        } else if (n > 0) {
            r.U = new this.re(e, t);
            r.U.tt = r;
            s = r.U;
            this.h.U = s;
        } else {
            const r = this.h.W;
            const n = this.v(r.u, e);
            if (n === 0) {
                r.l = t;
                return;
            } else if (n < 0) {
                r.W = new this.re(e, t);
                r.W.tt = r;
                s = r.W;
                this.h.W = s;
            } else {
                if (i !== undefined) {
                    const r = i.o;
                    if (r !== this.h) {
                        const i = this.v(r.u, e);
                        if (i === 0) {
                            r.l = t;
                            return;
                        } else if (i > 0) {
                            const i = r.L();
                            const n = this.v(i.u, e);
                            if (n === 0) {
                                i.l = t;
                                return;
                            } else if (n < 0) {
                                s = new this.re(e, t);
                                if (i.W === undefined) {
                                    i.W = s;
                                    s.tt = i;
                                } else {
                                    r.U = s;
                                    s.tt = r;
                                }
                            }
                        }
                    }
                }
                if (s === undefined) {
                    s = this.Y;
                    while (true) {
                        const i = this.v(s.u, e);
                        if (i > 0) {
                            if (s.U === undefined) {
                                s.U = new this.re(e, t);
                                s.U.tt = s;
                                s = s.U;
                                break;
                            }
                            s = s.U;
                        } else if (i < 0) {
                            if (s.W === undefined) {
                                s.W = new this.re(e, t);
                                s.W.tt = s;
                                s = s.W;
                                break;
                            }
                            s = s.W;
                        } else {
                            s.l = t;
                            return;
                        }
                    }
                }
            }
        }
        this.i += 1;
        return s;
    }
    I(e, t) {
        while (e) {
            const i = this.v(e.u, t);
            if (i < 0) {
                e = e.W;
            } else if (i > 0) {
                e = e.U;
            } else return e;
        }
        return e || this.h;
    }
    clear() {
        this.i = 0;
        this.Y = undefined;
        this.h.tt = undefined;
        this.h.U = this.h.W = undefined;
    }
    updateKeyByIterator(e, t) {
        const i = e.o;
        if (i === this.h) {
            (0, _throwError.throwIteratorAccessError)();
        }
        if (this.i === 1) {
            i.u = t;
            return true;
        }
        if (i === this.h.U) {
            if (this.v(i.B().u, t) > 0) {
                i.u = t;
                return true;
            }
            return false;
        }
        if (i === this.h.W) {
            if (this.v(i.L().u, t) < 0) {
                i.u = t;
                return true;
            }
            return false;
        }
        const s = i.L().u;
        if (this.v(s, t) >= 0) return false;
        const r = i.B().u;
        if (this.v(r, t) <= 0) return false;
        i.u = t;
        return true;
    }
    eraseElementByPos(e) {
        if (e < 0 || e > this.i - 1) {
            throw new RangeError;
        }
        let t = 0;
        const i = this;
        this.oe(this.Y, (function(s) {
            if (e === t) {
                i.V(s);
                return true;
            }
            t += 1;
            return false;
        }));
        return this.i;
    }
    eraseElementByKey(e) {
        if (this.i === 0) return false;
        const t = this.I(this.Y, e);
        if (t === this.h) return false;
        this.V(t);
        return true;
    }
    eraseElementByIterator(e) {
        const t = e.o;
        if (t === this.h) {
            (0, _throwError.throwIteratorAccessError)();
        }
        const i = t.W === undefined;
        const s = e.iteratorType === 0;
        if (s) {
            if (i) e.next();
        } else {
            if (!i || t.U === undefined) e.next();
        }
        this.V(t);
        return e;
    }
    forEach(e) {
        let t = 0;
        for (const i of this) e(i, t++, this);
    }
    getElementByPos(e) {
        if (e < 0 || e > this.i - 1) {
            throw new RangeError;
        }
        let t;
        let i = 0;
        for (const s of this) {
            if (i === e) {
                t = s;
                break;
            }
            i += 1;
        }
        return t;
    }
    getHeight() {
        if (this.i === 0) return 0;
        const traversal = function(e) {
            if (!e) return 0;
            return Math.max(traversal(e.U), traversal(e.W)) + 1;
        };
        return traversal(this.Y);
    }
}

var _default = TreeContainer;

exports.default = _default;
//# sourceMappingURL=index.js.map

}, function(modId) { var map = {"./TreeNode":1773805786178,"../../ContainerBase":1773805786167,"../../../utils/throwError":1773805786173}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1773805786178, function(require, module, exports) {


Object.defineProperty(exports, "t", {
    value: true
});

exports.TreeNodeEnableIndex = exports.TreeNode = void 0;

class TreeNode {
    constructor(e, t) {
        this.ee = 1;
        this.u = undefined;
        this.l = undefined;
        this.U = undefined;
        this.W = undefined;
        this.tt = undefined;
        this.u = e;
        this.l = t;
    }
    L() {
        let e = this;
        if (e.ee === 1 && e.tt.tt === e) {
            e = e.W;
        } else if (e.U) {
            e = e.U;
            while (e.W) {
                e = e.W;
            }
        } else {
            let t = e.tt;
            while (t.U === e) {
                e = t;
                t = e.tt;
            }
            e = t;
        }
        return e;
    }
    B() {
        let e = this;
        if (e.W) {
            e = e.W;
            while (e.U) {
                e = e.U;
            }
            return e;
        } else {
            let t = e.tt;
            while (t.W === e) {
                e = t;
                t = e.tt;
            }
            if (e.W !== t) {
                return t;
            } else return e;
        }
    }
    te() {
        const e = this.tt;
        const t = this.W;
        const s = t.U;
        if (e.tt === this) e.tt = t; else if (e.U === this) e.U = t; else e.W = t;
        t.tt = e;
        t.U = this;
        this.tt = t;
        this.W = s;
        if (s) s.tt = this;
        return t;
    }
    se() {
        const e = this.tt;
        const t = this.U;
        const s = t.W;
        if (e.tt === this) e.tt = t; else if (e.U === this) e.U = t; else e.W = t;
        t.tt = e;
        t.W = this;
        this.tt = t;
        this.U = s;
        if (s) s.tt = this;
        return t;
    }
}

exports.TreeNode = TreeNode;

class TreeNodeEnableIndex extends TreeNode {
    constructor() {
        super(...arguments);
        this.rt = 1;
    }
    te() {
        const e = super.te();
        this.ie();
        e.ie();
        return e;
    }
    se() {
        const e = super.se();
        this.ie();
        e.ie();
        return e;
    }
    ie() {
        this.rt = 1;
        if (this.U) {
            this.rt += this.U.rt;
        }
        if (this.W) {
            this.rt += this.W.rt;
        }
    }
}

exports.TreeNodeEnableIndex = TreeNodeEnableIndex;
//# sourceMappingURL=TreeNode.js.map

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1773805786179, function(require, module, exports) {


Object.defineProperty(exports, "t", {
    value: true
});

exports.default = void 0;

var _ContainerBase = require("../../ContainerBase");

var _throwError = require("../../../utils/throwError");

class TreeIterator extends _ContainerBase.ContainerIterator {
    constructor(t, r, i) {
        super(i);
        this.o = t;
        this.h = r;
        if (this.iteratorType === 0) {
            this.pre = function() {
                if (this.o === this.h.U) {
                    (0, _throwError.throwIteratorAccessError)();
                }
                this.o = this.o.L();
                return this;
            };
            this.next = function() {
                if (this.o === this.h) {
                    (0, _throwError.throwIteratorAccessError)();
                }
                this.o = this.o.B();
                return this;
            };
        } else {
            this.pre = function() {
                if (this.o === this.h.W) {
                    (0, _throwError.throwIteratorAccessError)();
                }
                this.o = this.o.B();
                return this;
            };
            this.next = function() {
                if (this.o === this.h) {
                    (0, _throwError.throwIteratorAccessError)();
                }
                this.o = this.o.L();
                return this;
            };
        }
    }
    get index() {
        let t = this.o;
        const r = this.h.tt;
        if (t === this.h) {
            if (r) {
                return r.rt - 1;
            }
            return 0;
        }
        let i = 0;
        if (t.U) {
            i += t.U.rt;
        }
        while (t !== r) {
            const r = t.tt;
            if (t === r.W) {
                i += 1;
                if (r.U) {
                    i += r.U.rt;
                }
            }
            t = r;
        }
        return i;
    }
}

var _default = TreeIterator;

exports.default = _default;
//# sourceMappingURL=TreeIterator.js.map

}, function(modId) { var map = {"../../ContainerBase":1773805786167,"../../../utils/throwError":1773805786173}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1773805786180, function(require, module, exports) {


Object.defineProperty(exports, "t", {
    value: true
});

exports.default = void 0;

var _Base = _interopRequireDefault(require("./Base"));

var _TreeIterator = _interopRequireDefault(require("./Base/TreeIterator"));

var _throwError = require("../../utils/throwError");

function _interopRequireDefault(r) {
    return r && r.t ? r : {
        default: r
    };
}

class OrderedMapIterator extends _TreeIterator.default {
    constructor(r, t, e, s) {
        super(r, t, s);
        this.container = e;
    }
    get pointer() {
        if (this.o === this.h) {
            (0, _throwError.throwIteratorAccessError)();
        }
        const r = this;
        return new Proxy([], {
            get(t, e) {
                if (e === "0") return r.o.u; else if (e === "1") return r.o.l;
            },
            set(t, e, s) {
                if (e !== "1") {
                    throw new TypeError("props must be 1");
                }
                r.o.l = s;
                return true;
            }
        });
    }
    copy() {
        return new OrderedMapIterator(this.o, this.h, this.container, this.iteratorType);
    }
}

class OrderedMap extends _Base.default {
    constructor(r = [], t, e) {
        super(t, e);
        const s = this;
        r.forEach((function(r) {
            s.setElement(r[0], r[1]);
        }));
    }
    * K(r) {
        if (r === undefined) return;
        yield* this.K(r.U);
        yield [ r.u, r.l ];
        yield* this.K(r.W);
    }
    begin() {
        return new OrderedMapIterator(this.h.U || this.h, this.h, this);
    }
    end() {
        return new OrderedMapIterator(this.h, this.h, this);
    }
    rBegin() {
        return new OrderedMapIterator(this.h.W || this.h, this.h, this, 1);
    }
    rEnd() {
        return new OrderedMapIterator(this.h, this.h, this, 1);
    }
    front() {
        if (this.i === 0) return;
        const r = this.h.U;
        return [ r.u, r.l ];
    }
    back() {
        if (this.i === 0) return;
        const r = this.h.W;
        return [ r.u, r.l ];
    }
    lowerBound(r) {
        const t = this.X(this.Y, r);
        return new OrderedMapIterator(t, this.h, this);
    }
    upperBound(r) {
        const t = this.Z(this.Y, r);
        return new OrderedMapIterator(t, this.h, this);
    }
    reverseLowerBound(r) {
        const t = this.$(this.Y, r);
        return new OrderedMapIterator(t, this.h, this);
    }
    reverseUpperBound(r) {
        const t = this.rr(this.Y, r);
        return new OrderedMapIterator(t, this.h, this);
    }
    setElement(r, t, e) {
        return this.M(r, t, e);
    }
    find(r) {
        const t = this.I(this.Y, r);
        return new OrderedMapIterator(t, this.h, this);
    }
    getElementByKey(r) {
        const t = this.I(this.Y, r);
        return t.l;
    }
    union(r) {
        const t = this;
        r.forEach((function(r) {
            t.setElement(r[0], r[1]);
        }));
        return this.i;
    }
    [Symbol.iterator]() {
        return this.K(this.Y);
    }
}

var _default = OrderedMap;

exports.default = _default;
//# sourceMappingURL=OrderedMap.js.map

}, function(modId) { var map = {"./Base":1773805786177,"./Base/TreeIterator":1773805786179,"../../utils/throwError":1773805786173}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1773805786181, function(require, module, exports) {


Object.defineProperty(exports, "t", {
    value: true
});

exports.default = void 0;

var _Base = require("./Base");

var _throwError = require("../../utils/throwError");

class HashSetIterator extends _Base.HashContainerIterator {
    constructor(t, e, r, s) {
        super(t, e, s);
        this.container = r;
    }
    get pointer() {
        if (this.o === this.h) {
            (0, _throwError.throwIteratorAccessError)();
        }
        return this.o.u;
    }
    copy() {
        return new HashSetIterator(this.o, this.h, this.container, this.iteratorType);
    }
}

class HashSet extends _Base.HashContainer {
    constructor(t = []) {
        super();
        const e = this;
        t.forEach((function(t) {
            e.insert(t);
        }));
    }
    begin() {
        return new HashSetIterator(this.p, this.h, this);
    }
    end() {
        return new HashSetIterator(this.h, this.h, this);
    }
    rBegin() {
        return new HashSetIterator(this._, this.h, this, 1);
    }
    rEnd() {
        return new HashSetIterator(this.h, this.h, this, 1);
    }
    front() {
        return this.p.u;
    }
    back() {
        return this._.u;
    }
    insert(t, e) {
        return this.M(t, undefined, e);
    }
    getElementByPos(t) {
        if (t < 0 || t > this.i - 1) {
            throw new RangeError;
        }
        let e = this.p;
        while (t--) {
            e = e.B;
        }
        return e.u;
    }
    find(t, e) {
        const r = this.I(t, e);
        return new HashSetIterator(r, this.h, this);
    }
    forEach(t) {
        let e = 0;
        let r = this.p;
        while (r !== this.h) {
            t(r.u, e++, this);
            r = r.B;
        }
    }
    [Symbol.iterator]() {
        return function*() {
            let t = this.p;
            while (t !== this.h) {
                yield t.u;
                t = t.B;
            }
        }.bind(this)();
    }
}

var _default = HashSet;

exports.default = _default;
//# sourceMappingURL=HashSet.js.map

}, function(modId) { var map = {"./Base":1773805786182,"../../utils/throwError":1773805786173}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1773805786182, function(require, module, exports) {


Object.defineProperty(exports, "t", {
    value: true
});

exports.HashContainerIterator = exports.HashContainer = void 0;

var _ContainerBase = require("../../ContainerBase");

var _checkObject = _interopRequireDefault(require("../../../utils/checkObject"));

var _throwError = require("../../../utils/throwError");

function _interopRequireDefault(t) {
    return t && t.t ? t : {
        default: t
    };
}

class HashContainerIterator extends _ContainerBase.ContainerIterator {
    constructor(t, e, i) {
        super(i);
        this.o = t;
        this.h = e;
        if (this.iteratorType === 0) {
            this.pre = function() {
                if (this.o.L === this.h) {
                    (0, _throwError.throwIteratorAccessError)();
                }
                this.o = this.o.L;
                return this;
            };
            this.next = function() {
                if (this.o === this.h) {
                    (0, _throwError.throwIteratorAccessError)();
                }
                this.o = this.o.B;
                return this;
            };
        } else {
            this.pre = function() {
                if (this.o.B === this.h) {
                    (0, _throwError.throwIteratorAccessError)();
                }
                this.o = this.o.B;
                return this;
            };
            this.next = function() {
                if (this.o === this.h) {
                    (0, _throwError.throwIteratorAccessError)();
                }
                this.o = this.o.L;
                return this;
            };
        }
    }
}

exports.HashContainerIterator = HashContainerIterator;

class HashContainer extends _ContainerBase.Container {
    constructor() {
        super();
        this.H = [];
        this.g = {};
        this.HASH_TAG = Symbol("@@HASH_TAG");
        Object.setPrototypeOf(this.g, null);
        this.h = {};
        this.h.L = this.h.B = this.p = this._ = this.h;
    }
    V(t) {
        const {L: e, B: i} = t;
        e.B = i;
        i.L = e;
        if (t === this.p) {
            this.p = i;
        }
        if (t === this._) {
            this._ = e;
        }
        this.i -= 1;
    }
    M(t, e, i) {
        if (i === undefined) i = (0, _checkObject.default)(t);
        let s;
        if (i) {
            const i = t[this.HASH_TAG];
            if (i !== undefined) {
                this.H[i].l = e;
                return this.i;
            }
            Object.defineProperty(t, this.HASH_TAG, {
                value: this.H.length,
                configurable: true
            });
            s = {
                u: t,
                l: e,
                L: this._,
                B: this.h
            };
            this.H.push(s);
        } else {
            const i = this.g[t];
            if (i) {
                i.l = e;
                return this.i;
            }
            s = {
                u: t,
                l: e,
                L: this._,
                B: this.h
            };
            this.g[t] = s;
        }
        if (this.i === 0) {
            this.p = s;
            this.h.B = s;
        } else {
            this._.B = s;
        }
        this._ = s;
        this.h.L = s;
        return ++this.i;
    }
    I(t, e) {
        if (e === undefined) e = (0, _checkObject.default)(t);
        if (e) {
            const e = t[this.HASH_TAG];
            if (e === undefined) return this.h;
            return this.H[e];
        } else {
            return this.g[t] || this.h;
        }
    }
    clear() {
        const t = this.HASH_TAG;
        this.H.forEach((function(e) {
            delete e.u[t];
        }));
        this.H = [];
        this.g = {};
        Object.setPrototypeOf(this.g, null);
        this.i = 0;
        this.p = this._ = this.h.L = this.h.B = this.h;
    }
    eraseElementByKey(t, e) {
        let i;
        if (e === undefined) e = (0, _checkObject.default)(t);
        if (e) {
            const e = t[this.HASH_TAG];
            if (e === undefined) return false;
            delete t[this.HASH_TAG];
            i = this.H[e];
            delete this.H[e];
        } else {
            i = this.g[t];
            if (i === undefined) return false;
            delete this.g[t];
        }
        this.V(i);
        return true;
    }
    eraseElementByIterator(t) {
        const e = t.o;
        if (e === this.h) {
            (0, _throwError.throwIteratorAccessError)();
        }
        this.V(e);
        return t.next();
    }
    eraseElementByPos(t) {
        if (t < 0 || t > this.i - 1) {
            throw new RangeError;
        }
        let e = this.p;
        while (t--) {
            e = e.B;
        }
        this.V(e);
        return this.i;
    }
}

exports.HashContainer = HashContainer;
//# sourceMappingURL=index.js.map

}, function(modId) { var map = {"../../ContainerBase":1773805786167,"../../../utils/checkObject":1773805786183,"../../../utils/throwError":1773805786173}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1773805786183, function(require, module, exports) {


Object.defineProperty(exports, "t", {
    value: true
});

exports.default = checkObject;

function checkObject(e) {
    const t = typeof e;
    return t === "object" && e !== null || t === "function";
}
//# sourceMappingURL=checkObject.js.map

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1773805786184, function(require, module, exports) {


Object.defineProperty(exports, "t", {
    value: true
});

exports.default = void 0;

var _Base = require("./Base");

var _checkObject = _interopRequireDefault(require("../../utils/checkObject"));

var _throwError = require("../../utils/throwError");

function _interopRequireDefault(t) {
    return t && t.t ? t : {
        default: t
    };
}

class HashMapIterator extends _Base.HashContainerIterator {
    constructor(t, e, r, s) {
        super(t, e, s);
        this.container = r;
    }
    get pointer() {
        if (this.o === this.h) {
            (0, _throwError.throwIteratorAccessError)();
        }
        const t = this;
        return new Proxy([], {
            get(e, r) {
                if (r === "0") return t.o.u; else if (r === "1") return t.o.l;
            },
            set(e, r, s) {
                if (r !== "1") {
                    throw new TypeError("props must be 1");
                }
                t.o.l = s;
                return true;
            }
        });
    }
    copy() {
        return new HashMapIterator(this.o, this.h, this.container, this.iteratorType);
    }
}

class HashMap extends _Base.HashContainer {
    constructor(t = []) {
        super();
        const e = this;
        t.forEach((function(t) {
            e.setElement(t[0], t[1]);
        }));
    }
    begin() {
        return new HashMapIterator(this.p, this.h, this);
    }
    end() {
        return new HashMapIterator(this.h, this.h, this);
    }
    rBegin() {
        return new HashMapIterator(this._, this.h, this, 1);
    }
    rEnd() {
        return new HashMapIterator(this.h, this.h, this, 1);
    }
    front() {
        if (this.i === 0) return;
        return [ this.p.u, this.p.l ];
    }
    back() {
        if (this.i === 0) return;
        return [ this._.u, this._.l ];
    }
    setElement(t, e, r) {
        return this.M(t, e, r);
    }
    getElementByKey(t, e) {
        if (e === undefined) e = (0, _checkObject.default)(t);
        if (e) {
            const e = t[this.HASH_TAG];
            return e !== undefined ? this.H[e].l : undefined;
        }
        const r = this.g[t];
        return r ? r.l : undefined;
    }
    getElementByPos(t) {
        if (t < 0 || t > this.i - 1) {
            throw new RangeError;
        }
        let e = this.p;
        while (t--) {
            e = e.B;
        }
        return [ e.u, e.l ];
    }
    find(t, e) {
        const r = this.I(t, e);
        return new HashMapIterator(r, this.h, this);
    }
    forEach(t) {
        let e = 0;
        let r = this.p;
        while (r !== this.h) {
            t([ r.u, r.l ], e++, this);
            r = r.B;
        }
    }
    [Symbol.iterator]() {
        return function*() {
            let t = this.p;
            while (t !== this.h) {
                yield [ t.u, t.l ];
                t = t.B;
            }
        }.bind(this)();
    }
}

var _default = HashMap;

exports.default = _default;
//# sourceMappingURL=HashMap.js.map

}, function(modId) { var map = {"./Base":1773805786182,"../../utils/checkObject":1773805786183,"../../utils/throwError":1773805786173}; return __REQUIRE__(map[modId], modId); })
return __REQUIRE__(1773805786165);
})()
//miniprogram-npm-outsideDeps=[]
//# sourceMappingURL=index.js.map