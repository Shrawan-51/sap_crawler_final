

# FailedAttemptGet


## Properties

| Name | Type | Description | Notes |
|------------ | ------------- | ------------- | -------------|
|**id** | **String** | The unique identifier of the failed attempt. |  [optional] |
|**successorDocumentSystem** | **String** |  |  [optional] |
|**successorDocumentId** | **String** |  |  [optional] |
|**successorDocumentType** | **String** |  |  [optional] |
|**reportedAt** | **OffsetDateTime** | The point in time when the failed transfer attempt was reported. |  |
|**messages** | **List&lt;String&gt;** | Array of strings that contains the messages which were reported along with the failed transfer attempt. |  [optional] |
|**attemptedAt** | **OffsetDateTime** | The point in time when the transfer failed. This can be provided by the integration process. |  [optional] |



