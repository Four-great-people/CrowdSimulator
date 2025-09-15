#include "border.h"

#include "point.h"
#include "segment.h"

Border::Border(const Point &first, const Point &second)
    : _first(first), _second(second) {}

Border::Border(const Segment &segment)
    : Border(segment.get_first(), segment.get_second()) {}

const Point &Border::get_first() const noexcept {
    return _first;
}

const Point &Border::get_second() const noexcept {
    return _second;
}

bool Border::is_intersecting(const Segment &route) const noexcept {
    Segment virtual_segment(2 * get_first(), 2 * get_second());
    Segment virtual_route(2 * route.get_first() + 1, 2 * route.get_second() + 1);
    return virtual_segment.is_intersecting(virtual_route);
}
