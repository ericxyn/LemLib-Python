"""PID controller."""

from __future__ import annotations

from dataclasses import dataclass
from time import monotonic


@dataclass
class Gains:
    kp: float = 0.0
    ki: float = 0.0
    kd: float = 0.0


class PID:
    """A small PID controller compatible with LemLib's control style."""

    def __init__(
        self,
        kp: float | Gains,
        ki: float = 0.0,
        kd: float = 0.0,
        windup_range: float = 0.0,
        sign_flip_reset: bool = False,
    ) -> None:
        if isinstance(kp, Gains):
            self.gains = Gains(kp.kp, kp.ki, kp.kd)
        else:
            self.gains = Gains(kp, ki, kd)
        self.windup_range = windup_range
        self.sign_flip_reset = sign_flip_reset
        self.previous_error = 0.0
        self.integral = 0.0
        self._previous_time: float | None = None

    def get_gains(self) -> Gains:
        return Gains(self.gains.kp, self.gains.ki, self.gains.kd)

    def set_gains(self, gains: Gains) -> None:
        self.gains = Gains(gains.kp, gains.ki, gains.kd)

    def update(self, error: float, dt: float | None = None) -> float:
        if dt is None:
            now = monotonic()
            dt = 0.0 if self._previous_time is None else now - self._previous_time
            self._previous_time = now
        elif dt < 0:
            raise ValueError("dt cannot be negative")

        derivative = (error - self.previous_error) / dt if dt else 0.0
        self.integral += error * dt

        if self.sign_flip_reset and _sign(error) != _sign(self.previous_error):
            self.integral = 0.0
        if self.windup_range and abs(error) > self.windup_range:
            self.integral = 0.0

        self.previous_error = error
        return (
            error * self.gains.kp
            + self.integral * self.gains.ki
            + derivative * self.gains.kd
        )

    def reset(self) -> None:
        self.previous_error = 0.0
        self.integral = 0.0
        self._previous_time = None

    def set_sign_flip_reset(self, sign_flip_reset: bool) -> None:
        self.sign_flip_reset = sign_flip_reset

    def get_sign_flip_reset(self) -> bool:
        return self.sign_flip_reset

    def set_windup_range(self, windup_range: float) -> None:
        self.windup_range = windup_range

    def get_windup_range(self) -> float:
        return self.windup_range

    getGains = get_gains
    setGains = set_gains
    setSignFlipReset = set_sign_flip_reset
    getSignFlipReset = get_sign_flip_reset
    setWindupRange = set_windup_range
    getWindupRange = get_windup_range


def _sign(value: float) -> int:
    return 1 if value > 0 else -1 if value < 0 else 0

