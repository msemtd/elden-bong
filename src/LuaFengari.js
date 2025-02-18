/* eslint-disable camelcase */
// cSpell:disable

import {
  FENGARI_AUTHORS,
  FENGARI_COPYRIGHT,
  FENGARI_RELEASE,
  FENGARI_VERSION,
  FENGARI_VERSION_MAJOR,
  FENGARI_VERSION_MINOR,
  FENGARI_VERSION_NUM,
  FENGARI_VERSION_RELEASE,
  luastring_eq,
  luastring_indexOf,
  luastring_of,
  to_jsstring,
  to_luastring,
  to_uristring,
  lua, luaconf, lualib, lauxlib,
} from 'fengari'
import * as interop from 'fengari-interop'

export class LuaFengari {
  constructor () {
    this.lua = lua
    this.lauxlib = lauxlib
    this.lualib = lualib
    this.luaconf = luaconf
    this.FENGARI_AUTHORS = FENGARI_AUTHORS
    this.FENGARI_COPYRIGHT = FENGARI_COPYRIGHT
    this.FENGARI_RELEASE = FENGARI_RELEASE
    this.FENGARI_VERSION = FENGARI_VERSION
    this.FENGARI_VERSION_MAJOR = FENGARI_VERSION_MAJOR
    this.FENGARI_VERSION_MINOR = FENGARI_VERSION_MINOR
    this.FENGARI_VERSION_NUM = FENGARI_VERSION_NUM
    this.FENGARI_VERSION_RELEASE = FENGARI_VERSION_RELEASE
    this.luastring_eq = luastring_eq
    this.luastring_indexOf = luastring_indexOf
    this.luastring_of = luastring_of
    this.to_jsstring = to_jsstring
    this.to_luastring = to_luastring
    this.to_uristring = to_uristring
    this.interop = interop
  }

  /* Helper function to load a JS string of Lua source */
  load (source, chunkname) {
    if (typeof source === 'string') {
      source = to_luastring(source)
    } else if (!(source instanceof Uint8Array)) {
      throw new TypeError('expects an array of bytes or javascript string')
    }

    chunkname = chunkname ? to_luastring(chunkname) : null
    const ok = this.lauxlib.luaL_loadbuffer(this.L, source, null, chunkname)
    let res
    if (ok === this.lua.LUA_ERRSYNTAX) {
      res = new SyntaxError(this.lua.lua_tojsstring(this.L, -1))
    } else {
      res = this.interop.tojs(this.L, -1)
    }
    this.lua.lua_pop(this.L, 1)
    if (ok !== this.lua.LUA_OK) {
      throw res
    }
    return res
  }

  runScriptString (value) {
    const res = this.load(value, 'my chunk')
    // actually run just using the proxy object and return the top of the call stack...
    console.log(res())
    return res
  }
}
