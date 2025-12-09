#ifndef APPLICATION_CONTEXT_H
#define APPLICATION_CONTEXT_H

#include <memory>
#include <vector>

#include "json.hpp"
#include "planner.h"

using PlannerFactory = std::function<std::unique_ptr<Planner>(
    const std::vector<Person> &, const std::vector<Goal> &, Grid *)>;

class ApplicationContext {
 public:
    ApplicationContext() noexcept = delete;
    ApplicationContext(const ApplicationContext &) = delete;
    ApplicationContext(ApplicationContext &&) noexcept = delete;
    ApplicationContext &operator=(const ApplicationContext &) = delete;
    ApplicationContext &operator=(ApplicationContext &&) noexcept = delete;
    ~ApplicationContext() noexcept = default;

    static nlohmann::json calculate_route_dense(nlohmann::json input);
    static nlohmann::json calculate_route_simple(nlohmann::json input);
    static nlohmann::json calculate_route_random(nlohmann::json input);

 private:

    static nlohmann::json calculate_route(nlohmann::json input,
                                   PlannerFactory planner_factory);
};

#endif  // APPLICATION_CONTEXT_H
