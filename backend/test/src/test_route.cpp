#include <gtest/gtest.h>
#include <gmock/gmock.h>

#include <vector>

#include <iostream>
#include "actions.h"
#include "grid.h"
#include "person.h"
#include "point.h"
#include "prioritized_planner.h"
#include "simple_planner.h"

TEST(test_route, calculate_route__same_point__returns_empty_vector) {
    std::vector border{Border(Point(0, 0), Point(0, 10)),
                       Border(Point(0, 10), Point(10, 10)),
                       Border(Point(10, 10), Point(10, 0)),
                       Border(Point(0, 0), Point(10, 0))};
    Grid grid(border);
    Person person(0, Point(1, 1), Point(1, 1));
   
    SimplePlanner simple_planner({person}, &grid);
    PrioritizedPlanner prioritized_planner({person}, &grid);
    auto simple_route = simple_planner.calculate_route(person);
    auto prioritized_route = prioritized_planner.calculate_route(person);

    ASSERT_TRUE(simple_route.has_value());
    ASSERT_EQ(simple_route.value().size(), 0);
    ASSERT_EQ(prioritized_route, simple_route);
}

TEST(test_route, calculate_route__another_point__returns_route) {
    std::vector border{Border(Point(0, 0), Point(0, 10)),
                       Border(Point(0, 10), Point(10, 10)),
                       Border(Point(10, 10), Point(10, 0)),
                       Border(Point(0, 0), Point(10, 0))};
    Grid grid(border);
    Person person(0, Point(1, 1), Point(1, 2));
    
    SimplePlanner simple_planner({person}, &grid);
    PrioritizedPlanner prioritized_planner({person}, &grid);
    auto simple_route = simple_planner.calculate_route(person);
    auto prioritized_route = prioritized_planner.calculate_route(person);

    ASSERT_TRUE(simple_route.has_value());
    ASSERT_EQ(simple_route.value().size(), 1);
    ASSERT_EQ(simple_route.value()[0], Action::UP);
    ASSERT_EQ(prioritized_route, simple_route);
}

TEST(test_route, calculate_route__far_away_point__returns_route) {
    std::vector border{Border(Point(0, 0), Point(0, 10)),
                       Border(Point(2, 10), Point(10, 10)),
                       Border(Point(10, 10), Point(10, 0)),
                       Border(Point(0, 0), Point(10, 0))};
    Grid grid(border);
    Person person(0, Point(1, 1), Point(1, 20));
    
    SimplePlanner simple_planner({person}, &grid);
    PrioritizedPlanner prioritized_planner({person}, &grid);
    auto simple_route = simple_planner.calculate_route(person);
    auto prioritized_route = prioritized_planner.calculate_route(person);

    ASSERT_TRUE(simple_route.has_value());
    ASSERT_EQ(simple_route.value().size(), 19);
    for (int i = 0; i < simple_route.value().size(); ++i) {
        ASSERT_EQ(simple_route.value()[i], Action::UP);
    }
    ASSERT_EQ(prioritized_route, simple_route);
}

TEST(test_route, calculate_route__diagonal_point__returns_efficient_route) {
    std::vector border{Border(Point(0, 0), Point(0, 10)),
                       Border(Point(2, 10), Point(10, 10)),
                       Border(Point(10, 10), Point(10, 0)),
                       Border(Point(0, 0), Point(10, 0))};
    Grid grid(border);
    Person person(0, Point(1, 1), Point(3, 3));
    
    SimplePlanner simple_planner({person}, &grid);
    PrioritizedPlanner prioritized_planner({person}, &grid);
    auto simple_route = simple_planner.calculate_route(person);
    auto prioritized_route = prioritized_planner.calculate_route(person);

    ASSERT_TRUE(simple_route.has_value());
    ASSERT_EQ(simple_route.value().size(), 2);
    ASSERT_EQ(simple_route.value()[0], Action::RIGHT_UP);
    ASSERT_EQ(simple_route.value()[1], Action::RIGHT_UP);
    ASSERT_EQ(prioritized_route, simple_route);
}

TEST(test_route, calculate_route__forbidden_corner_move_diagonal_open__returns_not_simple_route) {
    std::vector border{Border(Point(0, 2), Point(2, 2)),
                       Border(Point(2, 2), Point(2, 0))};
    Grid grid(border);
    Person person(0, Point(1, 1), Point(2, 2));
    
    SimplePlanner simple_planner({person}, &grid);
    PrioritizedPlanner prioritized_planner({person}, &grid);
    auto simple_route = simple_planner.calculate_route(person);
    auto prioritized_route = prioritized_planner.calculate_route(person);

    ASSERT_TRUE(simple_route.has_value());
    ASSERT_GT(simple_route.value().size(), 1);
    ASSERT_TRUE(prioritized_route.has_value());
    ASSERT_GT(prioritized_route.value().size(), 1);
}

