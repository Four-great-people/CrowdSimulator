#include <gtest/gtest.h>

#include <vector>

#include "grid.h"
#include "person.h"
#include "point.h"

TEST(test_person, calculate_route__same_point__returns_same) {
    std::vector border{Segment(Point(0, 0), Point(0, 10)),
                       Segment(Point(0, 10), Point(10, 10)),
                       Segment(Point(10, 10), Point(10, 0)),
                       Segment(Point(0, 0), Point(10, 0))};
    Grid grid(border);
    Person person(Point(1, 1), Point(1, 1), &grid);
    
    std::vector<Point> route = person.calculate_route();

    ASSERT_EQ(route.size(), 1);
    ASSERT_EQ(route[0], Point(1, 1));
}

TEST(test_person, calculate_route__another_point__returns_route) {
    std::vector border{Segment(Point(0, 0), Point(0, 10)),
                       Segment(Point(0, 10), Point(10, 10)),
                       Segment(Point(10, 10), Point(10, 0)),
                       Segment(Point(0, 0), Point(10, 0))};
    Grid grid(border);
    Person person(Point(1, 1), Point(1, 2), &grid);
    
    std::vector<Point> route = person.calculate_route();

    ASSERT_EQ(route.size(), 2);
    ASSERT_EQ(route[0], Point(1, 1));
    ASSERT_EQ(route[1], Point(1, 2));
}

TEST(test_person, calculate_route__far_away_point__returns_route) {
    std::vector border{Segment(Point(0, 0), Point(0, 10)),
                       Segment(Point(2, 10), Point(10, 10)),
                       Segment(Point(10, 10), Point(10, 0)),
                       Segment(Point(0, 0), Point(10, 0))};
    Grid grid(border);
    Person person(Point(1, 1), Point(1, 20), &grid);
    
    std::vector<Point> route = person.calculate_route();

    ASSERT_GT(route.size(), 2);
    ASSERT_EQ(route[0], Point(1, 1));
    ASSERT_EQ(route.back(), Point(1, 20));
}

TEST(test_person, calculate_route__unreachable_point_inside__returns_empty_vector) {
    std::vector border{Segment(Point(0, 0), Point(0, 10)),
                       Segment(Point(0, 10), Point(10, 10)),
                       Segment(Point(10, 10), Point(10, 0)),
                       Segment(Point(0, 0), Point(10, 0))};
    Grid grid(border);
    Person person(Point(1, 1), Point(1, 20), &grid);
    
    std::vector<Point> route = person.calculate_route();

    ASSERT_EQ(route.size(), 0);
}
