!function() {
  function isGoogleMaps(a) {
    return /^https?\:\/\/www.google.com\/maps.*/i.test(a)
  }

  if (window.top === window && isGoogleMaps(window.location.href)) {
    var lastScale = 1;
    var pinchLog = [];
    var queued = false;
    var scene = document.getElementById("scene");

    function createWheelEvent(gestureEvent, deltaY)
    {
      return new WheelEvent("mousewheel", {
        // Wheel event properties
        // https://developer.mozilla.org/en-US/docs/Web/API/WheelEvent/WheelEvent
        deltaX: 0.0,
        deltaY: deltaY,
        deltaZ: 0.0,
        deltaMode: 0,

        // Mouse event properties
        // https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/MouseEvent
        screenX: gestureEvent.screenX,
        screenY: gestureEvent.screenY,
        clientX: gestureEvent.clientX,
        clientY: gestureEvent.clientY,
        ctrlKey: gestureEvent.ctrlKey,
        shiftKey: gestureEvent.shiftKey,
        altKey: gestureEvent.altKey,
        metaKey: gestureEvent.metaKey,

        bubbles: true,
      });
    }
    
    scene.addEventListener("gesturestart", function (e) {
      e.preventDefault();
      lastScale = 1;
      pinchLog = [];
    });

    function normalizeScale(scale)
    {
      return scale < 0 ? Math.pow(10, scale) : scale;
    }

    scene.addEventListener("gesturechange", function (e) {
      e.preventDefault();

      pinchLog.push({
        timeStamp: e.timeStamp,
        scale: e.scale,
      });

      if (!queued) {
        // Simple throttling
        setTimeout(function() {
          var currentScale = normalizeScale(e.scale);
          var deltaScale = lastScale - currentScale;
          var deltaY = currentScale < 1 ? deltaScale * 1000 : deltaScale * 500;
          deltaY = Math.ceil(deltaY);

          e.target.dispatchEvent(createWheelEvent(e, deltaY));

          lastScale = currentScale;
          queued = false;
        }, 10);
      }
      queued = true;
      
    });

    function diffLog(log, diffLen)
    {
      var first = log[log.length - 1];
      diffLen = diffLen > (log.length - 2) ? (log.length - 2) : diffLen; 
      var second = log[log.length - (2 + diffLen)];
      return {
        timeDiff: first.timeStamp - second.timeStamp,
        scaleDiff: first.scale - second.scale,
      };
    }

    function decayScale(scale, time) {
      var decay = 0.01;
      var isNegative = scale < 0 ? 1 : -1;
      return Math.abs(scale) * Math.exp(-time * decay) * isNegative;
    }

    scene.addEventListener("gestureend", function (e) {
      e.preventDefault();

      var d = diffLog(pinchLog, 3);
      if (Math.abs(d.scaleDiff) > 0.1)  {
        // Ramp down
        var timeout = 50;
        do {
          var deltaScale = decayScale(d.scaleDiff, timeout);
          var deltaY = deltaScale * 800;
          deltaY = Math.ceil(deltaY);
          setTimeout(function() {
            e.target.dispatchEvent(createWheelEvent(e, deltaY));  
          }, timeout);

          timeout = timeout * 1.01;
        } while (Math.abs(deltaY) > 2)
      }
    });
  }
}();