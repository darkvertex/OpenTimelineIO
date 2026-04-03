if(NOT EMSCRIPTEN)
    message(
        FATAL_ERROR
        "OTIO_WASM_BUILD requires the Emscripten toolchain. Configure with "
        "`emcmake cmake -S . -B build-wasm -DOTIO_WASM_BUILD=ON ...`."
    )
endif()

find_program(NPM_EXECUTABLE npm REQUIRED)

set(OTIO_WASM_OUTPUT_DIR "${CMAKE_CURRENT_BINARY_DIR}/dist")
set(OTIO_WASM_SAMPLE_SOURCE
    "${PROJECT_SOURCE_DIR}/tests/sample_data/clip_example.otio")
set(OTIO_WASM_SAMPLE_OUTPUT
    "${OTIO_WASM_OUTPUT_DIR}/clip_example.otio")
set(OTIO_WASM_TS_SOURCES
    "${CMAKE_CURRENT_SOURCE_DIR}/typescript/index.ts"
    "${CMAKE_CURRENT_SOURCE_DIR}/typescript/browser-demo.ts"
    "${CMAKE_CURRENT_SOURCE_DIR}/typescript/otio_wasm.d.ts")

add_executable(otio_wasm otio_wasm_bindings.cpp)

target_include_directories(otio_wasm PRIVATE "${PROJECT_SOURCE_DIR}/src")
target_link_libraries(otio_wasm PRIVATE opentimelineio opentime)
target_compile_options(otio_wasm PRIVATE -fexceptions)
target_link_options(otio_wasm PRIVATE
    --bind
    -fexceptions
    -sALLOW_MEMORY_GROWTH=1
    -sENVIRONMENT=web,worker,node
    -sEXPORT_ES6=1
    -sEXPORT_NAME=createOpenTimelineIO
    -sFILESYSTEM=0
    -sMODULARIZE=1
)

set_target_properties(otio_wasm PROPERTIES
    OUTPUT_NAME "otio_wasm"
    RUNTIME_OUTPUT_DIRECTORY "${OTIO_WASM_OUTPUT_DIR}"
    SUFFIX ".js")

add_custom_command(
    OUTPUT
        "${OTIO_WASM_OUTPUT_DIR}/index.js"
        "${OTIO_WASM_OUTPUT_DIR}/index.d.ts"
        "${OTIO_WASM_OUTPUT_DIR}/browser-demo.js"
        "${OTIO_WASM_OUTPUT_DIR}/browser-demo.d.ts"
        "${OTIO_WASM_OUTPUT_DIR}/otio_wasm.d.ts"
        "${OTIO_WASM_OUTPUT_DIR}/package.json"
        "${OTIO_WASM_OUTPUT_DIR}/browser-demo.html"
        "${OTIO_WASM_SAMPLE_OUTPUT}"
    COMMAND "${CMAKE_COMMAND}" -E make_directory "${OTIO_WASM_OUTPUT_DIR}"
    COMMAND "${CMAKE_COMMAND}" -E copy_if_different
            "${CMAKE_CURRENT_SOURCE_DIR}/typescript/otio_wasm.d.ts"
            "${OTIO_WASM_OUTPUT_DIR}/otio_wasm.d.ts"
    COMMAND "${CMAKE_COMMAND}" -E copy_if_different
            "${CMAKE_CURRENT_SOURCE_DIR}/package.json"
            "${OTIO_WASM_OUTPUT_DIR}/package.json"
    COMMAND "${CMAKE_COMMAND}" -E copy_if_different
            "${CMAKE_CURRENT_SOURCE_DIR}/demo/browser-demo.html"
            "${OTIO_WASM_OUTPUT_DIR}/browser-demo.html"
    COMMAND "${CMAKE_COMMAND}" -E copy_if_different
            "${OTIO_WASM_SAMPLE_SOURCE}"
            "${OTIO_WASM_SAMPLE_OUTPUT}"
    COMMAND "${NPM_EXECUTABLE}" ci
    COMMAND "${NPM_EXECUTABLE}" run build -- --outDir "${OTIO_WASM_OUTPUT_DIR}"
    WORKING_DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}"
    DEPENDS
        otio_wasm
        "${CMAKE_CURRENT_SOURCE_DIR}/package.json"
        "${CMAKE_CURRENT_SOURCE_DIR}/package-lock.json"
        "${CMAKE_CURRENT_SOURCE_DIR}/tsconfig.json"
        "${OTIO_WASM_SAMPLE_SOURCE}"
        ${OTIO_WASM_TS_SOURCES}
    VERBATIM)

add_custom_target(
    otio_wasm_package
    DEPENDS
        otio_wasm
        "${OTIO_WASM_OUTPUT_DIR}/index.js"
        "${OTIO_WASM_OUTPUT_DIR}/index.d.ts"
        "${OTIO_WASM_OUTPUT_DIR}/browser-demo.js"
        "${OTIO_WASM_OUTPUT_DIR}/browser-demo.d.ts"
        "${OTIO_WASM_OUTPUT_DIR}/otio_wasm.d.ts"
        "${OTIO_WASM_OUTPUT_DIR}/package.json"
        "${OTIO_WASM_OUTPUT_DIR}/browser-demo.html"
        "${OTIO_WASM_SAMPLE_OUTPUT}")
