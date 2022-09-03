import { absoluteAngle, CongruentDirection, mapCongruentAngles } from "./util";

type JoystickOptions = {
  /** A number of directions, congruents */
  directions: number;
  /** A number of milliseconds, of delay, for computing moves */
  throttling: number;
  /** A string for the position on the horizontal axis */
  xPosition: "left" | "right";
  /** A string for the position on the vertical axis */
  yPosition: "top" | "bottom";
  /** A number of pixels, square width of joystick */
  size: number;
  /** A boolean for drawing flares indicating current direction */
  flares: boolean;
  /** A number of pixels (0 - padding), limit joystick pointer can be drawn */
  bleeding: number;
  /** A number of pixels (0 - 16), space between joystick and margin */
  padding: number;
  /** A number of pixels (0 - 48), free space to hold the joystick */
  margin: number;
  /** A boolean for drawing an assistive sticker, drawn in the margin */
  ghostSticker: boolean;
  /** A boolean for starting disabled */
  startDisabled: boolean;
};

type StateObject = {
  /** A boolean if joystick is being hold */
  isActive: boolean;
  /** The current direction index, or null */
  direction?: string | number;
  /** A number of current computed touch angle */
  angle?: number;
  /** A number of angle cosine */
  cos?: number;
  /** A number of angle sine */
  sin?: number;
};

type StateChangeCallback =
  /** @param state - The current state object output */
  (state: StateObject) => void;

const defaultOptions: JoystickOptions = Object.create({
  directions: 8,
  throttling: 150,
  xPosition: "left",
  yPosition: "top",
  flares: true,
  size: 42,
  padding: 8,
  bleeding: 8,
  margin: 32,
  ghostSticker: true,
  startDisabled: false,
});

class Joystick {
  public parent: HTMLElement;
  private stateCb: StateChangeCallback;
  public directions: CongruentDirection[];
  public isEnabled = true;
  private touchHandler: JoystickTouchHandler;
  private _throttling?: number;

  /**
   * @param element - A query string or the element itself
   * @param handler - A callback function called on state change
   * @param options - An object of joystick options
   */
  constructor(element: string | HTMLElement, handler: StateChangeCallback, options: Partial<JoystickOptions> = {}) {
    let parent = typeof element == "string" ? document.querySelector(element) : element;
    if (!(parent instanceof HTMLElement)) {
      throw new ReferenceError(
        `No matches for: ${element},\n Make sure the query is correct and the DOM content has been loaded`
      );
    }
    this.parent = parent;

    this.stateCb = handler;

    let optionsObj: Partial<JoystickOptions> & { [k: string]: any } & Object = new Object(options);
    let parsedOptions: { [k: string]: any } & JoystickOptions = Object.create(defaultOptions);
    Object.keys(parsedOptions).forEach((k) => {
      if (optionsObj.hasOwnProperty(k)) parsedOptions[k] = optionsObj[k];
    });

    this.directions = mapCongruentAngles(parsedOptions.directions ?? 1);

    this._throttling = options.throttling;
    this.touchHandler = new JoystickTouchHandler(this);

    if (!parsedOptions.startDisabled) {
      this.enable();
    } else {
      this.isEnabled = false;
    }
  }

  /**
   * Used for calling handler setter to update its move method
   * @param throttling - A number of milliseconds, of delay, for computing moves, or undefined if no delay
   */
  public set throttling(throttling: number | undefined) {
    this._throttling = throttling;
    this.touchHandler.move = throttling;
  }
  public get throttling() {
    return this._throttling;
  }

  private enable() {
    this.touchHandler.attachListeners();
    this.isEnabled = true;
  }
  public sync(eventType: TouchEvent["type"], touch: Touch) {
    this.stateCb({} as StateObject);
  }
  private animate() {
    // request animations with cur state
  }
  private disable() {
    this.touchHandler.dettachListeners();
    this.isEnabled = false;
  }
}

export class State {
  constructor() {}
  update() {}
}

export class Renderer {
  constructor() {}
}

class PointPosition {
  private x: number;
  private y: number;
  private parentX: number;
  private parentY: number;
  public pageX: number;
  public pageY: number;

