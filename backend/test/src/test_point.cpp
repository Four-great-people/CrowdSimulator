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
