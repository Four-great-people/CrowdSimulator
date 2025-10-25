#include "random_planner.h"

#include <algorithm>
#include <functional>
#include <iterator>
#include <numeric>
#include <optional>
#include <random>
#include <unordered_map>
#include <unordered_set>
#include <vector>

#include "actions.h"
#include "point.h"

RandomPlanner::RandomPlanner(const std::vector<Person>& persons, Grid* grid)
    : Planner(persons, grid), rng(std::random_device()()), dist(0, 1) {}

std::vector<std::vector<Action>> RandomPlanner::plan_all_routes() {
    std::vector<std::vector<Action>> routes(_persons.size());
    std::vector<Point> current_positions;
    current_positions.reserve(_persons.size());
    std::unordered_set<Point> busy_positions;
    std::unordered_set<Point> next_busy_positions;
    constexpr int MAX_ITERATION_NUMBER = 50000;
    std::unordered_set<int> moving_positions;
    std::unordered_map<int, int> next_time_to_move;
    for (int i = 0; i < _persons.size(); ++i) {
        moving_positions.insert(i);
        next_time_to_move[0] = 0;
        current_positions.push_back(_persons[i].get_position());
        busy_positions.insert(_persons[i].get_position());
    }
    for (int t = 0; t < MAX_ITERATION_NUMBER; ++t) {
        std::unordered_set<int> current_moving_positions = moving_positions;
        for (int ind : current_moving_positions) {
            if (next_time_to_move[ind] != t) {
                continue;
            }
            const auto& person = _persons[ind];
            const auto &current_position = current_positions[ind];
            auto new_position_option =
                plan_next_action(person, current_position);
            if (!new_position_option.has_value()) {
                moving_positions.erase(ind);
                continue;
            }
            auto new_position = new_position_option.value();
            if (busy_positions.contains(new_position) || next_busy_positions.contains(new_position)) {
                routes[ind].push_back(Action::WAIT);
                next_time_to_move[ind] += 2;
                continue;
            }
            routes[ind].push_back(current_position.to_another(new_position));
            next_time_to_move[ind] += 2; // TODO
            next_busy_positions.insert(new_position);
            current_positions[ind] = new_position;
            if (new_position == person.get_goal()) {
                moving_positions.erase(ind);
            }
        }
        busy_positions = std::move(next_busy_positions);
        next_busy_positions.clear();
    }
    return routes;
}

std::optional<Point> RandomPlanner::plan_next_action(
    const Person& person, const Point& current_position) {
    auto probable_neighbors = current_position.get_neighbors();
    std::vector<Point> next_positions;
    next_positions.reserve(probable_neighbors.size());
    std::copy_if(
        probable_neighbors.begin(), probable_neighbors.end(),
        std::back_insert_iterator(next_positions),
        [this, &current_position](const auto& position) {
            return _grid->is_intersecting(
                       Segment(current_position, position)) ||
                   position.get_x() > _grid->get_upper_right().get_x() ||
                   position.get_x() < _grid->get_lower_left().get_x() ||
                   position.get_y() > _grid->get_upper_right().get_y() ||
                   position.get_y() < _grid->get_lower_left().get_y();
        });
    if (next_positions.empty()) {
        return std::nullopt;
    }
    std::vector<double> probabilities(next_positions.size());
    std::transform(
        next_positions.begin(), next_positions.end(), probabilities.begin(),
        [&person](const auto& p) { return 1.0 / (h(person, p) + 1); });
    std::partial_sum(probabilities.begin(), probabilities.end(),
                     probabilities.begin(), std::plus<double>());
    double sum = probabilities.back();
    double threshold = dist(rng) * sum;
    auto position_iterator =
        std::upper_bound(probabilities.begin(), probabilities.end(), threshold);
    int index = (position_iterator == probabilities.end())
                    ? (probabilities.size() - 1)
                    : std::distance(probabilities.begin(), position_iterator);
    Point new_position = next_positions[index];
    return new_position;
}
