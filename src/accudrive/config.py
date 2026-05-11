"""Configuration helpers that mirror LemLib's builder-style classes."""

from __future__ import annotations

from collections.abc import Mapping, Sequence
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


@dataclass(frozen=True)
class Wheel:
    """A named wheel in one drivetrain side's ordered layout."""

    kind: str
    diameter: float | Omniwheel

    @property
    def size(self) -> float:
        return _wheel_diameter_to_float(self.diameter)


WheelInput = Wheel | float | Omniwheel | str | Mapping[str, object] | Sequence[object]


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
    """Tank-drive configuration with optional ordered wheel layouts."""

    left_motors: object | None = None
    right_motors: object | None = None
    track_width: float = 0.0
    wheel_diameter: float | Omniwheel = Omniwheel.new_4
    rpm: float = 360.0
    horizontal_drift: float = 2.0
    wheels_per_side: int | None = None
    wheel_sequence: Sequence[WheelInput] | None = None
    left_wheels: Sequence[WheelInput] | None = None
    right_wheels: Sequence[WheelInput] | None = None

    def __post_init__(self) -> None:
        per_side = self.wheels_per_side
        if per_side is None:
            per_side = _first_sequence_length(self.wheel_sequence, self.left_wheels, self.right_wheels)
        shared = _normalize_wheel_sequence(self.wheel_sequence, per_side, self.wheel_diameter)
        per_side = per_side or len(shared)

        self.wheels_per_side = per_side
        self.wheel_sequence = shared
        self.left_wheels = (
            _normalize_wheel_sequence(self.left_wheels, per_side, self.wheel_diameter)
            if self.left_wheels is not None
            else shared
        )
        self.right_wheels = (
            _normalize_wheel_sequence(self.right_wheels, per_side, self.wheel_diameter)
            if self.right_wheels is not None
            else shared
        )

    @property
    def wheel_size(self) -> float:
        return self.average_wheel_size

    @property
    def left_wheel_sizes(self) -> tuple[float, ...]:
        return tuple(wheel.size for wheel in self.left_wheels)

    @property
    def right_wheel_sizes(self) -> tuple[float, ...]:
        return tuple(wheel.size for wheel in self.right_wheels)

    @property
    def average_wheel_size(self) -> float:
        sizes = self.left_wheel_sizes + self.right_wheel_sizes
        return sum(sizes) / len(sizes)


@dataclass
class OdomSensors:
    vertical_1: object | None = None
    vertical_2: object | None = None
    horizontal_1: object | None = None
    horizontal_2: object | None = None
    imu: object | None = None


def _normalize_wheel_sequence(
    wheels: Sequence[WheelInput] | None,
    wheels_per_side: int | None,
    default_diameter: float | Omniwheel,
) -> tuple[Wheel, ...]:
    if wheels_per_side is not None and wheels_per_side <= 0:
        raise ValueError("wheels_per_side must be positive")

    if wheels is None:
        count = wheels_per_side or 1
        return tuple(Wheel("omni", default_diameter) for _ in range(count))

    wheel_items = (wheels,) if isinstance(wheels, (str, bytes)) else wheels
    normalized = tuple(_coerce_wheel(wheel, default_diameter) for wheel in wheel_items)
    if not normalized:
        raise ValueError("wheel_sequence must contain at least one wheel")
    if wheels_per_side is not None and len(normalized) != wheels_per_side:
        raise ValueError("wheel_sequence length must match wheels_per_side")
    return normalized


def _coerce_wheel(value: WheelInput, default_diameter: float | Omniwheel) -> Wheel:
    if isinstance(value, Wheel):
        return value
    if isinstance(value, Omniwheel):
        return Wheel("omni", value)
    if isinstance(value, (int, float)):
        return Wheel("wheel", float(value))
    if isinstance(value, str):
        return Wheel(value, default_diameter)
    if isinstance(value, Mapping):
        kind = str(value.get("kind", value.get("type", "wheel")))
        diameter = value.get("diameter", value.get("wheel_diameter", default_diameter))
        return Wheel(kind, _coerce_diameter(diameter))
    if isinstance(value, Sequence) and not isinstance(value, (str, bytes)):
        if len(value) != 2:
            raise ValueError("wheel tuples must contain kind and diameter")
        first, second = value
        if isinstance(first, str):
            return Wheel(first, _coerce_diameter(second))
        if isinstance(second, str):
            return Wheel(second, _coerce_diameter(first))
    raise TypeError(f"unsupported wheel specification: {value!r}")


def _coerce_diameter(value: object) -> float | Omniwheel:
    if isinstance(value, Omniwheel):
        return value
    if isinstance(value, (int, float)):
        return float(value)
    raise TypeError(f"wheel diameter must be a number or omniwheel, got {value!r}")


def _wheel_diameter_to_float(value: float | Omniwheel) -> float:
    return float(value.value if isinstance(value, Omniwheel) else value)


def _first_sequence_length(*sequences: Sequence[WheelInput] | None) -> int | None:
    for sequence in sequences:
        if sequence is None:
            continue
        return 1 if isinstance(sequence, (str, bytes)) else len(sequence)
    return None
