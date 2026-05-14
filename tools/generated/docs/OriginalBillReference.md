

# OriginalBillReference

In case the property `reversal` is true, the original bill reference object provides information about the location of the original charge that is reversed.

## Properties

| Name | Type | Description | Notes |
|------------ | ------------- | ------------- | -------------|
|**documentNumber** | **Long** | The document number of the referenced bill. |  [optional] |
|**billItemLineNumber** | **Integer** | The line number of the referenced bill item. A bill item line number is unique per bill. This property is only available for closed bills. |  [optional] |
|**chargeLineNumber** | **Integer** | The line number of the referenced charge. A charge line number is unique per bill item. This property is only available for closed bills. |  [optional] |



