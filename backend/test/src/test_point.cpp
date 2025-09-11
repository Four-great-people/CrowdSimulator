#include <gtest/gtest.h>

#include "point.h"

TEST(test_point, get_x__reflect__returns_x) {
    int x = 10;
    int y = 20;
    Point p(x, y);

    int result = p.get_x();

    ASSERT_EQ(result, x);
}

TEST(test_point, get_y__reflect__returns_y) {
    int x = 10;
    int y = 20;
    Point p(x, y);

    int result = p.get_y();

    ASSERT_EQ(result, y);
}

TEST(test_point, minus__basic__returns_point) {
    Point p1(4, 8);
    Point p2(2, -6);

    Point p3 = p2 - p1;

    ASSERT_EQ(p3.get_x(), -2);
    ASSERT_EQ(p3.get_y(), -14);
}
