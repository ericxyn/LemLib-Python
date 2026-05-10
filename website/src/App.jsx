import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { ChevronDown, ChevronRight, Clipboard, FileCode2, Github, Menu, Moon, Play, Sun } from "lucide-react";
import html2canvas from "html2canvas";
import "./styles.css";
import "./liquid.css";

const samplePath = `0, 0, 80
12, 18, 95
24, 24, 70
36, 16, 0
endData`;

const pages = [
  {
    id: "index",
    title: "Documentation Home",
    group: "Home",
    blocks: [
      p("Welcome to the documentation for LemLib Python. This site contains everything you need to use or contribute to the Python recreation of LemLib."),
      p("If you are new, start with the introductory tutorials. If you already know what you are doing, jump to the API reference or the LemLib path converter."),
      callout("note", "Port status", "This is an initial hardware-agnostic Python port. The math, path format, and control surfaces are available now; real robot projects should provide motor and sensor adapters for their runtime."),
      code(`from lemlib import Chassis, ControllerSettings, Drivetrain, OdomSensors, Pose

drivetrain = Drivetrain(track_width=10, wheel_diameter=4, rpm=360)
lateral = ControllerSettings(10, 0, 3, 3, 1, 100, 3, 500, 20)
angular = ControllerSettings(2, 0, 10, 3, 1, 100, 3, 500, 0)

chassis = Chassis(drivetrain, lateral, angular, OdomSensors())
chassis.set_pose(Pose(0, 0, 0))
print(chassis.move_to_point(0, 48))`, "python"),
    ],
  },
  {
    id: "about",
    title: "About",
    group: "Home",
    blocks: [
      p("LemLib Python brings LemLib's autonomous-motion ideas into Python for simulation, education, and Python robotics runtimes."),
      p("The project keeps LemLib's familiar concepts: poses, drivetrain settings, PID controllers, odometry sensors, driver-control curves, angular motions, lateral motions, pure pursuit, and motion chaining."),
      p("The package does not assume one hardware platform. Motor groups can be plain callables or objects with move and brake methods, which keeps the core easy to test."),
    ],
  },
  {
    id: "download",
    title: "Download",
    group: "Home",
    blocks: [
      p("Install the package from a local checkout while the project is in alpha."),
      code(`git clone https://github.com/ericxyn/LemLib-Python.git
cd LemLib-Python
python -m pip install -e .`, "bash"),
      p("The documentation web app lives in the website folder."),
      code(`cd website
npm install
npm run dev`, "bash"),
    ],
  },
  {
    id: "contribute",
    title: "Contributing",
    group: "Home",
    blocks: [
      p("Contributions should stay close to the upstream LemLib concepts while making Python choices feel natural: dataclasses, snake_case methods, explicit adapters, and small testable functions."),
      p("Before changing motion behavior, add a unit test that captures the existing output. For UI changes, run the Vite build and check the docs at desktop and mobile widths."),
    ],
  },
  {
    id: "support",
    title: "Support",
    group: "Home",
    blocks: [
      p("Open a GitHub issue with the code snippet, expected motion, actual output, and whether you are using the package for simulation or a robot runtime."),
      p("For upstream LemLib questions, use the original LemLib documentation and community links."),
    ],
  },
  tutorial("1 - Getting Started", "1_getting_started", [
    h("Installation"),
    p("Create a Python project and install LemLib Python in editable mode. Editable installs are useful while the package is still young because examples and tests can run against your local source tree."),
    code(`python -m venv .venv
.venv\\Scripts\\activate
python -m pip install -e .`, "bash"),
    h("First import"),
    p("The Python package uses snake_case first, with camelCase aliases for teams porting C++ snippets."),
    code(`from lemlib import Chassis, ControllerSettings, Drivetrain, OdomSensors, Pose`, "python"),
    h("Project shape"),
    p("A normal project has a robot configuration module, an autonomous module, and optional path files exported from path.jerryio."),
    code(`robot/
  config.py
  autonomous.py
  paths/
    skills.txt`, "text"),
    h("Next step"),
    p("Once the package imports, configure your drivetrain, sensors, and PID settings."),
  ]),
  tutorial("2 - Configuration", "2_configuration", [
    h("Introduction"),
    p("Configuration tells LemLib Python what your drivetrain looks like, what sensor sources exist, and which PID settings to use."),
    h("Motor adapters"),
    p("Motor groups can be callables or objects with move and brake methods. This lets the same control code run in tests, simulators, or a robot runtime."),
    code(`class MotorGroup:
    def __init__(self, name):
        self.name = name
        self.history = []

    def move(self, power):
        self.history.append(power)

    def brake(self):
        self.history.append(0)`, "python"),
    h("Drivetrain"),
    code(`from lemlib import Drivetrain, Omniwheel

left_motors = MotorGroup("left")
right_motors = MotorGroup("right")

drivetrain = Drivetrain(
    left_motors=left_motors,
    right_motors=right_motors,
    track_width=10,
    wheel_diameter=Omniwheel.NEW_4,
    rpm=360,
    horizontal_drift=2,
)`, "python"),
    h("Odometry sensors"),
    p("Use OdomSensors to keep the same shape as LemLib. The initial port does not require real hardware objects; pass adapters when your runtime has them."),
    code(`from lemlib import OdomSensors

sensors = OdomSensors(
    vertical_1=None,
    vertical_2=None,
    horizontal_1=None,
    horizontal_2=None,
    imu=None,
)`, "python"),
    h("PID settings"),
    code(`from lemlib import ControllerSettings

lateral_controller = ControllerSettings(10, 0, 3, 3, 1, 100, 3, 500, 20)
angular_controller = ControllerSettings(2, 0, 10, 3, 1, 100, 3, 500, 0)`, "python"),
    h("Chassis"),
    code(`from lemlib import Chassis

chassis = Chassis(drivetrain, lateral_controller, angular_controller, sensors)
chassis.calibrate()
print(chassis.get_pose())`, "python"),
  ]),
  tutorial("3 - Driver Control", "3_driver_control", [
    h("Introduction"),
    p("Driver control maps joystick values to left and right drivetrain outputs. Inputs normally range from -127 to 127."),
    h("Tank drive"),
    code(`def driver_loop(left_y, right_y):
    chassis.tank(left_y, right_y)`, "python"),
    h("Arcade drive"),
    code(`def driver_loop(left_y, right_x):
    chassis.arcade(left_y, right_x)`, "python"),
    h("Curvature drive"),
    p("Curvature drive uses throttle and a turn curve. It behaves like an arc at speed and feels smoother than simple arcade for many drivers."),
    code(`def driver_loop(left_y, right_x):
    chassis.curvature(left_y, right_x)`, "python"),
    h("Input scaling"),
    p("ExpoDriveCurve makes small joystick movements softer while preserving full output near the end of travel."),
    code(`from lemlib import ExpoDriveCurve

throttle_curve = ExpoDriveCurve(deadband=3, minimum_output=10, curve_gain=1.019)
steer_curve = ExpoDriveCurve(deadband=3, minimum_output=10, curve_gain=1.019)

chassis = Chassis(drivetrain, lateral_controller, angular_controller, sensors, throttle_curve, steer_curve)`, "python"),
  ]),
  tutorial("4 - PID Tuning", "4_pid_tuning", [
    h("Introduction"),
    p("LemLib Python uses one lateral PID and one angular PID. The tuning order is the same as LemLib: start with kP and kD, add kI only when needed, then tune slew and exit conditions."),
    h("Angular PID"),
    code(`angular_controller = ControllerSettings(
    2,  # kP
    0,  # kI
    10, # kD
    3,  # windup range
    1, 100,
    3, 500,
    0,
)`, "python"),
    p("Test angular tuning with a heading step. Increase kP until the turn reaches the target quickly, then increase kD until oscillation is controlled."),
    code(`chassis.set_pose(Pose(0, 0, 0))
signal = chassis.turn_to_heading(90)
print(signal)`, "python"),
    h("Lateral PID"),
    code(`lateral_controller = ControllerSettings(10, 0, 3, 3, 1, 100, 3, 500, 20)
chassis.set_pose(Pose(0, 0, 0))
print(chassis.move_to_point(0, 48))`, "python"),
    h("kI and windup"),
    p("Use kI only for steady-state error that kP and kD cannot reasonably remove. Keep a windup range so the integral only accumulates near the target."),
    h("Slew"),
    p("Slew limits acceleration. It is helpful when a simulated or physical drivetrain slips, tips, or saturates too aggressively."),
    h("Exit conditions"),
    p("ControllerSettings stores small and large error windows with timeouts. Those values are available to motion code and tests through ExitCondition.from_settings."),
  ]),
  tutorial("5 - Angular Motions", "5_angular_motion", [
    h("Turn to heading"),
    p("turn_to_heading rotates the robot to an absolute field heading."),
    code(`chassis.set_pose(Pose(0, 0, 0))
chassis.turn_to_heading(270)`, "python"),
    h("Turn to point"),
    p("turn_to_point calculates the heading from the current pose to a field coordinate."),
    code(`chassis.turn_to_point(53, 53)`, "python"),
    h("Swing to heading"),
    p("Swing turns lock one side of the drivetrain and move the other side."),
    code(`chassis.swing_to_heading(45)`, "python"),
    h("Swing to point"),
    code(`chassis.swing_to_point(53, 53)`, "python"),
  ]),
  tutorial("6 - Lateral Motion", "6_lateral_motion", [
    h("Move to point"),
    p("move_to_point drives to an x/y coordinate while turning toward the target point."),
    code(`chassis.move_to_point(10, 10)`, "python"),
    h("Backwards movement"),
    code(`from lemlib import MoveToPointParams

chassis.move_to_point(20, 15, params=MoveToPointParams(forwards=False))`, "python"),
    h("Move to pose"),
    p("move_to_pose uses a boomerang-style carrot point so the chassis can finish with a chosen heading."),
    code(`chassis.move_to_pose(10, 10, 90)`, "python"),
    h("Lead and horizontal drift"),
    code(`from lemlib import MoveToPoseParams

params = MoveToPoseParams(lead=0.3, horizontal_drift=8)
chassis.move_to_pose(0, 0, 0, params=params)`, "python"),
  ]),
  tutorial("7 - Pure Pursuit", "7_pure_pursuit", [
    h("What is pure pursuit?"),
    p("Pure pursuit follows a path by selecting a lookahead point ahead of the robot and driving toward the arc that reaches it."),
    h("Creating paths"),
    p("Use path.jerryio.com and export the original LemLib v0.5 format. It is a text file with one waypoint per line: x, y, speed, followed by endData."),
    code(samplePath, "text"),
    h("Load and follow"),
    code(`from pathlib import Path as FilePath
from lemlib import parse_lemlib_path

path = parse_lemlib_path(FilePath("paths/skills.txt").read_text())
chassis.follow(path, lookahead_distance=15)`, "python"),
    h("Converter"),
    p("The converter page turns the same LemLib text export into Python Path and Waypoint code."),
  ]),
  tutorial("8 - Motion Chaining", "8_motion_chaining", [
    h("Introduction"),
    p("Motion chaining keeps the robot moving between commands. In Python, use minimum speeds, early-exit ranges, and explicit cancellation when a custom condition has been met."),
    h("Minimum speed"),
    code(`from lemlib import MoveToPoseParams

first_leg = MoveToPoseParams(min_lateral_speed=72, early_exit_range=8)
chassis.move_to_pose(48, -24, 90, params=first_leg)
chassis.move_to_pose(64, 3, 0)`, "python"),
    h("Motion cancellation"),
    code(`signal = chassis.move_to_point(0, 24, params=MoveToPointParams(min_lateral_speed=48))
if ball_detected():
    chassis.cancel_motion()`, "python"),
    h("Turning into a chain"),
    code(`turn = SwingParams(min_speed=127, early_exit_range=20)
chassis.swing_to_heading(90, params=turn)
chassis.move_to_pose(120, 10, 0)`, "python"),
  ]),
  {
    id: "api",
    title: "API Reference",
    group: "Reference",
    blocks: apiReferenceBlocks(),
  },
  {
    id: "converter",
    title: "LemLib Path Converter",
    group: "Tools",
    blocks: [],
    converter: true,
  },
];

