#include <gtest/gtest.h>

#include <vector>

#include "actions.h"
#include "grid.h"
#include "person.h"
#include "point.h"

TEST(test_person, calculate_route__same_point__returns_empty_vector) {
    std::vector border{Border(Point(0, 0), Point(0, 10)),
                       Border(Point(0, 10), Point(10, 10)),
                       Border(Point(10, 10), Point(10, 0)),
                       Border(Point(0, 0), Point(10, 0))};
    Grid grid(border);
    Person person(0, Point(1, 1), Point(1, 1), &grid);
    
    auto route = person.calculate_route();

    ASSERT_TRUE(route.has_value());
    ASSERT_EQ(route.value().size(), 0);
}

TEST(test_person, calculate_route__another_point__returns_route) {
    std::vector border{Border(Point(0, 0), Point(0, 10)),
                       Border(Point(0, 10), Point(10, 10)),
                       Border(Point(10, 10), Point(10, 0)),
                       Border(Point(0, 0), Point(10, 0))};
    Grid grid(border);
    Person person(0, Point(1, 1), Point(1, 2), &grid);
    
    auto route = person.calculate_route();

    ASSERT_TRUE(route.has_value());
    ASSERT_EQ(route.value().size(), 1);
    ASSERT_EQ(route.value()[0], Action::UP);
}

TEST(test_person, calculate_route__far_away_point__returns_route) {
    std::vector border{Border(Point(0, 0), Point(0, 10)),
                       Border(Point(2, 10), Point(10, 10)),
                       Border(Point(10, 10), Point(10, 0)),
                       Border(Point(0, 0), Point(10, 0))};
    Grid grid(border);
    Person person(0, Point(1, 1), Point(1, 20), &grid);
    
    auto route = person.calculate_route();

    ASSERT_TRUE(route.has_value());
    ASSERT_EQ(route.value().size(), 19);
    for (int i = 0; i < route.value().size(); ++i) {
        ASSERT_EQ(route.value()[i], Action::UP);
    }
}

TEST(test_person, calculate_route__unreachable_point_inside__returns_nullopt) {
    std::vector border{Border(Point(0, 0), Point(0, 10)),
                       Border(Point(0, 10), Point(10, 10)),
                       Border(Point(10, 10), Point(10, 0)),
                       Border(Point(0, 0), Point(10, 0))};
    Grid grid(border);
    Person person(0, Point(1, 1), Point(1, 20), &grid);
    
    auto route = person.calculate_route();

    ASSERT_FALSE(route.has_value());
}

TEST(test_person, calculate_route__unreachable_point_outside__returns_nullopt) {
    std::vector border{Border(Point(0, 0), Point(0, 10)),
                       Border(Point(0, 10), Point(10, 10)),
                       Border(Point(10, 10), Point(10, 0)),
                       Border(Point(0, 0), Point(10, 0))};
    Grid grid(border);
    Person person(0, Point(1, 20), Point(1, 1), &grid);
    
    auto route = person.calculate_route();

    ASSERT_FALSE(route.has_value());
}
