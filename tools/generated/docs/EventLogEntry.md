

# EventLogEntry


## Properties

| Name | Type | Description | Notes |
|------------ | ------------- | ------------- | -------------|
|**id** | **UUID** | The unique identifier of the event log. |  |
|**eventType** | [**EventTypeEnum**](#EventTypeEnum) | The type of the bill event. |  |
|**triggeredAt** | **OffsetDateTime** | The date and time when the event was triggered. |  |
|**sendingStatus** | [**SendingStatusEnum**](#SendingStatusEnum) | The status of event processing by SAP Event Mesh. |  |
|**tags** | **List&lt;String&gt;** | List of notification tags. |  [optional] |



## Enum: EventTypeEnum

| Name | Value |
|---- | -----|
| OPENED | &quot;opened&quot; |
| DUE | &quot;due&quot; |
| CLOSED | &quot;closed&quot; |
| CLOSINGFAILED | &quot;closingFailed&quot; |
| REOPENED | &quot;reopened&quot; |
| TRANSFERINPROGRESS | &quot;transferInProgress&quot; |
| TRANSFERRED | &quot;transferred&quot; |
| TRANSFERFAILED | &quot;transferFailed&quot; |
| OPENEDNOTIFICATION | &quot;openedNotification&quot; |
| DUENOTIFICATION | &quot;dueNotification&quot; |
| CLOSEDNOTIFICATION | &quot;closedNotification&quot; |
| REOPENEDNOTIFICATION | &quot;reopenedNotification&quot; |
| TRANSFERREDNOTIFICATION | &quot;transferredNotification&quot; |



## Enum: SendingStatusEnum

| Name | Value |
|---- | -----|
| INITIATED | &quot;Initiated&quot; |
| SUCCESSFUL | &quot;Successful&quot; |
| FAILED | &quot;Failed&quot; |
| DEACTIVATED | &quot;Deactivated&quot; |
| NOTRELEVANT | &quot;NotRelevant&quot; |



