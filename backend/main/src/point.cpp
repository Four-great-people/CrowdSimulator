#include "point.h"

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
    return Point(other._x - _x, other._y - _y);
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
