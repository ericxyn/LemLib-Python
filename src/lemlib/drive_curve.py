"""Driver-control input curves."""

from __future__ import annotations

from dataclasses import dataclass
from math import copysign


class DriveCurve:
    def curve(self, value: float) -> float:
        return value

    __call__ = curve


@dataclass
class ExpoDriveCurve(DriveCurve):
    deadband: float = 3.0
    minimum_output: float = 10.0
    curve_gain: float = 1.019
    maximum_input: float = 127.0

    def curve(self, value: float) -> float:
        if abs(value) <= self.deadband:
            return 0.0
        sign = copysign(1, value)
        normalized = (abs(value) - self.deadband) / (self.maximum_input - self.deadband)
        if self.curve_gain == 1:
            curved = normalized
        else:
            curved = (self.curve_gain ** (normalized * self.maximum_input) - 1) / (
                self.curve_gain ** self.maximum_input - 1
            )
        return sign * (self.minimum_output + curved * (self.maximum_input - self.minimum_output))

