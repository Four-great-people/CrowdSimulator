#ifndef PLANNER_H
#define PLANNER_H

#include "grid.h"
#include "person.h"
#include <vector>
#include <unordered_set>

class Planner {
public:
    Planner(const std::vector<Person>& persons, const std::vector<Goal>& goals, Grid* grid) 
    : _persons(persons)
    , _grid(grid) {
        for (auto g : goals) {
            _goals.insert(g);
        }
    };

    virtual ~Planner() = default;
    virtual std::vector<std::vector<Action>> plan_all_routes() = 0;

protected:
    std::vector<Person> _persons;
    std::unordered_set<Goal> _goals;
    Grid* _grid;

    static int h(const Person& person, const Point &point) noexcept {
        return static_cast<int>((person.get_position() - point).diag_norm_multiplied2());
    }

    int h(const Person& person) const noexcept {
        if (_goals.size() == 0) {
            return -1;
        }
        auto it = _goals.begin();
        int minim = h(person, it->get_position());
        it++;
        for ( ; it != _goals.end(); ++it) {
            minim = std::min(minim, h(person, it->get_position()));
        }
        return minim;
    }

    int is_reached_goal(const Point& point) const noexcept {
        for (auto goal : _goals) {
            if (point == goal.get_position()) {
                return true;
            }
        }
        return false;
    }
};

#endif // PLANNER_H