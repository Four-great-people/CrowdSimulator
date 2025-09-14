#ifndef PERSON_H
#define PERSON_H

#include <optional>
#include <vector>

#include "actions.h"
#include "grid.h"
#include "point.h"

class Person {
public:
    Person(int id, Point position, Point goal, Grid *grid);
    Person(const Person &) = default;
    Person(Person &&) noexcept = default;
    Person &operator=(const Person &) = default;
    Person &operator=(Person &&) noexcept = default;
    ~Person() noexcept = default;

    std::optional<std::vector<Action>> calculate_route() const;
    int get_id() const noexcept;
private:
    Point _position;
    Point _goal;
    Grid *_personal_grid;
    int _id;

    int h(const Point &point) const noexcept;
};

#endif // PERSON_H
