#ifndef PLANNER_H
#define PLANNER_H

#include <vector>

#include "grid.h"
#include "person.h"

class Planner {
 public:
    Planner(const std::vector<Person>& persons, Grid* grid)
        : _persons(persons), _grid(grid) {}
    virtual ~Planner() = default;
    virtual std::vector<std::vector<Action>> plan_all_routes() = 0;

 protected:
    std::vector<Person> _persons;
    Grid* _grid;

    static int h(const Person& person, const Point& point) noexcept {
        return static_cast<int>(
            (person.get_goal() - point).diag_norm_multiplied2());
    }
};

#endif  // PLANNER_H
