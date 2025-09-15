#include <gtest/gtest.h>

#include "border.h"
#include "point.h"
#include "segment.h"

TEST(test_border, is_intersecting__same_segment__returns_false) {
    Point start(0, 0);
    Point finish(1, 0);
    Segment segment(start, finish);
    Border border(segment);

    bool result = border.is_intersecting(segment);

    ASSERT_FALSE(result);
}

TEST(test_border, is_intersecting__linear__returns_true) {
    Segment segment(Point(0, 0), Point(0, -1));
    Border border(Point(0, 0), Point(1, 0));

    bool result = border.is_intersecting(segment);

    ASSERT_TRUE(result);
}

TEST(test_border, is_intersecting__diagonal__returns_true) {
    Segment segment(Point(0, 0), Point(1, 1));
    Border border(Point(0, 0), Point(1, 1));

    bool result = border.is_intersecting(segment);

    ASSERT_TRUE(result);
}
