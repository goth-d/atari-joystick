export type CoordsTuple = {
  /** represents X */
  0: number;
  /** represents Y */
  1: number;
};

export type DebouncingHandlerTuple<Ev = Event> = {
  /** The event handler function */
  0: (event: Ev) => void;
  /** The current pause timeout ref */
  1?: number;
};

export type CongruentDirection = {
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
  const dirAngles: CongruentDirection[] = [];
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

export function isAngleInSlice(angle: number, dir: CongruentDirection) {
  return angle >= dir.startAngle && angle <= dir.endAngle;
}