function p(text) {
  return { type: "p", text };
}

function h(text) {
  return { type: "h", text };
}

function code(text, lang) {
  return { type: "code", text, lang };
}

function list(items) {
  return { type: "list", items };
}

function callout(kind, title, text) {
  return { type: "callout", kind, title, text };
}

function tutorial(title, id, blocks) {
  return { id, title, group: "Tutorials", blocks };
}

function apiReferenceBlocks() {
  return [
    p("This reference mirrors LemLib's API layout while documenting the Python package surface. Python names use snake_case first; camelCase aliases are listed where the port provides them for teams moving C++ snippets over gradually."),
    apiIndex([
      {
        title: "Main API",
        items: [
          "Chassis",
          "DriveSignal",
          "TurnToHeadingParams",
          "TurnToPointParams",
          "SwingParams",
          "MoveToPointParams",
          "MoveToPoseParams",
          "FollowParams",
        ],
      },
      {
        title: "Builder Classes",
        items: [
          "Drivetrain",
          "OdomSensors",
          "Omniwheel",
          "ControllerSettings",
          "ExitCondition",
          "DriveCurve",
          "ExpoDriveCurve",
        ],
      },
      {
        title: "Odometry and Geometry",
        items: ["Vector2D", "Pose", "TrackingWheel", "TrackingWheelOdometry"],
      },
      {
        title: "Paths",
        items: ["Waypoint", "Path", "parse_lemlib_path", "convert_lemlib_to_python"],
      },
      {
        title: "PID and Utils",
        items: [
          "Gains",
          "PID",
          "AngularDirection",
          "SlewDirection",
          "DriveOutputs",
          "deg_to_rad",
          "rad_to_deg",
          "sanitize_angle",
          "angle_error",
          "slew",
          "constrain_power",
          "desaturate",
          "get_signed_tangent_arc_curvature",
          "avg",
          "ema",
        ],
      },
    ]),
    h("Main API"),
    apiEntry(
      "Chassis",
      "Chassis(drivetrain, lateral_settings, angular_settings, sensors=None, throttle_curve=None, steer_curve=None, pose=None)",
      "Hardware-agnostic tank-drive facade for driver control, odometry pose storage, and autonomous motion calculations.",
      [
        apiMember("calibrate(calibrate_imu=True)", "Resets the lateral and angular PID controllers."),
        apiMember("set_pose(pose_or_x, y=None, theta=None)", "Stores the current pose. Accepts a Pose instance or x, y, theta values."),
        apiMember("get_pose() -> Pose", "Returns the current robot pose."),
        apiMember("tank(left, right, curve=True) -> DriveSignal", "Applies tank-drive outputs, optionally through the throttle curve."),
        apiMember("arcade(throttle, steer, reverse=False, steer_priority=0.5) -> DriveSignal", "Mixes throttle and steering into left/right outputs."),
        apiMember("curvature(throttle, curve, reverse=False) -> DriveSignal", "Curvature-drive helper where turn output scales with throttle magnitude."),
        apiMember("turn_to_heading(heading, timeout=None, params=None, dt=0.01) -> DriveSignal", "Calculates an angular PID step toward an absolute heading."),
        apiMember("turn_to_point(x, y, timeout=None, params=None, dt=0.01) -> DriveSignal", "Turns toward a field coordinate."),
        apiMember("swing_to_heading(heading, timeout=None, params=None, dt=0.01) -> DriveSignal", "Turns while locking one drivetrain side."),
        apiMember("swing_to_point(x, y, timeout=None, params=None, dt=0.01) -> DriveSignal", "Swing-turns toward a field coordinate."),
        apiMember("move_to_point(x, y, timeout=None, params=None, dt=0.01) -> DriveSignal", "Runs a lateral and angular control step toward a point."),
        apiMember("move_to_pose(x, y, theta, timeout=None, params=None, dt=0.01) -> DriveSignal", "Runs the boomerang-style pose motion calculation."),
        apiMember("follow(path, lookahead_distance, timeout=None, params=None, dt=0.01) -> DriveSignal", "Follows a LemLib path or parsed Path using pure-pursuit lookahead."),
        apiMember("cancel_motion()", "Stops the current motion by braking the drivetrain adapters."),
        apiMember("cancel_all_motions()", "Compatibility wrapper around cancel_motion()."),
        apiMember("is_in_motion() -> bool", "Returns whether the last commanded signal is non-zero."),
        apiMember("brake()", "Calls brake() on motor adapters that provide it and clears last_signal."),
      ],
      ["setPose", "getPose", "turnToHeading", "turnToPoint", "swingToHeading", "swingToPoint", "moveToPoint", "moveToPose", "cancelMotion", "cancelAllMotions", "isInMotion"],
    ),
    apiEntry(
      "DriveSignal",
      "DriveSignal(left: float, right: float, lateral: float = 0.0, angular: float = 0.0)",
      "Return value for drivetrain commands. Left and right are motor outputs; lateral and angular keep the mixed controller components available for logging or simulation.",
    ),
    h("Movement Options"),
    apiEntry(
      "TurnToHeadingParams",
      "TurnToHeadingParams(max_speed=127.0, min_speed=0.0, slew=0.0, early_exit_range=0.0)",
      "Options for absolute heading turns.",
    ),
    apiEntry(
      "TurnToPointParams",
      "TurnToPointParams(max_speed=127.0, min_speed=0.0, slew=0.0, early_exit_range=0.0, forwards=True)",
      "Turn-to-point options. Set forwards to False when the robot should face the target with its back side.",
    ),
    apiEntry(
      "SwingParams",
      "SwingParams(max_speed=127.0, min_speed=0.0, slew=0.0, early_exit_range=0.0, locked_side='left')",
      "Swing-turn options. locked_side may be 'left' or 'right'.",
    ),
    apiEntry(
      "MoveToPointParams",
      "MoveToPointParams(forwards=True, max_lateral_speed=127.0, min_lateral_speed=0.0, max_angular_speed=127.0, lateral_slew=0.0, angular_slew=0.0, early_exit_range=0.0)",
      "Options for point-to-point lateral motion.",
    ),
    apiEntry(
      "MoveToPoseParams",
      "MoveToPoseParams(..., lead=0.6, horizontal_drift=None)",
      "Extends MoveToPointParams with boomerang lead and optional horizontal drift limiting.",
    ),
    apiEntry(
      "FollowParams",
      "FollowParams(forwards=True, lateral_slew=0.0)",
      "Options for pure-pursuit path following.",
    ),
    h("Builder Classes"),
    apiEntry(
      "Drivetrain",
      "Drivetrain(left_motors=None, right_motors=None, track_width=0.0, wheel_diameter=Omniwheel.NEW_4, rpm=360.0, horizontal_drift=2.0)",
      "Stores tank-drive geometry and hardware adapters.",
      [apiMember("wheel_size -> float", "Property returning the wheel diameter as a plain float.")],
    ),
    apiEntry(
      "OdomSensors",
      "OdomSensors(vertical_1=None, vertical_2=None, horizontal_1=None, horizontal_2=None, imu=None)",
      "Container for tracking-wheel and IMU adapters.",
    ),
    apiEntry(
      "Omniwheel",
      "Enum: NEW_2, NEW_275, OLD_275, NEW_275_HALF, OLD_275_HALF, NEW_325, OLD_325, NEW_325_HALF, OLD_325_HALF, NEW_4, OLD_4, NEW_4_HALF, OLD_4_HALF",
      "Wheel diameter presets matching LemLib's common VEX omniwheel constants.",
    ),
    apiEntry(
      "ControllerSettings",
      "ControllerSettings(kp, ki, kd, windup_range=0.0, small_error=0.0, small_timeout=0.0, large_error=0.0, large_timeout=0.0, slew=0.0)",
      "PID and exit-condition configuration for chassis controllers.",
      [apiMember("create_pid() -> PID", "Builds a PID controller with sign-flip reset enabled.")],
    ),
    apiEntry(
      "ExitCondition",
      "ExitCondition(small_error=0.0, small_timeout=0.0, large_error=0.0, large_timeout=0.0)",
      "Tracks small-error and large-error settling windows.",
      [
        apiMember("from_settings(settings) -> ExitCondition", "Creates an exit condition from ControllerSettings timeouts."),
        apiMember("update(error, dt) -> bool", "Returns True when either settling window has elapsed."),
        apiMember("reset()", "Clears elapsed settling timers."),
      ],
    ),
    apiEntry(
      "DriveCurve",
      "DriveCurve().curve(value: float) -> float",
      "Base driver-control curve. The default curve returns the input unchanged and is callable.",
    ),
    apiEntry(
      "ExpoDriveCurve",
      "ExpoDriveCurve(deadband=3.0, minimum_output=10.0, curve_gain=1.019, maximum_input=127.0)",
      "Exponential joystick curve with a deadband and minimum output.",
      [apiMember("curve(value) -> float", "Returns the curved driver-control value.")],
    ),
    h("Odometry"),
    apiEntry(
      "Vector2D",
      "Vector2D(x=0.0, y=0.0)",
      "2D point or displacement in field units.",
      [
        apiMember("distance_to(other) -> float", "Euclidean distance to another vector."),
        apiMember("angle_to(other) -> float", "Heading in degrees where 0 points along +Y."),
        apiMember("rotated_by(theta) -> Vector2D", "Rotates using robot-heading convention."),
        apiMember("from_polar(theta, radius) -> Vector2D", "Class method for heading/radius construction."),
      ],
    ),
    apiEntry(
      "Pose",
      "Pose(x=0.0, y=0.0, theta=0.0)",
      "Robot pose with position and heading.",
      [
        apiMember("orientation -> float", "Property alias for theta."),
        apiMember("with_heading(theta) -> Pose", "Returns the same position with a new heading."),
        apiMember("translated(delta) -> Pose", "Returns a pose shifted by a Vector2D."),
        apiMember("as_vector() -> Vector2D", "Returns the x/y component as a vector."),
      ],
    ),
    apiEntry(
      "TrackingWheel",
      "TrackingWheel(diameter: float, offset: float, ratio: float = 1.0, last_total: float = 0.0)",
      "Converts encoder degrees into tracking-wheel travel.",
      [
        apiMember("distance_from_degrees(degrees) -> float", "Converts encoder degrees to linear distance."),
        apiMember("distance_delta(total_degrees) -> float", "Returns travel since the previous total and stores the new total."),
        apiMember("reset()", "Resets the stored wheel total."),
      ],
    ),
    apiEntry(
      "TrackingWheelOdometry",
      "TrackingWheelOdometry(pose=None)",
      "Tracking-wheel odometry update math.",
      [
        apiMember("get_pose() -> Pose", "Returns the current pose."),
        apiMember("set_pose(pose)", "Stores a pose."),
        apiMember("update(vertical_delta, horizontal_delta, heading, vertical_offset=0.0, horizontal_offset=0.0) -> Pose", "Applies one odometry update and returns the new pose."),
      ],
      ["getPose", "setPose"],
    ),
    h("Path Tools"),
    apiEntry(
      "Waypoint",
      "Waypoint(x: float, y: float, speed: float)",
      "One point from a path.jerryio LemLib v0.5 export.",
    ),
    apiEntry(
      "Path",
      "Path(list[Waypoint])",
      "List-like path object with export helpers.",
      [
        apiMember("to_lemlib() -> str", "Serializes to LemLib path text ending with endData."),
        apiMember("to_python(variable_name='path') -> str", "Serializes to importable Python code."),
        apiMember("to_json() -> str", "Serializes waypoints as formatted JSON."),
      ],
    ),
    apiEntry(
      "parse_lemlib_path",
      "parse_lemlib_path(text: str) -> Path",
      "Parses path.jerryio's LemLib v0.5 text export.",
    ),
    apiEntry(
      "convert_lemlib_to_python",
      "convert_lemlib_to_python(text: str, variable_name: str = 'path') -> str",
      "Converts LemLib path text directly into Python Path and Waypoint code.",
    ),
    h("PID"),
    apiEntry(
      "Gains",
      "Gains(kp=0.0, ki=0.0, kd=0.0)",
      "PID gain container.",
    ),
    apiEntry(
      "PID",
      "PID(kp: float | Gains, ki=0.0, kd=0.0, windup_range=0.0, sign_flip_reset=False)",
      "PID controller compatible with LemLib's control style.",
      [
        apiMember("get_gains() -> Gains", "Returns a copy of the current gains."),
        apiMember("set_gains(gains)", "Replaces PID gains."),
        apiMember("update(error, dt=None) -> float", "Calculates the next controller output."),
        apiMember("reset()", "Clears previous error, integral, and timing state."),
        apiMember("set_sign_flip_reset(value)", "Toggles integral reset when error sign changes."),
        apiMember("get_sign_flip_reset() -> bool", "Returns the sign-flip reset setting."),
        apiMember("set_windup_range(value)", "Sets the integral windup range."),
        apiMember("get_windup_range() -> float", "Returns the integral windup range."),
      ],
      ["getGains", "setGains", "setSignFlipReset", "getSignFlipReset", "setWindupRange", "getWindupRange"],
    ),
    h("Utils"),
    apiEntry(
      "AngularDirection",
      "Enum: CW_CLOCKWISE='cw', CCW_COUNTERCLOCKWISE='ccw'",
      "Optional direction constraint for angle_error().",
    ),
    apiEntry(
      "SlewDirection",
      "Enum: INCREASING='increasing', DECREASING='decreasing', ALL='all'",
      "Optional direction constraint for slew().",
    ),
    apiEntry(
      "DriveOutputs",
      "DriveOutputs(left: float, right: float)",
      "Normalized left/right output pair returned by desaturate().",
    ),
    apiEntry("deg_to_rad", "deg_to_rad(deg: float) -> float", "Converts degrees to radians."),
    apiEntry("rad_to_deg", "rad_to_deg(rad: float) -> float", "Converts radians to degrees."),
    apiEntry("sanitize_angle", "sanitize_angle(angle: float) -> float", "Wraps an angle to [0, 360)."),
    apiEntry("angle_error", "angle_error(target: float, position: float, direction: AngularDirection | None = None) -> float", "Returns target-position heading error in degrees."),
    apiEntry("slew", "slew(target: float, current: float, max_change_rate: float, delta_time: float = 1.0, direction_limit: SlewDirection = SlewDirection.ALL) -> float", "Constrains value change over time."),
    apiEntry("constrain_power", "constrain_power(power: float, maximum: float, minimum: float = 0) -> float", "Applies signed minimum and absolute maximum output limits."),
    apiEntry("desaturate", "desaturate(lateral_output: float, angular_output: float) -> DriveOutputs", "Combines lateral and angular outputs into normalized left/right outputs."),
    apiEntry("get_signed_tangent_arc_curvature", "get_signed_tangent_arc_curvature(start: Pose, end: Vector2D) -> float", "Returns the signed curvature of an arc tangent to a starting pose and ending at a point."),
    apiEntry("avg", "avg(*values: float) -> float", "Returns the arithmetic mean. A single iterable is accepted."),
    apiEntry("ema", "ema(previous: float, current: float, alpha: float) -> float", "Returns an exponential moving average."),
  ];
}

