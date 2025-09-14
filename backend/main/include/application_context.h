#ifndef APPLICATION_CONTEXT_H
#define APPLICATION_CONTEXT_H

#include "json.hpp"

class ApplicationContext {
public:
    ApplicationContext() noexcept = default;
    ApplicationContext(const ApplicationContext &) = delete;
    ApplicationContext(ApplicationContext &&) noexcept = delete;
    ApplicationContext &operator=(const ApplicationContext &) = delete;
    ApplicationContext &operator=(ApplicationContext &&) noexcept = delete;
    ~ApplicationContext() noexcept = default;

    nlohmann::json calculate_route(nlohmann::json input);

private:
    std::mutex _mutex;
};

#endif // APPLICATION_CONTEXT_H
