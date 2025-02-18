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

export class LuaStuff {
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
  }
}
