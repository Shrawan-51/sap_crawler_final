

# FailedAttemptPost


## Properties

| Name | Type | Description | Notes |
|------------ | ------------- | ------------- | -------------|
|**successorDocumentSystem** | **String** | An identifier for the system to which the transfer failed. |  [optional] |
|**successorDocumentId** | **String** | An identifier for the successor document created in the external system. The ID should be unique in the successor document system. |  [optional] |
|**successorDocumentType** | **String** | Caption for the type of document that failed to create in the successor system. |  [optional] |
|**messages** | **List&lt;String&gt;** | Array of messages that are stored with the failed attempt. The concatenated length of all lines should not exceed 255 characters or the request may be declined. |  [optional] |
|**attemptedAt** | **OffsetDateTime** | The point in time when transfer failed. |  [optional] |



