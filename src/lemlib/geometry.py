"""Geometry primitives used by the motion algorithms."""

from __future__ import annotations

from dataclasses import dataclass
from math import atan2, cos, degrees, hypot, radians, sin


@dataclass(frozen=True)
class Vector2D:
    """A 2D point or displacement in field units, normally inches."""

    x: float = 0.0
    y: float = 0.0

    def distance_to(self, other: "Vector2D") -> float:
        return hypot(other.x - self.x, other.y - self.y)

    def angle_to(self, other: "Vector2D") -> float:
        """Return heading in degrees where 0 points along +Y."""

        return degrees(atan2(other.x - self.x, other.y - self.y))

    def rotated_by(self, theta: float) -> "Vector2D":
        """Rotate a vector by a robot heading where 0 degrees is +Y."""

        angle = radians(theta)
        return Vector2D(
            self.x * cos(angle) + self.y * sin(angle),
            -self.x * sin(angle) + self.y * cos(angle),
        )

    @classmethod
    def from_polar(cls, theta: float, radius: float) -> "Vector2D":
        angle = radians(theta)
        return cls(radius * sin(angle), radius * cos(angle))

    def __add__(self, other: "Vector2D") -> "Vector2D":
        return Vector2D(self.x + other.x, self.y + other.y)

    def __sub__(self, other: "Vector2D") -> "Vector2D":
        return Vector2D(self.x - other.x, self.y - other.y)

    def __mul__(self, scalar: float) -> "Vector2D":
        return Vector2D(self.x * scalar, self.y * scalar)

    def __truediv__(self, scalar: float) -> "Vector2D":
        return Vector2D(self.x / scalar, self.y / scalar)


@dataclass(frozen=True)
class Pose(Vector2D):
    """A robot pose: x, y, and heading in degrees."""

    theta: float = 0.0

    @property
    def orientation(self) -> float:
        return self.theta

    def with_heading(self, theta: float) -> "Pose":
        return Pose(self.x, self.y, theta)

    def translated(self, delta: Vector2D) -> "Pose":
        return Pose(self.x + delta.x, self.y + delta.y, self.theta)

    def as_vector(self) -> Vector2D:
        return Vector2D(self.x, self.y)

