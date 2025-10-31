#include "prioritized_planner.h"
#include "catable.h"
#include "timed_node.h"
#include <unordered_set>
#include <queue>
#include <algorithm>

PrioritizedPlanner::PrioritizedPlanner(const std::vector<Person>& persons, const std::vector<Goal>& goals, Grid* grid)
    : Planner(persons, goals, grid) {}

std::vector<int> PrioritizedPlanner::get_priorities_shortest_first() const {
    std::vector<std::pair<int, int>> data;
    
    for (int i = 0; i < _persons.size(); ++i) {
        int distance = h(_persons[i].get_position());
        data.push_back({distance, i});
    }
    
    std::sort(data.begin(), data.end());
    
    std::vector<int> indices(_persons.size());
    for (int i = 0; i < data.size(); ++i) {
        int length = data[i].first;
        int pos = data[i].second;
        indices[i] = pos;
    }
    
    return indices;
}

std::vector<std::vector<Action>> PrioritizedPlanner::plan_all_routes() {
    auto indices = get_priorities_shortest_first();
    
    ca_table = CATable();
    stops.clear();
    std::vector<std::vector<Action>> results(_persons.size());
    bool changed = true;
    while (changed) {
        fill(results.begin(), results.end(), std::vector<Action>());
        for (int priority = 0; priority < _persons.size(); ++priority) {
            int agent_id = indices[priority];
            
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
        changed = validate_results(results);
    }
    
    return results;
}

bool PrioritizedPlanner::validate_results(std::vector<std::vector<Action>>& results) {
    bool changed = false;
    for (int agent_id = 0; agent_id < results.size(); ++agent_id) {
        if (results[agent_id].size() == 0) {
            auto position = _persons[agent_id].get_position();
            if (stops.find(position) == stops.end()) {
                stops.insert(position);
                changed = true;
            }
        }
    }
    return changed;
}

std::optional<std::vector<Action>> PrioritizedPlanner::calculate_route(const Person& person) const {
    if (is_reached_goal(person.get_position())) {
        return std::vector<Action>();
    }
    
    auto start_position = person.get_position();

    const int MAX_TIME = 50000;
    
    using NodeQueue = std::priority_queue<std::shared_ptr<TimedNode>, 
                                         std::vector<std::shared_ptr<TimedNode>>, 
                                         TimedNode::Compare>;
    NodeQueue open;
    std::unordered_set<TimePoint, TimePointHash> visited;
    
    auto start_node = std::make_shared<TimedNode>(start_position, 0, h(person.get_position()), 0);
    open.push(start_node);
    visited.insert({start_position.get_x(), start_position.get_y(), 0});
    
    int steps = 0;
    while (!open.empty() && steps < MAX_TIME) {
        auto current = open.top();
        open.pop();
        
        if (is_reached_goal(current->position)) {
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
            if (_grid->is_incorrect_move(Segment(current->position, neighbor))||
                stops.find(current->position) != stops.end()) {
                continue;
            }
            
            int move_cost = (neighbor - current->position).diag_norm_multiplied2();
            if (neighbor == current->position) {
                move_cost += CATable::wait_cost;
            }
            int new_g = current->g + move_cost;
            int new_time = current->time + move_cost;
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