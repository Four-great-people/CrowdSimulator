#include "person.h"

#include <algorithm>
#include <map>
#include <unordered_map>
#include <vector>
#include "point.h"
#include "segment.h"

Person::Person(Point position, Point goal, Grid *grid)
    : _position(position),
      _goal(goal),
      _personal_grid(grid) {}

std::vector<Point> Person::calculate_route() const {
    if (_position == _goal) {
        return {_position};
    }
    std::multimap<int, Point> priority_to_point;
    std::unordered_map<Point, std::multimap<int, Point>::iterator> point_to_iterator; 
    std::unordered_map<Point, int> point_to_cost;
    std::unordered_map<Point, Point> previous_in_route;
    auto iterator = priority_to_point.emplace(0, _position);
    point_to_iterator[_position] = iterator;
    point_to_cost[_position] = 0;
    while (!priority_to_point.empty()) {
        auto first_node = priority_to_point.begin();
        Point current_position = first_node->second;
        int current_priority = first_node->first;
        priority_to_point.erase(first_node);
        point_to_iterator.erase(current_position);
        if (current_position == _goal) {
            break;
        }
        for (const auto &position : current_position.get_neighbors()) {
            if (_personal_grid->is_intersecting(Segment(current_position, position))) {
                continue;
            }
            int new_cost = current_priority + 1;
            if (!point_to_cost.contains(position) || new_cost < point_to_cost[position]) {
                point_to_cost[_position] = new_cost;
                int priority = new_cost + (_goal - position).abs_norm();
                if (point_to_iterator.contains(position)) {
                    priority_to_point.erase(point_to_iterator[position]);
                }
                auto multimap_iterator = priority_to_point.emplace(priority, position);
                point_to_iterator[position] = multimap_iterator;
                previous_in_route.emplace(position, current_position);
            }
        }
    }
    if (!previous_in_route.contains(_goal)) {
        return {};
    }
    std::vector<Point> reverse_route = {_goal};
    while (reverse_route.back() != _position) {
        reverse_route.push_back(previous_in_route.find(reverse_route.back())->second);
    }
    std::reverse(reverse_route.begin(), reverse_route.end());
    return reverse_route;
}
