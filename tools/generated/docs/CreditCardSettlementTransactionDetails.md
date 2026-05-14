

# CreditCardSettlementTransactionDetails


## Properties

| Name | Type | Description | Notes |
|------------ | ------------- | ------------- | -------------|
|**status** | [**StatusEnum**](#StatusEnum) |  |  [optional] |
|**transactionId** | **String** | The unique request transaction ID in SAP digital payments add-on. |  [optional] |
|**providerId** | **String** | The ID that can be used to identify the request at the Payment Service Provider. |  [optional] |
|**merchant** | **String** | The merchant name. |  [optional] |
|**paymentDateTime** | **String** | The timestamp (UTC) when the transaction was processed in SAP digital payments add-on. |  [optional] |
|**amount** | [**MonetaryAmount**](MonetaryAmount.md) |  |  [optional] |



## Enum: StatusEnum

| Name | Value |
|---- | -----|
| SUCCESS | &quot;SUCCESS&quot; |
| FAILED | &quot;FAILED&quot; |



