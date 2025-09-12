#include "person.h"

#include <algorithm>
#include <map>
#include <unordered_map>
#include <vector>

#include "actions.h"
#include "point.h"
#include "segment.h"

Person::Person(Point position, Point goal, Grid *grid)
    : _position(position), _goal(goal), _personal_grid(grid) {}

int Person::h(const Point &point) const noexcept {
    return static_cast<int>((_goal - point).abs_norm());
}

// f is priority, g is cost
std::optional<std::vector<Action>> Person::calculate_route() const {
    if (_position == _goal) {
        return std::vector<Action>{};
    }
    std::multimap<int, Point> f_to_point;
    std::unordered_map<Point, std::multimap<int, Point>::iterator>
        point_to_iterator;
    std::unordered_map<Point, int> point_to_g;
    std::unordered_map<Point, Point> previous_in_route;
    auto iterator = f_to_point.emplace(0, _position);
    point_to_iterator[_position] = iterator;
    point_to_g[_position] = 0;
    while (!f_to_point.empty()) {
        auto first_node = f_to_point.begin();
        Point current_position = first_node->second;
        int current_f = first_node->first;
        f_to_point.erase(first_node);
        point_to_iterator.erase(current_position);
        if (current_position == _goal) {
            break;
        }
        for (const auto &position : current_position.get_neighbors()) {
            if (_personal_grid->is_intersecting(
                    Segment(current_position, position)) ||
                position.get_x() > _personal_grid->get_upper_right().get_x() ||
                position.get_x() < _personal_grid->get_lower_left().get_x() ||
                position.get_y() > _personal_grid->get_upper_right().get_y() ||
                position.get_y() < _personal_grid->get_lower_left().get_y()) {
                continue;
            }
            int new_g = current_f + 1;
            if (!point_to_g.contains(position) ||
                new_g < point_to_g[position]) {
                point_to_g[position] = new_g;
                int f = new_g + h(position);
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
    if (!previous_in_route.contains(_goal)) {
        return std::nullopt;
    }
    std::vector<Action> reverse_route;
    Point last_position = _goal;
    while (last_position != _position) {
        Point previous_step = previous_in_route.find(last_position)->second;
        reverse_route.push_back(previous_step.to_another(last_position));
        last_position = previous_step;
    }
    std::reverse(reverse_route.begin(), reverse_route.end());
    return reverse_route;
}
