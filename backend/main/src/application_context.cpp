#include "application_context.h"

#include <mutex>
#include <nlohmann/json-schema.hpp>
#include <vector>

#include "actions.h"
#include "grid.h"
#include "json.hpp"
#include "person.h"
#include "point.h"
#include "segment.h"

using Action::DOWN;
using Action::LEFT;
using Action::RIGHT;
using Action::UP;
using nlohmann::json;
using nlohmann::json_schema::json_validator;

static json map_schema = R"(
{
    "bsonType": "object",
    "required": ["id", "lower_left", "upper_right", "borders", "persons"],
    "properties": {
        "_id": {"bsonType": "int"},
        "lower_left": {
            "bsonType": "object",
            "required": ["x", "y"],
            "properties": {"x": {"bsonType": "int"}, "y": {"bsonType": "int"}},
        },
        "upper_right": {
            "bsonType": "object",
            "required": ["x", "y"],
            "properties": {"x": {"bsonType": "int"}, "y": {"bsonType": "int"}},
        },
        "borders": {
            "bsonType": "array",
            "items": {
                "bsonType": "object",
                "required": ["first", "second"],
                "properties": {
                    "first": {
                        "bsonType": "object",
                        "required": ["x", "y"],
                        "properties": {"x": {"bsonType": "int"}, "y": {"bsonType": "int"}},
                    },
                    "second": {
                        "bsonType": "object",
                        "required": ["x", "y"],
                        "properties": {"x": {"bsonType": "int"}, "y": {"bsonType": "int"}},
                    },
                },
            },
        },
        "persons": {
            "bsonType": "array",
            "items": {
                "bsonType": "object",
                "required": ["id", "position", "goal"],
                "properties": {
                    "id": {"bsonType": "int"},
                    "position": {
                        "bsonType": "object",
                        "required": ["x", "y"],
                        "properties": {"x": {"bsonType": "int"}, "y": {"bsonType": "int"}},
                    },
                    "goal": {
                        "bsonType": "object",
                        "required": ["x", "y"],
                        "properties": {"x": {"bsonType": "int"}, "y": {"bsonType": "int"}},
                    },
                },
            },
        },
    }
}
)"_json;

NLOHMANN_JSON_SERIALIZE_ENUM(Action, {
                                         {UP, "UP"},
                                         {DOWN, "DOWN"},
                                         {LEFT, "LEFT"},
                                         {RIGHT, "RIGHT"},
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
    int _id;
    Point lower_left;
    Point upper_right;
    std::vector<Segment> borders;
    std::vector<Person> persons;
};

NLOHMANN_DEFINE_TYPE_NON_INTRUSIVE(Map, _id, lower_left, upper_right, borders,
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

Segment to_segment(const Convertor::Segment &s) {
    return Segment(to_point(s.first), to_point(s.second));
}

json ApplicationContext::calculate_route(json input) {
    std::lock_guard<std::mutex> lock(_mutex);
    json_validator validator;
    validator.set_root_schema(map_schema);
    validator.validate(input);  // std::invalid_argument
    auto map = input.template get<Convertor::Map>();
    std::vector<Segment> borders;
    for (const auto &segment : map.borders) {
        borders.push_back(to_segment(segment));
    }
    Grid grid(borders, Point(map.lower_left.x, map.lower_left.y),
              Point(map.upper_right.x, map.upper_right.y));
    std::vector<Convertor::RouteResult> results;
    for (const auto &person : map.persons) {
        Person p(person.id, to_point(person.position),
                 to_point(person.goal), &grid);
        results.push_back(Convertor::RouteResult(p.get_id(), p.calculate_route()));
    }
    return static_cast<json>(results);
}
