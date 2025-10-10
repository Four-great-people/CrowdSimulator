#include "prioritized_planner.h"
#include "catable.h"
#include "timed_node.h"
#include <unordered_set>
#include <queue>
#include <algorithm>

PrioritizedPlanner::PrioritizedPlanner(const std::vector<Person>& persons, Grid* grid)
    : Planner(persons, grid) {}

std::vector<int> PrioritizedPlanner::get_priorities_shortest_first() const {
    std::vector<std::pair<int, int>> data;
    
    for (int i = 0; i < _persons.size(); ++i) {
        Point start = _persons[i].get_position();
        Point goal = _persons[i].get_goal();
        int distance = std::abs(start.get_x() - goal.get_x()) + 
                      std::abs(start.get_y() - goal.get_y());
        data.push_back({distance, i});
    }
    
    std::sort(data.begin(), data.end());
    
    std::vector<int> indices(_persons.size());
    for (int i = 0; i < data.size(); ++i) {
        int length = data[i].first;
        int pos = data[i].second;
        indices[pos] = i;
    }
    
    return indices;
}

std::vector<std::vector<Action>> PrioritizedPlanner::plan_all_routes() {
    auto indices = get_priorities_shortest_first();
    
    ca_table = CATable();
    std::vector<std::vector<Action>> results(_persons.size());
    
    for (int priority = 0; priority < _persons.size(); ++priority) {
        int agent_id = -1;
        for (int j = 0; j < _persons.size(); ++j) {
            if (indices[j] == priority) {
                agent_id = j;
                break;
            }
        }
        
        auto route = calculate_route(_persons[agent_id]);
        
        if (route) {
            results[agent_id] = *route;
            
            std::vector<Point> trajectory;
            Point current = _persons[agent_id].get_position();
            trajectory.push_back(current);
            
            for (const auto& action : *route) {
                current = current + action;
                trajectory.push_back(current);
            }
            
            ca_table.add_trajectory(agent_id, trajectory);
        } else {
            results[agent_id] = std::vector<Action>{};
        }
    }
    
    return results;
}

std::optional<std::vector<Action>> PrioritizedPlanner::calculate_route(const Person& person) const {
    auto start_position = person.get_position();
    auto goal = person.get_goal();
    if (start_position == goal) {
        return std::vector<Action>{};
    }

    const int MAX_TIME = 1000;
    
    using NodeQueue = std::priority_queue<std::shared_ptr<TimedNode>, 
                                         std::vector<std::shared_ptr<TimedNode>>, 
                                         TimedNode::Compare>;
    NodeQueue open;
    std::unordered_set<TimePoint, TimePointHash> visited;
    
    auto start_node = std::make_shared<TimedNode>(start_position, 0, h(person, goal), 0);
    open.push(start_node);
    visited.insert({start_position.get_x(), start_position.get_y(), 0});
    
    int steps = 0;
    while (!open.empty() && steps < MAX_TIME) {
        auto current = open.top();
        open.pop();
        
        if (current->position == goal) {
            std::vector<Action> path;
            auto node = current;
            while (node->parent != nullptr) {
                path.push_back(node->parent->position.to_another(node->position));
                node = node->parent;
            }
            std::reverse(path.begin(), path.end());
            return path;
        }
        
        auto neighbors = ca_table.get_neighbors_timestep(current->position, current->time);
        
        for (const auto& neighbor : neighbors) {
            if (_grid->is_intersecting(Segment(current->position, neighbor)) ||
                neighbor.get_x() > _grid->get_upper_right().get_x() ||
                neighbor.get_x() < _grid->get_lower_left().get_x() ||
                neighbor.get_y() > _grid->get_upper_right().get_y() ||
                neighbor.get_y() < _grid->get_lower_left().get_y()) {
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
            
            int new_h = h(person, neighbor);
            auto new_node = std::make_shared<TimedNode>(neighbor, new_g, new_h, new_time, current);
            open.push(new_node);
            visited.insert(new_tp);
        }
        
        steps++;
    }
    
    return std::nullopt;
}