  /**
   * @param x - A number of left position relative to its parent
   * @param y - A number of top position relative to its parent
   * @param parentX - A number of its parent left position relative to page
   * @param parentY - A number of its parent top position relative to page
   */
  constructor(x: number, y: number, parentX = 0, parentY = 0) {
    this.x = x;
    this.y = y;
    this.parentX = parentX;
    this.parentY = parentY;
    this.pageX = this.parentX + this.x;
    this.pageY = this.parentY + this.y;
  }
  /**
   * Calcs the axes deltas of two points on the cartesian plane
   * @param pointB - A {@link PointPosition}
   * @returns An object with x and y, delta, numbers
   */
  public getAxesDeltas(pointB: PointPosition): { x: number; y: number } {
    // Y axis is inverted in page coord
    return Object.create({
      x: this.pageX - pointB.pageX,
      y: pointB.pageY - this.pageY,
    });
  }

  /**
   * Calcs an angle relative to this, in the cartesian plane, clockwise from right
   * @param point - A {@link PointPosition}
   * @returns A number of the angle
   */
  public getPointAngle(point: PointPosition) {
    let { x: deltaX, y: deltaY } = point.getAxesDeltas(this);
    let thetaAngle = Math.atan2(deltaY, deltaX);

    return absoluteAngle(thetaAngle);
  }
}

class JoystickTouchHandler {
  public joystick: Joystick;
  private trackingTouch?: Touch["identifier"];
  private shouldComputeMove = true;
  private moveHandler: (event: TouchEvent) => void;

  /**
   * @param joystick - A {@link Joystick} instance
   */
  constructor(joystick: Joystick) {
    this.joystick = joystick;

    this.moveHandler =
      typeof this.joystick.throttling == "number"
        ? (event: TouchEvent) => {
            if (this.shouldComputeMove) {
              this.shouldComputeMove = false;
              this.handleEventsAndSync(event);
              setTimeout(() => (this.shouldComputeMove = true), this.joystick.throttling);
            }
          }
        : (event: TouchEvent) => this.handleEventsAndSync(event);
  }

  /** This method should'nt be called directly, instead use {@link Joystick.throttling} */
  public set move(throttling: number | undefined) {
    this.dettachListeners();

    this.moveHandler =
      typeof throttling == "number"
        ? (event: TouchEvent) => {
            if (this.shouldComputeMove) {
              this.shouldComputeMove = false;
              this.handleEventsAndSync(event);
              setTimeout(() => (this.shouldComputeMove = true), throttling);
            }
          }
        : (event: TouchEvent) => this.handleEventsAndSync(event);

    this.attachListeners();
  }

  private handleEventsAndSync(event: TouchEvent) {
    event.preventDefault();
    let touch: Touch | null;

    if (event.type == "touchstart") {
      if (typeof this.trackingTouch == "undefined") {
        touch = event.changedTouches.item(0);

        if (touch) {
          this.trackingTouch = touch.identifier;
          this.joystick.sync(event.type, touch);
        }
      }
    } else if (event.type == "touchmove") {
      for (let i = 0; i < event.changedTouches.length; i++) {
        touch = event.changedTouches.item(i);

        if (touch && touch.identifier === this.trackingTouch) {
          this.joystick.sync(event.type, touch);
        }
      }
    } else if (event.type == "touchend") {
      for (let i = 0; i < event.changedTouches.length; i++) {
        touch = event.changedTouches.item(i);

        if (touch && touch.identifier === this.trackingTouch) {
          if (event.targetTouches.length) {
            // changes to another current touch that was initiated on the parent el
            for (i = 0; i < event.targetTouches.length; i++) {
              touch = event.targetTouches.item(i);
              if (touch && touch.identifier !== this.trackingTouch) {
                this.trackingTouch = touch.identifier;
                this.joystick.sync("touchmove", touch);
              }
            }
          } else {
            this.trackingTouch = undefined;
            this.joystick.sync(event.type, touch);
          }
        }
      }
    }
  }

  public attachListeners() {
    this.trackingTouch = undefined;
    this.joystick.parent.addEventListener("touchstart", this.handleEventsAndSync);
    this.joystick.parent.addEventListener("touchmove", this.moveHandler);
    this.joystick.parent.addEventListener("touchend", this.handleEventsAndSync);
  }
  public dettachListeners() {
    this.joystick.parent.removeEventListener("touchstart", this.handleEventsAndSync);
    this.joystick.parent.removeEventListener("touchmove", this.moveHandler);
    this.joystick.parent.removeEventListener("touchend", this.handleEventsAndSync);
  }
}

export default Joystick;
