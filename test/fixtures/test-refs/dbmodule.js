module.exports = (function () {

  var publicData = {};

  return {

    publicData: publicData,

    init: function() {

      publicData.stuff = 'things';

    }

  };

})();
