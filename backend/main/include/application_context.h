#ifndef APPLICATION_CONTEXT_H
#define APPLICATION_CONTEXT_H

#include "json.hpp"
#include "planner.h"

class ApplicationContext {
public:
    ApplicationContext() noexcept = default;
    ApplicationContext(const ApplicationContext &) = delete;
    ApplicationContext(ApplicationContext &&) noexcept = delete;
    ApplicationContext &operator=(const ApplicationContext &) = delete;
    ApplicationContext &operator=(ApplicationContext &&) noexcept = delete;
    ~ApplicationContext() noexcept = default;

    nlohmann::json calculate_route_dense(nlohmann::json input);
    nlohmann::json calculate_route_simple(nlohmann::json input);

private:
    std::mutex _mutex;

    nlohmann::json calculate_route(nlohmann::json input, std::function<std::unique_ptr<Planner>(const std::vector<Person> &, Grid *)> planner_factory);
};

#endif // APPLICATION_CONTEXT_H
