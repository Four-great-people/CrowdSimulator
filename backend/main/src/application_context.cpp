#include "application_context.h"

#include <functional>
#include <memory>
#include <mutex>
#include <vector>

#include "actions.h"
#include "grid.h"
#include "person.h"
#include "point.h"
#include "prioritized_planner.h"
#include "simple_planner.h"

using Action::DOWN;
using Action::LEFT;
using Action::RIGHT;
using Action::UP;
using Action::RIGHT_DOWN;
using Action::LEFT_DOWN;
using Action::LEFT_UP;
using Action::RIGHT_UP;
using Action::WAIT;
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
                                         {WAIT, "WAIT"}
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

json ApplicationContext::calculate_route(json input, std::function<std::unique_ptr<Planner>(const std::vector<Person> &, Grid *)> planner_factory) {
    auto map = input.template get<Convertor::Map>();
    std::vector<Border> borders;
    for (const auto &segment : map.borders) {
        borders.push_back(to_border(segment));
    }
    Grid grid(borders, Point(map.down_left_point.x, map.down_left_point.y),
              Point(map.up_right_point.x, map.up_right_point.y));
    std::vector<Person> persons;
    for (const auto &person_data : map.persons) {
        persons.emplace_back(person_data.id, 
                           to_point(person_data.position), 
                           to_point(person_data.goal));
    }
    std::unique_ptr<Planner> planner = planner_factory(persons, &grid);
    auto all_routes = planner->plan_all_routes();
    std::vector<Convertor::RouteResult> results;
    for (size_t i = 0; i < persons.size(); ++i) {
        results.push_back(Convertor::RouteResult(persons[i].get_id(), all_routes[i]));
    }
    
    return static_cast<json>(results);
}

json ApplicationContext::calculate_route_dense(json input) {
    std::lock_guard<std::mutex> lock(_mutex);
    return calculate_route(input, [](const std::vector<Person> &ps, Grid *g){ return std::make_unique<PrioritizedPlanner>(ps, g); });
}

json ApplicationContext::calculate_route_simple(json input) {
    std::lock_guard<std::mutex> lock(_mutex);
    return calculate_route(input, [](const std::vector<Person> &ps, Grid *g){ return std::make_unique<SimplePlanner>(ps, g); });
}
