#pragma once
#include "person.h"
#include "catable.h"
#include <vector>

class PrioritizedPlanner {
private:
    std::vector<Person> _persons;
    Grid* _grid;

public:
    PrioritizedPlanner(const std::vector<Person>& persons, Grid* grid);
    std::vector<std::vector<Action>> plan_all_routes();
    
private:
    std::vector<int> get_priorities_shortest_first() const;
    int calculate_distance(const Person& person) const;
};