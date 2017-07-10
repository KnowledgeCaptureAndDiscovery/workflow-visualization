var renderQueue = (function(func) {
  var _queue = [],                  // data to be rendered
      _total = 0,
      _rate = 1000,                 // number of calls per frame
      _redraw = function() {},      // redraw function after render group
      _invalidate = function() {},  // invalidate last render queue
      _clear = function() {};       // clearing function

  var rq = function(data) {
    if (data) rq.data(data);
    _invalidate();
    _clear();
    rq.render();
  };

  rq.render = function() {
    var valid = true;
    _invalidate = rq.invalidate = function() {
      valid = false;
    };

    function doFrame() {
      if (!valid) return true;
      var chunk = _queue.splice(0,_rate);
      chunk.map(func);
      _redraw();
      if(chunk.length > 0){
        timer_frame(doFrame);
      }
    }

    doFrame();
  };

  rq.data = function(data) {
    _invalidate();
    _queue = data.slice(0);   // creates a copy of the data
    _total = data.length;
    return rq;
  };

  rq.add = function(data) {
    _queue = _queue.concat(data);
    _total += data.length;
  };

  rq.rate = function(value) {
    if (!arguments.length) return _rate;
    _rate = value;
    return rq;
  };

  rq.total = function() {
    return _total;
  };

  rq.completed = function() {
    return rq.total() - rq.remaining();
  };

  rq.remaining = function() {
    return _queue.length;
  };

  rq.progress = function() {
    return 1 - (_queue.length / _total);
  };

  rq.redraw = function(func) {
    if (!arguments.length) {
      _redraw();
      return rq;
    }
    _redraw = func;
    return rq;
  };

  // clear the canvas
  rq.clear = function(func) {
    if (!arguments.length) {
      _clear();
      return rq;
    }
    _clear = func;
    return rq;
  };

  rq.invalidate = _invalidate;

  var timer_frame = window.requestAnimationFrame
    || window.webkitRequestAnimationFrame
    || window.mozRequestAnimationFrame
    || window.oRequestAnimationFrame
    || window.msRequestAnimationFrame
    || function(callback) { setTimeout(callback, 17); };

  return rq;
});