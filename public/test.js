! function(t, e) {
  "object" == typeof exports && "object" == typeof module ? module.exports = e(require("babylonjs")) : "function" == typeof define && define.amd ? define("babylonjs-procedural-textures", ["babylonjs"], e) : "object" == typeof exports ? exports["babylonjs-procedural-textures"] = e(require("babylonjs")) : t.PROCEDURALTEXTURES = e(t.BABYLON)
}("undefined" != typeof self ? self : "undefined" != typeof global ? global : this, (t => (() => {
  "use strict";
  var e = {
      520: e => {
        e.exports = t
      }
    },
    r = {};

  function o(t) {
    var i = r[t];
    if (void 0 !== i) return i.exports;
    var a = r[t] = {
      exports: {}
    };
    return e[t](a, a.exports, o), a.exports
  }
  o.d = (t, e) => {
    for (var r in e) o.o(e, r) && !o.o(t, r) && Object.defineProperty(t, r, {
      enumerable: !0,
      get: e[r]
    })
  }, o.g = function() {
    if ("object" == typeof globalThis) return globalThis;
    try {
      return this || new Function("return this")()
    } catch (t) {
      if ("object" == typeof window) return window
    }
  }(), o.o = (t, e) => Object.prototype.hasOwnProperty.call(t, e), o.r = t => {
    "undefined" != typeof Symbol && Symbol.toStringTag && Object.defineProperty(t, Symbol.toStringTag, {
      value: "Module"
    }), Object.defineProperty(t, "__esModule", {
      value: !0
    })
  };
  var i = {};
  return (() => {
    var t = {};
    o.r(t), o.d(t, {
      StarfieldProceduralTexture: () => a
    });
    var e = function(t, r) {
      return e = Object.setPrototypeOf || {
        __proto__: []
      }
      instanceof Array && function(t, e) {
        t.__proto__ = e
      } || function(t, e) {
        for (var r in e) Object.prototype.hasOwnProperty.call(e, r) && (t[r] = e[r])
      }, e(t, r)
    };

    function r(t, e, r, o) {
      var i, a = arguments.length,
        n = a < 3 ? e : null === o ? o = Object.getOwnPropertyDescriptor(e, r) : o;
      if ("object" == typeof Reflect && "function" == typeof Reflect.decorate) n = Reflect.decorate(t, e, r, o);
      else
        for (var s = t.length - 1; s >= 0; s--)(i = t[s]) && (n = (a < 3 ? i(n) : a > 3 ? i(e, r, n) : i(e, r)) || n);
      return a > 3 && n && Object.defineProperty(e, r, n), n
    }
    Object.create, Object.create;
    var i = o(520);
    i.ShaderStore.ShadersStore.starfieldProceduralTexturePixelShader = "precision highp float;\n#define volsteps 20\n#define iterations 15\nvarying vec2 vPosition;varying vec2 vUV;uniform float time;uniform float alpha;uniform float beta;uniform float zoom;uniform float formuparam;uniform float stepsize;uniform float tile;uniform float brightness;uniform float darkmatter;uniform float distfading;uniform float saturation;void main()\n{vec3 dir=vec3(vUV*zoom,1.);float localTime=time*0.0001;mat2 rot1=mat2(cos(alpha),sin(alpha),-sin(alpha),cos(alpha));mat2 rot2=mat2(cos(beta),sin(beta),-sin(beta),cos(beta));dir.xz*=rot1;dir.xy*=rot2;vec3 from_=vec3(1.,.5,0.5);from_+=vec3(-2.,localTime*2.,localTime);from_.xz*=rot1;from_.xy*=rot2;float s=0.1,fade=1.;vec3 v=vec3(0.);for (int r=0; r<volsteps; r++) {vec3 p=from_+s*dir*.5;p=abs(vec3(tile)-mod(p,vec3(tile*2.))); \nfloat pa,a=pa=0.;for (int i=0; i<iterations; i++) {p=abs(p)/dot(p,p)-formuparam; \na+=abs(length(p)-pa); \npa=length(p);}\nfloat dm=max(0.,darkmatter-a*a*.001); \na*=a*a; \nif (r>6) fade*=1.-dm; \nv+=fade;v+=vec3(s,s*s,s*s*s*s)*a*brightness*fade; \nfade*=distfading; \ns+=stepsize;}\nv=mix(vec3(length(v)),v,saturation); \ngl_FragColor=vec4(v*.01,1.);}";
    var a = function(t) {
      function o(e, r, o, i, a) {
        void 0 === o && (o = null);
        var n = t.call(this, e, r, "starfieldProceduralTexture", o, i, a) || this;
        return n._time = 1, n._alpha = .5, n._beta = .8, n._zoom = .8, n._formuparam = .53, n._stepsize = .1, n._tile = .85, n._brightness = .0015, n._darkmatter = .4, n._distfading = .73, n._saturation = .85, n.updateShaderUniforms(), n
      }
      return function(t, r) {
        if ("function" != typeof r && null !== r) throw new TypeError("Class extends value " + String(r) + " is not a constructor or null");

        function o() {
          this.constructor = t
        }
        e(t, r), t.prototype = null === r ? Object.create(r) : (o.prototype = r.prototype, new o)
      }(o, t), o.prototype.updateShaderUniforms = function() {
        this.setFloat("time", this._time), this.setFloat("alpha", this._alpha), this.setFloat("beta", this._beta), this.setFloat("zoom", this._zoom), this.setFloat("formuparam", this._formuparam), this.setFloat("stepsize", this._stepsize), this.setFloat("tile", this._tile), this.setFloat("brightness", this._brightness), this.setFloat("darkmatter", this._darkmatter), this.setFloat("distfading", this._distfading), this.setFloat("saturation", this._saturation)
      }, Object.defineProperty(o.prototype, "time", {
        get: function() {
          return this._time
        },
        set: function(t) {
          this._time = t, this.updateShaderUniforms()
        },
        enumerable: !1,
        configurable: !0
      }), Object.defineProperty(o.prototype, "alpha", {
        get: function() {
          return this._alpha
        },
        set: function(t) {
          this._alpha = t, this.updateShaderUniforms()
        },
        enumerable: !1,
        configurable: !0
      }), Object.defineProperty(o.prototype, "beta", {
        get: function() {
          return this._beta
        },
        set: function(t) {
          this._beta = t, this.updateShaderUniforms()
        },
        enumerable: !1,
        configurable: !0
      }), Object.defineProperty(o.prototype, "formuparam", {
        get: function() {
          return this._formuparam
        },
        set: function(t) {
          this._formuparam = t, this.updateShaderUniforms()
        },
        enumerable: !1,
        configurable: !0
      }), Object.defineProperty(o.prototype, "stepsize", {
        get: function() {
          return this._stepsize
        },
        set: function(t) {
          this._stepsize = t, this.updateShaderUniforms()
        },
        enumerable: !1,
        configurable: !0
      }), Object.defineProperty(o.prototype, "zoom", {
        get: function() {
          return this._zoom
        },
        set: function(t) {
          this._zoom = t, this.updateShaderUniforms()
        },
        enumerable: !1,
        configurable: !0
      }), Object.defineProperty(o.prototype, "tile", {
        get: function() {
          return this._tile
        },
        set: function(t) {
          this._tile = t, this.updateShaderUniforms()
        },
        enumerable: !1,
        configurable: !0
      }), Object.defineProperty(o.prototype, "brightness", {
        get: function() {
          return this._brightness
        },
        set: function(t) {
          this._brightness = t, this.updateShaderUniforms()
        },
        enumerable: !1,
        configurable: !0
      }), Object.defineProperty(o.prototype, "darkmatter", {
        get: function() {
          return this._darkmatter
        },
        set: function(t) {
          this._darkmatter = t, this.updateShaderUniforms()
        },
        enumerable: !1,
        configurable: !0
      }), Object.defineProperty(o.prototype, "distfading", {
        get: function() {
          return this._distfading
        },
        set: function(t) {
          this._distfading = t, this.updateShaderUniforms()
        },
        enumerable: !1,
        configurable: !0
      }), Object.defineProperty(o.prototype, "saturation", {
        get: function() {
          return this._saturation
        },
        set: function(t) {
          this._saturation = t, this.updateShaderUniforms()
        },
        enumerable: !1,
        configurable: !0
      }), o.prototype.serialize = function() {
        var e = i.SerializationHelper.Serialize(this, t.prototype.serialize.call(this));
        return e.customType = "BABYLON.StarfieldProceduralTexture", e
      }, o.Parse = function(t, e, r) {
        return i.SerializationHelper.Parse((function() {
          return new o(t.name, t._size, e, void 0, t._generateMipMaps)
        }), t, e, r)
      }, r([(0, i.serialize)()], o.prototype, "time", null), r([(0, i.serialize)()], o.prototype, "alpha", null), r([(0, i.serialize)()], o.prototype, "beta", null), r([(0, i.serialize)()], o.prototype, "formuparam", null), r([(0, i.serialize)()], o.prototype, "stepsize", null), r([(0, i.serialize)()], o.prototype, "zoom", null), r([(0, i.serialize)()], o.prototype, "tile", null), r([(0, i.serialize)()], o.prototype, "brightness", null), r([(0, i.serialize)()], o.prototype, "darkmatter", null), r([(0, i.serialize)()], o.prototype, "distfading", null), r([(0, i.serialize)()], o.prototype, "saturation", null), o
    }(i.ProceduralTexture);
    (0, i.RegisterClass)("BABYLON.StarfieldProceduralTexture", a);
    const n = void 0 !== o.g ? o.g : "undefined" != typeof window ? window : void 0;
    if (void 0 !== n)
      for (const e in t) n.BABYLON[e] = t[e]
  })(), i.default
})()));
//# sourceMappingURL=babylon.starfieldProceduralTexture.min.js.map
