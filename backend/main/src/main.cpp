#include <crow.h>
#include <crow/common.h>
#include <crow/middlewares/cors.h>

#include <sstream>
#include <string>

#include "application_context.h"
#include "json.hpp"

int main(int /*argc*/, const char** /*argv*/) {
    crow::App<crow::CORSHandler> app;
    ApplicationContext context;

    CROW_ROUTE(app, "/route/<string>")
        .methods(crow::HTTPMethod::Post)(
            [&context](const crow::request& request,
                       const std::string& algorithm_name) {
                try {
                    auto input = nlohmann::json::parse(request.body);
                    nlohmann::json result;
                    if (algorithm_name == "simple") {
                        result = context.calculate_route_simple(input);
                    } else if (algorithm_name == "dense") {
                        result = context.calculate_route_dense(input);
                    } else if (algorithm_name == "random") {
                        result = context.calculate_route_random(input);
                    } else {
                        return crow::response(crow::status::BAD_REQUEST,
                                              "Unsupported algorithm");
                    }
                    std::stringstream s;
                    s << result;
                    return crow::response(s.str());
                } catch (const nlohmann::json::parse_error& error) {
                    return crow::response(crow::status::BAD_REQUEST,
                                          "Not json");
                } catch (const nlohmann::json::out_of_range& error) {
                    return crow::response(crow::status::BAD_REQUEST,
                                          "Invalid JSON format");
                } catch (const nlohmann::json::type_error& error) {
                    return crow::response(crow::status::BAD_REQUEST,
                                          "Invalid JSON format: type error");
                }
            });

    auto& cors = app.get_middleware<crow::CORSHandler>();
    cors.global().origin("*");
    app.port(8080).multithreaded().run();
    return 0;
}
