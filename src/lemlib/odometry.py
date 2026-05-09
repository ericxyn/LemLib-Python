"""Tracking-wheel odometry helpers."""

from __future__ import annotations

from dataclasses import dataclass
from math import pi, radians, sin

from .geometry import Pose, Vector2D


@dataclass
class TrackingWheel:
    diameter: float
    offset: float
    ratio: float = 1.0
    last_total: float = 0.0

    def distance_from_degrees(self, degrees: float) -> float:
        return degrees / 360 * pi * self.diameter * self.ratio

    def distance_delta(self, total_degrees: float) -> float:
        total = self.distance_from_degrees(total_degrees)
        delta = total - self.last_total
        self.last_total = total
        return delta

    def reset(self) -> None:
        self.last_total = 0.0


class TrackingWheelOdometry:
    """A direct Python form of the tracking-wheel odometry update math."""

    def __init__(self, pose: Pose | None = None) -> None:
        self.pose = pose or Pose()

    def get_pose(self) -> Pose:
        return self.pose

    def set_pose(self, pose: Pose) -> None:
        self.pose = pose

    def update(
        self,
        vertical_delta: float,
        horizontal_delta: float,
        heading: float,
        vertical_offset: float = 0.0,
        horizontal_offset: float = 0.0,
    ) -> Pose:
        delta_theta = heading - self.pose.theta
        if delta_theta == 0:
            local = Vector2D(vertical_delta, horizontal_delta)
        else:
            delta_rad = radians(delta_theta)
            scale = 2 * sin(delta_rad / 2)
            local = Vector2D(
                scale * (vertical_delta / delta_rad + vertical_offset),
                scale * (horizontal_delta / delta_rad + horizontal_offset),
            )

        global_delta = local.rotated_by(self.pose.theta + delta_theta / 2)
        self.pose = Pose(
            self.pose.x + global_delta.x,
            self.pose.y + global_delta.y,
            heading,
        )
        return self.pose

    getPose = get_pose
    setPose = set_pose

