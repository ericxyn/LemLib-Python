"""Tank-drive chassis helpers and motion-control calculations."""

from __future__ import annotations

from dataclasses import dataclass
from math import cos, radians, sqrt

from .config import ControllerSettings, Drivetrain, OdomSensors
from .drive_curve import DriveCurve
from .geometry import Pose, Vector2D
from .paths import Path, parse_lemlib_path
from .pid import PID
from .utils import angle_error, constrain_power, get_signed_tangent_arc_curvature, slew


@dataclass(frozen=True)
class DriveSignal:
    left: float
    right: float
    lateral: float = 0.0
    angular: float = 0.0


@dataclass
class TurnToHeadingParams:
    max_speed: float = 127.0
    min_speed: float = 0.0
    slew: float = 0.0
    early_exit_range: float = 0.0


@dataclass
class TurnToPointParams(TurnToHeadingParams):
    forwards: bool = True


@dataclass
class SwingParams(TurnToHeadingParams):
    locked_side: str = "left"


@dataclass
class MoveToPointParams:
    forwards: bool = True
    max_lateral_speed: float = 127.0
    min_lateral_speed: float = 0.0
    max_angular_speed: float = 127.0
    lateral_slew: float = 0.0
    angular_slew: float = 0.0
    early_exit_range: float = 0.0


@dataclass
class MoveToPoseParams(MoveToPointParams):
    lead: float = 0.6
    horizontal_drift: float | None = None


@dataclass
class FollowParams:
    forwards: bool = True
    lateral_slew: float = 0.0


