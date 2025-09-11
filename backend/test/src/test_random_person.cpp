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
        Point current(distribution(generator), distribution(generator));
        Point start = current;
        int try_steps = distribution(generator);
        while (try_steps--) {
            int direction_index = direction_distribution(generator);
            std::vector<Point> neighbors = current.get_neighbors();
            Segment move(current, neighbors[direction_index]);
            if (grid.is_intersecting(move) ||
                neighbors[direction_index].get_x() > grid.get_upper_right().get_x() ||
                neighbors[direction_index].get_y() > grid.get_upper_right().get_y() ||
                neighbors[direction_index].get_x() < grid.get_lower_left().get_x() ||
                neighbors[direction_index].get_y() < grid.get_lower_left().get_y()) {
                continue;
            }
            current = neighbors[direction_index];
        }
        Person person(start, current, &grid);
        std::vector<Point> route = person.calculate_route();
        ASSERT_GT(route.size(), 0);
        ASSERT_EQ(route[0], start);
        ASSERT_EQ(route.back(), current);
        for (int j = 1; j < route.size(); ++j) {
            ASSERT_FALSE(grid.is_intersecting(Segment(route[j - 1], route[j])));
        }
    }
}
