## **Lesson 3** - Read side - Create a View Model to Query List Items

[\[Get the Code for This Lesson\]](https://github.com/reimagined/resolve/tree/master/examples/shopping-list-tutorial/lesson-3)

Currently, your shopping list application has a write side that allows you to create shopping lists and items in these lists. To provide the capability to obtain this data from the application, you need to implement the application's **[read side](resolve-app-structure.md#write-and-read-sides)**.

### Add a View Model

Add a **ShoppingList** **[View Model](read-side.md#view-model-specifics)** to your application. To do this, create a **shopping_list.projection.js** file in the **view-models** folder and add the following code to this file:

**common/view-models/shopping_list.projection.js:**

<!-- prettier-ignore-start -->

[embedmd]:# (../examples/shopping-list-tutorial/lesson-3/common/view-models/shopping_list.projection.js /^/ /\n$/)
```js
import { SHOPPING_LIST_CREATED, SHOPPING_ITEM_CREATED } from "../eventTypes";

export default {
  Init: () => null,
  [SHOPPING_LIST_CREATED]: (state, { aggregateId, payload: { name } }) => ({
    id: aggregateId,
    name,
    list: []
  }),
  [SHOPPING_ITEM_CREATED]: (state, { payload: { id, text } }) => ({
    ...state,
    list: [
      ...state.list,
      {
        id,
        text,
        checked: false
      }
    ]
  })
};
```

<!-- prettier-ignore-end -->

This code defines a View Model **[projection](read-side.md#updating-a-read-model-via-projection-functions)**. A View Model projection runs when the View Model receives a data query. It runs for all events with the specified aggregate IDs and builds state based on data from these event. The resulting state is then sent back as the query response.

Register the View Model in the application's configuration file as shown below.

**config.app.js:**

```js
...
viewModels: [
  {
    name: 'ShoppingList',
    projection: 'common/view-models/shopping_list.projection.js'
  }
],
...
```

### Query a View Model via HTTP API

You can now test the read side's functionality. Send an HTTP request to query the ShoppingList View Model:

```sh
$  curl -i -g -X GET "http://localhost:3000/api/query/ShoppingList/shopping-list-1"
HTTP/1.1 200 OK
X-Powered-By: Express
Content-Type: text/html; charset=utf-8
Content-Length: 50
ETag: W/"32-QoPdRfMTxfncCZnYSqRYIDifC/w"
Date: Fri, 16 Nov 2018 12:10:58 GMT
Connection: keep-alive

{
  "id": "shopping-list-1",
  "name": "List 1",
  "list": [
    {
      "id": "1",
      "text": "Milk",
      "checked": false
    },
    {
      "id": "2",
      "text": "Eggs",
      "checked": false
    },
    {
      "id": "3",
      "text": "Canned beans",
      "checked": false
    },
    {
      "id": "4",
      "text": "Paper towels",
      "checked": false
    }
  ]
}
```

The request URL has the following structure:

```
http://{host}:{port}/api/query/{viewModel}/{aggregateIds}
```

##### URL Parameters

| Name         | Description                                                                                               |
| ------------ | --------------------------------------------------------------------------------------------------------- |
| viewModel    | The View Model name as defined in **config.app.js**                                                       |
| aggregateIds | A comma-separated list of Aggregate IDs to include into the View Model. Use `*` to include all Aggregates |
