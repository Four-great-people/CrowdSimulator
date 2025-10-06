#include "person.h"

#include <algorithm>
#include <map>
#include <unordered_map>
#include <unordered_set>
#include <vector>
#include <memory>
#include <queue>

#include "actions.h"
#include "point.h"
#include "segment.h"
#include "catable.h"
#include "timed_node.h"

Person::Person(int id, Point position, Point goal, Grid *grid)
    : _id(id), _position(position), _goal(goal), _personal_grid(grid) {}

int Person::h(const Point &point) const noexcept {
    return static_cast<int>((_goal - point).diag_norm_multiplied2());
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
            int new_g = current_f + (position - current_position).diag_norm_multiplied2();
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



std::optional<std::vector<Action>> Person::calculate_route_with_timesteps(const CATable* ca_table) const {
    if (_position == _goal) {
        return std::vector<Action>{};
    }
    
    if (ca_table == nullptr) {
        return calculate_route();
    }

    const int MAX_TIME = 1000;
    
    using NodeQueue = std::priority_queue<std::shared_ptr<TimedNode>, 
                                         std::vector<std::shared_ptr<TimedNode>>, 
                                         TimedNode::Compare>;
    NodeQueue open;
    std::unordered_set<TimePoint, TimePointHash> visited;
    
    auto start_node = std::make_shared<TimedNode>(_position, 0, h(_position), 0);
    open.push(start_node);
    visited.insert({_position.get_x(), _position.get_y(), 0});
    
    int steps = 0;
    while (!open.empty() && steps < MAX_TIME) {
        auto current = open.top();
        open.pop();
        
        if (current->position == _goal) {
            std::vector<Action> path;
            auto node = current;
            while (node->parent != nullptr) {
                path.push_back(node->parent->position.to_another(node->position));
                node = node->parent;
            }
            std::reverse(path.begin(), path.end());
            return path;
        }
        
        auto neighbors = get_neighbors_timestep(current->position, current->time, ca_table);
        
        for (const auto& neighbor : neighbors) {
            if (_personal_grid->is_intersecting(Segment(current->position, neighbor)) ||
                neighbor.get_x() > _personal_grid->get_upper_right().get_x() ||
                neighbor.get_x() < _personal_grid->get_lower_left().get_x() ||
                neighbor.get_y() > _personal_grid->get_upper_right().get_y() ||
                neighbor.get_y() < _personal_grid->get_lower_left().get_y()) {
                continue;
            }
            
            int move_cost = (neighbor - current->position).diag_norm_multiplied2();
            if (neighbor == current->position) {
                move_cost += 3;
            }
            int new_g = current->g + move_cost;
            int new_time = current->time + 1;
            TimePoint new_tp = {neighbor.get_x(), neighbor.get_y(), new_time};
            
            if (visited.find(new_tp) != visited.end()) {
                continue;
            }
            
            int new_h = h(neighbor);
            auto new_node = std::make_shared<TimedNode>(neighbor, new_g, new_h, new_time, current);
            open.push(new_node);
            visited.insert(new_tp);
        }
        
        steps++;
    }
    
    return std::nullopt;
}

std::vector<Point> Person::get_neighbors_timestep(const Point& point, int time, const CATable* ca_table) const {
    auto neighbors = point.get_neighbors();
    neighbors.push_back(point);
    
    std::vector<Point> valid_neighbors;
    for (const auto& neighbor : neighbors) {
        if (ca_table->check_move(point, neighbor, time)) {
            valid_neighbors.push_back(neighbor);
        }
    }
    
    return valid_neighbors;
}