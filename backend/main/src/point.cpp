#include "point.h"

#include <cstdint>
#include <stdexcept>

#include "actions.h"

Point::Point(int x, int y) : _x(x), _y(y) {}

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
        case Action::LEFT_UP:
            --copy._x;
            ++copy._y;
            return copy;
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
        case Action::RIGHT_UP:
            ++copy._x;
            ++copy._y;
            return copy;
        case Action::LEFT_DOWN:
            --copy._x;
            --copy._y;
            return copy;
        case Action::RIGHT_DOWN:
            ++copy._x;
            --copy._y;
            return copy;
            break;
    }
    throw std::logic_error("Unreachable");
}

int Point::get_x() const noexcept { return _x; }

int Point::get_y() const noexcept { return _y; }

std::int64_t Point::cross_product(const Point &other) const noexcept {
    return get_x() * other.get_y() - get_y() * other.get_x();
}

std::vector<Point> Point::get_neighbors() const noexcept {
    return {
        Point(_x, _y + 1), Point(_x + 1, _y + 1), Point(_x - 1, _y + 1),
        Point(_x, _y - 1), Point(_x + 1, _y - 1), Point(_x - 1, _y - 1),
        Point(_x + 1, _y), Point(_x - 1, _y),
    };
}

std::int64_t Point::abs_norm()  // cppcheck-suppress unusedFunction
    const noexcept {
    return std::abs(_x) + std::abs(_y);  // TODO(verbinna22): remove
}

std::int64_t Point::diag_norm_multiplied2() const noexcept {
    int abs_x = std::abs(_x);
    int abs_y = std::abs(_y);
    int min_coordinate = std::min(abs_x, abs_y);
    // move through diagonal efficiently and then use grid
    return min_coordinate * 3 + (std::max(abs_x, abs_y) - min_coordinate) * 2;
}

int Point::get_move_cost(const Point& other) const noexcept {
    if (*this == other) {
        return get_cost(Action::WAIT);
    }
    return static_cast<int>((*this - other).diag_norm_multiplied2());
}


Action Point::to_another(const Point &point) const {
    Point temp = point - *this;
    switch (temp.get_x()) {
        case -1:
            switch (temp.get_y()) {
                case -1:
                    return Action::LEFT_DOWN;
                case 0:
                    return Action::LEFT;
                case 1:
                    return Action::LEFT_UP;
                default:
                    throw std::logic_error(
                        "Points are not close to each other!");
            }
        case 0:
            switch (temp.get_y()) {
                case -1:
                    return Action::DOWN;
                case 0:
                    return Action::WAIT;
                case 1:
                    return Action::UP;
                default:
                    throw std::logic_error(
                        "Points are not close to each other!");
            }
        case 1:
            switch (temp.get_y()) {
                case -1:
                    return Action::RIGHT_DOWN;
                case 0:
                    return Action::RIGHT;
                case 1:
                    return Action::RIGHT_UP;
                default:
                    throw std::logic_error(
                        "Points are not close to each other!");
            }
        default:
            throw std::logic_error("Points are not close to each other!");
    }
}

Point operator*(const Point &p, int scalar) noexcept {
    return Point(p.get_x() * scalar, p.get_y() * scalar);
}

Point operator+(const Point &p, int scalar) noexcept {
    return Point(p.get_x() + scalar, p.get_y() + scalar);
}

Point operator*(int scalar, const Point &p) noexcept { return p * scalar; }

Point operator+(int scalar, const Point &p) noexcept { return p + scalar; }
