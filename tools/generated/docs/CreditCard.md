

# CreditCard


## Properties

| Name | Type | Description | Notes |
|------------ | ------------- | ------------- | -------------|
|**token** | **String** | The unique identifier of the card token. |  [optional] |
|**type** | [**TypeEnum**](#TypeEnum) | The type text of the card. |  [optional] |
|**typeText** | [**TypeTextEnum**](#TypeTextEnum) | The type text of the card. |  [optional] |
|**expirationMonth** | **String** | The expiration month of the card. |  [optional] |
|**expirationYear** | **String** | The expiration year of the card. |  [optional] |
|**maskedCardNumber** | **String** | The masked number of the card. |  [optional] |
|**cardHolderName** | **String** | The card holder name. |  [optional] |



## Enum: TypeEnum

| Name | Value |
|---- | -----|
| DPAM | &quot;DPAM&quot; |
| DPDS | &quot;DPDS&quot; |
| DPVI | &quot;DPVI&quot; |
| DPMC | &quot;DPMC&quot; |
| DPDI | &quot;DPDI&quot; |
| DPJC | &quot;DPJC&quot; |



## Enum: TypeTextEnum

| Name | Value |
|---- | -----|
| AMERICAN_EXPRESS | &quot;AMERICAN EXPRESS&quot; |
| DISCOVER | &quot;DISCOVER&quot; |
| VISA | &quot;VISA&quot; |
| MASTERCARD | &quot;MasterCard&quot; |
| DINERS_CLUB | &quot;Diners Club&quot; |
| JCB | &quot;JCB&quot; |



