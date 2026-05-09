# LemLib Python

LemLib Python is an early Python recreation of [LemLib](https://github.com/LemLib/LemLib): PID, odometry math, tank-drive motion helpers, driver control curves, pure pursuit path utilities, and a path.jerryio LemLib-format converter.

This repository is intentionally hardware-agnostic. It exposes the math and control surfaces in Python and lets robot projects provide motor/sensor adapters. That makes it useful for simulation, teaching, testing autonomous routines, and porting LemLib-style snippets before wiring them to a Python robotics runtime.

## What is included

- `PID`, `ControllerSettings`, and exit-condition helpers
- `Pose`, `Vector2D`, angle math, slew limiting, desaturation, and tangent-arc curvature
- `Drivetrain`, `TrackingWheel`, and `TrackingWheelOdometry`
- `Chassis` driver helpers: `tank`, `arcade`, `curvature`
- `Chassis` motion helpers: `turn_to_heading`, `turn_to_point`, `move_to_point`, `move_to_pose`, and `follow`
- LemLib path parsing plus Python conversion for path.jerryio exports
- A docs-style website with all eight original tutorial topics adapted to Python

## Install locally

```bash
python -m pip install -e .
```

## Quick example

```python
from lemlib import Chassis, ControllerSettings, Drivetrain, OdomSensors, Pose

drivetrain = Drivetrain(track_width=10, wheel_diameter=4, rpm=360, horizontal_drift=2)
lateral = ControllerSettings(kp=10, ki=0, kd=3, windup_range=3)
angular = ControllerSettings(kp=2, ki=0, kd=10, windup_range=3)

chassis = Chassis(drivetrain, lateral, angular, OdomSensors())
chassis.set_pose(Pose(0, 0, 0))

signal = chassis.move_to_point(0, 48)
print(signal.left, signal.right)
```

## Convert a path.jerryio LemLib path

```python
from lemlib.paths import convert_lemlib_to_python

path_text = """0, 0, 80
12, 18, 90
24, 24, 0
endData
"""

print(convert_lemlib_to_python(path_text, variable_name="auton_path"))
```

## Website

The web app lives in `website/`.

```bash
cd website
npm install
npm run dev
```

It recreates the LemLib documentation structure in a Furo/Read the Docs-like light UI with accent color `#73CCFF`, includes all 8 tutorial pages, and adds a browser-based LemLib path converter.

## Attribution

This project is a Python port inspired by LemLib. Portions of the API shape, algorithms, and documentation structure are adapted from LemLib, which is MIT licensed by Liam Teale and LemLib contributors. See `NOTICE.md` and `LICENSE`.

