#include "point.h"
#include <stdexcept>
#include "actions.h"

Point::Point(int x, int y)
    : _x(x),
      _y(y)
{}

bool Point::operator==(const Point &other) const noexcept {
    return other._x == _x && other._y == _y;
}

bool Point::operator!=(const Point &other) const noexcept {
    return !(*this == other);
}

Point Point::operator-(const Point &other) const noexcept {
    return Point(_x - other._x, _y - other._y);
}

Point Point::operator+(const Action &action) const {
    Point copy = *this;
    switch (action) {
        case Action::UP:
            ++copy._y;
            return copy;
        case Action::DOWN:
            --copy._y;
            return copy;
        case Action::LEFT:
            --copy._x;
            return copy;
        case Action::RIGHT:
            ++copy._x;
            return copy;
        case Action::WAIT:
            return copy;
    }
    throw std::logic_error("Unreachable");
}

int Point::get_x() const noexcept {
    return _x;
}

int Point::get_y() const noexcept {
    return _y;
}

long long Point::cross_product(const Point &other) const noexcept {
    return get_x() * other.get_y() - get_y() * other.get_x();
}

std::vector<Point> Point::get_neighbors() const noexcept {
    return {
        Point(_x, _y + 1),
        Point(_x, _y - 1),
        Point(_x + 1, _y),
        Point(_x - 1, _y),
    };
}

long long Point::abs_norm() const noexcept {
    return std::abs(_x) + std::abs(_y);
}

Action Point::to_another(const Point &point) const {
    Point temp = point - *this;
    switch (temp.get_x()) {
        case -1:
            if (temp.get_y() != 0) {
                throw std::logic_error("Move uses two axis!");
            }
            return Action::LEFT;
        case 0:
            switch (temp.get_y()) {
                case -1:
                    return Action::DOWN;
                case 0:
                    return Action::WAIT;
                case 1:
                    return Action::UP;
                default:
                    throw std::logic_error("Points are not close to each other!");
            }
        case 1:
            if (temp.get_y() != 0) {
                throw std::logic_error("Move uses two axis!");
            }
            return Action::RIGHT;
        default:
            throw std::logic_error("Points are not close to each other!");
    }
}
