# ACCUDRIVE

![ACCUDRIVE logo](website/public/accudrive-banner.png)

ACCUDRIVE is a Python recreation of [LemLib](https://github.com/LemLib/LemLib): PID, odometry math, tank-drive motion helpers, driver control curves, pure pursuit path utilities, and a path.jerryio LemLib-format converter.

This repository is intentionally hardware-agnostic. It exposes the math and control surfaces in Python and lets robot projects provide motor/sensor adapters. That makes it useful for simulation, teaching, testing autonomous routines, and porting LemLib-style snippets before wiring them to a Python robotics runtime.

## Included functions

- `pid`, `controller_settings`, and exit-condition helpers
- `pose`, `vector_2d`, angle math, slew limiting, desaturation, and tangent-arc curvature
- `drivetrain`, `wheel`, `tracking_wheel`, and `tracking_wheel_odometry`
- `chassis` driver helpers: `tank`, `arcade`, `curvature`
- `chassis` motion helpers: `turn_to_heading`, `turn_to_point`, `move_to_point`, `move_to_pose`, and `follow`
- LemLib path parsing plus ACCUDRIVE conversion for path.jerryio exports
- A docs-style website with all eight original tutorial topics adapted to Python

## Local Installation

```bash
python -m pip install -e .
```

## Example Usage

```python
from accudrive import chassis, controller_settings, drivetrain, odom_sensors, omniwheel, pose

drive = drivetrain(
    track_width=10,
    wheel_diameter=omniwheel.new_325,
    wheels_per_side=3,
    wheel_sequence=["omni", "traction", "omni"],
    rpm=360,
    horizontal_drift=2,
)
lateral = controller_settings(kp=10, ki=0, kd=3, windup_range=3)
angular = controller_settings(kp=2, ki=0, kd=10, windup_range=3)

robot = chassis(drive, lateral, angular, odom_sensors())
robot.set_pose(pose(0, 0, 0))

signal = robot.move_to_point(0, 48)
print(signal.left, signal.right)
```

## Conversion of path.jerryio LemLib format to ACCUDRIVE path

```python
from accudrive.paths import convert_lemlib_to_accudrive

path_text = """0, 0, 80
12, 18, 90
24, 24, 0
endData
"""

print(convert_lemlib_to_accudrive(path_text, variable_name="auton_path"))
```

## Website

The web app lives in `website/`.

```bash
cd website
npm install
npm run dev
```

It has an API reference with an intuitive documentation structure, all eight LemLib tutorial topics adapted to Python, and a browser-based LemLib path converter.

## Attribution

This project is a Python port inspired by LemLib but completely independent of it. Many LemLib concepts have ACCUDRIVE Python counterparts, but they were developed separately. See `NOTICE.md` and `LICENSE`.

