#include <gtest/gtest.h>
#include <gmock/gmock.h>

#include <stdexcept>
#include <vector>

#include "actions.h"
#include "grid.h"
#include "person.h"
#include "point.h"
#include "prioritized_planner.h"
#include "simple_planner.h"

enum class PlannerSetting {SIMPLE, PRIORITIZED, RANDOM};

std::vector<std::vector<Action>> helper(PlannerSetting setting, const std::vector<Person> &persons, const std::vector<Goal> &goals, Grid &grid) {
    switch (setting) {
        case PlannerSetting::SIMPLE: {
            SimplePlanner planner(persons, goals, &grid);
            return planner.plan_all_routes();
        }
        case PlannerSetting::PRIORITIZED: {
            PrioritizedPlanner planner(persons, goals, &grid);
            return planner.plan_all_routes();
        }
        case PlannerSetting::RANDOM: {
            PrioritizedPlanner planner(persons, goals, &grid);
            return planner.plan_all_routes();
        }
        default:
            throw std::logic_error("probably, you have forgotten to implement this algorithm");
    }
}

std::vector<std::vector<Action>> helper_no_conflicts_test(PlannerSetting setting) {
    std::vector<Border> borders;
    Grid grid(borders, Point(0, 0), Point(5, 5));
    std::vector<Person> persons;
    persons.emplace_back(0, Point(1, 1));
    persons.emplace_back(1, Point(3, 1));
    std::vector<Goal> goals;
    goals.emplace_back(0, Point(1, 3));
    goals.emplace_back(1, Point(3, 3));
    return helper(setting, persons, goals, grid);
}

std::vector<std::vector<Action>> helper_crossing_routes_test(PlannerSetting setting) {
    std::vector<Border> borders;
    Grid grid(borders, Point(0, 0), Point(2, 2));
    std::vector<Person> persons;
    persons.emplace_back(0, Point(0, 1));
    persons.emplace_back(1, Point(0, 3));
    std::vector<Person> goals;
    goals.emplace_back(0, Point(2, 2));
    return helper(setting, persons, goals, grid);
}


TEST(test_routes, calculate_route__two_agents_no_conflicts_simple__returns_routes) {
    auto routes = helper_no_conflicts_test(PlannerSetting::SIMPLE);
    ASSERT_EQ(routes.size(), 2);
    ASSERT_EQ(routes[0].size(), 2);
    ASSERT_EQ(routes[1].size(), 2);
}

TEST(test_routes, calculate_route__two_agents_no_conflicts_prioritized__returns_routes) {
    auto routes = helper_no_conflicts_test(PlannerSetting::PRIORITIZED);
    ASSERT_EQ(routes.size(), 2);
    ASSERT_EQ(routes[0].size(), 2);
    ASSERT_EQ(routes[1].size(), 2);
}

TEST(test_routes, calculate_route__two_agents_no_conflicts_random__returns_routes) {
    auto routes = helper_no_conflicts_test(PlannerSetting::RANDOM);
    ASSERT_EQ(routes.size(), 2);
    ASSERT_GT(routes[0].size(), 0);
    ASSERT_GT(routes[1].size(), 0);
}

TEST(test_routes, calculate_route__two_agents_crossing_paths_prioritized__returns_no_detour) {
    auto routes = helper_crossing_routes_test(PlannerSetting::PRIORITIZED);
    
    ASSERT_EQ(routes.size(), 2);
    
    bool has_detour = routes[0].size() > 2 || routes[1].size() > 2;
    ASSERT_FALSE(has_detour);
}

TEST(test_routes, calculate_route__two_agents_crossing_paths_simple__returns_is_detour) {
    auto routes = helper_crossing_routes_test(PlannerSetting::SIMPLE);
    
    ASSERT_EQ(routes.size(), 2);
    ASSERT_EQ(routes[0].size(), 2);
    ASSERT_EQ(routes[1].size(), 2);
}

// There were tests about swap routes
// As far as I understand, there is no possibility for prioritized planner to generate them