;(function(undefined) {
  'use strict';

  /**
   * artoo notify
   * =============
   *
   * Utility creating HTML notifications on the scraped page to display
   * some visual feedback for the users.
   */
  var _root = this;

  // Helpers
  // BASIC FUNCTIONS HERE...

  // Possible levels
  var lvls = ['success', 'info', 'warning', 'danger'];

  // Exported methods
  artoo.notify = function(data, lvl) {
    lvl = lvl || 'info';

    if (!~lvls.indexOf(lvl))
      throw Error('artoo.notify: wrong level "' + lvl + '".');

    artoo.notify[lvl](data);
  };

  lvls.forEach(function(lvl) {
    artoo.notify[lvl] = function(data) {

      // LOGIC HERE...
    };
  });
}).call(this);
