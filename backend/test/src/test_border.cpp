#include <gtest/gtest.h>

#include "border.h"
#include "point.h"
#include "segment.h"

TEST(test_border, is_intersecting__same_segment__returns_false) {
    Point start(0, 0);
    Point finish(1, 1);
    Segment segment(start, finish);
    Border border(segment);

    bool result = border.is_intersecting(segment);

    ASSERT_FALSE(result);
}