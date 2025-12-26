// Глобального fallback’а на pointercancel/lostpointercapture нет.
// getCoalescedEvents().
// два пальца - пинч, тап, лонг, двойной тап, тройной тап, четверной тап // 5
// down - детект пинча, move тоже нужен. лонг тоже нужен

// 3 пальца (тап, лонг, двойной, тройной, четверной, вниз, вверх, вправо, влево, пинч ин, аут) // 11
// 4 пальца (тап, лонг, двойной, тройной, четверной, вниз, вверх, вправо, влево, пинч ин, аут) // 11
// 5 пальца (тап, лонг, двойной, тройной, четверной, вниз, вверх, вправо, влево, пинч ин, аут) // 11
// правая клик, 2й, 3й, 4й, лонг // 4
// миддли клик, 2й, 3й, 4й, лонг // 4
// левая клик, 2й, 3й, 4й, лонг // 3
// итого 49

// lastDown собирает down тачи. при полном отпускании сбрасывается
// нужно для детека дабл, трайпл тач
// первый тач в lastDown всегда срабатывает (только если он не одновременно с другими тачами)
//
// таймаут для double пусть начинается с первого касания

const MOVE_DETECT = 10;
// after this time pointer_down is not added to multitouch gesture
// если опоздал жест не добавится
// todo разобраться с pinching. Нужно ли его добавлять после
// например когда рисуешь и захотел пинч, не отрывая первого касания
const DELAY_FOR_MULTI = 200;

// for double, triple, quad gestures
const DELAY_FOR_DOUBLE = 450;
const DELATY_AFTER_DOUBLE = 200;

export class ClickManager {
  _activeTouches;
  tickEvents = [];
  lastDown = [];
  comboFirstPhaseTouchesLen = 0;
  lastDownPrev = [];
  prevSize = 0;
  _clickTimeout;
  _clickState = "idle";

  constructor(editor) {
    this.editor = editor;
    this._activeTouches = new Map();
    document.addEventListener("pointerdown", this.handleTouchDown.bind(this));
    document.addEventListener("pointerup", this.handleTouchUp.bind(this));
    document.addEventListener("pointercancel", this.handleTouchUp.bind(this));
    document.addEventListener("pointermove", this.handleTouchMove.bind(this));

    this.editor.on("tick", this.flushEvents.bind(this));
  }

  _getClickTimeout(state) {
    clearTimeout(this._clickTimeout);
    this._clickTimeout = setTimeout(
      () => {
        if (this._clickState === "pendingTriple") {
          console.log("double click");
          this._logType2("double click");
        }
        if (this._clickState === "pendingQuadruple") {
          console.log("triple click");
          this._logType2("triple click");
        }
        if (this._clickState === "pendingOverflow") {
          console.log("quad click");
          this._logType2("quad click");
        }
        this._clickState = "idle";
        this.comboFirstPhaseTouchesLen = 0;
        // this._logType();
      },
      state === "idle" || state === "pendingDouble" ? 450 : 200
    );
    // console.log("set", this._clickTimeout);
  }

  _add_to_last_down(event) {
    let hasNewPointerDown = false;
    let isNewGesture = true;
    // if (this.lastDown.length === 0) {
    //   this.lastDown.push(event);
    //   return;
    // }
    let isLate = true;
    for (const ev of this.lastDown) {
      if (event.time - ev.time < DELAY_FOR_MULTI) {
        isLate = false;
        break;
      }
    }

    if (!isLate || this.lastDown.length === 0) {
      if (this._clickState === "idle") {
        this.comboFirstPhaseTouchesLen++;
        this._logType2("++++++++++++");
      }
      this.lastDown.push(event);
      hasNewPointerDown = true;
    }
    // console.log(
    //   event.time,
    //   isLate,
    //   JSON.parse(JSON.stringify(this.lastDownPrev))
    // );

    // if (isLate) {
    //   this._logType2("pointer_down");
    // }
    return { hasNewPointerDown };
  }

