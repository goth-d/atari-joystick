interface JoystickOptions {
  directions?: 4 | 8;
  size?: number;
}

class JoystickController {
  constructor(options: JoystickOptions) {}
}

export default JoystickController;
