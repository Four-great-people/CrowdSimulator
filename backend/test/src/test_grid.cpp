#include <gtest/gtest.h>

#include <span>
#include <vector>

#include "grid.h"
#include "point.h"
#include "segment.h"

TEST(test_grid, is_intersecting__not_intersection_internal__returns_false) {
    std::vector border{Border(Point(0, 0), Point(0, 10)),
                       Border(Point(0, 10), Point(10, 10)),
                       Border(Point(10, 10), Point(10, 0)),
                       Border(Point(0, 0), Point(10, 0))};
    Grid grid(std::span{border});
    Segment direction(Point(1, 1), Point(2, 2));

    bool result = grid.is_intersecting(direction);

    ASSERT_FALSE(result);
}

TEST(test_grid, is_intersecting__not_intersection_external__returns_false) {
    std::vector border{Border(Point(0, 0), Point(0, 10)),
                       Border(Point(2, 10), Point(10, 10)),
                       Border(Point(10, 10), Point(10, 0)),
                       Border(Point(0, 0), Point(10, 0))};
    Grid grid(std::span{border});
    Segment direction(Point(1, 1), Point(1, 20));

    bool result = grid.is_intersecting(direction);

    ASSERT_FALSE(result);
}

TEST(test_grid, is_intersecting__intersection__returns_true) {
    std::vector border{Border(Point(0, 0), Point(0, 10)),
                       Border(Point(0, 10), Point(10, 10)),
                       Border(Point(10, 10), Point(10, 0)),
                       Border(Point(0, 0), Point(10, 0))};
    Grid grid(std::span{border});
    Segment direction(Point(1, 1), Point(20, 20));

    bool result = grid.is_intersecting(direction);

    ASSERT_TRUE(result);
}
