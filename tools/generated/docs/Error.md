

# Error

Schema for API specified errors.

## Properties

| Name | Type | Description | Notes |
|------------ | ------------- | ------------- | -------------|
|**status** | **Integer** | original HTTP error code, should be consistent with the response HTTP code |  |
|**type** | **String** | classification of the error type, lower case with underscore eg validation_failure |  |
|**message** | **String** | descriptive error message for debugging |  [optional] |
|**details** | [**List&lt;ErrorDetail&gt;**](ErrorDetail.md) | list of problems causing this error |  [optional] |



