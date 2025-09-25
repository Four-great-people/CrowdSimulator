#include "application_context.h"

#include <mutex>
#include <vector>

#include "actions.h"
#include "grid.h"
#include "person.h"
#include "point.h"

using Action::DOWN;
using Action::LEFT;
using Action::RIGHT;
using Action::UP;
using Action::RIGHT_DOWN;
using Action::LEFT_DOWN;
using Action::LEFT_UP;
using Action::RIGHT_UP;
using nlohmann::json;

NLOHMANN_JSON_SERIALIZE_ENUM(Action, {
                                         {UP, "UP"},
                                         {DOWN, "DOWN"},
                                         {LEFT, "LEFT"},
                                         {RIGHT, "RIGHT"},
                                         {RIGHT_UP, "RIGHT_UP"},
                                         {LEFT_UP, "LEFT_UP"},
                                         {RIGHT_DOWN, "RIGHT_DOWN"},
                                         {LEFT_DOWN, "LEFT_DOWN"},
                                     })

namespace Convertor {
struct Point {
    int x;
    int y;
};

// cppcheck-suppress unknownMacro
NLOHMANN_DEFINE_TYPE_NON_INTRUSIVE(Point, x, y)

struct Segment {
    Point first;
    Point second;
};

NLOHMANN_DEFINE_TYPE_NON_INTRUSIVE(Segment, first, second)

struct Person {
    int id;
    Point position;
    Point goal;
};

NLOHMANN_DEFINE_TYPE_NON_INTRUSIVE(Person, id, position, goal)

struct Map {
    std::string _id;
    Point down_left_point;
    Point up_right_point;
    std::vector<Segment> borders;
    std::vector<Person> persons;
};

NLOHMANN_DEFINE_TYPE_NON_INTRUSIVE(Map, _id, down_left_point, up_right_point, borders,
                                   persons)

struct RouteResult {
    int id;
    std::optional<std::vector<Action>> route;
};

NLOHMANN_DEFINE_TYPE_NON_INTRUSIVE(RouteResult, id, route)
}  // namespace Convertor

Point to_point(const Convertor::Point &p) {
    return Point(p.x, p.y);
}

Border to_border(const Convertor::Segment &s) {
    return Border(to_point(s.first), to_point(s.second));
}

json ApplicationContext::calculate_route(json input) {
    std::lock_guard<std::mutex> lock(_mutex);
    auto map = input.template get<Convertor::Map>();
    std::vector<Border> borders;
    for (const auto &segment : map.borders) {
        borders.push_back(to_border(segment));
    }
    Grid grid(borders, Point(map.down_left_point.x, map.down_left_point.y),
              Point(map.up_right_point.x, map.up_right_point.y));
    std::vector<Convertor::RouteResult> results;
    for (const auto &person : map.persons) {
        Person p(person.id, to_point(person.position),
                 to_point(person.goal), &grid);
        results.push_back(Convertor::RouteResult(p.get_id(), p.calculate_route()));
    }
    return static_cast<json>(results);
}
