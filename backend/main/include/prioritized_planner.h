#ifndef PRIORITIZED_PLANNER_H
#define PRIORITIZED_PLANNER_H

#include "planner.h"
#include "catable.h"
#include <vector>

class PrioritizedPlanner : public Planner {
public:
    PrioritizedPlanner(const std::vector<Person>& persons, Grid* grid);
    std::vector<std::vector<Action>> plan_all_routes() override;
    std::optional<std::vector<Action>> calculate_route(const Person& person) const override;
private:
    std::vector<int> get_priorities_shortest_first() const;
    int calculate_distance(const Person& person) const;
    CATable ca_table;
};

#endif // PRIORITIZED_PLANNER_H