TEST(test_route, calculate_route__forbidden_corner_move_diagonal_close__returns_not_simple_route) {
    std::vector border{Border(Point(0, 2), Point(2, 2)),
                       Border(Point(2, 2), Point(2, 0))};
    Grid grid(border);
    Person person(0, Point(2, 1), Point(1, 2));
    
    SimplePlanner simple_planner({person}, &grid);
    PrioritizedPlanner prioritized_planner({person}, &grid);
    auto simple_route = simple_planner.calculate_route(person);
    auto prioritized_route = prioritized_planner.calculate_route(person);

    ASSERT_TRUE(simple_route.has_value());
    ASSERT_GT(simple_route.value().size(), 1);
    ASSERT_TRUE(prioritized_route.has_value());
    ASSERT_GT(prioritized_route.value().size(), 1);
}

TEST(test_route, calculate_route__not_only_diagonal_point__returns_efficient_route) {
    std::vector border{Border(Point(0, 0), Point(0, 10)),
                       Border(Point(2, 10), Point(10, 10)),
                       Border(Point(10, 10), Point(10, 0)),
                       Border(Point(0, 0), Point(10, 0))};
    Grid grid(border);
    Person person(0, Point(1, 1), Point(2, 3));
    
    SimplePlanner simple_planner({person}, &grid);
    PrioritizedPlanner prioritized_planner({person}, &grid);
    auto simple_route = simple_planner.calculate_route(person);
    auto prioritized_route = prioritized_planner.calculate_route(person);

    ASSERT_TRUE(simple_route.has_value());
    ASSERT_EQ(simple_route.value().size(), 2);
    ASSERT_THAT(simple_route.value(), ::testing::Contains(Action::RIGHT_UP));
    ASSERT_TRUE(prioritized_route.has_value());
    ASSERT_EQ(prioritized_route.value().size(), 2);
    ASSERT_THAT(prioritized_route.value(), ::testing::Contains(Action::RIGHT_UP));
}

TEST(test_route, calculate_route__unreachable_point_inside__returns_nullopt) {
    std::vector border{Border(Point(0, 0), Point(0, 10)),
                       Border(Point(0, 10), Point(10, 10)),
                       Border(Point(10, 10), Point(10, 0)),
                       Border(Point(0, 0), Point(10, 0))};
    Grid grid(border);
    Person person(0, Point(1, 1), Point(1, 20));
    
    SimplePlanner simple_planner({person}, &grid);
    PrioritizedPlanner prioritized_planner({person}, &grid);
    auto simple_route = simple_planner.calculate_route(person);
    auto prioritized_route = prioritized_planner.calculate_route(person);

    ASSERT_FALSE(simple_route.has_value());
    ASSERT_EQ(prioritized_route, simple_route);
}

TEST(test_route, calculate_route__unreachable_point_outside__returns_nullopt) {
    std::vector border{Border(Point(0, 0), Point(0, 10)),
                       Border(Point(0, 10), Point(10, 10)),
                       Border(Point(10, 10), Point(10, 0)),
                       Border(Point(0, 0), Point(10, 0))};
    Grid grid(border);
    Person person(0, Point(1, 20), Point(1, 1));
    
    SimplePlanner simple_planner({person}, &grid);
    PrioritizedPlanner prioritized_planner({person}, &grid);
    auto simple_route = simple_planner.calculate_route(person);
    auto prioritized_route = prioritized_planner.calculate_route(person);

    ASSERT_FALSE(simple_route.has_value());
    ASSERT_EQ(prioritized_route, simple_route);
}

TEST(test_route, calculate_long_route) {
    std::vector border{Border(Point(1, 0), Point(1, 30))};
    Grid grid(border);
    Person person(0, Point(0, 15), Point(1, 15));
    
    SimplePlanner simple_planner({person}, &grid);
    PrioritizedPlanner prioritized_planner({person}, &grid);
    auto simple_route = simple_planner.calculate_route(person);
    auto prioritized_route = prioritized_planner.calculate_route(person);

    ASSERT_TRUE(simple_route.has_value());
    ASSERT_EQ(simple_route->size(), 31);

    ASSERT_TRUE(prioritized_route.has_value());
    ASSERT_EQ(prioritized_route->size(), 31);

}