class Chassis:
    """A hardware-agnostic tank-drive chassis facade.

    If the drivetrain's motor groups have ``move``/``brake`` methods, driver
    and motion helpers will send outputs to them. They always return the
    computed ``DriveSignal`` as well, which makes the class useful in tests and
    simulators.
    """

    def __init__(
        self,
        drivetrain: Drivetrain,
        lateral_settings: ControllerSettings,
        angular_settings: ControllerSettings,
        sensors: OdomSensors | None = None,
        throttle_curve: DriveCurve | None = None,
        steer_curve: DriveCurve | None = None,
        pose: Pose | None = None,
    ) -> None:
        self.drivetrain = drivetrain
        self.sensors = sensors or OdomSensors()
        self.lateral_settings = lateral_settings
        self.angular_settings = angular_settings
        self.lateral_pid = lateral_settings.create_pid()
        self.angular_pid = angular_settings.create_pid()
        self.throttle_curve = throttle_curve
        self.steer_curve = steer_curve
        self.pose = pose or Pose()
        self.last_signal = DriveSignal(0, 0)

    def calibrate(self, calibrate_imu: bool = True) -> None:
        self.lateral_pid.reset()
        self.angular_pid.reset()

    def set_pose(self, pose: Pose | float, y: float | None = None, theta: float | None = None) -> None:
        if isinstance(pose, Pose):
            self.pose = pose
        else:
            if y is None or theta is None:
                raise ValueError("set_pose requires Pose or x, y, theta")
            self.pose = Pose(float(pose), float(y), float(theta))

    def get_pose(self) -> Pose:
        return self.pose

    def tank(self, left: float, right: float, curve: bool = True) -> DriveSignal:
        if curve and self.throttle_curve is not None:
            left = self.throttle_curve.curve(left)
            right = self.throttle_curve.curve(right)
        return self._apply(DriveSignal(left, right))

    def arcade(
        self,
        throttle: float,
        steer: float,
        reverse: bool = False,
        steer_priority: float = 0.5,
    ) -> DriveSignal:
        if self.throttle_curve is not None:
            throttle = self.throttle_curve.curve(throttle)
        if self.steer_curve is not None:
            steer = self.steer_curve.curve(steer)
        if reverse:
            throttle = -throttle

        steer_priority = max(0.0, min(1.0, steer_priority))
        throttle_priority = 1.0 - steer_priority
        left = throttle + steer
        right = throttle - steer
        scale = max(127.0, abs(left), abs(right))
        left = left / scale * 127.0 * (0.5 + throttle_priority / 2)
        right = right / scale * 127.0 * (0.5 + throttle_priority / 2)
        return self._apply(DriveSignal(left, right, throttle, steer))

    def curvature(self, throttle: float, curve: float, reverse: bool = False) -> DriveSignal:
        if self.throttle_curve is not None:
            throttle = self.throttle_curve.curve(throttle)
        if self.steer_curve is not None:
            curve = self.steer_curve.curve(curve)
        if reverse:
            throttle = -throttle
        angular = abs(throttle) * (curve / 127.0)
        left = throttle + angular
        right = throttle - angular
        scale = max(127.0, abs(left), abs(right))
        return self._apply(DriveSignal(left / scale * 127, right / scale * 127, throttle, angular))

    def turn_to_heading(
        self,
        heading: float,
        timeout: float | None = None,
        params: TurnToHeadingParams | None = None,
        dt: float = 0.01,
    ) -> DriveSignal:
        params = params or TurnToHeadingParams(max_speed=127, slew=self.angular_settings.slew)
        error = angle_error(heading, self.pose.theta)
        power = self.angular_pid.update(radians(error), dt)
        power = constrain_power(power, params.max_speed, params.min_speed)
        return self._apply(DriveSignal(-power, power, 0, power))

    def turn_to_point(
        self,
        x: float,
        y: float,
        timeout: float | None = None,
        params: TurnToPointParams | None = None,
        dt: float = 0.01,
    ) -> DriveSignal:
        params = params or TurnToPointParams()
        target = self.pose.angle_to(Vector2D(x, y))
        if not params.forwards:
            target += 180
        return self.turn_to_heading(target, timeout, params, dt)

    def swing_to_heading(
        self,
        heading: float,
        timeout: float | None = None,
        params: SwingParams | None = None,
        dt: float = 0.01,
    ) -> DriveSignal:
        params = params or SwingParams()
        signal = self.turn_to_heading(heading, timeout, params, dt)
        if params.locked_side.lower() == "left":
            signal = DriveSignal(0, signal.right, signal.lateral, signal.angular)
        else:
            signal = DriveSignal(signal.left, 0, signal.lateral, signal.angular)
        return self._apply(signal)

    def swing_to_point(
        self,
        x: float,
        y: float,
        timeout: float | None = None,
        params: SwingParams | None = None,
        dt: float = 0.01,
    ) -> DriveSignal:
        return self.swing_to_heading(self.pose.angle_to(Vector2D(x, y)), timeout, params, dt)

    def move_to_point(
        self,
        x: float,
        y: float,
        timeout: float | None = None,
        params: MoveToPointParams | None = None,
        dt: float = 0.01,
    ) -> DriveSignal:
        params = params or MoveToPointParams(
            lateral_slew=self.lateral_settings.slew,
            angular_slew=self.angular_settings.slew,
        )
        target = Vector2D(x, y)
        target_heading = self.pose.angle_to(target)
        adjusted_heading = self.pose.theta if params.forwards else self.pose.theta + 180
        angular_error = angle_error(target_heading, adjusted_heading)
        lateral_error = self.pose.distance_to(target) * cos(radians(angular_error))

        lateral = self.lateral_pid.update(lateral_error, dt)
        angular = self.angular_pid.update(radians(angular_error), dt)
        lateral = max(-params.max_lateral_speed, min(params.max_lateral_speed, lateral))
        angular = max(-params.max_angular_speed, min(params.max_angular_speed, angular))

        if not params.forwards:
            lateral = -abs(lateral)
        elif lateral > 0 and params.min_lateral_speed:
            lateral = max(lateral, params.min_lateral_speed)

        return self._apply_mixed(lateral, angular)

    def move_to_pose(
        self,
        x: float,
        y: float,
        theta: float,
        timeout: float | None = None,
        params: MoveToPoseParams | None = None,
        dt: float = 0.01,
    ) -> DriveSignal:
        params = params or MoveToPoseParams(
            lateral_slew=self.lateral_settings.slew,
            angular_slew=self.angular_settings.slew,
            horizontal_drift=self.drivetrain.horizontal_drift,
        )
        target = Pose(x, y, theta)
        close = self.pose.distance_to(target) < 7.5
        carrot = target.as_vector() if close else target.as_vector() - Vector2D.from_polar(theta, params.lead * self.pose.distance_to(target))
        target_heading = target.theta if close else self.pose.angle_to(carrot)
        adjusted_heading = self.pose.theta if params.forwards else self.pose.theta + 180
        angular_error = angle_error(target_heading, adjusted_heading)
        scalar = cos(radians(angle_error(self.pose.angle_to(carrot), self.pose.theta)))
        lateral_error = self.pose.distance_to(target) * (scalar if close else (1 if scalar >= 0 else -1))

        lateral = self.lateral_pid.update(lateral_error, dt)
        angular = self.angular_pid.update(radians(angular_error), dt)
        lateral = max(-params.max_lateral_speed, min(params.max_lateral_speed, lateral))
        angular = max(-params.max_angular_speed, min(params.max_angular_speed, angular))

        curvature = abs(get_signed_tangent_arc_curvature(self.pose, carrot))
        if curvature:
            radius = 1 / curvature
            drift = params.horizontal_drift if params.horizontal_drift is not None else self.drivetrain.horizontal_drift
            max_slip_speed = sqrt(max(0.0, drift * radius))
            lateral = max(-max_slip_speed, min(max_slip_speed, lateral))

        return self._apply_mixed(lateral, angular)

    def follow(
        self,
        path: str | Path,
        lookahead_distance: float,
        timeout: float | None = None,
        params: FollowParams | None = None,
        dt: float = 0.01,
    ) -> DriveSignal:
        params = params or FollowParams(lateral_slew=self.lateral_settings.slew)
        parsed = parse_lemlib_path(path) if isinstance(path, str) else path
        if not parsed:
            raise ValueError("path has no waypoints")
        closest = min(parsed, key=lambda point: self.pose.distance_to(Vector2D(point.x, point.y)))
        if closest.speed == 0:
            return self._apply(DriveSignal(0, 0))
        lookahead = Vector2D(parsed[-1].x, parsed[-1].y)
        for point in parsed:
            candidate = Vector2D(point.x, point.y)
            if self.pose.distance_to(candidate) >= lookahead_distance:
                lookahead = candidate
                break
        curvature = get_signed_tangent_arc_curvature(self.pose, lookahead)
        velocity = slew(closest.speed, self.last_signal.lateral, params.lateral_slew, dt)
        left = velocity * (2 + curvature * self.drivetrain.track_width) / 2
        right = velocity * (2 - curvature * self.drivetrain.track_width) / 2
        scale = max(127.0, abs(left), abs(right))
        left = left / scale * 127.0
        right = right / scale * 127.0
        if not params.forwards:
            left, right = -right, -left
        return self._apply(DriveSignal(left, right, velocity, curvature))

    def cancel_motion(self) -> None:
        self.brake()

    def cancel_all_motions(self) -> None:
        self.brake()

    def is_in_motion(self) -> bool:
        return bool(self.last_signal.left or self.last_signal.right)

    def brake(self) -> None:
        _brake(self.drivetrain.left_motors)
        _brake(self.drivetrain.right_motors)
        self.last_signal = DriveSignal(0, 0)

    def _apply_mixed(self, lateral: float, angular: float) -> DriveSignal:
        left = lateral - angular
        right = lateral + angular
        scale = max(127.0, abs(left), abs(right))
        return self._apply(DriveSignal(left / scale * 127, right / scale * 127, lateral, angular))

    def _apply(self, signal: DriveSignal) -> DriveSignal:
        self.last_signal = signal
        _move(self.drivetrain.left_motors, signal.left)
        _move(self.drivetrain.right_motors, signal.right)
        return signal

    setPose = set_pose
    getPose = get_pose
    turnToHeading = turn_to_heading
    turnToPoint = turn_to_point
    swingToHeading = swing_to_heading
    swingToPoint = swing_to_point
    moveToPoint = move_to_point
    moveToPose = move_to_pose
    cancelMotion = cancel_motion
    cancelAllMotions = cancel_all_motions
    isInMotion = is_in_motion


def _move(motors: object | None, value: float) -> None:
    if motors is None:
        return
    if hasattr(motors, "move"):
        motors.move(value)
    elif callable(motors):
        motors(value)


def _brake(motors: object | None) -> None:
    if motors is not None and hasattr(motors, "brake"):
        motors.brake()

