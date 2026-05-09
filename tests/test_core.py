import math
import unittest

from lemlib import (
    AngularDirection,
    Chassis,
    ControllerSettings,
    Drivetrain,
    OdomSensors,
    PID,
    Pose,
    angle_error,
    parse_lemlib_path,
    slew,
)


class CoreTests(unittest.TestCase):
    def test_angle_error_wraps_shortest_path(self):
        self.assertEqual(angle_error(10, 350), 20)
        self.assertEqual(angle_error(350, 10), -20)
        self.assertEqual(angle_error(90, 0, AngularDirection.CW_CLOCKWISE), 90)
        self.assertEqual(angle_error(90, 0, AngularDirection.CCW_COUNTERCLOCKWISE), -270)

    def test_slew_limits_delta_by_rate_and_time(self):
        self.assertEqual(slew(20, 0, 10, 1), 10)
        self.assertEqual(slew(5, 0, 10, 1), 5)
        self.assertEqual(slew(-20, 0, 10, 0.5), -5)

    def test_pid_uses_integral_and_derivative(self):
        pid = PID(2, 0.5, 1)
        self.assertAlmostEqual(pid.update(4, dt=0.0), 8)
        self.assertAlmostEqual(pid.update(2, dt=1.0), 2 * 2 + 2 * 0.5 - 2)

    def test_parse_path_jerryio_lemlib_format(self):
        path = parse_lemlib_path("0, 0, 80\n12.5, 24, 90\nendData\n")
        self.assertEqual(len(path), 2)
        self.assertEqual(path[1].x, 12.5)
        self.assertIn("Waypoint(12.5, 24.0, 90.0)", path.to_python("auton"))

    def test_chassis_move_to_point_returns_drive_signal(self):
        chassis = Chassis(
            Drivetrain(track_width=10),
            ControllerSettings(10, 0, 3),
            ControllerSettings(2, 0, 10),
            OdomSensors(),
        )
        chassis.set_pose(Pose(0, 0, 0))
        signal = chassis.move_to_point(0, 48, dt=0.02)
        self.assertGreater(signal.left, 0)
        self.assertGreater(signal.right, 0)
        self.assertTrue(math.isfinite(signal.left))


if __name__ == "__main__":
    unittest.main()
