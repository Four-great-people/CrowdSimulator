#ifndef PLANNER_H
#define PLANNER_H

#include "grid.h"
#include "person.h"
#include <vector>
#include <optional>

class Planner {
protected:
    std::vector<Person> _persons;
    Grid* _grid;

    int h(const Person& person, const Point &point) const noexcept {
        return static_cast<int>((person.get_goal() - point).diag_norm_multiplied2());
    }

public:
    Planner(const std::vector<Person>& persons, Grid* grid) : _persons(persons), _grid(grid) {};
    virtual ~Planner() = default;
    virtual std::vector<std::vector<Action>> plan_all_routes() = 0;
    virtual std::optional<std::vector<Action>> calculate_route(const Person& person) const = 0;
};

#endif // PLANNER_H