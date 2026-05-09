import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { Clipboard, FileCode2, Menu, Moon, Play, Sun } from "lucide-react";
import "./styles.css";

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
    blocks: [
      h("Main API"),
      list(["Chassis", "TurnToHeadingParams", "TurnToPointParams", "MoveToPointParams", "MoveToPoseParams", "FollowParams", "DriveSignal"]),
      h("Builder classes"),
      list(["Drivetrain", "OdomSensors", "TrackingWheel", "Omniwheel", "ControllerSettings", "ExitCondition", "DriveCurve", "ExpoDriveCurve"]),
      h("Odometry"),
      list(["Pose", "Vector2D", "TrackingWheelOdometry"]),
      h("Utils"),
      list(["PID", "Gains", "angle_error", "sanitize_angle", "slew", "desaturate", "avg", "ema"]),
      h("Path tools"),
      list(["Waypoint", "Path", "parse_lemlib_path", "convert_lemlib_to_python"]),
    ],
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

function getInitialPage() {
  const hash = window.location.hash.replace("#/", "");
  return pages.some((page) => page.id === hash) ? hash : "index";
}

function App() {
  const [activeId, setActiveId] = useState(getInitialPage);
  const [menuOpen, setMenuOpen] = useState(false);
  const active = pages.find((page) => page.id === activeId) || pages[0];
  const grouped = useMemo(() => groupPages(pages), []);

  useEffect(() => {
    function handleHashChange() {
      setActiveId(getInitialPage());
    }

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  function navigate(id) {
    setActiveId(id);
    window.location.hash = `/${id}`;
    setMenuOpen(false);
  }

  return (
    <div className="app-shell">
      <header className="mobile-topbar">
        <button className="icon-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle contents">
          <Menu size={18} />
        </button>
        <span>LemLib Python documentation</span>
      </header>
      <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
        <div className="brand" onClick={() => navigate("index")}>
          <div className="brand-mark">L</div>
          <div>
            <strong>LemLib Python</strong>
            <span>documentation</span>
          </div>
        </div>
        <nav>
          {Object.entries(grouped).map(([group, groupPages]) => (
            <section key={group} className="nav-section">
              <p>{group}</p>
              {groupPages.map((page) => (
                <button
                  key={page.id}
                  className={page.id === activeId ? "active" : ""}
                  onClick={() => navigate(page.id)}
                >
                  {page.title}
                </button>
              ))}
            </section>
          ))}
        </nav>
      </aside>
      <main className="content-wrap">
        <div className="doc-toolbar">
          <button className="toolbar-button">
            <Sun size={15} />
            Light mode
          </button>
          <button className="toolbar-button">
            <Moon size={15} />
            Auto
          </button>
        </div>
        <article className="doc-article">
          <h1>{active.title}</h1>
          {active.converter ? <Converter /> : <Blocks blocks={active.blocks} />}
        </article>
      </main>
      <aside className="toc">
        <p>On this page</p>
        {(active.blocks || [])
          .filter((block) => block.type === "h")
          .map((block) => (
            <a key={block.text} href={`#${slug(block.text)}`}>{block.text}</a>
          ))}
        {active.converter && <a href="#converter">Converter</a>}
      </aside>
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

createRoot(document.getElementById("root")).render(<App />);
