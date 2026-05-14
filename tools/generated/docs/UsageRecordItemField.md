

# UsageRecordItemField


## Properties

| Name | Type | Description | Notes |
|------------ | ------------- | ------------- | -------------|
|**fieldCode** | **String** | The code representing the pricing-relevant field. |  |
|**fieldType** | [**FieldTypeEnum**](#FieldTypeEnum) | The type of the pricing-relevant field. |  [optional] |
|**dateValue** | **LocalDate** | The date value of the pricing-relevant field. |  [optional] |
|**quantityValue** | [**UsageRecordItemFieldQuantityValue**](UsageRecordItemFieldQuantityValue.md) |  |  [optional] |
|**stringValue** | **String** | The string value of the pricing-relevant field. |  [optional] |
|**ratioValue** | [**UsageRecordItemFieldRatioValue**](UsageRecordItemFieldRatioValue.md) |  |  [optional] |



## Enum: FieldTypeEnum

| Name | Value |
|---- | -----|
| STRING | &quot;String&quot; |
| DATE | &quot;Date&quot; |
| QUANTITY | &quot;Quantity&quot; |
| RATIO | &quot;Ratio&quot; |



