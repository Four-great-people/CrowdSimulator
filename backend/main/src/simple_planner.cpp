#include "simple_planner.h"
#include <algorithm>


SimplePlanner::SimplePlanner(const std::vector<Person>& persons, Grid* grid)
    : Planner(persons, grid) {}

std::vector<std::vector<Action>> SimplePlanner::plan_all_routes() {
    std::vector<std::vector<Action>> routes;
    routes.reserve(_persons.size());
    for (auto person: _persons) {
        auto route = person.calculate_route();
        if (route) {
            routes.push_back(route.value());
        }
        else {
            routes.push_back(std::vector<Action>{});
        }
    }
    return routes;
}