#include <gmock/gmock.h>
#include <gtest/gtest.h>

#include <vector>

#include "catable.h"

TEST(test_catable, empty_catable) {
    CATable table;
    ASSERT_TRUE(table.check_move(Point{1, 1}, Point{1, 2}, 1));
}

TEST(test_catable, non_cross_trajectories) {
    CATable table;
    table.add_trajectory(0, {Point{1, 1}, Point{1, 2}});
    ASSERT_TRUE(table.check_move(Point{10, 10}, Point{10, 11}, 0));
}

TEST(test_catable, same_standpoint) {
    CATable table;
    table.add_trajectory(0, {Point{1, 1}, Point{1, 2}});
    ASSERT_FALSE(table.check_move(Point{2, 2}, Point{1, 2}, 0));
}

TEST(test_catable, swap_persons_not_allowing) {
    CATable table;
    table.add_trajectory(0, {Point{1, 1}, Point{1, 2}});
    ASSERT_FALSE(table.check_move(Point{1, 2}, Point{1, 1}, 0));
}

TEST(test_catable, swap_diagonal_persons_not_allowing) {
    CATable table;
    table.add_trajectory(0, {Point{1, 1}, Point{2, 2}});
    ASSERT_FALSE(table.check_move(Point{2, 2}, Point{1, 1}, 0));
}

TEST(test_catable, sequential_standing) {
    CATable table;
    table.add_trajectory(0, {Point{1, 1}, Point{1, 2}});
    ASSERT_TRUE(table.check_move(Point{2, 2}, Point{1, 2}, 1));
}