function apiIndex(sections) {
  return { type: "api-index", sections };
}

function apiEntry(name, signature, description, members = [], aliases = []) {
  return { type: "api-entry", name, signature, description, members, aliases };
}

function apiMember(name, text) {
  return { name, text };
}

const apiSections = apiReferenceBlocks().find((block) => block.type === "api-index").sections;
const apiEntries = apiReferenceBlocks().filter((block) => block.type === "api-entry");
const defaultApiId = slug(apiSections[0].items[0]);

function getInitialPage() {
  const hash = window.location.hash.replace("#/", "");
  return pages.some((page) => page.id === hash) ? hash : "index";
}

const LIQUID_GL_SRC = "https://cdn.jsdelivr.net/gh/naughtyduk/liquidGL@main/scripts/liquidGL.js";
const GITHUB_URL = "https://github.com/ericxyn/LemLib-Python";

function App() {
  const [activeId, setActiveId] = useState(getInitialPage);
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem("lemlib-theme") || "light");
  const [activeApiId, setActiveApiId] = useState(defaultApiId);
  const [expandedApiGroups, setExpandedApiGroups] = useState(() => (
    apiSections.reduce((groups, section) => ({ ...groups, [section.title]: true }), {})
  ));
  const articleRef = useRef(null);
  const active = pages.find((page) => page.id === activeId) || pages[0];
  const grouped = useMemo(() => groupPages(pages), []);

  useEffect(() => {
    window.html2canvas = html2canvas;

    let cancelled = false;
    let retryId = 0;

    function loadLiquidScript() {
      if (typeof window.liquidGL === "function") return Promise.resolve();
      if (window.__lemlibLiquidScriptPromise) return window.__lemlibLiquidScriptPromise;

      window.__lemlibLiquidScriptPromise = new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = LIQUID_GL_SRC;
        script.async = true;
        script.dataset.liquidglScript = "true";
        script.onload = resolve;
        script.onerror = () => reject(new Error("liquidGL failed to load"));
        document.body.appendChild(script);
      });

      return window.__lemlibLiquidScriptPromise;
    }

    function refreshLiquidGlass() {
      const renderer = window.__liquidGLRenderer__;
      renderer?.lenses?.forEach((lens) => lens.updateMetrics?.());
      renderer?.captureSnapshot?.();
      renderer?.render?.();
    }

    function initLiquidGlass(attempt = 0) {
      if (cancelled) return;
      if (typeof window.liquidGL !== "function") {
        if (attempt < 40) {
          retryId = window.setTimeout(() => initLiquidGlass(attempt + 1), 50);
        }
        return;
      }

      if (window.__lemlibLiquidGlass) {
        refreshLiquidGlass();
        return;
      }

      window.__lemlibLiquidGlass = window.liquidGL({
        target: ".liquidGL",
        snapshot: "body",
        resolution: Math.min(window.devicePixelRatio || 1, 2),
        refraction: 0.018,
        bevelDepth: 0.065,
        bevelWidth: 0.16,
        frost: 1.25,
        shadow: true,
        specular: true,
        reveal: "fade",
        tilt: true,
        tiltFactor: 2,
        magnify: 1.015,
        on: {
          init() {
            document.documentElement.classList.add("liquid-ready");
          },
        },
      });
    }

    loadLiquidScript().then(() => initLiquidGlass()).catch((error) => {
      console.warn(error);
    });

    return () => {
      cancelled = true;
      window.clearTimeout(retryId);
    };
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("lemlib-theme", theme);

    const refreshId = window.setTimeout(() => {
      const renderer = window.__liquidGLRenderer__;
      renderer?.captureSnapshot?.();
      renderer?.render?.();
    }, 180);

    return () => window.clearTimeout(refreshId);
  }, [theme]);

  useEffect(() => {
    const refreshId = window.setTimeout(() => {
      const renderer = window.__liquidGLRenderer__;
      renderer?.lenses?.forEach((lens) => lens.updateMetrics?.());
      renderer?.captureSnapshot?.();
      renderer?.render?.();
    }, 120);

    return () => window.clearTimeout(refreshId);
  }, [activeId]);

  useEffect(() => {
    function handleHashChange() {
      setActiveId(getInitialPage());
    }

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  function scrollArticleTop() {
    articleRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }

  function expandAllApiGroups() {
    setExpandedApiGroups(apiSections.reduce((groups, section) => ({ ...groups, [section.title]: true }), {}));
  }

  function navigate(id) {
    setActiveId(id);
    window.location.hash = `/${id}`;
    if (id === "api") {
      setActiveApiId(defaultApiId);
      expandAllApiGroups();
      requestAnimationFrame(scrollArticleTop);
    }
    setMenuOpen(false);
  }

  function openApiEntry(entryId) {
    setActiveId("api");
    setActiveApiId(entryId);
    window.location.hash = "/api";
    requestAnimationFrame(scrollArticleTop);
  }

  function toggleApiGroup(title) {
    setExpandedApiGroups((groups) => ({ ...groups, [title]: !groups[title] }));
  }

  return (
    <div className="app-shell">
      <header className="mobile-topbar liquidGL">
        <button className="icon-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle contents">
          <Menu size={18} />
        </button>
        <span>LemLib Python documentation</span>
      </header>
      <aside className={`sidebar liquidGL ${menuOpen ? "open" : ""}`}>
        <div className="brand" onClick={() => navigate("index")}>
          <div className="brand-mark">L</div>
          <div>
            <strong>LemLib Python</strong>
            <span>documentation</span>
          </div>
        </div>
        <div className="side-actions" aria-label="Site actions">
          <button
            className={theme === "light" ? "active" : ""}
            onClick={() => setTheme("light")}
            aria-label="Light mode"
            title="Light mode"
          >
            <Sun size={17} />
          </button>
          <button
            className={theme === "dark" ? "active" : ""}
            onClick={() => setTheme("dark")}
            aria-label="Dark mode"
            title="Dark mode"
          >
            <Moon size={17} />
          </button>
          <a href={GITHUB_URL} target="_blank" rel="noreferrer" aria-label="GitHub repository" title="GitHub repository">
            <Github size={17} />
          </a>
        </div>
        <nav>
          {Object.entries(grouped).map(([group, groupPages]) => (
            <section key={group} className="nav-section">
              <p>{group}</p>
              {groupPages.map((page) => (
                <React.Fragment key={page.id}>
                  <button
                    className={page.id === activeId ? "active" : ""}
                    onClick={() => navigate(page.id)}
                  >
                    {page.title}
                  </button>
                  {page.id === "api" && activeId === "api" && (
                    <ApiSidebarTree
                      sections={apiSections}
                      activeApiId={activeApiId}
                      expandedGroups={expandedApiGroups}
                      onToggleGroup={toggleApiGroup}
                      onOpenEntry={openApiEntry}
                    />
                  )}
                </React.Fragment>
              ))}
            </section>
          ))}
        </nav>
      </aside>
      <main className="content-wrap">
        <article className="doc-article liquidGL" ref={articleRef}>
          <h1>{active.title}</h1>
          {active.converter ? (
            <Converter />
          ) : active.id === "api" ? (
            <ApiReference activeApiId={activeApiId} onOpenEntry={openApiEntry} />
          ) : (
            <Blocks blocks={active.blocks} />
          )}
        </article>
      </main>
      <aside className="toc liquidGL">
        <p>On this page</p>
        {(active.blocks || [])
          .filter((block) => block.type === "h")
          .map((block) => (
            <a
              key={block.text}
              href={`#${slug(block.text)}`}
              onClick={(event) => {
                event.preventDefault();
                scrollToSection(slug(block.text));
              }}
            >
              {block.text}
            </a>
          ))}
        {active.converter && (
          <a
            href="#converter"
            onClick={(event) => {
              event.preventDefault();
              scrollToSection("converter");
            }}
          >
            Converter
          </a>
        )}
      </aside>
    </div>
  );
}

function ApiSidebarTree({ sections, activeApiId, expandedGroups, onToggleGroup, onOpenEntry }) {
  return (
    <div className="api-sidebar-tree">
      {sections.map((section) => (
        <div className="api-sidebar-group" key={section.title}>
          <button
            className="api-sidebar-topic"
            onClick={() => onToggleGroup(section.title)}
            aria-expanded={Boolean(expandedGroups[section.title])}
          >
            <span>{section.title}</span>
            {expandedGroups[section.title] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          {expandedGroups[section.title] && (
            <div className="api-sidebar-children">
              {section.items.map((item) => {
                const entryId = slug(item);
                return (
                  <button
                    key={item}
                    className={entryId === activeApiId ? "active" : ""}
                    onClick={() => onOpenEntry(entryId)}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ApiReference({ activeApiId, onOpenEntry }) {
  const selected = apiEntries.find((entry) => slug(entry.name) === activeApiId) || apiEntries[0];

  return (
    <div className="api-reference">
      <p className="api-reference-intro">
        This reference mirrors LemLib's API layout while documenting the Python package surface. Pick a function or class from the index, then use the focused card for the signature, behavior, methods, and aliases.
      </p>
      <section className="api-focus-card" id={slug(selected.name)} aria-live="polite">
        <div className="api-focus-header">
          <div>
            <span className="api-focus-kicker">Selected Reference</span>
            <h2><code>{selected.name}</code></h2>
          </div>
        </div>
        <pre className="api-signature"><code>{selected.signature}</code></pre>
        <p>{selected.description}</p>
        {selected.members.length > 0 && (
          <dl className="api-detail-list">
            {selected.members.map((member) => (
              <React.Fragment key={member.name}>
                <dt><code>{member.name}</code></dt>
                <dd>{member.text}</dd>
              </React.Fragment>
            ))}
          </dl>
        )}
        {selected.aliases.length > 0 && (
          <p className="api-aliases">
            <strong>Aliases:</strong>{" "}
            {selected.aliases.map((alias, aliasIndex) => (
              <React.Fragment key={alias}>
                <code>{alias}</code>{aliasIndex < selected.aliases.length - 1 ? " " : ""}
              </React.Fragment>
            ))}
          </p>
        )}
      </section>
      <div className="reference-index api-reference-index">
        {apiSections.map((section) => (
          <section key={section.title} id={slug(section.title)}>
            <h3>{section.title}</h3>
            <div className="reference-link-list">
              {section.items.map((item) => {
                const entryId = slug(item);
                return (
                  <button
                    key={item}
                    className={`reference-link ${entryId === slug(selected.name) ? "active" : ""}`}
                    onClick={() => onOpenEntry(entryId)}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function Blocks({ blocks }) {
  return (
    <>
      {blocks.map((block, index) => {
        if (block.type === "p") return <p key={index}>{block.text}</p>;
        if (block.type === "h") return <h2 id={slug(block.text)} key={index}>{block.text}</h2>;
        if (block.type === "code") {
          return (
            <div className="code-wrap" key={index}>
              <span>{block.lang}</span>
              <pre><code>{block.text}</code></pre>
            </div>
          );
        }
        if (block.type === "list") {
          return (
            <ul key={index} className="api-list">
              {block.items.map((item) => <li key={item}><code>{item}</code></li>)}
            </ul>
          );
        }
        if (block.type === "api-index") {
          return (
            <div className="reference-index" key={index}>
              {block.sections.map((section) => (
                <section key={section.title}>
                  <h3>{section.title}</h3>
                  <ul>
                    {section.items.map((item) => (
                      <li key={item}>
                        <a
                          href={`#${slug(item)}`}
                          onClick={(event) => {
                            event.preventDefault();
                            scrollToSection(slug(item));
                          }}
                        >
                          {item}
                        </a>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          );
        }
        if (block.type === "api-entry") {
          return (
            <section className="api-member" id={slug(block.name)} key={block.name}>
              <h3><code>{block.name}</code></h3>
              <pre className="api-signature"><code>{block.signature}</code></pre>
              <p>{block.description}</p>
              {block.members.length > 0 && (
                <dl className="api-detail-list">
                  {block.members.map((member) => (
                    <React.Fragment key={member.name}>
                      <dt><code>{member.name}</code></dt>
                      <dd>{member.text}</dd>
                    </React.Fragment>
                  ))}
                </dl>
              )}
              {block.aliases.length > 0 && (
                <p className="api-aliases">
                  <strong>Aliases:</strong>{" "}
                  {block.aliases.map((alias, aliasIndex) => (
                    <React.Fragment key={alias}>
                      <code>{alias}</code>{aliasIndex < block.aliases.length - 1 ? " " : ""}
                    </React.Fragment>
                  ))}
                </p>
              )}
            </section>
          );
        }
        if (block.type === "callout") {
          return (
            <aside key={index} className={`callout ${block.kind}`}>
              <strong>{block.title}</strong>
              <p>{block.text}</p>
            </aside>
          );
        }
        return null;
      })}
    </>
  );
}

function Converter() {
  const [input, setInput] = useState(samplePath);
  const [name, setName] = useState("auton_path");
  const [error, setError] = useState("");
  const output = useMemo(() => {
    try {
      setError("");
      return toPython(input, name);
    } catch (err) {
      setError(err.message);
      return "";
    }
  }, [input, name]);

  async function copy() {
    await navigator.clipboard?.writeText(output);
  }

  return (
    <section id="converter" className="converter">
      <p>Paste a path.jerryio LemLib v0.5 export and convert it into Python code for <code>Path</code> and <code>Waypoint</code>.</p>
      <label className="field-label">
        Variable name
        <input value={name} onChange={(event) => setName(event.target.value || "path")} />
      </label>
      <div className="converter-grid">
        <label>
          Original LemLib path
          <textarea value={input} onChange={(event) => setInput(event.target.value)} spellCheck="false" />
        </label>
        <label>
          LemLib Python output
          <textarea value={output || error} readOnly spellCheck="false" className={error ? "error" : ""} />
        </label>
      </div>
      <div className="actions">
        <button onClick={() => setInput(samplePath)}>
          <FileCode2 size={16} />
          Load sample
        </button>
        <button onClick={copy} disabled={!output}>
          <Clipboard size={16} />
          Copy Python
        </button>
        <button onClick={() => setInput(input.trim() + (input.includes("endData") ? "" : "\nendData"))}>
          <Play size={16} />
          Normalize
        </button>
      </div>
      {error && <p className="error-message">{error}</p>}
    </section>
  );
}

function toPython(text, variableName) {
  const points = [];
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (!line || line.startsWith("#")) continue;
    if (line === "endData") break;
    const parts = line.split(/\s*,\s*/);
    if (parts.length !== 3) throw new Error(`line ${i + 1}: expected x, y, speed`);
    const nums = parts.map(Number);
    if (nums.some(Number.isNaN)) throw new Error(`line ${i + 1}: waypoint values must be numbers`);
    points.push(nums);
  }
  if (!points.length) throw new Error("no LemLib waypoints found");
  const rows = points.map(([x, y, speed]) => `    Waypoint(${x}, ${y}, ${speed})`).join(",\n");
  return `from lemlib import Path, Waypoint\n\n${variableName} = Path([\n${rows}\n])\n`;
}

function groupPages(items) {
  return items.reduce((groups, page) => {
    groups[page.group] ||= [];
    groups[page.group].push(page);
    return groups;
  }, {});
}

function slug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function scrollToSection(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

createRoot(document.getElementById("root")).render(<App />);
