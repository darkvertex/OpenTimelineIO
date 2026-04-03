// SPDX-License-Identifier: Apache-2.0
// Copyright Contributors to the OpenTimelineIO project

#include "opentimelineio/errorStatus.h"
#include "opentimelineio/serializableObject.h"

#include <emscripten/bind.h>

using namespace emscripten;
using namespace opentimelineio::OPENTIMELINEIO_VERSION_NS;

namespace {

struct OTIOErrorStatus
{
    int         outcome         = ErrorStatus::Outcome::OK;
    std::string details;
    std::string fullDescription;
};

class OTIOSerializableObject
{
public:
    OTIOSerializableObject() = default;

    explicit OTIOSerializableObject(SerializableObject* object)
        : _object(object)
    {}

    bool is_valid() const { return static_cast<bool>(_object); }

    std::string schema_name() const
    {
        return _object ? _object->schema_name() : "";
    }

    int schema_version() const
    {
        return _object ? _object->schema_version() : 0;
    }

    SerializableObject* get() const { return _object; }

private:
    SerializableObject::Retainer<> _object;
};

struct OTIOParseResult
{
    bool                   ok = false;
    OTIOSerializableObject value;
    OTIOErrorStatus        error;
};

struct OTIOStringifyResult
{
    bool            ok = false;
    std::string     json;
    OTIOErrorStatus error;
};

OTIOErrorStatus
to_otio_error_status(ErrorStatus const& error_status)
{
    return OTIOErrorStatus {
        static_cast<int>(error_status.outcome),
        error_status.details,
        error_status.full_description
    };
}

OTIOParseResult
parse_otio_json(std::string const& input)
{
    ErrorStatus         error_status;
    SerializableObject* object = SerializableObject::from_json_string(
        input,
        &error_status);

    if (is_error(error_status) || !object)
    {
        if (!is_error(error_status))
        {
            error_status = ErrorStatus(
                ErrorStatus::INTERNAL_ERROR,
                "Unable to deserialize OTIO JSON.");
        }

        return OTIOParseResult {
            false,
            OTIOSerializableObject(),
            to_otio_error_status(error_status)
        };
    }

    return OTIOParseResult {
        true,
        OTIOSerializableObject(object),
        OTIOErrorStatus()
    };
}

OTIOStringifyResult
stringify_otio_json(OTIOSerializableObject const& value, int indent)
{
    if (!value.is_valid())
    {
        return OTIOStringifyResult {
            false,
            "",
            to_otio_error_status(ErrorStatus(
                ErrorStatus::TYPE_MISMATCH,
                "Cannot stringify an empty OTIO object handle."))
        };
    }

    ErrorStatus error_status;
    auto json = value.get()->to_json_string(&error_status, nullptr, indent);

    if (is_error(error_status))
    {
        return OTIOStringifyResult {
            false,
            "",
            to_otio_error_status(error_status)
        };
    }

    return OTIOStringifyResult {
        true,
        json,
        OTIOErrorStatus()
    };
}

OTIOStringifyResult
roundtrip_otio_json(std::string const& input, int indent)
{
    auto parsed = parse_otio_json(input);
    if (!parsed.ok)
    {
        return OTIOStringifyResult { false, "", parsed.error };
    }

    return stringify_otio_json(parsed.value, indent);
}

} // namespace

EMSCRIPTEN_BINDINGS(otio_wasm)
{
    value_object<OTIOErrorStatus>("OTIOErrorStatus")
        .field("outcome", &OTIOErrorStatus::outcome)
        .field("details", &OTIOErrorStatus::details)
        .field("fullDescription", &OTIOErrorStatus::fullDescription);

    class_<OTIOSerializableObject>("OTIOSerializableObject")
        .constructor<>()
        .function("isValid", &OTIOSerializableObject::is_valid)
        .function("schemaName", &OTIOSerializableObject::schema_name)
        .function("schemaVersion", &OTIOSerializableObject::schema_version);

    value_object<OTIOParseResult>("OTIOParseResult")
        .field("ok", &OTIOParseResult::ok)
        .field("value", &OTIOParseResult::value)
        .field("error", &OTIOParseResult::error);

    value_object<OTIOStringifyResult>("OTIOStringifyResult")
        .field("ok", &OTIOStringifyResult::ok)
        .field("json", &OTIOStringifyResult::json)
        .field("error", &OTIOStringifyResult::error);

    function("parseOtioJson", &parse_otio_json);
    function("stringifyOtioJson", &stringify_otio_json);
    function("roundtripOtioJson", &roundtrip_otio_json);
}
