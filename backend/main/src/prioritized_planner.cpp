#include "prioritized_planner.h"
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
    
    CATable ca_table;
    std::vector<std::vector<Action>> results(_persons.size());
    
    for (int priority = 0; priority < _persons.size(); ++priority) {
        int agent_id = -1;
        for (int j = 0; j < _persons.size(); ++j) {
            if (indices[j] == priority) {
                agent_id = j;
                break;
            }
        }
        
        auto route = _persons[agent_id].calculate_route_with_timesteps(&ca_table);
        
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