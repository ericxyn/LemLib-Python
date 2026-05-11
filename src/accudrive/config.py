"""Configuration helpers that mirror LemLib's builder-style classes."""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum

from .pid import PID


class Omniwheel(float, Enum):
    new_2 = 2.125
    new_275 = 2.75
    old_275 = 2.75
    new_275_half = 2.744
    old_275_half = 2.74
    new_325 = 3.25
    old_325 = 3.25
    new_325_half = 3.246
    old_325_half = 3.246
    new_4 = 4.0
    old_4 = 4.18
    new_4_half = 3.995
    old_4_half = 4.175

    NEW_2 = new_2
    NEW_275 = new_275
    OLD_275 = old_275
    NEW_275_HALF = new_275_half
    OLD_275_HALF = old_275_half
    NEW_325 = new_325
    OLD_325 = old_325
    NEW_325_HALF = new_325_half
    OLD_325_HALF = old_325_half
    NEW_4 = new_4
    OLD_4 = old_4
    NEW_4_HALF = new_4_half
    OLD_4_HALF = old_4_half


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
    wheel_diameter: float | Omniwheel = Omniwheel.new_4
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
