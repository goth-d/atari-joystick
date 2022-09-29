import { StickOrigin } from "./util";

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

export type JoystickPadOptions = PositionProps & {
  /** A number of milliseconds, of delay, for computing touch moves */
  throttling: number | null;
};

/** Controllers identifiers */
export type JoystickControllers = { stick: StickOptions; button?: ButtonOptions[] };

type Options<Controllers> = {
  [Controller in keyof Controllers as `${Uncapitalize<string & Controller>}Options`]: Controllers[Controller];
};

export type ControllersOptions = Options<JoystickControllers>;

export type JoystickOptions = JoystickPadOptions & ControllersOptions;

export type StickState = {
  /** A boolean if stick is being hold */
  isActive: boolean;
  /** The current direction */
  direction?: Direction;
  /** A number of current computed touch angle */
  angle?: number;
  /** A number of angle cosine */
  cos?: number;
  /** A number of angle sine */
  sin?: number;
  /** A list with X, Y numbers */
  coords?: Coords;
};

/** Controller initial options*/
type ButtonOptions = {};

/** Controller initial options*/
export type StickOptions = StickStateOptionsInit & Pick<InterfaceProps, "size" | "padding" | "margin"> & StickRenderOptions;

type StickRenderOptions = PositionProps & {
  /** A boolean for drawing flares indicating current direction */
  flares: boolean;
  /** A boolean for drawing an assistive stick pointer, drawn in the margin */
  ghostPointer: boolean;
};
export type StickStateOptionsInit = ControllerStateOptions<StickState> & {
  /** A number of {@link Direction} */
  directions: number | null;
};
export type StickStateOptions = ControllerStateOptions<StickState> & {
  /** A list of {@link Direction} */
  directions: Direction[];
  /** The {@link StickOrigin} implementation */
  origin: StickOrigin["origin"];
  /** The new computed state */
  newState: StickState;
};

type ControllerStateOptions<ControllerState> = {
  /** A callback function called before controller state updates */
  onUpdate: ((state: Readonly<ControllerState>) => void) | null;
  /** A boolean for starting disabled */
  // startDisabled: boolean;
};

/** Properties used for setting pad controllers position */
export type PositionProps = {
  xAlign: "left" | "right" | "center";
  yAlign: "top" | "bottom" | "center";
};
/** Properties used for sizes */
export type SizeProps = Pick<DOMRect, "width" | "height">;
// TODO: add CoordProps and remove Coords
export type ControllersSizesPositions = {
  [Controller in keyof JoystickControllers]: JoystickControllers[Controller] extends Array<object> | undefined
    ? (SizeProps & PositionProps)[]
    : SizeProps & PositionProps;
};
export type ControllersRects = {
  [Controller in keyof JoystickControllers]: JoystickControllers[Controller] extends Array<object> | undefined
    ? Required<DOMRectInit>[]
    : Required<DOMRectInit>;
};

/** Properties that can be used for pad interface */
export type InterfacePropsUnion = "width" | "height" | "padding" | "margin" | "size";
/** Intersection properties of controllers interface */
export type InterfacePropsInt<ControllerOptions> = {
  [Property in keyof ControllerOptions as Extract<Property, InterfacePropsUnion>]: ControllerOptions[Property];
};
/** Controller properties used for setting interface values */
export type InterfaceProps = { [Prop in InterfacePropsUnion]: number };
