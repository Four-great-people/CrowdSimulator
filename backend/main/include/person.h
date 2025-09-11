#ifndef PERSON_H
#define PERSON_H

#include <vector>
#include "grid.h"
#include "point.h"

class Person {
public:
    Person(Point position, Point goal, Grid *grid);
    Person(const Person &) = default;
    Person(Person &&) noexcept = default;
    Person &operator=(const Person &) = default;
    Person &operator=(Person &&) noexcept = default;
    ~Person() noexcept = default;

    std::vector<Point> calculate_route() const;
private:
    Point _position;
    Point _goal;
    Grid *_personal_grid;

    int h(const Point &point) const noexcept;
};

#endif // PERSON_H
