#ifndef PERSON_H
#define PERSON_H

#include "point.h"

class Person {
public:
    Person(int id, Point position) : _id(id), _position(position) {}
    Person(const Person &) = default;
    Person(Person &&) noexcept = default;
    Person &operator=(const Person &) = default;
    Person &operator=(Person &&) noexcept = default;
    ~Person() noexcept = default;

    Point get_position() const noexcept { return _position; }
    int get_id() const noexcept { return _id; }

    bool operator==(const Person &other) const noexcept {
        return get_position() == other.get_position();
    }

private:
    Point _position;
    int _id;
};

// По-хорошему, нужно назвать этот класс NamedPoint, и использовать его.
// Но тогда в алгоритмах мы жёстко запутаемся, что есть что
// Поэтому сделал так
using Goal = Person;

namespace std {
template <>
struct hash<Goal> {
    std::size_t operator()(const Goal &goal) const noexcept {
        return 239 * std::hash<Point>()(goal.get_position()) + std::hash<int>()(goal.get_id());
    }
};
}  // namespace std

#endif // PERSON_H
