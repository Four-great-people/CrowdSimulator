#ifndef PRIORITIZED_PLANNER_H
#define PRIORITIZED_PLANNER_H

#include "planner.h"
#include "catable.h"

#include <optional>
#include <vector>
#include <unordered_set>

class PrioritizedPlanner : public Planner {
public:
    PrioritizedPlanner(const std::vector<Person>& persons, const std::vector<Goal>& goals, Grid* grid);
    std::vector<std::vector<Action>> plan_all_routes() override;
    std::optional<std::vector<Action>> calculate_route(const Person& person) const;
private:
    std::vector<int> get_priorities_shortest_first() const;
    int calculate_distance(const Person& person) const;
    bool validate_results(std::vector<std::vector<Action>>& results);
    CATable ca_table;
    std::unordered_set<Point> stops;
};

#endif // PRIORITIZED_PLANNER_H