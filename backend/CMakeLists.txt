cmake_minimum_required(VERSION 3.5)
project(backend)

if(IS_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}/main/include)
list(APPEND PATH_INCLUDES ${CMAKE_CURRENT_SOURCE_DIR}/main/include)
FILE (GLOB_RECURSE HEADERS ${CMAKE_CURRENT_SOURCE_DIR}/main/include/*)
endif()
if(IS_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}/test/include)
list(APPEND PATH_INCLUDES ${CMAKE_CURRENT_SOURCE_DIR}/test/include)
FILE (GLOB_RECURSE TEST_HEADERS ${CMAKE_CURRENT_SOURCE_DIR}/test/include/* ${CMAKE_CURRENT_SOURCE_DIR}/main/include/*)
endif()
if(IS_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}/main/lib)
list(APPEND PATH_INCLUDES ${CMAKE_CURRENT_SOURCE_DIR}/main/lib)
FILE (GLOB_RECURSE LIB_HEADERS ${CMAKE_CURRENT_SOURCE_DIR}/main/lib/*)
endif()
if(IS_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}/test/lib)
list(APPEND PATH_INCLUDES ${CMAKE_CURRENT_SOURCE_DIR}/test/lib)
FILE (GLOB_RECURSE TEST_LIB_HEADERS ${CMAKE_CURRENT_SOURCE_DIR}/test/lib/* ${CMAKE_CURRENT_SOURCE_DIR}/main/lib/*)
endif()
include_directories(${PATH_INCLUDES})

find_package(GTest REQUIRED)
find_package(Crow REQUIRED)
find_package(OpenSSL REQUIRED)
find_package(ZLIB REQUIRED)

FILE (GLOB_RECURSE SOURCES ${CMAKE_CURRENT_SOURCE_DIR}/main/src/*)
list(REMOVE_ITEM SOURCES ${CMAKE_CURRENT_SOURCE_DIR}/main/src/main.cpp)
FILE (GLOB_RECURSE TEST_SOURCES ${CMAKE_CURRENT_SOURCE_DIR}/main/src/* ${CMAKE_CURRENT_SOURCE_DIR}/test/src/*)
list(REMOVE_ITEM TEST_SOURCES ${CMAKE_CURRENT_SOURCE_DIR}/main/src/main.cpp)
set(LIBS pthread Crow::Crow OpenSSL::SSL OpenSSL::Crypto ZLIB::ZLIB)
set(TEST_LIBS gmock gtest gtest_main)

add_executable(${PROJECT_NAME} ${SOURCES} ${CMAKE_CURRENT_SOURCE_DIR}/main/src/main.cpp ${HEADERS} ${LIB_HEADERS})
target_link_libraries(${PROJECT_NAME} ${LIBS})
set_target_properties(${PROJECT_NAME} PROPERTIES CXX_STANDARD 20)

enable_testing()
add_executable(${PROJECT_NAME}_test ${TEST_SOURCES} ${TEST_HEADERS} ${TEST_LIB_HEADERS})
target_link_libraries(${PROJECT_NAME}_test ${LIBS} ${TEST_LIBS})
set_target_properties(${PROJECT_NAME}_test PROPERTIES CXX_STANDARD 20)
add_test(${PROJECT_NAME}_test ${PROJECT_NAME}_test)

add_executable(${PROJECT_NAME}_test_sans ${TEST_SOURCES} ${TEST_HEADERS} ${TEST_LIB_HEADERS})
target_link_libraries(${PROJECT_NAME}_test_sans ${LIBS} ${TEST_LIBS})
set_target_properties(${PROJECT_NAME}_test_sans PROPERTIES CXX_STANDARD 20)
if(CMAKE_BUILD_TYPE MATCHES "Debug")
  target_compile_options(${PROJECT_NAME}_test_sans
    PRIVATE -fsanitize=undefined -fsanitize=address -g3 -O0
  )
  target_link_options(${PROJECT_NAME}_test_sans
    BEFORE PUBLIC -fsanitize=undefined PUBLIC -fsanitize=address -g3 -O0
  )
  add_custom_command(TARGET ${PROJECT_NAME}_test_sans
    COMMAND  export ASAN_OPTIONS="suppressions=../asan_ignore.txt" && export UBSAN_OPTIONS="suppressions=../ubsan_ignore.txt" && ${CMAKE_BINARY_DIR}/${PROJECT_NAME}_test_sans
  )
endif()

add_executable(${PROJECT_NAME}_test_gcov ${TEST_SOURCES} ${TEST_HEADERS} ${TEST_LIB_HEADERS})
target_link_libraries(${PROJECT_NAME}_test_gcov ${LIBS} ${TEST_LIBS})
set_target_properties(${PROJECT_NAME}_test_gcov PROPERTIES CXX_STANDARD 20)
if(CMAKE_CXX_COMPILER_ID MATCHES "GNU")
    target_compile_options(${PROJECT_NAME}_test_gcov PRIVATE -coverage -fprofile-arcs -ftest-coverage -fno-inline -fno-inline-small-functions -fno-default-inline -O0 -g)
elseif(CMAKE_CXX_COMPILER_ID MATCHES "Clang")
    target_compile_options(${PROJECT_NAME}_test_gcov PRIVATE -coverage -fprofile-arcs -ftest-coverage -fno-inline -O0 -g)
endif()
target_link_options(${PROJECT_NAME}_test_gcov PRIVATE -coverage)

add_executable(${PROJECT_NAME}_test_tsan ${TEST_SOURCES} ${TEST_HEADERS} ${TEST_LIB_HEADERS})
target_link_libraries(${PROJECT_NAME}_test_tsan ${LIBS} ${TEST_LIBS})
set_target_properties(${PROJECT_NAME}_test_tsan PROPERTIES CXX_STANDARD 20)
if(CMAKE_BUILD_TYPE MATCHES "Debug")
  target_compile_options(${PROJECT_NAME}_test_tsan
    PRIVATE -fsanitize=thread -g3 -O0
  )
  target_link_options(${PROJECT_NAME}_test_tsan
    BEFORE PUBLIC -fsanitize=thread -g3 -O0
  )
  add_custom_command(TARGET ${PROJECT_NAME}_test_tsan
    # sudo sysctl vm.mmap_rnd_bits=30
    COMMAND export TSAN_OPTIONS="suppressions=../tsan_ignore.txt" && ${CMAKE_BINARY_DIR}/${PROJECT_NAME}_test_tsan
  )
endif()

add_executable(${PROJECT_NAME}_test_gprof ${TEST_SOURCES} ${TEST_HEADERS} ${TEST_LIB_HEADERS})
target_link_libraries(${PROJECT_NAME}_test_gprof ${LIBS} ${TEST_LIBS})
set_target_properties(${PROJECT_NAME}_test_gprof PROPERTIES CXX_STANDARD 20)
if(CMAKE_BUILD_TYPE MATCHES "Debug")
  target_compile_options(${PROJECT_NAME}_test_gprof
    PRIVATE -pg -g3 -O0
  )
  target_link_options(${PROJECT_NAME}_test_gprof
    BEFORE PUBLIC -pg -g3 -O0
  )
  add_custom_command(TARGET ${PROJECT_NAME}_test_gprof
    COMMAND ${CMAKE_BINARY_DIR}/${PROJECT_NAME}_test_gprof
    COMMAND gprof ${CMAKE_BINARY_DIR}/${PROJECT_NAME}_test_gprof > ../profile_data.txt
  )
endif()

add_compile_options(
   -Werror

   -Wall
   -Wextra
   -Wpedantic

   -Wcast-align
   -Wcast-qual
   -Wconversion
   -Wctor-dtor-privacy
   -Wenum-compare
   -Wfloat-equal
   -Wnon-virtual-dtor
   -Wold-style-cast
   -Woverloaded-virtual
   -Wredundant-decls
   -Wsign-conversion
   -Wsign-promo
)

if(NOT CMAKE_CXX_EXTENSIONS)
   set(CMAKE_CXX_EXTENSIONS OFF)
endif()

add_custom_target(vg)
add_dependencies(vg ${PROJECT_NAME}_test)
add_custom_command(TARGET vg
    COMMAND valgrind --suppressions=valgrind_ignore.txt ${CMAKE_BINARY_DIR}/${PROJECT_NAME}_test
)

add_custom_target(hg)
add_dependencies(hg ${PROJECT_NAME}_test)
add_custom_command(TARGET hg
    COMMAND valgrind --tool=helgrind --suppressions=valgrind_ignore.txt ${CMAKE_BINARY_DIR}/${PROJECT_NAME}_test
)

add_custom_target(perf_profile)
add_dependencies(perf_profile ${PROJECT_NAME}_test)
add_custom_command(TARGET perf_profile
# sudo sysctl kernel.perf_event_paranoid=-1/4
  COMMAND perf record ${CMAKE_BINARY_DIR}/${PROJECT_NAME}_test && perf report -mIntel > ../perf_data.txt
)

add_custom_target(cov)
add_dependencies(cov ${PROJECT_NAME}_test_gcov)
add_custom_command(TARGET cov
    COMMAND ${CMAKE_BINARY_DIR}/${PROJECT_NAME}_test_gcov
    COMMAND echo "=================== GCOV ===================="
    COMMAND find ${CMAKE_BINARY_DIR} -name '*.gcda' | sed 's/^/--directory /' | xargs lcov --capture --output-file report.info --ignore-errors mismatch
    COMMAND mkdir -p cov-report
    COMMAND genhtml -o cov-report/ report.info
)

add_custom_target(docs COMMAND doxygen)
