#include "prioritized_planner.h"

#include <algorithm>
#include <queue>
#include <unordered_set>

#include "catable.h"
#include "timed_node.h"

PrioritizedPlanner::PrioritizedPlanner(const std::vector<Person>& persons,
                                       const std::vector<Goal>& goals,
                                       Grid* grid)
    : Planner(persons, goals, grid) {}

std::vector<int> PrioritizedPlanner::get_priorities_shortest_first() const {
    std::vector<std::pair<int, int>> data;

    for (int i = 0; i < static_cast<int>(_persons.size()); ++i) {
        int distance = h(_persons[static_cast<std::size_t>(i)].get_position());
        data.push_back({distance, i});
    }

    std::sort(data.begin(), data.end());

    std::vector<int> indices(_persons.size());
    for (int i = 0; i < static_cast<int>(data.size()); ++i) {
        int pos = data[std::size_t(i)].second;
        indices[std::size_t(i)] = pos;
    }

    return indices;
}

std::vector<std::vector<Action>> PrioritizedPlanner::plan_all_routes() {
    auto indices = get_priorities_shortest_first();
    stops.clear();
    std::vector<std::vector<Action>> results(_persons.size());
    bool changed = true;
    while (changed) {
        ca_table = CATable();
        fill(results.begin(), results.end(), std::vector<Action>());
        for (int priority = 0; priority < static_cast<int>(_persons.size());
             ++priority) {
            int agent_id = indices[std::size_t(priority)];
            auto route = calculate_route(_persons[std::size_t(agent_id)]);

            if (route) {
                results[std::size_t(agent_id)] = *route;

                std::vector<Point> trajectory;
                Point current = _persons[std::size_t(agent_id)].get_position();
                trajectory.push_back(current);

                for (const auto& action : *route) {
                    current = current + action;
                    trajectory.push_back(current);
                }

                ca_table.add_trajectory(agent_id, trajectory);
            }
        }
        changed = validate_results(results);
    }

    return results;
}

bool PrioritizedPlanner::validate_results(
    std::vector<std::vector<Action>>&
        results) {  // cppcheck-suppress constParameterReference
    bool changed = false;
    for (int agent_id = 0; agent_id < static_cast<int>(results.size());
         ++agent_id) {
        if (results[std::size_t(agent_id)].size() == 0) {
            auto position = _persons[std::size_t(agent_id)].get_position();
            if (stops.find(position) == stops.end()) {
                stops.insert(position);  // cppcheck-suppress stlFindInsert
                changed = true;
            }
        }
    }
    return changed;
}

std::optional<std::vector<Action>> PrioritizedPlanner::calculate_route(
    const Person& person) const {
    if (is_reached_goal(person.get_position())) {
        return std::vector<Action>();
    }

    auto start_position = person.get_position();

    const int MAX_TIME = 50000;

    using NodeQueue =
        std::priority_queue<std::shared_ptr<TimedNode>,
                            std::vector<std::shared_ptr<TimedNode>>,
                            TimedNode::Compare>;
    NodeQueue open;
    std::unordered_set<TimePoint, TimePointHash> visited;
    std::vector<std::shared_ptr<TimedNode>> time_nodes;

    auto start_node = std::make_shared<TimedNode>(
        start_position, 0, h(person.get_position()), 0, 0);
    time_nodes.push_back(start_node);
    open.push(start_node);
    visited.insert({start_position.get_x(), start_position.get_y(), 0});

    int steps = 0;
    while (!open.empty() && steps < MAX_TIME) {
        auto current = open.top();
        open.pop();

        if (stops.find(current->position) != stops.end()) {
            continue;
        }

        if (is_reached_goal(current->position)) {
            std::vector<Action> path;
            auto node = current;
            while (node->parent_index != -1) {
                auto parent_node = time_nodes[std::size_t(node->parent_index)];
                path.push_back(
                    parent_node->position.to_another(node->position));
                node = parent_node;
            }
            std::reverse(path.begin(), path.end());
            return path;
        }

        auto neighbors =
            ca_table.get_neighbors_timestep(current->position, current->time);

        for (const auto& neighbor : neighbors) {
            if (_grid->is_incorrect_move(
                    Segment(current->position, neighbor))) {
                continue;
            }

            int move_cost = static_cast<int>(
                (neighbor - current->position).diag_norm_multiplied2());
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
            auto new_node = std::make_shared<TimedNode>(
                neighbor, new_g, new_h, new_time, time_nodes.size(),
                current->self_index);
            time_nodes.push_back(new_node);
            open.push(new_node);
            visited.insert(new_tp);
        }

        steps++;
    }

    return std::nullopt;
}
