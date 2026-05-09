"""General math helpers ported from LemLib."""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from math import cos, radians, sin, sqrt, tan
from statistics import mean

from .geometry import Pose, Vector2D


class AngularDirection(str, Enum):
    CW_CLOCKWISE = "cw"
    CCW_COUNTERCLOCKWISE = "ccw"


class SlewDirection(str, Enum):
    INCREASING = "increasing"
    DECREASING = "decreasing"
    ALL = "all"


@dataclass(frozen=True)
class DriveOutputs:
    left: float
    right: float


def deg_to_rad(deg: float) -> float:
    return radians(deg)


def rad_to_deg(rad: float) -> float:
    from math import degrees

    return degrees(rad)


def sanitize_angle(angle: float) -> float:
    """Wrap an angle to [0, 360)."""

    return angle % 360


def angle_error(
    target: float,
    position: float,
    direction: AngularDirection | None = None,
) -> float:
    """Return target-position angle error in degrees.

    With no direction, the result is wrapped to [-180, 180). Clockwise returns
    a positive rotation in [0, 360); counter-clockwise returns a negative one.
    """

    error = (sanitize_angle(target) - position) % 360
    if direction == AngularDirection.CW_CLOCKWISE:
        return error
    if direction == AngularDirection.CCW_COUNTERCLOCKWISE:
        return error - 360 if error != 0 else 0
    return ((error + 180) % 360) - 180


def slew(
    target: float,
    current: float,
    max_change_rate: float,
    delta_time: float = 1.0,
    direction_limit: SlewDirection = SlewDirection.ALL,
) -> float:
    """Constrain change in a value over time."""

    if max_change_rate == 0:
        return target

    change = target - current
    if direction_limit == SlewDirection.INCREASING and change < 0:
        return target
    if direction_limit == SlewDirection.DECREASING and change > 0:
        return target

    limit = abs(max_change_rate * delta_time)
    if abs(change) > limit:
        return current + limit * (1 if change > 0 else -1)
    return target


def constrain_power(power: float, maximum: float, minimum: float = 0) -> float:
    if abs(power) < minimum:
        power = minimum if power >= 0 else -minimum
    return max(-maximum, min(maximum, power))


def desaturate(lateral_output: float, angular_output: float) -> DriveOutputs:
    left = lateral_output - angular_output
    right = lateral_output + angular_output
    total = abs(left) + abs(right)
    if total <= 1.0:
        return DriveOutputs(left, right)
    return DriveOutputs(left / total, right / total)


def get_signed_tangent_arc_curvature(start: Pose, end: Vector2D) -> float:
    """Curvature of an arc tangent to ``start`` and ending at ``end``."""

    delta = end - start.as_vector()
    side = 1 if sin(radians(start.theta)) * delta.x - cos(radians(start.theta)) * delta.y >= 0 else -1
    heading = radians(start.theta)
    a = -tan(heading)
    c = tan(heading) * start.x - start.y
    x_dist = abs(a * end.x + end.y + c) / sqrt(a * a + 1)
    d = start.distance_to(end)
    if d == 0:
        return 0.0
    return side * ((2 * x_dist) / (d * d))


def avg(*values: float) -> float:
    if len(values) == 1 and not isinstance(values[0], (int, float)):
        values = tuple(values[0])
    return mean(values) if values else 0.0


def ema(previous: float, current: float, alpha: float) -> float:
    """Exponential moving average."""

    return alpha * current + (1 - alpha) * previous

