

# ErrorDetail

schema for specific error cause

## Properties

| Name | Type | Description | Notes |
|------------ | ------------- | ------------- | -------------|
|**field** | **String** | a bean notation expression specifying the element in request data causing the error, eg product.variants[3].name, this can be empty if violation was not field specific |  [optional] |
|**type** | **String** | classification of the error detail type, lower case with underscore eg missing_value, this value must be always interpreted in context of the general error type. |  |
|**message** | **String** | descriptive error detail message for debugging |  [optional] |



