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
    , _goals(goals.begin(), goals.end())
    , _grid(grid) {};

    virtual ~Planner() = default;
    virtual std::vector<std::vector<Action>> plan_all_routes() = 0;

protected:
    std::vector<Person> _persons;
    std::unordered_set<Goal> _goals;
    Grid* _grid;

    int h(const Point& point) const noexcept {
        if (_goals.size() == 0) {
            return -1;
        }
        auto it = _goals.begin();
        int minim = h(point, it->get_position());
        it++;
        for ( ; it != _goals.end(); ++it) {
            minim = std::min(minim, h(point, it->get_position()));
        }
        return minim;
    }

    bool is_reached_goal(const Point& point) const noexcept {
        for (auto& goal : _goals) {
            if (point == goal.get_position()) {
                return true;
            }
        }
        return false;
    }
private:
    static int h(const Point& point, const Point &other_point) noexcept {
        return static_cast<int>((point - other_point).diag_norm_multiplied2());
    }
};

#endif // PLANNER_H