#include <gtest/gtest.h>
#include <gmock/gmock.h>

#include <vector>

#include <iostream>
#include "actions.h"
#include "grid.h"
#include "person.h"
#include "point.h"
#include "prioritized_planner.h"

TEST(test_person, calculate_route__same_point__returns_empty_vector) {
    std::vector border{Border(Point(0, 0), Point(0, 10)),
                       Border(Point(0, 10), Point(10, 10)),
                       Border(Point(10, 10), Point(10, 0)),
                       Border(Point(0, 0), Point(10, 0))};
    Grid grid(border);
    Person person(0, Point(1, 1), Point(1, 1), &grid);
    
    auto route = person.calculate_route_with_timesteps(nullptr);

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
    
    auto route = person.calculate_route_with_timesteps(nullptr);

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
    
    auto route = person.calculate_route_with_timesteps(nullptr);

    ASSERT_TRUE(route.has_value());
    ASSERT_EQ(route.value().size(), 19);
    for (int i = 0; i < route.value().size(); ++i) {
        ASSERT_EQ(route.value()[i], Action::UP);
    }
}

TEST(test_person, calculate_route__diagonal_point__returns_efficient_route) {
    std::vector border{Border(Point(0, 0), Point(0, 10)),
                       Border(Point(2, 10), Point(10, 10)),
                       Border(Point(10, 10), Point(10, 0)),
                       Border(Point(0, 0), Point(10, 0))};
    Grid grid(border);
    Person person(0, Point(1, 1), Point(3, 3), &grid);
    
    auto route = person.calculate_route_with_timesteps(nullptr);

    ASSERT_TRUE(route.has_value());
    ASSERT_EQ(route.value().size(), 2);
    ASSERT_EQ(route.value()[0], Action::RIGHT_UP);
    ASSERT_EQ(route.value()[1], Action::RIGHT_UP);
}

TEST(test_person, calculate_route__forbidden_corner_move_diagonal_open__returns_not_simple_route) {
    std::vector border{Border(Point(0, 2), Point(2, 2)),
                       Border(Point(2, 2), Point(2, 0))};
    Grid grid(border);
    Person person(0, Point(1, 1), Point(2, 2), &grid);
    
    auto route = person.calculate_route_with_timesteps(nullptr);

    ASSERT_TRUE(route.has_value());
    ASSERT_GT(route.value().size(), 1);
}

TEST(test_person, calculate_route__forbidden_corner_move_diagonal_close__returns_not_simple_route) {
    std::vector border{Border(Point(0, 2), Point(2, 2)),
                       Border(Point(2, 2), Point(2, 0))};
    Grid grid(border);
    Person person(0, Point(2, 1), Point(1, 2), &grid);
    
    auto route = person.calculate_route_with_timesteps(nullptr);

    ASSERT_TRUE(route.has_value());
    ASSERT_GT(route.value().size(), 1);
}

TEST(test_person, calculate_route__not_only_diagonal_point__returns_efficient_route) {
    std::vector border{Border(Point(0, 0), Point(0, 10)),
                       Border(Point(2, 10), Point(10, 10)),
                       Border(Point(10, 10), Point(10, 0)),
                       Border(Point(0, 0), Point(10, 0))};
    Grid grid(border);
    Person person(0, Point(1, 1), Point(2, 3), &grid);
    
    auto route = person.calculate_route_with_timesteps(nullptr);

    ASSERT_TRUE(route.has_value());
    ASSERT_EQ(route.value().size(), 2);
    ASSERT_THAT(route.value(), ::testing::Contains(Action::RIGHT_UP));
}

TEST(test_person, calculate_route__unreachable_point_inside__returns_nullopt) {
    std::vector border{Border(Point(0, 0), Point(0, 10)),
                       Border(Point(0, 10), Point(10, 10)),
                       Border(Point(10, 10), Point(10, 0)),
                       Border(Point(0, 0), Point(10, 0))};
    Grid grid(border);
    Person person(0, Point(1, 1), Point(1, 20), &grid);
    
    auto route = person.calculate_route_with_timesteps(nullptr);

    ASSERT_FALSE(route.has_value());
}

TEST(test_person, calculate_route__unreachable_point_outside__returns_nullopt) {
    std::vector border{Border(Point(0, 0), Point(0, 10)),
                       Border(Point(0, 10), Point(10, 10)),
                       Border(Point(10, 10), Point(10, 0)),
                       Border(Point(0, 0), Point(10, 0))};
    Grid grid(border);
    Person person(0, Point(1, 20), Point(1, 1), &grid);
    
    auto route = person.calculate_route_with_timesteps(nullptr);

    ASSERT_FALSE(route.has_value());
}

TEST(test_person, calculate_route__two_agents_no_conflicts__returns_routes) {
    std::vector<Border> borders;
    Grid grid(borders, Point(0, 0), Point(5, 5));
    std::vector<Person> persons;
    persons.emplace_back(0, Point(1, 1), Point(1, 3), &grid);
    persons.emplace_back(1, Point(3, 1), Point(3, 3), &grid);
    
    PrioritizedPlanner planner(persons, &grid);
    auto routes = planner.plan_all_routes();
    
    ASSERT_EQ(routes.size(), 2);
    ASSERT_GT(routes[0].size(), 0);
    ASSERT_GT(routes[1].size(), 0);
}

TEST(test_person, calculate_route__two_agents_crossing_paths__returns_is_detour) {
    std::vector<Border> borders;
    Grid grid(borders, Point(0, 0), Point(2, 2));
    
    std::vector<Person> persons;
    persons.emplace_back(0, Point(0, 1), Point(2, 1), &grid);
    persons.emplace_back(1, Point(1, 0), Point(1, 2), &grid);
    
    PrioritizedPlanner planner(persons, &grid);
    auto routes = planner.plan_all_routes();
    
    ASSERT_EQ(routes.size(), 2);
    
    bool has_detour = routes[0].size() > 2 || routes[1].size() > 2;
    ASSERT_TRUE(has_detour);
}