  flushEvents() {
    if (this.tickEvents.length > 0) {
      let lastDownWasEmpty = this.lastDown.length === 0;
      let hasNewPointerDown = false;
      for (const event of this.tickEvents) {
        if (event.name === "pointer_down") {
          hasNewPointerDown = this._add_to_last_down(event);
        }
      }
      if (
        hasNewPointerDown &&
        this.lastDown.length === 1 &&
        this._clickState === "idle"
      ) {
        this._logType2("pointer_down");
      }

      if (
        hasNewPointerDown &&
        this.lastDown.length === 2 &&
        (this._clickState === "idle" ||
          (this._clickState === "pendingDouble" &&
            this.comboFirstPhaseTouchesLen === 1))
      ) {
        this._logType2("pinch down");
      }

      if (lastDownWasEmpty && hasNewPointerDown) {
        switch (this._clickState) {
          case "idle": {
            this._clickState = "pendingDouble";
            break;
          }
          case "pendingDouble": {
            this._clickState = "pendingTriple";
            break;
          }
          case "pendingTriple": {
            this._clickState = "pendingQuadruple";
            break;
          }
          case "pendingQuadruple": {
            this._clickState = "pendingOverflow";
            break;
          }
        }
        this._getClickTimeout(this._clickState);
      }

      this.tickEvents = [];
    }
  }

  /**
   * Handle touch down event
   * @param {SyntheticPointerEvent} event - Event object
   */
  handleTouchDown(event) {
    // console.log("handle touch");
    const obj = {
      name: "pointer_down",
      id: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      clientX: event.clientX,
      clientY: event.clientY,
      time: Date.now(),
    };
    // this._clickTimeout = this._getClickTimeout(this._clickState);

    this._activeTouches.set(event.pointerId, obj);
    this.tickEvents.push(obj);
    // this._logAllTouches();
    // this._logType(event);
  }

  /**
   * Handle touch move event
   * @param {SyntheticPointerEvent} event - Event object
   */
  handleTouchMove(event) {
    if (this._activeTouches.has(event.pointerId)) {
      const touch = this._activeTouches.get(event.pointerId);
      if (touch.name === "pointer_down") {
        if (
          Math.abs(event.clientX - touch.startX) < MOVE_DETECT &&
          Math.abs(event.clientY - touch.startY) < MOVE_DETECT
        ) {
          return;
        }
      }
      const obj = {
        name: "pointer_move",
        id: event.pointerId,
        clientX: event.clientX,
        clientY: event.clientY,
      };
      this._activeTouches.set(event.pointerId, obj);
      this.tickEvents.push(obj);
      // this._logAllTouches();
      // this._logType(event);
    }
  }

  /**
   * Handle touch up event
   * @param {SyntheticPointerEvent} event - Event object
   */
  handleTouchUp(event) {
    this._activeTouches.delete(event.pointerId);
    if (this._activeTouches.size === 0) {
      this.lastDownPrev = JSON.parse(JSON.stringify(this.lastDown));
      // if (this.lastDown.length > 0) {
      //   debugger;
      // }
      this.lastDown = [];
    }
    console.log(
      JSON.parse(JSON.stringify(this.lastDown)),
      JSON.parse(JSON.stringify(this.lastDownPrev))
    );
    // this._logAllTouches();
    // this._logType(event);
  }

  /**
   * Handle touch cancel event
   * @param {SyntheticPointerEvent} event - Event object
   */
  handleTouchCancel(event) {
    this._activeTouches.delete(event.pointerId);
    // this._logAllTouches();
    // this._logType(event);
  }

  /**
   * Get all active touches as an object
   * @returns {Object} Object with all active touches
   */
  getAllTouches() {
    const touchesObject = {};
    this._activeTouches.forEach((touch, pointerId) => {
      touchesObject[pointerId] = {
        id: touch.id,
        clientX: touch.clientX,
        clientY: touch.clientY,
      };
    });
    return touchesObject;
  }

  /**
   * Get count of active touches
   * @returns {number} Number of active touches
   */
  getTouchCount() {
    return this._activeTouches.size;
  }

  /**
   * Log all active touches to console as one object
   * @private
   */
  _logAllTouches() {
    const touchesObject = this.getAllTouches();
    // console.log("All active touches:", touchesObject);
    let el = document.getElementById("touchesStat");
    if (el) {
      el.innerText = ` ${JSON.stringify(touchesObject, null, 2)} `;
    }
  }
  _logType2(text) {
    let el = document.getElementById("touchesStat2");
    if (el) {
      el.innerText = `${this.comboFirstPhaseTouchesLen} ${text}
        ${el.innerText} `;
    }
  }
  _logType(event, text) {
    let el = document.getElementById("touchesStat");
    if (el) {
      if (text) {
        el.innerText = ` ${text} `;
      } else {
        el.innerText = ` ${event.type} ${event.pointerId} ${this.editor.tickManager.tickCount} 
      ${el.innerText}`;
      }
    }
  }
}
