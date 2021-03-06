;(function(undefined) {
  'use strict';

  /**
   * artoo scrape methods
   * =====================
   *
   * Some scraping helpers.
   */
  var _root = this,
      extend = artoo.helpers.extend;

  // Helpers
  function step(o, scope) {
    var $ = artoo.$,
        $sel = o.sel ? $(scope).find(o.sel) : $(scope),
        val;

    // Polymorphism
    if (typeof o === 'function') {
      val = o.call(scope, $);
    }
    else if (typeof o.method === 'function')
      val = o.method.call($sel.get(), $);
    else if (typeof o === 'string') {
      if (typeof $sel[o] === 'function')
        val = $sel[o]();
      else
        val = $sel.attr(o);
    }
    else {
      val = (o.attr !== undefined) ?
        $sel.attr(o.attr) :
        $sel[o.method || 'text']();
    }

    // Default value?
    if (o.defaultValue && (!val || isNaN(val)))
      val = o.defaultValue;

    return val;
  }

  // Scraping function after polymorphism has been taken care of
  function scrape(iterator, data, params, cb) {
    var scraped = [],
        loneSelector = !!data.attr || !!data.method || data.scrape ||
                       typeof data === 'string' ||
                       typeof data === 'function';

    params = params || {};

    // Transforming to selector
    var $iterator = artoo.$(iterator);

    // Iteration
    $iterator.each(function(i) {
      var item = {},
          p;

      if (loneSelector)
        item = (typeof data === 'object' && 'scrape' in data) ?
          scrape(
            $(this).find(data.scrape.iterator),
            data.scrape.data,
            data.scrape.params
          ) :
          step(data, this);
      else
        for (p in data) {
          item[p] = (typeof data[p] === 'object' && 'scrape' in data[p]) ?
            scrape(
              $(this).find(data[p].scrape.iterator),
              data[p].scrape.data,
              data[p].scrape.params
            ) :
            step(data[p], this);
        }

      scraped.push(item);

      // Breaking if limit i attained
      return !params.limit || i < params.limit - 1;
    });

    scraped = params.one ? scraped[0] : scraped;

    // Triggering callback
    if (typeof cb === 'function')
      cb(scraped);

    // Returning data
    return scraped;
  }

  // Function taking care of harsh polymorphism
  function polymorphism(iterator, data, params, cb) {
    var i, d, p, c;

    if (artoo.helpers.isPlainObject(iterator) &&
        !artoo.helpers.isSelector(iterator) &&
        !artoo.helpers.isDocument(iterator) &&
        (iterator.iterator || iterator.data || iterator.params)) {
      d = iterator.data;
      p = artoo.helpers.isPlainObject(iterator.params) ? iterator.params : {};
      i = iterator.iterator;
    }
    else {
      d = data;
      p = artoo.helpers.isPlainObject(params) ? params : {};
      i = iterator;
    }

    // Default values
    d = d || 'text';

    c = typeof cb === 'function' ? cb :
          typeof params === 'function' ? params :
            p.done;

    return [i, d, p, c];
  }

  // Public interface
  artoo.scrape = function(iterator, data, params, cb) {
    var args = polymorphism(iterator, data, params, cb);

    // Warn if no iterator or no data
    if (!args[0] || !args[1])
      throw TypeError('artoo.scrape: wrong arguments.');

    return scrape.apply(this, args);
  };

  // Scrape only the first corresponding item
  artoo.scrapeOne = function(iterator, data, params, cb) {
    var args = polymorphism(iterator, data, params, cb);

    // Extending parameters
    args[2] = artoo.helpers.extend(args[2], {limit: 1, one: true});

    return scrape.apply(this, args);
  };

  // Scrape a table
  // TODO: better header handle
  artoo.scrapeTable = function(sel, params, cb) {
    params = params || {};

    var headers;

    if (!params.headers) {
      return artoo.scrape(sel + ' tr:has(td)', {
        scrape: {
          iterator: 'td',
          data: params.data || 'text'
        }
      }, params, cb);
    }
    else {
      var headerType = params.headers.type ||
                       params.headers.method && 'first' ||
                       params.headers,
          headerFn = params.headers.method;

      if (headerType === 'th') {
        headers = artoo.scrape(
          sel + ' th', headerFn || 'text'
        );
      }
      else if (headerType === 'first') {
        headers = artoo.scrape(
          sel + ' tr:has(td):first td',
          headerFn || 'text'
        );
      }
      else if (artoo.helpers.isArray(headerType)) {
        headers = headerType;
      }
      else {
        throw TypeError('artoo.scrapeTable: wrong headers type.');
      }

      // Scraping
      return artoo.scrape(
        sel + ' tr:has(td)' +
        (headerType === 'first' ? ':not(:first)' : ''), function() {
          var o = {};

          headers.forEach(function(h, i) {
            o[h] = step(
              params.data || 'text',
              $(this).find('td:eq(' + i + ')')
            );
          }, this);

          return o;
        }, params, cb);
    }
  };
}).call(this);
