#ifndef SIMPLE_PLANNER_H
#define SIMPLE_PLANNER_H

#include <optional>
#include <vector>

#include "planner.h"

class SimplePlanner : public Planner {
 public:
    SimplePlanner(const std::vector<Person>& persons,
                  const std::vector<Goal>& goals, Grid* grid);
    std::vector<std::vector<Action>> plan_all_routes() override;
    std::optional<std::vector<Action>> calculate_route(
        const Person& person) const;
};

#endif  // SIMPLE_PLANNER_H
