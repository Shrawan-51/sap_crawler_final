

# UsageRecord

The schema of a usage record.

## Properties

| Name | Type | Description | Notes |
|------------ | ------------- | ------------- | -------------|
|**id** | **String** | The unique identifier of this usage record. The service generates the identifier, which is ignored if it is provided during the creation of the usage record. |  [optional] |
|**startedAt** | **OffsetDateTime** | The start date (inclusive) of the aggregation period for the quantity of usage. This date is expressed in the UTC time zone with the following pattern: yyyy-MM-DDThh:mm:ss.SSSZ. |  |
|**endedAt** | **OffsetDateTime** | The end date (exclusive) of the aggregation period for the quantity of usage. This date is expressed in the UTC time zone with the following pattern: yyyy-MM-DDThh:mm:ss.SSSZ. |  |
|**metricId** | **String** | The type of the technical resource. |  |
|**subMetricId** | **String** | The unique identifier of the rate subelement. |  [optional] |
|**customKey** | **String** | One of the key attributes used to identity a unique usage record. |  [optional] |
|**quantity** | **BigDecimal** | The number of units of usage, that is expressed by 0 or a positive number with up to 3 decimals. |  |
|**usageRatingVariant** | [**UsageRatingVariantEnum**](#UsageRatingVariantEnum) | The rating variant of the usage record. |  [optional] |
|**userTechnicalId** | **String** | The identifier of the technical resource. |  |
|**discarded** | **Boolean** | Indicates whether the usage record is discarded or not. |  [optional] |
|**createdAt** | **OffsetDateTime** | The creation date of the usage record. This date is expressed in the UTC time zone with the following pattern: yyyy-MM-DDThh:mm:ss.SSSZ. |  [optional] |
|**subscriptionNumber** | **Long** | The number of the subscription this usage record was applied to. |  [optional] |
|**subscriptionDocumentId** | **String** | The document identifier of the subscription. The document ID consists of a prefix, if configured in the subscription profile, and of a subscription number. |  [optional] |
|**items** | [**List&lt;UsageRecordItem&gt;**](UsageRecordItem.md) |  |  [optional] |
|**customReferences** | [**List&lt;CustomReference&gt;**](CustomReference.md) |  |  [optional] |



## Enum: UsageRatingVariantEnum

| Name | Value |
|---- | -----|
| AGGREGATED | &quot;aggregated&quot; |
| INDIVIDUAL | &quot;individual&quot; |



