#include "simple_planner.h"
#include <algorithm>
#include <map>
#include <unordered_map>


SimplePlanner::SimplePlanner(const std::vector<Person>& persons, Grid* grid)
    : Planner(persons, grid) {}

std::vector<std::vector<Action>> SimplePlanner::plan_all_routes() {
    std::vector<std::vector<Action>> routes;
    routes.reserve(_persons.size());
    for (auto person: _persons) {
        auto route = calculate_route(person);
        if (route) {
            routes.push_back(route.value());
        }
        else {
            routes.push_back(std::vector<Action>{});
        }
    }
    return routes;
}

std::optional<std::vector<Action>> SimplePlanner::calculate_route(const Person& person) const {
    auto start_position = person.get_position();
    auto goal = person.get_goal();
    if (start_position == goal) {
        return std::vector<Action>{};
    }
    std::multimap<int, Point> f_to_point;
    std::unordered_map<Point, std::multimap<int, Point>::iterator>
        point_to_iterator;
    std::unordered_map<Point, int> point_to_g;
    std::unordered_map<Point, Point> previous_in_route;
    auto iterator = f_to_point.emplace(0, start_position);
    point_to_iterator[start_position] = iterator;
    point_to_g[start_position] = 0;
    while (!f_to_point.empty()) {
        auto first_node = f_to_point.begin();
        Point current_position = first_node->second;
        int current_f = first_node->first;
        f_to_point.erase(first_node);
        point_to_iterator.erase(current_position);
        if (current_position == goal) {
            break;
        }
        for (const auto &position : current_position.get_neighbors()) {
            if (_grid->is_intersecting(
                    Segment(current_position, position)) ||
                position.get_x() > _grid->get_upper_right().get_x() ||
                position.get_x() < _grid->get_lower_left().get_x() ||
                position.get_y() > _grid->get_upper_right().get_y() ||
                position.get_y() < _grid->get_lower_left().get_y()) {
                continue;
            }
            int new_g = current_f + (position - current_position).diag_norm_multiplied2();
            if (!point_to_g.contains(position) ||
                new_g < point_to_g[position]) {
                point_to_g[position] = new_g;
                int f = new_g + h(person, position);
                if (point_to_iterator.contains(position)) {
                    f_to_point.erase(point_to_iterator[position]);
                }
                auto multimap_iterator =
                    f_to_point.emplace(f, position);
                point_to_iterator[position] = multimap_iterator;
                previous_in_route.insert_or_assign(position, current_position);
            }
        }
    }
    if (!previous_in_route.contains(goal)) {
        return std::nullopt;
    }
    std::vector<Action> reverse_route;
    Point last_position = goal;
    while (last_position != start_position) {
        Point previous_step = previous_in_route.find(last_position)->second;
        reverse_route.push_back(previous_step.to_another(last_position));
        last_position = previous_step;
    }
    std::reverse(reverse_route.begin(), reverse_route.end());
    return reverse_route;
}