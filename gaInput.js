ig.module(
    'impact.gaInput')
    .defines(function () {
    "use strict";

    window.ga = window.ga ? window.ga : {};

    ga.KEY = { // _________________________ All codes must be > 0
            'MOUSE1': 1,          'MOUSE2': 3, /* right button */       'MOUSE3': 2,
            'MWHEEL_UP': 4,       'MWHEEL_DOWN': 5,                       // code < 8  <=> mouse interaction

            'BACKSPACE': 8,       'TAB': 9,            'ENTER': 13,         'PAUSE': 19,
            'CAPS': 20,           'ESC': 27,           'SPACE': 32,

            'PAGE_UP': 33,        'PAGE_DOWN': 34,     'END': 35,           'HOME': 36,

            'LEFT_ARROW': 37,     'UP_ARROW': 38,      'RIGHT_ARROW': 39,   'DOWN_ARROW': 40,

            'INSERT': 45,         'DELETE': 46,

            '_0': 48,          '_1': 49,            '_2': 50,           '_3': 51,           '_4': 52,
            '_5': 53,          '_6': 54,            '_7': 55,           '_8': 56,           '_9': 57,

            'A': 65,            'B': 66,            'C': 67,            'D': 68,
            'E': 69,            'F': 70,            'G': 71,            'H': 72,
            'I': 73,            'J': 74,            'K': 75,            'L': 76,
            'M': 77,            'N': 78,            'O': 79,            'P': 80,
            'Q': 81,            'R': 82,            'S': 83,            'T': 84,
            'U': 85,            'V': 86,            'W': 87,            'X': 88,
            'Y': 89,            'Z': 90,

            'NUMPAD_0': 96,  'NUMPAD_1': 97,  'NUMPAD_2': 98,  'NUMPAD_3': 99, 'NUMPAD_4': 100,
            'NUMPAD_5': 101, 'NUMPAD_6': 102, 'NUMPAD_7': 103, 'NUMPAD_8': 104,'NUMPAD_9': 105,

            'MULTIPLY': 106,  'ADD': 107 ,  'SUBSTRACT': 109,  'DECIMAL': 110,
            'DIVIDE': 111  ,  'PLUS': 187,  'COMMA': 188    ,  'MINUS': 189,
            'PERIOD': 190  ,

            'F1' : 112,  'F2' : 113,  'F3' : 114,  'F4': 115,  'F5': 116,
            'F6' : 117,  'F7' : 118,  'F8' : 119,  'F9': 120,
            'F10': 121,  'F11': 122,  'F12': 123,

            'SHIFT': 16,              'CTRL': 17,            'ALT': 18   ,            
      };

    var defHidProp = function (obj, propName, val) {
        Object.defineProperty(obj, propName, {
            writable: true,
            value: val
        });
    };

    var propertyDescr = {
        value: null,
        writable: true
    };
    var _match = /_.*/g

    var setProperties = function (tgt, props) {
        for (var prop in props) {
            if (_match.test(prop)) {
                propertyDescr.value = props[prop];
                Object.defineProperty(tgt, prop, propertyDescr);
            } else {
                tgt[prop] = props[prop];
            }
        }
    };


    ga.Input = function (targetCanvas, screenToWorldViewTransform, timeGetter) {

        if (arguments.length < 1) throw ('ga.Input constructor requires at least targetCanvas parameter.');

        var myThis = this;
        this.mouse = {
            get x() {
                if (myThis._mouseUpdated) return myThis._mouseXwv;
                myThis._mouseXwv = myThis._screenToWorldCoordinates(myThis.mouseXscr);
                myThis._mouseYwv = myThis._screenToWorldCoordinates(myThis.mouseYscr);
                myThis._mouseUpdated = true;
                return myThis._mouseXwv;
            },
            get y() {
                if (myThis._mouseUpdated) return myThis._mouseYwv;
                myThis._mouseXwv = myThis._screenToWorldCoordinates(myThis.mouseXscr);
                myThis._mouseYwv = myThis._screenToWorldCoordinates(myThis.mouseYscr);
                myThis._mouseUpdated = true;
                return myThis._mouseYwv;
            }
        };
        this.accel = {
            x: 0,
            y: 0,
            z: 0
        };
        this.mouseXscr = 0;
        this.mouseYscr = 0;


	    this.touchStartPos	=	 	[ { x :0, y:0 }, { x :0, y:0 }, { x :0, y:0 }, { x :0, y:0 },{ x :0, y:0 } ]; 
	    this.touchStartTime	=	    [ 0, 0, 0, 0, 0 ] ;  
	    this.touchPos		=		[ { x :0, y:0 }, { x :0, y:0 }, { x :0, y:0 }, { x :0, y:0 },{ x :0, y:0 } ];   
	    this.touchId		=		[ -1, -1, -1, -1, -1 ] ;  

        var that = this;
        var inputProperties = {

            _targetCanvas: targetCanvas,

            _getTime: (timeGetter) ? timeGetter : Date.now, // function used to measure time.  

            _screenToWorldCoordinates: (screenToWorldViewTransform) ?
		                    screenToWorldViewTransform : function (v) { return v },

            _isBound: [], //  _isBound       [keyCode]  == how many binding(s) for this code ?
            _actionToCode: null, //  _actionToCode  [action]  == which keyCode(s) for this action

            _lastRepeatTime	: [], //  _lastRepeatTime [action]  == game time when action repeated (using this._getTime())
            _autoRepeatTime	: [], //  _autoRepeatTime [action]  == auto repeat duration in ms

            _measureActionTime: false, //  
			

            _isCurrentlyPressed: [], //  _isCurrentlyPressed [keyCode]  
        						     //    if pressed : (== time if measuring time or 1 if not), 0 if not pressed
            _isJustPressed: [],      //  _isJustPressed [keyCode]  == is pressed this cycle
            						 //   === 0 if action not ongoing. 
            _isJustReleased: [], //  _is JustReleased [keycode] == released this cycle
            _hasDefault: [],     //  _hasDefault[keycode] == has this keycode a default handler ?

            _justPressedStack: [0,0,0,0,0,0,0,0,0,0,0,0,0,0], // used to store the keycode needing to be released
            _justPressedStackLength: 0,

            _justReleasedStack: [0,0,0,0,0,0,0,0,0,0,0,0,0,0], // used to store the keycode needing to be released
            _justReleasedStackLength: 0,

            _recording: false, // are we recording ?
            _shouldRecordMouseMoves: false, // ...
            _recordedMouse: { x: 0,  y: 0     }, // coordinates for the recorded mouse.
            _oldMouse: that.mouse, // to store the standard mouse while recording
            _latestMouse: {
                x: -1,
                y: -1
            }, //

            _touchAreaInfo: [],
            _touchAreaInfoCount: 0,
            _touchAreaInfoUpdated: false,

            _playingRecord: false, // are we playing back a record ?
            _playingPaused: false, // paused in playing ?
            _playIndex: 0, // index of the frame played
            _records: null, // record of all user inputs
            _timePauseReplay: 0, // game time of the replay pause

            _shouldInteruptPlayWhenUserInteract: false, // ...

            _recordStartTime: 0, // game time of record begin
            _replayRealStartTime: 0, // game time of replay begin.

            _isFrozen: false, // do we freeze users interactions ?
            _isFrozenTimer: null, // timer for the freeze

            _isUsingMouse: false, // ...
            _isUsingKeyboard: false, // ...
            _isUsingTouch: false, // ...
            _isUsingAccelerometer: false, // ...

            _mouseInitialized: false, // ...
            _keyboardInitialized: false, // ...
            _touchInitialized: false, // ...
            _accelerometerInitialized: false, // ...

            _mouseUpdated: false, // flag to avoid dividing by ig.scale each time the mouse moves.
            _mouseXwv: 0, // mouse world coordinates x
            _mouseYwv: 0, // mouse world coordinates y

            _canvasOffsetX: -1, // Dom Canvas Offset x
            _canvasOffsetY: -1, // Dom Canvas Offset y

            _pseudoEvent: {
                type: 'keydown',
                keyCode: 0,
                target: {},
                stopPropagation: function () {},
                preventDefault: function () {}
            }, // used for replay

            _shouldInitForSafari: false //  _chkSafariOrIOS() 
        };

        setProperties(this, inputProperties);
        
        this._isCurrentlyPressed [300] = 0     ; 
        this._isJustPressed     [300]      = false ;
        this._isJustReleased    [300]     = false ; 

        return this;
    };

    ga.Input.bindings = {};

    var Timer = function (inputInstance, waitTime_ms) {
        defHidProp(this, "_inputInstance", inputInstance);
        defHidProp(this, "_startTime", ga.Input._getTime());
        waitTime_ms = (waitTime_ms === undefined) ? 0 : waitTime_ms;
        defHidProp(this, "_waitTime", waitTime_ms);
    };

    Timer.prototype.delta = function () {
        return (this._inputInstance._getTime() - this._startTime - this._waitTime);
    };

    Timer.prototype.set = function (waitTime_ms) {
        this._waitTime = waitTime_ms;
        return this;
    };

    var _pr = ga.Input.prototype;


    var InputPrototypeProperties = {
    	
        isIOS : function() { return  !! navigator.userAgent.match(/(iPad|iPhone|iPod)/g) },
        
        isSafari :  function() { return (Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0) },

		isAndroid : function() {
				var ua = navigator.userAgent.toLowerCase();
				return (ua.indexOf("android") > -1); 			
		},

        // ------------------------------------------------------------------------------
        //      Bindings
        // ---------------------------------------------------------------------------

        bind: function (key, action, autoRepeatTime_ms) {
            this._checkAction(action);
            // init mouse or keyboard  binding
            if (key < 8) {
                this._initMouse();
            } else if (key >= 8) {
                this._initKeyboard();
            }

            this._addKeyActionPair(key, action, autoRepeatTime_ms);

            this._isCurrentlyPressed[key] = 0;
            this._isJustPressed[key] = false;
            this._isJustReleased[key] = false;
        },

        bindTouch: function () {
            this._initTouch();
        },

        bindMouse: function () {
            this._initMouse();
        },

        bindAccelerometer: function () {
            this._initAccelerometer();
        },

        measureActionTime: function () {
            this._measureActionTime = true;
        },

        bindTouchRect: function (action, x, y, w, h, autoRepeatTime_ms, _useStartCoord) {
            this._bindTouchArea(action, x, y, w, h, 0, autoRepeatTime_ms, _useStartCoord);
        },

        bindTouchCircle: function (action, x, y, radius, autoRepeatTime_ms, _useStartCoord) {
            this._bindTouchArea(action, x, y, 0, 0, radius, autoRepeatTime_ms, _useStartCoord);
        },


        _bindTouchArea: function (action, x, y, w, h, radius, autoRepeatTime_ms, _useStartCoord) {
            this._checkAction(action);
            this._initTouch();

            var key = 256 ;
            while (this._isBound[key]) {
                key++
            }

            this._addKeyActionPair(key, action, autoRepeatTime_ms);

            this._isCurrentlyPressed[key] = 0;
            this._isJustPressed[key] = false;
            this._isJustReleased[key] = false;

            var newAreaInfo = (!this._touchAreaInfo[key - 256 ]) ? {} : this._touchAreaInfo[key - 256 ];
            newAreaInfo.x = x;
            newAreaInfo.y = y;
            newAreaInfo.w = w;
            newAreaInfo.h = h;
            newAreaInfo.radius = radius;
            newAreaInfo.useStartCoord = ((_useStartCoord) ? true : false);
            this._touchAreaInfo[key - 256 ] = newAreaInfo;
            this._touchAreaInfoCount++;
        },

        _checkAction: function (action) {
            if (action === undefined) {
                throw ('cannot bind to undefined')
            }
            if (this._actionToCode == null) {
                this._actionToCode = ((typeof action == "string") || (typeof action.valueOf() == "string")) ? {} : [];
            } else {
                if (((typeof action == "string") || (typeof action.valueOf() == "string")) && (this._actionToCode.length === undefined)) {
                    throw ('Cannot add both string and integer actions (action :' + action + ')');
                }
            }
        },

        _addAutoRepeat: function (action, autoRepeatTime_ms) {
            if (autoRepeatTime_ms && autoRepeatTime_ms > 0) {
                this._autoRepeatTime[action] = autoRepeatTime_ms;
                this._lastRepeatTime[action] = this._getTime() + 1;
                this._measureActionTime = true;
            }
        },

        _addKeyActionPair: function (key, action, autoRepeatTime_ms) {
            this._addAutoRepeat(action, autoRepeatTime_ms);
            var code = this._actionToCode[action];
            // return if key allready bound to that action
            if (code && (code.indexOf(key) >= 0)) {
                return;
            }
            // do we allready have an code for this action ?
            if (code === undefined) {
                this._actionToCode[action] = [];
            } // no : create an array to store it  
            this._actionToCode[action].push(key);
            this._isBound[key] = (this._isBound[key] === undefined) ? 1 : this._isBound[key] + 1;
        },

        // ------------------------------------------------------------------------------
        //      UnBinding
        // ---------------------------------------------------------------------------

        // undinds the key <-> action.  
        // does nothing if key <-> Action allready unbound.
        unbind: function (key, action) {
            if (!key || ((!action) && (action != 0))) {
                return
            }
            if (this._isBound[key] === undefined || this._isBound[key] <= 0) return;
            this._removeKeycodeActionPair(key, action);
        },

        unbindAll: function () {
            this.resetKeys();
            this._isBound = [];
            this._actionToCode = null;
            this._isJustPressed = [];
            this._isCurrentlyPressed = [];
            this._isJustReleased = [];

            this._autoRepeatTime = [];
            this._lastRepeatTime = [];

            this._measureActionTime = false;

            this._mouseInitialized = false;
            this._keyboardInitialized = false;
            this._touchInitialized = false;
            this._accelerometerInitialized = false;

            this._isUsingMouse = false;
            this._isUsingKeyboard = false;
            this._isUsingTouch = false;
            this._isUsingAccelerometer = false;
        },

        _removeKeycodeActionPair: function (keycode, action) {
            var code = this._actionToCode[action];
            if (!code) {
                return;
            } // already unbound or never bound
            var index = code.indexOf(keycode);
            if (index < 0) {
                return;
            } // key not found
            this._isBound[keycode]--;
            if ( code.length == 1) {
                this._actionToCode[action] = null
            } else {
                    code.splice(index, 1);
            };
        },

        // --------------------------------------------------------------------
        //          status  readers
        // --------------------------------------------------------------------

        status: function (action) {
            if (this._isFrozen) return false;
            var _code = this._actionToCode[action];
            if (!_code) {
                throw ('error in input.state : the action requested is not bound ( ' + action + ' ) ')
            }

            if (this._touchAreaInfoCount && !this._touchAreaInfoUpdated) {
                this._updateTouchArea()
            }

            var i = _code.length;
            var min = this._isCurrentlyPressed[_code[0]];
            while (--i) {
                min = Math.min(min, this._isCurrentlyPressed[_code[i]]);
            }
            if (!min) {                return 0            }
            if (!this._measureActionTime) { return 1 }
            return (this._getTime() - min);
/*            var actionTime = 1;
            if (this._measureActionTime) {
                actionTime = this._actionTime[action];
                actionTime = (actionTime) ? Math.min(min, actionTime) : min;
                this._actionTime[action] = actionTime;
                actionTime = this._getTime() - actionTime;
            }
            return actionTime;   */
        },

        pressed: function (action) {
            if (this._isFrozen) {
                return false
            };
            var _code = this._actionToCode[action];
            if (!_code) {
                throw ('error in input.pressed : the action requested is not bound ( ' + action + ' ) ')
            }
            if (this._touchAreaInfoCount && !this._touchAreaInfoUpdated) {
                this._updateTouchArea()
            }

            if (this._justPressedStackLength == 0 && (!this._autoRepeatTime[action])) {
                return false
            };

            if (this._touchAreaInfoCount && !this._touchAreaInfoUpdated) {
                this._updateTouchArea()
            }

            var justPressed = false;
            var i = _code.length;
            while (i--) {
                if (this._isJustPressed[_code[i]]) {
                    justPressed = true;
                    break;
                };
            }

            if (justPressed) {
                if ((this._measureActionTime) && (this._autoRepeatTime[action])) {
                    this._lastRepeatTime[action] = this._getTime()
                }
                return true;
            }

            // now handle autorepeat case
            // no auto repeat at all or not for this action --> return false
            if ((!this._measureActionTime) || (!this._autoRepeatTime[action])) {
                return false;
            }
            // not enough time elapsed --> return false
            if ((this._getTime() - this._lastRepeatTime[action]) < this._autoRepeatTime[action]) {
                return false;
            }
            // are we currently pressed for this action ?
            var isCurrentlyPressed = false;

            var i = _code.length;
            while (i--) {
                if (this._isCurrentlyPressed[_code[i]]) {
                    isCurrentlyPressed = true;
                    break;
                }
            };

            // not pressed --> set last repeat time to 'infinity' so that we do not test any more for pressed                 
            if (!isCurrentlyPressed) {
                this._lastRepeatTime[action] *= 100;
                return false;
            }
            // pressed : update last repeat time and return a fake true
            this._lastRepeatTime[action] = this._getTime() + 1;
            return true;
        },


        released: function (action) {
            if (this._isFrozen) return false;
            if (this._touchAreaInfoCount && !this._touchAreaInfoUpdated) {
                this._updateTouchArea()
            }

            if (this._justReleasedStackLength == 0) {
                return false
            };
            var _code = this._actionToCode[action];
            if (!_code) throw ('error in input.released : the action requested is not bound ( ' + action + ' ) ');

            var i = _code.length;
            while (i--) {
                if (this._isJustReleased[_code[i]]) {
                    return true
                };
            }
            return false;
        },

        // freeze the input (no user interaction reported) for the given time (in ms)
        freeze: function (freezeTime_ms) {
            this._isFrozen = true;
            if (freezeTime_ms <= 0) {
                throw ('freeze time cannot be <=0');
            }
            this._isFrozenTimer = (this._isFrozenTimer) ? this._isFrozenTimer.set(freezeTime_ms) : new Timer(this, freezeTime_ms);
        },

        // stop the freeze
        unFreeze: function () {
            this._isFrozen = false;
        },

        // --------------------------------------------------------------------
        //          touch helpers
        // --------------------------------------------------------------------

        touchInRect: function (x, y, w, h) {
        	return this._touchInArea(x,y,w,h,0);
        },

		touchInCircle : function(x,y,radius) {
        	return this._touchInArea(x,y,0,0,radius);			
		},

        touchVectInRect   : function (x, y, w, h, startPoint, endPoint) {
			return this._touchVectInArea(x,y,w,h,0, startPoint,endPoint);
        },

        touchVectInCircle : function (x, y, radius, startPoint, endPoint) {
			return this._touchVectInArea(x,y,0,0,radius, startPoint,endPoint);
        },

        _touchInArea: function (x, y, w, h, radius) {
            for (var i = 0; i < 5; i++) {
                if (this.touchStartTime[i]) {
                    var tx = this.touchPos[i].x;
                    var ty = this.touchPos[i].y;
                    var condition = radius ?
                    		((tx-x)*(tx-x)+(ty-y)*(ty-y))<radius*radius :
                    		((tx >= x) && (tx <= x + w) && (ty >= y) && (ty <= y + h)) ;
                    if (condition) {
                        return (this._getTime() - this.touchStartTime[i]);
                    }
                }
            }
            return 0;
        },

		_touchVectInArea : function (x, y, w, h, radius, startPoint, endPoint) {
            var foundIndex = -1;
            var maxDuration = -1;
            for (var i = 0; i < 5; i++) {
                if (this.touchStartTime[i]) {
                    var tx = this.touchStartPos[i].x;
                    var ty = this.touchStartPos[i].y;
                    var condition = radius ?
                    		((tx-x)*(tx-x)+(ty-y)*(ty-y))<radius*radius :
                    		((tx >= x) && (tx <= x + w) && (ty >= y) && (ty <= y + h)) ;

                    if (condition) {
                        var duration = (this._getTime() - this.touchStartTime[i]);
                        if (duration > maxDuration) {
                            foundIndex = i;
                            maxDuration = duration;
                        }
                    }
                }
            }
            if (foundIndex === -1) {
                return 0;
            }
            startPoint.x = this.touchStartPos[foundIndex].x;
            startPoint.y = this.touchStartPos[foundIndex].y;
            endPoint.x = this.touchPos[foundIndex].x;
            endPoint.y = this.touchPos[foundIndex].y;
            return maxDuration;
        },

        _updateTouchArea: function () {
            var inArea = false;
            var thisArea = null;
            var _code = 0;
            for (var i = 0; i < this._touchAreaInfo.length; i++) {
                _code = 256  + i;
                if (!this._isBound[_code]) {
                    continue
                }
                thisArea = this._touchAreaInfo[i];
                inArea = this.touchInRect(thisArea.x, thisArea.y, thisArea.w, thisArea.h);
                if (inArea && !this._isCurrentlyPressed[_code]) { // entering
                    this._isJustPressed[_code] = true;
                    this._justPressedStack[this._justPressedStackLength++] = _code;
                    this._isCurrentlyPressed[_code] = (this._measureActionTime) ? this._getTime() : 1;
                } else if (!inArea && this._isCurrentlyPressed[_code]) { // leaving
                    this._isJustReleased[_code] = true;
                    this._justReleasedStack[this._justReleasedStackLength++] = _code;
                    this._isCurrentlyPressed[_code] = 0;
                }
            }
        },

        // --------------------------------------------------------------------
        //          init for Safari
        // --------------------------------------------------------------------

        setupUserInteractionWaitForSafari: function (safariCallBack) {
            _userDefinedSafariWakingUpCallBack = safariCallBack;
            _boundSafariWakingUp = _safariWakingUp.bind(this);
            var fn = _boundSafariWakingUp;
            this._targetCanvas.addEventListener('mousedown', fn, false);
            this._targetCanvas.addEventListener('mouseup', fn, false);
            window.addEventListener('keydown', fn, false);
            window.addEventListener('keyup', fn, false);
            window.addEventListener('touchstart', fn, false);
            window.addEventListener('touchend', fn, false);
        },

        _boundSafariWakingUp: null,

        _userDefinedSafariWakingUpCallBack: null,

        _safariWakingUp: function (event) {

            event.stopPropagation();
            event.preventDefault();

            var fn = _boundSafariWakingUp;
            this._targetCanvas.removeEventListener('mousedown', fn, false);
            this._targetCanvas.removeEventListener('mouseup', fn, false);
            window.removeEventListener('keydown', fn, false);
            window.removeEventListener('keyup', fn, false);
            window.removeEventListener('touchstart', fn, false);
            window.removeEventListener('touchend', fn, false);

            if (_userDefinedSafariWakingUpCallBack) {
                _userDefinedSafariWakingUpCallBack();
            };

            this._shouldInitForSafari = false;
            if (this._isUsingMouse) {
                this._initMouse()
            };
            if (this._isUsingKeyboard) {
                this._initKeyboard()
            };
            if (this._isUsingAccelerometer) {
                this._initAccelerometer()
            };
            if (this._isUsingTouch) {
                this._initTouch()
            };

            return false;
        },

        // ---------------------------------------------------------------------------
        //      Record / Replay
        // ---------------------------------------------------------------------------

        // starts a new recording session. stops any record ongoing. Does nothing if replaying.
        startRecording: function (shouldRecordMouseMoves) {
            if (this._playingRecord) {
                return;
            }
            if (this._recording) {
                this.stopRecording();
            }
            this._playingPaused = false;
            this._records = [];
            this._records.push({
                t: this._getTime()
            }); // store time recording begins
            this._shouldRecordMouseMoves = (shouldRecordMouseMoves === undefined) ? false : true;
            this.clearPressed();
            clearPressed = this._recordKeyPressed; // we record interactions before clearing
            this.mouse = this._recordedMouse;
            this._recording = true;
        },

        // stops an ongoing record. Does nothing if no record ongoing.
        stopRecording: function () {
            if (!this._recording) {
                return;
            }
            this._records.push({
                t: this._getTime()
            }); // store time recording ends
            clearPressed = this._standardKeyPressed;
            this.mouse = this._oldMouse;
            this._recording = false;
            //? clearPressed ?
        },

        isRecording: function () {
            return this._recording;
        },

        getRecord: function () {
            return this._records;
        },

        // replays the record given OR the latest record if no args. Stops ongoing replay or recording
        replayRecord: function (thisRecord) {
            if (this._playingRecord) {
                this.stopReplay();
            }
            if (this._recording) {
                this.stopRecording();
            };
            this._playingRecord = true;
            this._playingPaused = false;
            if (thisRecord !== undefined) {
                this._records = thisRecord;
            }
            this._recordstartTime = thisRecord[0].t;
            this._replayRealStartTime = this._getTime();
            this._playIndex = 1; // first record is at 1, since 0 stores time.
            clearPressed = this._replayKeyPressed;
            return true;
        },

        // switches between pause and resume during a replay. 
        pauseOrResumeReplay: function () {
            if (!this._playingRecord) {
                return;
            }
            if (this._playingPaused) {
                this.resumeReplay();
            } else {
                this.pauseReplay();
            }
        },

        pauseReplay: function () {
            if (!this._playingRecord || this._playingPaused) return;
            this._playingPaused = true;
            this._timePauseReplay = this._getTime();
        },

        resumeReplay: function () {
            this._playingPaused = false;
            this._replayRealStartTime += (this._getTime() - this._timePauseReplay);
        },

        stopReplay: function () {
            this._playingRecord = false;
            clearPressed = this._standardKeyPressed;
        },

        isPlaying: function () {
            return this._playingRecord;
        },

        isPaused: function () {
            return this._playingPaused;
        },

        getPlayingDuration: function () {
            if (!this.playingRecord) {
                return 0;
            }
            return (this._getTime() - this.replayRealStartTime);
        },

        // returns the duration in ms of the given record OR the record being recorded OR of the last record set.
        getRecordDuration: function (thisRecord) {
            if (this._recording) {
                return (this._getTime() - this._records[0].t);
            }
            if (thisRecord === undefined) {
                thisRecord = this._records;
            }
            if (!thisRecord) {
                return 0;
            }
            return (thisRecord[thisRecord.length - 1].t - thisRecord[0].t);
        },

        drawRecordStatus: function (ctx, color) {
            ctx.font = "14px Sans-Serif";
            color = (color === undefined) ? "#8F8" : color;
            ctx.fillStyle = color;
            if (!this._playingRecord && !this._recording) {
                ctx.fillText("No record or Replay ongoing", 10, 20);
                ctx.fillText("Current record length (ms) :" + this.getRecordDuration(), 10, 36);
            }
            if (this._playingRecord) {
                var replayStatus = (this._playingPaused) ? "paused" : "ongoing";
                ctx.fillText("Replay " + replayStatus + ' : ' + this.getPlayingDuration() + ' / ' + this.getRecordDuration(), 10, 20);
                ctx.fillText("Current record length (ms) : " + this.getRecordDuration(), 10, 36);
            }
            if (this._recording) {
                ctx.fillText("Recording ongoing : " + this.getRecordDuration() + ' ms ' + ' step count : ' + this._records.length, 10, 20);
            }
        },

        _stepReplay: function () {
            if (this._playingPaused) return;
            // seek the time of the next non-empty record to play
            //       while (this._records[this._playIndex+1] !== undefined && this._records[this._playIndex+1].t !== undefined) { this._playIndex++;}
            var newTime = this._records[this._playIndex].t;
            // while we have to consume a record, do it
            while ((newTime - this._recordstartTime) <= (this._getTime() - this._replayRealStartTime)) {
                // console.log(Date.now() + ' ' + this._playIndex);
                this._playIndex++;
                if (this._playIndex == this._records.length - 1) { // finished replay ?
                    this.stopReplay();
                    return;
                }
                var currRec = this._records[this._playIndex];
                while (currRec.t === undefined) {
                    if (currRec.mx !== undefined) {
                        this._mouseXwv = currRec.mx;
                        this._mouseYwv = currRec.my;
                        this._mouseUpdated = true;
                        continue;
                    }
                    console.log(currRec + ' _stepReplay  ');
                    if (currRec > 0) {
                        this._pseudoEvent.type = 'keydown';
                        this._pseudoEvent.keyCode = Math.floor(currRec);
                        this._keyDown(this._pseudoEvent);
                    } else {
                        this._pseudoEvent.type = 'keyup';
                        this._pseudoEvent.keyCode = Math.floor(-currRec);
                        this._keyUp(this._pseudoEvent);
                    }
                    this._playIndex++;
                    if (this._playIndex == this._records.length - 1) {
                        this.stopReplay();
                        return;
                    }
                    currRec = this._records[this._playIndex];
                }
                newTime = this._records[this._playIndex].t;
            }
        },

        _handleRecording: function () {
            if (!this._recording) return;
            if (((this._shouldRecordMouseMoves) && (this._latestMouse.x != this.mouse.x || this._latestMouse.y != this.mouse.y)) || this._justPressedStackLength || this._justReleasedStackLength) {
                var isMouseUsed = false;
                this._records.push({
                    t: this._getTime()
                });
                if ((this._shouldRecordMouseMoves) && (this._latestMouse.x != this.mouse.x || this._latestMouse.y != this.mouse.y)) {
                    isMouseUsed = true;
                }
                if (this._justPressedStackLength || this._justReleasedStackLength) {
                    var currKey = 0;
                    // copy pressed / released keys to the _record
                    var _i = 0;
                    while (_i < this._justPressedStackLength) {
                        currKey = this._justPressedStack[_i++];
                        if (Math.abs(currKey) < 8) {
                            isMouseUsed = true;
                        }
                        this._records.push(currKey);
                    }
                    _i = 0;
                    while (_i < this._justReleasedStackLength) {
                        currKey = this._justReleasedStack[_i++];
                        if (Math.abs(currKey) < 8) {
                            isMouseUsed = true;
                        }
                        this._records.push(-currKey);
                    }
                    // record mouse pos if click and not recorded allready
                    if (isMouseUsed && (this._latestMouse.x != this.mouse.x || this._latestMouse.y != this.mouse.y)) {
                        this._records.push({
                            mx: this.mouse.x,
                            my: this.mouse.y
                        });
                        this._latestMouse.x = this.mouse.x;
                        this._latestMouse.y = this.mouse.y;
                    }
                }
            }
        },

        resetKeys: function () {
            // clear just pressed keys
            if (this._justPressedStackLength > 0) {
                var _code = 0;
                while (this._justPressedStackLength--) {
                    _code = this._justPressedStack[this._justPressedStackLength];
                    this._isJustPressed[_code] = false;
                }
                this._justPressedStackLength = 0;
            }
            // clear just released keys
            if (this._justReleasedStackLength > 0) {
                var _code = 0;
                while (this._justReleasedStackLength--) {
                    _code = this._justReleasedStack[this._justReleasedStackLength];
                    this._isJustReleased[_code] = false;
                }
                this._justReleasedStackLength = 0;
            }
            // stop the freeze if timer elapsed
            if (this._isFrozen && (this._isFrozenTimer.delta() > 0)) {
                this._isFrozen = false;
            }
            this._touchAreaInfoUpdated = false
        },

        // ------------------------------------------------------------------------------
        //     
        // ---------------------------------------------------------------------------

        _handleScroll: function () {
            this._computeCanvasOffset();
        },

        _computeCanvasOffset: function () { // http://ejohn.org/blog/getboundingclientrect-is-awesome/
            var rect = this._targetCanvas.getBoundingClientRect();
            this._canvasOffsetX = rect.left;
            this._canvasOffsetY = rect.top;
        },

        // --------------------------------------------------------------------
        //          init of events listeners
        // --------------------------------------------------------------------

        _initMouse: function () {
            this._isUsingMouse = true;
            if (this._shouldInitForSafari) {
                return;
            }
            if (this._mouseInitialized) {
                return;
            } // exit if init allready done
            var mouseWheelBound = this._mouseWheel.bind(this);
            this._targetCanvas.addEventListener('mousewheel', mouseWheelBound, false);
            this._targetCanvas.addEventListener('DOMMouseScroll', mouseWheelBound, false);

            document.addEventListener('contextmenu', this._contextmenu.bind(this), false);
            this._targetCanvas.addEventListener('mousedown', this._keyDown.bind(this), false);
            this._targetCanvas.addEventListener('mouseup', this._keyUp.bind(this), false);
            document.addEventListener('mousemove', this._mouseMove.bind(this), false);
            this._computeCanvasOffset();

            document.addEventListener('scroll', this._handleScroll.bind(this), false);

            //  this._targetCanvas.addEventListener('touchstart', this._keyDown.bind(this), false );
            //  this._targetCanvas.addEventListener('touchend', this._keyUp.bind(this), false );
            //   this._targetCanvas.addEventListener('touchmove', this._touchMove.bind(this), false );
            this._mouseInitialized = true;
        },

        _initKeyboard: function () {
            this._isUsingKeyboard = true;
            if (this._shouldInitForSafari) {
                return;
            }
            if (this._keyboardInitialized) {
                return;
            }
            window.addEventListener('keydown', this._keyDown.bind(this), false);
            window.addEventListener('keyup', this._keyUp.bind(this), false);
            this._keyboardInitialized = true;
        },

        _initAccelerometer: function () {
            this._isUsingAccelerometer = true;
            if (this._accelerometerInitialized) {
                return;
            }
            window.addEventListener('devicemotion', this._deviceMotion.bind(this), false);
            this._accelerometerInitialized = true;
        },

        _initTouch: function () {
            this._isUsingTouch      = true ;
            this._measureActionTime = true ;
            if (this._shouldInitForSafari) {
                return;
            }
            if (this._touchInitialized) {
                return;
            }
            //alert('init of touch');
            var that = this;
            document.addEventListener('touchstart', this._handleTouch.bind(this), false);
            document.addEventListener('touchend', this._handleTouch.bind(this), false);
            document.addEventListener('touchmove', this._handleTouch.bind(this), false);
            document.addEventListener('touchcancel', this._handleTouch.bind(this), false);
            this._touchInitialized = true;
        },


        // --------------------------------------------------------------------
        //          events handler
        // --------------------------------------------------------------------
        _contextmenu: function (event) {
            if (this._isBound[ga.KEY.MOUSE2]) {
                event.stopPropagation();
                event.preventDefault();
            }
            return false;
        },

        _mouseMove: function (event) {
            this.mouseXscr = event.clientX - this._canvasOffsetX;
            this.mouseYscr = event.clientY - this._canvasOffsetY;
            this._mouseUpdated = false;
        },


        _touchMove: function (event) {
            var _tp = event.touches[0];
            this.mouseXscr = _tp.pageX - this._canvasOffsetX;
            this.mouseYscr = _tp.pageY - this._canvasOffsetY;
            this._mouseUpdated = false;
        },

        _mouseWheel: function (event) {
            var delta = event.wheelDelta ? event.wheelDelta : (event.detail * -1);
            var code = delta > 0 ? ga.KEY.MWHEEL_UP : ga.KEY.MWHEEL_DOWN;
            if (this._isBound[code]) {
                this._isJustPressed[code] = true;
                this._justPressedStack[this._justPressedStackLength++] = _code;
                this._isJustReleased[code] = true;
                this._justReleasedStack[this._justReleasedStackLength++] = _code;
                event.stopPropagation();
                event.preventDefault();
                return false;
            }
        },

        _keyDown: function (event) {
        //	alert('i see you baby ' + event.button)
            if (event.target.type == 'text') {
                return;
            }

if (event.button ===0) { }
            var _code = (event.type == 'keydown') ? event.keyCode : (event.button + 1);

            if (event.type == 'touchstart' || event.type == 'mousedown') {
                this._mouseMove(event);
            }

            if (this._isBound[_code] > 0) {
                if (!this._isCurrentlyPressed[_code]) {
                    this._isJustPressed[_code] = true;
                    this._justPressedStack[this._justPressedStackLength++] = _code;
                    this._isCurrentlyPressed[_code] = (this._measureActionTime) ? this._getTime() : 1;
                }
                //  return false;
            }
            event.stopPropagation();
            event.preventDefault();

        },

        _keyUp: function (event) {
            if (event.target.type == 'text') {
                return;
            }

            var _code = (event.type == 'keyup') ? event.keyCode : (event.button + 1);

            if (this._isBound[_code] > 0) {
                this._isJustReleased[_code] = true;
                this._justReleasedStack[this._justReleasedStackLength++] = _code;
                this._isCurrentlyPressed[_code] = 0;
                event.stopPropagation();
                event.preventDefault();
            }
        },

        _deviceMotion: function (event) {
            this.accel = event.accelerationIncludingGravity;
        },

        _findTouchIndex: function (id) {
            for (var i = 0; i < 5; i++) {
                if ((this.touchStartTime[i]) && (this.touchId[i] == id)) {
                    return i;
                };
            };
            return -1;
        },

        _findFreeIndex: function () {
            for (var i = 0; i < 5; i++) {
                if (!this.touchStartTime[i]) {
                    return i;
                };
            }
            var min = Math.prototype.min.apply(Math,this.touchStartTime);
            var ind = this.touchStartTime.indexOf(min);
            return ind;
        },

        _handleTouch: function (event) {
            event.stopPropagation();
            event.preventDefault();

            var touches = event.changedTouches;

            switch (event.type) {
            case "touchstart":
                for (var i = 0; i < touches.length; i++) {
                    var id = this._findFreeIndex();
                    if (id >= 0) {
                        this.touchStartPos[id].x = this._screenToWorldCoordinates(touches[i].pageX - this._canvasOffsetX);
                        this.touchStartPos[id].y = this._screenToWorldCoordinates(touches[i].pageY - this._canvasOffsetY);
                        this.touchPos[id].x = this.touchStartPos[id].x
                        this.touchPos[id].y = this.touchStartPos[id].y
                        this.touchStartTime[id] = this._getTime();
                        this.touchId[id] = touches[i].identifier;
                    }
                };
                break;
            case "touchmove":
                for (var i = 0; i < touches.length; i++) {
                    var id = this._findTouchIndex(touches[i].identifier);
                    if (id >= 0) {
                        this.touchPos[id].x = this._screenToWorldCoordinates(touches[i].pageX - this._canvasOffsetX);
                        this.touchPos[id].y = this._screenToWorldCoordinates(touches[i].pageY - this._canvasOffsetY);
                    }
                };
                break;
            case "touchend":
            case "touchcancel":
                for (var i = 0; i < touches.length; i++) {
                    var id = this._findTouchIndex(touches[i].identifier);
                    if (id >= 0) {
                        this.touchStartTime[id] = 0;
                    }
                };
                break;
            }

            return false;
        },

        // --------------------------------------------------------------------
        //          events handler for compatibility
        // --------------------------------------------------------------------

        _touchStart: function (event, action) {
            event.stopPropagation();
            event.preventDefault();
            var _code = this._actionToCode[action];
            if (!_code) {
                return;
            }
            var i = _code.length;
            while (i--) {
                this._isJustPressed[_code[i]] = true;
                this._isCurrentlyPressed[_code[i]] = (this._measureActionTime) ? this._getTime() : 1;
            }
            return false;
        },

        _touchEnd: function (event, action) {
            event.stopPropagation();
            event.preventDefault();
            var _code = this._actionToCode[action];
            if (!_code) {
                return;
            }
            var i = _code.length;
            while (i--) {
                this._isJustReleased[_code[i]] = true;
                this._isJustReleased[this._justReleasedStackLength++] = _code[i];
            }
            return false;
        }
    }; // end of InputPrototypeProperties

    setProperties(ga.Input.prototype, InputPrototypeProperties);

    _pr._standardKeyPressed = _pr.resetKeys;

    _pr.clearPressed = _pr.resetKeys;
    //  -----------------------------------------------
});

/*    var copyCode = function( src, srcLength, dest, value) {
        var _i = srcLength;
        while(i) {
            _i--;
            var _code = src[_i];
            dest[_code] = value;
        }
    };
*/