import {
  InterfacePropsInt,
  StickOptions,
  Coords,
  Direction,
  JoystickControllers,
  SizeProps,
  PositionProps,
  ControllersSizesPositions,
  ControllersRects,
} from "./types";

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
/** Tests if angle is in direction */
export function isAngleInSlice(angle: number, dir: Direction) {
  return angle >= dir.startAngle && angle <= dir.endAngle;
}

/**
 * Assigns the target not undefined properties to a copy of default
 * @param {SourceType} defaults - An object with all properties defined
 */
export function assignDefaults<SourceType>(defaults: SourceType, target: Partial<SourceType>) {
  let parsedOptions = { ...defaults };
  let value;
  Object.keys(parsedOptions).forEach((k) => {
    value = Object.getOwnPropertyDescriptor(target, k)?.value;
    if (value != undefined) Object.defineProperty(parsedOptions, k, { value });
  });
  return parsedOptions;
}

/**
 * Normalizes controller interface sizes
 * @param controller - The controller key
 * @param props - Properties that are in intersection of interface props
 */
function clampControllerInterface(controller: keyof JoystickControllers, props: InterfacePropsInt<StickOptions>) {
  if (controller == "stick") {
    // size 32 - 64
    props.size = Math.max(32, Math.min(props.size, 64));
    // padding 0 - 16
    props.padding = Math.max(0, Math.min(props.padding, 16));
    // margin 0 - 48
    props.margin = Math.max(0, Math.min(props.margin, 48));
  }
  return props;
}

/**
 * Calcs controller interface sizes
 * @param controller - The controller key
 * @param props - Properties that are in intersection of interface props
 * @returns A {@link SizeProps} of normalized sizes
 */
export function getControllerSize(controller: keyof JoystickControllers, props: InterfacePropsInt<StickOptions>): SizeProps {
  props = clampControllerInterface(controller, props);
  let spacing = 0;
  spacing += props.padding * 2;
  spacing += props.margin * 2;
  props.size += spacing;
  return { width: props.size, height: props.size };
}

/**
 * Creates some layout, as draft, it's not pretty
 * @param pad - The {@link Joystick} rect
 * @param param1 - The {@link PositionProps} of joystick content alignment
 * @param controllers - A list of {@link ControllerSizesPositions}
 * @returns A list of rects for the controllers
 */
export function arrangePad(
  pad: RectBox,
  { xAlign, yAlign }: PositionProps,
  controllers: ControllersSizesPositions
): ControllersRects {
  let padCenterX = pad.width / 2,
    padCenterY = pad.height / 2;

  // as draft, btns won't be positioned side by side
  let btnLeftColWidth =
    controllers.button?.reduce(
      (maxColWidth, { width, xAlign }) => (xAlign == "left" && width > maxColWidth ? width : maxColWidth),
      0
    ) ?? 0;
  let btnRightColWidth =
    controllers.button?.reduce(
      (maxColWidth, { width, xAlign }) => (xAlign == "right" && width > maxColWidth ? width : maxColWidth),
      0
    ) ?? 0;
  let width = controllers.stick.width + btnLeftColWidth + btnRightColWidth;

  // as draft, btns will be positioned on stick side columns only
  let height = controllers.stick.height;

  // content coords (left btn col + stick + right btn col)
  let contentLeft = xAlign == "left" ? 0 : xAlign == "center" ? padCenterX - width / 2 : pad.right - width;
  let contentTop = yAlign == "top" ? 0 : yAlign == "center" ? padCenterY - height / 2 : pad.bottom - height;
  let contentRight = contentLeft + width;
  let contentBottom = contentTop + height;

  // saves start coord for stacking btns
  let leftBtnColStackStart = 0;
  let rightBtnColStackStart = 0;
  // calcs btn col centralized coords
  function determineBtnCoords(btn: PositionProps & SizeProps): Required<DOMRectInit> {
    let x: number, y: number;

    // stack on smaller col from top (ignores yAlign)
    if (btn.xAlign == "center") btn.xAlign = leftBtnColStackStart > rightBtnColStackStart ? "right" : "left";
    if (btn.xAlign == "left") {
      x = contentLeft / 2 - btn.width / 2;
      y = contentTop + leftBtnColStackStart;
      leftBtnColStackStart += btn.height;
    } else {
      // align right
      x = contentRight + (contentRight - btnRightColWidth) / 2 - btn.width / 2;
      y = contentTop + rightBtnColStackStart;
      rightBtnColStackStart += btn.height;
    }

    return { x, y, width: btn.width, height: btn.height };
  }

  // calcs first stick pos
  let x = determineStickCoord(controllers.stick.width, controllers.stick.xAlign, contentLeft, contentRight),
    y = determineStickCoord(controllers.stick.height, controllers.stick.yAlign, contentTop, contentBottom);
  return {
    stick: { width: controllers.stick.width, height: controllers.stick.height, x, y },
    button: controllers.button?.map((btn) => determineBtnCoords(btn)),
  };
}
function determineStickCoord(
  size: SizeProps["width"] | SizeProps["height"],
  align: PositionProps["xAlign"] | PositionProps["yAlign"],
  startCoord: number,
  endCoord: number
) {
  if (align == "left" || align == "top") return startCoord;
  else if (align == "center") return startCoord - size / 2;
  else return endCoord - size;
}

/** Determines a box for positioning as block and targeting */
export class RectBox extends DOMRectReadOnly {
  readonly parent: HTMLElement | RectBox;
  readonly trackingTouch?: Touch["identifier"];

  /**
   * Position is done as normal document flow, from left to right, and from top to bottom
   * @param parent - An element only if this is the root box
   * @param rect - An object with this size and position
   */
  constructor(parent: HTMLElement);
  constructor(parent: RectBox, rect: Required<DOMRectInit>);
  constructor(parent: HTMLElement | RectBox, rect?: Required<DOMRectInit>) {
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
  }
  /** @returns A {@link Coords} relative to this parent */
  public getAbsoluteCoords(x: number, y: number): Coords {
    return [x - this.x, y - this.y];
  }
  /**
   * Tests if parsed coords target this rect
   * @param absoluteCoords - A {@link Coords} relative to this parent
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
   * @param debouncing - A number of delay in ms to listen for resizing events
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

export class StickOrigin {
  readonly origin: BoxPoint;

  /**
   * Defines a center origin {@link BoxPoint}
   * @param coords - An object with its coords for defining a {@link BoxPoint}
   */
  constructor(coords: Coords) {
    this.origin = new BoxPoint(coords[0], coords[1]);
  }
}
