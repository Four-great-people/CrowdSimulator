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

enum class PlannerSetting {SIMPLE, PRIORITIZED};

std::vector<std::vector<Action>> helper_no_conflicts_test(PlannerSetting setting) {
    std::vector<Border> borders;
    Grid grid(borders, Point(0, 0), Point(5, 5));
    std::vector<Person> persons;
    persons.emplace_back(0, Point(1, 1), Point(1, 3));
    persons.emplace_back(1, Point(3, 1), Point(3, 3));


    std::vector<std::vector<Action>> routes;

    if (setting == PlannerSetting::SIMPLE) {
        SimplePlanner planner(persons, &grid);
        return planner.plan_all_routes();
    }
    if (setting == PlannerSetting::PRIORITIZED) {
        PrioritizedPlanner planner(persons, &grid);
        return planner.plan_all_routes();
    }
    return {};
}

std::vector<std::vector<Action>> helper_crossing_routes_test(PlannerSetting setting) {
    std::vector<Border> borders;
    Grid grid(borders, Point(0, 0), Point(2, 2));
    
    std::vector<Person> persons;
    persons.emplace_back(0, Point(0, 1), Point(2, 1));
    persons.emplace_back(1, Point(1, 0), Point(1, 2));


    std::vector<std::vector<Action>> routes;

    if (setting == PlannerSetting::SIMPLE) {
        SimplePlanner planner(persons, &grid);
        return planner.plan_all_routes();
    }
    if (setting == PlannerSetting::PRIORITIZED) {
        PrioritizedPlanner planner(persons, &grid);
        return planner.plan_all_routes();
    }
    return {};
}


TEST(test_person, calculate_route__two_agents_no_conflicts_simple__returns_routes) {
    auto routes = helper_no_conflicts_test(PlannerSetting::SIMPLE);
    ASSERT_EQ(routes.size(), 2);
    ASSERT_EQ(routes[0].size(), 2);
    ASSERT_EQ(routes[1].size(), 2);
}

TEST(test_person, calculate_route__two_agents_no_conflicts_prioritized__returns_routes) {
    auto routes = helper_no_conflicts_test(PlannerSetting::PRIORITIZED);
    ASSERT_EQ(routes.size(), 2);
    ASSERT_EQ(routes[0].size(), 2);
    ASSERT_EQ(routes[1].size(), 2);
}

TEST(test_person, calculate_route__two_agents_crossing_paths_prioritized__returns_no_detour) {
    auto routes = helper_crossing_routes_test(PlannerSetting::PRIORITIZED);
    
    ASSERT_EQ(routes.size(), 2);
    
    bool has_detour = routes[0].size() > 2 || routes[1].size() > 2;
    ASSERT_FALSE(has_detour);
}

TEST(test_person, calculate_route__two_agents_crossing_paths_simple__returns_is_detour) {
    auto routes = helper_crossing_routes_test(PlannerSetting::SIMPLE);
    
    ASSERT_EQ(routes.size(), 2);
    ASSERT_EQ(routes[0].size(), 2);
    ASSERT_EQ(routes[1].size(), 2);
}