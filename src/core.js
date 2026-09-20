/**
 * Build and parse query strings with repeated keys handled correctly.
 *
 * The URLSearchParams API handles repeated keys, but its stringification
 * always encodes spaces as '+' and sorts keys alphabetically. This library
 * deliberately preserves insertion order and uses %20 for spaces, matching
 * the behaviour of the WHATWG URL specification for application/x-www-form-urlencoded
 * when the string is built by hand.
 */
export class QueryBuild {
  /**
   * @param {string} [query] - optional query string to parse, without leading '?'
   */
  constructor(query) {
    /**
     * Ordered list of [key, value] pairs. Repeated keys are stored as separate
     * entries so that round-tripping preserves exact multiplicity and order.
     * @type {Array<[string, string]>}
     */
    this.pairs = [];

    if (query !== undefined) {
      if (typeof query !== 'string') {
        throw new TypeError('query must be a string');
      }
      this._parse(query);
    }
  }

  /**
   * Parse a query string (no leading '?').
   * @param {string} query
   * @private
   */
  _parse(query) {
    if (query === '') {
      return;
    }

    const parts = query.split('&');
    for (const part of parts) {
      if (part === '') {
        continue;
      }

      const eqIndex = part.indexOf('=');
      let key;
      let value;

      if (eqIndex === -1) {
        key = part;
        value = '';
      } else {
        key = part.slice(0, eqIndex);
        value = part.slice(eqIndex + 1);
      }

      this.pairs.push([this._decode(key), this._decode(value)]);
    }
  }

  /**
   * Percent-decode a component, treating '+' as a space.
   * @param {string} value
   * @returns {string}
   * @private
   */
  _decode(value) {
    return decodeURIComponent(value.replace(/\+/g, ' '));
  }

  /**
   * Percent-encode a component, using %20 for spaces.
   * @param {string} value
   * @returns {string}
   * @private
   */
  _encode(value) {
    return encodeURIComponent(value).replace(/%20/g, '+');
  }

  /**
   * Append a key-value pair. Keys and values are coerced to strings.
   * @param {string} key
   * @param {string} value
   * @returns {this}
   */
  append(key, value) {
    this.pairs.push([String(key), String(value)]);
    return this;
  }

  /**
   * Get all values for a key, in insertion order.
   * @param {string} key
   * @returns {string[]}
   */
  getAll(key) {
    const keyStr = String(key);
    return this.pairs.filter(([k]) => k === keyStr).map(([, v]) => v);
  }

  /**
   * Get the first value for a key, or null if not present.
   * @param {string} key
   * @returns {string|null}
   */
  get(key) {
    const keyStr = String(key);
    for (const [k, v] of this.pairs) {
      if (k === keyStr) {
        return v;
      }
    }
    return null;
  }

  /**
   * Set a key to a single value, removing all previous values for that key.
   * @param {string} key
   * @param {string} value
   * @returns {this}
   */
  set(key, value) {
    const keyStr = String(key);
    const valueStr = String(value);
    const newPairs = this.pairs.filter(([k]) => k !== keyStr);
    newPairs.push([keyStr, valueStr]);
    this.pairs = newPairs;
    return this;
  }

  /**
   * Delete all values for a key.
   * @param {string} key
   * @returns {this}
   */
  delete(key) {
    const keyStr = String(key);
    this.pairs = this.pairs.filter(([k]) => k !== keyStr);
    return this;
  }

  /**
   * Stringify the query string, preserving insertion order and repeated keys.
   * @returns {string}
   */
  toString() {
    return this.pairs
      .map(([k, v]) => `${this._encode(k)}=${this._encode(v)}`)
      .join('&');
  }

  /**
   * Return the number of key-value pairs (including repeats).
   * @returns {number}
   */
  get size() {
    return this.pairs.length;
  }

  /**
   * Iterate over [key, value] pairs in insertion order.
   * @returns {Iterator<[string, string]>}
   */
  [Symbol.iterator]() {
    return this.pairs[Symbol.iterator]();
  }

  /**
   * Create a QueryBuild from an object, where array values become repeated keys.
   * @param {Record<string, string | string[]>} obj
   * @returns {QueryBuild}
   */
  static fromObject(obj) {
    const qb = new QueryBuild();
    for (const [key, value] of Object.entries(obj)) {
      if (Array.isArray(value)) {
        for (const item of value) {
          qb.append(key, item);
        }
      } else {
        qb.append(key, value);
      }
    }
    return qb;
  }
}
