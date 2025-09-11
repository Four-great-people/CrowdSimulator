#include "segment.h"
#include <algorithm>

Segment::Segment(const Point &first, const Point &second)
    : _first(first),
      _second(second)
{}

const Point &Segment::get_first() const noexcept {
    return _first;
}

const Point &Segment::get_second() const noexcept {
    return _second;
}

bool Segment::is_intersecting(const Segment &route) const noexcept {
    // TODO refactor
    if (route.get_first() == route.get_second()) {
        if (get_first().get_y() == get_second().get_y()) {
            int max_x = std::max(get_first().get_x(), get_second().get_x());
            int min_x = std::min(get_first().get_x(), get_second().get_x());
            return min_x <= route.get_first().get_x() &&
                route.get_first().get_x() <= max_x;
        }
        int max_y = std::max(get_first().get_y(), get_second().get_y());
        int min_y = std::min(get_first().get_y(), get_second().get_y());
        return min_y <= route.get_first().get_y() &&
            route.get_first().get_y() <= max_y;
    }
    long long cross_product = (get_second() - get_first())
                        .cross_product(route.get_second() - route.get_first());
    if (cross_product != 0) {
        return true;
    }
    if (get_first() == route.get_first()) {
        return true;
    }
    return (get_second() - get_first()).cross_product(get_second() - route.get_first()) == 0;
}

long long Segment::get_signed_length_x() const noexcept { // TODO remove
    return _second.get_x() - _first.get_x();
}

long long Segment::get_signed_length_y() const noexcept { // TODO remove
    return _second.get_y() - _first.get_y();
}
