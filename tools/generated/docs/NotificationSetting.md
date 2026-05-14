

# NotificationSetting

The notification setting defines a planned notification that is sent when the configured offset is reached.

## Properties

| Name | Type | Description | Notes |
|------------ | ------------- | ------------- | -------------|
|**type** | [**TypeEnum**](#TypeEnum) | The type of the notification. |  [optional] |
|**offsetType** | [**OffsetTypeEnum**](#OffsetTypeEnum) | Defines whether the offset is before or after the notification-relevant event. |  [optional] |
|**offset** | **Integer** | The offset to the notification-relevant event in days. For example, the offset to the bill due date: in this case, if the offset type is before and the offset is 2, the notification is sent 2 days before the bill due date. |  [optional] |
|**scheduledFor** | **String** | The date when the event is scheduled to be sent. |  [optional] |
|**tags** | **List&lt;String&gt;** | The list of notification tags. |  [optional] |



## Enum: TypeEnum

| Name | Value |
|---- | -----|
| OPENED | &quot;Opened&quot; |
| DUE | &quot;Due&quot; |
| CLOSED | &quot;Closed&quot; |
| REOPENED | &quot;Reopened&quot; |
| TRANSFERRED | &quot;Transferred&quot; |



## Enum: OffsetTypeEnum

| Name | Value |
|---- | -----|
| BEFORE | &quot;before&quot; |
| AFTER | &quot;after&quot; |



