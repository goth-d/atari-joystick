import { CongruentDirection, mapCongruentAngles } from "./util";

type JoystickOptions = {
  /** A number of directions, congruents */
  directions: number;
  /** A number of miliseconds, throttling delay */
  throttling: number;
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
  /** A number of current computed angle on the joystick arc */
  angle?: number;
  /** A number derived from angle on a single circle turn */
  absoluteAngle?: number;
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
  public directions: CongruentDirection[];
  private shouldMove = true;
  public isEnabled = true;
  private touchMoveHandler: (event: TouchEvent) => void;

  /**
   * @param element - A query string or the element itself
   * @param handler - A callback function called on state change
   * @param options - An object of joystick options
   */
  constructor(element: string | HTMLElement, handler: StateChangeCallback, options: Partial<JoystickOptions> = {}) {
    let parent = typeof element == "string" ? document.querySelector(element) : element;
    if (!parent || !(parent instanceof HTMLElement)) {
      throw new ReferenceError(
        `No matches for: ${element},\n Make sure the query is correct and the DOM content has been loaded`
      );
    }
    this.parent = parent;

    let optionsObj: Partial<JoystickOptions> & { [k: string]: any } & Object = new Object(options);
    let parsedOptions: { [k: string]: any } & JoystickOptions = Object.create(defaultOptions);
    Object.keys(parsedOptions).forEach((k) => {
      if (optionsObj.hasOwnProperty(k)) parsedOptions[k] = optionsObj[k];
    });

    this.directions = mapCongruentAngles(parsedOptions.directions ?? 1);

    this.touchMoveHandler =
      typeof options.throttling == "number"
        ? (event) => {
            if (this.shouldMove) {
              this.shouldMove = false;
              handler(this.sync(event));
              setTimeout(() => (this.shouldMove = true), options.throttling);
            }
          }
        : (event) => handler(this.sync(event));

    if (!parsedOptions.startDisabled) {
      this.enable();
    } else {
      this.isEnabled = false;
    }
  }

  private enable() {
    this.parent.addEventListener("touchstart", this.sync);
    this.parent.addEventListener("touchmove", this.touchMoveHandler);
    this.parent.addEventListener("touchend", this.sync);
    this.isEnabled = true;
  }
  public sync(event: TouchEvent): StateObject {
    return {} as StateObject;
    // handle events and sync state
  }
  private animate() {
    // request animations with cur state
  }
  private disable() {
    this.parent.removeEventListener("touchstart", this.sync);
    this.parent.removeEventListener("touchmove", this.touchMoveHandler);
    this.parent.removeEventListener("touchend", this.sync);
    this.isEnabled = false;
  }
}

class State {
  constructor() {}
  /* track() {
    // init tracking on touchstart and removes listener
  }
  update() {
    // keeps checking changedTouches of touchmove ev
  }
  clear() {
    // finish tracking when touch list is 1 length on touchend and adds start listener
  } */
}

class Renderer {
  constructor() {}
}

export default Joystick;
