

# RatingPeriod

The period for which a charge is calculated and billed. Currently the period is represented as a multiple of calender days. Future functionality in SAP Subscription Billing may also introduce periods that begin and end at a time other than the start of a day in the subscription time zone.

## Properties

| Name | Type | Description | Notes |
|------------ | ------------- | ------------- | -------------|
|**start** | **OffsetDateTime** | The start of the rating period, inclusive, given as a UTC-based, ISO 8601 compatible timestamp. Currently it is defined as the start of a day in the time zone of the subscription. Future functionality in SAP Subscription Billing may also lead to a starting point other than the start of the day. |  |
|**end** | **OffsetDateTime** | The end of the rating period, exclusive, given as a UTC-based, ISO 8601 compatible timestamp. Not present for one-time charges. Currently, it is defined as the start of the first day after the rating period in the time zone of the subscription. Future functionality in SAP Subscription Billing may also lead to an period end at a different time of day. |  [optional] |



