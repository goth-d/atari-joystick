import { absoluteAngle, CongruentDirection, DebouncingHandlerTuple, mapCongruentAngles } from "./util";

type JoystickOptions = {
  /** A number of directions, congruents */
  directions: number;
  /** A number of milliseconds, of delay, for computing moves */
  throttling: number;
  /** A string for the position alignment on the horizontal axis */
  xAlign: "left" | "right" | "center";
  /** A string for the position alignment on the vertical axis */
  yAlign: "top" | "bottom" | "center";
  /** A number of pixels (32 - 64), square width of joystick */
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

type RendererOptions = Pick<
  JoystickOptions,
  "xAlign" | "yAlign" | "size" | "padding" | "bleeding" | "margin" | "ghostSticker" | "flares" | "startDisabled"
>;

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
  public isEnabled = !defaultOptions.startDisabled;
  private _throttling: number | undefined = defaultOptions.throttling;
  public touchHandler: TouchHandler;
  public renderer: Renderer;

  /**
   * @param element - A query string or the element itself
   * @param stateCallback - A callback function called on state change
   * @param options - An object of joystick options
   */
  constructor(element: string | HTMLElement, stateCallback: StateChangeCallback, options: Partial<JoystickOptions> = {}) {
    let parent = typeof element == "string" ? document.querySelector(element) : element;
    if (!(parent instanceof HTMLElement)) {
      throw new ReferenceError(
        `No matches for: ${element},\n Make sure the query is correct and the DOM content has been loaded`
      );
    }
    this.parent = parent;

    this.stateCb = stateCallback;

    options = { ...defaultOptions, ...options };

    this.directions = mapCongruentAngles(options.directions ?? 1);

    this._throttling = options.throttling;

    this.touchHandler = new TouchHandler(this);

    this.renderer = new Renderer(this, options);

    if (!options.startDisabled) {
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
  public state: StateObject;
  public joystick: Joystick;
  constructor(joystick: Joystick) {
    this.joystick = joystick;
    this.state = { isActive: false };
  }
  update(eventType: TouchEvent["type"], touch: Touch) {
    let output: StateObject;
    if (eventType == "touchstart") {
    }
  }
}

export class Renderer {
  public joystick: Joystick;
  public origin: PointPosition;
  private size: number;
  private padding: number;
  private margin: number;
  private bleeding: number;
  private flares = defaultOptions.flares;
  private startDisabled = defaultOptions.startDisabled;
  private xAlign = defaultOptions.xAlign;
  private yAlign = defaultOptions.yAlign;
  public contentSize: number;
  constructor(joystick: Joystick, options: Partial<RendererOptions>) {
    this.joystick = joystick;
    // 32 - 64
    this.size = Math.max(32, Math.min(options.size ?? defaultOptions.size, 64));
    // 0 - 16
    this.padding = Math.max(0, Math.min(options.padding ?? defaultOptions.padding, 16));
    // 0 - padding
    this.bleeding = Math.max(0, Math.min(options.bleeding ?? defaultOptions.bleeding, this.padding));
    // 0 - 48
    this.margin = Math.max(0, Math.min(options.margin ?? defaultOptions.margin, 48));
    if (typeof options.flares == "boolean") this.flares = options.flares;
    if (typeof options.startDisabled == "boolean") this.startDisabled = options.startDisabled;
    if (options.xAlign) this.xAlign = options.xAlign;
    if (options.yAlign) this.yAlign = options.yAlign;

    this.contentSize = this.calcContentSize();

    this.origin = new PointPosition(...this.getStaticJoystickCoords(), this.joystick.parent);
  }
  private calcContentSize() {
    let contentSize = this.size;
    contentSize += this.padding * 2;
    contentSize += this.margin * 2;
    return contentSize;
  }
  private getStaticJoystickCoords(): [number, number] {
    let joystickCenter = this.contentSize / 2;
    let parentRect = this.joystick.parent.getBoundingClientRect();
    let x, y;
    if (this.xAlign == "left") {
      x = 0 + joystickCenter;
    } else if (this.xAlign == "right") {
      x = parentRect.width - joystickCenter;
    } else {
      x = parentRect.width / 2;
    }
    if (this.yAlign == "top") {
      y = 0 + joystickCenter;
    } else if (this.yAlign == "bottom") {
      y = parentRect.height - joystickCenter;
    } else {
      y = parentRect.height / 2;
    }
    return [x, y];
  }
}

export class PointPosition {
  private x: number;
  private y: number;
  private parent: HTMLElement;
  private _pageX?: number;
  private _pageY?: number;
  public resizeDbc?: DebouncingHandlerTuple;

  /**
   * Computes a position relative to an element edge
   * @param x - A number of left position relative to its parent, or page if parent omitted
   * @param y - A number of top position relative to its parent, or page if parent omitted
   * @param parent - A {@link HTMLElement} of its parent
   */
  constructor(x: number, y: number, parent: HTMLElement) {
    this.x = x;
    this.y = y;
    this.parent = parent;
    this.watchLayoutShifting();
  }
  private calcParentTop() {
    let rect = this.parent.getBoundingClientRect();
    return rect.top + window.scrollY;
  }
  private calcParentLeft() {
    let rect = this.parent.getBoundingClientRect();
    return rect.left + window.scrollX;
  }
  public set pageX(x: number) {
    this._pageX = x + this.calcParentLeft();
  }
  public set pageY(y: number) {
    this._pageY = y + this.calcParentTop();
  }
  public get pageX() {
    // call setter
    if (typeof this._pageX == "number") this.pageX = this.x;
    // ts type-safe
    return typeof this._pageX == "number" ? this._pageX : NaN;
  }
  public get pageY() {
    // call setter
    if (typeof this._pageY != "number") this.pageY = this.y;
    // ts type-safe
    return typeof this._pageY == "number" ? this._pageY : NaN;
  }
  /**
   * Calcs the axes deltas of two points on the cartesian plane
   * @param pointB - A {@link PointPosition} or an object with page coord numbers
   * @returns An object with x and y, delta, numbers
   */
  public getAxesDeltas(pointB: PointPosition | { pageX: number; pageY: number }): { x: number; y: number } {
    // Y axis is inverted in page coord
    return Object.create({
      x: this.pageX - pointB.pageX,
      y: pointB.pageY - this.pageY,
    });
  }
  /**
   * Calcs an angle relative to this, in the cartesian plane, clockwise from right
   * @param point - A {@link PointPosition} or an object with page coord numbers
   * @returns A number of the angle
   */
  public getPointAngle(point: PointPosition | { pageX: number; pageY: number }) {
    let { x: deltaX, y: deltaY } = this.getAxesDeltas(point);
    let thetaAngle = Math.atan2(deltaY, deltaX);

    return absoluteAngle(thetaAngle);
  }
  /**
   * This attempts to maintain the correct {@link PointPosition.parent} coords amid layout shifting
   * @param debouncing A number of delay in ms to listen for resizing events
   */
  public watchLayoutShifting(debouncing = 200) {
    let resizeTimeout: number | undefined;
    this.resizeDbc = [
      () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          // call setters
          this.pageX = this.x;
          this.pageY = this.y;
        }, debouncing);
      },
      resizeTimeout,
    ];
    
    window.addEventListener("resize", this.resizeDbc["0"]);
  }
  /** Removes layout listeners and dettaches them */
  public ignoreLayoutShifting() {
    if (this.resizeDbc) {
      window.removeEventListener("resize", this.resizeDbc[0]);
      clearTimeout(this.resizeDbc[1]);
      this.resizeDbc = undefined;
    }
  }
}

export class TouchHandler {
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

  /** This setter should'nt be called directly, instead use {@link Joystick.throttling} */
  public set move(throttling: number | undefined) {
    if (this.joystick.isEnabled) this.dettachListeners();

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

    if (this.joystick.isEnabled) this.attachListeners();
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
              if (touch) {
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
