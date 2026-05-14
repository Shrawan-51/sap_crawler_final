

# SuccessorDocumentPost


## Properties

| Name | Type | Description | Notes |
|------------ | ------------- | ------------- | -------------|
|**success** | **Boolean** | Indicates whether a successor document was created successfully. Only when this flag is set to &#x60;true&#x60;, a successor document is assigned to the bill. The value &#x60;false&#x60; is currently not used and has no effect. |  |
|**successorDocumentSystem** | **String** | An identifier for the system where the successor document of the bill was created. |  [optional] |
|**successorDocumentId** | **String** | An identifier for the successor document created in the external system. The ID should be unique in the successor document system. |  [optional] |
|**successorDocumentType** | **String** | Caption for the type of document that is created, for example an invoice request. |  [optional] |
|**messages** | **List&lt;String&gt;** |  |  [optional] |



