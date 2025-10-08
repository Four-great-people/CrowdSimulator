#ifndef PLANNER_H
#define PLANNER_H

#include "grid.h"
#include "person.h"
#include <vector>

class Planner {
protected:
    std::vector<Person> _persons;
    Grid* _grid;

public:
    Planner(const std::vector<Person>& persons, Grid* grid) : _persons(persons), _grid(grid) {};
    virtual ~Planner() = default;
    virtual std::vector<std::vector<Action>> plan_all_routes() = 0;
};

#endif // PLANNER_H