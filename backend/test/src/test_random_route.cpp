#include <gtest/gtest.h>

#include <random>
#include <vector>

#include "grid.h"
#include "person.h"
#include "point.h"
#include "prioritized_planner.h"
#include "segment.h"
#include "simple_planner.h"

Point random_move(int try_steps, std::mt19937 &generator, Point finish,
                  const Grid &grid) {
    std::uniform_int_distribution<std::mt19937::result_type>
        direction_distribution(0, 3);
    while (try_steps--) {
        int direction_index =
            static_cast<int>(direction_distribution(generator));
        std::vector<Point> neighbors = finish.get_neighbors();
        Segment move(finish,
                     neighbors[static_cast<std::size_t>(direction_index)]);
        if (grid.is_intersecting(move) ||
            neighbors[static_cast<std::size_t>(direction_index)].get_x() >
                grid.get_upper_right().get_x() ||
            neighbors[static_cast<std::size_t>(direction_index)].get_y() >
                grid.get_upper_right().get_y() ||
            neighbors[static_cast<std::size_t>(direction_index)].get_x() <
                grid.get_lower_left().get_x() ||
            neighbors[static_cast<std::size_t>(direction_index)].get_y() <
                grid.get_lower_left().get_y()) {
            continue;
        }
        finish = neighbors[static_cast<std::size_t>(direction_index)];
    }
    return finish;
}

TEST(test_person, random_test_simple_planner) {
    std::random_device device;
    std::mt19937 generator(device());
    std::uniform_int_distribution<std::mt19937::result_type> distribution(0,
                                                                          50);
    for (int i = 0; i < 1000; ++i) {
        std::vector<Border> border;
        int border_size = static_cast<int>(distribution(generator));
        for (int j = 0; j < border_size; ++j) {
            border.push_back(
                Border(Point(static_cast<int>(distribution(generator)),
                             static_cast<int>(distribution(generator))),
                       Point(static_cast<int>(distribution(generator)),
                             static_cast<int>(distribution(generator)))));
        }
        Grid grid(border);
        Point start(static_cast<int>(distribution(generator)),
                    static_cast<int>(distribution(generator)));
        int try_steps = static_cast<int>(distribution(generator));
        Point finish = random_move(try_steps, generator, start, grid);
        Person person(0, start);
        Goal goal(0, finish);
        SimplePlanner planner({person}, {goal}, &grid);
        auto route = planner.calculate_route(person);
        ASSERT_TRUE(route.has_value());
        Point current_point = start;
        for (auto action : route.value()) {
            Point next_point = current_point + action;
            ASSERT_FALSE(
                grid.is_intersecting(Segment(current_point, next_point)));
            current_point = next_point;
        }
        ASSERT_EQ(current_point, finish);
    }
}

TEST(test_person, random_test_prioritized_planner) {
    std::random_device device;
    std::mt19937 generator(device());
    std::uniform_int_distribution<std::mt19937::result_type> distribution(0,
                                                                          50);
    std::uniform_int_distribution<std::mt19937::result_type>
        direction_distribution(0, 3);
    std::uniform_int_distribution<std::mt19937::result_type>
        wall_direction_distribution(0, 1);
    for (int i = 0; i < 1000; ++i) {
        std::vector<Border> border;
        int border_size = static_cast<int>(distribution(generator));
        for (int j = 0; j < border_size; ++j) {
            int same_coord = static_cast<int>(distribution(generator));
            int diff_coord_2 = static_cast<int>(distribution(generator));
            int diff_coord_1 = static_cast<int>(distribution(generator));
            int direction = static_cast<int>(wall_direction_distribution(generator));
            if (direction == 0) {
                border.push_back(Border(
                    Point(same_coord, diff_coord_1),
                    Point(same_coord, diff_coord_2)));
            }
            else {
                border.push_back(Border(
                    Point(diff_coord_1, same_coord),
                    Point(diff_coord_2, same_coord)));
            }
            
        }
        Grid grid(border);
        Point start(static_cast<int>(distribution(generator)),
                    static_cast<int>(distribution(generator)));
        int try_steps = static_cast<int>(distribution(generator));
        Point finish = random_move(try_steps, generator, start, grid);
        Person person(0, start);
        Goal goal(0, finish);
        PrioritizedPlanner planner({person}, {goal}, &grid);
        auto route = planner.calculate_route(person);
        ASSERT_TRUE(route.has_value());
        Point current_point = start;
        for (auto action : route.value()) {
            Point next_point = current_point + action;
            ASSERT_FALSE(
                grid.is_intersecting(Segment(current_point, next_point)));
            current_point = next_point;
        }
        ASSERT_EQ(current_point, finish);
    }
}

TEST(test_person, random_test_random_planner) {
    std::random_device device;
    std::mt19937 generator(device());
    std::uniform_int_distribution<std::mt19937::result_type> distribution(0,
                                                                          50);
    std::uniform_int_distribution<std::mt19937::result_type>
        direction_distribution(0, 3);
    for (int i = 0; i < 1000; ++i) {
        std::vector<Border> border;
        int border_size = static_cast<int>(distribution(generator));
        for (int j = 0; j < border_size; ++j) {
            border.push_back(
                Border(Point(static_cast<int>(distribution(generator)),
                             static_cast<int>(distribution(generator))),
                       Point(static_cast<int>(distribution(generator)),
                             static_cast<int>(distribution(generator)))));
        }
        Grid grid(border);
        Point start(static_cast<int>(distribution(generator)),
                    static_cast<int>(distribution(generator)));
        int try_steps = static_cast<int>(distribution(generator));
        Point finish = random_move(try_steps, generator, start, grid);
        Person person(0, start);
        Goal goal(0, finish);
        PrioritizedPlanner planner({person}, {goal}, &grid);
        auto route = planner.plan_all_routes()[0];
        Point current_point = start;
        for (auto action : route) {
            Point next_point = current_point + action;
            ASSERT_FALSE(
                grid.is_intersecting(Segment(current_point, next_point)));
            current_point = next_point;
        }
        ASSERT_EQ(current_point, finish);
    }
}
