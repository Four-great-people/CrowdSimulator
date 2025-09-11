#include "segment.h"

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
