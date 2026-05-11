import math
import unittest

from accudrive import (
    angle_error,
    angular_direction,
    chassis,
    controller_settings,
    drivetrain,
    get_signed_tangent_arc_curvature,
    odom_sensors,
    omniwheel,
    parse_lemlib_path,
    pid,
    pose,
    slew,
    wheel,
)


class CoreTests(unittest.TestCase):
    def test_angle_error_wraps_shortest_path(self):
        self.assertEqual(angle_error(10, 350), 20)
        self.assertEqual(angle_error(350, 10), -20)
        self.assertEqual(angle_error(90, 0, angular_direction.cw_clockwise), 90)
        self.assertEqual(angle_error(90, 0, angular_direction.ccw_counterclockwise), -270)

    def test_slew_limits_delta_by_rate_and_time(self):
        self.assertEqual(slew(20, 0, 10, 1), 10)
        self.assertEqual(slew(5, 0, 10, 1), 5)
        self.assertEqual(slew(-20, 0, 10, 0.5), -5)

    def test_curvature_helper_is_top_level_api(self):
        self.assertAlmostEqual(
            get_signed_tangent_arc_curvature(pose(0, 0, 0), pose(12, 12, 0)),
            -1 / 12,
        )

    def test_pid_uses_integral_and_derivative(self):
        controller = pid(2, 0.5, 1)
        self.assertAlmostEqual(controller.update(4, dt=0.0), 8)
        self.assertAlmostEqual(controller.update(2, dt=1.0), 2 * 2 + 2 * 0.5 - 2)

    def test_parse_path_jerryio_lemlib_format(self):
        path = parse_lemlib_path("0, 0, 80\n12.5, 24, 90\nendData\n")
        self.assertEqual(len(path), 2)
        self.assertEqual(path[1].x, 12.5)
        self.assertIn("waypoint(12.5, 24.0, 90.0)", path.to_python("auton"))

    def test_chassis_move_to_point_returns_drive_signal(self):
        robot = chassis(
            drivetrain(track_width=10),
            controller_settings(10, 0, 3),
            controller_settings(2, 0, 10),
            odom_sensors(),
        )
        robot.set_pose(pose(0, 0, 0))
        signal = robot.move_to_point(0, 48, dt=0.02)
        self.assertGreater(signal.left, 0)
        self.assertGreater(signal.right, 0)
        self.assertTrue(math.isfinite(signal.left))

    def test_drivetrain_accepts_ordered_mixed_wheels_per_side(self):
        drive = drivetrain(
            track_width=10,
            wheel_diameter=omniwheel.new_325,
            wheels_per_side=3,
            wheel_sequence=["omni", "traction", "omni"],
        )

        self.assertEqual(drive.wheels_per_side, 3)
        self.assertEqual([item.kind for item in drive.left_wheels], ["omni", "traction", "omni"])
        self.assertEqual([item.kind for item in drive.right_wheels], ["omni", "traction", "omni"])
        self.assertEqual(drive.left_wheel_sizes, (3.25, 3.25, 3.25))
        self.assertAlmostEqual(drive.wheel_size, 3.25)

    def test_drivetrain_accepts_explicit_wheel_objects(self):
        drive = drivetrain(
            wheels_per_side=3,
            wheel_sequence=[
                wheel("omni", omniwheel.new_325),
                wheel("traction", 3.25),
                wheel("omni", omniwheel.new_325),
            ],
        )

        self.assertEqual(drive.wheel_sequence[1].kind, "traction")
        self.assertAlmostEqual(drive.average_wheel_size, 3.25)

    def test_drivetrain_validates_wheel_count(self):
        with self.assertRaises(ValueError):
            drivetrain(wheels_per_side=3, wheel_sequence=["omni", "traction"])

    def test_drivetrain_infers_side_specific_wheel_count(self):
        drive = drivetrain(
            left_wheels=["omni", "traction", "omni"],
            right_wheels=["omni", "traction", "omni"],
        )

        self.assertEqual(drive.wheels_per_side, 3)
        self.assertEqual([item.kind for item in drive.wheel_sequence], ["omni", "omni", "omni"])


if __name__ == "__main__":
    unittest.main()
