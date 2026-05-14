

# Subscription


## Properties

| Name | Type | Description | Notes |
|------------ | ------------- | ------------- | -------------|
|**id** | **String** |  |  |
|**subscriptionDocumentId** | **String** | The document identifier of the subscription. The document ID consists of a prefix, if configured in the subscription profile, and of a subscription number |  [optional] |
|**documentNumber** | **Long** |  |  |
|**itemId** | **String** |  |  [optional] |
|**validFrom** | **OffsetDateTime** | The start date of the subscription. The value is filled at the latest when the bill is closed, and is immutable after bill closing. If the value is null, it is not returned. |  [optional] |
|**validUntil** | **OffsetDateTime** | The expiration date of the subscription. The value is filled at the latest when the bill is closed, and is immutable after bill closing. If the value is null, it is not returned. &lt;br&gt;Note: For bills that existed before this property was introduced, the value is derived from the current validity period of the subscription and is updated if necessary even after the bill is closed. Therefore, such bills might not have exact expiration date when they are closed. |  [optional] |



