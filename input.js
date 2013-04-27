ig.module(
    'impact.input'
).requires(
    'impact.gaInput'	
)
.defines(function(){ "use strict";
   
   ig.KEY   = ga.KEY  ;
      
   var getTime = function() { return 1000*ig.Timer.time; };
   
   var screenToWorldCoordinates = function(v) { return (v/ig.system.scale); };
    
   ig.Input = function() {  
   	                        ga.Input.call( this,ig.system.canvas, screenToWorldCoordinates ,getTime );
   	                        return this;
   	                         };

   ig.Input.prototype = ga.Input.prototype;
   
   ig.Input.prototype.state = ga.Input.prototype.status;
   
   var gaBindTouch = ga.Input.prototype.bindTouch;
   
   ig.Input.bindTouch = function( selector, action )
    {
    	if (arguments.length == 0) { gaBindTouch(); };
    	
		var element = ig.$( selector );
		
		var that = this;
		element.addEventListener('touchstart', function(ev) {
			that._touchStart( ev, action );
		}, false);
		
		element.addEventListener('touchend', function(ev) {
			that._touchEnd( ev, action );
		}, false);
		
	};
   
   ig.Input.bindings = ga.Input.bindings;

});
    