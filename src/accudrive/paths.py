"""LemLib path parsing and ACCUDRIVE conversion helpers."""

from __future__ import annotations

from dataclasses import dataclass
from json import dumps
from re import split


@dataclass(frozen=True)
class Waypoint:
    x: float
    y: float
    speed: float


class Path(list[Waypoint]):
    def to_lemlib(self) -> str:
        lines = [f"{point.x:g}, {point.y:g}, {point.speed:g}" for point in self]
        return "\n".join(lines + ["endData"])

    def to_python(self, variable_name: str = "path") -> str:
        rows = ",\n    ".join(
            f"waypoint({point.x!r}, {point.y!r}, {point.speed!r})" for point in self
        )
        return (
            "from accudrive import path, waypoint\n\n"
            f"{variable_name} = path([\n"
            f"    {rows}\n"
            "])\n"
        )

    def to_json(self) -> str:
        return dumps([point.__dict__ for point in self], indent=2)


def parse_lemlib_path(text: str) -> Path:
    """Parse path.jerryio's LemLib v0.5 text export.

    The expected format is one waypoint per line: ``x, y, speed``. Parsing
    stops at ``endData``. Empty lines and comments beginning with ``#`` are
    ignored.
    """

    path = Path()
    for line_number, raw_line in enumerate(text.splitlines(), start=1):
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        if line == "endData":
            break
        parts = [part.strip() for part in split(r"\s*,\s*", line)]
        if len(parts) != 3:
            raise ValueError(f"line {line_number}: expected 'x, y, speed', got {raw_line!r}")
        try:
            x, y, speed = (float(part) for part in parts)
        except ValueError as exc:
            raise ValueError(f"line {line_number}: waypoint values must be numbers") from exc
        path.append(Waypoint(x, y, speed))
    if not path:
        raise ValueError("no LemLib waypoints found")
    return path


def convert_lemlib_to_accudrive(text: str, variable_name: str = "path") -> str:
    return parse_lemlib_path(text).to_python(variable_name)
