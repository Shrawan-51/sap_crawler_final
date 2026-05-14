

# AggregationPeriod

The period for which charged quantities for the subscription are aggregated. The period comprises one or multiple billing periods and follows the aggregation cycle defined in the rate plan template. Currently the period is represented in whole calendar days.

## Properties

| Name | Type | Description | Notes |
|------------ | ------------- | ------------- | -------------|
|**start** | **OffsetDateTime** | The start of the aggregation period, inclusive, given as a UTC-based, ISO 8601 compatible timestamp. Currently it is defined as the start of a day in the time zone of the subscription. |  |
|**end** | **OffsetDateTime** | The end of the aggregation period, exclusive, given as a UTC-based, ISO 8601 compatible timestamp. Currently, it is defined as the start of the first day after the aggregation period in the time zone of the subscription. |  |



