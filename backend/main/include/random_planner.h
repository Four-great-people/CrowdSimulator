#ifndef RANDOM_PLANNER_H
#define RANDOM_PLANNER_H

#include <optional>
#include <random>

#include "actions.h"
#include "planner.h"

class RandomPlanner: public Planner {
public:
    RandomPlanner(const std::vector<Person>& persons, const std::vector<Goal>& goals, Grid* grid);
    RandomPlanner(const RandomPlanner &) = default;
    RandomPlanner(RandomPlanner &&) noexcept = default;
    RandomPlanner &operator=(const RandomPlanner &) = default;
    RandomPlanner &operator=(RandomPlanner &&) noexcept = default;
    ~RandomPlanner() noexcept override = default;

    std::vector<std::vector<Action>> plan_all_routes() override;
    std::optional<Point> plan_next_action(const Person& person, const Point &current_position);

private:
    std::mt19937 rng;
    std::uniform_real_distribution<> dist;
};

#endif // RANDOM_PLANNER_H
