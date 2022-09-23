/** A tuple of horizontal x, and vertical y position */
export type Coords = {
  /** horizontal X */
  0: number;
  /** vertical Y */
  1: number;
};
/** A tuple of a DOM Event listener and a Timeout */
export type DebouncingHandler<Ev = Event> = {
  /** The event handler function */
  0: (event: Ev) => void;
  /** The current pause timeout ref */
  1?: number;
};
/** A congruent slice on a circle turn */
export type Direction = {
  /** A number of direction slice start position */
  startAngle: number;
  /** A number of direction slice end position */
  endAngle: number;
  /** A key index, defaults to counter from 1 */
  key: string | number;
};

/**
 * Maps congruent slices of a circle turn
 * @param slices - A number, or an indexed array, of congruent slices on a whole circle
 * @param startAngle - A number of start position on the circle, defaults to top (-0.5 * Math.PI)
 * @returns A list of direction slices
 */
export function mapCongruentAngles(slices: number | string[] | number[], startAngle = -0.5 * Math.PI) {
  const dirAngles: Direction[] = [];
  let slicesTotal = Array.isArray(slices) ? slices.length : slices;
  let key: number | string;
  const congruentRadiansSlice = (2 * Math.PI) / slicesTotal;
  for (let i = 0, curAngle = absoluteAngle(startAngle - congruentRadiansSlice / 2), endAngle; i < slicesTotal; i++) {
    key = Array.isArray(slices) ? slices[i] : i + 1;
    endAngle = absoluteAngle(curAngle + congruentRadiansSlice);
    dirAngles[i] = { startAngle: curAngle, endAngle, key };
    curAngle = endAngle;
  }
  return dirAngles;
}

/**
 * Gets the absolute refer angle
 * @param angle - The position on a circle
 * @returns An absolute angle between 0 and 2 * Math.PI
 */
export function absoluteAngle(angle: number) {
  if (angle < 0) {
    // diff from the remainder of a whole circle to a whole circle
    return (Math.abs(angle) % (Math.PI * 2)) * -1 + Math.PI * 2;
  }
  // remainder of a whole circle
  return angle % (Math.PI * 2);
}

export function isAngleInSlice(angle: number, dir: Direction) {
  return angle >= dir.startAngle && angle <= dir.endAngle;
}

/** Determines a box for positioning as block and targeting */
export class RectBox extends DOMRectReadOnly {
  readonly parent: HTMLElement | RectBox;
  readonly trackingTouch?: Touch["identifier"];
  readonly origin?: BoxPoint;

  /**
   * Position is done as normal document flow, from left to right, and from top to bottom
   * @param parent An element only if this is the root box
   * @param rect An object with this size and position
   * @param origin An object with its coords for defining a {@link BoxPoint}
   */
  constructor(parent: HTMLElement);
  constructor(parent: RectBox, rect: Required<DOMRectInit>, origin?: Coords);
  constructor(parent: HTMLElement | RectBox, rect?: Required<DOMRectInit>, origin?: Coords) {
    if (parent instanceof HTMLElement) {
      rect = parent.getBoundingClientRect();
      rect = { ...rect, x: rect.x + window.scrollX, y: rect.y + window.scrollY };
    } else {
      let root = parent;
      while (!(root.parent instanceof HTMLElement)) {
        if (root?.parent) root = root.parent;
        else throw new ReferenceError(`The root of ${RectBox} must have a ${HTMLElement} element as parent`);
      }
      if (!rect) throw new TypeError(`The rect of ${RectBox} must be defined for its children`);
    }
    super(rect.x, rect.y, rect.width, rect.height);

    this.parent = parent;

    if (origin) this.origin = new BoxPoint(origin["0"], origin["1"]);
  }
  /** @returns A {@link Coords} relative to this parent */
  public getAbsoluteCoords(x: number, y: number): Coords {
    return [x - this.x, y - this.y];
  }
  /**
   * Tests if parsed coords target this rect
   * @param absoluteCoords A {@link Coords} relative to this parent
   * @returns A boolean
   */
  public targetsIt(absoluteCoords: Coords) {
    return (
      absoluteCoords["0"] >= this.left &&
      absoluteCoords["0"] <= this.right &&
      absoluteCoords["1"] >= this.top &&
      absoluteCoords["1"] <= this.bottom
    );
  }
}

export class BoxPoint extends DOMPointReadOnly {
  // public resizeDbc?: DebouncingHandler;

  /**
   * Computes a position relative to a {@link RectBox}
   * @param x - A number of left position relative to its parent
   * @param y - A number of top position relative to its parent
   */
  constructor(x: number, y: number) {
    super(x, y);
    // this.watchLayoutShifting();
  }

  /**
   * Calcs the axes deltas of two points in the cartesian plane
   * @param pointB - A {@link BoxPoint} or an object with coord numbers
   * @returns A {@link Coords}
   */
  public getAxesDeltas(pointB: { x: number; y: number } | BoxPoint): Coords {
    // Y axis is inverted in page coord
    return {
      0: this.x - pointB.x,
      1: pointB.y - this.y,
    };
  }
  /**
   * Calcs an angle relative to this, in the cartesian plane, clockwise from right
   * @param point - A {@link BoxPoint} or an object with coord numbers
   * @returns A number of the angle
   */
  public getPointAngle(point: { x: number; y: number } | BoxPoint) {
    let { 0: deltaX, 1: deltaY } = this.getAxesDeltas(point);
    let thetaAngle = Math.atan2(deltaY, deltaX);

    return absoluteAngle(thetaAngle);
  }
  /**
   * This attempts to maintain the correct {@link BoxPoint.parent} coords amid layout shifting, updating this coords
   * @param debouncing A number of delay in ms to listen for resizing events
   */
  /* public watchLayoutShifting(debouncing = 200) {
    let resizeTimeout: number | undefined;
    this.resizeDbc = [
      () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          this.pageX = this.x;
          this.pageY = this.y;
        }, debouncing);
      },
      resizeTimeout,
    ];

    window.addEventListener("resize", this.resizeDbc["0"]);
  } */
  /** Removes layout listeners and dettaches them */
  /* public ignoreLayoutShifting() {
    if (this.resizeDbc) {
      window.removeEventListener("resize", this.resizeDbc[0]);
      clearTimeout(this.resizeDbc[1]);
      this.resizeDbc = undefined;
    }
  } */
}
