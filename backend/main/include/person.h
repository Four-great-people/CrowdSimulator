#ifndef PERSON_H
#define PERSON_H

#include <optional>
#include <vector>

#include "actions.h"
#include "grid.h"
#include "point.h"
#include "catable.h"

class Person {
public:
    Person(int id, Point position, Point goal, Grid *grid);
    Person(const Person &) = default;
    Person(Person &&) noexcept = default;
    Person &operator=(const Person &) = default;
    Person &operator=(Person &&) noexcept = default;
    ~Person() noexcept = default;

    Point get_position() const noexcept { return _position; }
    Point get_goal() const noexcept { return _goal; }
    int get_id() const noexcept { return _id; }

    std::optional<std::vector<Action>> calculate_route() const;
    std::optional<std::vector<Action>> calculate_route_with_timesteps(const CATable* ca_table = nullptr) const;
private:
    Point _position;
    Point _goal;
    Grid *_personal_grid;
    int _id;

    int h(const Point &point) const noexcept;
    std::vector<Point> get_neighbors_timestep(const Point& point, int time, const CATable* ca_table) const;
};

#endif // PERSON_H
