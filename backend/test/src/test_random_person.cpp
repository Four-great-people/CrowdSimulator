#include <gtest/gtest.h>

#include <random>

#include "grid.h"
#include "person.h"
#include "point.h"
#include "segment.h"

TEST(test_person, random_test) {
    std::random_device device;
    std::mt19937 generator(device());
    std::uniform_int_distribution<std::mt19937::result_type> distribution(0,
                                                                          50);
    std::uniform_int_distribution<std::mt19937::result_type>
        direction_distribution(0, 3);
    for (int i = 0; i < 1000; ++i) {
        std::vector<Segment> border;
        int border_size = distribution(generator);
        for (int j = 0; j < border_size; ++j) {
            border.push_back(Segment(
                Point(distribution(generator), distribution(generator)),
                Point(distribution(generator), distribution(generator))));
        }
        Grid grid(border);
        Point finish(distribution(generator), distribution(generator));
        Point start = finish;
        int try_steps = distribution(generator);
        while (try_steps--) {
            int direction_index = direction_distribution(generator);
            std::vector<Point> neighbors = finish.get_neighbors();
            Segment move(finish, neighbors[direction_index]);
            if (grid.is_intersecting(move) ||
                neighbors[direction_index].get_x() > grid.get_upper_right().get_x() ||
                neighbors[direction_index].get_y() > grid.get_upper_right().get_y() ||
                neighbors[direction_index].get_x() < grid.get_lower_left().get_x() ||
                neighbors[direction_index].get_y() < grid.get_lower_left().get_y()) {
                continue;
            }
            finish = neighbors[direction_index];
        }
        Person person(start, finish, &grid);
        auto route = person.calculate_route();
        ASSERT_TRUE(route.has_value());
        Point current_point = start;
        for (auto action : route.value()) {
            Point next_point = current_point + action;
            ASSERT_FALSE(grid.is_intersecting(Segment(current_point, next_point)));
            current_point = next_point;
        }
        ASSERT_EQ(current_point, finish);
    }
}
