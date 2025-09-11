#include "point.h"

Point::Point(int x, int y)
    : _x(x),
      _y(y)
{}

int Point::get_x() const noexcept {
    return _x;
}

int Point::get_y() const noexcept {
    return _y;
}
