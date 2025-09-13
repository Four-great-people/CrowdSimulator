#include <crow.h>
#include <crow/middlewares/cors.h>

#include <sstream>
#include <stdexcept>
#include <string>

#include "application_context.h"
#include "json.hpp"

int main(int argc, const char** argv) {
    crow::App<crow::CORSHandler> app;
    ApplicationContext context;

    CROW_ROUTE(app, "/route")
        .methods(
            crow::HTTPMethod::Post)([&context](const crow::request& request) {
            try {
                auto input = nlohmann::json::parse(request.body);
                auto result = context.calculate_route(input);
                std::stringstream s;
                s << result;
                return crow::response(s.str());
            } catch (const nlohmann::json::parse_error &error) {
                return crow::response(crow::status::BAD_REQUEST, "Not json");
            } catch (const std::invalid_argument& error) {
                return crow::response(crow::status::BAD_REQUEST,
                                      "Invalid JSON format");
            }
        });

    auto &cors = app.get_middleware<crow::CORSHandler>();
    cors.global().origin("*");
    app.port(8080).multithreaded().run();
    return 0;
}
