#include <gtest/gtest.h>

#include "point.h"
#include "segment.h"

TEST(test_segment, is_intersecting__same_segment__returns_true) {
    Point start(0, 0);
    Point finish(1, 1);
    Segment segment(start, finish);
    Segment another_segment = segment;

    bool result = segment.is_intersecting(another_segment);

    ASSERT_TRUE(result);
}

TEST(test_segment, is_intersecting__parallel__returns_false) {
    Point start_one(0, 0);
    Point finish_one(1, 1);
    Point start_two(1, 0);
    Point finish_two(2, 1);
    Segment segment(start_one, finish_one);
    Segment another_segment(start_two, finish_two);

    bool result = segment.is_intersecting(another_segment);

    ASSERT_FALSE(result);
}

TEST(test_segment, is_intersecting__on_one_line_without_intersecting_points__returns_true) {
    Point start_one(0, 0);
    Point finish_one(0, 2);
    Point start_two(0, 1);
    Point finish_two(0, 3);
    Segment segment(start_one, finish_one);
    Segment another_segment(start_two, finish_two);

    bool result = segment.is_intersecting(another_segment);

    ASSERT_TRUE(result);
}