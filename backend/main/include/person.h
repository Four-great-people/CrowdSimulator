#ifndef PERSON_H
#define PERSON_H

#include "point.h"

class Person {
public:
    Person(int id, Point position, Point goal) : _id(id), _position(position), _goal(goal) {}
    Person(const Person &) = default;
    Person(Person &&) noexcept = default;
    Person &operator=(const Person &) = default;
    Person &operator=(Person &&) noexcept = default;
    ~Person() noexcept = default;

    Point get_position() const noexcept { return _position; }
    Point get_goal() const noexcept { return _goal; }
    int get_id() const noexcept { return _id; } // cppcheck-suppress unusedFunction

private:
    int _id;
    Point _position;
    Point _goal;
};

#endif // PERSON_H
