"""Configuration helpers that mirror LemLib's builder-style classes."""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum

from .pid import PID


class Omniwheel(float, Enum):
    NEW_2 = 2.125
    NEW_275 = 2.75
    OLD_275 = 2.75
    NEW_275_HALF = 2.744
    OLD_275_HALF = 2.74
    NEW_325 = 3.25
    OLD_325 = 3.25
    NEW_325_HALF = 3.246
    OLD_325_HALF = 3.246
    NEW_4 = 4.0
    OLD_4 = 4.18
    NEW_4_HALF = 3.995
    OLD_4_HALF = 4.175


@dataclass
class ControllerSettings:
    kp: float
    ki: float
    kd: float
    windup_range: float = 0.0
    small_error: float = 0.0
    small_timeout: float = 0.0
    large_error: float = 0.0
    large_timeout: float = 0.0
    slew: float = 0.0

    def create_pid(self) -> PID:
        return PID(self.kp, self.ki, self.kd, self.windup_range, sign_flip_reset=True)


@dataclass
class ExitCondition:
    small_error: float = 0.0
    small_timeout: float = 0.0
    large_error: float = 0.0
    large_timeout: float = 0.0

    _small_elapsed: float = 0.0
    _large_elapsed: float = 0.0

    @classmethod
    def from_settings(cls, settings: ControllerSettings) -> "ExitCondition":
        return cls(
            settings.small_error,
            settings.small_timeout / 1000,
            settings.large_error,
            settings.large_timeout / 1000,
        )

    def update(self, error: float, dt: float) -> bool:
        absolute = abs(error)
        if self.small_error and absolute <= self.small_error:
            self._small_elapsed += dt
        else:
            self._small_elapsed = 0.0

        if self.large_error and absolute <= self.large_error:
            self._large_elapsed += dt
        else:
            self._large_elapsed = 0.0

        small_done = self.small_timeout and self._small_elapsed >= self.small_timeout
        large_done = self.large_timeout and self._large_elapsed >= self.large_timeout
        return bool(small_done or large_done)

    def reset(self) -> None:
        self._small_elapsed = 0.0
        self._large_elapsed = 0.0


@dataclass
class Drivetrain:
    left_motors: object | None = None
    right_motors: object | None = None
    track_width: float = 0.0
    wheel_diameter: float | Omniwheel = Omniwheel.NEW_4
    rpm: float = 360.0
    horizontal_drift: float = 2.0

    @property
    def wheel_size(self) -> float:
        return float(self.wheel_diameter.value if isinstance(self.wheel_diameter, Omniwheel) else self.wheel_diameter)


@dataclass
class OdomSensors:
    vertical_1: object | None = None
    vertical_2: object | None = None
    horizontal_1: object | None = None
    horizontal_2: object | None = None
    imu: object | None = None

