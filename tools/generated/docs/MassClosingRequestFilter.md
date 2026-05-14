

# MassClosingRequestFilter

The filter for the mass closing request.

## Properties

| Name | Type | Description | Notes |
|------------ | ------------- | ------------- | -------------|
|**billIds** | **List&lt;String&gt;** | A list of IDs of the bills that you want to close. |  [optional] |
|**subscriptionId** | **String** | The ID of the subscription for which you want to close bills. |  [optional] |
|**customerNumber** | **String** | The number of the customer for which you want to close bills. |  [optional] |
|**latestClosingAttemptSuccessful** | **Boolean** | Indicates whether you want to close bills for which the latest closing attempt was successful. Set &#x60;false&#x60; if you want to close bills for which the latest closing attempt failed. |  [optional] |
|**closingMethod** | [**ClosingMethodEnum**](#ClosingMethodEnum) | The closing method of the bill that you want to close. |  [optional] |



## Enum: ClosingMethodEnum

| Name | Value |
|---- | -----|
| AUTO | &quot;AUTO&quot; |
| MANUAL | &quot;MANUAL&quot; |



