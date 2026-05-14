

# Payment


## Properties

| Name | Type | Description | Notes |
|------------ | ------------- | ------------- | -------------|
|**method** | [**MethodEnum**](#MethodEnum) | The payment method. |  [optional] |
|**token** | **String** | The payment card token. |  [optional] |
|**paymentStatus** | [**PaymentStatusEnum**](#PaymentStatusEnum) | The overall payment status for all credit card settlements of the bill. |  [optional] |
|**creditCardSettlements** | [**CreditCardSettlements**](CreditCardSettlements.md) |  |  [optional] |



## Enum: MethodEnum

| Name | Value |
|---- | -----|
| INVOICE | &quot;Invoice&quot; |
| PAYMENT_CARD | &quot;Payment Card&quot; |
| EXTERNAL_CARD | &quot;External Card&quot; |
| UNKNOWN | &quot;Unknown&quot; |



## Enum: PaymentStatusEnum

| Name | Value |
|---- | -----|
| UNKNOWN | &quot;UNKNOWN&quot; |
| NOT_SETTLED | &quot;NOT_SETTLED&quot; |
| SUCCESS | &quot;SUCCESS&quot; |
| FAILED | &quot;FAILED&quot; |
| ERROR | &quot;ERROR&quot; |



