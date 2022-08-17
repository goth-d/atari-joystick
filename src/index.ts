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

const defaultOptions: JoystickOptions = {
  directions: 8,
  throttling: 150,
  flares: true,
  size: 42,
  padding: 8,
  bleeding: 8,
  margin: 32,
  ghostSticker: true,
};

class Joystick {
  public directions: CongruentDirection[];

  /**
   * @param selector - A query string or the element itself
   * @param handler - A callback function called on state change
   * @param options - An object of joystick options
   */
  constructor(selector: string | Element, handler: StateChangeCallback, options: Partial<JoystickOptions> = {}) {
    let parent = typeof selector == "string" ? document.querySelector(selector) : selector;
    this.directions = mapCongruentAngles(options.directions ?? defaultOptions.directions);
  }

  /* private enable() {
    // set directions angles
  }
  private sync() {
    // handle events and sync state
  }
  private animate() {
    // request animations with cur state
  } */
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
