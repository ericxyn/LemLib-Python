import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { ChevronDown, ChevronRight, Clipboard, FileCode2, Github, Menu, Moon, Play, Sun } from "lucide-react";
import html2canvas from "html2canvas";
import "./styles.css";
import "./liquid.css";

const ASSET_BASE = import.meta.env.BASE_URL;
const ACCUDRIVE_ICON = `${ASSET_BASE}accudrive-logo.png`;
const ACCUDRIVE_BANNER = `${ASSET_BASE}accudrive-banner.png`;

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
      logoBlock(),
      p("Welcome to the documentation for ACCUDRIVE. This site contains everything you need to use or contribute to the Python recreation of LemLib."),
      p("If you are new, start with the introductory tutorials. If you already know what you are doing, jump to the API reference or the LemLib path converter."),
      callout("note", "Port status", "This is an initial hardware-agnostic Python port. The math, path format, and control surfaces are available now; real robot projects should provide motor and sensor adapters for their runtime."),
      code(`from accudrive import chassis, controller_settings, drivetrain, odom_sensors, pose

drive = drivetrain(track_width=10, wheel_diameter=4, rpm=360)
lateral = controller_settings(10, 0, 3, 3, 1, 100, 3, 500, 20)
angular = controller_settings(2, 0, 10, 3, 1, 100, 3, 500, 0)

robot = chassis(drive, lateral, angular, odom_sensors())
robot.set_pose(pose(0, 0, 0))
print(robot.move_to_point(0, 48))`, "python"),
    ],
  },
  {
    id: "about",
    title: "About",
    group: "Home",
    blocks: [
      p("ACCUDRIVE brings LemLib's autonomous-motion ideas into Python for simulation, education, and Python robotics runtimes."),
      p("The project keeps LemLib's familiar concepts: poses, drivetrain settings, pid controllers, odometry sensors, driver-control curves, angular motions, lateral motions, pure pursuit, and motion chaining."),
      p("The package does not assume one hardware platform. Motor groups can be plain callables or objects with move and brake methods, which keeps the core easy to test."),
    ],
  },
  {
    id: "download",
    title: "Download",
    group: "Home",
    blocks: [
      p("Install the package from a local checkout while the project is in alpha."),
      code(`git clone https://github.com/ericxyn/accudrive.git
cd accudrive
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
    p("Create a Python project and install ACCUDRIVE in editable mode. Editable installs are useful while the package is still young because examples and tests can run against your local source tree."),
    code(`python -m venv .venv
.venv\\Scripts\\activate
python -m pip install -e .`, "bash"),
    h("First import"),
    p("The Python package uses lower_snake_case for public functions and variables."),
    code(`from accudrive import chassis, controller_settings, drivetrain, odom_sensors, pose`, "python"),
    h("Project shape"),
    p("A normal project has a robot configuration module, an autonomous module, and optional path files exported from path.jerryio."),
    code(`robot/
  config.py
  autonomous.py
  paths/
    skills.txt`, "text"),
    h("Next step"),
    p("Once the package imports, configure your drivetrain, sensors, and pid settings."),
  ]),
  tutorial("2 - Configuration", "2_configuration", [
    h("Introduction"),
    p("Configuration tells ACCUDRIVE what your drivetrain looks like, what sensor sources exist, and which pid settings to use."),
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
    h("drivetrain"),
    code(`from accudrive import drivetrain, omniwheel

left_motors = MotorGroup("left")
right_motors = MotorGroup("right")

drive = drivetrain(
    left_motors=left_motors,
    right_motors=right_motors,
    track_width=10,
    wheel_diameter=omniwheel.new_4,
    rpm=360,
    horizontal_drift=2,
)`, "python"),
    h("Odometry sensors"),
    p("Use odom_sensors to keep the same shape as LemLib. The initial port does not require real hardware objects; pass adapters when your runtime has them."),
    code(`from accudrive import odom_sensors

sensors = odom_sensors(
    vertical_1=None,
    vertical_2=None,
    horizontal_1=None,
    horizontal_2=None,
    imu=None,
)`, "python"),
    h("pid settings"),
    code(`from accudrive import controller_settings

lateral_controller = controller_settings(10, 0, 3, 3, 1, 100, 3, 500, 20)
angular_controller = controller_settings(2, 0, 10, 3, 1, 100, 3, 500, 0)`, "python"),
    h("chassis"),
    code(`from accudrive import chassis

robot = chassis(drive, lateral_controller, angular_controller, sensors)
robot.calibrate()
print(robot.get_pose())`, "python"),
  ]),
  tutorial("3 - Driver Control", "3_driver_control", [
    h("Introduction"),
    p("Driver control maps joystick values to left and right drivetrain outputs. Inputs normally range from -127 to 127."),
    h("Tank drive"),
    code(`def driver_loop(left_y, right_y):
    robot.tank(left_y, right_y)`, "python"),
    h("Arcade drive"),
    code(`def driver_loop(left_y, right_x):
    robot.arcade(left_y, right_x)`, "python"),
    h("Curvature drive"),
    p("Curvature drive uses throttle and a turn curve. It behaves like an arc at speed and feels smoother than simple arcade for many drivers."),
    code(`def driver_loop(left_y, right_x):
    robot.curvature(left_y, right_x)`, "python"),
    h("Input scaling"),
    p("expo_drive_curve makes small joystick movements softer while preserving full output near the end of travel."),
    code(`from accudrive import expo_drive_curve

throttle_curve = expo_drive_curve(deadband=3, minimum_output=10, curve_gain=1.019)
steer_curve = expo_drive_curve(deadband=3, minimum_output=10, curve_gain=1.019)

robot = chassis(drive, lateral_controller, angular_controller, sensors, throttle_curve, steer_curve)`, "python"),
  ]),
  tutorial("4 - pid tuning", "4_pid_tuning", [
    h("Introduction"),
    p("ACCUDRIVE uses one lateral pid and one angular pid. The tuning order is the same as LemLib: start with kp and kd, add ki only when needed, then tune slew and exit conditions."),
    h("angular pid"),
    code(`angular_controller = controller_settings(
    2,  # kp
    0,  # ki
    10, # kd
    3,  # windup range
    1, 100,
    3, 500,
    0,
)`, "python"),
    p("Test angular tuning with a heading step. Increase kp until the turn reaches the target quickly, then increase kd until oscillation is controlled."),
    code(`robot.set_pose(pose(0, 0, 0))
signal = robot.turn_to_heading(90)
print(signal)`, "python"),
    h("lateral pid"),
    code(`lateral_controller = controller_settings(10, 0, 3, 3, 1, 100, 3, 500, 20)
robot.set_pose(pose(0, 0, 0))
print(robot.move_to_point(0, 48))`, "python"),
    h("ki and windup"),
    p("Use ki only for steady-state error that kp and kd cannot reasonably remove. Keep a windup range so the integral only accumulates near the target."),
    h("Slew"),
    p("Slew limits acceleration. It is helpful when a simulated or physical drivetrain slips, tips, or saturates too aggressively."),
    h("Exit conditions"),
    p("controller_settings stores small and large error windows with timeouts. Those values are available to motion code and tests through exit_condition.from_settings."),
  ]),
  tutorial("5 - Angular Motions", "5_angular_motion", [
    h("Turn to heading"),
    p("turn_to_heading rotates the robot to an absolute field heading."),
    code(`robot.set_pose(pose(0, 0, 0))
robot.turn_to_heading(270)`, "python"),
    h("Turn to point"),
    p("turn_to_point calculates the heading from the current pose to a field coordinate."),
    code(`robot.turn_to_point(53, 53)`, "python"),
    h("Swing to heading"),
    p("Swing turns lock one side of the drivetrain and move the other side."),
    code(`robot.swing_to_heading(45)`, "python"),
    h("Swing to point"),
    code(`robot.swing_to_point(53, 53)`, "python"),
  ]),
  tutorial("6 - Lateral Motion", "6_lateral_motion", [
    h("Move to point"),
    p("move_to_point drives to an x/y coordinate while turning toward the target point."),
    code(`robot.move_to_point(10, 10)`, "python"),
    h("Backwards movement"),
    code(`from accudrive import move_to_point_params

robot.move_to_point(20, 15, params=move_to_point_params(forwards=False))`, "python"),
    h("Move to pose"),
    p("move_to_pose uses a boomerang-style carrot point so the chassis can finish with a chosen heading."),
    code(`robot.move_to_pose(10, 10, 90)`, "python"),
    h("Lead and horizontal drift"),
    code(`from accudrive import move_to_pose_params

params = move_to_pose_params(lead=0.3, horizontal_drift=8)
robot.move_to_pose(0, 0, 0, params=params)`, "python"),
  ]),
  tutorial("7 - Pure Pursuit", "7_pure_pursuit", [
    h("What is pure pursuit?"),
    p("Pure pursuit follows a path by selecting a lookahead point ahead of the robot and driving toward the arc that reaches it."),
    h("Creating paths"),
    p("Use path.jerryio.com and export the original LemLib v0.5 format. It is a text file with one waypoint per line: x, y, speed, followed by endData."),
    code(samplePath, "text"),
    h("Load and follow"),
    code(`from pathlib import Path as file_path
from accudrive import parse_lemlib_path

auton_path = parse_lemlib_path(file_path("paths/skills.txt").read_text())
robot.follow(auton_path, lookahead_distance=15)`, "python"),
    h("Converter"),
    p("The converter page turns the same LemLib text export into Python path and waypoint code."),
  ]),
  tutorial("8 - Motion Chaining", "8_motion_chaining", [
    h("Introduction"),
    p("Motion chaining keeps the robot moving between commands. In Python, use minimum speeds, early-exit ranges, and explicit cancellation when a custom condition has been met."),
    h("Minimum speed"),
    code(`from accudrive import move_to_point_params, move_to_pose_params, swing_params

first_leg = move_to_pose_params(min_lateral_speed=72, early_exit_range=8)
robot.move_to_pose(48, -24, 90, params=first_leg)
robot.move_to_pose(64, 3, 0)`, "python"),
    h("Motion cancellation"),
    code(`signal = robot.move_to_point(0, 24, params=move_to_point_params(min_lateral_speed=48))
if ball_detected():
    robot.cancel_motion()`, "python"),
    h("Turning into a chain"),
    code(`turn = swing_params(min_speed=127, early_exit_range=20)
robot.swing_to_heading(90, params=turn)
robot.move_to_pose(120, 10, 0)`, "python"),
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

function logoBlock() {
  return { type: "logo" };
}

function tutorial(title, id, blocks) {
  return { id, title, group: "Tutorials", blocks };
}

function apiReferenceBlocks() {
  const driveSignalReturn = "drive_signal with left, right, lateral, and angular outputs";
  const motionTiming = [
    param("timeout", "float | none", "none", "Maximum time budget for the motion step. The hardware-agnostic port stores the value for API parity; callers can enforce it in their robot loop."),
    param("dt", "float", "0.01", "Controller timestep in seconds. Smaller values make derivative calculations more sensitive; use your loop period when simulating."),
  ];
  const turnParams = [
    param("max_speed", "float", "127.0", "Largest angular output allowed."),
    param("min_speed", "float", "0.0", "Minimum angular output when the controller asks for a non-zero turn."),
    param("slew", "float", "0.0", "Maximum output change rate. Zero disables slew limiting."),
    param("early_exit_range", "float", "0.0", "Heading-error window where a caller may chain into the next motion early."),
  ];
  const pointMotionParams = [
    param("x", "float", "required", "Target x coordinate in field units."),
    param("y", "float", "required", "Target y coordinate in field units."),
    ...motionTiming,
  ];

  return [
    p("This reference mirrors LemLib's API layout while documenting the Python package surface. Public functions and variables use lower_snake_case names."),
    apiIndex([
      {
        title: "main api",
        items: [
          "chassis",
          "set_pose",
          "get_pose",
          "tank",
          "arcade",
          "curvature",
          "turn_to_heading",
          "turn_to_point",
          "swing_to_heading",
          "swing_to_point",
          "move_to_point",
          "move_to_pose",
          "follow",
          "cancel_motion",
          "cancel_all_motions",
          "is_in_motion",
          "brake",
        ],
      },
      {
        title: "parameters and data",
        items: [
          "drive_signal",
          "turn_to_heading_params",
          "turn_to_point_params",
          "swing_params",
          "move_to_point_params",
          "move_to_pose_params",
          "follow_params",
          "drivetrain",
          "odom_sensors",
          "controller_settings",
          "exit_condition",
          "drive_curve",
          "expo_drive_curve",
          "omniwheel",
        ],
      },
      {
        title: "odometry and geometry",
        items: ["vector_2d", "pose", "tracking_wheel", "tracking_wheel_odometry"],
      },
      {
        title: "paths",
        items: ["waypoint", "path", "parse_lemlib_path", "convert_lemlib_to_accudrive"],
      },
      {
        title: "pid and utils",
        items: [
          "gains",
          "pid",
          "angular_direction",
          "slew_direction",
          "drive_outputs",
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
    apiEntry("chassis", "chassis(drivetrain, lateral_settings, angular_settings, sensors=None, throttle_curve=None, steer_curve=None, pose=None)", "Hardware-agnostic tank-drive facade for driver control, pose storage, and autonomous motion calculations.", [
      param("drivetrain", "drivetrain", "required", "drivetrain geometry and motor adapters."),
      param("lateral_settings", "controller_settings", "required", "pid and exit settings for forward/backward motion."),
      param("angular_settings", "controller_settings", "required", "pid and exit settings for turns."),
      param("sensors", "odom_sensors | none", "none", "Optional tracking-wheel and IMU adapters."),
      param("throttle_curve", "drive_curve | none", "none", "Optional driver throttle shaping curve."),
      param("steer_curve", "drive_curve | none", "none", "Optional driver steering shaping curve."),
      param("pose", "pose | none", "none", "Initial field pose."),
    ], "chassis instance"),
    apiEntry("set_pose", "set_pose(pose_or_x, y=None, theta=None)", "Stores the current robot pose.", [param("pose_or_x", "pose | float", "required", "Either a pose object or the x coordinate."), param("y", "float | none", "none", "Y coordinate when setting pose from numbers."), param("theta", "float | none", "none", "Heading in degrees when setting pose from numbers.")], "none"),
    apiEntry("get_pose", "get_pose()", "Returns the current robot pose.", [], "pose"),
    apiEntry("tank", "tank(left, right, curve=True)", "Applies tank-drive output, optionally using the throttle curve.", [param("left", "float", "required", "Left drivetrain command."), param("right", "float", "required", "Right drivetrain command."), param("curve", "bool", "true", "Whether to pass both values through the throttle curve.")], driveSignalReturn),
    apiEntry("arcade", "arcade(throttle, steer, reverse=False, steer_priority=0.5)", "Mixes throttle and steering into left/right outputs.", [param("throttle", "float", "required", "Forward/backward joystick input."), param("steer", "float", "required", "Turning joystick input."), param("reverse", "bool", "false", "Invert throttle before mixing."), param("steer_priority", "float", "0.5", "Blend factor from 0 to 1 that reserves output headroom for steering.")], driveSignalReturn),
    apiEntry("curvature", "curvature(throttle, curve, reverse=False)", "Curvature-drive helper where turn output scales with throttle magnitude.", [param("throttle", "float", "required", "Forward/backward input."), param("curve", "float", "required", "Curvature or steering input."), param("reverse", "bool", "false", "Invert throttle before applying curvature.")], driveSignalReturn),
    apiEntry("turn_to_heading", "turn_to_heading(heading, timeout=None, params=None, dt=0.01)", "Calculates one angular PID step toward an absolute field heading.", [param("heading", "float", "required", "Target heading in degrees."), param("params", "turn_to_heading_params | none", "none", "Turn speed, slew, and early-exit options."), ...motionTiming], driveSignalReturn),
    apiEntry("turn_to_point", "turn_to_point(x, y, timeout=None, params=None, dt=0.01)", "Turns toward a field coordinate.", [...pointMotionParams, param("params", "turn_to_point_params | none", "none", "Turn options plus whether the robot should face the point forwards or backwards.")], driveSignalReturn),
    apiEntry("swing_to_heading", "swing_to_heading(heading, timeout=None, params=None, dt=0.01)", "Turns while one drivetrain side is locked.", [param("heading", "float", "required", "Target heading in degrees."), param("params", "swing_params | none", "none", "Turn limits and locked-side selection."), ...motionTiming], driveSignalReturn),
    apiEntry("swing_to_point", "swing_to_point(x, y, timeout=None, params=None, dt=0.01)", "Swing-turns toward a field coordinate.", [...pointMotionParams, param("params", "swing_params | none", "none", "Turn limits and locked-side selection.")], driveSignalReturn),
    apiEntry("move_to_point", "move_to_point(x, y, timeout=None, params=None, dt=0.01)", "Runs a lateral and angular control step toward a point.", [...pointMotionParams, param("params", "move_to_point_params | none", "none", "Direction, speed caps, slew limits, and early-exit options.")], driveSignalReturn),
    apiEntry("move_to_pose", "move_to_pose(x, y, theta, timeout=None, params=None, dt=0.01)", "Runs a boomerang-style motion toward a target pose.", [...pointMotionParams, param("theta", "float", "required", "Desired final heading in degrees."), param("params", "move_to_pose_params | none", "none", "Point-motion options plus lead and horizontal drift tuning.")], driveSignalReturn),
    apiEntry("follow", "follow(path, lookahead_distance, timeout=None, params=None, dt=0.01)", "Follows a LemLib path using pure-pursuit lookahead.", [param("path", "str | path", "required", "Path text or a parsed path object."), param("lookahead_distance", "float", "required", "Distance ahead of the robot used to choose the carrot point."), param("params", "follow_params | none", "none", "Direction and lateral slew options."), ...motionTiming], driveSignalReturn),
    apiEntry("cancel_motion", "cancel_motion()", "Stops the current motion by braking the drivetrain adapters.", [], "none"),
    apiEntry("cancel_all_motions", "cancel_all_motions()", "Stops all chassis motion. In this port it is the same operation as cancel_motion().", [], "none"),
    apiEntry("is_in_motion", "is_in_motion()", "Returns whether the last commanded signal is non-zero.", [], "bool"),
    apiEntry("brake", "brake()", "Calls brake() on motor adapters that provide it and clears last_signal.", [], "none"),
    apiEntry("drive_signal", "drive_signal(left, right, lateral=0.0, angular=0.0)", "Return value for drivetrain commands.", [param("left", "float", "required", "Left drivetrain output."), param("right", "float", "required", "Right drivetrain output."), param("lateral", "float", "0.0", "Forward/backward component before drivetrain mixing."), param("angular", "float", "0.0", "Turning component before drivetrain mixing.")], "data object"),
    apiEntry("turn_to_heading_params", "turn_to_heading_params(max_speed=127.0, min_speed=0.0, slew=0.0, early_exit_range=0.0)", "Parameters for turn_to_heading.", turnParams, "parameter object"),
    apiEntry("turn_to_point_params", "turn_to_point_params(max_speed=127.0, min_speed=0.0, slew=0.0, early_exit_range=0.0, forwards=True)", "Parameters for turn_to_point.", [...turnParams, param("forwards", "bool", "true", "Whether the robot should turn to face the point with its front side.")], "parameter object"),
    apiEntry("swing_params", "swing_params(max_speed=127.0, min_speed=0.0, slew=0.0, early_exit_range=0.0, locked_side='left')", "Parameters for swing_to_heading and swing_to_point.", [...turnParams, param("locked_side", "str", "'left'", "The drivetrain side held at zero output. Use 'left' or 'right'.")], "parameter object"),
    apiEntry("move_to_point_params", "move_to_point_params(forwards=True, max_lateral_speed=127.0, min_lateral_speed=0.0, max_angular_speed=127.0, lateral_slew=0.0, angular_slew=0.0, early_exit_range=0.0)", "Parameters for move_to_point.", [param("forwards", "bool", "true", "Drive toward the point with the front of the robot."), param("max_lateral_speed", "float", "127.0", "Maximum forward/backward output."), param("min_lateral_speed", "float", "0.0", "Minimum non-zero lateral output."), param("max_angular_speed", "float", "127.0", "Maximum turning output."), param("lateral_slew", "float", "0.0", "Rate limit for lateral output."), param("angular_slew", "float", "0.0", "Rate limit for angular output."), param("early_exit_range", "float", "0.0", "Distance window where a caller may chain into the next motion early.")], "parameter object"),
    apiEntry("move_to_pose_params", "move_to_pose_params(..., lead=0.6, horizontal_drift=None)", "Parameters for move_to_pose.", [param("forwards", "bool", "true", "Drive toward the pose with the front of the robot."), param("max_lateral_speed", "float", "127.0", "Maximum forward/backward output."), param("min_lateral_speed", "float", "0.0", "Minimum non-zero lateral output."), param("max_angular_speed", "float", "127.0", "Maximum turning output."), param("lateral_slew", "float", "0.0", "Rate limit for lateral output."), param("angular_slew", "float", "0.0", "Rate limit for angular output."), param("early_exit_range", "float", "0.0", "Distance window where a caller may chain into the next motion early."), param("lead", "float", "0.6", "How far the boomerang carrot point leads the target pose."), param("horizontal_drift", "float | none", "none", "Drift constant used to limit slip speed through curves.")], "parameter object"),
    apiEntry("follow_params", "follow_params(forwards=True, lateral_slew=0.0)", "Parameters for follow.", [param("forwards", "bool", "true", "Follow the path with the front of the robot."), param("lateral_slew", "float", "0.0", "Rate limit applied to path-following velocity.")], "parameter object"),
    apiEntry("drivetrain", "drivetrain(left_motors=None, right_motors=None, track_width=0.0, wheel_diameter=omniwheel.new_4, rpm=360.0, horizontal_drift=2.0)", "Stores tank-drive geometry and motor adapters.", [param("left_motors", "object | callable | none", "none", "Adapter for the left motors."), param("right_motors", "object | callable | none", "none", "Adapter for the right motors."), param("track_width", "float", "0.0", "Distance between left and right wheel contact lines."), param("wheel_diameter", "float | omniwheel", "omniwheel.new_4", "Drive wheel diameter."), param("rpm", "float", "360.0", "Drive motor rpm."), param("horizontal_drift", "float", "2.0", "Slip/drift tuning constant for curved pose motions.")], "configuration object"),
    apiEntry("odom_sensors", "odom_sensors(vertical_1=None, vertical_2=None, horizontal_1=None, horizontal_2=None, imu=None)", "Container for odometry sensor adapters.", [param("vertical_1", "object | none", "none", "Primary vertical tracking sensor."), param("vertical_2", "object | none", "none", "Secondary vertical tracking sensor."), param("horizontal_1", "object | none", "none", "Primary horizontal tracking sensor."), param("horizontal_2", "object | none", "none", "Secondary horizontal tracking sensor."), param("imu", "object | none", "none", "Heading sensor adapter.")], "configuration object"),
    apiEntry("controller_settings", "controller_settings(kp, ki, kd, windup_range=0.0, small_error=0.0, small_timeout=0.0, large_error=0.0, large_timeout=0.0, slew=0.0)", "PID and exit-condition configuration.", [param("kp", "float", "required", "Proportional gain."), param("ki", "float", "required", "Integral gain."), param("kd", "float", "required", "Derivative gain."), param("windup_range", "float", "0.0", "Error range where integral is allowed to accumulate."), param("small_error", "float", "0.0", "Tight settling error threshold."), param("small_timeout", "float", "0.0", "Time in milliseconds required inside small_error."), param("large_error", "float", "0.0", "Loose settling error threshold."), param("large_timeout", "float", "0.0", "Time in milliseconds required inside large_error."), param("slew", "float", "0.0", "Default slew rate for motions using this controller.")], "configuration object"),
    apiEntry("exit_condition", "exit_condition(small_error=0.0, small_timeout=0.0, large_error=0.0, large_timeout=0.0)", "Tracks small-error and large-error settling windows.", [param("small_error", "float", "0.0", "Tight settling error threshold."), param("small_timeout", "float", "0.0", "Seconds required inside small_error."), param("large_error", "float", "0.0", "Loose settling error threshold."), param("large_timeout", "float", "0.0", "Seconds required inside large_error.")], "configuration object"),
    apiEntry("drive_curve", "drive_curve().curve(value)", "Base driver-control curve. The default curve returns the input unchanged.", [param("value", "float", "required", "Raw joystick value.")], "float"),
    apiEntry("expo_drive_curve", "expo_drive_curve(deadband=3.0, minimum_output=10.0, curve_gain=1.019, maximum_input=127.0)", "Exponential joystick curve with deadband and minimum output.", [param("deadband", "float", "3.0", "Input magnitude treated as zero."), param("minimum_output", "float", "10.0", "Output after leaving the deadband."), param("curve_gain", "float", "1.019", "Exponent base controlling curve strength."), param("maximum_input", "float", "127.0", "Largest joystick input magnitude.")], "drive_curve"),
    apiEntry("omniwheel", "omniwheel.new_2 | new_275 | old_275 | new_325 | old_325 | new_4 | old_4", "Wheel diameter presets matching common VEX omniwheels.", [], "enum"),
    apiEntry("vector_2d", "vector_2d(x=0.0, y=0.0)", "2D point or displacement in field units.", [param("x", "float", "0.0", "Field x coordinate."), param("y", "float", "0.0", "Field y coordinate.")], "data object"),
    apiEntry("pose", "pose(x=0.0, y=0.0, theta=0.0)", "Robot pose with position and heading.", [param("x", "float", "0.0", "Field x coordinate."), param("y", "float", "0.0", "Field y coordinate."), param("theta", "float", "0.0", "Heading in degrees.")], "data object"),
    apiEntry("tracking_wheel", "tracking_wheel(diameter, offset, ratio=1.0, last_total=0.0)", "Converts encoder degrees into tracking-wheel travel.", [param("diameter", "float", "required", "Wheel diameter."), param("offset", "float", "required", "Tracking wheel offset from tracking center."), param("ratio", "float", "1.0", "Gear ratio from encoder to wheel."), param("last_total", "float", "0.0", "Stored distance total for delta calculations.")], "tracking wheel object"),
    apiEntry("tracking_wheel_odometry", "tracking_wheel_odometry(pose=None)", "Tracking-wheel odometry update math.", [param("pose", "pose | none", "none", "Initial pose.")], "odometry object"),
    apiEntry("waypoint", "waypoint(x, y, speed)", "One point from a path.jerryio LemLib export.", [param("x", "float", "required", "Waypoint x coordinate."), param("y", "float", "required", "Waypoint y coordinate."), param("speed", "float", "required", "Target path speed at the waypoint.")], "data object"),
    apiEntry("path", "path([waypoint(...), ...])", "List-like path object with export helpers.", [param("waypoints", "list[waypoint]", "required", "Ordered path waypoints.")], "path object"),
    apiEntry("parse_lemlib_path", "parse_lemlib_path(text)", "Parses path.jerryio's LemLib v0.5 text export.", [param("text", "str", "required", "Text containing x, y, speed lines ending at endData.")], "path"),
    apiEntry("convert_lemlib_to_accudrive", "convert_lemlib_to_accudrive(text, variable_name='path')", "Converts LemLib path text into ACCUDRIVE path and waypoint code.", [param("text", "str", "required", "LemLib path export text."), param("variable_name", "str", "'path'", "Python variable name for the generated code.")], "str"),
    apiEntry("gains", "gains(kp=0.0, ki=0.0, kd=0.0)", "PID gain container.", [param("kp", "float", "0.0", "Proportional gain."), param("ki", "float", "0.0", "Integral gain."), param("kd", "float", "0.0", "Derivative gain.")], "data object"),
    apiEntry("pid", "pid(kp, ki=0.0, kd=0.0, windup_range=0.0, sign_flip_reset=False)", "pid controller compatible with LemLib's control style.", [param("kp", "float | gains", "required", "Proportional gain or a gains object."), param("ki", "float", "0.0", "Integral gain."), param("kd", "float", "0.0", "Derivative gain."), param("windup_range", "float", "0.0", "Error range where integral is allowed to accumulate."), param("sign_flip_reset", "bool", "false", "Reset integral when error changes sign.")], "pid object"),
    apiEntry("angular_direction", "angular_direction.cw_clockwise | angular_direction.ccw_counterclockwise", "Optional direction constraint for angle_error.", [], "enum"),
    apiEntry("slew_direction", "slew_direction.increasing | slew_direction.decreasing | slew_direction.all", "Optional direction constraint for slew.", [], "enum"),
    apiEntry("drive_outputs", "drive_outputs(left, right)", "Normalized left/right output pair returned by desaturate.", [param("left", "float", "required", "Left normalized output."), param("right", "float", "required", "Right normalized output.")], "data object"),
    apiEntry("deg_to_rad", "deg_to_rad(deg)", "Converts degrees to radians.", [param("deg", "float", "required", "Angle in degrees.")], "float"),
    apiEntry("rad_to_deg", "rad_to_deg(rad)", "Converts radians to degrees.", [param("rad", "float", "required", "Angle in radians.")], "float"),
    apiEntry("sanitize_angle", "sanitize_angle(angle)", "Wraps an angle to [0, 360).", [param("angle", "float", "required", "Angle in degrees.")], "float"),
    apiEntry("angle_error", "angle_error(target, position, direction=None)", "Returns target-position heading error in degrees.", [param("target", "float", "required", "Target heading in degrees."), param("position", "float", "required", "Current heading in degrees."), param("direction", "angular_direction | none", "none", "Optional forced turn direction.")], "float"),
    apiEntry("slew", "slew(target, current, max_change_rate, delta_time=1.0, direction_limit=slew_direction.all)", "Constrains value change over time.", [param("target", "float", "required", "Desired value."), param("current", "float", "required", "Current value."), param("max_change_rate", "float", "required", "Maximum change per second."), param("delta_time", "float", "1.0", "Elapsed time in seconds."), param("direction_limit", "slew_direction", "slew_direction.all", "Which direction to limit.")], "float"),
    apiEntry("constrain_power", "constrain_power(power, maximum, minimum=0)", "Applies signed minimum and absolute maximum output limits.", [param("power", "float", "required", "Requested output."), param("maximum", "float", "required", "Largest allowed magnitude."), param("minimum", "float", "0", "Smallest non-zero magnitude.")], "float"),
    apiEntry("desaturate", "desaturate(lateral_output, angular_output)", "Combines lateral and angular outputs into normalized left/right outputs.", [param("lateral_output", "float", "required", "Forward/backward component."), param("angular_output", "float", "required", "Turning component.")], "drive_outputs"),
    apiEntry("get_signed_tangent_arc_curvature", "get_signed_tangent_arc_curvature(start, end)", "Returns signed curvature for an arc tangent to a starting pose and ending at a point.", [param("start", "pose", "required", "Starting pose."), param("end", "vector_2d", "required", "Ending point.")], "float"),
    apiEntry("avg", "avg(*values)", "Returns the arithmetic mean. A single iterable is accepted.", [param("values", "float | iterable", "required", "Values to average.")], "float"),
    apiEntry("ema", "ema(previous, current, alpha)", "Returns an exponential moving average.", [param("previous", "float", "required", "Previous filtered value."), param("current", "float", "required", "Current sample."), param("alpha", "float", "required", "Blend factor from 0 to 1.")], "float"),
  ];
}

function apiIndex(sections) {
  return { type: "api-index", sections };
}

function apiEntry(name, signature, description, parameters = [], returns = "", notes = []) {
  return { type: "api-entry", name, signature, description, parameters, returns, notes };
}

function param(name, type, defaultValue, text) {
  return { name, type, defaultValue, text };
}

const apiSections = apiReferenceBlocks().find((block) => block.type === "api-index").sections;
const apiEntries = apiReferenceBlocks().filter((block) => block.type === "api-entry");
const defaultApiId = slug(apiSections[0].items[0]);

function getInitialPage() {
  const hash = window.location.hash.replace("#/", "");
  return pages.some((page) => page.id === hash) ? hash : "index";
}

const LIQUID_GL_SRC = "https://cdn.jsdelivr.net/gh/naughtyduk/liquidGL@main/scripts/liquidGL.js";
const GITHUB_URL = "https://github.com/ericxyn/accudrive";

function App() {
  const [activeId, setActiveId] = useState(getInitialPage);
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem("accudrive-theme") || "light");
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
      if (window.__accudriveLiquidScriptPromise) return window.__accudriveLiquidScriptPromise;

      window.__accudriveLiquidScriptPromise = new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = LIQUID_GL_SRC;
        script.async = true;
        script.dataset.liquidglScript = "true";
        script.onload = resolve;
        script.onerror = () => reject(new Error("liquidGL failed to load"));
        document.body.appendChild(script);
      });

      return window.__accudriveLiquidScriptPromise;
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

      if (window.__accudriveLiquidGlass) {
        refreshLiquidGlass();
        return;
      }

      window.__accudriveLiquidGlass = window.liquidGL({
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
    localStorage.setItem("accudrive-theme", theme);

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
        <span>ACCUDRIVE documentation</span>
      </header>
      <aside className={`sidebar liquidGL ${menuOpen ? "open" : ""}`}>
        <div className="brand" onClick={() => navigate("index")}>
          <img className="brand-mark" src={ACCUDRIVE_ICON} alt="" aria-hidden="true" />
          <div>
            <strong>ACCUDRIVE</strong>
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
        {active.id === "api" ? (
          <>
            <button className="toc-title-button" onClick={scrollArticleTop}>
              API Reference
            </button>
            <ApiSidebarTree
              sections={apiSections}
              activeApiId={activeApiId}
              expandedGroups={expandedApiGroups}
              onToggleGroup={toggleApiGroup}
              onOpenEntry={openApiEntry}
            />
          </>
        ) : (
          <>
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
          </>
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
        This reference mirrors LemLib's API layout while documenting the Python package surface. Pick any function, parameter object, or data object to expand a full card with parameter detail.
      </p>
      <section className="api-focus-card" id={slug(selected.name)} aria-live="polite">
        <div className="api-focus-header">
          <div>
            <span className="api-focus-kicker">Selected Reference</span>
            <h2><code>{selected.name}</code></h2>
          </div>
          {selected.returns && <span className="api-return-badge">returns {selected.returns}</span>}
        </div>
        <pre className="api-signature"><code>{selected.signature}</code></pre>
        <div className="api-detail-grid">
          <section className="api-detail-summary">
            <h3>what it does</h3>
            <p>{selected.description}</p>
          </section>
          <section className="api-detail-params">
            <h3>parameters</h3>
            {selected.parameters.length > 0 ? (
              <div className="api-param-grid">
                {selected.parameters.map((parameter) => (
                  <article className="api-param-card" key={parameter.name}>
                    <div>
                      <code>{parameter.name}</code>
                      <span>{parameter.type}</span>
                    </div>
                    <p>{parameter.text}</p>
                    <small>default: <code>{parameter.defaultValue}</code></small>
                  </article>
                ))}
              </div>
            ) : (
              <p>No parameters.</p>
            )}
          </section>
        </div>
        {selected.notes.length > 0 && (
          <section className="api-detail-notes">
            <h3>notes</h3>
            <ul>
              {selected.notes.map((note) => <li key={note}>{note}</li>)}
            </ul>
          </section>
        )}
      </section>
      <div className="reference-index api-reference-index">
        {apiSections.map((section) => (
          <section key={section.title} id={slug(section.title)}>
            <h3>{section.title}</h3>
            <div className="reference-link-list">
              {section.items.map((item) => {
                const entryId = slug(item);
                const entry = apiEntries.find((candidate) => slug(candidate.name) === entryId);
                return (
                  <button
                    key={item}
                    className={`reference-link ${entryId === slug(selected.name) ? "active" : ""}`}
                    onClick={() => onOpenEntry(entryId)}
                  >
                    <span>{item}</span>
                    {entry && <code>{compactSignature(entry)}</code>}
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

function compactSignature(entry) {
  const start = entry.signature.indexOf("(");
  const end = entry.signature.lastIndexOf(")");
  if (start === -1 || end === -1 || end < start) return entry.signature;
  return entry.signature.slice(start + 1, end) || "no parameters";
}

function Blocks({ blocks }) {
  return (
    <>
      {blocks.map((block, index) => {
        if (block.type === "p") return <p key={index}>{block.text}</p>;
        if (block.type === "logo") {
          return (
            <figure className="home-logo-panel" key={index}>
              <img src={ACCUDRIVE_BANNER} alt="ACCUDRIVE logo" className="home-logo" />
            </figure>
          );
        }
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
              {block.parameters.length > 0 && (
                <dl className="api-detail-list">
                  {block.parameters.map((parameter) => (
                    <React.Fragment key={parameter.name}>
                      <dt><code>{parameter.name}</code></dt>
                      <dd>{parameter.text}</dd>
                    </React.Fragment>
                  ))}
                </dl>
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
      <p>Paste a path.jerryio LemLib v0.5 export and convert it into Python code for <code>path</code> and <code>waypoint</code>.</p>
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
          ACCUDRIVE output
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
  const rows = points.map(([x, y, speed]) => `    waypoint(${x}, ${y}, ${speed})`).join(",\n");
  return `from accudrive import path, waypoint\n\n${variableName} = path([\n${rows}\n])\n`;
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
